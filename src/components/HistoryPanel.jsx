import React from 'react';
import { GENRES, getControlDef } from '../game/storyData.js';
import { STAGE_EVENTS } from '../game/stageEvents.js';

const selectionIcons = (selection) => {
  if (!selection) return [];
  return ['lighting', 'sound', 'object']
    .map((kind) => getControlDef(kind, selection[kind]))
    .filter(Boolean);
};

export default function HistoryPanel({ state }) {
  const history = state.narrative.history;
  const tags = state.narrative.establishedTags.slice(-12);

  return (
    <section className="history-panel" aria-label="Memoria de la obra">
      <div className="history-panel__head">
        <div>
          <span className="panel-kicker">CUADERNO DE DIRECCIÓN</span>
          <h2>Memoria de la obra</h2>
        </div>
        <span className="history-count">{history.length}/3</span>
      </div>

      {history.length ? (
        <ol className="history-list">
          {history.slice().reverse().map((entry, index) => {
            const genre = GENRES[entry.dominantGenre] || GENRES.romance;
            const controls = selectionIcons(entry.selection);
            return (
              <li key={`${entry.act}-${entry.comboSignature}-${index}`} className={entry.skipped ? 'is-skipped' : ''}>
                <div className="history-list__top">
                  <span className="history-act">ACTO {entry.act}</span>
                  <span className="history-genre" style={{ color: genre.color }}>{genre.short}</span>
                  {entry.reaction ? (
                    <span className={`history-reaction tone-${entry.reaction.type === 'applause' || entry.reaction.type === 'flowers' || entry.reaction.type === 'ovation' || entry.reaction.type === 'laughs' ? 'positive' : 'negative'}`}>
                      {entry.reaction.label}
                    </span>
                  ) : null}
                </div>
                <strong className="history-headline">{entry.headline || 'Acto omitido'}</strong>
                <div className="history-list__bottom">
                  <span className="history-controls" aria-hidden="true">
                    {controls.map((control) => (
                      <i key={`${entry.act}-${control.id}`} style={{ color: GENRES[control.genre].color }} title={control.label}>
                        {control.icon}
                      </i>
                    ))}
                  </span>
                  <span className={entry.coherenceDelta >= 0 ? 'is-positive' : 'is-negative'}>
                    coherencia {entry.coherenceDelta >= 0 ? '+' : ''}{entry.coherenceDelta}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="history-empty">
          La primera página está en blanco. Lo que decidas ahora será el pasado que el público
          use en la próxima escena.
        </p>
      )}

      {state.stage?.eventHistory?.length ? (
        <div className="history-events">
          <span className="panel-kicker">PARTE DE AVERÍAS</span>
          <ul>
            {state.stage.eventHistory.slice(-3).reverse().map((event, index) => {
              const def = STAGE_EVENTS[event.id];
              return (
                <li key={`${event.id}-${event.act}-${index}`} className={event.success ? 'is-success' : 'is-failure'}>
                  <span aria-hidden="true">{event.success ? '✓' : '✕'}</span>
                  <b>{def?.shortTitle || event.id}</b>
                  <small>Acto {event.act}</small>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="history-tags">
        <span className="panel-kicker">ELEMENTOS ESTABLECIDOS</span>
        <div>
          {tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </div>
    </section>
  );
}
