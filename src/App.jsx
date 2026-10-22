import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import TitleScreen from './components/TitleScreen.jsx';
import StageView from './components/StageView.jsx';
import AudienceTheater from './components/AudienceTheater.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import CrisisPanel from './components/CrisisPanel.jsx';
import IncidentOverlay from './components/IncidentOverlay.jsx';
import EndingScreen from './components/EndingScreen.jsx';
import DemoPanel from './components/DemoPanel.jsx';
import StageEventOverlay from './components/StageEventOverlay.jsx';
import SceneInterlude from './components/SceneInterlude.jsx';
import { createInitialState } from './game/initialState.js';
import { gameReducer } from './game/gameReducer.js';
import { INCIDENTS, GENRES, CONTROLS } from './game/storyData.js';
import { getAudienceStats } from './game/audienceEngine.js';
import { getTimerPercent } from './game/gameEngine.js';
import { selectionIsComplete } from './game/narrativeEngine.js';
import {
  playCue,
  previewControl,
  setCrowdLevel,
  setFxVolume,
  setMuted,
  setVolume,
  startCrowdAmbience,
  stopCrowdAmbience,
} from './game/audio.js';

const PHASE_LABEL = {
  title: 'CARTEL',
  briefing: 'PREPARACIÓN',
  incident: 'EN ESCENA',
  resolution: 'RESULTADO',
  crisis: 'CRISIS',
  ending: 'TELÓN FINAL',
};

const EXECUTE_GRACE_MS = 2000;
const LIGHT_IDS = CONTROLS.lighting.map((control) => control.id);
const EMPTY_LIGHT_MIX = Object.fromEntries(LIGHT_IDS.map((id) => [id, 0]));

