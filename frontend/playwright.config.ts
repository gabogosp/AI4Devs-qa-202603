import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para las pruebas E2E de la pantalla de posiciones.
 *
 * Requisitos previos (ver README de las pruebas):
 *  - Base de datos PostgreSQL levantada (docker-compose up -d) y con datos de seed.
 *  - Backend Express corriendo en http://localhost:3010.
 *  - Frontend (CRA) corriendo en http://localhost:3000.
 *
 * El bloque `webServer` reutiliza el frontend si ya está levantado; si no, lo arranca.
 * El backend y la base de datos deben estar disponibles de forma independiente.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'NODE_OPTIONS=--openssl-legacy-provider BROWSER=none PORT=3000 npm start',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
