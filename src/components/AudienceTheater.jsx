import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { satisfactionColor } from '../game/audienceModel.js';

const ROW_Y = [84, 126, 172, 222, 276, 334];
const ROW_SCALE = [0.78, 0.84, 0.9, 0.96, 1.02, 1.08];
const WIDTH = 1920;
const HEIGHT = 388;
const SEAT_X = (col) => 960 + (col - 4.5) * 92;

const buildPath = (person) => {
  const x = SEAT_X(person.col);
  const y = ROW_Y[person.row];
  const aisleX = x < 960 ? 499 : 1434;
  const startY = y - 8;
  const gapY = person.row === 0 ? Math.max(28, y - 44) : (y + ROW_Y[person.row - 1]) / 2;
  const turn = 26;
  const approachX = aisleX + (x > aisleX ? turn : -turn);
  const turnEndY = gapY + turn;
  const landingY = 342;
  const exitTurnY = 356;
  const exitCenterX = x < 960 ? 387 : 1533;
  const exitY = 378;
  const path = [
    `M ${x} ${startY}`,
    `L ${x} ${gapY}`,
    `L ${approachX} ${gapY}`,
    `Q ${aisleX} ${gapY} ${aisleX} ${turnEndY}`,
    `L ${aisleX} ${landingY}`,
    `Q ${aisleX} ${exitTurnY} ${exitCenterX} ${exitTurnY}`,
    `L ${exitCenterX} ${exitY}`,
  ].join(' ');

  const riseLen = Math.abs(startY - gapY);
  const sideLen = Math.abs(x - approachX);
  const turnLen = turn * 1.57;
  const downAisleLen = Math.abs(landingY - turnEndY);
  const lateralLen = Math.abs(aisleX - exitCenterX);
  const finalDownLen = Math.abs(exitY - exitTurnY);
  const totalLen = Math.max(
    1,
    riseLen + sideLen + turnLen + downAisleLen + lateralLen + finalDownLen,
  );
  const holdStand = 0.35;
  const holdTurn = 0.15;
  const rawDuration = totalLen / 100 + holdStand + holdTurn;
  const duration = Math.max(4.5, Math.min(7.5, rawDuration));
  const walkTime = duration - holdStand - holdTurn;
  const segmentTime = (length) => (length / totalLen) * walkTime;
  const riseTime = segmentTime(riseLen);
  const sideTime = segmentTime(sideLen);
  const turnTime = segmentTime(turnLen);
  const downTime = segmentTime(downAisleLen);
  const lateralTime = segmentTime(lateralLen);

  const pRise = (riseLen / totalLen) * 100;
  const pSide = ((riseLen + sideLen) / totalLen) * 100;
  const pTurn = ((riseLen + sideLen + turnLen) / totalLen) * 100;
  const pLanding = ((riseLen + sideLen + turnLen + downAisleLen) / totalLen) * 100;
  const pLateral =
    ((riseLen + sideLen + turnLen + downAisleLen + lateralLen) / totalLen) * 100;

  const tRise = riseTime / duration;
  const tStand = (riseTime + holdStand) / duration;
  const tSide = (riseTime + holdStand + sideTime) / duration;
  const tTurn = (riseTime + holdStand + sideTime + turnTime) / duration;
  const tTurnHold = (riseTime + holdStand + sideTime + turnTime + holdTurn) / duration;
  const tLanding =
    (riseTime + holdStand + sideTime + turnTime + holdTurn + downTime) / duration;
  const tLateral =
    (riseTime + holdStand + sideTime + turnTime + holdTurn + downTime + lateralTime) /
    duration;

  return {
    path,
    duration,
    frames: [
      { offsetDistance: '0%', opacity: 0, scale: '.82', offset: 0 },
      { offsetDistance: `${pRise}%`, opacity: 1, scale: '1.03', offset: tRise, easing: 'ease-out' },
      { offsetDistance: `${pRise}%`, opacity: 1, scale: '1.03', offset: tStand },
      { offsetDistance: `${pSide}%`, opacity: 1, scale: '1.04', offset: tSide, easing: 'linear' },
      { offsetDistance: `${pTurn}%`, opacity: 1, scale: '1.04', offset: tTurn, easing: 'ease-in-out' },
      { offsetDistance: `${pTurn}%`, opacity: 1, scale: '1.04', offset: tTurnHold },
      { offsetDistance: `${pLanding}%`, opacity: 1, scale: '1.02', offset: tLanding, easing: 'linear' },
      { offsetDistance: `${pLateral}%`, opacity: 1, scale: '1', offset: tLateral, easing: 'linear' },
      { offsetDistance: '100%', opacity: 0, scale: '.88', offset: 1, easing: 'linear' },
    ],
  };
};

function LeavingPerson({ person, onGone }) {
  const ref = useRef(null);
  const doneRef = useRef(false);
  const [timeline] = useState(() => buildPath(person));

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    let cancelled = false;
    node.style.offsetPath = `path("${timeline.path}")`;
    const animation = node.animate(timeline.frames, {
      duration: timeline.duration * 1000,
      easing: 'linear',
      fill: 'forwards',
    });
    animation.onfinish = () => {
      if (cancelled || doneRef.current) return;
      doneRef.current = true;
      onGone(person.id);
    };
    return () => {
      cancelled = true;
      animation.cancel();
    };
  }, [onGone, person.id, timeline]);

  return (
    <div
      ref={ref}
      className="leaver"
      style={{ '--color': '#e35d5d' }}
    >
      <div className="ghost">
        <div className="ghost-head" />
        <div className="ghost-body" />
      </div>
    </div>
  );
}

