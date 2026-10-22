import React from 'react';
import { GENRES } from '../game/storyData.js';

export default function SceneInterlude({ incident, result, onSkip }) {
  if (!result) return null;
  const genre = GENRES[result.dominantGenre] || GENRES.romance;
  return (
    <aside
      className={`scene-interlude scene-interlude--${result.dominantGenre}`}
      style={{ '--genre-color': genre.color }}
      aria-live="polite"
    >
      <span className="scene-interlude__line" aria-hidden="true" />
      <div className="scene-interlude__tag">
        <span aria-hidden="true">{genre.icon}</span> EN ESCENA · ACTO {incident.roman}
      </div>
      <div className="scene-interlude__copy">
        <strong>{result.headline}</strong>
        <span>{result.timedOut ? 'Los actores improvisan contra el reloj.' : 'La historia se está escribiendo delante del público.'}</span>
      </div>
      <span className="scene-interlude__reaction">
        {result.reaction.icon} {result.reaction.label}
      </span>
      <button type="button" className="text-button text-button--light" onClick={onSkip}>
        ver resultado
      </button>
      <span className="scene-interlude__progress" aria-hidden="true"><i /></span>
    </aside>
  );
}
