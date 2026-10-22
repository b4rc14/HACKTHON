import { createInitialState } from './initialState.js';
import { selectionIsComplete } from './narrativeEngine.js';
import {
  advanceAfterResolution,
  beginIncident,
  demoSkip,
  resolveCrisis,
  resolveIncident,
  simulateReaction,
  startShow,
  tickGame,
  useSpecialAction,
} from './gameEngine.js';

const withSound = (state, enabled) => ({
  ...state,
  soundEnabled: enabled,
});

const startWithPreferences = (state) =>
  startShow({
    ...createInitialState(),
    soundEnabled: state.soundEnabled,
    demo: { ...state.demo, open: state.demo.open, paused: false },
  });

const restartWithPreferences = (state) => {
  const fresh = createInitialState();
  return {
    ...fresh,
    soundEnabled: state.soundEnabled,
    demo: { ...fresh.demo, open: state.demo.open },
  };
};

export const gameReducer = (state, action) => {
  switch (action.type) {
    case 'START_GAME':
      return startWithPreferences(state);

    case 'RESTART':
      return restartWithPreferences(state);

    case 'DEMO_RESTART':
      return startWithPreferences(state);

    case 'BEGIN_INCIDENT':
      if (state.phase !== 'briefing') return state;
      return beginIncident(state);

    case 'SELECT_CONTROL': {
      if (state.phase !== 'incident') return state;
      const { kind, id } = action;
      if (!['lighting', 'sound', 'object'].includes(kind)) return state;
      const current = state.selections[kind];
      return {
        ...state,
        selections: {
          ...state.selections,
          [kind]: current === id ? null : id,
        },
      };
    }

    case 'CLEAR_SELECTION':
      if (state.phase !== 'incident') return state;
      return {
        ...state,
        selections: { lighting: null, sound: null, object: null },
      };

    case 'EXECUTE_COMBO': {
      if (state.phase !== 'incident' || !selectionIsComplete(state.selections)) {
        return state;
      }
      return resolveIncident(state, state.selections);
    }

    case 'CONTINUE':
      if (state.phase !== 'resolution') return state;
      return advanceAfterResolution(state);

    case 'TICK':
      return tickGame(state);

    case 'USE_ACTION': {
      if (state.phase === 'crisis') {
        return resolveCrisis(state, action.actionId);
      }
      if (state.phase === 'incident') {
        return useSpecialAction(state, action.actionId);
      }
      return state;
    }

    case 'DEMO_TOGGLE_PANEL': {
      const open = !state.demo.open;
      return {
        ...state,
        demo: {
          ...state.demo,
          open,
          paused: open ? state.demo.paused : false,
        },
      };
    }

    case 'DEMO_TOGGLE_PAUSE': {
      if (!['incident', 'crisis'].includes(state.phase)) return state;
      return {
        ...state,
        demo: { ...state.demo, paused: !state.demo.paused },
      };
    }

    case 'DEMO_SKIP':
      return demoSkip(state);

    case 'DEMO_SIMULATE':
      return simulateReaction(state, action.sentiment);

    case 'TOGGLE_SOUND': {
      const enabled = !state.soundEnabled;
      return withSound(state, enabled);
    }

    case 'SET_SOUND':
      return withSound(state, Boolean(action.enabled));

    default:
      return state;
  }
};

export default gameReducer;
