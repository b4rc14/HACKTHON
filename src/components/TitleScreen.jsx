import React from 'react';
import { GENRES } from '../game/storyData.js';

export default function TitleScreen({
  plays = [],
  selectedPlayId,
  onSelectPlay,
  onStart,
  onToggleSound,
  soundEnabled,
}) {
  const selectedPlay = plays.find((play) => play.id === selectedPlayId) || plays[0];
  return (
    <main className="title-screen">
      <div className="title-curtain title-curtain--left" aria-hidden="true" />
      <div className="title-curtain title-curtain--right" aria-hidden="true" />
      <div className="title-spotlight" aria-hidden="true" />

      <header className="title-topbar">
        <span className="eyebrow">COMPAÑÍA DE LA VIGA CAÍDA · FUNCIÓN DE EMERGENCIA</span>
        <button
          type="button"
          className="icon-button"
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
          title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </header>

      <section className="title-poster" aria-labelledby="game-title">
        <p className="title-kicker">UNA FUNCIÓN CONTINUA · TRES MINUTOS · CERO ENSAYOS</p>
        <h1 id="game-title" className="title-logo">
          <span>THE SHOW</span>
          <span>MUST</span>
          <span className="title-logo--mutate">MUTATE</span>
        </h1>
        <p className="title-tagline">
          La obra empieza como un romance. El gazebo explota. Un dinosaurio de cartón cae del telar.
          Y el público sigue ahí. Elige qué desastre vas a dirigir esta noche.
        </p>

        <div className="title-role">
          <span className="title-role__mark">✂</span>
          <p>
            Eres el <strong>técnico y director de escena</strong>. No arregles los accidentes:
            conviértelos en la historia. La función tiene que terminar. De una forma u otra.
          </p>
        </div>

        <div className="title-plays" role="radiogroup" aria-label="Elige la obra">
          {plays.map((play) => {
            const genre = GENRES[play.genre] || GENRES.romance;
            const selected = play.id === selectedPlay?.id;
            return (
              <button
                key={play.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`title-play ${selected ? 'is-selected' : ''}`}
                style={{ '--tone': genre.color }}
                onClick={() => onSelectPlay?.(play.id)}
              >
                <span className="title-play__genre">{genre.icon} {genre.short}</span>
                <strong>{play.title}</strong>
                <small>{play.subtitle}</small>
              </button>
            );
          })}
        </div>

        {selectedPlay ? <p className="title-play__description">{selectedPlay.description}</p> : null}

        <button type="button" className="primary-button primary-button--huge" onClick={onStart}>
          <span className="primary-button__small">ABRIR EL TELÓN</span>
          <span className="primary-button__big">EMPEZAR LA FUNCIÓN</span>
        </button>
        <p className="title-note">Tres minutos · escenas encadenadas · el público puede vaciar la sala antes del final.</p>
      </section>

      <section className="title-rules" aria-label="Cómo se juega">
        <article>
          <span className="rule-number">01</span>
          <h2>Combina</h2>
          <p>Elige una luz, un sonido y un objeto. Cada pieza empuja la historia hacia un género.</p>
        </article>
        <article>
          <span className="rule-number">02</span>
          <h2>Improvisa</h2>
          <p>Convierte el accidente en una escena. La coherencia importa, pero repetirte no funciona.</p>
        </article>
        <article>
          <span className="rule-number">03</span>
          <h2>Sobrevive</h2>
          <p>Un público de personas distintas, cada una con su paciencia. Llega al final con sala y orgullo.</p>
        </article>
      </section>

      <footer className="title-footer">
        <span>MVP jugable · Hackathon 2026</span>
        <span>HEADPHONES RECOMENDADOS. PÚBLICO NO RECOMENDADO.</span>
      </footer>
    </main>
  );
}
