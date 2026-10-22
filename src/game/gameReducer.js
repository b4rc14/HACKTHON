import { createInitialState } from './initialState.js';
import { selectionIsComplete } from './narrativeEngine.js';
import { personGone } from './audienceEngine.js';
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
import {
  clearStageEventForSkip,
  closeStageEvent,
  collectStageTarget,
  maybeStartStageEvent,
  startStageEvent,
  tickStageEvent,
} from './stageEventEngine.js';

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

const stageEventBlocksControls = (state) => Boolean(state.stage?.activeEvent);

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
      return maybeStartStageEvent(beginIncident(state));

    case 'SELECT_CONTROL': {
      if (state.phase !== 'incident' || stageEventBlocksControls(state)) return state;
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
      if (state.phase !== 'incident' || stageEventBlocksControls(state)) return state;
      return {
        ...state,
        selections: { lighting: null, sound: null, object: null },
      };

    case 'EXECUTE_COMBO': {
      if (
        state.phase !== 'incident' ||
        stageEventBlocksControls(state) ||
        !selectionIsComplete(state.selections)
      ) {
        return state;
      }
      return resolveIncident(state, state.selections);
    }

    case 'CONTINUE':
      if (state.phase !== 'resolution') return state;
      return advanceAfterResolution(state);

    case 'TICK':
      if (stageEventBlocksControls(state)) return state;
      return tickGame(state);

    case 'USE_ACTION': {
      if (stageEventBlocksControls(state)) return state;
      if (state.phase === 'crisis') {
        return resolveCrisis(state, action.actionId);
      }
      if (state.phase === 'incident') {
        return useSpecialAction(state, action.actionId);
      }
      return state;
    }

    case 'STAGE_EVENT_TICK':
      return tickStageEvent(state);

    case 'STAGE_EVENT_COLLECT':
      return collectStageTarget(state, action.targetId);

    case 'STAGE_EVENT_CLOSE':
      return closeStageEvent(state);

    case 'DEMO_STAGE_EVENT': {
      if (state.phase !== 'incident' || stageEventBlocksControls(state)) return state;
      return startStageEvent(state, action.eventId || 'spotlight');
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

    case 'DEMO_SKIP': {
      const next = demoSkip(state);
      return clearStageEventForSkip(next);
    }

    case 'DEMO_SIMULATE':
      return simulateReaction(state, action.sentiment);

    case 'TOGGLE_SOUND': {
      const enabled = !state.soundEnabled;
      return withSound(state, enabled);
    }

    case 'SET_SOUND':
      return withSound(state, Boolean(action.enabled));

    case 'SET_INTENSITY': {
      if (!['light', 'sound'].includes(action.kind)) return state;
      const value = Math.max(0, Math.min(100, Number(action.value) || 0));
      return {
        ...state,
        desk: {
          ...state.desk,
          [`${action.kind}Intensity`]: value,
        },
      };
    }

    case 'PERSON_GONE':
      return personGone(state, action.personId);

    default:
      return state;
  }
};

export default gameReducer;
