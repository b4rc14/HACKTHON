// Eventos técnicos aleatorios del escenario. Datos puros y reutilizables.

export const STAGE_EVENTS = {
  spotlight: {
    id: 'spotlight',
    title: '¡EL FOCO HA EXPLOTADO!',
    shortTitle: 'Foco roto',
    icon: '✦',
    subtitle: 'El foco principal ha estallado. Recoge los cristales.',
    objective: 'Recoge 6 cristales. Evita los tornillos.',
    targetLabel: 'Cristal',
    targetPlural: 'CRISTALES',
    targetIcon: '◆',
    decoyLabel: 'Tornillo',
    decoyIcon: '⚙',
    dropLabel: 'BANDEJA DE CRISTALES',
    timer: 10,
    tone: 'amber',
    successTitle: 'LUZ RESTAURADA',
    failTitle: 'ESCENARIO A OSCURAS',
    intro: 'El foco estalla y llueve cristal sobre las tablas.',
    successText: 'Foco restaurado. La escena recupera la luz.',
    failText: 'El escenario queda a oscuras.',
    successEffects: {
      trust: 7,
      coherence: 2,
      chaos: -3,
      discontent: -4,
      groups: { romantics: 2, chaos: -1, critics: 3 },
    },
    failEffects: {
      trust: -6,
      coherence: -3,
      chaos: 6,
      discontent: 7,
      groups: { romantics: -3, chaos: 2, critics: -2 },
    },
    targets: [
      { id: 'shard-1', type: 'target', label: 'Cristal', icon: '◆', x: 16, y: 32, size: 'md', rotate: -12 },
      { id: 'shard-2', type: 'target', label: 'Cristal', icon: '◆', x: 34, y: 64, size: 'sm', rotate: 18 },
      { id: 'shard-3', type: 'target', label: 'Cristal', icon: '◆', x: 48, y: 25, size: 'lg', rotate: 7 },
      { id: 'shard-4', type: 'target', label: 'Cristal', icon: '◆', x: 65, y: 58, size: 'md', rotate: -22 },
      { id: 'shard-5', type: 'target', label: 'Cristal', icon: '◆', x: 79, y: 31, size: 'sm', rotate: 34 },
      { id: 'shard-6', type: 'target', label: 'Cristal', icon: '◆', x: 88, y: 72, size: 'md', rotate: 11 },
      { id: 'screw-1', type: 'decoy', label: 'Tornillo', icon: '⚙', x: 24, y: 78, size: 'sm', rotate: 0 },
      { id: 'screw-2', type: 'decoy', label: 'Tornillo', icon: '⚙', x: 58, y: 77, size: 'sm', rotate: 0 },
    ],
  },
  cable: {
    id: 'cable',
    title: '¡CHISPAS EN EL CABLE!',
    shortTitle: 'Cable pelado',
    icon: '⚡',
    subtitle: 'Un cable chispea. Localiza los puntos calientes.',
    objective: 'Pulsa los 4 chispazos. Evita el fusible rojo.',
    targetLabel: 'Chispazo',
    targetPlural: 'CHISPAZOS',
    targetIcon: '⚡',
    decoyLabel: 'Fusible rojo',
    decoyIcon: '✖',
    dropLabel: 'CAJA DE FUSIBLES',
    timer: 9,
    tone: 'cyan',
    successTitle: 'CABLE ESTABILIZADO',
    failTitle: 'SOBRECARGA ELÉCTRICA',
    intro: 'Un chisporroteo sube por el telar.',
    successText: 'Cable estabilizado.',
    failText: 'Salta el cuadro eléctrico.',
    successEffects: {
      trust: 5,
      coherence: 1,
      chaos: -4,
      discontent: -3,
      groups: { romantics: 1, chaos: -1, critics: 3 },
    },
    failEffects: {
      trust: -5,
      coherence: -2,
      chaos: 8,
      discontent: 6,
      groups: { romantics: -2, chaos: 3, critics: -3 },
    },
    targets: [
      { id: 'spark-1', type: 'target', label: 'Chispazo', icon: '⚡', x: 20, y: 28, size: 'md', rotate: -8 },
      { id: 'spark-2', type: 'target', label: 'Chispazo', icon: '⚡', x: 44, y: 63, size: 'lg', rotate: 14 },
      { id: 'spark-3', type: 'target', label: 'Chispazo', icon: '⚡', x: 67, y: 34, size: 'sm', rotate: 0 },
      { id: 'spark-4', type: 'target', label: 'Chispazo', icon: '⚡', x: 82, y: 68, size: 'md', rotate: -17 },
      { id: 'fuse-bad', type: 'decoy', label: 'Fusible rojo', icon: '✖', x: 55, y: 23, size: 'sm', rotate: 0 },
    ],
  },
  chicken: {
    id: 'chicken',
    title: 'LA GALLINA SE HA ESCAPADO',
    shortTitle: 'Gallina fugitiva',
    icon: '🐔',
    subtitle: 'La gallina de atrezo se ha escapado.',
    objective: 'Atrapa la gallina 5 veces.',
    targetLabel: 'Gallina',
    targetPlural: 'GALLINAS',
    targetIcon: '🐔',
    decoyLabel: 'Pluma',
    decoyIcon: '✧',
    dropLabel: 'JAULA DE ATRESZO',
    timer: 8,
    tone: 'pink',
    successTitle: 'GALLINA ATRAPADA',
    failTitle: 'GALLINA FUERA DE CONTROL',
    intro: 'La gallina cruza el escenario.',
    successText: 'Gallina devuelta al atrezo.',
    failText: 'La gallina se queda en escena.',
    successEffects: {
      trust: 3,
      coherence: 1,
      chaos: 3,
      discontent: -2,
      groups: { romantics: -1, chaos: 6, critics: 1 },
    },
    failEffects: {
      trust: -2,
      coherence: -2,
      chaos: 7,
      discontent: 4,
      groups: { romantics: -2, chaos: 4, critics: -2 },
    },
    targets: [
      { id: 'hen-1', type: 'target', label: 'Gallina', icon: '🐔', x: 18, y: 38, size: 'md', rotate: -9 },
      { id: 'hen-2', type: 'target', label: 'Gallina', icon: '🐔', x: 37, y: 69, size: 'sm', rotate: 12 },
      { id: 'hen-3', type: 'target', label: 'Gallina', icon: '🐔', x: 55, y: 28, size: 'lg', rotate: 0 },
      { id: 'hen-4', type: 'target', label: 'Gallina', icon: '🐔', x: 72, y: 60, size: 'md', rotate: -20 },
      { id: 'hen-5', type: 'target', label: 'Gallina', icon: '🐔', x: 87, y: 33, size: 'sm', rotate: 22 },
    ],
  },
};

export const STAGE_EVENT_IDS = Object.keys(STAGE_EVENTS);

export const getStageEventDef = (id) => STAGE_EVENTS[id] || null;

export const getEventTargets = (event) =>
  (event?.targets || []).filter((target) => target.type === 'target');

export const getEventProgress = (event) => {
  if (!event) return { collected: 0, total: 0, percent: 0 };
  const targets = getEventTargets(event);
  const collected = targets.filter((target) => event.collected?.includes(target.id)).length;
  return {
    collected,
    total: targets.length,
    percent: targets.length ? (collected / targets.length) * 100 : 0,
  };
};
