import React from 'react';
import { GENRES } from '../game/storyData.js';

const GROUP_LABEL = {
  romantics: 'Románticos',
  chaos: 'Caos',
  critics: 'Críticos',
};

const GROUP_TONE = {
  romantics: GENRES.romance.color,
  chaos: GENRES.comedy.color,
  critics: GENRES.scifi.color,
};

function Briefing({ state, incident, onBegin }) {
  const genre = GENRES[state.narrative.dominantGenre];
  return (
    <div className="modal-scrim">
      <section className="incident-modal incident-modal--briefing" role="dialog" aria-modal="true" aria-labelledby="briefing-title">
        <div className="incident-modal__tape">ACTO {incident.roman} DE III · PREPARACIÓN</div>
        <header className="incident-modal__header">
          <span className="act-stamp">ACTO<br />{incident.roman}</span>
          <div>
            <span className="panel-kicker">OBRA EN CURSO · {incident.location}</span>
            <h2 id="briefing-title">{incident.playTitle}</h2>
            <p>{incident.briefing}</p>
          </div>
        </header>

        <div className="incident-memory">
          <span className="incident-memory__icon" aria-hidden="true">◈</span>
          <div>
            <span className="panel-kicker">LO QUE EL PÚBLICO RECUERDA</span>
            <p>
              Género dominante: <b style={{ color: genre.color }}>{genre.upper}</b>. {incident.memoryPrompt}
            </p>
          </div>
        </div>

        <div className="opening-lines">
          {incident.openingLines.map((line) => (
            <p key={`${line.speaker}-${line.text}`}>
              <b>{line.speaker}</b>
              <span>{line.text}</span>
            </p>
          ))}
        </div>

        <footer className="incident-modal__footer">
          <span className="incident-warning">
            El temporizador empieza al subir el telón. Tienes {incident.timer} segundos.
          </span>
          <button type="button" className="primary-button" onClick={onBegin}>
            <span className="primary-button__small">ACTO {incident.roman} · {incident.incidentTitle}</span>
            <span className="primary-button__big">SUBIR EL TELÓN</span>
          </button>
        </footer>
      </section>
    </div>
  );
}

