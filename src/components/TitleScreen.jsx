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
        <span className="eyebrow">LA VIGA CAÍDA</span>
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
        <h1 id="game-title" className="title-logo">
          <span>THE SHOW</span>
          <span>MUST</span>
          <span className="title-logo--mutate">MUTATE</span>
        </h1>
        <p className="title-tagline">Tres minutos. Un escenario roto. Sesenta jueces.</p>

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
              </button>
            );
          })}
        </div>

        <button type="button" className="primary-button primary-button--huge" onClick={onStart}>
          <span className="primary-button__big">EMPEZAR LA FUNCIÓN</span>
        </button>
      </section>
    </main>
  );
}
