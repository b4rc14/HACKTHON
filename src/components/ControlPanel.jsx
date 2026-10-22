import React from 'react';
import CabinMonitor from './CabinMonitor.jsx';
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
  const genre = entries.find(([, value]) => value === max)?.[0] || fallback;
  return { genre, totals };
};

export default function ControlPanel({
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
}) {
  const selectedCount = ['lighting', 'sound', 'object'].filter(
    (kind) => selections?.[kind],
  ).length;
  const complete = selectedCount === 3;
  const inclination = inferInclination(selections, fallbackGenre);
  const inclinationMeta = GENRES[inclination.genre];
  const eventActive = Boolean(stage?.activeEvent);

  return (
    <section className={`control-panel ${active ? '' : 'control-panel--locked'} ${eventActive ? 'control-panel--event' : ''}`} aria-label="Cabina técnica">
      <div className="desk-top">
        <div className="desk-plate">
          <span className="desk-plate__screw" aria-hidden="true" />
          <div>
            <span className="panel-kicker">MESA DE CONTROL · ESCENARIO Y SALA</span>
            <h2>Cabina del operador</h2>
          </div>
          <span className="desk-plate__screw" aria-hidden="true" />
        </div>

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

        <div className="desk-statusstrip">
          <span><i className={active ? 'is-live' : ''} /> {eventActive ? 'AVERÍA EN ESCENA' : active ? 'SEÑAL ESTABLE' : 'STANDBY'}</span>
          <span>CANAL 1 / 2</span>
          <span className="desk-statusstrip__lights" aria-hidden="true"><i /><i /><i /><i /></span>
        </div>
      </div>

      <div className="panel-heading">
        <div>
          <span className="panel-kicker">MANDOS DE ESCENA</span>
          <h2>Improvisa el desastre</h2>
        </div>
        <span className={`panel-count ${complete ? 'is-ready' : ''}`}>{selectedCount}/3</span>
      </div>

      <div className="control-inclination" aria-live="polite">
        <span className="control-inclination__label">INCLINACIÓN DE LA ESCENA</span>
        <span
          className="control-inclination__genre"
          style={{ '--tone': inclinationMeta.color }}
        >
          <span aria-hidden="true">{inclinationMeta.icon}</span> {inclinationMeta.upper}
        </span>
        <div className="control-inclination__bars" aria-hidden="true">
          {Object.entries(inclination.totals).map(([genre, value]) => (
            <span key={genre} className={`inclination-bar inclination-bar--${genre}`}>
              <i style={{ width: `${Math.min(100, value * 8)}%` }} />
            </span>
          ))}
        </div>
      </div>

      {CONTROL_GROUPS.map((group) => (
        <div key={group.id} className="control-group">
          <div className="control-group__head">
            <div>
              <span className="control-group__icon" aria-hidden="true">{group.icon}</span>
              <h3>{group.label}</h3>
            </div>
            <p>{group.hint}</p>
          </div>
          <div className="control-options" role="group" aria-label={group.label}>
            {CONTROLS[group.id].map((control) => {
              const selected = selections?.[group.id] === control.id;
              const tone = GENRES[control.genre];
              return (
                <button
                  key={control.id}
                  type="button"
                  className={`control-card control-card--${control.genre} ${selected ? 'is-selected' : ''}`}
                  style={{ '--tone': tone.color }}
                  onClick={() => {
                    if (!active) return;
                    onPreview?.(group.id, control);
                    onSelect(group.id, control.id);
                  }}
                  disabled={!active}
                  aria-pressed={selected}
                  title={control.description}
                >
                  <span className="control-card__icon" aria-hidden="true">{control.icon}</span>
                  <span className="control-card__copy">
                    <strong>{control.label}</strong>
                    <small>{control.sublabel}</small>
                  </span>
                  <span className="control-card__genre">{tone.short}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="combo-footer">
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
          <span className="execute-button__lights" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <b>{complete ? '¡IMPROVISAR!' : `FALTAN ${3 - selectedCount} CONTROLES`}</b>
            <small>
              {complete
                ? 'Ejecutar la combinación y ver la consecuencia'
                : 'Luz + sonido + objeto'}
            </small>
          </span>
        </button>
      </div>

      {!active ? (
        <p className="control-locked">
          {eventActive
            ? 'Avería técnica en curso: el minijuego tiene prioridad. La mesa está bloqueada.'
            : phase === 'resolution'
              ? 'La improvisación ya está en marcha. Lee el resultado.'
              : phase === 'crisis'
                ? 'La cabina espera: gestiona la crisis con los protocolos.'
                : phase === 'briefing'
                  ? 'Sube el telón para desbloquear la cabina.'
                  : 'Cabina bloqueada.'}
        </p>
      ) : timer <= 5 ? (
        <p className="control-warning">¡Quedan {timer} segundos! Elige y ejecuta.</p>
      ) : null}
    </section>
  );
}
