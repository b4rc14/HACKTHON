import { describe, expect, it } from 'vitest';
import { createInitialState } from './initialState.js';
import { gameReducer } from './gameReducer.js';
import { getAudienceStats } from './audienceEngine.js';
import {
  advanceAfterResolution,
  finishShow,
  resolveCrisis,
  resolveIncident,
  simulateReaction,
  startShow,
  tickGame,
} from './gameEngine.js';

const ROMANCE = { lighting: 'warm', sound: 'romantic', object: 'flowers' };
const COMEDY = { lighting: 'comic', sound: 'comic', object: 'chicken' };
const SCIFI = { lighting: 'scifi', sound: 'space', object: 'ufo' };

const closeScene = (state) => {
  let next = state;
  if (next.phase === 'resolution') {
    if (next.pendingCrisis && !next.crisisResolved) {
      next = advanceAfterResolution(next);
      if (next.phase === 'crisis') {
        next = resolveCrisis(next, next.improv > 0 ? 'dialogue' : 'wait');
      }
    }
    next = advanceAfterResolution(next);
  }
  return next;
};

const playRun = (choices) => {
  let state = startShow(createInitialState(), { seed: 1 });
  for (let scene = 0; scene < 5; scene += 1) {
    if (state.phase !== 'incident') break;
    const choice = choices[scene % choices.length];
    state = resolveIncident(state, choice.selection, {
      timedOut: Boolean(choice.timeout),
    });
    state = closeScene(state);
  }
  if (state.phase !== 'ending') state = finishShow(state);
  return state;
};

describe('motor de juego continuo', () => {
  it('empieza directamente en escena y con el reloj de función en marcha', () => {
    const title = createInitialState();
    expect(title.phase).toBe('title');
    const started = startShow(title, { seed: 1 });
    expect(started.phase).toBe('incident');
    expect(started.timer).toBe(20);
    expect(started.timerRunning).toBe(true);
    expect(started.showTimer).toBe(180);
    expect(started.sceneOrder.length).toBeGreaterThan(0);
  });

  it('una combinación de ciencia ficción inclina la escena y actualiza la memoria', () => {
    let state = startShow(createInitialState(), { seed: 1 });
    state = resolveIncident(state, SCIFI);
    expect(state.phase).toBe('resolution');
    expect(state.result.dominantGenre).toBe('scifi');
    expect(state.result.reaction.label).toBeTruthy();
    expect(state.result.reaction.icon).toBeTruthy();
    expect(state.narrative.establishedTags).toContain('alien');
    expect(state.narrative.establishedTags).not.toContain('dinosaur');
    const stats = getAudienceStats(state.audience);
    expect(stats.total).toBe(60);
    expect(stats.averageSatisfaction).toBeGreaterThan(0);
  });

  it('el tiempo agotado resuelve la escena y nunca deja el juego bloqueado', () => {
    let state = startShow(createInitialState(), { seed: 1 });
    state = { ...state, timer: 1 };
    state = tickGame(state);
    expect(state.phase).toBe('resolution');
    expect(state.result.timedOut).toBe(true);
    expect(state.timerRunning).toBe(false);
    state = advanceAfterResolution(state);
    expect(['incident', 'ending']).toContain(state.phase);
  });

  it('repetir la misma combinación penaliza y provoca una reacción negativa', () => {
    let state = startShow(createInitialState(), { seed: 1 });
    state = resolveIncident(state, COMEDY);
    state = closeScene(state);
    expect(state.phase).toBe('incident');
    state = resolveIncident(state, COMEDY);
    expect(state.result.repeatedCombo).toBe(true);
    expect(state.result.coherenceDelta).toBeLessThan(0);
    expect(['boo', 'tomatoes']).toContain(state.result.reaction.type);
  });

  it('abre y resuelve una crisis con los protocolos', () => {
    let state = startShow(createInitialState(), { seed: 1 });
    state = resolveIncident(state, COMEDY);
    if (state.pendingCrisis) {
      state = advanceAfterResolution(state);
      if (state.phase === 'crisis') {
        const before = state.actors.trust;
        state = resolveCrisis(state, state.improv > 0 ? 'dialogue' : 'wait');
        expect(state.phase).toBe('resolution');
        expect(state.crisisResolved).toBe(true);
        expect(state.stats.crises).toBeGreaterThan(0);
        if (state.lastCrisisOutcome.actionId === 'dialogue') {
          expect(state.actors.trust).toBeGreaterThanOrEqual(before);
        }
      }
    } else {
      expect(state.result).toBeTruthy();
    }
  });

  it('permite terminar una partida y genera el cartel final', () => {
    const state = playRun([
      { selection: SCIFI },
      { selection: COMEDY },
      { selection: ROMANCE },
    ]);
    expect(state.phase).toBe('ending');
    expect(state.ending).toBeTruthy();
    expect(state.ending.title.length).toBeGreaterThan(0);
    expect(state.ending.summary.length).toBeGreaterThan(0);
    expect(state.ending.metrics.remaining).toBeLessThanOrEqual(60);
  });

  it('genera finales distintos según la estrategia y la gestión del público', () => {
    const commercial = playRun([
      { selection: SCIFI },
      { selection: COMEDY },
      { selection: ROMANCE },
    ]);
    const cult = playRun([
      { selection: SCIFI, timeout: true },
      { selection: COMEDY },
      { selection: ROMANCE },
    ]);
    const chaos = playRun([
      { selection: COMEDY },
      { selection: SCIFI },
      { selection: COMEDY },
    ]);
    const failure = playRun([
      { selection: ROMANCE },
      { selection: ROMANCE },
      { selection: ROMANCE },
    ]);
    const ids = [commercial, cult, chaos, failure].map((state) => state.ending.meta.id);
    expect(ids.every((id) => ['comercial', 'culto', 'caos', 'fracaso'].includes(id))).toBe(true);
    expect(new Set(ids).size).toBeGreaterThan(1);
  });

  it('el modo demo permite simular una reacción positiva y otra negativa', () => {
    let state = startShow(createInitialState(), { seed: 1 });
    state = simulateReaction(state, 'positive');
    expect(state.audience.lastReaction.tone).toBe('positive');
    expect(state.audience.lastReaction.simulated).toBe(true);
    state = simulateReaction(state, 'negative');
    expect(state.audience.lastReaction.tone).toBe('negative');
    expect(state.audience.reactionHistory.length).toBe(2);
  });

  it('el salto de demo avanza sin dejar fases huérfanas', () => {
    let state = startShow(createInitialState(), { seed: 1 });
    state = gameReducer(state, { type: 'DEMO_SKIP' });
    expect(['incident', 'ending']).toContain(state.phase);
    expect(state.incidentIndex).toBe(1);
    state = gameReducer({ ...state, showTimer: 0 }, { type: 'TICK' });
    expect(state.phase).toBe('ending');
  });
});
