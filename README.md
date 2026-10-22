# THE SHOW MUST MUTATE

> Una obra de teatro empieza como un romance. El gazebo explota, cae un dinosaurio de cartón y se va la luz.
> Tú eres el técnico. No arregles el desastre: **conviértelo en la historia**.

MVP jugable de principio a fin para hackathon. React + Vite + JavaScript + CSS + SVG + Web Audio API. Sin backend, sin APIs externas y sin imágenes externas.

---

## 1. Estado actual

El juego **se puede jugar completo**:

- Portada con selección de obra y arranque de partida.
- Función continua de 3 minutos: escenas encadenadas, sin briefing entre actos.
- Mazo de escenas barajado por partida y varias obras con repertorios distintos.
- Cabina con 3 luces mezclables, 3 sonidos y 3 objetos.
- Combinaciones con puntuación por género, memoria narrativa y penalización por repetición.
- Platea de 60 personas individuales con criticidad, satisfacción, paciencia y abandono animado.
- Aplausos, carcajadas, flores, ovación, murmullos, bostezos, abucheos, tomatazos, abandono y protesta.
- Crisis con cuatro protocolos, costes, cooldowns y resolución automática por tiempo.
- Confianza de actores, recursos de improvisación y nivel de caos.
- Cuatro tipos de final y cartel personalizado descargable en SVG.
- Modo demo para hackathon con reinicio, salto de escena, pausa, simulación de reacciones y snapshot JSON.
- 21 pruebas automatizadas del motor, el público y los eventos técnicos.

### Comprobaciones ejecutadas

