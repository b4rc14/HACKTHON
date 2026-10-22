# TEAM GUIDE — THE SHOW MUST MUTATE

Guía para trabajar en paralelo después del MVP. La regla principal:

> **La lógica vive en `src/game/`. Los componentes solo pintan estado y emiten acciones.**
> Si dos módulos necesitan el mismo dato, debe estar en el estado global o en una función pura exportada.

---

## 1. Mapa de propiedad

| Área | Archivos | Responsable sugerido | Puede tocar sin miedo |
|---|---|---|---|
| Contenido narrativo | `src/game/storyData.js`, variantes de diálogo en `narrativeEngine.js` | Guion / narrativa | Añadir actos, objetos, frases, etiquetas |
| Motor narrativo | `src/game/narrativeEngine.js`, `initialState.js` | Diseño de mecánicas | Puntuación de género, coherencia, títulos |
| Público y crisis | `src/game/audienceEngine.js`, tests de motor | Sistemas / balance | Deltas, umbrales, reacciones, protocolos |
| Orquestación | `src/game/gameEngine.js`, `gameReducer.js` | Arquitectura / QA | Flujo de actos, finales, demo |
| Escenario y arte | `StageView.jsx`, `AudienceView.jsx`, `CabinMonitor.jsx`, `StageEventOverlay.jsx`, `stage.css`, `stage-events.css` | Arte / frontend | SVG, animaciones, eventos técnicos, público |
| Cabina y UI | `ControlPanel.jsx`, `StatusPanel.jsx`, `CrisisPanel.jsx`, `HistoryPanel.jsx`, `controls.css` | UI / frontend | Layout, monitores, estilos, accesibilidad |
| Pantallas | `TitleScreen.jsx`, `EndingScreen.jsx`, `global.css` | UI / presentación | Portada, cartel, export SVG |
| Demo/QA | `DemoPanel.jsx`, `scripts/simulate.mjs`, tests | QA | Herramientas de prueba |
| Documentación | `README.md`, `TEAM_GUIDE.md` | Cualquiera | Mantener contratos al día |

### Regla de oro para evitar conflictos

- **No cambies la forma del estado** sin actualizar `initialState.js`, los consumidores y este documento.
- **No metas lógica de puntuación en un componente React.**
- **No uses `Math.random()` en reducers** para que las pruebas y el replay sean deterministas. La aleatoriedad visual/audio sí es aceptable.
- Si añadís un campo, ponedle un valor inicial y comprobad que `JSON.stringify(state)` no falla.
- Si cambiáis un umbral de balance, actualizad también `scripts/simulate.mjs` y los tests si aplica.

---

## 2. Cómo ejecutar y verificar

```bash
npm install
npm run dev
npm test
npm run build
```

Antes de hacer merge:

1. `npm test` en verde.
2. `npm run build` sin errores.
3. Jugar una partida completa (o usar **DEMO → Saltar acto** tres veces).
4. Probar al menos una crisis y una reacción de cada tono.
5. Comprobar que el temporizador no bloquea y que **Reiniciar** funciona.

Para balance rápido:

```bash
node scripts/simulate.mjs
```

Imprime reacciones, coherencia y final para varias estrategias. Añadid vuestras propias estrategias en el objeto `runs`.

---

## 3. Contrato del estado

El estado inicial está en `src/game/initialState.js`. Campos que otros módulos pueden leer:

```js
{
  phase,                 // title | briefing | incident | resolution | crisis | ending
  incidentIndex,         // 0..2
  timer, timerMax, timerRunning, nextTimerBonus,
  selections: { lighting, sound, object },
  audience: {
    groups: {
      romantics: { count, satisfaction, boredom, patience, reactions, walkouts, ... },
      chaos: { ... },
      critics: { ... }
    },
    initialTotal, discontent,
    lastReaction, reactionHistory,
    ovation, bisRequested, walkouts
  },
  narrative: {
    genreScores: { romance, comedy, scifi },
    dominantGenre,
    coherence,
    history,               // decisiones con resultado
    establishedTags,       // memoria usada para callbacks/título
    sceneCount,
    title
  },
  actors: { trust, glitches, status, lastLine },
  stage: {
    activeEvent,            // null | { id, phase, timer, targets, collected, ... }
    eventHistory,           // eventos resueltos: id, act, success, ...
    lastEventResult,
    lastFeedback,
    persistentFx: { brokenLight, sparks, looseChicken }
  },
  chaos, improv,
  cooldowns: { dialogue, pacing, engage, curtain },
  result,                // evaluación del último acto
  pendingCrisis, crisis, crisisResolved, lastCrisisOutcome,
  demo: { open, paused, simCount, skipped },
  soundEnabled, soundCue, cueCounter, debugLog,
  ending, stats
}
```

