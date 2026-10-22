import { CRISIS_ACTIONS, CRISIS_TYPES, REACTION_META } from './storyData.js';
import { clamp, formatSigned } from './utils.js';
import {
  applyQualityToPeople,
  getAudienceStats,
  markLowestLeaving,
  markPersonGone,
  qualityFromEvaluation,
} from './audienceModel.js';

const updatePeople = (people, updater) =>
  people.map((person) => {
    if (person.state === 'gone') return person;
    const patch = updater(person) || {};
    return {
      ...person,
      ...patch,
      satisfaction:
        patch.satisfaction === undefined
          ? person.satisfaction
          : clamp(patch.satisfaction),
      patience:
        patch.patience === undefined ? person.patience : clamp(patch.patience),
      boredom: patch.boredom === undefined ? person.boredom : clamp(patch.boredom),
    };
  });

export { getAudienceStats };

export const applyNarrativeToAudience = (state, evaluation) => {
  const quality = qualityFromEvaluation(evaluation);
  const result = applyQualityToPeople(state.audience.people, quality);
  const leavingBefore = state.audience.people.filter(
    (person) => person.state === 'leaving',
  ).length;
  const leavingAfter = result.people.filter(
    (person) => person.state === 'leaving',
  ).length;
  const extraDiscontent =
    (quality < 45 ? (45 - quality) * 0.7 : -2) +
    (evaluation.timedOut ? 7 : 0) +
    (evaluation.repeatedCombo ? 6 : 0);

  return {
    audience: {
      ...state.audience,
      people: result.people,
      walkouts: state.audience.walkouts + Math.max(0, leavingAfter - leavingBefore),
      discontent: clamp(state.audience.discontent + extraDiscontent),
    },
    deltas: { quality },
    quality,
    avgDelta: result.avgDelta,
  };
};

export const determineReaction = (state, evaluation, avgDelta) => {
  const stats = getAudienceStats(state.audience);
  const coherence = state.narrative.coherence;
  const index = state.stats.decisions + state.audience.reactionHistory.length;
  const causeBase = `Satisfacción media ${Math.round(
    stats.averageSatisfaction,
  )} · Coherencia ${Math.round(coherence)} · Descontento ${Math.round(
    stats.discontent,
  )}.`;

  if (stats.discontent >= 70 || stats.averageSatisfaction < 24) {
    return {
      type: 'protest',
      cause: `El descontento (${Math.round(
        stats.discontent,
      )}) rompe el límite. El público se pone en pie y exige explicaciones.`,
    };
  }

  if (evaluation.repeatedCombo && stats.averageSatisfaction >= 24) {
    const tomatoes = stats.averageSatisfaction < 46 || state.stats.decisions >= 3;
    return {
      type: tomatoes ? 'tomatoes' : 'boo',
      cause: `La combinación ya se usó antes: el público reconoce el truco y la penalización por repetición se suma a la escena.`,
    };
  }

  if (stats.averageSatisfaction < 34 || avgDelta <= -11) {
    return {
      type: 'tomatoes',
      cause: `La satisfacción cae a ${Math.round(
        stats.averageSatisfaction,
      )}. Un tomate cruza el escenario antes de que nadie pueda improvisar.`,
    };
  }

  if (stats.averageSatisfaction < 42 || avgDelta < -6) {
    if (stats.redShare > 0.34 || stats.averageBoredom > 58 || stats.averagePatience < 62) {
      return {
        type: 'walkout',
        cause: `El público más crítico ha agotado su paciencia (${Math.round(
          stats.lowestPerson?.patience || 0,
        )}) y empieza a levantarse.`,
      };
    }
    return {
      type: 'boo',
      cause: `La satisfacción media baja a ${Math.round(
        stats.averageSatisfaction,
      )}. Los abucheos llegan desde las filas impacientes.`,
    };
  }

  if (stats.averageBoredom >= 58 && stats.averageSatisfaction < 56) {
    return {
      type: 'yawns',
      cause: `El aburrimiento medio alcanza ${Math.round(
        stats.averageBoredom,
      )}. Alguien bosteza tan fuerte que tapa al apuntador.`,
    };
  }

  if (stats.averageSatisfaction >= 80 && coherence >= 65) {
    return {
      type: 'ovation',
      cause: `La coherencia (${Math.round(
        coherence,
      )}) y la satisfacción (${Math.round(
        stats.averageSatisfaction,
      )}) se disparan. La sala entera se pone en pie.`,
    };
  }

  if (stats.averageSatisfaction >= 72 && coherence >= 58) {
    return {
      type: 'flowers',
      cause: `La historia funciona (${Math.round(
        stats.averageSatisfaction,
      )} de satisfacción). Una lluvia de flores cae sobre las tablas.`,
    };
  }

  if (
    state.narrative.dominantGenre === 'comedy' &&
    stats.averageSatisfaction >= 55 &&
    avgDelta > 0
  ) {
    return {
      type: 'laughs',
      cause: `El giro cómico conecta con la sala. El público más caótico ríe y el aburrimiento cae en picado.`,
    };
  }

  if (stats.averageSatisfaction >= 64 && avgDelta >= 1) {
    return {
      type: 'applause',
      cause: `La escena convence: ${formatSigned(
        avgDelta,
        ' puntos',
      )} de satisfacción media. La sala aplaude sin levantarse.`,
    };
  }

  if (stats.averageSatisfaction < 50 || avgDelta < 0) {
    return {
      type: index % 2 === 0 ? 'murmurs' : 'yawns',
      cause: `${causeBase} El público no se rebela, pero tampoco está cómodo.`,
    };
  }

  return {
    type: 'murmurs',
    cause: `${causeBase} La función se sostiene por inercia. Nadie aplaude todavía.`,
  };
};

