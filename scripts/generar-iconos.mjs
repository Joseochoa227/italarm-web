// Genera los íconos provisionales de la PWA (W-03): "I" blanca sobre #5980a6.
// La "I" de Barlow Condensed es una barra vertical, así que se dibuja como rectángulo y no depende
// de la fuente. Se reemplazan cuando ITALARM entregue su logo.
// Uso: node scripts/generar-iconos.mjs  (usa PLAYWRIGHT_CHROMIUM_EXECUTABLE si está definido)
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const publico = resolve(dirname(fileURLToPath(import.meta.url)), "../public");

/** relleno: proporción del lienzo que ocupa la "I" (los íconos maskable necesitan más margen). */
function svg({ redondeado, relleno }) {
  const alto = 512 * relleno;
  const ancho = alto * 0.16;
  const esquina = redondeado ? 96 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${esquina}" fill="#5980a6"/>
  <rect x="${(512 - ancho) / 2}" y="${(512 - alto) / 2}" width="${ancho}" height="${alto}" fill="#f2f2f3"/>
</svg>
`;
}

writeFileSync(resolve(publico, "favicon.svg"), svg({ redondeado: true, relleno: 0.62 }));

const ejecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const navegador = await chromium.launch(ejecutable ? { executablePath: ejecutable } : {});
const pagina = await navegador.newPage();
const iconos = [
  ["pwa-192.png", 192, svg({ redondeado: true, relleno: 0.62 })],
  ["pwa-512.png", 512, svg({ redondeado: true, relleno: 0.62 })],
  ["pwa-maskable-512.png", 512, svg({ redondeado: false, relleno: 0.5 })],
  ["apple-touch-icon.png", 180, svg({ redondeado: false, relleno: 0.62 })],
];
for (const [archivo, lado, contenido] of iconos) {
  await pagina.setViewportSize({ width: lado, height: lado });
  await pagina.setContent(
    `<html><body style="margin:0"><img style="display:block;width:${lado}px;height:${lado}px" src="data:image/svg+xml;base64,${Buffer.from(contenido).toString("base64")}"></body></html>`,
  );
  await pagina.screenshot({ path: resolve(publico, archivo), omitBackground: true });
  console.log(`public/${archivo}`);
}
await navegador.close();
