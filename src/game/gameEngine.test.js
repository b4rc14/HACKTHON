import { describe, expect, it } from 'vitest';
import { createInitialState } from './initialState.js';
import { getAudienceStats } from './audienceEngine.js';
import {
  advanceAfterResolution,
  beginIncident,
  demoSkip,
  resolveCrisis,
  resolveIncident,
  simulateReaction,
  startShow,
  tickGame,
} from './gameEngine.js';

const ROMANCE = { lighting: 'warm', sound: 'romantic', object: 'flowers' };
const COMEDY = { lighting: 'comic', sound: 'comic', object: 'chicken' };
const SCIFI = { lighting: 'scifi', sound: 'space', object: 'ufo' };
const COLLAGE = [
  { lighting: 'scifi', sound: 'space', object: 'ufo' },
  { lighting: 'comic', sound: 'comic', object: 'chicken' },
  { lighting: 'warm', sound: 'romantic', object: 'flowers' },
];

const playRun = (choices) => {
  let state = startShow(createInitialState());
  for (let act = 0; act < 3; act += 1) {
    state = beginIncident(state);
    state = resolveIncident(state, choices[act].selection, {
      timedOut: Boolean(choices[act].timeout),
    });
    if (state.pendingCrisis && !state.crisisResolved) {
      state = advanceAfterResolution(state);
      expect(state.phase).toBe('crisis');
      state = resolveCrisis(state, state.improv > 0 ? 'dialogue' : 'wait');
      expect(state.phase).toBe('resolution');
      expect(state.crisisResolved).toBe(true);
    }
    state = advanceAfterResolution(state);
  }
  return state;
};

describe('motor de juego', () => {
  it('empieza en el cartel y prepara el acto I sin arrancar el reloj', () => {
    const title = createInitialState();
    expect(title.phase).toBe('title');
    const started = startShow(title);
    expect(started.phase).toBe('briefing');
    expect(started.timer).toBe(20);
    expect(started.timerRunning).toBe(false);
    const playing = beginIncident(started);
    expect(playing.phase).toBe('incident');
    expect(playing.timerRunning).toBe(true);
  });

  it('una combinación de ciencia ficción inclina la escena y actualiza la memoria', () => {
    let state = beginIncident(startShow(createInitialState()));
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
    let state = beginIncident(startShow(createInitialState()));
    state = { ...state, timer: 1 };
    state = tickGame(state);
    expect(state.phase).toBe('resolution');
    expect(state.result.timedOut).toBe(true);
    expect(state.timerRunning).toBe(false);
    state = advanceAfterResolution(state);
    if (state.phase === 'crisis') {
      state = resolveCrisis(state, 'wait');
    }
    state = advanceAfterResolution(state);
    expect(['briefing', 'ending']).toContain(state.phase);
  });

  it('repetir la misma combinación penaliza y provoca una reacción negativa', () => {
    let state = beginIncident(startShow(createInitialState()));
    state = resolveIncident(state, COMEDY);
    state = advanceAfterResolution(state);
    if (state.phase === 'crisis') state = resolveCrisis(state, 'wait');
    if (state.phase === 'resolution') state = advanceAfterResolution(state);
    state = beginIncident(state);
    state = resolveIncident(state, COMEDY);
    expect(state.result.repeatedCombo).toBe(true);
    expect(state.result.coherenceDelta).toBeLessThan(0);
    expect(['boo', 'tomatoes']).toContain(state.result.reaction.type);
  });

  it('abre y resuelve una crisis con los protocolos', () => {
    let state = beginIncident(startShow(createInitialState()));
    state = resolveIncident(state, COMEDY);
    if (state.pendingCrisis) {
      state = advanceAfterResolution(state);
      if (state.phase === 'crisis') state = resolveCrisis(state, 'wait');
    }
    if (state.phase === 'resolution') state = advanceAfterResolution(state);
    if (state.phase === 'briefing') state = beginIncident(state);
    state = resolveIncident(state, COMEDY);
    expect(state.pendingCrisis).toBeTruthy();
    state = advanceAfterResolution(state);
    expect(state.phase).toBe('crisis');
    const before = state.actors.trust;
    state = resolveCrisis(state, state.improv > 0 ? 'dialogue' : 'wait');
    expect(state.phase).toBe('resolution');
    expect(state.crisisResolved).toBe(true);
    expect(state.stats.crises).toBeGreaterThan(0);
    if (state.lastCrisisOutcome.actionId === 'dialogue') {
      expect(state.actors.trust).toBeGreaterThanOrEqual(before);
    }
  });

  it('permite terminar una partida y genera el cartel final', () => {
    const state = playRun(
      COLLAGE.map((selection) => ({ selection })),
    );
    expect(state.phase).toBe('ending');
    expect(state.ending).toBeTruthy();
    expect(state.ending.title.length).toBeGreaterThan(0);
    expect(state.ending.summary).toHaveLength(3);
    expect(state.ending.summary.every((entry) => entry.reaction !== 'Sin reacción registrada')).toBe(true);
    expect(state.ending.metrics.remaining).toBeLessThanOrEqual(60);
    expect(state.ending.meta.id).toBe('comercial');
  });

  it('genera finales distintos según la estrategia y la gestión del público', () => {
    const commercial = playRun(COLLAGE.map((selection) => ({ selection })));
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

    expect(commercial.ending.meta.id).toBe('comercial');
    expect(cult.ending.meta.id).toBe('culto');
    expect(chaos.ending.meta.id).toBe('caos');
    expect(failure.ending.meta.id).toBe('fracaso');
    expect(new Set([commercial.ending.title, cult.ending.title, chaos.ending.title]).size).toBeGreaterThan(1);
  });

  it('el modo demo permite simular una reacción positiva y otra negativa', () => {
    let state = beginIncident(startShow(createInitialState()));
    state = simulateReaction(state, 'positive');
    expect(state.audience.lastReaction.tone).toBe('positive');
    expect(state.audience.lastReaction.simulated).toBe(true);
    state = simulateReaction(state, 'negative');
    expect(state.audience.lastReaction.tone).toBe('negative');
    expect(state.audience.reactionHistory.length).toBe(2);
  });

  it('el salto de demo avanza sin dejar fases huérfanas', () => {
    let state = beginIncident(startShow(createInitialState()));
    state = demoSkip(state);
    expect(state.phase).toBe('briefing');
    expect(state.incidentIndex).toBe(1);
    state = demoSkip(state);
    expect(state.phase).toBe('briefing');
    expect(state.incidentIndex).toBe(2);
    state = demoSkip(state);
    expect(state.phase).toBe('ending');
  });
});