const reactionEntry = (state, type, cause, simulated) => {
  const meta = REACTION_META[type];
  return {
    ...meta,
    cause,
    simulated: Boolean(simulated),
    scene: state.narrative.sceneCount || 1,
    act: state.incidentIndex + 1,
    id: `reaction-${state.stats.decisions}-${state.audience.reactionHistory.length}-${type}`,
  };
};

export const applyReactionEffects = (state, type, cause, { simulated = false } = {}) => {
  const entry = reactionEntry(state, type, cause, simulated);
  let people = state.audience.people;
  let audience = { ...state.audience };
  let actors = { ...state.actors };
  let chaos = state.chaos;
  let improv = state.improv;
  let nextTimerBonus = state.nextTimerBonus;
  let ovation = state.audience.ovation;
  let bisRequested = state.audience.bisRequested;

  if (type === 'applause') {
    people = updatePeople(people, (person) => ({
      satisfaction: person.satisfaction + 1,
      patience: person.patience + 2,
    }));
    nextTimerBonus += 2;
  }

  if (type === 'laughs') {
    people = updatePeople(people, (person) => ({
      satisfaction: person.satisfaction + (person.criticality < 0.45 ? 2 : 0),
      boredom: person.boredom - 6,
      patience: person.patience + 1,
    }));
  }

  if (type === 'flowers') {
    people = updatePeople(people, (person) => ({
      satisfaction: person.satisfaction + (person.criticality < 0.5 ? 3 : 2),
      boredom: person.boredom - 3,
    }));
    improv = clamp(improv + 1, 0, 5);
    nextTimerBonus += 1;
  }

  if (type === 'ovation') {
    people = updatePeople(people, (person) => ({
      satisfaction: person.satisfaction + 3,
      boredom: person.boredom - 8,
      patience: person.patience + 4,
    }));
    improv = clamp(improv + 1, 0, 5);
    nextTimerBonus += 3;
    ovation = true;
    bisRequested = true;
  }

  if (type === 'murmurs') {
    people = updatePeople(people, (person) => ({
      patience: person.patience - 3,
      boredom: person.boredom + 2,
      satisfaction: person.satisfaction + (person.criticality > 0.7 ? -1 : 0),
    }));
  }

  if (type === 'yawns') {
    people = updatePeople(people, (person) => ({
      satisfaction: person.satisfaction - 1,
      boredom: person.boredom + 9,
      patience: person.patience - 3,
    }));
  }

  if (type === 'boo') {
    people = updatePeople(people, (person) => ({
      satisfaction: person.satisfaction - 2,
      patience: person.patience - 5,
    }));
    actors.trust = clamp(actors.trust - 3);
    audience.discontent = clamp(audience.discontent + 6);
    chaos = clamp(chaos + 2);
  }

  if (type === 'tomatoes') {
    people = updatePeople(people, (person) => ({
      satisfaction: person.satisfaction - 3 - (person.criticality > 0.7 ? 1 : 0),
      patience: person.patience - 6,
    }));
    actors.trust = clamp(actors.trust - 4);
    audience.discontent = clamp(audience.discontent + 8);
    chaos = clamp(chaos + 4);
  }

  if (type === 'walkout') {
    const result = markLowestLeaving(people, 3);
    people = updatePeople(result.people, (person) => ({
      patience: person.patience + 3,
      satisfaction: person.satisfaction - 1,
    }));
    audience.discontent = clamp(audience.discontent + 7);
    audience.walkouts += result.removed;
    actors.trust = clamp(actors.trust - 2);
  }

  if (type === 'protest') {
    const result = markLowestLeaving(people, 2);
    people = updatePeople(result.people, (person) => ({
      satisfaction: person.satisfaction - 3,
      patience: person.patience - 8,
    }));
    audience.discontent = clamp(audience.discontent + 10);
    audience.walkouts += result.removed;
    actors.trust = clamp(actors.trust - 4);
  }

  const positive = entry.tone === 'positive';
  audience = {
    ...audience,
    people,
    ovation,
    bisRequested,
    lastReaction: entry,
    reactionHistory: [...state.audience.reactionHistory, entry].slice(-10),
  };

  return {
    ...state,
    audience,
    actors,
    chaos,
    improv,
    nextTimerBonus,
    stats: {
      ...state.stats,
      reactionsPositive: state.stats.reactionsPositive + (positive ? 1 : 0),
      reactionsNegative:
        state.stats.reactionsNegative + (entry.tone === 'negative' ? 1 : 0),
    },
  };
};