function Result({ state, incident, onContinue }) {
  const result = state.result;
  if (!result) return null;
  const genre = GENRES[result.dominantGenre];
  const crisisPending = Boolean(state.pendingCrisis) && !state.crisisResolved;
  const lastAct = state.incidentIndex === 2;
  const buttonLabel = crisisPending
    ? 'AFRONTAR LA CRISIS'
    : lastAct
      ? 'VER EL CARTEL FINAL'
      : 'SIGUIENTE ACTO';

  return (
    <div className="modal-scrim modal-scrim--result">
      <section className="incident-modal incident-modal--result" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <div className="incident-modal__tape">
          ACTO {incident.roman} · RESULTADO {result.timedOut ? '· TIEMPO AGOTADO' : ''}
        </div>
        <header className="result-header">
          <div>
            <span className={`genre-badge genre-badge--${result.dominantGenre}`}>
              <span aria-hidden="true">{genre.icon}</span> {genre.upper}
            </span>
            <h2 id="result-title">{result.headline}</h2>
          </div>
          <span className={`result-coherence ${result.coherenceDelta >= 0 ? 'is-positive' : 'is-negative'}`}>
            COHERENCIA {result.coherenceDelta >= 0 ? '+' : ''}{result.coherenceDelta}
          </span>
        </header>

        {result.timedOut ? (
          <div className="result-alert">
            ⏱ Se agotó el tiempo. Los actores improvisaron con el repertorio de emergencia.
          </div>
        ) : null}
        {result.repeatedCombo ? (
          <div className="result-alert result-alert--warn">
            ↺ Combinación repetida: el público ya la había visto. La penalización está aplicada.
          </div>
        ) : null}

        <p className="result-summary">{result.summary}</p>

        <div className="result-selection" aria-label="Combinación ejecutada">
          {result.controls.map((control) => (
            <span key={`${control.label}-${control.id}`} className={`result-chip result-chip--${control.kind}`}>
              <span aria-hidden="true">{control.icon}</span> {control.label}
            </span>
          ))}
          {result.reusedTags.length && result.hasHistory ? (
            <span className="result-chip result-chip--callback" title="Elemento recuperado de una escena anterior">
              ◈ callback narrativo
            </span>
          ) : null}
        </div>

        <div className="result-dialogue">
          {result.dialogue.map((line, index) => (
            <p key={`${line.speaker}-${index}`} className={line.speaker === 'NARRADOR' ? 'is-narration' : ''}>
              <b>{line.speaker}</b>
              <span>{line.text}</span>
            </p>
          ))}
        </div>

        <div className="result-grid">
          <div className="result-group-deltas">
            {Object.entries(result.groupDeltas).map(([id, delta]) => (
              <div key={id} className="result-delta" style={{ '--tone': GROUP_TONE[id] }}>
                <span>{GROUP_LABEL[id]}</span>
                <b className={delta >= 0 ? 'is-positive' : 'is-negative'}>
                  {delta >= 0 ? '+' : ''}{delta}
                </b>
                <small>
                  {Math.round(result.satisfactionBefore?.[id] || 0)} →{' '}
                  {Math.round(result.satisfactionAfter?.[id] || 0)}
                </small>
              </div>
            ))}
          </div>
          <div className="result-impact">
            <span>Actores <b>{result.trustBefore} → {result.trustAfter}</b></span>
            <span>Improvisación <b>✦ {result.improvAfter}</b></span>
            <span>Memoria <b>{result.reusedTags.length && result.hasHistory ? `${result.reusedTags.length} guiño(s)` : 'nueva escena'}</b></span>
          </div>
        </div>

        <div className={`result-reaction result-reaction--${result.reaction.tone}`}>
          <span className="result-reaction__icon" aria-hidden="true">{result.reaction.icon}</span>
          <div>
            <strong>{result.reaction.label}</strong>
            <p>{result.reaction.cause}</p>
            <small>{result.reaction.effect}</small>
          </div>
        </div>

        <div className="result-memory">
          <span className="panel-kicker">CONSECUENCIA PERSISTENTE</span>
          <p>
            Se añaden a la memoria de la obra: <b>{result.tags.join(' · ')}</b>. La próxima escena
            recordará esta combinación.
          </p>
          {result.memory ? <small>{result.memory}</small> : null}
        </div>

        {crisisPending ? (
          <div className="result-crisis-preview">
            <span aria-hidden="true">!</span>
            <div>
              <strong>Crisis a la vista: {state.pendingCrisis.title}</strong>
              <p>{state.pendingCrisis.subtitle}</p>
            </div>
          </div>
        ) : null}

        {state.crisisResolved && state.lastCrisisOutcome ? (
          <div className="result-crisis-resolved">
            <span className="panel-kicker">CRISIS GESTIONADA</span>
            <p><b>{state.lastCrisisOutcome.label}.</b> {state.lastCrisisOutcome.text}</p>
          </div>
        ) : null}

        <footer className="incident-modal__footer incident-modal__footer--result">
          <span className="result-footnote">
            {lastAct ? 'La función está a punto de terminar.' : 'Aún tendrás que justificar esto en el siguiente acto.'}
          </span>
          <button type="button" className="primary-button primary-button--wide" onClick={onContinue}>
            <span className="primary-button__small">
              {lastAct ? 'CARTEL Y RESUMEN' : 'CONTINUAR LA FUNCIÓN'}
            </span>
            <span className="primary-button__big">{buttonLabel}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function IncidentOverlay({ state, incident, onBegin, onContinue }) {
  if (state.phase === 'briefing') {
    return <Briefing state={state} incident={incident} onBegin={onBegin} />;
  }
  if (state.phase === 'resolution') {
    return <Result state={state} incident={incident} onContinue={onContinue} />;
  }
  return null;
}
