import { getEventProgress, getEventTargets, getStageEventDef } from './stageEvents.js';
import { clamp, round1 } from './utils.js';

export const createStageState = () => ({
  activeEvent: null,
  eventHistory: [],
  lastEventResult: null,
  lastFeedback: null,
  persistentFx: {
    brokenLight: false,
    sparks: false,
    looseChicken: false,
  },
});

const withCue = (state, type) => ({
  ...state,
  cueCounter: (state.cueCounter || 0) + 1,
  soundCue: { id: (state.cueCounter || 0) + 1, type },
});

const withLog = (state, message) => ({
  ...state,
  debugLog: [
    ...(state.debugLog || []),
    {
      id: (state.debugLog?.length || 0) + 2,
      scene: state.narrative?.sceneCount || 0,
      message,
    },
  ].slice(-30),
});

const pseudoRandom = (seed) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const cloneTargets = (targets) => targets.map((target) => ({ ...target }));

const applyEventEffects = (state, effects) => {
  const groupDeltas = effects.groups || {};
  const groups = Object.fromEntries(
    Object.entries(state.audience.groups).map(([id, group]) => [
      id,
      {
        ...group,
        satisfaction: clamp(group.satisfaction + (groupDeltas[id] || 0)),
        boredom: clamp(group.boredom + (effects.boredom || 0) + (effects.success ? -2 : 2)),
        patience: clamp(group.patience + (effects.success ? 2 : -3)),
      },
    ]),
  );
  return {
    ...state,
    audience: {
      ...state.audience,
      groups,
      discontent: clamp(state.audience.discontent + (effects.discontent || 0)),
    },
    actors: {
      ...state.actors,
      trust: clamp(state.actors.trust + (effects.trust || 0)),
      status:
        state.actors.trust + (effects.trust || 0) >= 68
          ? 'firmes'
          : state.actors.trust + (effects.trust || 0) >= 48
            ? 'tensos'
            : state.actors.trust + (effects.trust || 0) >= 28
              ? 'nerviosos'
              : 'bloqueados',
    },
    narrative: {
      ...state.narrative,
      coherence: clamp(state.narrative.coherence + (effects.coherence || 0)),
    },
    chaos: clamp(state.chaos + (effects.chaos || 0)),
  };
};

export const startStageEvent = (state, eventId) => {
  if (state.stage?.activeEvent) return state;
  const def = getStageEventDef(eventId);
  if (!def || state.phase !== 'incident') return state;

  const event = {
    id: def.id,
    phase: 'active',
    timer: def.timer,
    timerMax: def.timer,
    targets: cloneTargets(def.targets),
    collected: [],
    decoyHits: 0,
    feedback: def.intro,
    act: state.incidentIndex + 1,
    startedAtScene: state.narrative.sceneCount,
  };

  const next = withLog(
    {
      ...state,
      stage: {
        ...createStageState(),
        ...state.stage,
        activeEvent: event,
        lastEventResult: null,
        lastFeedback: def.intro,
        persistentFx: {
          brokenLight: def.id === 'spotlight',
          sparks: def.id === 'cable',
          looseChicken: def.id === 'chicken',
        },
      },
    },
    `Evento técnico: ${def.title}. El reloj de la escena queda en pausa.`,
  );

  return withCue(next, 'alarm');
};

export const maybeStartStageEvent = (state) => {
  if (state.phase !== 'incident' || state.stage?.activeEvent) return state;

  const act = state.incidentIndex;
  const history = state.stage?.eventHistory || [];
  const hasSpotlight = history.some((entry) => entry.id === 'spotlight');
  const hasCable = history.some((entry) => entry.id === 'cable');
  const hasChicken = history.some((entry) => entry.id === 'chicken');

  // Limpia los efectos del acto anterior antes de decidir el nuevo incidente.
  let next = {
    ...state,
    stage: {
      ...state.stage,
      persistentFx: { brokenLight: false, sparks: false, looseChicken: false },
      lastEventResult: null,
      lastFeedback: null,
    },
  };

  // El acto II siempre enseña el minijuego del foco.
  if (act === 1 && !hasSpotlight) {
    return startStageEvent(next, 'spotlight');
  }

  // El acto III puede añadir un segundo accidente técnico. La tirada es
  // determinista para que las pruebas y la demo sean reproducibles.
  if (act >= 2 && !hasCable && !hasChicken) {
    const seed =
      17 +
      state.chaos * 11 +
      state.actors.trust * 7 +
      state.audience.discontent * 5 +
      state.stats.decisions * 19 +
      state.narrative.coherence * 3;
    const roll = pseudoRandom(seed);
    if (roll < 0.72) {
      const pick = pseudoRandom(seed + 4.7);
      return startStageEvent(next, pick < 0.5 ? 'cable' : 'chicken');
    }
  }

  return next;
};

