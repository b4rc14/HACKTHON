import { getControlDef, getCurrentIncident, GENRES } from './storyData.js';
import { clamp, formatSigned, round1, unique } from './utils.js';

const FALLBACK_SELECTION = {
  lighting: 'warm',
  sound: 'romantic',
  object: 'flowers',
};

export const getSelectionDefs = (selection) =>
  ['lighting', 'sound', 'object']
    .map((kind) => getControlDef(kind, selection?.[kind]))
    .filter(Boolean);

export const getSelectionTags = (selection) =>
  unique(getSelectionDefs(selection).flatMap((control) => control.tags));

export const getSelectionSignature = (selection) =>
  ['lighting', 'sound', 'object'].map((kind) => selection?.[kind] || 'none').join('|');

export const selectionIsComplete = (selection) =>
  Boolean(selection?.lighting && selection?.sound && selection?.object);

export const fillSelection = (selection) => ({
  lighting: selection?.lighting || FALLBACK_SELECTION.lighting,
  sound: selection?.sound || FALLBACK_SELECTION.sound,
  object: selection?.object || FALLBACK_SELECTION.object,
});

export const chooseDominantGenre = (scores, previous = 'romance') => {
  let winner = previous;
  let best = scores[previous] ?? -Infinity;
  Object.entries(scores).forEach(([genre, score]) => {
    if (score > best + 0.001) {
      best = score;
      winner = genre;
    }
  });
  return winner;
};

const addPoints = (base, extra = {}) => {
  const result = { ...base };
  Object.entries(extra).forEach(([genre, value]) => {
    result[genre] = (result[genre] || 0) + value;
  });
  return result;
};

const selectDialogueForObject = (objectId) => {
  if (objectId === 'ufo') {
    return 'El platillo volante desciende con un zumbido de nevera averiada. Nadie sabe si es atrezo o una oferta de paz.';
  }
  if (objectId === 'chicken') {
    return 'La gallina cruza el escenario con la autoridad de quien conoce al director. El público, por alguna razón, la cree.';
  }
  return 'Las flores de plástico caen sobre la escena. Huelen a victoria y a garaje.';
};

const dominantFlavor = {
  romance:
    'La historia encuentra una emoción escondida entre los escombros. El regidor pide que nadie mueva la viga: da ambiente.',
  comedy:
    'El accidente se convierte en número cómico. El apuntador se ríe tanto que pierde la página.',
  scifi:
    'El decorado de época acaba de ser reclasificado como tecnología alienígena. La utilería exige derechos de autor.',
};

const actorFlavor = {
  romance: 'Lía improvisa una mirada intensa. Bruno la imita con dos segundos de retraso.',
  comedy: 'Bruno tropieza con el cable de la luz y decide que era parte del gag.',
  scifi: 'Lía habla con un acento alienígena inventado. Bruno asiente como si lo hubiera estudiado.',
};