### Acciones del reducer

Todas se lanzan con `dispatch({ type, ...payload })`:

| Acción | Payload | Efecto |
|---|---|---|
| `START_GAME` | — | Portada → briefing acto I |
| `BEGIN_INCIDENT` | — | Briefing → incidente, arranca timer |
| `SELECT_CONTROL` | `kind`, `id` | Marca/deselecciona un control |
| `CLEAR_SELECTION` | — | Vacía los tres controles |
| `EXECUTE_COMBO` | — | Resuelve la combinación (solo con 3/3) |
| `CONTINUE` | — | Resolución → crisis / siguiente acto / final |
| `TICK` | — | Baja timer; a 0 resuelve solo |
| `USE_ACTION` | `actionId` | Protocolo de crisis o acción preventiva |
| `STAGE_EVENT_TICK` | — | Baja el temporizador del minijuego; a 0 falla |
| `STAGE_EVENT_COLLECT` | `targetId` | Recoge un cristal/chispazo/gallina o falla un señuelo |
| `STAGE_EVENT_CLOSE` | — | Cierra el resultado y devuelve el control a la escena |
| `DEMO_STAGE_EVENT` | `eventId?` | Fuerza un evento técnico para la demo |
| `DEMO_TOGGLE_PANEL` | — | Abre/cierra demo; al cerrar reanuda |
| `DEMO_TOGGLE_PAUSE` | — | Pausa/reanuda timer en incidente/crisis |
| `DEMO_SKIP` | — | Salta de acto sin bloquear |
| `DEMO_SIMULATE` | `sentiment: 'positive'\|'negative'` | Simula reacción |
| `DEMO_RESTART` | — | Reinicia y entra directo al acto I |
| `RESTART` | — | Vuelve al cartel inicial |
| `TOGGLE_SOUND` / `SET_SOUND` | — / `enabled` | Sonido on/off |

---

## 4. Contratos de componentes

### `StageView`

```jsx
<StageView
  incident={incident}          // objeto de storyData
  incidentIndex={0}
  phase={state.phase}
  genre={state.narrative.dominantGenre}
  selections={state.selections}
  result={state.result}
  audience={state.audience}
  stats={stats}                // getAudienceStats(audience)
  actors={state.actors}
  lastReaction={state.audience.lastReaction}
  lastCrisisOutcome={state.lastCrisisOutcome}
  paused={state.demo.paused}
  timer={state.timer}
  timerMax={state.timerMax}
  crisis={state.crisis}
  stage={state.stage}
/>
```

No debe llamar a dispatch. Para añadir arte, usad `selections`, `incident.id`, `result.dominantGenre`, `lastReaction.type` y las clases de fase.

### `ControlPanel`

```jsx
<ControlPanel
  selections={...}
  onSelect={(kind, id) => ...}
  onPreview={(kind, control) => ...}
  onExecute={() => ...}
  onClear={() => ...}
  active={phase === 'incident' && !stage.activeEvent}
  phase={phase}
  fallbackGenre={dominantGenre}
  timer={timer}
  incident={incident}
  audience={audience}
  stats={stats}
  lastReaction={lastReaction}
  stage={stage}
/>
```

`CONTROLS` y `CONTROL_GROUPS` salen de `storyData.js`. Si añadís un control, añadid también su estilo de color y comprobad la inclinación.

### `CrisisPanel`

```jsx
<CrisisPanel
  state={state}
  mode="inline" | "modal"
  onAction={(actionId) => dispatch({ type: 'USE_ACTION', actionId })}
/>
```

`mode="inline"` se muestra en la cabina durante el acto. `mode="modal"` se monta cuando `state.phase === 'crisis'`.

### `IncidentOverlay`

```jsx
<IncidentOverlay
  state={state}
  incident={incident}
  onBegin={() => dispatch({ type: 'BEGIN_INCIDENT' })}
  onContinue={() => dispatch({ type: 'CONTINUE' })}
/>
```

Renderiza el briefing en `phase === 'briefing'` y el resultado en `phase === 'resolution'`.

---

## 5. Receta: añadir un incidente

