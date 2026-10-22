import React from 'react';
import CabinMonitor from './CabinMonitor.jsx';
import DeskStatus from './DeskStatus.jsx';
import {
  CONTROL_GROUPS,
  CONTROLS,
  GENRES,
  getControlDef,
} from '../game/storyData.js';

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
  return { genre: entries.find(([, value]) => value === max)?.[0] || fallback, totals };
};

function IntensityFader({ label, value, onChange, tone, disabled }) {
  return (
    <label className="desk-fader" style={{ '--tone': tone }}>
      <span className="desk-fader__label">INTENSIDAD</span>
      <span className="desk-fader__track">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={`Intensidad de ${label.toLowerCase()}`}
          disabled={disabled}
        />
      </span>
      <b>{value}%</b>
    </label>
  );
}

function OptionButton({ kind, control, selected, active, onSelect, onPreview }) {
  const tone = GENRES[control.genre];
  return (
    <button
      type="button"
      className={`desk-option desk-option--${control.genre} ${selected ? 'is-selected' : ''}`}
      style={{ '--tone': tone.color }}
      onClick={() => {
        if (!active) return;
        onPreview?.(kind, control);
        onSelect(kind, control.id);
      }}
      disabled={!active}
      aria-pressed={selected}
      title={control.description}
    >
      <span className="desk-option__icon" aria-hidden="true">{control.icon}</span>
      <span className="desk-option__copy">
        <b>{control.label}</b>
        <small>{control.sublabel}</small>
      </span>
      <span className="desk-option__genre">{tone.short}</span>
    </button>
  );
}

