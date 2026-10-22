// Simulador de balance rápido para el equipo. No forma parte del bundle.
// Uso: node scripts/simulate.mjs
import { createInitialState } from '../src/game/initialState.js';
import {
  startShow,
  beginIncident,
  resolveIncident,
  advanceAfterResolution,
  resolveCrisis,
} from '../src/game/gameEngine.js';

const runs = {
  romance: [
    { lighting: 'warm', sound: 'romantic', object: 'flowers' },
    { lighting: 'warm', sound: 'romantic', object: 'flowers' },
    { lighting: 'warm', sound: 'romantic', object: 'flowers' },
  ],
  scifi: [
    { lighting: 'scifi', sound: 'space', object: 'ufo' },
    { lighting: 'scifi', sound: 'space', object: 'ufo' },
    { lighting: 'scifi', sound: 'space', object: 'ufo' },
  ],
  collage: [
    { lighting: 'scifi', sound: 'space', object: 'ufo' },
    { lighting: 'comic', sound: 'comic', object: 'chicken' },
    { lighting: 'warm', sound: 'romantic', object: 'flowers' },
  ],
  mutation: [
    { lighting: 'scifi', sound: 'space', object: 'ufo' },
    { lighting: 'scifi', sound: 'comic', object: 'chicken' },
    { lighting: 'warm', sound: 'romantic', object: 'flowers' },
  ],
  mixed: [
    { lighting: 'warm', sound: 'space', object: 'chicken' },
    { lighting: 'comic', sound: 'romantic', object: 'flowers' },
    { lighting: 'scifi', sound: 'romantic', object: 'flowers' },
  ],
  chaotic: [
    { lighting: 'comic', sound: 'comic', object: 'chicken' },
    { lighting: 'scifi', sound: 'space', object: 'ufo' },
    { lighting: 'comic', sound: 'romantic', object: 'chicken' },
  ],
  bad: [
    { lighting: 'comic', sound: 'comic', object: 'chicken' },
    { lighting: 'comic', sound: 'comic', object: 'chicken' },
    { lighting: 'comic', sound: 'comic', object: 'chicken' },
  ],
  timeouts: [
    { lighting: 'scifi', sound: 'space', object: 'ufo', timeout: true },
    { lighting: 'comic', sound: 'comic', object: 'chicken' },
    { lighting: 'warm', sound: 'romantic', object: 'flowers' },
  ],
};

const play = (choices) => {
  let state = startShow(createInitialState());
  const log = [];
  for (let act = 0; act < 3; act += 1) {
    state = beginIncident(state);
    state = resolveIncident(state, choices[act], { timedOut: Boolean(choices[act].timeout) });
    log.push({
      act: act + 1,
      genre: state.result.dominantGenre,
      headline: state.result.headline,
      reaction: state.result.reaction.type,
      coherence: state.result.newCoherence,
      trust: state.result.trustAfter,
      avg: Math.round(state.result.audienceAfter.averageSatisfaction),
      crisis: state.pendingCrisis?.title || null,
    });
    if (state.pendingCrisis && !state.crisisResolved) {
      state = advanceAfterResolution(state);
      state = resolveCrisis(state, state.improv > 0 ? 'dialogue' : 'wait');
    }
    state = advanceAfterResolution(state);
  }
  return { state, log };
};

for (const [name, choices] of Object.entries(runs)) {
  const { state, log } = play(choices);
  console.log(`\n=== ${name} ===`);
  console.log(log);
  console.log(state.ending.meta.label, state.ending.title, state.ending.score, state.ending.metrics);
}
