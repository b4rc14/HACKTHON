// Audio sencillo con Web Audio API. No hay archivos de sonido externos.
// Todas las funciones fallan en silencio si el navegador no soporta AudioContext.

let context = null;
let master = null;
let fxBus = null;
let muted = false;
let ambience = null;
let soundIntensity = 0.68;
let volume = 0.55;
let fxLevel = 0.85;

const MAX_GAIN = 0.4;
const masterLevel = () =>
  MAX_GAIN * volume * (0.2 + Math.max(0, Math.min(1, soundIntensity)) * 0.8);

const ensureContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!context) {
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = muted ? 0 : masterLevel();
    master.connect(context.destination);
    fxBus = context.createGain();
    fxBus.gain.value = fxLevel;
    fxBus.connect(master);
  }
  if (context.state === 'suspended') {
    context.resume().catch(() => {});
  }
  return context;
};

export const setMuted = (value) => {
  muted = Boolean(value);
  if (master && context) {
    master.gain.setTargetAtTime(muted ? 0 : masterLevel(), context.currentTime, 0.02);
  }
};

export const setVolume = (value) => {
  const next = Number(value);
  if (Number.isFinite(next)) volume = Math.max(0, Math.min(1, next));
  if (master && context && !muted) {
    master.gain.setTargetAtTime(masterLevel(), context.currentTime, 0.03);
  }
};

export const setFxVolume = (value) => {
  const next = Number(value);
  if (Number.isFinite(next)) fxLevel = Math.max(0, Math.min(1, next));
  if (fxBus && context) {
    fxBus.gain.setTargetAtTime(fxLevel, context.currentTime, 0.03);
  }
};

export const setSoundIntensity = (value) => {
  soundIntensity = Math.max(0, Math.min(1, Number(value) / 100));
  if (master && context && !muted) {
    master.gain.setTargetAtTime(masterLevel(), context.currentTime, 0.12);
  }
};

