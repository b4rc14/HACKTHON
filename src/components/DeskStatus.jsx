import React from 'react';
import { ACTOR_STATUS, GENRES } from '../game/storyData.js';

const GROUP_ORDER = ['romantics', 'chaos', 'critics'];

const GROUP_COLOR = {
  romantics: '#ff6f91',
  chaos: '#ffd166',
  critics: '#69f0bd',
};

const GROUP_LABEL = {
  romantics: 'Románticos',
  chaos: 'Caos',
  critics: 'Críticos',
};

export default function DeskStatus({ state, incident, stats }) {
  const genre = GENRES[state.narrative.dominantGenre] || GENRES.romance;
  const event = state.stage?.activeEvent;
  const actorStatus = ACTOR_STATUS[state.actors.status] || ACTOR_STATUS.firmes;
  const timerLabel = event ? `PAUSA · ${state.timer}s` : `${state.timer}s`;

  return (
    <section className="desk-status" aria-label="Monitor central de estado">
      <header className="desk-status__head">
        <div>
          <span className="desk-crt-label">MONITOR DE ESCENA</span>
          <h3>ACTO {incident.roman} · {incident.incidentTitle}</h3>
        </div>
        <span className={`genre-badge genre-badge--${state.narrative.dominantGenre}`}>{genre.icon} {genre.short}</span>
      </header>

      <div className="desk-status__timer">
        <span>{event ? 'AVERÍA EN CURSO' : 'TIEMPO DE ESCENA'}</span>
        <b className={state.timer <= 5 ? 'is-urgent' : ''}>{timerLabel}</b>
        <i style={{ width: `${event ? 100 : state.timerMax ? (state.timer / state.timerMax) * 100 : 0}%` }} />
      </div>

      <div className="desk-status__primary">
        <div>
          <span>SATISFACCIÓN MEDIA</span>
          <strong>{Math.round(stats.averageSatisfaction)}<small>%</small></strong>
          <div className="desk-meter"><i style={{ width: `${stats.averageSatisfaction}%`, background: '#ffcf7a' }} /></div>
        </div>
        <div>
          <span>COHERENCIA</span>
          <strong>{Math.round(state.narrative.coherence)}<small>/100</small></strong>
          <div className="desk-meter"><i style={{ width: `${state.narrative.coherence}%`, background: '#d8b077' }} /></div>
        </div>
      </div>

      <div className="desk-status__groups">
        {GROUP_ORDER.map((id) => {
          const group = state.audience.groups[id];
          return (
            <div key={id} className="desk-group-row">
              <span style={{ color: GROUP_COLOR[id] }}>{GROUP_LABEL[id]}</span>
              <b>{group.count}</b>
              <div className="desk-meter"><i style={{ width: `${group.satisfaction}%`, background: GROUP_COLOR[id] }} /></div>
              <small>{Math.round(group.satisfaction)}%</small>
            </div>
          );
        })}
      </div>

      <div className="desk-status__footer">
        <span><b>{stats.total}</b> / {state.audience.initialTotal} en sala</span>
        <span>Confianza <b>{Math.round(state.actors.trust)}</b> · {actorStatus.label}</span>
        <span>Caos <b>{Math.round(state.chaos)}</b></span>
        <span>✦ <b>{state.improv}</b> improv.</span>
        <span>Descontento <b>{Math.round(state.audience.discontent)}</b></span>
        <span>Aburrimiento <b>{Math.round(stats.averageBoredom)}</b></span>
        <span>Paciencia <b>{Math.round(stats.averagePatience)}</b></span>
      </div>
    </section>
  );
}
