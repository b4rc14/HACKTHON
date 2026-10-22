import React from 'react';
import { CRISIS_ACTIONS } from '../game/storyData.js';
import { getActionAvailability } from '../game/audienceEngine.js';

function ActionButton({ action, state, onAction, compact }) {
  const availability = getActionAvailability(state, action.id);
  const leftover = action.cooldown
    ? Math.max(0, state.cooldowns[action.id] || 0)
    : 0;
  return (
    <button
      type="button"
      className={`crisis-action crisis-action--${action.tone} ${compact ? 'crisis-action--compact' : ''}`}
      onClick={() => onAction(action.id)}
      disabled={!availability.enabled}
      title={availability.reason || action.description}
    >
      <span className="crisis-action__icon" aria-hidden="true">{action.icon}</span>
      <span className="crisis-action__copy">
        <strong>{action.label}</strong>
        <small>{availability.enabled ? action.cost : availability.reason}</small>
      </span>
      {leftover > 0 ? <span className="crisis-action__cooldown">{leftover}</span> : null}
    </button>
  );
}

export function CrisisPanelInline({ state, onAction }) {
  return (
    <section className="crisis-panel-inline" aria-label="Protocolos de crisis">
      <div className="crisis-inline-heading">
        <div>
          <span className="panel-kicker">PROTOCOLOS</span>
          <h2>Control de sala</h2>
        </div>
        <span className="improv-pill">✦ {state.improv} {state.improv === 1 ? 'improvisación' : 'improvisaciones'}</span>
      </div>
      <p className="crisis-inline-note">
        Puedes usarlos durante la escena. Cada protocolo tiene un coste; durante una crisis,
        elegir uno la resuelve.
      </p>
      <div className="crisis-action-grid">
        {CRISIS_ACTIONS.map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            state={state}
            onAction={onAction}
            compact
          />
        ))}
      </div>
    </section>
  );
}

export default function CrisisPanel({ state, onAction, mode = 'inline' }) {
  if (mode !== 'modal') return <CrisisPanelInline state={state} onAction={onAction} />;
  const crisis = state.crisis;
  if (!crisis) return null;
  const timerPercent = crisis.timerMax
    ? Math.max(0, Math.min(100, (state.timer / crisis.timerMax) * 100))
    : 0;

  return (
    <div className="modal-scrim modal-scrim--crisis" role="presentation">
      <section
        className={`crisis-modal crisis-modal--${crisis.severity}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crisis-title"
      >
        <div className="crisis-modal__tape" aria-hidden="true">PROTOCOLO DE EMERGENCIA</div>
        <header className="crisis-modal__header">
          <span className="crisis-siren" aria-hidden="true">!</span>
          <div>
            <span className="panel-kicker">LA FUNCIÓN PELIGRA</span>
            <h2 id="crisis-title">{crisis.title}</h2>
            <p>{crisis.subtitle}</p>
          </div>
          <strong className={`crisis-timer ${state.timer <= 5 ? 'is-urgent' : ''}`}>
            {state.timer}s
          </strong>
        </header>

        <div className="crisis-timerbar" aria-hidden="true">
          <i style={{ width: `${timerPercent}%` }} />
        </div>

        <div className="crisis-cause">
          <span>CAUSA</span>
          <p>{crisis.cause}</p>
        </div>
        <p className="crisis-hint">
          <span aria-hidden="true">↳</span> {crisis.hint}
        </p>

        <div className="crisis-modal__actions">
          {CRISIS_ACTIONS.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              state={state}
              onAction={onAction}
            />
          ))}
        </div>

        <div className="crisis-modal__footer">
          <span>
            Recursos: <b>✦ {state.improv}</b> · El tiempo se agota solo. Si no eliges,
            la crisis se resolverá mal.
          </span>
          <button type="button" className="text-button text-button--light" onClick={() => onAction('wait')}>
            Dejar pasar la crisis
          </button>
        </div>
      </section>
    </div>
  );
}