export const determineCrisis = (state, reaction) => {
  const stats = getAudienceStats(state.audience);
  const reactionType = reaction?.type;
  const negativeReaction = ['protest', 'tomatoes', 'boo', 'walkout'].includes(reactionType);
  const crisisCause = `${reaction?.cause || 'La situación se ha vuelto inestable.'}`;
  let type = null;

  if (reactionType === 'protest' || reactionType === 'tomatoes' || stats.discontent >= 62) {
    type = 'protest';
  } else if (reactionType === 'walkout' && state.stats.decisions >= 2) {
    type = 'protest';
  } else if (state.actors.trust < 36) {
    type = 'panic';
  } else if (state.narrative.coherence < 45) {
    type = 'plot';
  } else if (state.chaos > 74) {
    type = 'chaos';
  } else if (stats.redShare > 0.35 || (stats.lowestPerson?.satisfaction || 100) < 30) {
    type = 'heckler';
  } else if (reactionType === 'boo' && state.stats.decisions >= 2) {
    type = 'heckler';
  } else if (negativeReaction && stats.discontent >= 50) {
    type = 'heckler';
  }

  if (!type) return null;
  return {
    ...CRISIS_TYPES[type],
    type,
    timer: 14,
    timerMax: 14,
    cause: crisisCause,
  };
};