export default function ControlPanel({
  state,
  selections,
  onSelect,
  onPreview,
  onExecute,
  onClear,
  active,
  phase,
  fallbackGenre,
  timer,
  incident,
  audience,
  stats,
  lastReaction,
  stage,
  intensities = { lightIntensity: 76, soundIntensity: 68 },
  onIntensityChange = () => {},
}) {
  const selectedCount = ['lighting', 'sound', 'object'].filter(
    (kind) => selections?.[kind],
  ).length;
  const complete = selectedCount === 3;
  const inclination = inferInclination(selections, fallbackGenre);
  const inclinationMeta = GENRES[inclination.genre];
  const eventActive = Boolean(stage?.activeEvent);
  const selectedLight = getControlDef('lighting', selections?.lighting);
  const selectedSound = getControlDef('sound', selections?.sound);
  const selectedObject = getControlDef('object', selections?.object);

  return (
    <section
      className={`control-panel operator-desk ${active ? '' : 'operator-desk--locked'} ${eventActive ? 'operator-desk--event' : ''}`}
      aria-label="Mesa de control de la cabina"
    >
      <header className="operator-desk__plate">
        <div className="operator-desk__title">
          <span className="panel-kicker">MESA DE CONTROL · ESCENARIO Y SALA</span>
          <h2>Cabina del operador</h2>
        </div>
        <div className={`operator-desk__live ${active ? 'is-live' : ''}`}>
          <i />
          <span>{eventActive ? 'AVERÍA TÉCNICA' : active ? 'EN DIRECTO' : phase === 'briefing' ? 'STANDBY' : 'SEÑAL CERRADA'}</span>
        </div>
        <div className="operator-desk__act">
          <span>ACTO {incident.roman}</span>
          <b style={{ color: GENRES[fallbackGenre].color }}>{GENRES[fallbackGenre].upper}</b>
        </div>
      </header>

      <div className="desk-console-grid">
        <section className="desk-module desk-module--lights">
          <header className="desk-module__head">
            <div>
              <span className="desk-module__icon" aria-hidden="true">☀</span>
              <h3>Iluminación</h3>
            </div>
            <span className="desk-module__count">{selectedLight ? '1/1' : '0/1'}</span>
          </header>
          <div className="desk-module__body">
            <IntensityFader
              label="luz"
              value={intensities.lightIntensity}
              onChange={(value) => onIntensityChange('light', value)}
              tone="#ffd18b"
              disabled={false}
            />
            <div className="desk-option-list">
              {CONTROLS.lighting.map((control) => (
                <OptionButton
                  key={control.id}
                  kind="lighting"
                  control={control}
                  selected={selections.lighting === control.id}
                  active={active}
                  onSelect={onSelect}
                  onPreview={onPreview}
                />
              ))}
            </div>
          </div>
          <footer className="desk-module__foot">
            {selectedLight ? selectedLight.description : 'Elige una luz y ajusta su intensidad.'}
          </footer>
        </section>

        <section className="desk-module desk-module--status">
          <CabinMonitor
            genre={fallbackGenre}
            phase={phase}
            incident={incident}
            audience={audience}
            stats={stats}
            lastReaction={lastReaction}
            timer={timer}
            stage={stage}
            selections={selections}
          />
          <DeskStatus state={state} incident={incident} stats={stats} />
        </section>

        <section className="desk-module desk-module--sounds">
          <header className="desk-module__head">
            <div>
              <span className="desk-module__icon" aria-hidden="true">♫</span>
              <h3>Sonido</h3>
            </div>
            <span className="desk-module__count">{selectedSound ? '1/1' : '0/1'}</span>
          </header>
          <div className="desk-module__body">
            <IntensityFader
              label="sonido"
              value={intensities.soundIntensity}
              onChange={(value) => onIntensityChange('sound', value)}
              tone="#69f0bd"
              disabled={false}
            />
            <div className="desk-option-list">
              {CONTROLS.sound.map((control) => (
                <OptionButton
                  key={control.id}
                  kind="sound"
                  control={control}
                  selected={selections.sound === control.id}
                  active={active}
                  onSelect={onSelect}
                  onPreview={onPreview}
                />
              ))}
            </div>
          </div>
          <footer className="desk-module__foot">
            {selectedSound ? selectedSound.description : 'Elige la música y ajusta el volumen de sala.'}
          </footer>
        </section>

        <section className="desk-module desk-module--objects">
          <header className="desk-module__head">
            <div>
              <span className="desk-module__icon" aria-hidden="true">✧</span>
              <h3>Objetos y orden</h3>
            </div>
            <span className="desk-module__count">{selectedObject ? '1/1' : '0/1'}</span>
          </header>
          <div className="desk-objects">
            <div className="desk-option-list">
              {CONTROLS.object.map((control) => (
                <OptionButton
                  key={control.id}
                  kind="object"
                  control={control}
                  selected={selections.object === control.id}
                  active={active}
                  onSelect={onSelect}
                  onPreview={onPreview}
                />
              ))}
            </div>

            <div className="desk-inclination" aria-live="polite">
              <span>INCLINACIÓN</span>
              <b style={{ color: inclinationMeta.color }}>{inclinationMeta.icon} {inclinationMeta.upper}</b>
              <div>
                {Object.entries(inclination.totals).map(([genre, value]) => (
                  <i key={genre} className={`desk-inclination__bar desk-inclination__bar--${genre}`}>
                    <span style={{ width: `${Math.min(100, value * 8)}%` }} />
                  </i>
                ))}
              </div>
            </div>

            <div className="combo-slots">
              {CONTROL_GROUPS.map((group) => {
                const control = getControlDef(group.id, selections?.[group.id]);
                return (
                  <span
                    key={group.id}
                    className={`combo-slot ${control ? 'is-filled' : ''}`}
                    style={control ? { '--tone': GENRES[control.genre].color } : undefined}
                  >
                    <b>{control?.icon || group.icon}</b>
                    <small>{control?.label || group.short}</small>
                  </span>
                );
              })}
              {selectedCount > 0 ? (
                <button type="button" className="text-button" onClick={onClear} disabled={!active}>
                  limpiar
                </button>
              ) : null}
            </div>

            <button
              type="button"
              className={`execute-button ${complete ? 'is-ready' : ''}`}
              disabled={!active || !complete}
              onClick={onExecute}
            >
              <span className="execute-button__lights" aria-hidden="true"><i /><i /><i /></span>
              <span>
                <b>{complete ? '¡IMPROVISAR!' : `FALTAN ${3 - selectedCount} CONTROLES`}</b>
                <small>{complete ? 'Ejecutar la combinación' : 'Luz + sonido + objeto'}</small>
              </span>
            </button>
          </div>
          <footer className="desk-module__foot">
            {eventActive
              ? 'La mesa está bloqueada: hay una avería técnica en escena.'
              : active
                ? timer <= 5
                  ? `¡Quedan ${timer} segundos! Ejecuta ya.`
                  : 'La historia cambia según lo que elijas.'
                : phase === 'resolution'
                  ? 'La improvisación ya está en marcha.'
                  : 'Sube el telón para desbloquear la mesa.'}
          </footer>
        </section>
      </div>

      <footer className="operator-desk__footer">
        <span className="operator-desk__footer-lamp"><i /> {active ? 'MESA ACTIVA' : 'MESA EN ESPERA'}</span>
        <span>{selectedCount}/3 controles preparados</span>
        <span>CANAL ESCENA · CANAL PLATEA</span>
        <span>{complete ? 'LISTO PARA EJECUTAR' : 'SELECCIONA LUZ, SONIDO Y OBJETO'}</span>
      </footer>
    </section>
  );
}
