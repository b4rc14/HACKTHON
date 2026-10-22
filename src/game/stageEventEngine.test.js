import { describe, expect, it } from 'vitest';
import { createInitialState } from './initialState.js';
import { startNextScene, startShow } from './gameEngine.js';
import { gameReducer } from './gameReducer.js';
import {
  closeStageEvent,
  collectStageTarget,
  getStageEventSummary,
  maybeStartStageEvent,
  startStageEvent,
  tickStageEvent,
} from './stageEventEngine.js';
import { getEventTargets } from './stageEvents.js';

const incidentState = (overrides = {}) => ({
  ...startShow(createInitialState()),
  ...overrides,
  phase: 'incident',
  timerRunning: true,
  incidentIndex: 1,
});

describe('eventos técnicos del escenario', () => {
  it('la segunda escena dispara el foco roto al encadenar la función', () => {
    let state = {
      ...startShow(createInitialState()),
      incidentIndex: 1,
      phase: 'incident',
      timer: 20,
      timerMax: 20,
    };
    state = maybeStartStageEvent(state);
    expect(state.phase).toBe('incident');
    expect(state.stage.activeEvent?.id).toBe('spotlight');
    expect(state.stage.activeEvent?.phase).toBe('active');
  });

  it('el temporizador de escena queda bloqueado mientras hay una avería', () => {
    const state = startStageEvent(incidentState(), 'spotlight');
    expect(state.stage.activeEvent).toBeTruthy();
    const ticked = gameReducer(state, { type: 'TICK' });
    expect(ticked.timer).toBe(state.timer);
  });

  it('recoger todos los cristales resuelve la avería con éxito', () => {
    let state = startStageEvent(incidentState(), 'spotlight');
    const targets = getEventTargets(state.stage.activeEvent);
    expect(targets).toHaveLength(6);
    targets.forEach((target) => {
      state = collectStageTarget(state, target.id);
    });
    expect(state.stage.activeEvent.phase).toBe('result');
    expect(state.stage.activeEvent.success).toBe(true);
    expect(state.stage.lastEventResult?.success).toBe(true);
    expect(state.stage.eventHistory[0]).toMatchObject({ id: 'spotlight', success: true });
    expect(state.actors.trust).toBeGreaterThan(80);
    expect(state.stage.persistentFx.brokenLight).toBe(false);
    expect(state.audience.lastReaction).toBeNull();
  });

  it('un tornillo resta tiempo y el timeout deja la luz rota', () => {
    let state = startStageEvent(incidentState(), 'spotlight');
    const initialTimer = state.stage.activeEvent.timer;
    state = collectStageTarget(state, 'screw-1');
    expect(state.stage.activeEvent.timer).toBe(initialTimer - 2);
    expect(state.stage.activeEvent.decoyHits).toBe(1);

    for (let index = 0; index < 10; index += 1) {
      state = tickStageEvent(state);
    }
    expect(state.stage.activeEvent.phase).toBe('result');
    expect(state.stage.activeEvent.success).toBe(false);
    expect(state.stage.persistentFx.brokenLight).toBe(true);
    expect(state.stage.lastEventResult?.success).toBe(false);
  });

  it('cerrar el resultado devuelve el control sin borrar la consecuencia visual', () => {
    let state = startStageEvent(incidentState(), 'spotlight');
    for (let index = 0; index < 10; index += 1) state = tickStageEvent(state);
    state = closeStageEvent(state);
    expect(state.stage.activeEvent).toBeNull();
    expect(state.stage.persistentFx.brokenLight).toBe(true);
    expect(state.stage.eventHistory).toHaveLength(1);
  });

  it('el resumen de avería expone estado y progreso para la cabina', () => {
    let state = startStageEvent(incidentState(), 'spotlight');
    const target = getEventTargets(state.stage.activeEvent)[0];
    state = collectStageTarget(state, target.id);
    const summary = getStageEventSummary(state);
    expect(summary.active).toBe(true);
    expect(summary.title).toBe('Foco roto');
    expect(summary.progress).toBeGreaterThan(0);
  });

  it('el acto III puede generar un segundo evento técnico', () => {
    const state = maybeStartStageEvent({
      ...incidentState(),
      incidentIndex: 2,
      stage: {
        ...incidentState().stage,
        eventHistory: [{ id: 'spotlight', success: true, act: 2 }],
      },
    });
    expect(['cable', 'chicken', null]).toContain(state.stage.activeEvent?.id || null);
  });
});
