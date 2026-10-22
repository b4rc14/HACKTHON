import { INCIDENTS } from './storyData.js';

const group = (id, name, share, count, satisfaction, boredom) => ({
  id,
  name,
  share,
  count,
  satisfaction,
  boredom,
  patience: 100,
  walkouts: 0,
  reactions: [],
});

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
  audience: {
    groups: {
      romantics: group('romantics', 'Románticos', 0.4, 24, 61, 12),
      chaos: group('chaos', 'Amantes del caos', 0.35, 21, 63, 9),
      critics: group('critics', 'Críticos', 0.25, 15, 57, 15),
    },
    initialTotal: 60,
    discontent: 12,
    lastReaction: null,
    reactionHistory: [],
    ovation: false,
    bisRequested: false,
    walkouts: 0,
  },
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
