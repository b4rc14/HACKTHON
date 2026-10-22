import React from 'react';

const GROUP_ORDER = ['romantics', 'chaos', 'critics'];

const GROUP_SHORT = {
  romantics: 'ROMÁNTICOS',
  chaos: 'CAOS',
  critics: 'CRÍTICOS',
};

const reactionMarks = (reaction) => {
  if (!reaction) return ['', '', ''];
  if (reaction.type === 'protest') return ['📣', '📣', '📣'];
  if (reaction.type === 'walkout') return ['🚪', '', ''];
  if (reaction.type === 'tomatoes') return ['🍅', '😠', '📱'];
  if (reaction.type === 'boo') return ['👎', '👎', '📱'];
  if (reaction.type === 'yawns') return ['💤', '💤', '🥱'];
  if (reaction.type === 'ovation') return ['🌹', '🙌', '👏'];
  if (reaction.type === 'flowers') return ['🌹', '😍', '👏'];
  if (reaction.type === 'laughs') return ['😂', '😂', '🙂'];
  if (reaction.type === 'applause') return ['👏', '👏', '👏'];
  if (reaction.type === 'murmurs') return ['…', '…', '📝'];
  return ['', '', ''];
};

const clusterSeats = (group, initialTotal) => {
  const shareSeats = Math.round((group.count / initialTotal) * 34);
  return Math.max(group.count > 0 ? 1 : 0, Math.min(18, shareSeats));
};

export default function AudienceView({ audience, stats, reaction, phase }) {
  const groups = GROUP_ORDER.map((id) => audience.groups[id]);
  const marks = reactionMarks(reaction);
  const positive = reaction?.tone === 'positive';
  const negative = reaction?.tone === 'negative';
  const emptySeats = Math.max(0, audience.initialTotal - stats.total);

  return (
    <section
      className={`audience audience--${reaction?.tone || 'quiet'} ${phase === 'crisis' ? 'audience--alert' : ''}`}
      aria-label="Platea"
    >
      <div className="audience-heading">
        <div>
          <span className="audience-kicker">PLATEA</span>
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

      <div className="audience-rows" aria-hidden="true">
        {groups.map((group, groupIndex) => {
          const seats = clusterSeats(group, audience.initialTotal);
          const isLow = group.patience < 32;
          const isBored = group.boredom > 58;
          return (
            <div key={group.id} className={`audience-cluster audience-cluster--${group.id}`}>
              {Array.from({ length: seats }, (_, index) => {
                const mark = marks[groupIndex];
                return (
                  <span
                    key={`${group.id}-${index}`}
                    className={[
                      'seat',
                      `seat--${group.id}`,
                      positive ? 'seat--cheer' : '',
                      negative ? 'seat--unhappy' : '',
                      reaction?.type === 'protest' ? 'seat--standing' : '',
                      isLow ? 'seat--low-patience' : '',
                      isBored ? 'seat--bored' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ '--seat-delay': `${(index % 7) * 0.13 + groupIndex * 0.2}s` }}
                  >
                    <span className="seat__head" />
                    <span className="seat__body" />
                    {mark && index % 5 === 2 ? (
                      <span className="seat__mark">{mark}</span>
                    ) : null}
                  </span>
                );
              })}
            </div>
          );
        })}
        {emptySeats > 0 ? (
          <div className="audience-cluster audience-cluster--empty">
            {Array.from({ length: Math.min(8, Math.ceil(emptySeats / 2)) }, (_, index) => (
              <span key={`empty-${index}`} className="seat seat--empty">
                <span className="seat__head" />
                <span className="seat__body" />
              </span>
            ))}
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
          </div>
          <p>{reaction?.cause || 'Todavía no hay veredicto. El público espera que pase algo.'}</p>
          <small>{reaction?.effect || 'Cada decisión mueve a los tres grupos de forma distinta.'}</small>
        </div>
      </div>

      <div className="audience-floor" aria-hidden="true" />
    </section>
  );
}
