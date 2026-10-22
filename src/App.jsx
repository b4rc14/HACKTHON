import React, { useEffect, useMemo, useReducer } from 'react';
import TitleScreen from './components/TitleScreen.jsx';
import StageView from './components/StageView.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import StatusPanel from './components/StatusPanel.jsx';
import CrisisPanel from './components/CrisisPanel.jsx';
import IncidentOverlay from './components/IncidentOverlay.jsx';
import EndingScreen from './components/EndingScreen.jsx';
import DemoPanel from './components/DemoPanel.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import StageEventOverlay from './components/StageEventOverlay.jsx';
import { createInitialState } from './game/initialState.js';
import { gameReducer } from './game/gameReducer.js';
import { INCIDENTS, GENRES, CONTROLS } from './game/storyData.js';
import { getAudienceStats } from './game/audienceEngine.js';
import { getTimerPercent } from './game/gameEngine.js';
import { selectionIsComplete } from './game/narrativeEngine.js';
import { playCue, previewControl, setMuted } from './game/audio.js';

const PHASE_LABEL = {
  title: 'CARTEL',
  briefing: 'PREPARACIÓN',
  incident: 'EN ESCENA',
  resolution: 'RESULTADO',
  crisis: 'CRISIS',
  ending: 'TELÓN FINAL',
};

