import {
  CRISIS_ACTIONS,
  CRISIS_TYPES,
  REACTION_META,
} from './storyData.js';
import { clamp, formatSigned, removeSpectators, sum, weightedAverage } from './utils.js';

const GROUP_IDS = ['romantics', 'chaos', 'critics'];

export const getAudienceStats = (audience) => {
  const groups = GROUP_IDS.map((id) => audience.groups[id]);
  const total = sum(groups.map((group) => group.count));
  const weightFor = (group) => (total > 0 ? group.count : group.share);
  const averageSatisfaction = weightedAverage(
    groups.map((group) => ({ value: group.satisfaction, weight: weightFor(group) })),
  );
  const averageBoredom = weightedAverage(
    groups.map((group) => ({ value: group.boredom, weight: weightFor(group) })),
  );
  const averagePatience = weightedAverage(
    groups.map((group) => ({ value: group.patience, weight: weightFor(group) })),
  );
  const lowestGroup = [...groups].sort(
    (a, b) => a.satisfaction - b.satisfaction || a.patience - b.patience,
  )[0];
  const satisfactions = groups.map((group) => group.satisfaction);
  return {
    groups,
    total,
    averageSatisfaction,
    averageBoredom,
    averagePatience,
    lowestGroup,
    spread: Math.max(...satisfactions) - Math.min(...satisfactions),
  };
};

const cloneGroups = (groups) =>
  Object.fromEntries(
    Object.entries(groups).map(([id, group]) => [
      id,
      { ...group, reactions: [...(group.reactions || [])] },
    ]),
  );

const clampDeltas = (deltas) =>
  Object.fromEntries(
    GROUP_IDS.map((id) => [id, Math.round(clamp(deltas[id] || 0, -32, 26))]),
  );

export const calculateGroupDeltas = (state, evaluation) => {
  const genreBase = {
    romance: { romantics: 7, chaos: -4, critics: 0 },
    comedy: { romantics: -3, chaos: 9, critics: -2 },
    scifi: { romantics: -5, chaos: 6, critics: 2 },
  }[evaluation.dominantGenre];

  const deltas = { ...genreBase };
  const coherence = evaluation.newCoherence;

  if (coherence >= 72) {
    deltas.romantics += 2;
    deltas.critics += 4;
  } else if (coherence >= 58) {
    deltas.romantics += 1;
    deltas.critics += 2;
  } else if (coherence >= 45) {
    deltas.romantics -= 1;
    deltas.critics -= 2;
  } else if (coherence >= 32) {
    deltas.romantics -= 3;
    deltas.critics -= 6;
  } else {
    deltas.romantics -= 6;
    deltas.critics -= 10;
  }

  const tags = new Set(evaluation.tags);
  if (['sincere', 'warm', 'music', 'romantic-token', 'organic'].some((tag) => tags.has(tag))) {
    deltas.romantics += 2;
  }
  if (['absurd', 'animal', 'slapstick', 'pink', 'noise'].some((tag) => tags.has(tag))) {
    deltas.chaos += 3;
    deltas.romantics -= 2;
  }
  if (['alien', 'space', 'tech', 'weird'].some((tag) => tags.has(tag))) {
    deltas.chaos += 2;
    deltas.critics += 1;
  }

  if (evaluation.reusedTags.length) {
    deltas.critics += 3;
    deltas.romantics += 1;
    deltas.chaos += 1;
  }
  deltas.critics += Math.min(3, Math.ceil(evaluation.novelTags.length * 1.1));
  deltas.chaos += Math.min(2, Math.floor(evaluation.novelTags.length * 0.7));

  if (evaluation.allDifferent) {
    deltas.chaos += 3;
    deltas.critics += 2;
    deltas.romantics -= 2;
  }

  if (evaluation.genreChanged && evaluation.coherenceDelta < -5) {
    deltas.critics -= 5;
    deltas.romantics -= 3;
    deltas.chaos += 2;
  }

  if (evaluation.repeatedCombo) {
    deltas.romantics -= 8;
    deltas.chaos -= 8;
    deltas.critics -= 12;
  } else if (evaluation.repeatedObject) {
    deltas.romantics -= 2;
    deltas.chaos -= 2;
    deltas.critics -= 2;
  }

  if (evaluation.timedOut) {
    deltas.romantics -= 6;
    deltas.chaos -= 6;
    deltas.critics -= 9;
  }

  if (state.actors.trust < 35) {
    deltas.romantics -= 2;
    deltas.critics -= 2;
  }

  return clampDeltas(deltas);
};

