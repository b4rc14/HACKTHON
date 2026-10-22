import React, { useEffect, useRef } from 'react';
import { isMuted, speakHeckle } from '../game/audio.js';

const GROUP_ORDER = ['romantics', 'chaos', 'critics'];

const GROUP_SHORT = {
  romantics: 'ROMÁNTICOS',
  chaos: 'CAOS',
  critics: 'CRÍTICOS',
};

const REACTION_LINES = {
  applause: ['¡Bravo!', '¡Así se hace!', '¡Más luces!'],
  laughs: ['¡Ja! ¡El gazebo!', '¡Que salga la gallina!', '¡Otra vez!'],
  flowers: ['¡Precioso!', '¡Me caso con el dinosaurio!', '¡Bis!'],
  ovation: ['¡OBRA MAESTRA!', '¡BIS!', '¡Que salga el técnico!'],
  boo: ['¡Esto no es amor!', '¡Devuélveme la entrada!', '¡El gazebo actuaba mejor!'],
  tomatoes: ['¡Fuera, fuera!', '¡A la hoguera el guion!', '¡Esto es un atraco!'],
  walkout: ['¡Nos vamos!', '¡Que alguien llame al técnico!', '¡No aguanto más!'],
  protest: ['¡EXPLICACIONES!', '¡QUEREMOS UN BIS... O LA ENTRADA!', '¡FUERA EL DINOSAURIO!'],
  murmurs: ['No entiendo nada...', '¿Esto venía en el guion?', 'Yo venía por el gazebo.'],
  yawns: ['Qué sueño...', '¿Cuánto queda?', 'Esto no arranca.'],
};

const POSITIVE_TYPES = new Set(['applause', 'laughs', 'flowers', 'ovation']);
const NEGATIVE_TYPES = new Set(['boo', 'tomatoes', 'walkout', 'protest']);
const QUIET_TYPES = new Set(['murmurs', 'yawns']);

const seatMood = (reaction, index) => {
  if (!reaction) return index % 7 === 0 ? 'is-idle' : '';
  if (reaction.type === 'protest') return 'is-standing is-heckling';
  if (reaction.type === 'walkout') return index < 3 ? 'is-leaving' : 'is-shocked';
  if (POSITIVE_TYPES.has(reaction.type)) return 'is-cheering';
  if (NEGATIVE_TYPES.has(reaction.type)) return 'is-heckling';
  if (reaction.type === 'yawns') return 'is-bored';
  if (QUIET_TYPES.has(reaction.type)) return 'is-restless';
  return '';
};

const seatMark = (reaction, index) => {
  if (!reaction) return '';
  if (reaction.type === 'ovation') return index % 4 === 0 ? '🌹' : index % 4 === 1 ? '🙌' : '👏';
  if (reaction.type === 'flowers') return index % 5 === 0 ? '🌹' : index % 5 === 1 ? '😍' : '👏';
  if (reaction.type === 'applause') return index % 4 === 1 ? '👏' : '';
  if (reaction.type === 'laughs') return index % 5 === 2 ? '😂' : '';
  if (reaction.type === 'tomatoes') return index % 5 === 1 ? '🍅' : index % 5 === 2 ? '😠' : '';
  if (reaction.type === 'boo') return index % 5 === 2 ? '👎' : index % 6 === 1 ? '📱' : '';
  if (reaction.type === 'walkout') return index < 3 ? '🚪' : '';
  if (reaction.type === 'protest') return index % 4 === 0 ? '📣' : '';
  if (reaction.type === 'yawns') return index % 5 === 1 ? '💤' : '';
  return '';
};

const groupSeats = (audience, initialTotal) =>
  GROUP_ORDER.map((id) => {
    const group = audience.groups[id];
    return {
      group,
      count: Math.max(group.count > 0 ? 1 : 0, Math.round((group.count / initialTotal) * 60)),
    };
  });

const splitRows = (seatGroups) => {
  const rows = [[], [], [], []];
  seatGroups.forEach(({ group, count }) => {
    const base = Math.floor(count / rows.length);
    const remainder = count % rows.length;
    rows.forEach((row, index) => {
      row.push({ group, count: base + (index < remainder ? 1 : 0) });
    });
  });
  return rows;
};

const interleaveSeats = (rowGroups) => {
  const remaining = rowGroups.map(({ group, count }) => ({ group, count }));
  const seats = [];
  while (remaining.some((entry) => entry.count > 0)) {
    remaining.forEach((entry) => {
      if (entry.count > 0) {
        seats.push(entry.group);
        entry.count -= 1;
      }
    });
  }
  return seats;
};

function CrowdRow({ groups, row, reaction }) {
  const seats = interleaveSeats(groups);
  return (
    <div className={`crowd-row crowd-row--${row}`}>
      {seats.map((group, index) => (
        <Spectator
          key={`${row}-${group.id}-${index}`}
          group={group}
          index={index + (row === 'back' ? 0 : row === 'midback' ? 2 : row === 'midfront' ? 4 : 6)}
          reaction={reaction}
          row={row}
        />
      ))}
    </div>
  );
}

function Spectator({ group, index, reaction, row }) {
  const mark = seatMark(reaction, index);
  const mood = seatMood(reaction, index);
  return (
    <span
      className={`spectator spectator--${group.id} ${mood} ${row === 'back' ? 'spectator--back' : ''}`}
      style={{ '--person': index }}
      aria-hidden="true"
    >
      <span className="spectator__chair" />
      {mark ? <span className="spectator__mark">{mark}</span> : null}
      <span className="spectator__head">
        <i className="spectator__hair" />
      </span>
      <span className="spectator__body">
        <i className="spectator__prop" />
      </span>
      <span className="spectator__arms">
        <i className="spectator__arm spectator__arm--left" />
        <i className="spectator__arm spectator__arm--right" />
      </span>
    </span>
  );
}

