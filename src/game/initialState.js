import { INCIDENTS } from './storyData.js';
import { createAudience } from './audienceModel.js';
import { createStageState } from './stageEventEngine.js';

export const createInitialState = () => ({
  version: 1,
  // title | briefing | incident | resolution | crisis | ending
  phase: 'title',
  incidentIndex: 0,
  timer: INCIDENTS[0].timer,
  timerMax: INCIDENTS[0].timer,
  timerRunning: false,
  nextTimerBonus: 0,
  selections: {
    lighting: null,
    sound: null,
    object: null,
  },
  audience: createAudience(),
  narrative: {
    genreScores: {
      romance: 14,
      comedy: 5,
      scifi: 3,
    },
    dominantGenre: 'romance',
    coherence: 68,
    history: [],
    establishedTags: ['romance', 'music', 'intimate'],
    sceneCount: 0,
    title: null,
  },
  actors: {
    trust: 80,
    glitches: 0,
    status: 'firmes',
    lastLine: 'Lía y Bruno esperan la primera indicación.',
  },
  desk: {
    lightIntensity: 76,
    soundIntensity: 68,
  },
  stage: createStageState(),
  chaos: 18,
  improv: 3,
  cooldowns: {
    dialogue: 0,
    pacing: 0,
    engage: 0,
    curtain: 0,
  },
  result: null,
  pendingCrisis: null,
  crisis: null,
  crisisResolved: false,
  lastCrisisOutcome: null,
  demo: {
    open: false,
    paused: false,
    simCount: 0,
    skipped: 0,
  },
  soundEnabled: true,
  soundCue: null,
  cueCounter: 0,
  debugLog: [
    {
      id: 1,
      scene: 0,
      message: 'Estado inicial creado. La función espera entre bambalinas.',
    },
  ],
  ending: null,
  stats: {
    decisions: 0,
    timeouts: 0,
    crises: 0,
    reactionsPositive: 0,
    reactionsNegative: 0,
    curtains: 0,
  },
});

export default createInitialState;
