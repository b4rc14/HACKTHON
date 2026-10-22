import React from 'react';
import AudienceView from './AudienceView.jsx';
import { GENRES } from '../game/storyData.js';

const LIGHT_COLORS = {
  warm: '#ffc46b',
  scifi: '#5cffc2',
  comic: '#ff86c8',
};

const GENRE_LIGHT = {
  romance: '#ffb36b',
  comedy: '#ff7ac8',
  scifi: '#4dffb8',
};

const PETALS = [
  [8, 8, 0.2],
  [18, 4, 1.3],
  [31, 12, 0.7],
  [42, 6, 1.9],
  [55, 10, 0.4],
  [67, 5, 1.5],
  [78, 9, 0.9],
  [88, 13, 2.2],
  [24, 15, 2.6],
  [49, 16, 1.1],
  [73, 14, 0.3],
  [93, 17, 1.8],
];

function ActorFigure({ who, mood, speaking }) {
  const isLia = who === 'lia';
  const name = isLia ? 'Lía' : 'Bruno';
  const panic = mood === 'panic' || mood === 'shock';
  const nervous = mood === 'nervous';

  return (
    <div
      className={[
        'actor',
        `actor--${isLia ? 'lia' : 'bruno'}`,
        `actor--${mood}`,
        speaking ? 'is-speaking' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${name}, ${mood}`}
    >
      <svg viewBox="0 0 140 260" role="img" aria-hidden="true">
        <ellipse cx="70" cy="248" rx="40" ry="8" fill="rgba(0,0,0,.35)" />
        <g className="actor__figure">
          {isLia ? (
            <>
              <path
                className="actor__arm actor__arm--back"
                d="M48 132 C28 148 24 174 35 196"
                fill="none"
                stroke="#d8a07d"
                strokeWidth="9"
                strokeLinecap="round"
              />
              <path
                className="actor__body actor__dress"
                d="M52 126 C38 176 22 220 18 242 L122 242 C116 216 101 173 88 126 Z"
              />
              <path
                className="actor__dress-fold"
                d="M64 146 C60 184 58 214 56 242 M80 146 C84 182 86 216 88 242"
                fill="none"
                stroke="rgba(62,6,24,.35)"
                strokeWidth="3"
              />
              <path
                className="actor__sash"
                d="M50 135 C62 150 80 150 90 133 L93 145 C80 163 60 163 47 145 Z"
              />
              <path
                className="actor__neck"
                d="M62 116 L60 132 C67 139 75 139 82 132 L80 116 Z"
                fill="#e2ab85"
              />
              <circle className="actor__head" cx="70" cy="90" r="31" fill="#e8b48e" />
              <path
                className="actor__hair"
                d="M37 94 C31 56 46 44 70 43 C96 43 108 59 103 95 C96 77 91 70 83 62 C72 74 54 79 37 94 Z"
                fill="#4a161e"
              />
              <path
                className="actor__hair actor__hair--long"
                d="M38 84 C29 122 32 158 40 174 C46 158 45 126 47 104 Z M102 84 C111 121 108 157 100 173 C94 157 95 127 93 104 Z"
                fill="#4a161e"
              />
              <path
                className="actor__arm actor__arm--front"
                d="M91 132 C108 148 112 173 104 196"
                fill="none"
                stroke="#e8b48e"
                strokeWidth="9"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <path
                className="actor__arm actor__arm--back"
                d="M48 137 C29 154 26 180 38 200"
                fill="none"
                stroke="#d8a07d"
                strokeWidth="9"
                strokeLinecap="round"
              />
              <path
                className="actor__body actor__suit"
                d="M48 128 L44 240 L108 240 L96 128 C88 121 58 121 48 128 Z"
              />
              <path className="actor__shirt" d="M60 126 L70 145 L80 126 Z" fill="#f4ead6" />
              <path className="actor__tie" d="M70 140 L65 157 L70 166 L75 157 Z" fill="#b21e3d" />
              <path
                className="actor__lapel"
                d="M58 130 L70 148 L60 161 L50 135 Z M82 130 L70 148 L80 161 L90 135 Z"
                fill="rgba(0,0,0,.14)"
              />
              <path className="actor__neck" d="M62 116 L60 132 C67 139 75 139 82 132 L80 116 Z" fill="#e2ab85" />
              <circle className="actor__head" cx="70" cy="90" r="31" fill="#e8b48e" />
              <path
                className="actor__hair"
                d="M38 83 C39 52 54 45 73 45 C96 47 104 64 101 88 C92 74 83 69 74 66 C61 73 49 77 38 83 Z"
                fill="#2e211d"
              />
              <path
                className="actor__arm actor__arm--front"
                d="M94 137 C110 153 112 177 102 199"
                fill="none"
                stroke="#e8b48e"
                strokeWidth="9"
                strokeLinecap="round"
              />
            </>
          )}

          <g className="actor__face">
            {panic ? (
              <>
                <path d="M52 83 L60 91 M60 83 L52 91 M80 83 L88 91 M88 83 L80 91" stroke="#2b1a1a" strokeWidth="3" strokeLinecap="round" />
                <ellipse cx="70" cy="105" rx="8" ry="10" fill="#5c2028" />
              </>
            ) : (
              <>
                <circle cx="58" cy="86" r={nervous ? 4.4 : 3.7} fill="#2b1a1a" />
                <circle cx="82" cy="86" r={nervous ? 4.4 : 3.7} fill="#2b1a1a" />
                <circle cx="59.3" cy="84.7" r="1.1" fill="#fff" />
                <circle cx="83.3" cy="84.7" r="1.1" fill="#fff" />
                {nervous ? (
                  <path d="M62 106 Q70 101 78 106" fill="none" stroke="#6e2635" strokeWidth="2.6" strokeLinecap="round" />
                ) : (
                  <path d="M61 102 Q70 112 79 102" fill="none" stroke="#6e2635" strokeWidth="2.8" strokeLinecap="round" />
                )}
              </>
            )}
            <ellipse cx="48" cy="96" rx="5" ry="2.6" fill="rgba(196,76,90,.32)" />
            <ellipse cx="92" cy="96" rx="5" ry="2.6" fill="rgba(196,76,90,.32)" />
            {nervous || panic ? (
              <path d="M104 71 C107 77 107 81 103 84 C99 81 99 77 104 71 Z" fill="#8ed8ff" />
            ) : null}
          </g>
        </g>
      </svg>
      <span className="actor__name">{name}</span>
    </div>
  );
}

function SetPiece({ genre }) {
  return (
    <svg
      className={`set-piece set-piece--${genre}`}
      viewBox="0 0 1000 500"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--backdrop-top, #241324)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--backdrop-bottom, #4b1d2f)' }} />
        </linearGradient>
        <linearGradient id="columnGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8d6a51" />
          <stop offset="45%" stopColor="#d7b98d" />
          <stop offset="100%" stopColor="#6f4b3a" />
        </linearGradient>
        <pattern id="floorLines" width="76" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 22 L76 22" stroke="rgba(0,0,0,.22)" strokeWidth="2" />
          <path d="M38 0 L38 22" stroke="rgba(0,0,0,.13)" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="1000" height="500" fill="url(#skyGradient)" />
      <circle cx="785" cy="92" r="52" fill="rgba(255,232,177,.65)" className="set-piece__moon" />
      <circle cx="785" cy="92" r="66" fill="none" stroke="rgba(255,232,177,.18)" strokeWidth="6" />
      <path d="M0 340 C150 300 210 322 344 300 C500 272 594 326 720 300 C840 275 916 300 1000 286 L1000 500 L0 500 Z" fill="rgba(30,15,27,.45)" />

      <g className="set-piece__gazebo">
        <path d="M282 350 L282 168 L500 68 L718 168 L718 350 Z" fill="rgba(69,33,35,.55)" stroke="rgba(231,192,124,.44)" strokeWidth="5" />
        <path d="M240 178 L500 56 L760 178" fill="none" stroke="#d8b077" strokeWidth="13" strokeLinecap="round" />
        <path d="M258 166 L500 60 L742 166" fill="none" stroke="rgba(83,40,35,.8)" strokeWidth="4" />
        <rect x="303" y="176" width="30" height="190" rx="6" fill="url(#columnGradient)" />
        <rect x="667" y="176" width="30" height="190" rx="6" fill="url(#columnGradient)" />
        <rect x="400" y="156" width="22" height="214" rx="5" fill="url(#columnGradient)" opacity=".72" />
        <rect x="578" y="156" width="22" height="214" rx="5" fill="url(#columnGradient)" opacity=".72" />
        <path d="M318 208 C420 238 580 238 682 208" fill="none" stroke="rgba(237,200,135,.55)" strokeWidth="6" />
        <path d="M332 264 C430 284 570 284 668 264" fill="none" stroke="rgba(237,200,135,.34)" strokeWidth="4" />
        <path d="M346 320 C436 332 564 332 654 320" fill="none" stroke="rgba(237,200,135,.24)" strokeWidth="3" />
        <circle cx="500" cy="120" r="24" fill="rgba(255,220,153,.18)" stroke="rgba(255,220,153,.5)" strokeWidth="3" />
        <path d="M500 108 L505 118 L516 120 L505 124 L500 136 L495 124 L484 120 L495 118 Z" fill="#f1d08f" opacity=".8" />
      </g>

      <rect y="348" width="1000" height="152" fill="#2b141b" />
      <rect y="348" width="1000" height="152" fill="url(#floorLines)" />
      <path d="M0 348 L1000 348" stroke="rgba(238,199,130,.28)" strokeWidth="4" />
      <path d="M250 500 L312 348 M750 500 L688 348" stroke="rgba(238,199,130,.12)" strokeWidth="3" />
      <ellipse cx="500" cy="440" rx="330" ry="38" fill="rgba(0,0,0,.3)" />
    </svg>
  );
}

function PropArt({ type }) {
  if (type === 'ufo') {
    return (
      <div className="prop prop--ufo" aria-label="Platillo volante">
        <svg viewBox="0 0 160 100" aria-hidden="true">
          <ellipse cx="80" cy="52" rx="64" ry="20" fill="#607d7a" stroke="#c7ffdc" strokeWidth="2" />
          <path d="M28 48 C48 20 112 20 132 48 Z" fill="rgba(127,255,202,.55)" stroke="#d8fff0" strokeWidth="2" />
          <circle cx="52" cy="54" r="4" fill="#fff4a8" />
          <circle cx="76" cy="58" r="4" fill="#ff8a8a" />
          <circle cx="102" cy="54" r="4" fill="#a7fff0" />
          <ellipse cx="80" cy="52" rx="34" ry="6" fill="rgba(216,255,240,.4)" />
        </svg>
        <span className="prop__beam" />
      </div>
    );
  }
  if (type === 'chicken') {
    return (
      <div className="prop prop--chicken" aria-label="Gallina">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <ellipse cx="58" cy="92" rx="34" ry="8" fill="rgba(0,0,0,.25)" />
          <path d="M30 77 C18 54 38 35 65 38 C91 41 103 64 88 80 C75 94 42 96 30 77 Z" fill="#f3e6ce" stroke="#8c6b52" strokeWidth="3" />
          <path d="M42 66 C53 55 68 55 78 66 C68 74 52 76 42 66 Z" fill="#d9c6a5" />
          <circle cx="81" cy="42" r="17" fill="#f6ebd8" stroke="#8c6b52" strokeWidth="3" />
          <path d="M72 27 C74 17 82 17 84 26 C88 18 94 21 92 30" fill="#d84438" stroke="#8c2a22" strokeWidth="2" />
          <path d="M96 42 L110 48 L96 53 Z" fill="#e9a532" />
          <circle cx="86" cy="39" r="2.4" fill="#2a1e18" />
          <path d="M86 55 L86 67 M92 55 L94 67" stroke="#e9a532" strokeWidth="3" strokeLinecap="round" />
          <path d="M30 62 C20 58 16 66 24 70" fill="#f3e6ce" stroke="#8c6b52" strokeWidth="2" />
        </svg>
      </div>
    );
  }
  if (type === 'flowers') {
    return (
      <div className="prop prop--flowers" aria-label="Ramo de flores">
        <svg viewBox="0 0 120 140" aria-hidden="true">
          <path d="M58 128 C60 92 48 70 36 52 M62 128 C66 92 78 74 88 58 M60 128 C58 96 60 72 60 48" fill="none" stroke="#487a4b" strokeWidth="4" strokeLinecap="round" />
          <path d="M52 92 C37 82 34 94 47 99 Z M70 86 C83 75 89 88 76 94 Z" fill="#5c9c5b" />
          <g>
            <circle cx="34" cy="44" r="12" fill="#e84662" />
            <circle cx="48" cy="30" r="11" fill="#ff7f93" />
            <circle cx="62" cy="48" r="13" fill="#d92b4e" />
            <circle cx="80" cy="36" r="10" fill="#ff9bae" />
            <circle cx="92" cy="54" r="9" fill="#e84662" />
            <circle cx="34" cy="44" r="4" fill="#ffd166" />
            <circle cx="62" cy="48" r="4" fill="#ffd166" />
            <circle cx="80" cy="36" r="3.5" fill="#ffd166" />
          </g>
          <path d="M38 92 L84 92 L76 122 L46 122 Z" fill="#d9b77c" stroke="#8e7141" strokeWidth="2" />
        </svg>
      </div>
    );
  }
  return null;
}

function DinosaurProp({ faded = false }) {
  return (
    <div className={`prop prop--dinosaur ${faded ? 'prop--faded' : ''}`} aria-label="Dinosaurio de cartón">
      <svg viewBox="0 0 280 220" aria-hidden="true">
        <path
          d="M32 206 L48 132 L44 72 L64 34 L92 26 L114 44 L108 76 L128 92 L164 88 L188 58 L218 66 L236 100 L226 132 L244 164 L232 190 L196 198 L168 182 L150 204 L112 208 L92 186 L68 206 Z"
          fill="#b98956"
          stroke="#5d3a25"
          strokeWidth="5"
        />
        <path d="M48 132 L92 150 L128 92" fill="none" stroke="rgba(90,56,35,.3)" strokeWidth="3" />
        <path d="M164 88 L150 204 M188 58 L196 198" fill="none" stroke="rgba(90,56,35,.25)" strokeWidth="3" />
        <circle cx="83" cy="62" r="7" fill="#2a1b18" />
        <path d="M70 82 Q86 92 100 82" fill="none" stroke="#3c261e" strokeWidth="4" strokeLinecap="round" />
        <path d="M58 102 L74 107 M56 115 L74 118" stroke="#3c261e" strokeWidth="4" strokeLinecap="round" />
        <path d="M124 176 L154 176 M136 164 L136 190" stroke="#d8c7a1" strokeWidth="9" opacity=".7" />
        <path d="M188 112 L212 90 M204 136 L232 126" stroke="#d8c7a1" strokeWidth="8" opacity=".65" />
        <text x="116" y="142" fill="#4e2f1c" fontSize="18" fontFamily="monospace" transform="rotate(-7 116 142)">CARTÓN</text>
      </svg>
    </div>
  );
}

function ReactionFx({ reaction, incident }) {
  if (!reaction) return null;
  const flowerRain = ['flowers', 'ovation'].includes(reaction.type);
  const tomato = reaction.type === 'tomatoes';
  return (
    <>
      {flowerRain ? (
        <div className="flower-rain" aria-hidden="true">
          {PETALS.map(([left, delay, duration], index) => (
            <span
              key={`petal-${index}`}
              className="petal"
              style={{
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${3.2 + duration}s`,
              }}
            >
              🌹
            </span>
          ))}
        </div>
      ) : null}
      {tomato ? (
        <div className="tomato-attack" aria-hidden="true">
          <span className="tomato tomato--one">🍅</span>
          <span className="tomato tomato--two">🍅</span>
          <span className="tomato-splat">✦</span>
        </div>
      ) : null}
      {incident?.id === 'explosion' ? (
        <div className="smoke-plume" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : null}
    </>
  );
}

