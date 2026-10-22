import React from 'react';
import { GENRES, getControlDef } from '../game/storyData.js';

const GROUP_ORDER = ['romantics', 'chaos', 'critics'];

const AUDIENCE_LIGHT = {
  romantics: '#ff6f91',
  chaos: '#ffd166',
  critics: '#69f0bd',
};

const MONITOR_LIGHT = {
  warm: '#ffc46b',
  scifi: '#5cffc2',
  comic: '#ff86c8',
};

const monitorPropIcon = (selection) => {
  const object = getControlDef('object', selection?.object);
  return object?.icon || '·';
};

export default function CabinMonitor({
  genre,
  phase,
  incident,
  audience,
  stats,
  lastReaction,
  timer,
  stage,
  selections,
}) {
  const meta = GENRES[genre] || GENRES.romance;
  const activeEvent = stage?.activeEvent;
  const broken = stage?.persistentFx?.brokenLight || activeEvent?.id === 'spotlight';
  const monitorLight = MONITOR_LIGHT[selections?.lighting] || meta.color;
  const dots = GROUP_ORDER.flatMap((id) =>
    Array.from(
      { length: Math.max(1, Math.round((audience.groups[id].count / 60) * 10)) },
      () => id,
    ),
  );

  return (
    <div className="cabin-monitors" aria-label="Monitores de la mesa de control">
      <div className={`cabin-monitor ${broken ? 'is-broken' : ''}`}>
        <div className="crt-frame">
          <div
            className={`crt-screen crt-screen--stage ${activeEvent ? 'crt-screen--alert' : ''}`}
            style={{ '--monitor-light': monitorLight }}
          >
            <span className="crt-scanlines" aria-hidden="true" />
            <span className="monitor-cam">CAM 1 · ESCENARIO</span>
            <span className="monitor-rec"><i /> REC</span>
            <div className="mini-stage" aria-hidden="true">
              <span className="mini-curtain mini-curtain--left" />
              <span className="mini-curtain mini-curtain--right" />
              <span className="mini-lamp" />
              <span className="mini-actor mini-actor--lia" />
              <span className="mini-actor mini-actor--bruno" />
              <span className="mini-prop">{monitorPropIcon(selections)}</span>
              {incident?.id === 'explosion' && phase !== 'briefing' ? <span className="mini-smoke" /> : null}
              {broken ? <span className="mini-broken-spark">⚡</span> : null}
            </div>
            <span className="monitor-bottom">
              <span>{meta.upper}</span>
              <b>{activeEvent ? `${activeEvent.timer}s` : `${timer}s`}</b>
            </span>
          </div>
        </div>
        <span className="monitor-label">ESCENARIO</span>
      </div>

      <div className="cabin-monitor">
        <div className="crt-frame">
          <div className={`crt-screen crt-screen--audience ${lastReaction ? `is-${lastReaction.tone}` : ''}`}>
            <span className="crt-scanlines" aria-hidden="true" />
            <span className="monitor-cam">CAM 2 · PLATEA</span>
            <span className="monitor-rec"><i /> REC</span>
            <div className="mini-audience" aria-hidden="true">
              {dots.map((id, index) => (
                <span key={`${id}-${index}`} style={{ '--dot': AUDIENCE_LIGHT[id] }} />
              ))}
            </div>
            <span className="mini-audience-total">{stats.total} en sala</span>
            <span className="monitor-bottom">
              <span>{lastReaction?.label || 'EN ESPERA'}</span>
              <b>{lastReaction?.icon || '👁'}</b>
            </span>
          </div>
        </div>
        <span className="monitor-label">PLATEA</span>
      </div>
    </div>
  );
}