1. Abre `src/game/storyData.js`.
2. Copia la estructura de un incidente de `INCIDENTS`. Campos obligatorios:

```js
{
  id: 'nuevo-incidente',           // único, usado en tags y escena
  act: 4,
  roman: 'IV',
  playTitle: '...',
  location: '...',
  timer: 20,
  memoryPrompt: '...',
  briefing: '...',
  openingLines: [{ speaker: 'LÍA', text: '...' }],
  incidentTitle: '...',
  incidentText: '...',
  baseTags: ['nuevo-tag'],
  affinity: { romance: 2, comedy: 3, scifi: 2 },
  bridges: {
    romance: ['warm', 'music', 'romantic-token'],
    comedy: ['absurd', 'animal', 'slapstick'],
    scifi: ['alien', 'space', 'tech', 'weird']
  },
  variants: {
    romance: { headline, summary, dialogue: [{ speaker, text }] },
    comedy: { ... },
    scifi: { ... }
  }
}
```

3. Añadido a `INCIDENTS` cambia automáticamente:
   - el progreso de actos del header,
   - el bucle de `gameEngine`,
   - el final y el resumen,
   - el test de partida completa (revisad si asumía 3 actos).
4. Añadid al menos una etiqueta nueva para que la memoria y el título final tengan material.
5. Probar con `node scripts/simulate.mjs` y una partida real.

> El texto puede contener cualquier redacción; el motor solo usa `headline`, `summary`, `dialogue`, `affinity`, `baseTags` y `bridges`. Los tokens `{object}`, `{light}`, `{sound}` existen en `evaluateNarrative`, pero los guiones actuales usan frases literales para control creativo.

### Añadir un control (luz/sonido/objeto)

En `CONTROLS`:

```js
{
  id: 'laser',
  label: 'Láser de feria',
  sublabel: 'Peligro recreativo',
  icon: '✷',
  genre: 'scifi',
  genres: { scifi: 4, comedy: 1 },
  tags: ['tech', 'weird', 'laser'],
  description: '...'
}
```

No hace falta tocar React: `ControlPanel` recorre los arrays. Revisad que los textos quepan en la tarjeta.

---

## 6. Receta: añadir un evento técnico o minijuego

Los eventos viven en `src/game/stageEvents.js` y su lógica pura en `stageEventEngine.js`.

1. Añade una entrada a `STAGE_EVENTS`:

```js
spotlight: {
  id: 'spotlight',
  title: '¡EL FOCO HA EXPLOTADO!',
  shortTitle: 'Foco roto',
  icon: '✦',
  subtitle: '...',
  objective: 'Recoge los 6 cristales...',
  targetLabel: 'Cristal',
  targetPlural: 'CRISTALES',
  targetIcon: '◆',
  timer: 10,
  tone: 'amber',
  successTitle: 'LUZ RESTAURADA',
  failTitle: 'ESCENARIO A OSCURAS',
  successText: '...',
  failText: '...',
  successEffects: { trust: 7, coherence: 2, chaos: -3, groups: { romantics: 2 } },
  failEffects: { trust: -6, coherence: -3, chaos: 6, groups: { romantics: -3 } },
  targets: [
    { id: 'shard-1', type: 'target', label: 'Cristal', icon: '◆', x: 16, y: 32, size: 'md' },
    { id: 'screw-1', type: 'decoy', label: 'Tornillo', icon: '⚙', x: 24, y: 78, size: 'sm' }
  ]
}
```

2. Añade el disparo en `maybeStartStageEvent` (`stageEventEngine.js`). Para garantizar una demo, usa un acto concreto; para aleatoriedad, usa `pseudoRandom(seed)` con datos del estado (caos, confianza, decisiones...). **No uses `Math.random()` en reducers.**
3. Los efectos se aplican en `finishStageEvent`. Si quieres una consecuencia visual persistente, añade una bandera a `persistentFx` y consúmela en `StageView`.
4. Añade el arte del objetivo y del evento en `StageEventOverlay.jsx` y `stage-events.css`.
5. Los tests de `stageEventEngine.test.js` deben cubrir: disparo, éxito, fallo por tiempo, señuelo y cierre.

### Ajustar el minijuego

- Duración: `timer` del evento.
- Dificultad: número de objetivos, señuelos y penalización de señuelo (`-2 s` en `collectStageTarget`).
- Recompensa/castigo: `successEffects` y `failEffects`.
- El reloj narrativo principal se pausa mientras `state.stage.activeEvent` exista. No lo reactives desde otro componente.

