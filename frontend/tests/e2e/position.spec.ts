import { test, expect, Page, Locator, APIRequestContext } from '@playwright/test';

/**
 * E2E – Pantalla "Position" (tablero kanban de fases de contratación).
 *
 * Pantalla:   /positions/:id   (App.js -> PositionDetails.js)
 * Backend:    GET  /positions/:id/interviewFlow  -> título + fases (interviewSteps)
 *             GET  /positions/:id/candidates      -> candidatos y su fase actual
 *             PUT  /candidates/:id                -> persiste el cambio de fase
 *
 * Nota sobre el endpoint: el enunciado lo cita como `PUT /candidate/:id`, pero la
 * implementación real es `PUT /candidates/:id` (plural). Se valida contra la real.
 *
 * Todos los textos (título, nombres de fases, candidatos) se derivan en runtime
 * del backend; no se inventan literales. El drag-and-drop usa react-beautiful-dnd
 * y se dispara con el teclado (accesible), sincronizando con el placeholder que
 * rbd monta/desmonta al levantar/soltar (sin esperas fijas).
 */

const BACKEND = 'http://localhost:3010';
const POSITION_ID = 1;

type Stage = { id: number; name: string };
type Candidate = { fullName: string; currentInterviewStep: string; candidateId: number };

// ---------- Helpers de datos (backend real) ----------

async function fetchStages(request: APIRequestContext): Promise<{ title: string; stages: Stage[] }> {
  const res = await request.get(`${BACKEND}/positions/${POSITION_ID}/interviewFlow`);
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  const steps = json.interviewFlow.interviewFlow.interviewSteps as Array<{ id: number; name: string }>;
  return {
    title: json.interviewFlow.positionName as string,
    stages: steps.map((s) => ({ id: s.id, name: s.name })),
  };
}

async function fetchCandidates(request: APIRequestContext): Promise<Candidate[]> {
  const res = await request.get(`${BACKEND}/positions/${POSITION_ID}/candidates`);
  expect(res.ok()).toBeTruthy();
  return res.json();
}

// ---------- Helpers de UI ----------

/** Columna (droppable) cuya cabecera muestra el nombre de la fase. */
function stageColumn(page: Page, stageName: string): Locator {
  return page.locator('[data-rbd-droppable-id]').filter({ hasText: stageName });
}

/** Tarjeta arrastrable (drag handle) de un candidato por su nombre. */
function candidateCard(page: Page, name: string): Locator {
  return page.locator('[data-rbd-drag-handle-draggable-id]').filter({ hasText: name });
}

/**
 * Carga el tablero esperando a que aparezcan tarjetas.
 * PositionDetails.js tiene una condición de carrera (fetchInterviewFlow vs
 * fetchCandidates) que ocasionalmente deja el tablero sin tarjetas hasta recargar;
 * reintentamos de forma determinista (sin timeouts fijos) para no ser flaky.
 */
async function loadBoard(page: Page, title: string): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.goto(`/positions/${POSITION_ID}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    try {
      await expect(page.locator('[data-rbd-drag-handle-draggable-id]').first())
        .toBeVisible({ timeout: 5_000 });
      return;
    } catch {
      /* la carrera de carga dejó el tablero vacío; reintentamos */
    }
  }
  throw new Error('El tablero de candidatos no cargó tras varios reintentos');
}

test.describe('Pantalla Position', () => {
  test('Escenario 1 – carga de la página de Position', async ({ page, request }) => {
    const { title, stages } = await fetchStages(request);
    const candidates = await fetchCandidates(request);

    await loadBoard(page, title);

    // 1. El título de la posición se muestra correctamente.
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    // 2. Se muestran las columnas de cada fase del proceso.
    for (const stage of stages) {
      await expect(stageColumn(page, stage.name)).toBeVisible();
    }

    // 3. Cada candidato aparece en la columna de su fase actual.
    for (const c of candidates) {
      await expect(stageColumn(page, c.currentInterviewStep)).toContainText(c.fullName);
    }
  });

  test('Escenario 2 – cambio de fase de un candidato (drag-and-drop)', async ({ page, request }) => {
    const { title, stages } = await fetchStages(request);
    const candidates = await fetchCandidates(request);

    await loadBoard(page, title);

    // Candidato a mover y fases origen/destino (derivadas del estado real).
    const candidate = candidates[0];
    const stageNames = stages.map((s) => s.name);
    const fromIndex = stageNames.indexOf(candidate.currentInterviewStep);
    expect(fromIndex, 'el candidato debe estar en una fase conocida').toBeGreaterThanOrEqual(0);
    const toIndex = fromIndex === stageNames.length - 1 ? fromIndex - 1 : fromIndex + 1;
    const fromStage = stages[fromIndex];
    const toStage = stages[toIndex];

    const card = candidateCard(page, candidate.fullName);
    await expect(card).toBeVisible();
    const draggableId = await card.getAttribute('data-rbd-drag-handle-draggable-id');
    expect(draggableId).toBe(String(candidate.candidateId));

    // Estado inicial: en la columna origen, no en la destino.
    await expect(stageColumn(page, fromStage.name)).toContainText(candidate.fullName);
    await expect(stageColumn(page, toStage.name)).not.toContainText(candidate.fullName);

    // Interceptamos la respuesta del PUT que persiste el cambio de fase.
    const putResponsePromise = page.waitForResponse(
      (r) => r.request().method() === 'PUT' && /\/candidates\/\d+$/.test(r.url())
    );

    // Drag-and-drop por teclado, sincronizado con el placeholder de rbd.
    const placeholder = page.locator('[data-rbd-placeholder-context-id]');
    await card.focus();
    await page.keyboard.press('Space');               // levantar
    await expect(placeholder.first()).toBeVisible();  // confirma el "lift" sin espera fija
    const arrow = toIndex > fromIndex ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.press(arrow);                 // mover a la columna adyacente
    await page.keyboard.press('Space');               // soltar
    await expect(placeholder).toHaveCount(0);         // confirma el "drop"

    // 1+2. La tarjeta aparece visualmente en la nueva columna y ya no en la origen.
    await expect(stageColumn(page, toStage.name)).toContainText(candidate.fullName);
    await expect(stageColumn(page, fromStage.name)).not.toContainText(candidate.fullName);

    // 3. Validación de la petición al backend.
    const response = await putResponsePromise;
    const request_ = response.request();

    //   - método PUT y :id == candidato movido
    expect(request_.method()).toBe('PUT');
    const urlId = request_.url().match(/\/candidates\/(\d+)$/)?.[1];
    expect(urlId).toBe(String(candidate.candidateId));

    //   - el body contiene la nueva fase (currentInterviewStep == id de la fase destino)
    const body = JSON.parse(request_.postData() ?? '{}');
    expect(body.currentInterviewStep).toBe(toStage.id);

    //   - respuesta exitosa (2xx)
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);
  });
});
