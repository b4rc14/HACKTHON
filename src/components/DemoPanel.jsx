import React, { useMemo, useState } from 'react';

export default function DemoPanel({ state, onClose, onPause, onSkip, onSimulate, onRestart, onToggleSound }) {
  const [copied, setCopied] = useState(false);
  const snapshot = useMemo(
    () => ({
      phase: state.phase,
      act: state.incidentIndex + 1,
      timer: state.timer,
      paused: state.demo.paused,
      selections: state.selections,
      audience: {
        total: Object.values(state.audience.groups).reduce((total, group) => total + group.count, 0),
        discontent: Math.round(state.audience.discontent),
        lastReaction: state.audience.lastReaction?.type || null,
        groups: Object.fromEntries(
          Object.entries(state.audience.groups).map(([id, group]) => [
            id,
            {
              count: group.count,
              satisfaction: Math.round(group.satisfaction),
              boredom: Math.round(group.boredom),
              patience: Math.round(group.patience),
            },
          ]),
        ),
      },
      narrative: {
        dominantGenre: state.narrative.dominantGenre,
        genreScores: state.narrative.genreScores,
        coherence: Math.round(state.narrative.coherence),
        tags: state.narrative.establishedTags,
        history: state.narrative.history.map((entry) => ({
          act: entry.act,
          headline: entry.headline,
          genre: entry.dominantGenre,
          reaction: entry.reaction?.type,
        })),
      },
      actors: state.actors,
      chaos: Math.round(state.chaos),
      improv: state.improv,
      cooldowns: state.cooldowns,
      pendingCrisis: state.pendingCrisis?.title || null,
      ending: state.ending?.meta?.label || null,
      stats: state.stats,
    }),
    [state],
  );

  const copyState = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside className="demo-panel" aria-label="Modo demo y depuración">
      <header className="demo-panel__header">
        <div>
          <span className="demo-badge">MODO DEMO</span>
          <strong>Herramientas de ensayo</strong>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar modo demo">×</button>
      </header>

      <div className="demo-panel__status">
        <span>Fase <b>{state.phase}</b></span>
        <span>Acto <b>{state.incidentIndex + 1}/3</b></span>
        <span>Reloj <b>{state.timer}s</b></span>
        {state.demo.paused ? <span className="demo-paused">PAUSADO</span> : null}
        {state.demo.skipped ? <span>Saltos <b>{state.demo.skipped}</b></span> : null}
      </div>

      <div className="demo-panel__grid">
        <button type="button" onClick={onPause} disabled={!['incident', 'crisis'].includes(state.phase)}>
          {state.demo.paused ? '▶ Reanudar' : '⏸ Pausar'}
        </button>
        <button type="button" onClick={onSkip} disabled={['title', 'ending'].includes(state.phase)}>
          ⏭ Saltar acto
        </button>
        <button type="button" onClick={() => onSimulate('positive')} disabled={['title', 'ending'].includes(state.phase)}>
          👏 Reacción +
        </button>
        <button type="button" onClick={() => onSimulate('negative')} disabled={['title', 'ending'].includes(state.phase)}>
          🍅 Reacción −
        </button>
        <button type="button" onClick={onToggleSound}>
          {state.soundEnabled ? '🔊 Sonido ON' : '🔇 Sonido OFF'}
        </button>
        <button type="button" onClick={onRestart}>
          ↺ Reiniciar partida
        </button>
      </div>

      <div className="demo-panel__debug">
        <div className="demo-debug-head">
          <span>ESTADO ACTUAL</span>
          <button type="button" className="text-button text-button--light" onClick={copyState}>
            {copied ? 'copiado' : 'copiar JSON'}
          </button>
        </div>
        <details>
          <summary>Ver snapshot</summary>
          <pre>{JSON.stringify(snapshot, null, 2)}</pre>
        </details>
      </div>

      <p className="demo-panel__note">
        Atajos de hackathon. El modo demo no se oculta en la build: sirve para que el jurado
        y el equipo puedan probar cualquier estado sin esperar.
      </p>
    </aside>
  );
}
