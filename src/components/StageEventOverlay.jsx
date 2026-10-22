import React from 'react';
import { STAGE_EVENTS, getEventProgress } from '../game/stageEvents.js';

const EFFECT_LABEL = {
  trust: 'Confianza de actores',
  coherence: 'Coherencia',
  chaos: 'Caos',
  discontent: 'Descontento',
  romantics: 'Románticos',
  chaosGroup: 'Amantes del caos',
  critics: 'Críticos',
};

const effectChips = (effects = {}) => {
  const chips = [];
  ['trust', 'coherence', 'chaos', 'discontent'].forEach((key) => {
    if (typeof effects[key] === 'number' && effects[key] !== 0) {
      chips.push({ label: EFFECT_LABEL[key], value: effects[key] });
    }
  });
  Object.entries(effects.groups || {}).forEach(([key, value]) => {
    if (value !== 0) {
      chips.push({
        label: key === 'chaos' ? 'Público del caos' : EFFECT_LABEL[key] || key,
        value,
      });
    }
  });
  return chips;
};

const formatDelta = (value) => (value > 0 ? `+${value}` : String(value));

export default function StageEventOverlay({ event, onCollect, onClose }) {
  if (!event) return null;
  const def = STAGE_EVENTS[event.id];
  if (!def) return null;
  const progress = getEventProgress(event);
  const timerPercent = event.timerMax ? (event.timer / event.timerMax) * 100 : 0;
  const isResult = event.phase === 'result';
  const effects = isResult
    ? effectChips(event.effects || (event.success ? def.successEffects : def.failEffects))
    : [];

  return (
    <div className="modal-scrim modal-scrim--event" role="presentation">
      <section
        className={`event-modal event-modal--${def.id} ${isResult ? (event.success ? 'is-success' : 'is-failure') : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stage-event-title"
      >
        <div className="event-modal__topline">
          <span className="event-live"><i /> INCIDENCIA TÉCNICA EN DIRECTO</span>
          <span className="event-scene-pause">Reloj de escena en pausa</span>
        </div>

        <header className="event-modal__header">
          <span className={`event-modal__icon event-modal__icon--${def.tone}`} aria-hidden="true">{def.icon}</span>
          <div>
            <span className="panel-kicker">EL ESCENARIO SE ROMPE</span>
            <h2 id="stage-event-title">{isResult ? (event.success ? def.successTitle : def.failTitle) : def.title}</h2>
            <p>{isResult ? (event.success ? def.successText : def.failText) : def.subtitle}</p>
          </div>
          {!isResult ? (
            <div className={`event-timer ${event.timer <= 3 ? 'is-urgent' : ''}`}>
              <strong>{event.timer}s</strong>
              <span>para actuar</span>
            </div>
          ) : (
            <div className={`event-result-stamp ${event.success ? 'is-success' : 'is-failure'}`}>
              {event.success ? '✓' : '✕'}
              <small>{event.success ? 'ÉXITO' : 'FALLO'}</small>
            </div>
          )}
        </header>

        {!isResult ? (
          <>
            <div className="event-timerbar" aria-hidden="true">
              <i style={{ width: `${timerPercent}%` }} />
            </div>
            <div className="event-brief">
              <span className="event-brief__objective">
                {def.objective}
              </span>
              <span className="event-progress">
                <b>{progress.collected}/{progress.total}</b> recuperados
              </span>
            </div>

            <div className={`event-field event-field--${def.id}`}>
              <div className="event-field__glow" aria-hidden="true" />
              <div className="event-field__grid" aria-hidden="true" />
              <div className="event-field__floor" aria-hidden="true" />
              <span className="event-field__label">ZONA DE REPARACIÓN · HAZ CLIC EN LOS {def.targetPlural}</span>
              {event.targets.map((target) => {
                const collected = event.collected.includes(target.id);
                return (
                  <button
                    key={target.id}
                    type="button"
                    className={[
                      'event-target',
                      `event-target--${target.type}`,
                      `event-target--${target.size || 'md'}`,
                      collected ? 'is-collected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{
                      left: `${target.x}%`,
                      top: `${target.y}%`,
                      '--rotate': `${target.rotate || 0}deg`,
                    }}
                    onClick={() => onCollect(target.id)}
                    disabled={collected}
                    aria-label={`${target.label}${collected ? ', ya recogido' : ''}`}
                  >
                    <span aria-hidden="true">{target.type === 'decoy' ? target.icon : def.targetIcon}</span>
                    {target.type === 'decoy' ? <small>no</small> : null}
                  </button>
                );
              })}
              <div className="event-field__feedback" aria-live="polite">
                {event.feedback}
              </div>
            </div>

            <footer className="event-modal__footer">
              <span>
                {def.id === 'spotlight'
                  ? 'Los tornillos no sirven para arreglar la luz. Cada error resta 2 segundos.'
                  : def.id === 'cable'
                    ? 'El fusible rojo está fundido. No lo toques.'
                    : 'La gallina se mueve. El público también.'}
              </span>
              <span className="event-feedback-hint">Selecciona con el ratón o el dedo.</span>
            </footer>
          </>
        ) : (
          <>
            <div className="event-result-grid">
              <div className="event-result-detail">
                <span className="panel-kicker">PARTE DE INCIDENCIAS</span>
                <p>
                  {event.id === 'spotlight'
                    ? 'El foco vuelve a iluminar el escenario.'
                    : event.id === 'cable'
                      ? 'El cuadro eléctrico se estabiliza.'
                      : 'La gallina vuelve a su marca, más o menos.'}
                </p>
                <div className="event-result-stats">
                  <span>Cristales/objetivos: <b>{progress.collected}/{progress.total}</b></span>
                  <span>Errores: <b>{event.decoyHits || 0}</b></span>
                  <span>Acto: <b>{event.act}</b></span>
                </div>
              </div>
              <div className="event-result-effects">
                <span className="panel-kicker">CONSECUENCIAS</span>
                <div>
                  {effects.map((effect) => (
                    <span key={effect.label} className={effect.value > 0 ? 'is-positive' : 'is-negative'}>
                      {effect.label} {formatDelta(effect.value)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {event.success ? (
              <div className="event-result-note">
                La función recupera el control. Los actores respiran y el público vuelve a mirar al escenario.
              </div>
            ) : (
              <div className="event-result-note event-result-note--bad">
                El desastre queda a la vista. La obra continúa, pero el escenario ya no es el mismo.
              </div>
            )}

            <footer className="event-modal__footer event-modal__footer--result">
              <span>El tiempo de la escena sigue congelado hasta que vuelvas.</span>
              <button type="button" className="primary-button" onClick={onClose}>
                <span className="primary-button__small">RECUPERAR EL CONTROL</span>
                <span className="primary-button__big">VOLVER A LA ESCENA</span>
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