export const evaluateNarrative = (state, rawSelection, { timedOut = false } = {}) => {
  const incident = getCurrentIncident(state);
  const filled = filledWithFallback(rawSelection);
  const selection = filled.selection;
  const defs = getSelectionDefs(selection);
  const tags = getSelectionTags(selection);
  const signature = getSelectionSignature(selection);
  const previousScores = state.narrative.genreScores;
  const previousDominant = state.narrative.dominantGenre;
  const establishedTags = state.narrative.establishedTags || [];
  const history = state.narrative.history || [];

  const points = defs.reduce(
    (acc, control) => addPoints(acc, control.genres),
    { romance: 0, comedy: 0, scifi: 0 },
  );
  const withAffinity = addPoints(points, incident.affinity || {});

  const nextScores = Object.fromEntries(
    Object.keys(GENRES).map((genre) => [
      genre,
      round1((previousScores[genre] || 0) * 0.62 + (withAffinity[genre] || 0)),
    ]),
  );
  const dominantGenre = chooseDominantGenre(nextScores, previousDominant);
  const genreChanged = dominantGenre !== previousDominant;

  const primaryGenres = defs.map((control) => control.genre);
  const allDifferent = new Set(primaryGenres).size === 3;
  const sameGenreCount = primaryGenres.filter((genre) => genre === dominantGenre).length;
  const repeatedCombo = history.some(
    (entry) => (entry.selectionSignature || entry.comboSignature) === signature,
  );
  const repeatedObject = history.some((entry) => entry.selection?.object === selection.object);
  const reusedTags = tags.filter((tag) => establishedTags.includes(tag));
  const novelTags = tags.filter((tag) => !establishedTags.includes(tag));
  const callbackTag = reusedTags[0] || null;
  const lastEntry = history[history.length - 1] || null;

  let coherenceDelta = 0;
  if (!history.length) {
    coherenceDelta += sameGenreCount >= 2 ? 2 : 0;
    coherenceDelta += (incident.affinity?.[dominantGenre] || 0) >= 3 ? 1 : 0;
  } else if (genreChanged) {
    const bridge = reusedTags.length > 0 || (dominantGenre === 'scifi' && establishedTags.includes('alien'));
    let penalty = bridge ? -4 : -10;
    if (incident.id === 'dinosaur' && dominantGenre === 'scifi' && establishedTags.includes('space')) {
      penalty += 2;
    }
    if (incident.id === 'blackout') penalty += 3;
    coherenceDelta += penalty;
  } else {
    coherenceDelta += 2;
    coherenceDelta += Math.min(2, Math.ceil(reusedTags.length / 2));
  }

  if (repeatedCombo) coherenceDelta -= 14;
  else if (repeatedObject) coherenceDelta -= 3;
  if (allDifferent) coherenceDelta -= 4;
  if (sameGenreCount === 3) coherenceDelta += 1;
  if ((incident.affinity?.[dominantGenre] || 0) >= 3) coherenceDelta += 1;
  if (state.actors.trust < 35) coherenceDelta -= 3;
  if (filled.wasFilled) coherenceDelta -= 5;

  if (timedOut) {
    coherenceDelta -= 12;
  }

  coherenceDelta = Math.round(coherenceDelta);
  const newCoherence = clamp(state.narrative.coherence + coherenceDelta);

  const variant = incident.variants[dominantGenre] || incident.variants.romance;
  const tokens = {
    object: getControlDef('object', selection.object)?.label?.toLowerCase() || 'objeto',
    light: getControlDef('lighting', selection.lighting)?.label?.toLowerCase() || 'luz',
    sound: getControlDef('sound', selection.sound)?.label?.toLowerCase() || 'sonido',
    genre: GENRES[dominantGenre].label.toLowerCase(),
    previous: lastEntry?.headline || 'la escena anterior',
    callback: callbackTag || 'nada en especial',
  };

  const dialogue = variant.dialogue.map((line) => ({ ...line }));
  dialogue.push({ speaker: 'TÉCNICO', text: selectDialogueForObject(selection.object) });
  dialogue.push({ speaker: 'NARRADOR', text: dominantFlavor[dominantGenre] });

  if (repeatedCombo) {
    dialogue.push({
      speaker: 'ESPECTADOR DEL FONDO',
      text: 'Esta combinación ya la hemos visto. ¿No teníais otro accidente?',
    });
  } else if (genreChanged && reusedTags.length === 0) {
    dialogue.push({
      speaker: 'CRÍTICO',
      text: `El giro hacia ${GENRES[dominantGenre].label.toLowerCase()} no viene de ninguna parte. Y aun así... no puedo apartar la vista.`,
    });
  } else if (lastEntry && reusedTags.length > 0) {
    dialogue.push({
      speaker: 'LÍA',
      text: `Esto conecta con lo de «${lastEntry.headline}». El público acaba de darse cuenta.`,
    });
  }

  dialogue.push({ speaker: 'APUNTADOR', text: actorFlavor[dominantGenre] });

  const dynamicBits = [
    selectDialogueForObject(selection.object),
    lastEntry && reusedTags.length ? `El público reconoce la referencia a «${lastEntry.headline}».` : '',
    repeatedCombo ? 'La repetición se nota y el entusiasmo baja.' : '',
  ].filter(Boolean);

  return {
    incidentId: incident.id,
    incidentIndex: state.incidentIndex,
    sceneNumber: state.incidentIndex + 1,
    act: state.incidentIndex + 1,
    timedOut,
    wasFilled: filled.wasFilled,
    selection,
    controls: defs.map((control) => ({
      id: control.id,
      label: control.label,
      icon: control.icon,
      kind: control.genre,
    })),
    tags,
    comboSignature: signature,
    points: withAffinity,
    genreScores: nextScores,
    dominantGenre,
    previousDominant,
    genreChanged,
    coherenceDelta,
    newCoherence,
    repeatedCombo,
    repeatedObject,
    reusedTags,
    novelTags,
    callbackTag,
    hasHistory: history.length > 0,
    allDifferent,
    sameGenreCount,
    affinity: incident.affinity?.[dominantGenre] || 0,
    headline: variant.headline,
    summary: `${variant.summary} ${dynamicBits.join(' ')}`.trim(),
    dialogue,
    tokens,
    actorLine: actorFlavor[dominantGenre],
    memory: lastEntry
      ? lastEntry.headline
      : 'Aún no hay memoria: esta escena será la que recuerden las siguientes.',
    coherenceLabel:
      coherenceDelta > 0 ? `+${coherenceDelta}` : formatSigned(coherenceDelta),
  };
};

