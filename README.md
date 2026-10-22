# THE SHOW MUST MUTATE

> Una obra de teatro empieza como un romance. El gazebo explota, cae un dinosaurio de cartón y se va la luz.
> Tú eres el técnico. No arregles el desastre: **conviértelo en la historia**.

MVP jugable de principio a fin para hackathon. React + Vite + JavaScript + CSS + SVG + Web Audio API. Sin backend, sin APIs externas y sin imágenes externas.

---

## 1. Estado actual

El juego **se puede jugar completo**:

- Portada y arranque de partida.
- Tres actos con incidente, introducción, temporizador de 20 s y resolución.
- Cabina con 3 luces, 3 sonidos y 3 objetos.
- Combinaciones con puntuación por género, memoria narrativa y penalización por repetición.
- Tres grupos de público con satisfacción, aburrimiento, paciencia y reacciones propias.
- Aplausos, carcajadas, flores, ovación, murmullos, bostezos, abucheos, tomatazos, abandono y protesta.
- Crisis con cuatro protocolos, costes, cooldowns y resolución automática por tiempo.
- Confianza de actores, recursos de improvisación y nivel de caos.
- Cuatro tipos de final y cartel personalizado descargable en SVG.
- Modo demo para hackathon con reinicio, salto de acto, pausa, simulación de reacciones y snapshot JSON.
- 9 pruebas automatizadas del motor.

### Comprobaciones ejecutadas

```bash
npm install
npm test       # 9 tests pasan
npm run build  # build de producción correcto
```

---

## 2. Ejecutar el proyecto

Requisitos: Node.js 18+ y npm.

```bash
cd HACKTHON
npm install
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://127.0.0.1:5173`).

Otros comandos:

```bash
npm test       # pruebas puras del motor
npm run build  # compila a dist/
npm run preview
node scripts/simulate.mjs   # simulador de balance de varias estrategias
```

No hace falta configurar variables de entorno.

---

## 3. Cómo jugar

1. Pulsa **EMPEZAR LA FUNCIÓN**.
2. Lee el briefing del acto y pulsa **SUBIR EL TELÓN**. Ahí empiezan los 20 segundos.
3. Elige **una luz**, **un sonido** y **un objeto** en la cabina técnica.
4. Pulsa **¡IMPROVISAR!**. La combinación se evalúa y produce una escena, una reacción del público y consecuencias persistentes.
5. Si aparece una crisis, elige uno de los cuatro protocolos antes de que se agote el tiempo (o deja pasar la crisis).
6. Continúa al siguiente acto. La obra recuerda género, etiquetas, combinaciones y reacciones.
7. Tras el acto III, llega el cartel final. Puedes descargarlo en SVG y volver a empezar.

### Reglas que importan

- **No hay una combinación única correcta.** Cada control aporta puntos a uno o dos géneros.
- La primera escena establece el tono. En las siguientes, cambiar de género sin un puente narrativo penaliza la coherencia.
- Reutilizar una etiqueta ya establecida (por ejemplo, `alien`, `music`, `absurd`) da bonus de continuidad.
- **Repetir exactamente la misma combinación** aplica una penalización fuerte y provoca una reacción negativa.
- El tiempo agotado no bloquea: los actores improvisan con el repertorio de emergencia y el juego sigue.
- Las barras no son el objetivo. Hay finales buenos, raros, caóticos y desastrosos.

### Atajos y modo demo

Atajos de cabina: `1–3` iluminación, `4–6` sonido, `7–9` objeto y `Enter` para improvisar. En el briefing, `Enter` sube el telón.

El botón **DEMO** de la cabecera abre un panel claramente identificado con:

- Pausar/reanudar el temporizador (también durante una crisis).
- Saltar al siguiente acto.
- Simular una reacción positiva o negativa.
- Reiniciar la partida.
- Activar/desactivar sonido.
- Copiar un snapshot JSON del estado.

Cerrar el panel mientras está pausado **reanuda el tiempo** para evitar bloqueos accidentales.

---

## 4. Sistemas principales

### 4.1 Motor narrativo

`src/game/narrativeEngine.js` es una capa pura, sin React.

