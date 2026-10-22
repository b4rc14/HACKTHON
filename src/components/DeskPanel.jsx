import React from 'react';
import {
  CONTROL_GROUPS,
  CONTROLS,
  GENRES,
  getControlDef,
} from '../game/storyData.js';

function DeskChannel({ group, selections, active, onSelect, onPreview }) {
  return (
    <div className="desk-channel">
      <div className="desk-channel__head">
        <span className="desk-channel__icon" aria-hidden="true">{group.icon}</span>
        <div>
          <strong>{group.label}</strong>
          <small>{group.short}</small>
        </div>
      </div>
      <div className="desk-channel__options" role="group" aria-label={group.label}>
        {CONTROLS[group.id].map((control) => {
          const selected = selections?.[group.id] === control.id;
          const tone = GENRES[control.genre];
          return (
            <button
              key={control.id}
              type="button"
              className={`desk-option ${selected ? 'is-selected' : ''}`}
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
              <span className="desk-option__icon" aria-hidden="true">{control.icon}</span>
              <span className="desk-option__label">{control.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DeskControls({
  selections,
  onSelect,
  onPreview,
  onExecute,
  onClear,
  active,
  phase,
  timer,
}) {
  const selectedCount = ['lighting', 'sound', 'object'].filter(
    (kind) => selections?.[kind],
  ).length;
  const complete = selectedCount === 3;

  return (
    <div className={`desk-controls ${active ? '' : 'is-locked'}`}>
      <div className="desk-channels">
        {CONTROL_GROUPS.map((group) => (
          <DeskChannel
            key={group.id}
            group={group}
            selections={selections}
            active={active}
            onSelect={onSelect}
            onPreview={onPreview}
          />
        ))}
      </div>

      <div className="desk-actions">
        <div className="desk-selection">
          {CONTROL_GROUPS.map((group) => {
            const control = getControlDef(group.id, selections?.[group.id]);
            return (
              <span
                key={group.id}
                className={`desk-slot ${control ? 'is-filled' : ''}`}
                style={control ? { '--tone': GENRES[control.genre].color } : undefined}
              >
                <b>{control?.icon || group.icon}</b>
                <small>{control?.label || group.short}</small>
              </span>
            );
          })}
          {selectedCount > 0 ? (
            <button type="button" className="desk-clear" onClick={onClear} disabled={!active}>
              limpiar
            </button>
          ) : null}
        </div>

        <button
          type="button"
          className={`desk-execute ${complete ? 'is-ready' : ''}`}
          disabled={!active || !complete}
          onClick={onExecute}
        >
          <b>{complete ? 'IMPROVISAR' : `FALTAN ${3 - selectedCount}`}</b>
          <small>{complete ? 'Ejecutar combinación' : 'Luz + sonido + objeto'}</small>
        </button>
      </div>

      {!active ? (
        <p className="desk-locked">
          {phase === 'resolution'
            ? 'La escena está resuelta. Lee la consecuencia.'
            : phase === 'crisis'
              ? 'Gestiona la crisis antes de volver a improvisar.'
              : phase === 'briefing'
                ? 'Sube el telón para desbloquear la mesa.'
                : 'Mesa bloqueada.'}
        </p>
      ) : timer <= 5 ? (
        <p className="desk-warning">Quedan {timer} segundos.</p>
      ) : null}
    </div>
  );
}

export function DeskMonitor({ state, stats, result }) {
  const quality = Math.round(
    stats.averageSatisfaction * 0.65 + state.narrative.coherence * 0.35,
  );
  const genre = GENRES[state.narrative.dominantGenre];
  const reaction = state.audience.lastReaction;
  const total = Math.max(1, stats.total);

  return (
    <div className="desk-monitor">
      <div className="desk-monitor__top">
        <span className="desk-monitor__kicker">MONITOR DE CABINA</span>
        <span className="desk-monitor__live">EN VIVO</span>
      </div>

      <div className="desk-monitor__scores">
        <div>
          <small>CALIDAD</small>
          <strong>{quality}</strong>
          <i><em style={{ width: `${quality}%` }} /></i>
        </div>
        <div>
          <small>COHERENCIA</small>
          <strong>{Math.round(state.narrative.coherence)}</strong>
          <i><em style={{ width: `${state.narrative.coherence}%` }} /></i>
        </div>
      </div>

      <div className="desk-monitor__audience">
        <div className="desk-monitor__audience-head">
          <span>PÚBLICO</span>
          <b>{stats.total}<small>/{stats.initialTotal}</small></b>
        </div>
        <div className="desk-monitor__mood" aria-hidden="true">
          <i style={{ width: `${(stats.contentCount / total) * 100}%`, background: '#7bd6a0' }} />
          <i style={{ width: `${(stats.seriousCount / total) * 100}%`, background: '#e8bf5a' }} />
          <i style={{ width: `${(stats.criticalCount / total) * 100}%`, background: '#e35d5d' }} />
        </div>
        <div className="desk-monitor__mood-labels">
          <span>CONTENTOS <b>{stats.contentCount}</b></span>
          <span>SERIOS <b>{stats.seriousCount}</b></span>
          <span>CRÍTICOS <b>{stats.criticalCount}</b></span>
        </div>
      </div>

      <div className="desk-monitor__bottom">
        <span className={`genre-badge genre-badge--${state.narrative.dominantGenre}`}>
          {genre.icon} {genre.short}
        </span>
        <span>✦ {state.improv}</span>
        <span>Confianza {Math.round(state.actors.trust)}</span>
        <span className="desk-monitor__walkouts">{stats.walkouts} fuera</span>
      </div>

      <div className={`desk-monitor__reaction tone-${reaction?.tone || 'neutral'}`}>
        <span aria-hidden="true">{reaction?.icon || '👁'}</span>
        <p>{reaction?.label || 'La platea observa'}</p>
        {result?.quality ? <small>Calidad de escena {result.quality}</small> : null}
      </div>
    </div>
  );
}
