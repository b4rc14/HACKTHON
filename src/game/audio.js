// Audio sencillo con Web Audio API. No hay archivos de sonido externos.
// Todas las funciones fallan en silencio si el navegador no soporta AudioContext.

let context = null;
let master = null;
let muted = false;

const ensureContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!context) {
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = muted ? 0 : 0.22;
    master.connect(context.destination);
  }
  if (context.state === 'suspended') {
    context.resume().catch(() => {});
  }
  return context;
};

export const setMuted = (value) => {
  muted = Boolean(value);
  if (master && context) {
    master.gain.setTargetAtTime(muted ? 0 : 0.22, context.currentTime, 0.02);
  }
};

export const isMuted = () => muted;

const tone = ({
  freq = 440,
  at = 0,
  duration = 0.2,
  type = 'sine',
  volume = 0.2,
  slideTo = null,
  delay = 0,
}) => {
  const ctx = ensureContext();
  if (!ctx || !master) return;
  const now = ctx.currentTime + delay + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + duration + 0.03);
};

const noise = ({ duration = 0.4, volume = 0.18, filter = 1200, delay = 0 }) => {
  const ctx = ensureContext();
  if (!ctx || !master) return;
  const now = ctx.currentTime + delay;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const biquad = ctx.createBiquadFilter();
  biquad.type = 'lowpass';
  biquad.frequency.value = filter;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(biquad);
  biquad.connect(gain);
  gain.connect(master);
  source.start(now);
  source.stop(now + duration);
};

const romanticChord = () => {
  [261.63, 329.63, 392, 523.25].forEach((freq, index) => {
    tone({
      freq,
      type: 'triangle',
      duration: 0.7,
      volume: 0.09,
      delay: index * 0.07,
    });
  });
};

const comicTuba = () => {
  tone({ freq: 98, type: 'sawtooth', duration: 0.18, volume: 0.16 });
  tone({ freq: 82, type: 'sawtooth', duration: 0.2, volume: 0.15, delay: 0.16 });
  tone({ freq: 110, type: 'square', duration: 0.14, volume: 0.1, delay: 0.32 });
};

const spaceSound = () => {
  tone({ freq: 180, slideTo: 880, type: 'sine', duration: 0.7, volume: 0.12 });
  tone({ freq: 1200, slideTo: 300, type: 'sine', duration: 0.6, volume: 0.05, delay: 0.2 });
  noise({ duration: 0.5, volume: 0.035, filter: 700, delay: 0.1 });
};

export const playCue = (type) => {
  if (!type) return;
  try {
    const ctx = ensureContext();
    if (!ctx) return;
    switch (type) {
      case 'click':
        tone({ freq: 520, type: 'square', duration: 0.06, volume: 0.045 });
        break;
      case 'select-light':
        tone({ freq: 660, type: 'sine', duration: 0.14, volume: 0.07 });
        tone({ freq: 880, type: 'sine', duration: 0.16, volume: 0.05, delay: 0.06 });
        break;
      case 'select-sound':
        tone({ freq: 392, type: 'triangle', duration: 0.2, volume: 0.07 });
        break;
      case 'select-object':
        tone({ freq: 300, type: 'square', duration: 0.12, volume: 0.055 });
        break;
      case 'curtain':
        noise({ duration: 1.1, volume: 0.1, filter: 500 });
        tone({ freq: 70, slideTo: 45, type: 'sawtooth', duration: 0.8, volume: 0.07 });
        break;
      case 'curtain-open':
        [220, 277, 330, 440].forEach((freq, index) =>
          tone({
            freq,
            type: 'triangle',
            duration: 0.35,
            volume: 0.06,
            delay: index * 0.09,
          }),
        );
        break;
      case 'theme-romance':
        romanticChord();
        break;
      case 'theme-comedy':
        comicTuba();
        break;
      case 'theme-scifi':
        spaceSound();
        break;
      case 'explosion':
        noise({ duration: 1.2, volume: 0.32, filter: 900 });
        tone({ freq: 100, slideTo: 30, type: 'sawtooth', duration: 0.9, volume: 0.18 });
        break;
      case 'alarm':
        [0, 0.28, 0.56].forEach((delay) =>
          tone({ freq: 880, type: 'square', duration: 0.16, volume: 0.07, delay }),
        );
        break;
      case 'applause':
        noise({ duration: 1.25, volume: 0.14, filter: 2600 });
        noise({ duration: 0.9, volume: 0.08, filter: 1600, delay: 0.12 });
        [523, 659, 784].forEach((freq, index) =>
          tone({
            freq,
            type: 'triangle',
            duration: 0.45,
            volume: 0.05,
            delay: 0.1 + index * 0.08,
          }),
        );
        break;
      case 'applause-soft':
        noise({ duration: 0.65, volume: 0.08, filter: 1800 });
        break;
      case 'ovation':
        noise({ duration: 1.8, volume: 0.18, filter: 3000 });
        [392, 523, 659, 784, 1046].forEach((freq, index) =>
          tone({
            freq,
            type: 'triangle',
            duration: 0.5,
            volume: 0.06,
            delay: 0.05 + index * 0.07,
          }),
        );
        break;
      case 'boo':
        tone({ freq: 170, slideTo: 75, type: 'sawtooth', duration: 0.8, volume: 0.12 });
        noise({ duration: 0.7, volume: 0.06, filter: 500 });
        break;
      case 'tomato':
        tone({ freq: 160, slideTo: 50, type: 'square', duration: 0.18, volume: 0.14 });
        noise({ duration: 0.22, volume: 0.1, filter: 800, delay: 0.02 });
        break;
      default:
        tone({ freq: 440, type: 'sine', duration: 0.12, volume: 0.04 });
    }
  } catch {
    // Audio es opcional: nunca debe romper la partida.
  }
};

export const previewControl = (kind, control) => {
  if (!control) return;
  if (kind === 'lighting') {
    playCue(control.genre === 'romance' ? 'theme-romance' : control.genre === 'scifi' ? 'select-light' : 'select-light');
  } else if (kind === 'sound') {
    playCue(control.id === 'romantic' ? 'theme-romance' : control.id === 'space' ? 'theme-scifi' : 'theme-comedy');
  } else {
    playCue('select-object');
  }
};

export const stopAll = () => {
  if (context && master) {
    master.gain.setTargetAtTime(0, context.currentTime, 0.05);
    setTimeout(() => {
      if (master && context) master.gain.setTargetAtTime(0.22, context.currentTime, 0.05);
    }, 300);
  }
};
