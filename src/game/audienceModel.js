import { clamp } from './utils.js';

export const AUDIENCE_ROWS = 6;
export const AUDIENCE_COLS = 10;
export const TOTAL_SEATS = AUDIENCE_ROWS * AUDIENCE_COLS;

export const CRITICALITY_BANDS = [
  { id: 'low', label: 'Tolerantes', min: 0, max: 0.36 },
  { id: 'mid', label: 'Exigentes', min: 0.36, max: 0.72 },
  { id: 'high', label: 'Muy críticos', min: 0.72, max: 1 },
];

const createRandom = (seed) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = (values, random) => {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
};

const makeCriticalities = (random) => {
  const values = [];
  const pushBand = (amount, min, max) => {
    for (let index = 0; index < amount; index += 1) {
      values.push(min + random() * (max - min));
    }
  };
  pushBand(9, 0.76, 0.96);
  pushBand(30, 0.4, 0.7);
  pushBand(21, 0.12, 0.35);
  return shuffle(values, random);
};

export const createAudience = (seed = 0x5eed1234) => {
  const random = createRandom(seed);
  const criticalities = makeCriticalities(random);
  const people = [];

  for (let row = 0; row < AUDIENCE_ROWS; row += 1) {
    for (let col = 0; col < AUDIENCE_COLS; col += 1) {
      const index = row * AUDIENCE_COLS + col;
      const criticality = criticalities[index];
      const satisfaction = clamp(72 - criticality * 21 + (random() * 10 - 5));
      people.push({
        id: `person-${row + 1}-${col + 1}`,
        row,
        col,
        seat: { row, col },
        criticality: Math.round(criticality * 100) / 100,
        satisfaction: Math.round(satisfaction),
        patience: 100,
        boredom: Math.round(8 + random() * 12),
        bias: Math.round((random() * 6 - 3) * 10) / 10,
        reactions: [],
        exitSide: col < AUDIENCE_COLS / 2 ? 'left' : 'right',
        state: 'seated',
      });
    }
  }

  return {
    people,
    initialTotal: TOTAL_SEATS,
    discontent: 12,
    lastReaction: null,
    reactionHistory: [],
    ovation: false,
    bisRequested: false,
    walkouts: 0,
  };
};

const average = (values) =>
  values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;

export const getAudienceStats = (audience) => {
  const people = audience?.people || [];
  const present = people.filter((person) => person.state !== 'gone');
  const total = present.length;
  const satisfactions = present.map((person) => person.satisfaction);
  const averageSatisfaction = average(satisfactions);
  const averageBoredom = average(present.map((person) => person.boredom));
  const averagePatience = average(present.map((person) => person.patience));
  const lowestPerson = [...present].sort(
    (a, b) => a.satisfaction - b.satisfaction || b.criticality - a.criticality,
  )[0];
  const criticalCount = present.filter((person) => person.satisfaction < 32).length;
  const seriousCount = present.filter(
    (person) => person.satisfaction >= 32 && person.satisfaction < 62,
  ).length;
  const contentCount = present.filter((person) => person.satisfaction >= 62).length;
  const leavingCount = people.filter((person) => person.state === 'leaving').length;
  const goneCount = people.filter((person) => person.state === 'gone').length;

  const segments = CRITICALITY_BANDS.map((band) => {
    const members = present.filter(
      (person) => person.criticality >= band.min && person.criticality < band.max,
    );
    return {
      ...band,
      count: members.length,
      satisfaction: average(members.map((person) => person.satisfaction)),
      patience: average(members.map((person) => person.patience)),
      criticalCount: members.filter((person) => person.satisfaction < 32).length,
    };
  });

  return {
    people,
    total,
    initialTotal: audience?.initialTotal || TOTAL_SEATS,
    averageSatisfaction,
    averageBoredom,
    averagePatience,
    lowestPerson,
    spread:
      satisfactions.length > 0 ? Math.max(...satisfactions) - Math.min(...satisfactions) : 0,
    criticalCount,
    seriousCount,
    contentCount,
    redShare: total > 0 ? criticalCount / total : 0,
    greenShare: total > 0 ? contentCount / total : 0,
    leavingCount,
    goneCount,
    walkouts: audience?.walkouts ?? leavingCount + goneCount,
    discontent: audience?.discontent ?? 0,
    segments,
  };
};

export const satisfactionColor = (satisfaction) => {
  if (satisfaction >= 62) return '#7bd6a0';
  if (satisfaction >= 32) return '#e8bf5a';
  return '#e35d5d';
};

export const qualityFromEvaluation = (evaluation) => {
  const novelTags = evaluation.novelTags || [];
  const reusedTags = evaluation.reusedTags || [];
  let quality = 52;
  quality += (evaluation.newCoherence - 50) * 0.6;
  quality += Math.min(10, novelTags.length * 2);
  quality += reusedTags.length ? 3 : 0;
  quality += evaluation.allDifferent ? 3 : 0;
  quality -= evaluation.repeatedCombo ? 22 : 0;
  quality -= evaluation.repeatedObject ? 6 : 0;
  quality -= evaluation.timedOut ? 16 : 0;
  if (evaluation.genreChanged && evaluation.coherenceDelta < -5) quality -= 8;
  return Math.round(clamp(quality));
};

export const applyQualityToPeople = (people, quality) => {
  let deltaTotal = 0;
  let affected = 0;

  const next = people.map((person) => {
    if (person.state === 'gone' || person.state === 'leaving') return person;
    const threshold = 40 + person.criticality * 30;
    const delta = (quality - threshold) * 0.24 + person.bias * 0.12;
    const satisfaction = clamp(person.satisfaction + delta);
    const red = satisfaction < 32;
    const patience = clamp(
      person.patience + (red ? -(26 + person.criticality * 22) : 3),
    );
    const boredom = clamp(person.boredom + (quality < 55 ? 3 : -2));
    const state = red && patience <= 0 ? 'leaving' : 'seated';
    deltaTotal += delta;
    affected += 1;
    return {
      ...person,
      satisfaction: Math.round(satisfaction * 10) / 10,
      patience: Math.round(patience),
      boredom: Math.round(boredom),
      state,
    };
  });

  return {
    people: next,
    avgDelta: affected ? deltaTotal / affected : 0,
    quality,
  };
};

export const markLowestLeaving = (people, amount) => {
  const candidates = people
    .filter((person) => person.state === 'seated')
    .sort(
      (a, b) =>
        a.satisfaction - b.satisfaction ||
        b.criticality - a.criticality ||
        a.row - b.row ||
        a.col - b.col,
    );
  const targets = new Set(candidates.slice(0, Math.max(0, amount)).map((person) => person.id));
  const next = people.map((person) =>
    targets.has(person.id) ? { ...person, state: 'leaving' } : person,
  );
  return { people: next, removed: targets.size };
};

export const markPersonGone = (people, personId) =>
  people.map((person) =>
    person.id === personId && person.state === 'leaving'
      ? { ...person, state: 'gone' }
      : person,
  );

export const bandForCriticality = (criticality) =>
  CRITICALITY_BANDS.find(
    (band) => criticality >= band.min && criticality < band.max,
  ) || CRITICALITY_BANDS[CRITICALITY_BANDS.length - 1];