export default function AudienceView({ audience, stats, reaction, phase, interactionOutcome }) {
  const groups = GROUP_ORDER.map((id) => audience.groups[id]);
  const [backRow, middleBackRow, middleFrontRow, frontRow] = splitRows(groupSeats(audience, audience.initialTotal));
  const emptySeats = Math.max(0, audience.initialTotal - stats.total);
  const positive = reaction?.tone === 'positive';
  const negative = reaction?.tone === 'negative';
  const lowest = [...groups].sort((a, b) => a.satisfaction - b.satisfaction)[0];
  const highest = [...groups].sort((a, b) => b.satisfaction - a.satisfaction)[0];
  const speaker = negative ? lowest : highest;
  const lines = REACTION_LINES[reaction?.type] || [];
  const interactionLine =
    interactionOutcome?.actionId === 'engage'
      ? 'El técnico acaba de mirar al público. La sala responde.'
      : null;
  const spokenReactionRef = useRef(null);

  useEffect(() => {
    if (!reaction || !lines.length || reaction.id === spokenReactionRef.current) return;
    spokenReactionRef.current = reaction.id;
    const angry = ['boo', 'tomatoes', 'protest', 'walkout'].includes(reaction.type);
    if (angry && !isMuted()) {
      speakHeckle(lines[0]);
    }
  }, [reaction, lines, phase]);

  return (
    <section
      className={`audience audience--${reaction?.tone || 'quiet'} ${phase === 'crisis' ? 'audience--alert' : ''}`}
      aria-label="Platea"
    >
      <div className="audience-heading">
        <div>
          <span className="audience-kicker">PLATEA · CAM 2</span>
          <strong className="audience-total">
            {stats.total} <span>/ {audience.initialTotal}</span>
          </strong>
        </div>
        <div className="audience-groups-mini">
          {groups.map((group) => (
            <span key={group.id} className={`audience-group audience-group--${group.id}`}>
              <span className="audience-dot" aria-hidden="true" />
              {GROUP_SHORT[group.id]} <b>{group.count}</b>
              <small>{Math.round(group.satisfaction)}%</small>
            </span>
          ))}
        </div>
      </div>

      <div className={`crowd-scene ${reaction?.type === 'walkout' ? 'has-walkout' : ''}`}>
        <div className="crowd-screen" aria-hidden="true" />
        <span className="crowd-side crowd-side--left" aria-hidden="true" />
        <span className="crowd-side crowd-side--right" aria-hidden="true" />
        <span className="exit-sign exit-sign--left">SALIDA</span>
        <span className="exit-sign exit-sign--right">SALIDA</span>

        <div className="crowd-rows" aria-hidden="true">
          <CrowdRow groups={backRow} row="back" reaction={reaction} />
          <div className="crowd-aisle" />
          <CrowdRow groups={middleBackRow} row="midback" reaction={reaction} />
          <div className="crowd-aisle" />
          <CrowdRow groups={middleFrontRow} row="midfront" reaction={reaction} />
          <div className="crowd-aisle" />
          <div className="crowd-row crowd-row--front">
            {interleaveSeats(frontRow).map((group, index) => (
              <Spectator
                key={`front-${group.id}-${index}`}
                group={group}
                index={index + 6}
                reaction={reaction}
                row="front"
              />
            ))}
            {emptySeats > 0 ? (
              <span className="crowd-empty" title={`${emptySeats} butacas vacías`}>
                {Array.from({ length: Math.min(8, emptySeats) }, (_, index) => (
                  <span key={index} className="empty-chair">⌑</span>
                ))}
              </span>
            ) : null}
          </div>
        </div>

        {reaction?.type === 'walkout' ? (
          <div className="walkout-lane" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <span key={index} className={`spectator spectator--${lowest.id} is-walking`} style={{ '--person': index }}>
                <span className="spectator__head"><i className="spectator__hair" /></span>
                <span className="spectator__body" />
                <span className="spectator__arms">
                  <i className="spectator__arm spectator__arm--left" />
                  <i className="spectator__arm spectator__arm--right" />
                </span>
              </span>
            ))}
            <span className="walkout-label">SE VAN</span>
          </div>
        ) : null}

        {reaction?.type !== 'walkout' && lines.length ? (
          <div className="audience-heckles" aria-live="polite">
            <span className={`heckle-bubble heckle-bubble--one ${negative ? 'is-negative' : 'is-positive'}`}>
              <b>{speaker.name}</b>
              {lines[0]}
            </span>
            <span className={`heckle-bubble heckle-bubble--two ${negative ? 'is-negative' : 'is-positive'}`}>
              <b>{negative ? 'OTRO ESPECTADOR' : 'PLATEA'}</b>
              {lines[1] || lines[0]}
            </span>
          </div>
        ) : null}
      </div>

      <div className={`audience-reaction audience-reaction--${reaction?.tone || 'quiet'}`}>
        <span className="audience-reaction__icon" aria-hidden="true">
          {reaction?.icon || '👁'}
        </span>
        <div className="audience-reaction__copy">
          <div className="audience-reaction__title">
            <strong>{reaction?.label || 'La platea observa'}</strong>
            {reaction?.simulated ? <span className="demo-tag">SIMULADO</span> : null}
            {interactionLine ? <span className="interaction-tag">INTERACCIÓN</span> : null}
          </div>
          <p>{interactionLine || reaction?.cause || 'Todavía no hay veredicto. El público espera que pase algo.'}</p>
          <small>{reaction?.effect || 'Cada decisión mueve a los tres grupos de forma distinta.'}</small>
        </div>
      </div>
    </section>
  );
}