function TopBar({ state, incident, onToggleSound, onToggleDemo, onRestart }) {
  const genre = GENRES[state.narrative.dominantGenre];
  const timerPercent = getTimerPercent(state);
  const urgent = ['incident', 'crisis'].includes(state.phase) && state.timer <= 5;

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__mark" aria-hidden="true">✶</span>
        <div>
          <strong>THE SHOW MUST MUTATE</strong>
          <small>Compañía de la Viga Caída</small>
        </div>
      </div>

      <div className="topbar__progress" aria-label="Progreso de la obra">
        {INCIDENTS.map((item, index) => (
          <span
            key={item.id}
            className={[
              'act-dot',
              index < state.incidentIndex ? 'is-done' : '',
              index === state.incidentIndex ? 'is-current' : '',
              state.phase === 'ending' ? 'is-done' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <b>{item.roman}</b>
            <small>{index < state.incidentIndex || state.phase === 'ending' ? '✓' : item.id}</small>
          </span>
        ))}
      </div>

      <div className="topbar__right">
        <span className={`genre-badge genre-badge--${state.narrative.dominantGenre}`}>
          <span aria-hidden="true">{genre.icon}</span> {genre.upper}
        </span>
        <div className={`live-timer ${urgent ? 'is-urgent' : ''} ${state.demo.paused ? 'is-paused' : ''}`}>
          <span>{PHASE_LABEL[state.phase] || state.phase}</span>
          <strong>{state.phase === 'briefing' ? `${state.timer}s` : state.phase === 'resolution' ? '—' : `${state.timer}s`}</strong>
          <i style={{ width: `${state.phase === 'briefing' ? 100 : timerPercent}%` }} />
        </div>
        <div className="topbar__buttons">
          <button
            type="button"
            className={`top-button ${state.demo.open ? 'is-active' : ''}`}
            onClick={onToggleDemo}
            title="Abrir herramientas de demo"
          >
            DEMO
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onToggleSound}
            aria-label={state.soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
            title={state.soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
          >
            {state.soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onRestart}
            aria-label="Volver al inicio y reiniciar"
            title="Volver al inicio y reiniciar"
          >
            ↺
          </button>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const incident = INCIDENTS[state.incidentIndex] || INCIDENTS[0];
  const stats = useMemo(() => getAudienceStats(state.audience), [state.audience]);

  useEffect(() => {
    setMuted(!state.soundEnabled);
  }, [state.soundEnabled]);

  useEffect(() => {
    if (state.soundCue?.type) {
      playCue(state.soundCue.type);
    }
  }, [state.soundCue?.id]);

  useEffect(() => {
    const ticking =
      ['incident', 'crisis'].includes(state.phase) &&
      state.timerRunning &&
      !state.demo.paused &&
      !state.stage?.activeEvent;
    if (!ticking) return undefined;
    const interval = window.setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => window.clearInterval(interval);
  }, [state.phase, state.timerRunning, state.demo.paused, state.stage?.activeEvent]);

  useEffect(() => {
    const event = state.stage?.activeEvent;
    if (!event || event.phase !== 'active' || state.demo.paused) return undefined;
    const interval = window.setInterval(() => dispatch({ type: 'STAGE_EVENT_TICK' }), 1000);
    return () => window.clearInterval(interval);
  }, [state.stage?.activeEvent?.id, state.stage?.activeEvent?.phase, state.demo.paused]);

  useEffect(() => {
    const keyMap = {
      '1': ['lighting', 0],
      '2': ['lighting', 1],
      '3': ['lighting', 2],
      '4': ['sound', 0],
      '5': ['sound', 1],
      '6': ['sound', 2],
      '7': ['object', 0],
      '8': ['object', 1],
      '9': ['object', 2],
    };

    const onKeyDown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const targetTag = event.target?.tagName;
      const onFormControl = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag);

      if (state.phase === 'incident' && !state.stage?.activeEvent) {
        const mapped = keyMap[event.key];
        if (mapped && !onFormControl) {
          const [kind, index] = mapped;
          const control = CONTROLS[kind][index];
          if (control) {
            event.preventDefault();
            dispatch({ type: 'SELECT_CONTROL', kind, id: control.id });
            if (state.soundEnabled) previewControl(kind, control);
          }
          return;
        }
        if (
          (event.key === 'Enter' || (event.key === ' ' && targetTag !== 'BUTTON')) &&
          selectionIsComplete(state.selections)
        ) {
          event.preventDefault();
          dispatch({ type: 'EXECUTE_COMBO' });
        }
        return;
      }

      if (state.phase === 'briefing' && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        dispatch({ type: 'BEGIN_INCIDENT' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.phase, state.selections, state.soundEnabled, state.stage?.activeEvent]);

  const toggleSound = () => {
    const next = !state.soundEnabled;
    setMuted(!next);
    dispatch({ type: 'TOGGLE_SOUND' });
    if (next) playCue('click');
  };

  const toggleDemo = () => {
    playCue('click');
    dispatch({ type: 'DEMO_TOGGLE_PANEL' });
  };

  const restart = () => {
    setMuted(!state.soundEnabled);
    dispatch({ type: 'RESTART' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const start = () => {
    playCue('click');
    dispatch({ type: 'START_GAME' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreview = (kind, control) => {
    if (state.soundEnabled) previewControl(kind, control);
  };

  if (state.phase === 'title') {
    return (
      <div className="app-shell">
        <TitleScreen onStart={start} onToggleSound={toggleSound} soundEnabled={state.soundEnabled} />
        {state.demo.open ? (
          <DemoPanel
            state={state}
            onClose={toggleDemo}
            onPause={() => dispatch({ type: 'DEMO_TOGGLE_PAUSE' })}
            onSkip={() => dispatch({ type: 'DEMO_SKIP' })}
            onSimulate={(sentiment) => dispatch({ type: 'DEMO_SIMULATE', sentiment })}
            onRestart={() => dispatch({ type: 'DEMO_RESTART' })}
            onToggleSound={toggleSound}
            onForceStageEvent={() => dispatch({ type: 'DEMO_STAGE_EVENT' })}
          />
        ) : null}
      </div>
    );
  }

  if (state.phase === 'ending' && state.ending) {
    return (
      <div className="app-shell">
        <EndingScreen
          ending={state.ending}
          onRestart={() => dispatch({ type: 'DEMO_RESTART' })}
          onTitle={restart}
        />
        {state.demo.open ? (
          <DemoPanel
            state={state}
            onClose={toggleDemo}
            onPause={() => dispatch({ type: 'DEMO_TOGGLE_PAUSE' })}
            onSkip={() => dispatch({ type: 'DEMO_SKIP' })}
            onSimulate={(sentiment) => dispatch({ type: 'DEMO_SIMULATE', sentiment })}
            onRestart={() => dispatch({ type: 'DEMO_RESTART' })}
            onToggleSound={toggleSound}
            onForceStageEvent={() => dispatch({ type: 'DEMO_STAGE_EVENT' })}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className={`app-shell app-shell--${state.phase}`}>
      <TopBar
        state={state}
        incident={incident}
        onToggleSound={toggleSound}
        onToggleDemo={toggleDemo}
        onRestart={restart}
      />

      <main className="game-layout">
        <div className="stage-column">
          <StageView
            incident={incident}
            incidentIndex={state.incidentIndex}
            phase={state.phase}
            genre={state.narrative.dominantGenre}
            selections={state.selections}
            result={state.result}
            audience={state.audience}
            stats={stats}
            actors={state.actors}
            lastReaction={state.audience.lastReaction}
            lastCrisisOutcome={state.lastCrisisOutcome}
            paused={state.demo.paused}
            timer={state.timer}
            timerMax={state.timerMax}
            crisis={state.crisis}
            stage={state.stage}
          />
        </div>

        <aside className="cabina-column">
          <ControlPanel
            selections={state.selections}
            onSelect={(kind, id) => dispatch({ type: 'SELECT_CONTROL', kind, id })}
            onPreview={handlePreview}
            onExecute={() => dispatch({ type: 'EXECUTE_COMBO' })}
            onClear={() => dispatch({ type: 'CLEAR_SELECTION' })}
            active={state.phase === 'incident' && !state.stage?.activeEvent}
            phase={state.phase}
            fallbackGenre={state.narrative.dominantGenre}
            timer={state.timer}
            incident={incident}
            audience={state.audience}
            stats={stats}
            lastReaction={state.audience.lastReaction}
            stage={state.stage}
          />
          {state.phase === 'incident' ? (
            <CrisisPanel
              state={state}
              mode="inline"
              onAction={(actionId) => dispatch({ type: 'USE_ACTION', actionId })}
            />
          ) : null}
          <div className="cabina-note">
            <span className="panel-kicker">REGLA DE ORO</span>
            <p>
              No hay combinación perfecta. Si repites, el público se aburre. Si cambias de género,
              necesitas un puente con lo anterior.
            </p>
            <span className="cabina-note__genre" style={{ color: GENRES[state.narrative.dominantGenre].color }}>
              {GENRES[state.narrative.dominantGenre].tagline}
            </span>
          </div>
          <HistoryPanel state={state} />
        </aside>

        <StatusPanel state={state} incident={incident} stats={stats} result={state.result} />
      </main>

      <footer className="app-footer">
        <span>THE SHOW MUST MUTATE · v0.1 · Hackathon build</span>
        <span>1–9: elegir · ENTER: improvisar · DEMO: probar · REPETIR: mala idea</span>
      </footer>

      {state.demo.open ? (
        <DemoPanel
          state={state}
          onClose={toggleDemo}
          onPause={() => dispatch({ type: 'DEMO_TOGGLE_PAUSE' })}
          onSkip={() => dispatch({ type: 'DEMO_SKIP' })}
          onSimulate={(sentiment) => dispatch({ type: 'DEMO_SIMULATE', sentiment })}
          onRestart={() => dispatch({ type: 'DEMO_RESTART' })}
          onToggleSound={toggleSound}
          onForceStageEvent={() => dispatch({ type: 'DEMO_STAGE_EVENT' })}
        />
      ) : null}

      <IncidentOverlay
        state={state}
        incident={incident}
        onBegin={() => dispatch({ type: 'BEGIN_INCIDENT' })}
        onContinue={() => dispatch({ type: 'CONTINUE' })}
      />

      {state.stage?.activeEvent ? (
        <StageEventOverlay
          state={state}
          event={state.stage.activeEvent}
          onCollect={(targetId) => dispatch({ type: 'STAGE_EVENT_COLLECT', targetId })}
          onClose={() => dispatch({ type: 'STAGE_EVENT_CLOSE' })}
        />
      ) : null}

      {state.phase === 'crisis' ? (
        <CrisisPanel
          state={state}
          mode="modal"
          onAction={(actionId) => dispatch({ type: 'USE_ACTION', actionId })}
        />
      ) : null}
    </div>
  );
}
