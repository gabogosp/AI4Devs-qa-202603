# Pruebas E2E – Pantalla de Posiciones (Playwright)

Pruebas End-to-End que validan la pantalla de detalle de una posición
(`/positions/:id`, componente `PositionDetails.js`).

Archivo de pruebas: `tests/e2e/position.spec.ts` (dos `test()` dentro de un `describe()`).

## Cobertura

1. **Escenario 1 – Carga de la página**: título de la posición, columnas/fases
   del proceso y tarjetas de candidatos ubicadas en la columna de su fase actual.
2. **Escenario 2 – Cambio de fase (drag-and-drop)**: se arrastra una tarjeta a
   otra columna (react-beautiful-dnd vía teclado) y se valida tanto la UI como la
   petición al backend interceptada: método `PUT`, URL `/candidates/:id` con el
   id del candidato movido, body con la nueva fase (`currentInterviewStep`) y
   respuesta 2xx.

> El enunciado cita el endpoint como `PUT /candidate/:id`; la implementación real
> es `PUT /candidates/:id` (plural) y es contra la que se valida.

Todos los textos (título, fases, candidatos) se derivan en runtime del backend;
no hay literales inventados en los selectores.

## Requisitos previos

La app completa debe estar levantada (ver README raíz del proyecto):

```sh
# 1) Base de datos PostgreSQL (con datos de seed)
docker-compose up -d            # desde la raíz del proyecto

# 2) Backend en http://localhost:3010
cd backend && npm install && npx prisma generate && npm run dev

# 3) Frontend en http://localhost:3000
cd frontend && npm install
NODE_OPTIONS=--openssl-legacy-provider BROWSER=none PORT=3000 npm start
```

Datos de seed usados (posición `1` = *Senior Full-Stack Engineer*):
fases `Initial Screening` / `Technical Interview` / `Manager Interview` y
candidatos John Doe, Jane Smith y Carlos García.

## Instalación de Playwright (dentro de /frontend)

```sh
cd frontend
npm install -D @playwright/test
npx playwright install chromium
```

## Ejecución

```sh
cd frontend
npx playwright test                                 # toda la suite (headless)
npx playwright test --ui                            # modo interactivo
npx playwright test tests/e2e/position.spec.ts      # archivo específico
npx playwright test -g "Escenario 1"                # solo carga de la página
npx playwright test -g "Escenario 2"                # solo drag-and-drop
npx playwright show-report                          # reporte HTML
```

## Notas

- Selectores: se priorizan `getByRole` / `getByText` y los anclajes estables
  de react-beautiful-dnd (`data-rbd-droppable-id`, `data-rbd-drag-handle-draggable-id`).
  **No se modificó el código de la aplicación.**
- El `beforeEach` reintenta la carga porque `PositionDetails.js` tiene una
  condición de carrera entre `fetchInterviewFlow()` y `fetchCandidates()` que
  ocasionalmente deja el tablero sin tarjetas hasta recargar.