export const speakHeckle = (text) => {
  if (muted || !text || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices?.() || [];
    const spanish = voices.find((voice) => voice.lang?.toLowerCase().startsWith('es'));
    if (spanish) utterance.voice = spanish;
    utterance.lang = 'es-ES';
    utterance.pitch = 0.72;
    utterance.rate = 0.92;
    utterance.volume = Math.min(0.8, 0.32 + soundIntensity * 0.35);
    window.speechSynthesis.speak(utterance);
  } catch {
    // Voz opcional: el juego continúa sin ella.
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
  gain.connect(fxBus || master);
  osc.start(now);
  osc.stop(now + duration + 0.03);
};

const noise = ({ duration = 0.4, volume = 0.18, filter = 1200, delay = 0, pan = 0 }) => {
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
  if (pan && ctx.createStereoPanner) {
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    gain.connect(panner);
    panner.connect(fxBus || master);
  } else {
    gain.connect(fxBus || master);
  }
  source.start(now);
  source.stop(now + duration);
};

const shout = ({ delay = 0, pan = 0, pitch = 1, volume = 0.045 } = {}) => {
  const ctx = ensureContext();
  if (!ctx || !master) return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(190 * pitch, now);
  osc.frequency.exponentialRampToValueAtTime(115 * pitch, now + 0.34);
  filter.type = 'bandpass';
  filter.frequency.value = 720 * pitch;
  filter.Q.value = 2.4;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  osc.connect(filter);
  filter.connect(gain);
  if (panner) {
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    gain.connect(panner);
    panner.connect(fxBus || master);
  } else {
    gain.connect(fxBus || master);
  }
  osc.start(now);
  osc.stop(now + 0.43);
  noise({ duration: 0.28, volume: volume * 0.55, filter: 1300, delay, pan });
};

export const startCrowdAmbience = () => {
  try {
    const ctx = ensureContext();
    if (!ctx || !master || ambience) return;
    const frames = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < frames; i += 1) {
      previous = previous * 0.96 + (Math.random() * 2 - 1) * 0.04;
      data[i] = previous;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();
    ambience = { source, filter, gain };
  } catch {
    // ambiente opcional
  }
};

export const setCrowdLevel = ({ intensity = 1, brightness = 1 } = {}) => {
  if (!ambience || !context) return;
  const now = context.currentTime;
  ambience.gain.gain.setTargetAtTime(0.018 + 0.04 * Math.max(0, Math.min(1, intensity)), now, 0.8);
  ambience.filter.frequency.setTargetAtTime(320 + 420 * Math.max(0, Math.min(1, brightness)), now, 0.8);
};

export const stopCrowdAmbience = () => {
  if (!ambience || !context) return;
  try {
    ambience.source.stop();
    ambience.source.disconnect();
    ambience.filter.disconnect();
    ambience.gain.disconnect();
  } catch {
    // ya estaba parado
  }
  ambience = null;
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
        shout({ delay: 0.18, pan: -0.6, pitch: 1.25, volume: 0.025 });
        shout({ delay: 0.48, pan: 0.42, pitch: 1.5, volume: 0.02 });
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
        shout({ delay: 0.15, pan: -0.7, pitch: 1.35, volume: 0.03 });
        shout({ delay: 0.55, pan: 0.55, pitch: 1.05, volume: 0.025 });
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
        shout({ delay: 0.05, pan: -0.75, pitch: 0.8, volume: 0.05 });
        shout({ delay: 0.42, pan: 0.58, pitch: 0.95, volume: 0.045 });
        break;
      case 'tomato':
        tone({ freq: 160, slideTo: 50, type: 'square', duration: 0.18, volume: 0.14 });
        noise({ duration: 0.22, volume: 0.1, filter: 800, delay: 0.02 });
        shout({ delay: 0.04, pan: -0.4, pitch: 1.1, volume: 0.04 });
        shout({ delay: 0.22, pan: 0.7, pitch: 1.35, volume: 0.035 });
        break;
      case 'gasp':
        noise({ duration: 0.35, volume: 0.08, filter: 2100, pan: -0.2 });
        tone({ freq: 520, slideTo: 290, type: 'sine', duration: 0.22, volume: 0.035 });
        break;
      case 'glass':
        tone({ freq: 1800 + Math.random() * 500, type: 'sine', duration: 0.12, volume: 0.05 });
        tone({ freq: 2600 + Math.random() * 400, type: 'sine', duration: 0.08, volume: 0.028, delay: 0.035 });
        noise({ duration: 0.14, volume: 0.04, filter: 6200 });
        break;
      case 'spark':
        noise({ duration: 0.12, volume: 0.12, filter: 5200 });
        tone({ freq: 1300, slideTo: 240, type: 'sawtooth', duration: 0.13, volume: 0.035 });
        break;
      case 'cluck':
        tone({ freq: 640, slideTo: 880, type: 'square', duration: 0.08, volume: 0.035 });
        tone({ freq: 520, slideTo: 760, type: 'square', duration: 0.07, volume: 0.028, delay: 0.12 });
        break;
      case 'shock':
        noise({ duration: 0.18, volume: 0.12, filter: 900 });
        tone({ freq: 95, slideTo: 40, type: 'sawtooth', duration: 0.25, volume: 0.1 });
        break;
      case 'chair':
        tone({ freq: 210, slideTo: 125, type: 'sawtooth', duration: 0.32, volume: 0.025 });
        noise({ duration: 0.2, volume: 0.025, filter: 400, delay: 0.05 });
        break;
      case 'walkout':
        noise({ duration: 0.55, volume: 0.04, filter: 450, pan: 0.5 });
        tone({ freq: 210, slideTo: 125, type: 'sawtooth', duration: 0.32, volume: 0.025 });
        [0.15, 0.42, 0.7, 1.02].forEach((delay, index) => {
          tone({ freq: 75 - index * 4, slideTo: 42, type: 'sine', duration: 0.13, volume: 0.055, delay });
          noise({ duration: 0.07, volume: 0.03, filter: 280, delay, pan: 0.35 });
        });
        tone({ freq: 115, slideTo: 55, type: 'sawtooth', duration: 0.5, volume: 0.04, delay: 0.95 });
        noise({ duration: 0.24, volume: 0.045, filter: 380, delay: 1.16 });
        shout({ delay: 0.2, pan: 0.7, pitch: 0.85, volume: 0.025 });
        break;
      case 'protest':
        noise({ duration: 1.4, volume: 0.1, filter: 1700 });
        [0.05, 0.3, 0.62].forEach((delay, index) =>
          shout({ delay, pan: index % 2 ? 0.7 : -0.65, pitch: 0.9 + index * 0.12, volume: 0.035 }),
        );
        [0.2, 0.44, 0.68].forEach((delay) =>
          tone({ freq: 80, slideTo: 45, type: 'sine', duration: 0.15, volume: 0.05, delay }),
        );
        break;
      case 'footsteps':
        [0, 0.23, 0.47].forEach((delay, index) => {
          tone({ freq: 70 - index * 5, slideTo: 42, type: 'sine', duration: 0.14, volume: 0.06, delay });
          noise({ duration: 0.08, volume: 0.035, filter: 300, delay });
        });
        break;
      case 'door':
        tone({ freq: 115, slideTo: 60, type: 'sawtooth', duration: 0.5, volume: 0.045 });
        noise({ duration: 0.3, volume: 0.05, filter: 420, delay: 0.18 });
        break;
      case 'crowd-shout':
        shout({ pan: -0.6, pitch: 0.9, volume: 0.045 });
        shout({ delay: 0.18, pan: 0.45, pitch: 1.15, volume: 0.04 });
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