const primaryLightFor = (mix, last) => {
  const levels = LIGHT_IDS.map((id) => Number(mix?.[id]) || 0);
  const top = Math.max(0, ...levels);
  if (top <= 0) return null;
  const tied = LIGHT_IDS.filter((id) => (Number(mix?.[id]) || 0) === top);
  return tied.includes(last) ? last : tied[0];
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
  const [showResult, setShowResult] = useState(true);
  const [lightMix, setLightMix] = useState(() => ({ ...EMPTY_LIGHT_MIX }));
  const [lastLight, setLastLight] = useState(null);
  const [masterVolume, setMasterVolume] = useState(0.55);
  const [fxVolume, setFxLevel] = useState(0.85);
  const incident = INCIDENTS[state.incidentIndex] || INCIDENTS[0];
  const stats = useMemo(() => getAudienceStats(state.audience), [state.audience]);
  const primaryLight = primaryLightFor(lightMix, lastLight);
  const stageEventActive = Boolean(state.stage?.activeEvent);
  const comboSignature = selectionIsComplete(state.selections)
    ? `${state.selections.lighting}|${state.selections.sound}|${state.selections.object}`
    : null;
  const handlePersonGone = useCallback((personId) => {
    dispatch({ type: 'PERSON_GONE', personId });
  }, []);

  useEffect(() => {
    if (state.phase !== 'resolution' || !state.result || state.result.crisisResolved) {
      setShowResult(true);
      return undefined;
    }
    setShowResult(false);
    const timer = window.setTimeout(() => setShowResult(true), 2800);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.narrative.sceneCount, state.result?.crisisResolved]);

  useEffect(() => {
    setMuted(!state.soundEnabled);
  }, [state.soundEnabled]);

  useEffect(() => {
    setVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    setFxVolume(fxVolume);
  }, [fxVolume]);

  useEffect(() => {
    if (state.phase !== 'briefing') return undefined;
    setLightMix({ ...EMPTY_LIGHT_MIX });
    setLastLight(null);
    return undefined;
  }, [state.phase, state.incidentIndex]);

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
      !stageEventActive;
    if (!ticking) return undefined;
    const interval = window.setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => window.clearInterval(interval);
  }, [state.phase, state.timerRunning, state.demo.paused, stageEventActive]);

  useEffect(() => {
    const event = state.stage?.activeEvent;
    if (!event || event.phase !== 'active' || state.demo.paused) return undefined;
    const interval = window.setInterval(() => dispatch({ type: 'STAGE_EVENT_TICK' }), 1000);
    return () => window.clearInterval(interval);
  }, [state.stage?.activeEvent?.id, state.stage?.activeEvent?.phase, state.demo.paused]);

  useEffect(() => {
    if (state.soundEnabled && !['title', 'ending'].includes(state.phase)) {
      startCrowdAmbience();
    } else {
      stopCrowdAmbience();
    }
  }, [state.soundEnabled, state.phase]);

  useEffect(() => {
    if (!state.soundEnabled || ['title', 'ending'].includes(state.phase)) return;
    const phaseIntensity = state.phase === 'briefing' ? 0.35 : state.phase === 'crisis' ? 1 : 0.8;
    setCrowdLevel({
      intensity: phaseIntensity + (100 - stats.averageSatisfaction) / 260,
      brightness: 0.35 + stats.averageSatisfaction / 160,
    });
  }, [state.soundEnabled, state.phase, stats.averageSatisfaction, state.audience.discontent]);

  useEffect(
    () => () => {
      stopCrowdAmbience();
    },
    [],
  );

  useEffect(() => {
    if (state.phase !== 'incident' || stageEventActive || !comboSignature) return undefined;
    const grace = window.setTimeout(
      () => dispatch({ type: 'EXECUTE_COMBO' }),
      EXECUTE_GRACE_MS,
    );
    return () => window.clearTimeout(grace);
  }, [state.phase, stageEventActive, comboSignature]);

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

      if (state.phase === 'incident' && !stageEventActive) {
        const mapped = keyMap[event.key];
        if (mapped && !onFormControl) {
          const [kind, index] = mapped;
          const control = CONTROLS[kind][index];
          if (control) {
            event.preventDefault();
            if (kind === 'lighting') {
              const currentLevel = lightMix?.[control.id] || 0;
              selectLight(control.id, currentLevel > 0 ? 0 : 100);
            } else {
              dispatch({ type: 'SELECT_CONTROL', kind, id: control.id });
            }
            if (state.soundEnabled) previewControl(kind, control);
          }
          return;
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
  }, [state.phase, state.soundEnabled, state.selections, lightMix, stageEventActive]);

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

  const selectLight = (id, value) => {
    const next = Math.max(0, Math.min(100, Number(value) || 0));
    const nextMix = { ...lightMix, [id]: next };
    setLightMix(nextMix);
    setLastLight(id);
    const nextPrimary = primaryLightFor(nextMix, id);
    if (nextPrimary !== state.selections.lighting) {
      dispatch({ type: 'SELECT_CONTROL', kind: 'lighting', id: nextPrimary });
    }
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
    <div className={`app-shell app-shell--${state.phase} app-shell--console`}>
      <TopBar
        state={state}
        incident={incident}
        onToggleSound={toggleSound}
        onToggleDemo={toggleDemo}
        onRestart={restart}
      />

      <main className="theater-layout">
        <div className="stage-zone">
          <StageView
            incident={incident}
            incidentIndex={state.incidentIndex}
            phase={state.phase}
            genre={state.narrative.dominantGenre}
            selections={state.selections}
            result={state.result}
            actors={state.actors}
            lastReaction={state.audience.lastReaction}
            paused={state.demo.paused}
            timer={state.timer}
            timerMax={state.timerMax}
            crisis={state.crisis}
            stage={state.stage}
            lightIntensity={primaryLight ? lightMix[primaryLight] : 0}
            lightMix={lightMix}
            primaryLight={primaryLight}
          />
        </div>

        <AudienceTheater
          people={state.audience.people}
          stats={stats}
          phase={state.phase}
          coherence={state.narrative.coherence}
          lastReaction={state.audience.lastReaction}
          onGone={handlePersonGone}
        />

        <section className="desk-stack">
          <ControlPanel
            selections={state.selections}
            onSelect={(kind, id) => dispatch({ type: 'SELECT_CONTROL', kind, id })}
            onPreview={handlePreview}
            onLightLevel={selectLight}
            onClear={() => dispatch({ type: 'CLEAR_SELECTION' })}
            active={state.phase === 'incident' && !stageEventActive}
            phase={state.phase}
            fallbackGenre={state.narrative.dominantGenre}
            timer={state.timer}
            timerMax={state.timerMax}
            graceMs={EXECUTE_GRACE_MS}
            lightMix={lightMix}
            primaryLight={primaryLight}
            masterVolume={masterVolume}
            onMasterVolume={setMasterVolume}
            fxVolume={fxVolume}
            onFxVolume={setFxLevel}
          >
            {state.phase === 'incident' ? (
              <CrisisPanel
                state={state}
                mode="inline"
                onAction={(actionId) => dispatch({ type: 'USE_ACTION', actionId })}
              />
            ) : null}
          </ControlPanel>
        </section>
      </main>

      <footer className="app-footer">
        <span>THE SHOW MUST MUTATE · v0.1 · Hackathon build</span>
        <span>1–9: elegir · 3/3 → 2 s · DEMO: probar</span>
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

      {state.phase === 'resolution' && state.result && !showResult ? (
        <SceneInterlude
          incident={incident}
          result={state.result}
          onSkip={() => setShowResult(true)}
        />
      ) : null}

      {!(state.phase === 'resolution' && !showResult) ? (
        <IncidentOverlay
          state={state}
          incident={incident}
          onBegin={() => dispatch({ type: 'BEGIN_INCIDENT' })}
          onContinue={() => dispatch({ type: 'CONTINUE' })}
        />
      ) : null}

      {state.stage?.activeEvent ? (
        <StageEventOverlay
          key={state.stage.activeEvent.id}
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
