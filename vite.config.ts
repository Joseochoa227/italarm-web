/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/** Origen (protocolo + host + puerto) de una URL, o cadena vacía si no es válida. */
function origen(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/**
 * CSP estricta solo en la compilación de producción: el token vive en localStorage
 * (P-05), así que no se permite ningún script en línea ni de otro origen.
 * En desarrollo no se aplica porque Vite inyecta estilos en línea para el HMR.
 */
function politicaSeguridad(env: Record<string, string>): Plugin {
  const api = origen(env.VITE_API_URL);
  const archivos = origen(env.VITE_ORIGEN_ARCHIVOS);
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    // Radix (react-remove-scroll) inyecta <style> para bloquear el desplazamiento detrás de diálogos y
    // menús; su contenido cambia según el ancho de la barra de desplazamiento, así que no sirve un hash.
    // Los scripts siguen estrictos, que es lo que protege el token.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    `img-src 'self' data: blob:${archivos ? ` ${archivos}` : ""}`,
    `connect-src 'self'${api ? ` ${api}` : ""}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
  return {
    name: "italarm-csp",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: csp },
        injectTo: "head-prepend",
      },
    ],
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [
      react(),
      tailwindcss(),
      politicaSeguridad(env),
      VitePWA({
        registerType: "prompt",
        injectRegister: false,
        includeAssets: ["favicon.svg", "apple-touch-icon.png"],
        manifest: {
          name: "ITALARM",
          short_name: "ITALARM",
          description: "Inventario, ventas, instalaciones y cotizaciones de ITALARM",
          lang: "es-CO",
          start_url: "/",
          scope: "/",
          display: "standalone",
          theme_color: "#5980a6",
          background_color: "#f2f2f3",
          icons: [
            { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
            { src: "pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          // Solo los archivos de la app: las respuestas de la API nunca se guardan (BF-13).
          globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
          navigateFallback: "/index.html",
          runtimeCaching: [],
        },
      }),
    ],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: { port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/configuracion.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      css: false,
      env: { VITE_API_URL: "http://api.prueba" },
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/api/esquema.ts",
          "src/main.tsx",
          "src/test/**",
          "src/**/*.test.{ts,tsx}",
          "src/vite-env.d.ts",
        ],
        thresholds: { lines: 80, statements: 80, functions: 80, branches: 75 },
      },
    },
  };
});
