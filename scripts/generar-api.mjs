// Genera src/api/esquema.ts desde contrato/openapi.json (BF-04: los tipos de la API nunca se escriben a mano).
// Igual que el CLI de openapi-typescript, con un ajuste: los archivos (format: binary) se tipan como
// Blob para poder enviarlos en multipart/form-data.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import openapiTS, { astToString } from "openapi-typescript";
import ts from "typescript";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contrato = JSON.parse(readFileSync(resolve(raiz, "contrato/openapi.json"), "utf8"));

const BLOB = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Blob"));

const ast = await openapiTS(contrato, {
  rootTypes: true,
  rootTypesNoSchemaPrefix: true,
  transform(esquema) {
    if (esquema.format === "binary") return BLOB;
    return undefined;
  },
});

const encabezado =
  "// Archivo generado con `npm run api:generar` desde contrato/openapi.json. No se edita a mano.\n\n";
writeFileSync(resolve(raiz, "src/api/esquema.ts"), encabezado + astToString(ast));
console.log("src/api/esquema.ts generado");
