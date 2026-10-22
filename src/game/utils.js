export const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export const round1 = (value) => Math.round(value * 10) / 10;

export const sum = (values) => values.reduce((total, value) => total + value, 0);

export const unique = (values) => [...new Set(values)];

export const weightedAverage = (entries) => {
  const totalWeight = sum(entries.map((entry) => entry.weight));
  if (totalWeight <= 0) return 0;
  return sum(entries.map((entry) => entry.value * entry.weight)) / totalWeight;
};

export const formatSigned = (value, suffix = '') => {
  const rounded = Math.round(value);
  if (rounded === 0) return `0${suffix}`;
  return `${rounded > 0 ? '+' : ''}${rounded}${suffix}`;
};

export const fillTemplate = (template, tokens) =>
  String(template).replace(/\{(\w+)\}/g, (_, key) => tokens[key] ?? `{${key}}`);

export const pickByIndex = (items, index) => items[Math.abs(index) % items.length];

export const removeSpectators = (groups, amount) => {
  let remaining = amount;
  const next = Object.fromEntries(
    Object.entries(groups).map(([id, group]) => [id, { ...group }]),
  );
  while (remaining > 0) {
    const candidates = Object.values(next)
      .filter((group) => group.count > 0)
      .sort((a, b) => a.satisfaction - b.satisfaction || a.patience - b.patience);
    if (!candidates.length) break;
    const victim = candidates[0];
    victim.count -= 1;
    victim.patience = clamp(victim.patience + 6);
    victim.walkouts = (victim.walkouts || 0) + 1;
    remaining -= 1;
  }
  return next;
};
