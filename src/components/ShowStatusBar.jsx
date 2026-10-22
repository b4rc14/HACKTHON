import React from 'react';

export default function ShowStatusBar({ state, stats, result }) {
  const quality = Math.round(
    stats.averageSatisfaction * 0.65 + state.narrative.coherence * 0.35,
  );
  const total = Math.max(1, stats.total);
  const reaction = state.audience.lastReaction;

  return (
    <section className="show-status" aria-label="Monitor de sala">
      <div className="show-status__title">
        <span className="show-status__led" />
        <div>
          <small>MONITOR DE SALA</small>
          <strong>EN VIVO</strong>
        </div>
      </div>

      <div className="show-status__metric">
        <span>CALIDAD</span>
        <b>{quality}</b>
        <i><em style={{ width: `${quality}%` }} /></i>
      </div>

      <div className="show-status__metric">
        <span>COHERENCIA</span>
        <b>{Math.round(state.narrative.coherence)}</b>
        <i><em style={{ width: `${state.narrative.coherence}%` }} /></i>
      </div>

      <div className="show-status__audience">
        <div>
          <span>PÚBLICO</span>
          <b>{stats.total}<small>/{stats.initialTotal}</small></b>
        </div>
        <div className="show-status__mood" aria-hidden="true">
          <i style={{ width: `${(stats.contentCount / total) * 100}%`, background: '#7bd6a0' }} />
          <i style={{ width: `${(stats.seriousCount / total) * 100}%`, background: '#e8bf5a' }} />
          <i style={{ width: `${(stats.criticalCount / total) * 100}%`, background: '#e35d5d' }} />
        </div>
        <div className="show-status__counts">
          <span>CONTENTOS <b>{stats.contentCount}</b></span>
          <span>SERIOS <b>{stats.seriousCount}</b></span>
          <span>CRÍTICOS <b>{stats.criticalCount}</b></span>
        </div>
      </div>

      <div className="show-status__reaction">
        <span aria-hidden="true">{reaction?.icon || '👁'}</span>
        <div>
          <strong>{reaction?.label || 'La platea observa'}</strong>
          <small>{result?.quality ? `Calidad de escena ${result.quality}` : `${stats.walkouts} abandonos`}</small>
        </div>
      </div>
    </section>
  );
}
