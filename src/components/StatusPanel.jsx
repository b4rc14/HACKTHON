import React from 'react';
import { ACTOR_STATUS, GENRES, REACTION_META } from '../game/storyData.js';

function MetricBar({ value, tone, label, valueLabel }) {
  return (
    <div className="metric">
      <div className="metric__head">
        <span>{label}</span>
        <b style={{ color: tone }}>{valueLabel ?? Math.round(value)}</b>
      </div>
      <div className="metric__bar">
        <i style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: tone }} />
      </div>
    </div>
  );
}

export default function StatusPanel({ state, incident, stats, result }) {
  const totalScore = Object.values(state.narrative.genreScores).reduce((a, b) => a + b, 0) || 1;
  const groupOrder = ['romantics', 'chaos', 'critics'];
  const actorStatus = ACTOR_STATUS[state.actors.status] || ACTOR_STATUS.firmes;
  const recent = state.audience.reactionHistory.slice(-3).reverse();
  const timerLabel =
    state.stage?.activeEvent
      ? `❚❚ ${state.timer}s`
      : state.phase === 'briefing'
        ? `${state.timer}s`
        : state.phase === 'resolution' || state.phase === 'ending'
          ? 'ESCENA CERRADA'
          : `${state.timer}s`;

  return (
    <section className="status-panel" aria-label="Panel de estado">
      <div className="status-panel__top">
        <div className="status-current">
          <span className="panel-kicker">ESTADO DE LA FUNCIÓN</span>
          <h2>
            <span>Acto {incident.roman}</span> {incident.incidentTitle}
          </h2>
          <p>{incident.playTitle} · {incident.location}</p>
        </div>
        <div className="status-quickstats">
          <div className="quickstat">
            <span>TIEMPO</span>
            <b className={state.timer <= 5 && state.phase === 'incident' ? 'is-urgent' : ''}>
              {timerLabel}
            </b>
          </div>
          <div className="quickstat">
            <span>ESPECTADORES</span>
            <b>{stats.total}<small>/{state.audience.initialTotal}</small></b>
          </div>
          <div className="quickstat">
            <span>SATISFACCIÓN</span>
            <b>{Math.round(stats.averageSatisfaction)}%</b>
          </div>
          <div className="quickstat">
            <span>IMPROVISACIÓN</span>
            <b className="improv-value">✦ {state.improv}</b>
          </div>
        </div>
      </div>

      <div className="status-panel__grid">
        <div className="status-groups">
          {groupOrder.map((id) => {
            const group = state.audience.groups[id];
            const delta = result?.groupDeltas?.[id];
            const meta = GENRES[id === 'romantics' ? 'romance' : id === 'chaos' ? 'comedy' : 'scifi'];
            return (
              <article key={id} className={`group-card group-card--${id}`}>
                <header>
                  <div>
                    <span className="group-dot" aria-hidden="true" />
                    <h3>{group.name}</h3>
                    <span className="group-share">{Math.round(group.share * 100)}%</span>
                  </div>
                  <span className="group-count">
                    {group.count}
                    {typeof delta === 'number' ? (
                      <em className={delta >= 0 ? 'is-positive' : 'is-negative'}>
                        {delta >= 0 ? '+' : ''}{delta}
                      </em>
                    ) : null}
                  </span>
                </header>
                <MetricBar
                  value={group.satisfaction}
                  tone={meta.color}
                  label="Satisfacción"
                  valueLabel={`${Math.round(group.satisfaction)}%`}
                />
                <div className="group-mini">
                  <span>
                    Aburrimiento <b>{Math.round(group.boredom)}</b>
                  </span>
                  <span>
                    Paciencia <b>{Math.round(group.patience)}</b>
                  </span>
                  <span>
                    Reacciones <b>{group.reactions.length}</b>
                  </span>
                </div>
                <div className="group-reactions" aria-label={`Últimas reacciones de ${group.name}`}>
                  {group.reactions.length ? (
                    group.reactions.slice(-4).map((type, index) => (
                      <span key={`${id}-${type}-${index}`} title={REACTION_META[type]?.label || type}>
                        {REACTION_META[type]?.icon || '·'}
                      </span>
                    ))
                  ) : (
                    <small>Sin reacciones propias todavía.</small>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="status-metrics">
          <div className="status-block">
            <div className="status-block__head">
              <span className="panel-kicker">HISTORIA</span>
              <span className="status-badge">Coherencia</span>
            </div>
            <MetricBar value={state.narrative.coherence} tone="#d8b077" label="La historia se sostiene" />
            <MetricBar value={state.actors.trust} tone="#ff8fab" label={`Actores · ${actorStatus.label}`} />
            <MetricBar value={state.chaos} tone="#b78cff" label="Nivel de caos" />
            <MetricBar value={state.audience.discontent} tone="#ff8093" label="Descontento acumulado" />
            <p className="status-actor-note">{actorStatus.description}</p>
          </div>

          <div className="status-block status-block--genre">
            <div className="status-block__head">
              <span className="panel-kicker">GÉNERO DOMINANTE</span>
              <span className={`genre-badge genre-badge--${state.narrative.dominantGenre}`}>
                {GENRES[state.narrative.dominantGenre].upper}
              </span>
            </div>
            <div className="genre-votes">
              {Object.entries(state.narrative.genreScores).map(([genre, value]) => {
                const meta = GENRES[genre];
                return (
                  <div key={genre} className="genre-vote">
                    <span style={{ color: meta.color }}>{meta.short}</span>
                    <div className="genre-vote__bar">
                      <i
                        style={{
                          width: `${Math.max(4, (value / totalScore) * 100)}%`,
                          background: meta.color,
                        }}
                      />
                    </div>
                    <b>{Math.round(value)}</b>
                  </div>
                );
              })}
            </div>
            <div className="reaction-log">
              <span className="panel-kicker">ÚLTIMAS REACCIONES</span>
              {recent.length ? (
                <ul>
                  {recent.map((entry) => (
                    <li key={entry.id} className={`tone-${entry.tone}`}>
                      <span aria-hidden="true">{entry.icon}</span>
                      <span>{entry.label}</span>
                      <small>Acto {entry.act || Math.min(3, entry.scene)}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="reaction-log__empty">Aún no hay reacciones registradas.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
