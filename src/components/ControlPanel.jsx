import React from 'react';
import { CONTROLS, GENRES, getControlDef } from '../game/storyData.js';

const inferInclination = (selections, fallback) => {
  const totals = { romance: 0, comedy: 0, scifi: 0 };
  ['lighting', 'sound', 'object'].forEach((kind) => {
    const control = getControlDef(kind, selections?.[kind]);
    if (!control) return;
    Object.entries(control.genres).forEach(([genre, points]) => {
      totals[genre] += points;
    });
  });
  const entries = Object.entries(totals);
  const max = Math.max(...entries.map(([, value]) => value));
  if (max === 0) return { genre: fallback, totals };
  const genre = entries.find(([, value]) => value === max)?.[0] || fallback;
  return { genre, totals };
};

const TIMER_RADIUS = 27;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

const SLOT_LABEL = { lighting: 'Luz', sound: 'Sonido', object: 'Objeto' };

const shortName = (label = '') => label.split(' ')[0];

function DeskHead({ label, meta, active }) {
  return (
    <div className="desk-head">
      <span className="desk-head__label">
        <i className={`desk-led ${active ? 'is-on' : ''}`} aria-hidden="true" />
        {label}
      </span>
      {meta ? <span className="desk-head__meta">{meta}</span> : null}
    </div>
  );
}

function Fader({
  label,
  meta,
  value,
  min = 0,
  max = 100,
  step = 1,
  readout,
  isOn = false,
  isPrimary = false,
  disabled = false,
  onChange,
  ariaLabel,
}) {
  return (
    <div className={`desk-fader ${isOn ? 'is-on' : ''} ${isPrimary ? 'is-primary' : ''} ${disabled ? 'is-disabled' : ''}`}>
      <div className="desk-fader__lane">
        <input
          type="range"
          className="desk-fader__input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          disabled={disabled}
          aria-label={ariaLabel || label}
        />
      </div>
      <span className="desk-fader__readout">{readout}</span>
      <span className="desk-fader__name" title={label}>{label}</span>
      <span className="desk-fader__meta">{meta}</span>
    </div>
  );
}