export const applyNarrativeToAudience = (state, evaluation) => {
  const deltas = calculateGroupDeltas(state, evaluation);
  const groups = cloneGroups(state.audience.groups);
  const boredomBase =
    5 -
    (evaluation.dominantGenre === 'comedy' ? 3 : 0) -
    (evaluation.reusedTags.length ? 1 : 0) +
    (evaluation.timedOut ? 6 : 0) +
    (evaluation.repeatedCombo ? 5 : 0);

  GROUP_IDS.forEach((id) => {
    const group = groups[id];
    const delta = deltas[id];
    const patienceDelta = delta >= 0 ? 1 : -4 + (evaluation.timedOut ? -2 : 0);
    group.satisfaction = clamp(group.satisfaction + delta);
    group.boredom = clamp(group.boredom + boredomBase);
    group.patience = clamp(group.patience + patienceDelta);
    if (group.satisfaction < 25) group.patience = clamp(group.patience - 3);
    if (group.boredom > 70) group.satisfaction = clamp(group.satisfaction - 2);
  });

  const total = sum(Object.values(groups).map((group) => group.count));
  const avgDelta = weightedAverage(
    GROUP_IDS.map((id) => ({
      value: deltas[id],
      weight: total > 0 ? groups[id].count : groups[id].share,
    })),
  );
  const incoherence = Math.max(0, -evaluation.coherenceDelta);
  const discontent = clamp(
    state.audience.discontent +
      (avgDelta < 0 ? -avgDelta * 0.9 : -avgDelta * 0.35) +
      incoherence * 0.65 +
      (evaluation.timedOut ? 7 : 0) +
      (evaluation.repeatedCombo ? 5 : 0),
  );

  return {
    audience: {
      ...state.audience,
      groups,
      discontent,
    },
    deltas,
    avgDelta,
  };
};