---

## 7. Receta: añadir una reacción del público

1. Añade la entrada en `REACTION_META` (`storyData.js`): `id`, `label`, `icon`, `tone`, `effect`.
2. Añade la causa y el umbral en `determineReaction` (`audienceEngine.js`).
3. Añade sus consecuencias en `applyReactionEffects` (satisfacción, trust, caos, timer, recursos, abandono...).
4. Añade el marcador visual en `AudienceView.jsx` (`seatMood` / `seatMark` / `REACTION_LINES`) y, si toca escenario, en `StageView.jsx` (`ReactionFx`).
5. Si la reacción debe activar crisis, añadid el tipo en `determineCrisis`.
6. Comprobad que `REACTION_META[type]` existe siempre antes de llamar a `applyReactionEffects`; si no, `reactionEntry` fallaría.

### Cambiar umbrales / dificultad

- Preferencias por grupo y deltas base: `calculateGroupDeltas`.
- Aburrimiento, paciencia y descontento: `applyNarrativeToAudience`.
- Qué reacción sale: `determineReaction`.
- Efectos de reacción: `applyReactionEffects`.
- Cuándo hay crisis: `determineCrisis`.
- Puntuación de género y coherencia: `evaluateNarrative`.
- Finales y puntuación total: `computeEnding` en `gameEngine.js`.

Después de cambiar cualquier umbral, ejecutad:

```bash
npm test
node scripts/simulate.mjs
```

Los tests comprueban que los cuatro finales siguen siendo alcanzables con estrategias distintas. Si cambiáis el balance y un final deja de existir, ajustad las estrategias de `scripts/simulate.mjs` y los tests **o** los umbrales.

---

## 8. Añadir animaciones sin romper la lógica

- Animad en CSS usando clases existentes (`phase`, `genre`, `is-selected`, `tone-*`, `is-speaking`, `lastReaction.type`).
- Para nuevas animaciones, añadid clases al markup y keyframes en `stage.css`; no cambiéis el estado.
- Evitad animar propiedades de layout que puedan tapar botones. Usad `transform` y `opacity`.
- Respetad `@media (prefers-reduced-motion: reduce)`.
- Si una animación necesita datos nuevos, añadidlos al estado y pasadlos por props; no uséis temporizadores locales que contradigan el timer global.
- Las animaciones de reacciones se reinician al cambiar `lastReaction.id`. No borréis ese id: es la clave de animación y de historial.

### Añadir un SVG o personaje

- Los actores están en `ActorFigure` dentro de `StageView.jsx`. Podéis añadir expresiones con clases (`actor--nervous`, etc.).
- Los props están en `PropArt`; el objeto seleccionado se resuelve por id.
- El dinosaurio y el gazebo son SVG inline para que el build no dependa de imágenes externas.
- Si añadís una imagen externa, **no la hagáis requisito** para que el juego funcione.

---

## 9. Flujo de trabajo en paralelo

Sugerencia para 5 personas:

1. **Narrativa** trabaja en `storyData.js` y textos de `narrativeEngine` (sin tocar el resto del motor).
2. **Balance** trabaja en `audienceEngine.js` + tests + `scripts/simulate.mjs`.
3. **Arte/escenario** trabaja en `StageView.jsx`, `AudienceView.jsx`, `CabinMonitor.jsx`, `StageEventOverlay.jsx`, `stage.css`, `stage-events.css`.
4. **UI/cabina** trabaja en `ControlPanel.jsx`, `StatusPanel.jsx`, `CrisisPanel.jsx`, `HistoryPanel.jsx`, `controls.css`.
5. **QA/orquestación** toca `gameEngine.js`, `gameReducer.js`, `stageEventEngine.js`, `stageEvents.js`, `DemoPanel.jsx`, `README`/`TEAM_GUIDE`.

Para evitar choques:

- Haced ramas o worktrees por área.
- Los cambios de contrato (props, acciones, campos de estado) se anuncian en el chat del equipo antes de mergear.
- No reformateéis archivos enteros que no os toquen.
- No cambiéis nombres de acciones existentes sin actualizar `gameReducer.js` y todos los dispatch.

### Ramas preparadas

Todas parten del mismo commit de `main`:

| Rama | Área | Archivos principales |
|---|---|---|
| `feature/narrativa-contenido` | Nuevos actos, objetos, diálogos, títulos y callbacks | `storyData.js`, textos de `narrativeEngine.js`, `IncidentOverlay.jsx`, `EndingScreen.jsx` |
| `feature/publico-balance` | Satisfacción, reacciones, crisis, dificultad y finales | `audienceEngine.js`, `gameEngine.js`, `scripts/simulate.mjs`, tests |
| `feature/escenario-animacion` | SVGs, personajes, props, luces, público, eventos técnicos y animaciones | `StageView.jsx`, `AudienceView.jsx`, `CabinMonitor.jsx`, `StageEventOverlay.jsx`, `stage.css`, `stage-events.css` |
| `feature/ui-cabina` | Cabina, paneles, historial, accesibilidad y estilos | `ControlPanel.jsx`, `CrisisPanel.jsx`, `StatusPanel.jsx`, `HistoryPanel.jsx`, `controls.css` |

Crear una rama nueva a partir de `main`:

```bash
git switch main
git pull
git switch -c feature/mi-mejora
```

Cambiar a una de las ramas preparadas:

```bash
git switch feature/narrativa-contenido
git switch feature/publico-balance
git switch feature/escenario-animacion
git switch feature/ui-cabina
```

Subir una rama por primera vez:

```bash
git push -u origin feature/narrativa-contenido
```

> Las ramas ya están publicadas en `origin`; `git push -u origin feature/...` sirve para sus primeras subidas y `git push` para las siguientes.


### Checklist de merge

- [ ] `npm run build` pasa.
- [ ] `npm test` pasa.
- [ ] Se puede jugar una partida completa sin pantallas muertas.
- [ ] El timer de 20 s resuelve solo al llegar a 0.
- [ ] El foco roto se puede reparar o dejar fallar, y el reloj vuelve correctamente.
- [ ] Una crisis se puede resolver o dejar pasar.
- [ ] El botón Reiniciar vuelve a un estado inicial limpio.
- [ ] No hay imágenes externas obligatorias.
- [ ] La nueva funcionalidad está documentada en README/TEAM_GUIDE.

---

## 10. Tests actuales

`src/game/gameEngine.test.js` cubre:

1. Arranque de partida sin timer activo.
2. Combinación sci-fi y actualización de memoria.
3. Timeout que resuelve y nunca bloquea.
4. Penalización y reacción negativa por repetición.
5. Apertura y resolución de crisis.
6. Partida completa con cartel.
7. Cuatro finales distintos alcanzables.
8. Simulación positiva/negativa de demo.
9. Salto de demo sin fases huérfanas.

`src/game/stageEventEngine.test.js` cubre:

1. Disparo garantizado del foco roto en el acto II.
2. Pausa del reloj narrativo durante la avería.
3. Éxito al recoger todos los cristales.
4. Penalización de señuelo y fallo por timeout.
5. Cierre del resultado y persistencia visual.
6. Resumen de avería para la cabina.
7. Posible segundo evento en el acto III.

Los tests son de motor puro (Node). Si añadís tests de componentes, usad `@testing-library/react` y jsdom, pero mantened el núcleo sin dependencias de React.

---

## 11. Deuda técnica priorizada (post-hackathon)

1. **Persistencia** de la última partida y de la mejor puntuación (`localStorage`).
2. **Más contenido**: 5–6 incidentes, más objetos (espada, tarta, foco roto, karaoke) y variantes por confianza.
3. **Editor de datos** validado con Zod o un pequeño script que compruebe:
   - ids únicos,
   - variant por género,
   - tags en `REACTION_META`,
   - todos los `bridges` presentes.
4. **Accesibilidad**: temporizador con `role="timer"`, anuncios de reacción con `aria-live`, atajos de teclado 1–9 y navegación de foco en modales.
5. **Audio adaptativo**: capas de música por género, no solo cues.
6. **Export PNG** del cartel con `canvas` o `html-to-image`.
7. **QA visual móvil** real y ajuste de tamaños táctiles.
8. **Tests de reducer** además de los de motor.

---

## 12. Convenciones rápidas

- Español para todo el texto de juego y documentación.
- Nombres de estado y funciones en inglés (consistente con el motor actual).
- Funciones puras en `game/*.js`; nada de `window` salvo `audio.js` y export opcional de cartel.
- Deltas de audiencia redondeados y acotados (`clamp`).
- Todo cambio de balance debe ser explicable en una frase: qué decisión premia y cuál castiga.
- Si algo amenaza con retrasar la entrega: haced la versión más pequeña que siga siendo real y documentadlo.

**La función no se cancela. Se muta.**
