import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas extremo a extremo (BF-20) contra la app compilada (con su CSP de producción).
 * La API se simula en cada prueba con page.route; contra el ambiente de pruebas real se correrán
 * cuando exista (P-04).
 * PLAYWRIGHT_CHROMIUM_EXECUTABLE permite usar un Chromium ya instalado en lugar del de Playwright.
 */
const ejecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const lanzamiento = ejecutable ? { launchOptions: { executablePath: ejecutable } } : {};

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    // El service worker no debe tapar las peticiones que la prueba simula.
    serviceWorkers: "block",
    locale: "es-CO",
    timezoneId: "America/Bogota",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "celular",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: false,
        hasTouch: true,
        ...lanzamiento,
      },
    },
    {
      name: "computador",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 }, ...lanzamiento },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { VITE_API_URL: "http://localhost:8080" },
  },
});
