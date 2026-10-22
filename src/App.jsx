import React, { useEffect, useMemo, useReducer, useState } from 'react';
import TitleScreen from './components/TitleScreen.jsx';
import StageView from './components/StageView.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import CrisisPanel from './components/CrisisPanel.jsx';
import IncidentOverlay from './components/IncidentOverlay.jsx';
import EndingScreen from './components/EndingScreen.jsx';
import DemoPanel from './components/DemoPanel.jsx';
import { createInitialState } from './game/initialState.js';
import { gameReducer } from './game/gameReducer.js';
import { INCIDENTS, GENRES, CONTROLS } from './game/storyData.js';
import { getAudienceStats } from './game/audienceEngine.js';
import { getTimerPercent } from './game/gameEngine.js';
import { selectionIsComplete } from './game/narrativeEngine.js';
import {
  playCue,
  previewControl,
  setFxVolume,
  setMuted,
  setVolume,
} from './game/audio.js';

const PHASE_LABEL = {
  title: 'CARTEL',
  briefing: 'PREPARACIÓN',
  incident: 'EN ESCENA',
  resolution: 'RESULTADO',
  crisis: 'CRISIS',
  ending: 'TELÓN FINAL',
};

// Margen para cambiar la última elección antes de ejecutar el combo.
const EXECUTE_GRACE_MS = 2000;

// Mezcla de luces: visual, independiente por fader. El motor solo puntúa la principal.
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
  const [lightMix, setLightMix] = useState(() => ({ ...EMPTY_LIGHT_MIX }));
  const [lastLight, setLastLight] = useState(null);
  const [masterVolume, setMasterVolume] = useState(0.55);
  const [fxVolume, setFxLevel] = useState(0.85);
  const incident = INCIDENTS[state.incidentIndex] || INCIDENTS[0];
  const stats = useMemo(() => getAudienceStats(state.audience), [state.audience]);
  const primaryLight = primaryLightFor(lightMix, lastLight);
  const comboSignature = selectionIsComplete(state.selections)
    ? `${state.selections.lighting}|${state.selections.sound}|${state.selections.object}`
    : null;

  useEffect(() => {
    setMuted(!state.soundEnabled);
  }, [state.soundEnabled]);

  // Cada acto empieza con la mesa de luces a cero.
  useEffect(() => {
    if (state.phase !== 'briefing') return;
    setLightMix({ ...EMPTY_LIGHT_MIX });
    setLastLight(null);
  }, [state.phase, state.incidentIndex]);

  useEffect(() => {
    setVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    setFxVolume(fxVolume);
  }, [fxVolume]);

  useEffect(() => {
    if (state.soundCue?.type) {
      playCue(state.soundCue.type);
    }
  }, [state.soundCue?.id]);

  useEffect(() => {
    const ticking =
      ['incident', 'crisis'].includes(state.phase) &&
      state.timerRunning &&
      !state.demo.paused;
    if (!ticking) return undefined;
    const interval = window.setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => window.clearInterval(interval);
  }, [state.phase, state.timerRunning, state.demo.paused]);

  // Sin botón de improvisar: el combo se ejecuta solo tras la ventana de gracia.
  // Cambiar o soltar un control durante ese margen cancela la cuenta.
  useEffect(() => {
    if (state.phase !== 'incident' || !comboSignature) return undefined;
    const grace = window.setTimeout(
      () => dispatch({ type: 'EXECUTE_COMBO' }),
      EXECUTE_GRACE_MS,
    );
    return () => window.clearTimeout(grace);
  }, [state.phase, comboSignature]);

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

      if (state.phase === 'incident') {
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
  }, [state.phase, state.soundEnabled, state.selections, lightMix]);

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
            paused={state.demo.paused}
            timer={state.timer}
            timerMax={state.timerMax}
            crisis={state.crisis}
            lightMix={lightMix}
            primaryLight={primaryLight}
          />
        </div>
      </main>

      <ControlPanel
        selections={state.selections}
        onSelect={(kind, id) => dispatch({ type: 'SELECT_CONTROL', kind, id })}
        onPreview={handlePreview}
        onLightLevel={selectLight}
        onClear={() => dispatch({ type: 'CLEAR_SELECTION' })}
        active={state.phase === 'incident'}
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

      {state.demo.open ? (
        <DemoPanel
          state={state}
          onClose={toggleDemo}
          onPause={() => dispatch({ type: 'DEMO_TOGGLE_PAUSE' })}
          onSkip={() => dispatch({ type: 'DEMO_SKIP' })}
          onSimulate={(sentiment) => dispatch({ type: 'DEMO_SIMULATE', sentiment })}
          onRestart={() => dispatch({ type: 'DEMO_RESTART' })}
          onToggleSound={toggleSound}
        />
      ) : null}

      <IncidentOverlay
        state={state}
        incident={incident}
        onBegin={() => dispatch({ type: 'BEGIN_INCIDENT' })}
        onContinue={() => dispatch({ type: 'CONTINUE' })}
      />

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