export default function StageView({
  incident,
  incidentIndex,
  phase,
  genre,
  selections,
  result,
  audience,
  stats,
  actors,
  lastReaction,
  paused,
  timer,
  timerMax,
  crisis,
  lightMix = {},
  primaryLight = null,
}) {
  const lightColor = LIGHT_COLORS[primaryLight] || GENRE_LIGHT[genre] || GENRE_LIGHT.romance;
  const blackout = incident?.id === 'blackout' && phase === 'incident' && !primaryLight;
  const activeLights = Object.keys(LIGHT_COLORS)
    .filter((id) => (Number(lightMix?.[id]) || 0) > 0)
    .map((id) => ({ id, level: Math.max(0, Math.min(100, Number(lightMix[id]))) }));
  const lines =
    phase === 'resolution' || phase === 'crisis'
      ? result?.dialogue || incident?.openingLines || []
      : incident?.openingLines || [];
  const stageLines = lines.slice(-2);
  const activeSpeaker = stageLines[stageLines.length - 1]?.speaker;
  const actorMood =
    lastReaction?.tone === 'negative'
      ? 'shock'
      : actors.trust >= 68
        ? 'confident'
        : actors.trust >= 48
          ? 'nervous'
          : 'panic';

  const dinosaurVisible = incidentIndex >= 1;
  const selectedObject = selections?.object;
  const showCurtainsClosed = phase === 'briefing' || phase === 'crisis';
  const timerPercent = timerMax ? Math.max(0, Math.min(100, (timer / timerMax) * 100)) : 0;

  return (
    <section
      className={[
        'stage-shell',
        `stage-shell--${genre}`,
        `stage-shell--${phase}`,
        blackout ? 'is-blackout' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--stage-light': lightColor }}
      aria-label="Escenario del teatro"
    >
      <div className="stage-topline">
        <span className="stage-act">
          ACTO {incident.roman} <span>·</span> {incident.location}
        </span>
        <span className={`genre-badge genre-badge--${genre}`}>
          <span aria-hidden="true">{GENRES[genre].icon}</span> {GENRES[genre].upper}
        </span>
      </div>

      <div className="stage-scene">
        <SetPiece genre={genre} />

        {activeLights.length ? (
          activeLights.map(({ id, level }) => (
            <div
              key={id}
              className={`stage-light stage-light--${id} is-mixed`}
              style={{
                '--stage-light': LIGHT_COLORS[id],
                opacity: 0.15 + (level / 100) * 0.7,
              }}
              aria-hidden="true"
            >
              <span className="stage-light__beam stage-light__beam--one" />
              <span className="stage-light__beam stage-light__beam--two" />
              <span className="stage-light__beam stage-light__beam--three" />
            </div>
          ))
        ) : (
          <div
            className={`stage-light stage-light--${genre}`}
            style={{ '--stage-light': lightColor }}
            aria-hidden="true"
          >
            <span className="stage-light__beam stage-light__beam--one" />
            <span className="stage-light__beam stage-light__beam--two" />
            <span className="stage-light__beam stage-light__beam--three" />
          </div>
        )}

        <div className={`genre-decor genre-decor--${genre}`} aria-hidden="true">
          {genre === 'romance'
            ? ['♥', '♥', '♥', '♥'].map((symbol, index) => (
                <span key={index} style={{ '--i': index }}>{symbol}</span>
              ))
            : null}
          {genre === 'comedy'
            ? ['✶', '✦', '✶', '✦'].map((symbol, index) => (
                <span key={index} style={{ '--i': index }}>{symbol}</span>
              ))
            : null}
          {genre === 'scifi'
            ? ['◉', '◌', '◉', '✦'].map((symbol, index) => (
                <span key={index} style={{ '--i': index }}>{symbol}</span>
              ))
            : null}
        </div>

        <div className="curtain curtain--left" aria-hidden="true">
          <span className="curtain__fringe" />
        </div>
        <div className="curtain curtain--right" aria-hidden="true">
          <span className="curtain__fringe" />
        </div>
        <div className="valance" aria-hidden="true" />

        {dinosaurVisible ? <DinosaurProp faded={incidentIndex === 2} /> : null}
        {selectedObject ? <PropArt type={selectedObject} /> : null}

        <div className={`actors ${showCurtainsClosed ? 'actors--peek' : ''}`}>
          <ActorFigure who="lia" mood={actorMood} speaking={activeSpeaker === 'LÍA'} />
          <ActorFigure who="bruno" mood={actorMood} speaking={activeSpeaker === 'BRUNO'} />
        </div>

        <ReactionFx reaction={lastReaction} incident={incident} />

        {blackout ? (
          <div className="blackout-layer" aria-hidden="true">
            <span className="blackout-layer__line">SIN LUZ · EL PÚBLICO CONTIENE LA RESPIRACIÓN</span>
          </div>
        ) : null}

        {phase === 'incident' ? (
          <div className="incident-ribbon">
            <span className="incident-ribbon__eyebrow">INCIDENTE EN CURSO</span>
            <strong>{incident.incidentTitle}</strong>
            <span className="incident-ribbon__timer">
              {timer}s
              <i style={{ width: `${timerPercent}%` }} />
            </span>
          </div>
        ) : null}

        {phase === 'crisis' && crisis ? (
          <div className="stage-crisis-stamp">
            <span>CRISIS</span>
            <strong>{crisis.title}</strong>
          </div>
        ) : null}

        {stageLines.length ? (
          <div className="speech-layer" aria-live="polite">
            {stageLines.map((line, index) => {
              const speaker = line.speaker;
              const variant =
                speaker === 'LÍA' ? 'lia' : speaker === 'BRUNO' ? 'bruno' : 'narrator';
              return (
                <div
                  key={`${speaker}-${index}-${line.text.slice(0, 12)}`}
                  className={`speech-bubble speech-bubble--${variant}`}
                >
                  <span className="speech-bubble__speaker">{speaker}</span>
                  <p>{line.text}</p>
                </div>
              );
            })}
          </div>
        ) : null}

        {paused ? (
          <div className="stage-paused">
            <span>⏸</span> TIEMPO PAUSADO · MODO DEMO
          </div>
        ) : null}

        <div className="stage-lip" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <AudienceView
        audience={audience}
        stats={stats}
        reaction={lastReaction}
        phase={phase}
      />
    </section>
  );
}