function filledWithFallback(rawSelection) {
  const selection = {
    lighting: rawSelection?.lighting || FALLBACK_SELECTION.lighting,
    sound: rawSelection?.sound || FALLBACK_SELECTION.sound,
    object: rawSelection?.object || FALLBACK_SELECTION.object,
  };
  const wasFilled =
    !rawSelection?.lighting || !rawSelection?.sound || !rawSelection?.object;
  return { selection, wasFilled };
}

export const getActorStatus = (trust) => {
  if (trust >= 68) return 'firmes';
  if (trust >= 48) return 'tensos';
  if (trust >= 28) return 'nerviosos';
  return 'bloqueados';
};

export const generateTitle = (state) => {
  const tags = new Set(state.narrative.establishedTags || []);
  const genre = state.narrative.dominantGenre;
  const has = (...values) => values.some((value) => tags.has(value));

  let title = 'EL JARDÍN DE LOS SUSURROS';
  let subtitle = 'Una historia de amor con problemas técnicos.';

  if (genre === 'scifi') {
    subtitle = 'Una historia de amor que desafía la extinción, la física y el presupuesto de atrezo.';
    if (has('dinosaur') && has('alien', 'space')) title = 'AMOR JURÁSICO INTERGALÁCTICO';
    else if (has('chicken')) title = 'ABDUCCIÓN EN EL CORRAL';
    else if (has('blackout')) title = 'EL NOVIAJE DE LA ÚLTIMA LUZ';
    else if (has('explosion')) title = 'PRIMER CONTACTO EN EL JARDÍN';
    else title = 'PROTOCOLO: TE QUIERO';
  } else if (genre === 'comedy') {
    subtitle = 'Una comedia romántica con daños materiales y una gallina sin contrato.';
    if (has('dinosaur')) title = 'BODA PREHISTÓRICA';
    else if (has('chicken')) title = 'LA GALLINA QUE SUSURRABA';
    else if (has('ufo', 'space')) title = 'EL GAZEBO ERA UN OVNI';
    else if (has('blackout')) title = 'APAGÓN, PERO CON RITMO';
    else title = '¡QUE EXPLOTE EL AMOR!';
  } else {
    subtitle = 'Una historia de amor en la que el decorado tiene más peligro que los celos.';
    if (has('blackout')) title = 'AMOR A OSCURAS';
    else if (has('dinosaur')) title = 'AMOR DE OTRAS ERAS';
    else if (has('explosion')) title = 'CORAZONES EN LLAMAS';
    else if (has('chicken')) title = 'UN AMOR CON PLUMAS';
  }

  return { title, subtitle };
};
