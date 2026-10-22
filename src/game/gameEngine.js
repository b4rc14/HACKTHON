import {
  ENDING_META,
  REACTION_META,
  getCurrentIncident,
  getIncidentById,
  getPlay,
} from './storyData.js';
import {
  applyCrisisAction,
  applyCrisisTimeout,
  applyCrisisWait,
  applyNarrativeToAudience,
  applyReactionEffects,
  determineCrisis,
  determineReaction,
  getAudienceStats,
  tickCooldowns,
} from './audienceEngine.js';
import {
  evaluateNarrative,
  generateTitle,
  getActorStatus,
} from './narrativeEngine.js';
import { clamp, round1, unique } from './utils.js';

const withCue = (state, type) => ({
  ...state,
  cueCounter: state.cueCounter + 1,
  soundCue: {
    id: state.cueCounter + 1,
    type,
  },
});

const withLog = (state, message) => ({
  ...state,
  debugLog: [
    ...state.debugLog,
    {
      id: state.debugLog.length + 2,
      scene: state.narrative.sceneCount + 1,
      message,
    },
  ].slice(-25),
});

const cueForReaction = (reaction, dominantGenre) => {
  if (reaction.type === 'ovation' || reaction.type === 'flowers') return 'ovation';
  if (reaction.type === 'applause' || reaction.type === 'laughs') return 'applause';
  if (reaction.type === 'tomatoes') return 'tomato';
  if (reaction.type === 'walkout') return 'walkout';
  if (reaction.type === 'protest') return 'protest';
  if (reaction.type === 'boo') return 'boo';
  return `theme-${dominantGenre}`;
};