export const getActionAvailability = (state, actionId) => {
  const action = CRISIS_ACTIONS.find((item) => item.id === actionId);
  if (!action) return { enabled: false, reason: 'Acción desconocida.' };
  if (actionId === 'dialogue') {
    if (state.improv < 1) return { enabled: false, reason: 'Sin recursos de improvisación.' };
    if ((state.cooldowns?.dialogue || 0) > 0) {
      return {
        enabled: false,
        reason: `Recuperándose: disponible en ${state.cooldowns.dialogue} escena${
          state.cooldowns.dialogue === 1 ? '' : 's'
        }.`,
      };
    }
    return { enabled: true, reason: '' };
  }
  const cooldown = state.cooldowns?.[actionId] || 0;
  if (cooldown > 0) {
    return {
      enabled: false,
      reason: `Recuperándose: disponible en ${cooldown} escena${
        cooldown === 1 ? '' : 's'
      }.`,
    };
  }
  return { enabled: true, reason: '' };
};

export const applyCrisisAction = (state, actionId, { inCrisis = false } = {}) => {
  const availability = getActionAvailability(state, actionId);
  if (!availability.enabled) return state;

  const action = CRISIS_ACTIONS.find((item) => item.id === actionId);
  let people = state.audience.people;
  let audience = { ...state.audience };
  let actors = { ...state.actors };
  let coherence = state.narrative.coherence;
  let chaos = state.chaos;
  let improv = state.improv;
  let cooldowns = { ...state.cooldowns };
  let outcome = '';

  if (actionId === 'dialogue') {
    improv -= 1;
    cooldowns.dialogue = 1;
    actors.trust = clamp(actors.trust + 9);
    coherence = clamp(coherence + 5);
    people = updatePeople(people, (person) => ({
      satisfaction: person.satisfaction + 4 + (person.criticality > 0.7 ? 2 : 0),
      patience: person.patience + 3,
    }));
    audience.discontent = clamp(audience.discontent - 10);
    chaos = clamp(chaos - 2);
    outcome =
      'Bruno justifica el accidente con una frase que casi tiene sentido. Los espectadores más exigentes toman nota; los tolerantes perdonan.';
  }

  if (actionId === 'pacing') {
    people = updatePeople(people, (person) => ({
      boredom: person.boredom - 12,
      satisfaction: person.satisfaction + (person.criticality < 0.45 ? 3 : 1),
    }));
    audience.discontent = clamp(audience.discontent - 3);
    chaos = clamp(chaos + 5);
    coherence = clamp(coherence - 2);
    cooldowns.pacing = 1;
    outcome =
      'Un redoble de tuba y un cambio de foco despiertan a la sala. La atención vuelve, la elegancia se va.';
  }

  if (actionId === 'engage') {
    const stats = getAudienceStats({ ...state.audience, people });
    const target = stats.lowestPerson?.id;
    people = updatePeople(people, (person) => ({
      satisfaction: person.satisfaction + 1 + (person.id === target ? 9 : 0),
      patience: person.patience + 2,
    }));
    audience.discontent = clamp(audience.discontent - 8);
    actors.trust = clamp(actors.trust - 1);
    chaos = clamp(chaos + 1);
    cooldowns.engage = 1;
    outcome =
      'Lía señala a la persona más insatisfecha y le dedica la siguiente réplica. La sala vuelve a sentirse parte del espectáculo.';
  }

  if (actionId === 'curtain') {
    people = updatePeople(people, (person) => ({
      satisfaction: person.satisfaction - 4 - (person.criticality > 0.7 ? 2 : 0),
      boredom: person.boredom + 10,
      patience: person.patience + 2,
    }));
    audience.discontent = clamp(audience.discontent - 2);
    coherence = clamp(coherence - 3);
    chaos = clamp(chaos - 3);
    cooldowns.curtain = 1;
    outcome =
      'El telón cae durante cuarenta segundos eternos. Cuando vuelve a subir, la crisis se ha enfriado... y también el interés.';
  }

  audience = { ...audience, people };
  const reaction = state.audience.lastReaction;
  const next = {
    ...state,
    audience,
    actors,
    chaos,
    improv,
    cooldowns,
    narrative: { ...state.narrative, coherence },
    lastCrisisOutcome: {
      actionId,
      label: action.label,
      text: outcome,
      inCrisis,
      tone: action.tone,
      scene: state.narrative.sceneCount + 1,
      reactionType: reaction?.type || null,
    },
    stats: {
      ...state.stats,
      curtains: state.stats.curtains + (actionId === 'curtain' ? 1 : 0),
    },
    debugLog: [
      ...state.debugLog,
      {
        id: state.debugLog.length + 2,
        scene: state.narrative.sceneCount + 1,
        message: `Acción de crisis: ${action.label}.`,
      },
    ].slice(-20),
  };

  next.actors.status =
    next.actors.trust >= 68
      ? 'firmes'
      : next.actors.trust >= 48
        ? 'tensos'
        : next.actors.trust >= 28
          ? 'nerviosos'
          : 'bloqueados';
  return next;
};