```bash
npm install
npm test       # 21 tests pasan
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

1. Elige una de las obras y pulsa **EMPEZAR LA FUNCIÓN**. La función arranca directamente.
2. Tienes **3 minutos** de reloj global. Si la sala se vacía antes, la función termina.
3. Elige **una luz**, **un sonido** y **un objeto** en la consola inferior.
4. Al completar la combinación, se ejecuta automáticamente tras **2 segundos**. Cambiar una pieza reinicia la cuenta.
5. La escena se resuelve con un interludio breve y la siguiente empieza sola.
6. Si aparece una crisis, elige uno de los cuatro protocolos antes de que se agote el tiempo.
7. Al llegar a 0:00 o quedarte sin público, aparece el cartel final. Puedes descargarlo en SVG y volver a empezar.

### Reglas que importan

- **No hay una combinación única correcta.** Cada control aporta puntos a uno o dos géneros.
- La primera escena establece el tono. En las siguientes, cambiar de género sin un puente narrativo penaliza la coherencia.
- Reutilizar una etiqueta ya establecida (por ejemplo, `alien`, `music`, `absurd`) da bonus de continuidad.
- **Repetir exactamente la misma combinación** aplica una penalización fuerte y provoca una reacción negativa.
- El tiempo agotado no bloquea: los actores improvisan con el repertorio de emergencia y el juego sigue.
- Las barras no son el objetivo. Hay finales buenos, raros, caóticos y desastrosos.

### Atajos y modo demo

Atajos de cabina: `1–3` iluminación, `4–6` sonido y `7–9` objeto. La combinación se ejecuta sola a los 2 segundos.

El botón **DEMO** abre un panel claramente identificado con:

- Pausar/reanudar el temporizador (también durante una crisis).
- Saltar a la siguiente escena.
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
- El historial guarda escena, combinación, género, etiquetas, reacción, deltas y coherencia.
- Los tags establecidos se acumulan y alimentan:
  - el título del cartel final,
  - los callbacks de diálogo,
  - la justificación de giros posteriores,
  - la memoria visible en el cuaderno de dirección.

La escena final se elige por género dominante e incidente. Los guiones base están en `storyData.js`; el motor añade líneas dinámicas según objeto, memoria, repetición, tiempo agotado y confianza.

### 4.2 Público

La platea son **60 personas individuales**, no grupos. Cada butaca tiene su propia
`criticality` (0–1), satisfacción, paciencia, aburrimiento y estado
(`seated`, `leaving`, `gone`). La lógica vive en `src/game/audienceModel.js`.

- La **criticidad** decide el umbral: una persona muy crítica necesita una obra
  mejor para mantenerse en verde y pasa a rojo antes.
- La **calidad global** de cada escena se calcula con coherencia, novedad,
  repetición y tiempo agotado.
- La satisfacción se actualiza con `(calidad - umbral) * sensibilidad + bias`.
- El color es el estado visible: verde (contento), ámbar (serio) y rojo (crítico).
- Un espectador rojo empieza a perder paciencia; si no mejora, pasa a `leaving` y
  abandona la sala. La animación lo levanta, lo lleva al hueco de delante, lo baja
  por el pasillo y lo saca por una salida inferior.
- El descontento y los abandonos son agregados de las personas; no hay contadores
  de grupo.

### 4.3 Reacciones

`src/game/audienceEngine.js` decide la reacción a partir de satisfacción media, coherencia, descontento, aburrimiento, paciencia y repetición.

| Reacción | Consecuencia jugable |
|---|---|
| Aplausos | +1 satisfacción, +2 s en la próxima escena |
| Carcajadas | baja aburrimiento y sube la satisfacción del público más tolerante |
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

1. **Improvisar diálogo** — cuesta 1 recurso de improvisación y 1 uso por escena; sube confianza, coherencia y satisfacción, sobre todo en las personas más críticas.
2. **Cambiar el ritmo** — 1 uso por escena; baja aburrimiento y sube caos.
3. **Interactuar con el público** — 1 uso por escena; ayuda a la persona más insatisfecha.
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

### 4.7 Eventos técnicos

- La segunda escena siempre puede disparar el minijuego del **foco roto**; las
  escenas siguientes pueden añadir **cable pelado** o **gallina fugitiva**.
- Mientras hay una avería, el reloj de escena se pausa y la mesa queda bloqueada.
- Hay que recoger los objetivos y evitar los señuelos; cada fallo resta tiempo.
- El resultado mueve confianza, coherencia, caos y la satisfacción de las bandas
  de criticidad del público.

### 4.8 Consola inferior

- Tres faders de iluminación mezclables; la luz principal es la que puntúa.
- Teclas de sonido y objeto; volumen master y volumen de efectos.
- Al completar luz + sonido + objeto, el combo se ejecuta automáticamente tras
  **2 segundos**. Cambiar una elección durante ese margen reinicia la cuenta.
- La consola incluye el acceso a los protocolos de crisis. La calidad, la
  coherencia y el estado del público se muestran a los lados de la platea.

---

## 5. Estructura

```text
src/
  App.jsx                     Orquestación + timer + efectos de audio
  main.jsx
  components/
    TitleScreen.jsx           Portada
    StageView.jsx             Escenario 2.5D, actores, atrezo y eventos técnicos
    AudienceTheater.jsx       Platea de 60 personas, colores, datos laterales y salida animada
    ControlPanel.jsx          Consola inferior: mezcla de luces, sonido y objetos
    CrisisPanel.jsx           Protocolos inline y modal de crisis
    StageEventOverlay.jsx     Minijuegos técnicos (foco, cable, gallina)
    SceneInterlude.jsx        Transición breve entre escena y resultado
    EndingScreen.jsx          Cartel final + export SVG
    DemoPanel.jsx             Herramientas de hackathon
  game/
    initialState.js           Estado inicial y constantes de partida
    storyData.js              Contenido: controles, obras, escenas, reacciones, crisis
    narrativeEngine.js        Puntuación de género, coherencia, diálogo, títulos
    audienceModel.js          Personas, criticidad, satisfacción y abandonos
    audienceEngine.js         Reacciones, crisis y protocolos sobre personas
    stageEvents.js            Definición de averías técnicas y sus efectos
    stageEventEngine.js       Estado, temporizador y resolución de averías
    stageChoreography.js      Coreografía visual del escenario
    gameEngine.js             Función continua, escenas, crisis, finales, demo
    gameReducer.js            Acciones y transiciones
    audio.js                  Web Audio API, sin assets externos
    utils.js                  Helpers puros
    gameEngine.test.js        Tests del motor
    audienceModel.test.js     Tests del público por personas
    stageEventEngine.test.js  Tests de los minijuegos técnicos
  styles/
    global.css                Layout, portada, modales, estado, final
    stage.css                 Escenario 2.5D, actores, SVG, animaciones
    stage-events.css          Overlays y minijuegos de averías
    audience.css              Platea, butacas, salidas y animación de abandono
    controls.css              Consola inferior de cabina
    integration.css           Consola en flujo inferior y ajustes de integración
    layout.css                Composición vertical escenario / platea / mesa
scripts/
  simulate.mjs                Simulador de balance
```

### Flujo de estados

```text
title
  └─ START_GAME → incident (reloj 3:00)
        ├─ EXECUTE_COMBO / timeout → resolution (interludio ~2,8 s)
        │     └─ NEXT_SCENE
        │           ├─ crisis pendiente → crisis → USE_ACTION → resolution
        │           ├─ reloj > 0 y público > 0 → siguiente escena
        │           └─ reloj 0 o público 0 → ending
        └─ TICK → 0:00 → ending
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
