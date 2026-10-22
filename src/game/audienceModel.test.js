import { describe, expect, it } from 'vitest';
import {
  applyQualityToPeople,
  createAudience,
  getAudienceStats,
  markLowestLeaving,
  qualityFromEvaluation,
} from './audienceModel.js';

const average = (values) =>
  values.reduce((total, value) => total + value, 0) / values.length;

describe('modelo de público por personas', () => {
  it('crea 60 personas con criticidad individual y sin grupos', () => {
    const audience = createAudience(123);
    expect(audience.people).toHaveLength(60);
    expect(audience).not.toHaveProperty('groups');
    expect(audience.people.every((person) => person.criticality >= 0 && person.criticality <= 1)).toBe(true);
    expect(new Set(audience.people.map((person) => person.id)).size).toBe(60);
  });

  it('deriva los contadores de color de la satisfacción de cada persona', () => {
    const audience = createAudience(123);
    const people = audience.people.map((person, index) =>
      index === 0
        ? { ...person, satisfaction: 20 }
        : index === 1
          ? { ...person, satisfaction: 50 }
          : { ...person, satisfaction: 80 },
    );
    const stats = getAudienceStats({ ...audience, people });
    expect(stats.total).toBe(60);
    expect(stats.criticalCount).toBe(1);
    expect(stats.seriousCount).toBe(1);
    expect(stats.contentCount).toBe(58);
  });

  it('castiga más a las personas críticas con una mala calidad', () => {
    const audience = createAudience(456);
    const before = new Map(audience.people.map((person) => [person.id, person.satisfaction]));
    const { people } = applyQualityToPeople(audience.people, 30);
    const high = people.filter((person) => person.criticality > 0.75);
    const low = people.filter((person) => person.criticality < 0.35);
    const deltaFor = (person) => person.satisfaction - before.get(person.id);
    expect(average(high.map(deltaFor))).toBeLessThan(average(low.map(deltaFor)));
  });

  it('marca para salir a las personas con menor satisfacción', () => {
    const audience = createAudience(789);
    const result = markLowestLeaving(audience.people, 3);
    const leaving = result.people.filter((person) => person.state === 'leaving');
    expect(result.removed).toBe(3);
    expect(leaving).toHaveLength(3);
    expect(Math.max(...leaving.map((person) => person.satisfaction))).toBeLessThanOrEqual(
      Math.min(
        ...result.people
          .filter((person) => person.state === 'seated')
          .map((person) => person.satisfaction),
      ),
    );
  });

  it('la calidad sube con coherencia y novedad y baja con repetición', () => {
    const good = qualityFromEvaluation({
      newCoherence: 74,
      coherenceDelta: 6,
      novelTags: ['a', 'b', 'c'],
      reusedTags: ['x'],
      repeatedCombo: false,
      repeatedObject: false,
      timedOut: false,
      allDifferent: true,
      genreChanged: false,
    });
    const bad = qualityFromEvaluation({
      newCoherence: 34,
      coherenceDelta: -12,
      novelTags: [],
      reusedTags: [],
      repeatedCombo: true,
      repeatedObject: true,
      timedOut: true,
      allDifferent: false,
      genreChanged: true,
    });
    expect(good).toBeGreaterThan(55);
    expect(bad).toBeLessThan(35);
  });
});