export const collectStageTarget = (state, targetId) => {
  const event = state.stage?.activeEvent;
  if (!event || event.phase !== 'active') return state;
  const target = event.targets.find((item) => item.id === targetId);
  if (!target || event.collected.includes(targetId)) return state;

  if (target.type === 'decoy') {
    const timer = Math.max(0, event.timer - 2);
    const updated = {
      ...event,
      timer,
      decoyHits: event.decoyHits + 1,
      feedback: `¡${target.label}! Pierdes 2 segundos.`,
    };
    let next = {
      ...state,
      stage: {
        ...state.stage,
        activeEvent: updated,
        lastFeedback: updated.feedback,
      },
    };
    next = withCue(next, 'tomato');
    if (timer <= 0) return finishStageEvent(next, false);
    return next;
  }

  const collected = [...event.collected, targetId];
  const targetTotal = getEventTargets(event).length;
  const isComplete = collected.length >= targetTotal;
  const updated = {
    ...event,
    collected,
    feedback: isComplete
      ? '¡Reparación completada!'
      : `${target.label} ${collected.length}/${targetTotal} asegurado.`,
  };
  let next = {
    ...state,
    stage: {
      ...state.stage,
      activeEvent: updated,
      lastFeedback: updated.feedback,
    },
  };
  next = withCue(next, isComplete ? 'applause-soft' : 'click');
  return isComplete ? finishStageEvent(next, true) : next;
};

export const tickStageEvent = (state) => {
  const event = state.stage?.activeEvent;
  if (!event || event.phase !== 'active') return state;
  if (event.timer > 1) {
    return {
      ...state,
      stage: {
        ...state.stage,
        activeEvent: { ...event, timer: event.timer - 1 },
      },
    };
  }
  return finishStageEvent(state, false);
};

export const finishStageEvent = (state, success) => {
  const event = state.stage?.activeEvent;
  if (!event) return state;
  const def = getStageEventDef(event.id);
  if (!def) return state;
  const effects = {
    ...(success ? def.successEffects : def.failEffects),
    success,
  };

  let next = applyEventEffects(state, effects);
  const progress = getEventProgress(event);
  const result = {
    id: def.id,
    title: def.title,
    icon: def.icon,
    success,
    text: success ? def.successText : def.failText,
    effects,
    progress,
    act: event.act,
    collected: event.collected.length,
    targetTotal: progress.total,
    decoyHits: event.decoyHits,
  };

  next = {
    ...next,
    stage: {
      ...next.stage,
      activeEvent: {
        ...event,
        phase: 'result',
        success,
        feedback: result.text,
        effects,
      },
      lastEventResult: result,
      lastFeedback: result.text,
      eventHistory: [
        ...(next.stage.eventHistory || []),
        {
          id: def.id,
          act: event.act,
          success,
          collected: event.collected.length,
          targetTotal: progress.total,
          decoyHits: event.decoyHits,
          text: result.text,
        },
      ],
      persistentFx: success
        ? { brokenLight: false, sparks: false, looseChicken: false }
        : {
            brokenLight: def.id === 'spotlight',
            sparks: def.id === 'cable',
            looseChicken: def.id === 'chicken',
          },
    },
  };

  next = withLog(
    next,
    `Evento ${def.shortTitle}: ${success ? 'reparado' : 'fallido'}. Confianza ${formatEffect(
      effects.trust,
    )}, caos ${formatEffect(effects.chaos)}.`,
  );

  return withCue(next, success ? 'applause' : 'boo');
};

const formatEffect = (value = 0) => {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : String(rounded);
};

export const closeStageEvent = (state) => {
  if (!state.stage?.activeEvent || state.stage.activeEvent.phase !== 'result') return state;
  return {
    ...state,
    stage: {
      ...state.stage,
      activeEvent: null,
    },
  };
};

export const clearStageEventForSkip = (state) => ({
  ...state,
  stage: {
    ...state.stage,
    activeEvent: null,
    persistentFx: { brokenLight: false, sparks: false, looseChicken: false },
  },
});

export const getStageEventSummary = (state) => {
  const event = state.stage?.activeEvent;
  if (event) {
    const def = getStageEventDef(event.id);
    const progress = getEventProgress(event);
    return {
      active: true,
      phase: event.phase,
      title: def?.shortTitle || event.id,
      timer: event.timer,
      success: event.success ?? null,
      progress: round1(progress.percent),
    };
  }
  const last = state.stage?.lastEventResult;
  return last
    ? { active: false, phase: 'idle', title: last.title, success: last.success, progress: 100 }
    : null;
};
