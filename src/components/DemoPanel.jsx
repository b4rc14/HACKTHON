import React, { useMemo, useState } from 'react';
import { getAudienceStats } from '../game/audienceModel.js';

export default function DemoPanel({ state, onClose, onPause, onSkip, onSimulate, onRestart, onToggleSound, onForceStageEvent }) {
  const [copied, setCopied] = useState(false);
  const snapshot = useMemo(() => {
    const stats = getAudienceStats(state.audience);
    return {
      phase: state.phase,
      playId: state.playId,
      scene: state.incidentIndex + 1,
      showTimer: state.showTimer,
      timer: state.timer,
      paused: state.demo.paused,
      selections: state.selections,
      audience: {
        total: stats.total,
        satisfied: stats.contentCount,
        serious: stats.seriousCount,
        critical: stats.criticalCount,
        leaving: stats.leavingCount,
        walkouts: stats.walkouts,
        discontent: Math.round(state.audience.discontent),
        lastReaction: state.audience.lastReaction?.type || null,
        people: state.audience.people.map((person) => ({
          id: person.id,
          state: person.state,
          satisfaction: Math.round(person.satisfaction),
          criticality: person.criticality,
        })),
      },
      narrative: {
        dominantGenre: state.narrative.dominantGenre,
        genreScores: state.narrative.genreScores,
        coherence: Math.round(state.narrative.coherence),
        tags: state.narrative.establishedTags,
        history: state.narrative.history.map((entry) => ({
          scene: entry.sceneNumber || entry.act,
          headline: entry.headline,
          genre: entry.dominantGenre,
          reaction: entry.reaction?.type,
        })),
      },
      actors: state.actors,
      desk: state.desk,
      stage: {
        activeEvent: state.stage?.activeEvent
          ? {
              id: state.stage.activeEvent.id,
              phase: state.stage.activeEvent.phase,
              timer: state.stage.activeEvent.timer,
              collected: state.stage.activeEvent.collected,
            }
          : null,
        eventHistory: state.stage?.eventHistory || [],
        persistentFx: state.stage?.persistentFx,
      },
      chaos: Math.round(state.chaos),
      improv: state.improv,
      cooldowns: state.cooldowns,
      pendingCrisis: state.pendingCrisis?.title || null,
      ending: state.ending?.meta?.label || null,
      stats: state.stats,
    };
  }, [state]);

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
        <span>Escena <b>{state.incidentIndex + 1}</b></span>
        <span>Función <b>{state.showTimer ?? 0}s</b></span>
        <span>Escena <b>{state.timer}s</b></span>
        {state.demo.paused ? <span className="demo-paused">PAUSADO</span> : null}
        {state.demo.skipped ? <span>Saltos <b>{state.demo.skipped}</b></span> : null}
      </div>

      <div className="demo-panel__grid">
        <button type="button" onClick={onPause} disabled={!['incident', 'crisis'].includes(state.phase)}>
          {state.demo.paused ? '▶ Reanudar' : '⏸ Pausar'}
        </button>
        <button type="button" onClick={onSkip} disabled={['title', 'ending'].includes(state.phase)}>
          ⏭ Saltar escena
        </button>
        <button type="button" onClick={() => onSimulate('positive')} disabled={['title', 'ending'].includes(state.phase)}>
          👏 Reacción +
        </button>
        <button type="button" onClick={() => onSimulate('negative')} disabled={['title', 'ending'].includes(state.phase)}>
          🍅 Reacción −
        </button>
        <button
          type="button"
          onClick={onForceStageEvent}
          disabled={state.phase !== 'incident' || Boolean(state.stage?.activeEvent)}
          title="Fuerza el minijuego del foco roto"
        >
          🎬 Forzar foco roto
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
          <span>ESTADO</span>
          <button type="button" className="text-button text-button--light" onClick={copyState}>
            {copied ? 'copiado' : 'copiar JSON'}
          </button>
        </div>
        <details>
          <summary>Ver estado</summary>
          <pre>{JSON.stringify(snapshot, null, 2)}</pre>
        </details>
      </div>

      <p className="demo-panel__note">
        Atajos de demo para probar cualquier estado.
      </p>
    </aside>
  );
}