- Cada control declara `genres` (puntos) y `tags` (etiquetas narrativas).
- Cada incidente declara una `affinity` de género y unos `bridges` para justificar giros.
- La puntuación de género se atenúa un 62 % y se suma la nueva combinación. El género dominante resultante define el tono de la escena.
- La coherencia sube al mantener género y reutilizar elementos, y baja al cambiar de género sin puente, repetir combinación o agotar el tiempo.
- El historial guarda acto, combinación, género, etiquetas, reacción, deltas y coherencia.
- Los tags establecidos se acumulan y alimentan:
  - el título del cartel final,
  - los callbacks de diálogo,
  - la justificación de giros posteriores,
  - la memoria visible en el cuaderno de dirección.

La escena final se elige por género dominante e incidente. Los guiones base están en `storyData.js`; el motor añade líneas dinámicas según objeto, memoria, repetición, tiempo agotado y confianza.

### 4.2 Público

Tres grupos, con reparto y preferencias distintas:

| Grupo | Inicial | Le gusta | Le molesta |
|---|---:|---|---|
| Románticos | 24 (40 %) | emoción, sinceridad, coherencia romántica | giros gratuitos, caos sinsentido |
| Amantes del caos | 21 (35 %) | absurdo, humor, sorpresas | repetición, solemnidad excesiva |
| Críticos | 15 (25 %) | originalidad, estructura, callbacks | incoherencia, oportunismo vacío |

Cada grupo tiene `count`, `satisfaction`, `boredom`, `patience`, `reactions` y `walkouts`.

Se aplican:

- deltas distintos por género y coherencia,
- bonificación por reutilizar etiquetas,
- penalización por combinación repetida,
- penalización por objeto repetido,
- subida de aburrimiento cada acto,
- pérdida de paciencia con malas decisiones,
- descontento acumulado,
- abandono efectivo de butacas (los contadores bajan).

### 4.3 Reacciones

`src/game/audienceEngine.js` decide la reacción a partir de satisfacción media, coherencia, descontento, aburrimiento, paciencia y repetición.

| Reacción | Consecuencia jugable |
|---|---|
| Aplausos | +1 satisfacción, +2 s en la próxima escena |
| Carcajadas | baja aburrimiento, sube satisfacción del público del caos |
| Flores | +1 improvisación, flores visibles en escena |
| Ovación | +3 satisfacción, +1 improvisación, +3 s, petición de bis |
| Murmullos | baja paciencia |
| Bostezos | sube aburrimiento y baja paciencia |
| Abucheos | baja confianza de actores y sube descontento |
| Tomatazos | tomate visible, sube caos, baja confianza |
| Abandono | espectadores concretos se van de la sala |
| Protesta | activa una crisis |

Cada reacción visible muestra icono, etiqueta, causa numérica y efecto. El histórico se conserva en `audience.reactionHistory`.

### 4.4 Crisis

Se activan por descontento, protesta, tomatazos, abandono, confianza baja, coherencia baja o caos alto. Hay cinco tipos: protesta, pánico en el camerino, trama desintegrada, caos escénico y espectador del fondo.

Cuatro protocolos:

1. **Improvisar diálogo** — cuesta 1 recurso de improvisación y 1 uso por escena; sube confianza, coherencia y satisfacción de románticos/críticos.
2. **Cambiar el ritmo** — 1 uso por escena; baja aburrimiento y sube caos.
3. **Interactuar con el público** — 1 uso por escena; ayuda al grupo más insatisfecho.
4. **Bajar el telón** — 1 uso por escena; resuelve la crisis pero enfría la sala y rompe coherencia.

Además, **Dejar pasar la crisis** siempre está disponible para evitar cualquier bloqueo. Si el temporizador de crisis llega a 0, se aplica una penalización automática y se continúa.

### 4.5 Actores

- Confianza inicial: 80.
- Sube con buenas decisiones, callbacks y diálogos de crisis.
- Baja con incoherencia, repetición, timeouts y reacciones negativas.
- Por debajo de 35 aparecen fallos de guion y puede dispararse una crisis de pánico.
- El estado (`firmes`, `tensos`, `nerviosos`, `bloqueados`) se muestra en el panel.