export const determineReaction = (state, evaluation, avgDelta) => {
  const stats = getAudienceStats(state.audience);
  const coherence = state.narrative.coherence;
  const index = state.stats.decisions + state.audience.reactionHistory.length;
  const causeBase = `Satisfacción media ${Math.round(stats.averageSatisfaction)} · Coherencia ${Math.round(
    coherence,
  )} · Descontento ${Math.round(state.audience.discontent)}.`;

  if (stats.discontent >= 70 || stats.averageSatisfaction < 24) {
    return {
      type: 'protest',
      cause: `El descontento (${Math.round(state.audience.discontent)}) rompe el límite. El público se pone en pie y exige explicaciones.`,
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
      cause: `La satisfacción cae a ${Math.round(stats.averageSatisfaction)}. Un tomate cruza el escenario antes de que nadie pueda improvisar.`,
    };
  }

  if (stats.averageSatisfaction < 42 || avgDelta < -6) {
    if (
      stats.averageBoredom > 58 ||
      stats.lowestGroup.patience < 62 ||
      (stats.lowestGroup.satisfaction < 32 && stats.averageSatisfaction < 38)
    ) {
      return {
        type: 'walkout',
        cause: `El grupo «${stats.lowestGroup.name}» ha agotado su paciencia (${Math.round(
          stats.lowestGroup.patience,
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
      cause: `La coherencia (${Math.round(coherence)}) y la satisfacción (${Math.round(
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
      cause: `El giro cómico conecta con la sala. Los amantes del caos ríen y el aburrimiento cae en picado.`,
    };
  }

  if (stats.averageSatisfaction >= 64 && avgDelta >= 1) {
    return {
      type: 'applause',
      cause: `La escena convence: ${formatSigned(avgDelta, ' puntos')} de satisfacción media. La sala aplaude sin levantarse.`,
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

const updateGroups = (groups, updater) => {
  const next = cloneGroups(groups);
  GROUP_IDS.forEach((id) => {
    const patch = updater(next[id], id);
    if (patch) Object.assign(next[id], patch);
  });
  return next;
};

export const applyReactionEffects = (state, type, cause, { simulated = false } = {}) => {
  const entry = reactionEntry(state, type, cause, simulated);
  let groups = cloneGroups(state.audience.groups);
  let audience = { ...state.audience };
  let actors = { ...state.actors };
  let chaos = state.chaos;
  let improv = state.improv;
  let nextTimerBonus = state.nextTimerBonus;
  let ovation = state.audience.ovation;
  let bisRequested = state.audience.bisRequested;

  if (type === 'applause') {
    groups = updateGroups(state.audience.groups, (group) => ({
      satisfaction: clamp(group.satisfaction + 1),
      patience: clamp(group.patience + 2),
    }));
    nextTimerBonus += 2;
  }

  if (type === 'laughs') {
    groups = updateGroups(groups, (group, id) => ({
      satisfaction: clamp(group.satisfaction + (id === 'chaos' ? 2 : 0)),
      boredom: clamp(group.boredom - 6),
      patience: clamp(group.patience + 1),
    }));
  }

  if (type === 'flowers') {
    groups = updateGroups(groups, (group, id) => ({
      satisfaction: clamp(group.satisfaction + 2 + (id === 'romantics' ? 1 : 0)),
      boredom: clamp(group.boredom - 3),
    }));
    improv = clamp(improv + 1, 0, 5);
    nextTimerBonus += 1;
  }

  if (type === 'ovation') {
    groups = updateGroups(groups, (group) => ({
      satisfaction: clamp(group.satisfaction + 3),
      boredom: clamp(group.boredom - 8),
      patience: clamp(group.patience + 4),
    }));
    improv = clamp(improv + 1, 0, 5);
    nextTimerBonus += 3;
    ovation = true;
    bisRequested = true;
  }

  if (type === 'murmurs') {
    groups = updateGroups(groups, (group, id) => ({
      patience: clamp(group.patience - 3),
      boredom: clamp(group.boredom + 2),
      satisfaction: clamp(group.satisfaction + (id === 'critics' ? -1 : 0)),
    }));
  }

  if (type === 'yawns') {
    groups = updateGroups(groups, (group, id) => ({
      satisfaction: clamp(group.satisfaction - (id === 'chaos' ? 0 : 1)),
      boredom: clamp(group.boredom + 9),
      patience: clamp(group.patience - 3),
    }));
  }

  if (type === 'boo') {
    groups = updateGroups(groups, (group) => ({
      satisfaction: clamp(group.satisfaction - 2),
      patience: clamp(group.patience - 5),
    }));
    actors.trust = clamp(actors.trust - 3);
    audience.discontent = clamp(audience.discontent + 6);
    chaos = clamp(chaos + 2);
  }

  if (type === 'tomatoes') {
    groups = updateGroups(groups, (group, id) => ({
      satisfaction: clamp(group.satisfaction - 3 - (id === 'romantics' ? 1 : 0)),
      patience: clamp(group.patience - 6),
    }));
    actors.trust = clamp(actors.trust - 4);
    audience.discontent = clamp(audience.discontent + 8);
    chaos = clamp(chaos + 4);
  }

  if (type === 'walkout') {
    groups = removeSpectators(groups, 3);
    groups = updateGroups(groups, (group) => ({
      patience: clamp(group.patience + 3),
      satisfaction: clamp(group.satisfaction - 1),
    }));
    audience.discontent = clamp(audience.discontent + 7);
    audience.walkouts += 3;
    actors.trust = clamp(actors.trust - 2);
  }

  if (type === 'protest') {
    groups = removeSpectators(groups, 2);
    groups = updateGroups(groups, (group) => ({
      satisfaction: clamp(group.satisfaction - 3),
      patience: clamp(group.patience - 8),
    }));
    audience.discontent = clamp(audience.discontent + 10);
    audience.walkouts += 2;
    actors.trust = clamp(actors.trust - 4);
  }

  groups = updateGroups(groups, (group) => ({
    reactions: [...group.reactions, type].slice(-6),
  }));

  const positive = entry.tone === 'positive';
  audience = {
    ...audience,
    groups,
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
  } else if (state.audience.groups.critics.satisfaction < 30) {
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
        reason: `Recuperándose: disponible en ${state.cooldowns.dialogue} escena${state.cooldowns.dialogue === 1 ? '' : 's'}.`,
      };
    }
    return { enabled: true, reason: '' };
  }
  const cooldown = state.cooldowns?.[actionId] || 0;
  if (cooldown > 0) {
    return {
      enabled: false,
      reason: `Recuperándose: disponible en ${cooldown} escena${cooldown === 1 ? '' : 's'}.`,
    };
  }
  return { enabled: true, reason: '' };
};

export const applyCrisisAction = (state, actionId, { inCrisis = false } = {}) => {
  const availability = getActionAvailability(state, actionId);
  if (!availability.enabled) return state;

  const action = CRISIS_ACTIONS.find((item) => item.id === actionId);
  const groups = cloneGroups(state.audience.groups);
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
    groups.romantics.satisfaction = clamp(groups.romantics.satisfaction + 5);
    groups.critics.satisfaction = clamp(groups.critics.satisfaction + 6);
    groups.chaos.satisfaction = clamp(groups.chaos.satisfaction - 1);
    audience.discontent = clamp(audience.discontent - 10);
    chaos = clamp(chaos - 2);
    outcome =
      'Bruno justifica el accidente con una frase que casi tiene sentido. Los críticos toman nota; los románticos perdonan.';
  }

  if (actionId === 'pacing') {
    GROUP_IDS.forEach((id) => {
      groups[id].boredom = clamp(groups[id].boredom - 12);
    });
    groups.chaos.satisfaction = clamp(groups.chaos.satisfaction + 4);
    groups.romantics.satisfaction = clamp(groups.romantics.satisfaction + 2);
    groups.critics.satisfaction = clamp(groups.critics.satisfaction - 2);
    audience.discontent = clamp(audience.discontent - 3);
    chaos = clamp(chaos + 5);
    coherence = clamp(coherence - 2);
    cooldowns.pacing = 1;
    outcome =
      'Un redoble de tuba y un cambio de foco despiertan a la sala. La atención vuelve, la elegancia se va.';
  }

  if (actionId === 'engage') {
    const stats = getAudienceStats({ ...state.audience, groups });
    const target = stats.lowestGroup.id;
    GROUP_IDS.forEach((id) => {
      groups[id].satisfaction = clamp(groups[id].satisfaction + 1);
      groups[id].patience = clamp(groups[id].patience + 2);
    });
    groups[target].satisfaction = clamp(groups[target].satisfaction + 9);
    groups.critics.satisfaction = clamp(groups.critics.satisfaction + 1);
    audience.discontent = clamp(audience.discontent - 8);
    actors.trust = clamp(actors.trust - 1);
    chaos = clamp(chaos + 1);
    cooldowns.engage = 1;
    outcome = `Lía señala a una persona del grupo «${stats.lowestGroup.name}» y le dedica la siguiente réplica. La sala vuelve a sentirse parte del espectáculo.`;
  }

  if (actionId === 'curtain') {
    GROUP_IDS.forEach((id) => {
      groups[id].satisfaction = clamp(groups[id].satisfaction - 4);
      groups[id].boredom = clamp(groups[id].boredom + 10);
      groups[id].patience = clamp(groups[id].patience + 2);
    });
    groups.critics.satisfaction = clamp(groups.critics.satisfaction - 6);
    audience.discontent = clamp(audience.discontent - 2);
    coherence = clamp(coherence - 3);
    chaos = clamp(chaos - 3);
    cooldowns.curtain = 1;
    outcome =
      'El telón cae durante cuarenta segundos eternos. Cuando vuelve a subir, la crisis se ha enfriado... y también el interés.';
  }

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
  const groups = updateGroups(state.audience.groups, (group) => ({
    satisfaction: clamp(group.satisfaction - 2),
    patience: clamp(group.patience - 2),
  }));
  return {
    ...state,
    audience: {
      ...state.audience,
      groups,
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
  const groups = removeSpectators(state.audience.groups, 2);
  const updatedGroups = updateGroups(groups, (group) => ({
    satisfaction: clamp(group.satisfaction - 5),
    patience: clamp(group.patience - 6),
  }));
  return {
    ...state,
    audience: {
      ...state.audience,
      groups: updatedGroups,
      discontent: clamp(state.audience.discontent + 10),
      walkouts: state.audience.walkouts + 2,
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

export const tickCooldowns = (cooldowns) =>
  Object.fromEntries(
    Object.entries(cooldowns).map(([id, value]) => [id, Math.max(0, value - 1)]),
  );
