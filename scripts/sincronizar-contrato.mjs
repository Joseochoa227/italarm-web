// Copia el contrato OpenAPI de italarm-api a contrato/openapi.json y anota su origen.
// Uso:
//   npm run api:sincronizar                 (lee ../italarm-api/contrato/openapi.json)
//   npm run api:sincronizar -- --ref dev    (lee el archivo de esa rama o commit de italarm-api)
//   CONTRATO_ORIGEN=/ruta/openapi.json npm run api:sincronizar
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoApi = resolve(raiz, process.env.CONTRATO_REPO ?? "../italarm-api");
const indiceRef = process.argv.indexOf("--ref");
const ref = indiceRef >= 0 ? process.argv[indiceRef + 1] : undefined;

function git(...args) {
  return execFileSync("git", ["-C", repoApi, ...args], { encoding: "utf8" }).trim();
}

let contenido;
let origen;
if (ref) {
  contenido = git("show", `${ref}:contrato/openapi.json`);
  origen = `italarm-api ${ref} @ ${git("rev-parse", "--short", ref)}`;
} else {
  const archivo = resolve(process.env.CONTRATO_ORIGEN ?? resolve(repoApi, "contrato/openapi.json"));
  if (!existsSync(archivo)) {
    console.error(`No se encontró el contrato en ${archivo}. Usa --ref <rama> o CONTRATO_ORIGEN.`);
    process.exit(1);
  }
  contenido = readFileSync(archivo, "utf8");
  origen = existsSync(resolve(repoApi, ".git"))
    ? `italarm-api ${git("rev-parse", "--abbrev-ref", "HEAD")} @ ${git("rev-parse", "--short", "HEAD")}`
    : archivo;
}

JSON.parse(contenido); // falla si el archivo no es JSON válido
writeFileSync(
  resolve(raiz, "contrato/openapi.json"),
  contenido.endsWith("\n") ? contenido : `${contenido}\n`,
);
writeFileSync(resolve(raiz, "contrato/ORIGEN"), `${origen}\n`);
console.log(`Contrato copiado desde ${origen}`);

// Regenera los tipos aquí mismo: con "npm run x -- --ref dev", npm pasaría los argumentos al último
// comando de una cadena con &&, no a este script.
execFileSync(process.execPath, [resolve(raiz, "scripts/generar-api.mjs")], { stdio: "inherit" });