export const applyCrisisWait = (state) => {
  const people = updatePeople(state.audience.people, (person) => ({
    satisfaction: person.satisfaction - 2,
    patience: person.patience - 2,
  }));
  return {
    ...state,
    audience: {
      ...state.audience,
      people,
      discontent: clamp(state.audience.discontent + 4),
    },
    actors: {
      ...state.actors,
      trust: clamp(state.actors.trust - 2),
      status: state.actors.trust - 2 >= 68 ? 'firmes' : state.actors.trust - 2 >= 48 ? 'tensos' : 'nerviosos',
    },
    narrative: {
      ...state.narrative,
      coherence: clamp(state.narrative.coherence - 2),
    },
    lastCrisisOutcome: {
      actionId: 'wait',
      label: 'Dejar pasar la crisis',
      text: 'El técnico respira, no toca nada y deja que la escena encuentre su propio final. La sala se calma a medias; el runrún se queda en el aire.',
      tone: 'neutral',
      scene: state.narrative.sceneCount + 1,
    },
    debugLog: [
      ...state.debugLog,
      {
        id: state.debugLog.length + 2,
        scene: state.narrative.sceneCount + 1,
        message: 'Crisis atravesada sin intervención directa.',
      },
    ].slice(-20),
  };
};

export const applyCrisisTimeout = (state) => {
  const result = markLowestLeaving(state.audience.people, 2);
  const people = updatePeople(result.people, (person) => ({
    satisfaction: person.satisfaction - 5,
    patience: person.patience - 6,
  }));
  return {
    ...state,
    audience: {
      ...state.audience,
      people,
      discontent: clamp(state.audience.discontent + 10),
      walkouts: state.audience.walkouts + result.removed,
    },
    actors: {
      ...state.actors,
      trust: clamp(state.actors.trust - 5),
      status: 'nerviosos',
    },
    narrative: {
      ...state.narrative,
      coherence: clamp(state.narrative.coherence - 4),
    },
    lastCrisisOutcome: {
      actionId: 'timeout',
      label: 'La crisis se desborda',
      text: 'Nadie toma una decisión a tiempo. Dos espectadores abandonan la sala y la confusión se queda a vivir entre bambalinas.',
      tone: 'negative',
      scene: state.narrative.sceneCount + 1,
    },
    debugLog: [
      ...state.debugLog,
      {
        id: state.debugLog.length + 2,
        scene: state.narrative.sceneCount + 1,
        message: 'Crisis sin resolver: penalización automática.',
      },
    ].slice(-20),
  };
};

export const personGone = (state, personId) => ({
  ...state,
  audience: {
    ...state.audience,
    people: markPersonGone(state.audience.people, personId),
  },
});

export const tickCooldowns = (cooldowns) =>
  Object.fromEntries(
    Object.entries(cooldowns).map(([id, value]) => [id, Math.max(0, value - 1)]),
  );