const seededRandom = (seed) => {
  let value = (Number(seed) || 1) >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleScenes = (sceneIds, seed) => {
  const random = seededRandom(seed);
  const next = [...sceneIds];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
};

export const startShow = (state, { playId, seed } = {}) => {
  const play = getPlay(playId || state.playId);
  const runSeed = Number(seed) || state.runSeed || 1;
  const sceneOrder = shuffleScenes(play.sceneIds, runSeed);
  const incident = getIncidentById(sceneOrder[0]);
  const timer = incident.timer;

  return withCue(
    {
      ...state,
      phase: 'incident',
      playId: play.id,
      runSeed,
      sceneOrder,
      incidentIndex: 0,
      sceneIndex: 0,
      showTimer: state.showTimerMax || 180,
      showTimerMax: state.showTimerMax || 180,
      timer,
      timerMax: timer,
      timerRunning: true,
      selections: { lighting: null, sound: null, object: null },
      result: null,
      pendingCrisis: null,
      crisis: null,
      crisisResolved: false,
      lastCrisisOutcome: null,
      nextTimerBonus: 0,
      demo: { ...state.demo, paused: false },
      audience: { ...state.audience, lastReaction: null },
      debugLog: [
        ...state.debugLog,
        {
          id: state.debugLog.length + 2,
          scene: 1,
          message: `Comienza «${play.title}». El reloj de la función está en marcha.`,
        },
      ].slice(-30),
    },
    'curtain',
  );
};

// Compatibilidad con código antiguo: ahora una "entrada" es simplemente la
// primera escena de la función continua.
export const beginIncident = (state) => state;

export const resolveIncident = (state, rawSelection, { timedOut = false } = {}) => {
  const incident = getCurrentIncident(state);
  const evaluation = evaluateNarrative(state, rawSelection, { timedOut });
  const audienceBefore = getAudienceStats(state.audience);
  const trustBefore = state.actors.trust;
  const improvBefore = state.improv;
  const previousHistory = state.narrative.history || [];

  let trust = state.actors.trust;
  if (timedOut) trust -= 8;
  if (evaluation.repeatedCombo) trust -= 3;
  if (evaluation.genreChanged && evaluation.coherenceDelta < -5) trust -= 2;
  if (evaluation.coherenceDelta >= 5) trust += 1;
  trust = clamp(trust);

  let chaos = state.chaos;
  chaos += evaluation.dominantGenre === 'comedy' ? 3 : 0;
  chaos += evaluation.dominantGenre === 'scifi' ? 2 : 0;
  chaos += evaluation.allDifferent ? 5 : 0;
  chaos += evaluation.genreChanged ? 3 : 0;
  chaos += timedOut ? 4 : 0;
  chaos += evaluation.repeatedCombo ? -2 : 0;
  const chaoticTags = ['absurd', 'animal', 'slapstick', 'explosion', 'dinosaur', 'weird'];
  chaos += Math.min(6, chaoticTags.filter((tag) => evaluation.tags.includes(tag)).length * 2);
  chaos = clamp(chaos);

  const historyEntry = {
    act: state.incidentIndex + 1,
    sceneNumber: state.incidentIndex + 1,
    incidentId: incident.id,
    headline: evaluation.headline,
    summary: evaluation.summary,
    dominantGenre: evaluation.dominantGenre,
    previousDominant: evaluation.previousDominant,
    genreChanged: evaluation.genreChanged,
    selection: evaluation.selection,
    tags: evaluation.tags,
    comboSignature: evaluation.comboSignature,
    coherenceDelta: evaluation.coherenceDelta,
    newCoherence: evaluation.newCoherence,
    timedOut,
    repeatedCombo: evaluation.repeatedCombo,
    avgDelta: 0,
    reaction: null,
    audienceDelta: 0,
    satisfactionAfter: null,
  };

  let next = {
    ...state,
    narrative: {
      ...state.narrative,
      genreScores: evaluation.genreScores,
      dominantGenre: evaluation.dominantGenre,
      coherence: evaluation.newCoherence,
      sceneCount: state.narrative.sceneCount + 1,
      establishedTags: unique([
        ...state.narrative.establishedTags,
        ...evaluation.tags,
        ...incident.baseTags,
      ]),
      history: [...previousHistory, historyEntry],
    },
    actors: {
      ...state.actors,
      trust,
      status: getActorStatus(trust),
    },
    chaos,
    selections: evaluation.selection,
    stats: {
      ...state.stats,
      decisions: state.stats.decisions + 1,
      timeouts: state.stats.timeouts + (timedOut ? 1 : 0),
    },
  };

  const audienceResult = applyNarrativeToAudience(next, evaluation);
  next = {
    ...next,
    audience: audienceResult.audience,
  };

  const rawReaction = determineReaction(next, evaluation, audienceResult.avgDelta);
  const reaction = {
    ...(REACTION_META[rawReaction.type] || {}),
    ...rawReaction,
  };
  next = applyReactionEffects(next, reaction.type, reaction.cause);

  if (reaction.tone === 'positive') {
    next.actors = {
      ...next.actors,
      trust: clamp(next.actors.trust + 1),
    };
  }
  next.actors.status = getActorStatus(next.actors.trust);

  if (next.actors.trust < 35) {
    next.actors.glitches += 1;
    evaluation.dialogue.push({
      speaker: 'BRUNO',
      text: 'Perdón, ¿alguien recuerda si mi personaje era el novio o el dinosaurio?',
    });
  }

  const pendingCrisis = determineCrisis(next, reaction);
  const audienceAfter = getAudienceStats(next.audience);
  const satisfactionAfter = Math.round(audienceAfter.averageSatisfaction);

  const historyWithResult = next.narrative.history.map((entry, index) =>
    index === next.narrative.history.length - 1
      ? {
          ...entry,
          avgDelta: Math.round(audienceResult.avgDelta * 10) / 10,
          reaction: { type: reaction.type, label: reaction.label, cause: reaction.cause },
          audienceDelta: Math.round(audienceResult.avgDelta * 10) / 10,
          quality: audienceResult.quality,
          satisfactionAfter,
        }
      : entry,
  );

  const timeoutCopy = timedOut
    ? 'El tiempo se agota. Los actores tiran del repertorio de emergencia y convierten el silencio en una improvisación desesperada.'
    : '';

  const result = {
    ...evaluation,
    sceneNumber: state.incidentIndex + 1,
    summary: timeoutCopy ? `${timeoutCopy} ${evaluation.summary}` : evaluation.summary,
    dialogue: timedOut
      ? [
          { speaker: 'APUNTADOR', text: '¡Se acabó el tiempo! ¡Salvad la escena como sea!' },
          ...evaluation.dialogue,
        ]
      : evaluation.dialogue,
    audienceDelta: round1(audienceResult.avgDelta),
    quality: audienceResult.quality,
    avgDelta: round1(audienceResult.avgDelta),
    reaction,
    satisfactionBefore: Math.round(audienceBefore.averageSatisfaction),
    satisfactionAfter,
    trustBefore,
    trustAfter: next.actors.trust,
    improvBefore,
    improvAfter: next.improv,
    pendingCrisis: pendingCrisis ? pendingCrisis.title : null,
    audienceAfter,
    memory: evaluation.memory,
  };

  next = {
    ...next,
    narrative: { ...next.narrative, history: historyWithResult },
    phase: 'resolution',
    timerRunning: false,
    result,
    pendingCrisis,
    crisis: null,
    crisisResolved: false,
  };

  next = withLog(
    next,
    `${timedOut ? 'Tiempo agotado' : 'Improvisación'}: ${evaluation.headline}. Reacción: ${reaction.label}.`,
  );

  return withCue(next, cueForReaction(reaction, evaluation.dominantGenre));
};

export const tickGame = (state) => {
  if (!state.timerRunning) return state;
  if (!['incident', 'crisis'].includes(state.phase)) return state;

  const showTimer = Math.max(0, (state.showTimer ?? state.showTimerMax ?? 180) - 1);
  if (showTimer <= 0) {
    return finishShow({ ...state, showTimer: 0, timerRunning: false });
  }

  if (getAudienceStats(state.audience).total <= 0) {
    return finishShow({ ...state, showTimer, timerRunning: false });
  }

  if (state.phase === 'incident') {
    if (state.timer > 1) return { ...state, showTimer, timer: state.timer - 1 };
    return resolveIncident(
      { ...state, showTimer, timer: 0 },
      state.selections,
      { timedOut: true },
    );
  }

  if (state.timer > 1) return { ...state, showTimer, timer: state.timer - 1 };
  return resolveCrisis({ ...state, showTimer, timer: 0 }, null, { timeout: true });
};

export const beginCrisis = (state) => {
  if (!state.pendingCrisis) return state;
  const crisis = {
    ...state.pendingCrisis,
    timer: state.pendingCrisis.timer || 14,
    timerMax: state.pendingCrisis.timerMax || 14,
  };
  return withCue(
    withLog(
      {
        ...state,
        phase: 'crisis',
        crisis,
        timer: crisis.timer,
        timerMax: crisis.timerMax,
        timerRunning: true,
        demo: { ...state.demo, paused: false },
        stats: { ...state.stats, crises: state.stats.crises + 1 },
      },
      `Crisis activada: ${crisis.title}.`,
    ),
    'alarm',
  );
};

export const resolveCrisis = (state, actionId, { timeout = false } = {}) => {
  const before = state;
  let next;
  if (timeout) next = applyCrisisTimeout(state);
  else if (actionId === 'wait') next = applyCrisisWait(state);
  else next = applyCrisisAction(state, actionId, { inCrisis: true });
  if (next === before) return state;

  next = {
    ...next,
    phase: 'resolution',
    crisis: null,
    crisisResolved: true,
    timerRunning: false,
    timer: 0,
    result: state.result
      ? {
          ...state.result,
          crisisResolved: true,
          crisisOutcome: next.lastCrisisOutcome,
        }
      : state.result,
  };
  next = withLog(
    next,
    `Crisis gestionada: ${next.lastCrisisOutcome?.label || 'sin intervención'}.`,
  );
  return withCue(next, actionId === 'curtain' ? 'curtain' : 'applause-soft');
};

export const useSpecialAction = (state, actionId) => {
  const next = applyCrisisAction(state, actionId, { inCrisis: false });
  if (next === state) return state;
  let adjusted = next;
  if (actionId === 'curtain' && state.phase === 'incident') {
    const extra = 4;
    adjusted = {
      ...next,
      timer: next.timer + extra,
      timerMax: next.timerMax + extra,
    };
  }
  adjusted = withLog(adjusted, `Acción especial fuera de crisis: ${actionId}.`);
  return withCue(adjusted, actionId === 'curtain' ? 'curtain' : 'click');
};

export const startNextScene = (state) => {
  const play = getPlay(state.playId);
  const nextIndex = state.incidentIndex + 1;
  const queue = state.sceneOrder?.length ? state.sceneOrder : play.sceneIds;
  const incident = getIncidentById(queue[nextIndex % queue.length]);
  const timer = incident.timer + state.nextTimerBonus;

  return withCue(
    withLog(
      {
        ...state,
        phase: 'incident',
        incidentIndex: nextIndex,
        sceneIndex: nextIndex,
        timer,
        timerMax: timer,
        timerRunning: true,
        nextTimerBonus: 0,
        selections: { lighting: null, sound: null, object: null },
        result: null,
        pendingCrisis: null,
        crisis: null,
        crisisResolved: false,
        lastCrisisOutcome: null,
        cooldowns: tickCooldowns(state.cooldowns),
        demo: { ...state.demo, paused: false },
      },
      `Escena ${nextIndex + 1}: ${incident.incidentTitle}.`,
    ),
    'curtain-open',
  );
};

export const advanceAfterResolution = (state) => {
  if (state.pendingCrisis && !state.crisisResolved) {
    return beginCrisis(state);
  }
  if ((state.showTimer ?? state.showTimerMax ?? 180) <= 0) {
    return finishShow(state);
  }
  if (getAudienceStats(state.audience).total <= 0) {
    return finishShow(state);
  }
  return startNextScene(state);
};

export const finishShow = (state) => {
  const ending = computeEnding(state);
  return withCue(
    withLog(
      {
        ...state,
        phase: 'ending',
        timerRunning: false,
        timer: 0,
        ending,
        narrative: { ...state.narrative, title: ending.title },
        demo: { ...state.demo, paused: false },
      },
      `La función termina: ${ending.meta.label}.`,
    ),
    ending.meta.id === 'fracaso' ? 'boo' : 'ovation',
  );
};

export const computeEnding = (state) => {
  const audienceStats = getAudienceStats(state.audience);
  const history = state.narrative.history || [];
  const total = audienceStats.total;
  const avgSat = audienceStats.averageSatisfaction;
  const coherence = state.narrative.coherence;
  const trust = state.actors.trust;
  const genreCount = new Set(history.map((entry) => entry.dominantGenre)).size;
  const uniqueCombos = new Set(history.map((entry) => entry.comboSignature)).size;
  const uniqueTags = state.narrative.establishedTags.length;
  const creativity = Math.round(
    clamp(uniqueCombos * 24 + genreCount * 10 + Math.min(16, uniqueTags)),
  );
  const score = Math.round(
    clamp(
      25 * (total / state.audience.initialTotal) +
        30 * (avgSat / 100) +
        20 * (coherence / 100) +
        10 * (trust / 100) +
        15 * (creativity / 100),
    ),
  );

  let meta = ENDING_META.fracaso;
  if (total <= 16 || avgSat < 30 || trust < 24 || coherence < 30) {
    meta = ENDING_META.fracaso;
  } else if (
    state.narrative.dominantGenre === 'comedy' &&
    state.chaos >= 45 &&
    avgSat >= 38 &&
    total >= 20
  ) {
    meta = ENDING_META.caos;
  } else if (total >= 42 && avgSat >= 66 && coherence >= 58 && trust >= 50) {
    meta = ENDING_META.comercial;
  } else if (
    coherence >= 50 &&
    creativity >= 55 &&
    total >= 24 &&
    (audienceStats.spread >= 15 || genreCount >= 2)
  ) {
    meta = ENDING_META.culto;
  } else if (
    state.chaos >= 55 ||
    (state.narrative.dominantGenre === 'comedy' && avgSat >= 38)
  ) {
    meta = ENDING_META.caos;
  } else {
    meta = ENDING_META.fracaso;
  }

  const titleInfo = generateTitle(state);
  const lastReaction = state.audience.lastReaction;
  const bis = state.audience.bisRequested || (avgSat >= 72 && coherence >= 50);

  const finalReaction = bis
    ? {
        label: 'El público pide un bis',
        icon: '🌹',
        text: 'Nadie se mueve de la butaca. Alguien grita «¡otra explosión!» y el regidor finge no oírlo.',
      }
    : lastReaction
      ? {
          label: lastReaction.label,
          icon: lastReaction.icon,
          text: lastReaction.cause,
        }
      : {
          label: 'Silencio final',
          icon: '…',
          text: 'El telón cae sin que nadie se atreva a decidir si aplaudir.',
        };

  const actorFinalLine =
    trust >= 70
      ? 'Lía y Bruno salen a saludar tomados del brazo. Solo tiemblan cuando miran al telar.'
      : trust >= 48
        ? 'Los actores saludan con una sonrisa profesional. Bruno busca el interruptor de la luz por si acaso.'
        : trust >= 28
          ? 'Lía improvisa un discurso de agradecimiento. Bruno asiente con el alma en otra parte.'
          : 'Los actores salen a saludar por obligación contractual. Bruno pregunta si el gazebo tiene seguro.';

  const audienceLine =
    total >= 48 && avgSat >= 62
      ? 'La sala se vacía despacio: nadie quiere ser el primero en irse.'
      : total <= 20
        ? 'Las butacas vacías hacen más ruido que los aplausos.'
        : audienceStats.spread >= 22
          ? 'La platea sale dividida. Unos aplauden; otros discuten en el vestíbulo.'
          : 'El público abandona la sala con la sensación de haber visto algo que no sabrá explicar.';

  const summary = history.length
    ? history.map((entry) => ({
        act: entry.sceneNumber || entry.act,
        sceneNumber: entry.sceneNumber || entry.act,
        headline: entry.headline || 'Escena omitida',
        genre: entry.dominantGenre,
        reaction: entry.reaction?.label || 'Sin reacción registrada',
        skipped: Boolean(entry.skipped),
      }))
    : [{ act: 1, sceneNumber: 1, headline: 'La función no llegó a empezar', genre: 'romance', reaction: '—' }];

  const badges = [
    getPlay(state.playId).title,
    `${total}/${state.audience.initialTotal} espectadores`,
    `Coherencia ${Math.round(coherence)}`,
    `Confianza ${Math.round(trust)}`,
    `Caos ${Math.round(state.chaos)}`,
    `${state.stats.crises} crisis`,
    `${state.stage?.eventHistory?.length || 0} avería(s)`,
  ];

  return {
    title: titleInfo.title,
    subtitle: titleInfo.subtitle,
    genre: state.narrative.dominantGenre,
    genreLabel: state.narrative.genreScores
      ? state.narrative.dominantGenre.charAt(0).toUpperCase() +
        state.narrative.dominantGenre.slice(1)
      : 'Romance',
    meta,
    score,
    creativity,
    metrics: {
      remaining: total,
      initial: state.audience.initialTotal,
      avgSatisfaction: Math.round(avgSat),
      coherence: Math.round(coherence),
      trust: Math.round(trust),
      chaos: Math.round(state.chaos),
      creativity,
      spread: Math.round(audienceStats.spread),
      genreCount,
      uniqueCombos,
      uniqueTags,
      walkouts: state.audience.walkouts,
      crises: state.stats.crises,
      decisions: state.stats.decisions,
      timeouts: state.stats.timeouts,
    },
    audienceSegments: audienceStats.segments.map((segment) => ({
      id: segment.id,
      name: segment.label,
      count: segment.count,
      satisfaction: Math.round(segment.satisfaction),
      patience: Math.round(segment.patience),
      criticalCount: segment.criticalCount,
    })),
    summary,
    tags: state.narrative.establishedTags,
    finalReaction,
    audienceLine,
    actorFinalLine,
    actorStatus: getActorStatus(trust),
    bisRequested: bis,
    badges,
    stats: state.stats,
    lastReaction,
    improvLeft: state.improv,
    scoreBreakdown: {
      attendance: Math.round(25 * (total / state.audience.initialTotal)),
      satisfaction: Math.round(30 * (avgSat / 100)),
      coherence: Math.round(20 * (coherence / 100)),
      trust: Math.round(10 * (trust / 100)),
      creativity: Math.round(15 * (creativity / 100)),
    },
    signOff: `Compañía de la Viga Caída · ${audienceStats.total} almas en la sala`,
  };
};

export const demoSkip = (state) => {
  if (state.phase === 'ending' || state.phase === 'title') return state;
  const incident = getCurrentIncident(state);
  const sceneNumber = state.incidentIndex + 1;
  const skipEntry = {
    act: sceneNumber,
    sceneNumber,
    incidentId: incident.id,
    headline: 'ESCENA OMITIDA (MODO DEMO)',
    summary: 'El técnico salta a la siguiente escena. La función pierde un poco de hilo.',
    dominantGenre: state.narrative.dominantGenre,
    previousDominant: state.narrative.dominantGenre,
    genreChanged: false,
    selection: state.selections,
    tags: ['demo-skip'],
    comboSignature: `skip-${incident.id}-${sceneNumber}`,
    coherenceDelta: -4,
    newCoherence: clamp(state.narrative.coherence - 4),
    timedOut: false,
    repeatedCombo: false,
    avgDelta: 0,
    reaction: { type: 'skipped', label: 'Escena omitida', cause: 'Modo demo' },
    audienceDelta: 0,
    satisfactionAfter: null,
    skipped: true,
  };

  let next = {
    ...state,
    narrative: {
      ...state.narrative,
      coherence: clamp(state.narrative.coherence - 4),
      history: [...state.narrative.history, skipEntry],
    },
    actors: { ...state.actors, trust: clamp(state.actors.trust - 3) },
    audience: {
      ...state.audience,
      discontent: clamp(state.audience.discontent + 4),
    },
    stats: { ...state.stats, decisions: state.stats.decisions + 1 },
    demo: { ...state.demo, skipped: state.demo.skipped + 1, paused: false },
    pendingCrisis: null,
    crisis: null,
    crisisResolved: true,
  };

  if ((next.showTimer ?? next.showTimerMax ?? 180) <= 0) {
    next = finishShow(next);
  } else if (getAudienceStats(next.audience).total <= 0) {
    next = finishShow(next);
  } else {
    next = startNextScene(next);
  }

  return withCue(withLog(next, 'Modo demo: salto de escena.'), 'click');
};

export const simulateReaction = (state, sentiment) => {
  if (!state || ['title', 'ending'].includes(state.phase)) return state;
  const n = state.demo.simCount;
  let type;
  if (sentiment === 'positive') {
    type = ['applause', 'flowers', 'ovation'][n % 3];
  } else {
    type = ['tomatoes', 'boo', 'walkout'][n % 3];
  }
  const labels = {
    applause: 'Aplausos simulados: el público reacciona como si la escena hubiera funcionado.',
    flowers: 'Lluvia de flores simulada: el público lanza flores al escenario.',
    ovation: 'Ovación simulada: la sala se pone en pie y pide un bis.',
    tomatoes: 'Tomatazos simulados: el público expresa su descontento con la verdura disponible.',
    boo: 'Abucheos simulados: la sala pierde la fe durante unos segundos.',
    walkout: 'Abandono simulado: los espectadores más insatisfechos se levantan y se van.',
  };
  let next = applyReactionEffects(state, type, `SIMULACIÓN DEMO · ${labels[type]}`, {
    simulated: true,
  });
  next = {
    ...next,
    demo: { ...next.demo, simCount: n + 1 },
  };
  next = withLog(next, `Modo demo: reacción ${sentiment} (${type}).`);
  return withCue(
    next,
    type === 'tomatoes' ? 'tomato' : type === 'boo' || type === 'walkout' ? 'boo' : 'applause',
  );
};

export const getSelectedCombinationLabel = (state) => {
  const parts = [
    state.selections.lighting,
    state.selections.sound,
    state.selections.object,
  ].filter(Boolean);
  return parts.length === 3 ? parts.join(' + ') : `${parts.length}/3 controles`;
};

export const getTimerPercent = (state) => {
  if (!state.timerMax) return 0;
  return clamp((state.timer / state.timerMax) * 100);
};
