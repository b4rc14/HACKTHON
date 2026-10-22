// Coreografía visual del escenario. Es una capa de presentación pura:
// no modifica el estado del juego, solo decide qué se ve y cómo se mueve.

export const getStagePerformance = ({ phase, incident, genre, result, lastReaction, crisis }) => {
  const actions = [];
  const fx = [];
  let camera = 'wide';

  if (phase === 'crisis' || crisis) {
    actions.push('huddle');
    camera = 'close';
  }

  if (lastReaction?.tone === 'negative' && phase === 'resolution') {
    actions.push('shock');
    camera = 'shake';
    fx.push('audience-heckle');
  }

  if (lastReaction?.tone === 'positive' && phase === 'resolution') {
    actions.push('celebrate');
  }

  if (phase === 'resolution' && result) {
    const dominant = result.dominantGenre;
    if (dominant === 'romance') {
      actions.push('embrace');
      fx.push('petals', 'warm-glow');
      camera = 'intimate';
    } else if (dominant === 'comedy') {
      actions.push('slapstick');
      fx.push('confetti');
      camera = 'wide';
    } else if (dominant === 'scifi') {
      actions.push('levitate');
      fx.push('portal', 'alien-glow');
      camera = 'push';
    }

    if (result.incidentId === 'dinosaur') {
      actions.push(dominant === 'comedy' ? 'slapstick' : 'hide');
      fx.push('dinosaur-shadow');
    }
    if (result.incidentId === 'explosion') {
      fx.push('smoke', 'debris', 'shake');
    }
    if (result.incidentId === 'blackout') {
      actions.push('huddle');
      fx.push('phone-lights');
    }
    if (result.timedOut) {
      fx.push('panic');
    }
    if (result.repeatedCombo) {
      actions.push('shock');
      fx.push('tomato-splat');
    }
  }

  if (phase === 'incident' && incident?.id === 'blackout') {
    actions.push('huddle');
    fx.push('phone-lights');
    camera = 'close';
  }

  if (phase === 'incident' && incident?.id === 'dinosaur') {
    fx.push('dinosaur-shadow');
  }

  return {
    action: actions[actions.length - 1] || (phase === 'incident' ? 'live' : 'idle'),
    actions: [...new Set(actions)],
    fx: [...new Set(fx)],
    camera,
  };
};

export const STAGE_ACTIONS = {
  idle: 'En espera',
  live: 'En escena',
  embrace: 'Abrazo romántico',
  slapstick: 'Número cómico',
  levitate: 'Levantamiento alienígena',
  hide: 'Esconderse del dinosaurio',
  huddle: 'Cuchicheo a oscuras',
  shock: 'Reacción de shock',
  celebrate: 'Saludo al público',
};