function DeskKey({ icon, label, shortcut, on, onClick, disabled, title }) {
  return (
    <button
      type="button"
      className={`desk-key ${on ? 'is-on' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      title={title || label}
    >
      <em aria-hidden="true">{icon}</em>
      <span>{label}</span>
      {shortcut ? <b aria-hidden="true">{shortcut}</b> : null}
    </button>
  );
}

export default function ControlPanel({
  selections,
  onSelect,
  onPreview,
  onLightLevel,
  onClear,
  active,
  phase,
  fallbackGenre,
  timer,
  timerMax,
  graceMs,
  lightMix,
  primaryLight,
  masterVolume,
  onMasterVolume,
  fxVolume,
  onFxVolume,
  children,
}) {
  const selectedCount = ['lighting', 'sound', 'object'].filter(
    (kind) => selections?.[kind],
  ).length;
  const complete = selectedCount === 3;
  const inclination = inferInclination(selections, fallbackGenre);
  const inclinationMeta = GENRES[inclination.genre];
  const comboKey = ['lighting', 'sound', 'object']
    .map((kind) => selections?.[kind] || '-')
    .join('|');

  const showTime = ['incident', 'crisis'].includes(phase);
  const timerPercent = timerMax > 0
    ? Math.max(0, Math.min(100, (timer / timerMax) * 100))
    : 0;
  const ringPercent = showTime ? timerPercent : 100;
  const urgent = showTime && timer <= 5;
  const graceSeconds = Math.max(1, Math.round((graceMs || 0) / 1000));

  const masterPercent = Math.round((masterVolume || 0) * 100);
  const fxPercent = Math.round((fxVolume || 0) * 100);
  const mixCount = Object.values(lightMix || {}).filter((value) => value > 0).length;

  const selectSound = (control) => {
    if (!active) return;
    onPreview?.('sound', control);
    onSelect('sound', control.id);
  };

  const selectObject = (control) => {
    if (!active) return;
    onPreview?.('object', control);
    onSelect('object', control.id);
  };

  return (
    <section
      className={`control-desk ${active ? 'is-live' : 'is-locked'}`}
      aria-label="Cabina técnica"
    >
      <div className="desk-grid">
        <section className="desk-bay desk-bay--lights">
          <DeskHead
            label="ILUMINACIÓN"
            meta="CANALES 1–3"
            active={active && mixCount > 0}
          />
          <div className="desk-faders desk-faders--lights">
            {CONTROLS.lighting.map((control, index) => {
              const level = lightMix?.[control.id] || 0;
              const isOn = level > 0;
              const isPrimary = control.id === primaryLight;
              return (
                <Fader
                  key={control.id}
                  label={control.label}
                  meta={`${GENRES[control.genre].short} · ${index + 1}`}
                  min={0}
                  value={level}
                  readout={isOn ? `${level}%` : '—'}
                  isOn={isOn}
                  isPrimary={isPrimary}
                  disabled={!active}
                  onChange={(value) => onLightLevel?.(control.id, value)}
                  ariaLabel={`Intensidad de ${control.label}`}
                />
              );
            })}
          </div>
        </section>

        <section className="desk-bay desk-bay--monitor">
          <DeskHead
            label="MONITOR DE ESCENA"
            meta={showTime ? `${timer} S` : '—'}
            active={active}
          />
          <div className="desk-monitor">
            <div
              className={`panel-timer ${urgent ? 'is-urgent' : ''}`}
              role="timer"
              aria-label={showTime ? `${timer} segundos restantes` : 'Tiempo detenido'}
            >
              <svg className="panel-timer__dial" viewBox="0 0 64 64" aria-hidden="true">
                <circle className="panel-timer__track" cx="32" cy="32" r={TIMER_RADIUS} />
                <circle
                  className="panel-timer__progress"
                  cx="32"
                  cy="32"
                  r={TIMER_RADIUS}
                  strokeDasharray={TIMER_CIRCUMFERENCE}
                  strokeDashoffset={TIMER_CIRCUMFERENCE * (1 - ringPercent / 100)}
                />
              </svg>
              <span className="panel-timer__value">
                {showTime ? timer : '—'}
                {showTime ? <small>s</small> : null}
              </span>
            </div>

            <div className="desk-vu">
              {Object.entries(inclination.totals).map(([genre, value]) => (
                <span
                  key={genre}
                  className={`inclination-channel ${genre === inclination.genre ? 'is-dominant' : ''}`}
                >
                  <small>{GENRES[genre].short}</small>
                  <span className="inclination-bar">
                    <i style={{ width: `${Math.min(100, value * 8)}%` }} />
                  </span>
                  <b>{String(value).padStart(2, '0')}</b>
                </span>
              ))}
              <span className="desk-genre">
                <span aria-hidden="true">{inclinationMeta.icon}</span> {inclinationMeta.upper}
              </span>
            </div>
          </div>

          <div className="desk-objects">
            <span className="desk-sub">OBJETOS</span>
            <div className="desk-keys desk-keys--objects">
              {CONTROLS.object.map((control, index) => (
                <DeskKey
                  key={control.id}
                  icon={control.icon}
                  label={shortName(control.label)}
                  title={control.label}
                  shortcut={7 + index}
                  on={selections?.object === control.id}
                  onClick={() => selectObject(control)}
                  disabled={!active}
                />
              ))}
            </div>
          </div>

          <div className={`combo-slots ${complete ? 'is-armed' : ''}`}>
            <span className="combo-slots__label">
              COMBO <b>{selectedCount}/3</b>
            </span>
            {mixCount > 1 ? <span className="mix-badge">MIX {mixCount}</span> : null}
            {['lighting', 'sound', 'object'].map((kind) => {
              const control = getControlDef(kind, selections?.[kind]);
              return (
                <span key={kind} className={`combo-slot ${control ? 'is-filled' : ''}`}>
                  <b>{control?.icon || '◇'}</b>
                  <small>{control?.label || SLOT_LABEL[kind]}</small>
                </span>
              );
            })}
            {selectedCount > 0 ? (
              <button type="button" className="text-button" onClick={onClear} disabled={!active}>
                limpiar
              </button>
            ) : null}
          </div>

          <div className={`combo-grace ${active && complete ? 'is-armed' : ''}`} aria-live="polite">
            {active && complete ? (
              <span className="combo-grace__armed" key={comboKey}>
                <span className="combo-grace__label">
                  <i aria-hidden="true" />
                  Improvisando en {graceSeconds} s
                </span>
                <span
                  className="combo-grace__bar"
                  style={{ '--grace-ms': `${graceMs || 2000}ms` }}
                  aria-hidden="true"
                />
              </span>
            ) : active ? (
              <span className="combo-grace__hint">
                Conecta luz + sonido + objeto para improvisar.
              </span>
            ) : null}
          </div>
        </section>

        <section className="desk-bay desk-bay--sound">
          <DeskHead label="SONIDO" meta="CANALES 4–6" active={active} />
          <div className="desk-keys desk-keys--sound">
            {CONTROLS.sound.map((control, index) => (
              <DeskKey
                key={control.id}
                icon={control.icon}
                label={shortName(control.label)}
                title={control.label}
                shortcut={4 + index}
                on={selections?.sound === control.id}
                onClick={() => selectSound(control)}
                disabled={!active}
              />
            ))}
          </div>
          <div className="desk-faders desk-faders--volume">
            <Fader
              label="VOL"
              meta="MASTER"
              value={masterPercent}
              readout={`${masterPercent}%`}
              isOn
              onChange={(value) => onMasterVolume?.(value / 100)}
              ariaLabel="Volumen general"
            />
            <Fader
              label="FX"
              meta="EFECTOS"
              value={fxPercent}
              readout={`${fxPercent}%`}
              onChange={(value) => onFxVolume?.(value / 100)}
              ariaLabel="Volumen de efectos"
            />
          </div>
        </section>

        <section className="desk-bay desk-bay--protocols">
          {children || (
            <>
              <DeskHead label="CONTROL DE SALA" meta="EN ESPERA" />
              <p className="desk-empty">
                Los protocolos se activan cuando sube el telón.
              </p>
            </>
          )}
        </section>
      </div>

      <div className="desk-foot">
        <span className="desk-brand">
          <i className="desk-disc" aria-hidden="true">✶</i>
          MESA CAB-03 · 220V · NO MOJAR
        </span>
        <span><b>{active ? 'EN ESCENA' : 'ENTRE ACTOS'}</b> · TELÓN {active ? 'LEVANTADO' : 'CERRADO'}</span>
        <span>1–9 ELEGIR · 3/3 → 2 S</span>
      </div>
    </section>
  );
}