function Seat({ person, onGone }) {
  const color = satisfactionColor(person.satisfaction);
  const isGone = person.state === 'gone';
  const isLeaving = person.state === 'leaving';
  const angry = !isGone && !isLeaving && person.satisfaction < 32;

  return (
    <div
      className={[
        'seat',
        isGone ? 'empty' : '',
        isLeaving ? 'leaving' : '',
        angry ? 'angry' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={`Espectador ${person.id} · Criticidad ${Math.round(
        person.criticality * 100,
      )}% · Satisfacción ${Math.round(person.satisfaction)}%`}
      style={{
        left: `${SEAT_X(person.col)}px`,
        top: `${ROW_Y[person.row]}px`,
        transform: `scale(${ROW_SCALE[person.row]})`,
        zIndex: 10 + person.row,
      }}
    >
      <div className="seat-back" />
      <div className="seat-cushion" />
      {!isGone && !isLeaving ? (
        <div className="person" style={{ '--color': color }}>
          <div className="head" />
          <div className="shoulders" />
        </div>
      ) : null}
      <div className="seat-front" />
      <div className="arm left" />
      <div className="arm right" />
    </div>
  );
}

export default function AudienceTheater({
  people,
  stats,
  onGone,
  phase,
  coherence = 0,
  lastReaction = null,
}) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return undefined;
    const measure = () => setScale(node.clientWidth / WIDTH);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const leaving = people.filter((person) => person.state === 'leaving');
  const present = stats.total;
  const walkouts = Math.max(0, stats.initialTotal - present);
  const quality = Math.round(stats.averageSatisfaction * 0.65 + coherence * 0.35);
  const totalForBars = Math.max(1, present);

  return (
    <section
      ref={wrapRef}
      className={`audience-theater audience-theater--${phase || 'idle'}`}
      style={{ height: `${HEIGHT * scale}px` }}
      aria-label="Platea"
    >
      <aside className="audience-stat audience-stat--left" aria-label="Calidad de la función">
        <span className="audience-stat__kicker">FUNCIÓN</span>
        <div className="audience-stat__metric">
          <span>CALIDAD</span>
          <b>{quality}</b>
          <i><em style={{ width: `${quality}%` }} /></i>
        </div>
        <div className="audience-stat__metric">
          <span>COHERENCIA</span>
          <b>{Math.round(coherence)}</b>
          <i><em style={{ width: `${coherence}%` }} /></i>
        </div>
      </aside>

      <aside className="audience-stat audience-stat--right" aria-label="Estado del público">
        <span className="audience-stat__kicker">PLATEA</span>
        <div className="audience-stat__public">
          <span>EN SALA</span>
          <b>{present}<small>/{stats.initialTotal}</small></b>
        </div>
        <div className="audience-stat__mood" aria-hidden="true">
          <i style={{ width: `${(stats.contentCount / totalForBars) * 100}%`, background: '#7bd6a0' }} />
          <i style={{ width: `${(stats.seriousCount / totalForBars) * 100}%`, background: '#e8bf5a' }} />
          <i style={{ width: `${(stats.criticalCount / totalForBars) * 100}%`, background: '#e35d5d' }} />
        </div>
        <div className="audience-stat__counts">
          <span>VERDE <b>{stats.contentCount}</b></span>
          <span>ÁMBAR <b>{stats.seriousCount}</b></span>
          <span>ROJO <b>{stats.criticalCount}</b></span>
        </div>
        <div className="audience-stat__reaction">
          <span aria-hidden="true">{lastReaction?.icon || '👁'}</span>
          <div>
            <b>{lastReaction?.label || 'La platea observa'}</b>
            <small>{stats.walkouts} abandonos</small>
          </div>
        </div>
      </aside>

      <div
        className="audience-canvas"
        style={{ transform: `scale(${scale})` }}
      >
        <div className="side-wall left" />
        <div className="side-wall right" />

        <div className="corner-exit left">
          <div className="exit-glow" />
          <div className="exit-sign">SALIDA</div>
          <div className="exit-frame" />
          <div className="exit-steps" />
        </div>
        <div className="corner-exit right">
          <div className="exit-glow" />
          <div className="exit-sign">SALIDA</div>
          <div className="exit-frame" />
          <div className="exit-steps" />
        </div>
        <div className="sconce left" />
        <div className="sconce right" />

        <div className="aisle left" />
        <div className="aisle right" />

        <div className="aud-header">
          <div>
            <span className="platea-kicker">PLATEA</span>
            <span className="platea-count">
              {present} <small>/ {stats.initialTotal} ESPECTADORES</small>
            </span>
          </div>
          <div className="legend">
            <span className="legend-item">
              <i className="legend-dot" style={{ background: '#7bd6a0', color: '#7bd6a0' }} />
              CONTENTO
            </span>
            <span className="legend-item">
              <i className="legend-dot" style={{ background: '#e8bf5a', color: '#e8bf5a' }} />
              SERIO
            </span>
            <span className="legend-item">
              <i className="legend-dot" style={{ background: '#e35d5d', color: '#e35d5d' }} />
              CRÍTICO
            </span>
            <span className="legend-note">EL ROJO AVISA; DESPUÉS SE MARCHAN</span>
          </div>
          <div className="abandon">
            <span>{walkouts} HAN ABANDONADO</span>
            <small>LOS MÁS CRÍTICOS, PRIMERO</small>
          </div>
        </div>

        <div className="rows">
          {people.map((person) => (
            <Seat key={person.id} person={person} onGone={onGone} />
          ))}
        </div>

        <div className="leavers">
          {leaving.map((person) => (
            <LeavingPerson key={person.id} person={person} onGone={onGone} />
          ))}
        </div>
      </div>
    </section>
  );
}
