# E2E Tests – Position Screen (Playwright)

End-to-end tests that validate the position detail screen
(`/positions/:id`, component `PositionDetails.js`).

Test file: `tests/e2e/position.spec.ts` (two `test()` cases inside a `describe()`).

## Coverage

1. **Scenario 1 – Page load**: position title, process columns/stages and
   candidate cards placed in the column matching their current stage.
2. **Scenario 2 – Stage change (drag-and-drop)**: a card is dragged to another
   column (react-beautiful-dnd via keyboard) and both the UI and the intercepted
   backend request are validated: method `PUT`, URL `/candidates/:id` with the id
   of the moved candidate, body carrying the new stage (`currentInterviewStep`)
   and a 2xx response.

> The assignment cites the endpoint as `PUT /candidate/:id`; the actual
> implementation is `PUT /candidates/:id` (plural), which is what the tests
> validate against.

All texts (title, stages, candidates) are derived at runtime from the backend;
there are no hard-coded literals in the selectors.

## Prerequisites

The full app must be running (see the project root README):

```sh
# 1) PostgreSQL database (with seed data)
docker-compose up -d            # from the project root

# 2) Backend on http://localhost:3010
cd backend && npm install && npx prisma generate && npm run dev

# 3) Frontend on http://localhost:3000
cd frontend && npm install
NODE_OPTIONS=--openssl-legacy-provider BROWSER=none PORT=3000 npm start
```

Seed data used (position `1` = *Senior Full-Stack Engineer*):
stages `Initial Screening` / `Technical Interview` / `Manager Interview` and
candidates John Doe, Jane Smith and Carlos García.

## Installing Playwright (inside /frontend)

```sh
cd frontend
npm install -D @playwright/test
npx playwright install chromium
```

## Running

```sh
cd frontend
npx playwright test                                 # full suite (headless)
npx playwright test --ui                            # interactive mode
npx playwright test tests/e2e/position.spec.ts      # specific file
npx playwright test -g "Escenario 1"                # only page load (scenario 1)
npx playwright test -g "Escenario 2"                # only drag-and-drop (scenario 2)
npx playwright show-report                          # HTML report
```

> The `-g` filters use the literal test titles defined in `position.spec.ts`,
> which are kept in Spanish (allowed in code); the documentation itself is in English.

## Notes

- Selectors: `getByRole` / `getByText` and the stable react-beautiful-dnd anchors
  (`data-rbd-droppable-id`, `data-rbd-drag-handle-draggable-id`) are preferred.
  **No application code was modified.**
- The `beforeEach` retries the load because `PositionDetails.js` has a race
  condition between `fetchInterviewFlow()` and `fetchCandidates()` that
  occasionally leaves the board with no cards until a reload happens.
