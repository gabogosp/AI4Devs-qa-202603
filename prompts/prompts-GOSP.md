<!--
This document captures the iterative refinement of the prompt used to generate
the E2E tests for the "Position" screen. Both versions are kept on purpose as a
historical record:
  - Version 1 (below): initial prompt.
  - Version 2 (after the `///` separator): final, more detailed prompt used to
    generate the definitive tests.
-->

# [Version 1 — initial prompt] Role
Act as a QA Automation Engineer specialized in End-to-End testing of web
interfaces with Playwright.

# Goal
Create and run E2E tests with Playwright that validate, from the user's
perspective, that the positions screen ("position") works correctly: both its
visual rendering and the interaction of moving candidates between stages of the
hiring process.

# Context
- The "position" interface was already created previously in this project.
- Before writing the tests, locate in the code the positions screen (component,
  route and endpoints it consumes) to derive the real selectors and data from it;
  do not assume a structure that does not exist.

# Validation scope (do not add or remove)
1. **Visual load of the positions page**: the screen renders its key elements
   (position title, process columns/stages and the corresponding candidate cards).
2. **Interaction of moving candidates between stages**: a candidate can be moved
   from one stage to another (drag-and-drop or whatever mechanism the UI
   implements) and the change is reflected in the interface.

# Constraints
- Use Playwright exclusively as the E2E testing framework.
- Prefer accessible selectors (getByRole / getByText / data-testid) over fragile
  selectors (CSS classes, positional XPath).
- Do not introduce changes to the application code except adding minimal
  `data-testid` attributes if they are strictly required to select elements; if
  you do, declare it explicitly.
- Do not expand the scope to other screens or to unit/integration tests: only
  E2E of the positions screen.
- If information needed to run is missing (base URL, how to start the app, test
  data/seed, credentials), stop and ask before inventing anything.

# Output format
1. Location and name of the created test files (e.g. `e2e/position.spec.ts`) and
   of the Playwright config if applicable.
2. The test code, organized into two cases:
   - "visual load of the positions screen"
   - "move a candidate between stages"
3. Exact commands to install dependencies and run the tests.
4. Execution result (passed/failed) with the real Playwright output; if something
   fails, report it as-is, without sugar-coating it.
///////////////////////////////////
# [Version 2 — final prompt] Role
Act as a QA automation engineer expert in Playwright + TypeScript, writing
maintainable and deterministic end-to-end (E2E) tests.

# Goal
Create E2E tests with Playwright that validate TWO scenarios of the "Position"
screen (a kanban-style board of hiring stages): the page load and the change of a
candidate's stage via drag-and-drop, verifying both the UI and the backend call.

# Context
- The "Position" screen shows columns, one per stage of the hiring process, and
  candidate cards placed in the column of their current stage.
- EXAMPLE stages (do NOT assume them as exact): Applied, Interview, Technical
  Test, Offer, Hired, Rejected.
- The stage change is persisted with: PUT /candidate/:id
  > Note: the real backend implementation uses the plural endpoint
  > `PUT /candidates/:id`. The tests validate against the real form.

# Task

## Scenario 1 — Position page load
The test must verify:
1. The position title is displayed correctly.
2. The columns corresponding to each stage of the process are shown.
3. The candidate cards appear in the correct column according to their current stage.

## Scenario 2 — Candidate stage change (drag-and-drop)
The test must:
1. Drag a candidate card from one column to another.
2. Verify that the card appears visually in the new column.
3. Intercept and validate the request to the backend when the card is dropped:
   - A PUT request is fired to /candidate/:id.
   - The :id in the URL corresponds to the moved candidate.
   - The request body contains the new stage.
   - The backend response is successful (2xx status).

# Constraints (guardrails)
- The stages, the title and the texts used in the selectors must MATCH what is
  actually implemented in the interface; do NOT invent stage names or texts.
  If an exact value is unknown, mark it as a TODO instead of guessing it.
- Prefer stable selectors (ARIA roles, getByRole/getByText, data-testid) over
  fragile selectors (CSS classes, positional XPath).
- Intercept the network with page.route / waitForRequest / waitForResponse to
  assert method, URL (:id), body and status — do not infer the result from the UI
  alone.
- Deterministic tests: no fixed waits (avoid waitForTimeout); use auto-waiting /
  expect with web-first assertions.
- Do not add scenarios beyond the two requested.

# Output format
- A test file at: tests/e2e/position.spec.ts
- Playwright Test + TypeScript, with two test() cases (one per scenario) grouped
  in a describe(). Include the minimum necessary comments.
- If configuration is needed (baseURL, fixtures, test data), indicate it
  separately and briefly.
- Return only the test code (and the minimal config if applicable), without long
  explanations.