### 4.6 Recursos, caos y final

- Recursos de improvisación iniciales: 3 (máximo 5).
- Caos sube con comedia, ciencia ficción, cambios de género, combos heterogéneos, objetos absurdos y accidentes.
- La puntuación final combina asistencia, satisfacción, coherencia, confianza y creatividad.
- Finales:
  - **ÉXITO COMERCIAL**: sala llena, satisfacción y coherencia altas.
  - **OBRA DE CULTO**: público dividido, alta creatividad y una historia que se sostiene.
  - **CAOS MEMORABLE**: comedia/absurdo con caos alto y público todavía dentro.
  - **FRACASO**: la historia o la sala se rompen.

---

## 5. Estructura

```text
src/
  App.jsx                     Orquestación + timer + efectos de audio
  main.jsx
  components/
    TitleScreen.jsx           Portada
    StageView.jsx             Escenario SVG, actores, atrezo, incidentes
    AudienceView.jsx          Platea, reacciones y causa visible
    ControlPanel.jsx          Luces / sonido / objetos + ejecutar
    CrisisPanel.jsx           Protocolos inline y modal de crisis
    StatusPanel.jsx           Estado completo de la función
    HistoryPanel.jsx          Cuaderno de dirección / memoria
    IncidentOverlay.jsx       Briefing y resolución narrativa
    EndingScreen.jsx          Cartel final + export SVG
    DemoPanel.jsx             Herramientas de hackathon
  game/
    initialState.js           Estado inicial y constantes de partida
    storyData.js              Contenido: controles, actos, reacciones, crisis
    narrativeEngine.js        Puntuación de género, coherencia, diálogo, títulos
    audienceEngine.js         Grupos, reacciones, crisis, protocolos
    gameEngine.js             Resolución de actos, crisis, finales, demo
    gameReducer.js            Acciones y transiciones
    audio.js                  Web Audio API, sin assets externos
    utils.js                  Helpers puros
    gameEngine.test.js        Tests del motor
  styles/
    global.css                Layout, portada, modales, estado, final
    stage.css                 Escenario, actores, SVG, platea, animaciones
    controls.css              Cabina, botones, crisis, historial
scripts/
  simulate.mjs                Simulador de balance
```

### Flujo de estados

```text
title
  └─ START_GAME → briefing
        └─ BEGIN_INCIDENT → incident ── TICK 0 ──┐
              └─ EXECUTE_COMBO → resolution ←────┘
                    └─ CONTINUE
                          ├─ crisis pendiente → crisis → USE_ACTION → resolution
                          ├─ quedan actos → briefing
                          └─ acto III → ending
```

Todo el estado vive en `App.jsx` con `useReducer`. No hay estados duplicados en componentes.

---

## 6. Limitaciones conocidas / siguientes pasos

El MVP prioriza que la partida sea completa. Quedan mejoras naturales:

- **Animación de personajes**: SVG y CSS básicos; se pueden añadir más expresiones, lip-sync y transiciones.
- **Audio**: sintetizadores de Web Audio, sin mezcla ni música continua. Es opcional y tolera navegadores sin soporte.
- **Persistencia**: no hay `localStorage` ni ranking; reiniciar recarga una partida limpia.
- **Accesibilidad**: hay foco visible, `aria-pressed` y textos, pero puede mejorarse el anuncio del temporizador y la navegación por teclado de la cabina.
- **Contenido**: tres incidentes y nueve controles. El sistema está preparado para más.
- **Balance**: validado con tests y `scripts/simulate.mjs`, pero conviene ajustar tras playtesting real.
- **Cartel**: exporta SVG (no PNG); es suficiente para imprimir o presentar.
- **Móvil**: layout responsive implementado, pendiente de QA en dispositivos físicos.

Consultá `TEAM_GUIDE.md` para el reparto de módulos y recetas de ampliación.

---

## 7. Créditos

Proyecto original para hackathon. Contenido, código y estética creados para este MVP.

**Compañía de la Viga Caída** · The Show Must Mutate · v0.1
