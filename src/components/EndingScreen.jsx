import React from 'react';
import { GENRES } from '../game/storyData.js';

const SEGMENT_TONE = {
  low: '#7bd6a0',
  mid: '#e8bf5a',
  high: '#e35d5d',
};

const SEGMENT_LABEL = {
  low: 'Tolerantes',
  mid: 'Exigentes',
  high: 'Muy críticos',
};

const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const wrapTitle = (title, maxChars = 18) => {
  const words = title.split(' ');
  const lines = [];
  let current = '';
  words.forEach((word) => {
    if ((current + ' ' + word).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });
  if (current) lines.push(current.trim());
  return lines;
};

const buildPosterSvg = (ending) => {
  const titleLines = wrapTitle(ending.title);
  const titleStart = 335 - (titleLines.length - 1) * 34;
  const titleSvg = titleLines
    .map(
      (line, index) =>
        `<text x="420" y="${titleStart + index * 68}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="58" font-weight="700" fill="#f7e6c4" letter-spacing="2">${escapeXml(line)}</text>`,
    )
    .join('');

  const groupLines = ending.audienceSegments
    .map(
      (group, index) =>
        `<text x="94" y="${786 + index * 30}" font-family="Arial, sans-serif" font-size="17" fill="#d7c3a7">${escapeXml(group.name)}</text>
         <text x="398" y="${786 + index * 30}" text-anchor="end" font-family="Arial, sans-serif" font-size="17" fill="#f4e6ce">${group.count} · ${group.satisfaction}%</text>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="1180" viewBox="0 0 840 1180">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a0d17"/>
      <stop offset="55%" stop-color="#170a10"/>
      <stop offset="100%" stop-color="#0d0709"/>
    </linearGradient>
    <linearGradient id="curtain" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8d1631"/>
      <stop offset="100%" stop-color="#3d0715"/>
    </linearGradient>
    <pattern id="grain" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.7" fill="#ffffff" opacity="0.05"/>
    </pattern>
  </defs>
  <rect width="840" height="1180" fill="url(#bg)"/>
  <rect width="840" height="1180" fill="url(#grain)"/>
  <path d="M0 0 L170 0 C120 140 100 380 128 620 C140 820 112 1040 70 1180 L0 1180 Z" fill="url(#curtain)"/>
  <path d="M840 0 L670 0 C720 140 740 380 712 620 C700 820 728 1040 770 1180 L840 1180 Z" fill="url(#curtain)"/>
  <path d="M0 0 L840 0 L840 66 C620 104 220 104 0 66 Z" fill="#5a0d1f"/>
  <path d="M0 66 C220 104 620 104 840 66" fill="none" stroke="#c99d57" stroke-width="4"/>
  <circle cx="420" cy="132" r="34" fill="none" stroke="#c99d57" stroke-width="2"/>
  <text x="420" y="141" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#e7c78e">✶</text>
  <text x="420" y="196" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" letter-spacing="5" fill="#c99d57">COMPAÑÍA DE LA VIGA CAÍDA</text>
  <text x="420" y="224" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" letter-spacing="3" fill="#9d7c58">FUNCIÓN ÚNICA · CARTEL DE EMERGENCIA</text>
  ${titleSvg}
  <line x1="238" y1="${titleStart + titleLines.length * 68 + 6}" x2="602" y2="${titleStart + titleLines.length * 68 + 6}" stroke="#c99d57" stroke-width="1.5"/>
  <text x="420" y="${titleStart + titleLines.length * 68 + 42}" text-anchor="middle" font-family="Georgia, serif" font-size="19" font-style="italic" fill="#d7c3a7">${escapeXml(ending.subtitle)}</text>
  <text x="420" y="${titleStart + titleLines.length * 68 + 78}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" letter-spacing="3" fill="${ending.meta.color}">${escapeXml(ending.genre.toUpperCase())} · ${escapeXml(ending.meta.label)}</text>

  <rect x="80" y="680" width="680" height="1.5" fill="#c99d57" opacity="0.5"/>
  <text x="94" y="728" font-family="Arial, sans-serif" font-size="12" letter-spacing="4" fill="#c99d57">EL VEREDICTO</text>
  <text x="94" y="758" font-family="Georgia, serif" font-size="26" fill="#f4e6ce">${escapeXml(ending.meta.tagline)}</text>
  <text x="746" y="728" text-anchor="end" font-family="Arial, sans-serif" font-size="12" letter-spacing="4" fill="#c99d57">PUNTUACIÓN</text>
  <text x="746" y="758" text-anchor="end" font-family="Georgia, serif" font-size="32" fill="#f4e6ce">${ending.score}/100</text>
  ${groupLines}

  <rect x="80" y="884" width="680" height="1.5" fill="#c99d57" opacity="0.5"/>
  <text x="94" y="928" font-family="Arial, sans-serif" font-size="12" letter-spacing="4" fill="#c99d57">RESUMEN DE LA FUNCIÓN</text>
  ${ending.summary
    .map(
      (entry, index) =>
        `<text x="94" y="${960 + index * 32}" font-family="Arial, sans-serif" font-size="16" fill="#d7c3a7">ACTO ${entry.act} · ${escapeXml(entry.headline)}</text>`,
    )
    .join('')}
  <text x="94" y="1084" font-family="Arial, sans-serif" font-size="12" letter-spacing="3" fill="#c99d57">REACCIÓN FINAL</text>
  <text x="94" y="1110" font-family="Georgia, serif" font-size="19" font-style="italic" fill="#f4e6ce">${escapeXml(ending.finalReaction.label)}</text>
  <text x="746" y="1110" text-anchor="end" font-family="Arial, sans-serif" font-size="13" fill="#9d7c58">${escapeXml(ending.signOff)}</text>
  <path d="M0 1158 C240 1138 600 1138 840 1158 L840 1180 L0 1180 Z" fill="#5a0d1f"/>
</svg>`;
};

export default function EndingScreen({ ending, onRestart, onTitle }) {
  const downloadPoster = () => {
    try {
      const svg = buildPosterSvg(ending);
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `cartel-${ending.meta.id}-${ending.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/(^-|-$)/g, '')}.svg`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // La exportación es opcional; nunca debe romper el final.
    }
  };

  const genre = GENRES[ending.genre] || GENRES.romance;

  return (
    <main
      className={`ending-screen ending-screen--${ending.meta.id}`}
      style={{ '--ending-color': ending.meta.color, '--genre-color': genre.color }}
    >
      <div className="ending-confetti" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} style={{ '--i': index }}>{index % 3 === 0 ? '✦' : index % 3 === 1 ? '●' : '✶'}</span>
        ))}
      </div>

      <header className="ending-topbar">
        <span className="eyebrow">THE SHOW MUST MUTATE · TELÓN FINAL</span>
        <div className="ending-topbar__actions">
          <button type="button" className="text-button text-button--light" onClick={downloadPoster}>
            ⬇ Descargar cartel SVG
          </button>
          <button type="button" className="text-button text-button--light" onClick={onTitle}>
            Volver al inicio
          </button>
        </div>
      </header>

      <section className="ending-hero">
        <div className="ending-poster" aria-label="Cartel de la obra">
          <div className="ending-poster__arch" aria-hidden="true">✶</div>
          <span className="ending-poster__company">COMPAÑÍA DE LA VIGA CAÍDA</span>
          <span className="ending-poster__kicker">FUNCIÓN ÚNICA · CARTEL DE EMERGENCIA</span>
          <h1>{ending.title}</h1>
          <p className="ending-poster__subtitle">{ending.subtitle}</p>
          <div className="ending-poster__meta">
            <span>{genre.upper}</span>
            <b>{ending.meta.label}</b>
            <span>FUNCIÓN CONTINUA · 3 MINUTOS</span>
          </div>
          <div className="ending-poster__score">
            <span>VALORACIÓN DEL PÚBLICO</span>
            <strong>{ending.score}<small>/100</small></strong>
          </div>
          <div className="ending-poster__stars" aria-hidden="true">✦ ✦ ✦</div>
          <span className="ending-poster__sign">{ending.signOff}</span>
        </div>

        <div className="ending-verdict">
          <span className="ending-verdict__eyebrow">VEREDICTO</span>
          <div className="ending-type" style={{ color: ending.meta.color }}>
            <span aria-hidden="true">{ending.meta.icon}</span>
            <h2>{ending.meta.label}</h2>
          </div>
          <p className="ending-verdict__tagline">{ending.meta.tagline}</p>
          <p className="ending-verdict__description">{ending.meta.description}</p>

          <div className="ending-reaction">
            <span aria-hidden="true">{ending.finalReaction.icon}</span>
            <div>
              <strong>{ending.finalReaction.label}</strong>
              <p>{ending.finalReaction.text}</p>
            </div>
          </div>

          <div className="ending-actors">
            <span className="panel-kicker">ESTADO DE LOS ACTORES</span>
            <p>{ending.actorFinalLine}</p>
            <small>Confianza final {ending.metrics.trust}/100 · {ending.stats.timeouts} improvisación(es) forzada(s)</small>
          </div>

          <button type="button" className="primary-button primary-button--huge" onClick={onRestart}>
            <span className="primary-button__small">OTRA FUNCIÓN, OTRO DESASTRE</span>
            <span className="primary-button__big">VOLVER A EMPEZAR</span>
          </button>
        </div>
      </section>

      <section className="ending-stats" aria-label="Métricas finales">
        <article>
          <span>ESPECTADORES</span>
          <b>{ending.metrics.remaining}<small>/{ending.metrics.initial}</small></b>
          <i><em style={{ width: `${(ending.metrics.remaining / ending.metrics.initial) * 100}%` }} /></i>
        </article>
        <article>
          <span>SATISFACCIÓN MEDIA</span>
          <b>{ending.metrics.avgSatisfaction}%</b>
          <i><em style={{ width: `${ending.metrics.avgSatisfaction}%` }} /></i>
        </article>
        <article>
          <span>COHERENCIA</span>
          <b>{ending.metrics.coherence}</b>
          <i><em style={{ width: `${ending.metrics.coherence}%` }} /></i>
        </article>
        <article>
          <span>CAOS</span>
          <b>{ending.metrics.chaos}</b>
          <i><em style={{ width: `${ending.metrics.chaos}%` }} /></i>
        </article>
        <article>
          <span>CREATIVIDAD</span>
          <b>{ending.metrics.creativity}</b>
          <i><em style={{ width: `${ending.metrics.creativity}%` }} /></i>
        </article>
        <article>
          <span>ABANDONOS</span>
          <b>{ending.metrics.walkouts}</b>
          <i><em style={{ width: `${Math.min(100, ending.metrics.walkouts * 10)}%` }} /></i>
        </article>
      </section>

      <section className="ending-detail-grid">
        <div className="ending-card">
          <span className="panel-kicker">EL PÚBLICO QUE SE QUEDÓ</span>
          <div className="ending-groups">
            {ending.audienceSegments.map((group) => (
              <div key={group.id} className="ending-group" style={{ '--tone': SEGMENT_TONE[group.id] }}>
                <div className="ending-group__head">
                  <span>{SEGMENT_LABEL[group.id]}</span>
                  <b>{group.count} · {group.satisfaction}%</b>
                </div>
                <div className="ending-group__bar"><i style={{ width: `${group.satisfaction}%` }} /></div>
                <small>{group.criticalCount} en rojo · Paciencia {group.patience}</small>
              </div>
            ))}
          </div>
          <p className="ending-audience-line">{ending.audienceLine}</p>
        </div>

        <div className="ending-card">
          <span className="panel-kicker">LO QUE OCURRIÓ EN ESCENA</span>
          <ol className="ending-timeline">
            {ending.summary.map((entry) => (
              <li key={`${entry.sceneNumber || entry.act}-${entry.headline}`} className={entry.skipped ? 'is-skipped' : ''}>
                <span className="ending-timeline__act">ESCENA {entry.sceneNumber || entry.act}</span>
                <div>
                  <strong>{entry.headline}</strong>
                  <small>
                    {GENRES[entry.genre]?.label || entry.genre} · Reacción: {entry.reaction}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="ending-card">
          <span className="panel-kicker">PUNTUACIÓN DESGLOSADA</span>
          <div className="ending-breakdown">
            {Object.entries({
              Asistencia: ending.scoreBreakdown.attendance,
              Satisfacción: ending.scoreBreakdown.satisfaction,
              Coherencia: ending.scoreBreakdown.coherence,
              Actores: ending.scoreBreakdown.trust,
              Creatividad: ending.scoreBreakdown.creativity,
            }).map(([label, value], index) => (
              <div key={label}>
                <span>{label}</span>
                <div><i style={{ width: `${(value / [25, 30, 20, 10, 15][index]) * 100}%` }} /></div>
                <b>{value}</b>
              </div>
            ))}
          </div>
          <div className="ending-badges">
            {ending.badges.map((badge) => <span key={badge}>{badge}</span>)}
          </div>
          <p className="ending-creator-note">
            “{ending.title}” nació de una explosión, un dinosaurio de cartón y {ending.metrics.decisions} decisiones.
            No hubo ensayo general.
          </p>
        </div>
      </section>

      <footer className="ending-footer">
        <span>THE SHOW MUST MUTATE · MVP JUGABLE</span>
        <span>GRACIAS POR NO APAGAR EL TELÓN ANTES DE TIEMPO</span>
      </footer>
    </main>
  );
}
