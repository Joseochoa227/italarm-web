# CLAUDE.md — italarm-web

Frontend de ITALARM (React + TypeScript + Vite). Consume la API de `italarm-api`. Este archivo sigue AG-07: comandos, convenciones y decisiones técnicas.

## Antes de trabajar

- Lee `docs/requerimientos.md` (secciones 3, 9, 11, 12 y 13), `italarm-api/docs/preguntas.md` (sus decisiones prevalecen), `italarm-api/docs/guia-frontend.md` y el plan de la fase en curso (`docs/plan-fase-N.md`).
- Se trabaja una fase a la vez. Al iniciar cada fase se escribe `docs/plan-fase-N.md` y se espera la aprobación de ITALARM (AG-02).
- No se inventan reglas de negocio. Lo ambiguo se pregunta (AG-05). El frontend no calcula valores oficiales: muestra lo que responde el backend (BF-06).
- El prototipo es `docs/Italarm v2.html`. Ante una diferencia, prevalece `docs/requerimientos.md` (sección 8, AG-01).

## Comandos

```bash
npm run dev                # http://localhost:5173 (VITE_API_URL en .env.local)
npm run lint && npm run format:check && npm run typecheck
npm test                   # Vitest + Testing Library + MSW
npm run test:cobertura     # mínimo 80 % de líneas
npm run e2e                # Playwright, celular (390×844) y computador (1280×800)
npm run api:sincronizar    # copia el contrato de ../italarm-api y regenera src/api/esquema.ts
npm run api:sincronizar -- --ref origin/dev   # lo toma de esa rama de italarm-api
```

En el entorno del agente, Playwright necesita `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`.

Antes de cada commit, Husky corre ESLint y Prettier sobre los archivos cambiados. Ninguna fase se cierra con pruebas fallando (BF-21, AG-08).

## Estructura (11.1)

```text
src/
├── app/            arranque, rutas (todas diferidas), proveedores, layout, menú y textos de navegación
├── api/            esquema.ts (GENERADO, no se edita), cliente.ts, problema.ts y token.ts
├── components/     PaginaPendiente y ui/ (sistema de diseño)
├── features/<f>/   components/, hooks/, pages/, schemas/, textos.ts y sus pruebas
├── lib/            formato, errores, entorno, medios y utilidades
├── styles/         tokens.css (tokens del prototipo) y global.css
└── test/           servidor MSW tipado, configuración y renderizarApp()
```

Las páginas exportan `Component`, porque React Router las carga con `lazy`.

## Convenciones

- Código y textos en español, como el backend. Los textos de la interfaz van en `textos.ts` por funcionalidad (BF-17).
- TypeScript estricto, con `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`. `any` está prohibido por ESLint.
- **Tipos de la API:** solo desde `@/api/esquema` (`components["schemas"]["X"]` o `paths`). Nunca se escriben a mano (BF-04).
- **Llamadas:**
  - con hooks: `$api.useQuery("get", "/api/v1/…")` y `$api.queryOptions(...)`;
  - imperativas: `api.GET/POST/PUT/DELETE`.
- **Datos del servidor:** solo en TanStack Query (BF-03). Para estado de interfaz global, Context.
- **Errores:**
  - toda respuesta no 2xx lanza un `ErrorApi` (`status`, `codigo`, `detalle`, `errores`, `correlationId`); las fallas de red, `SIN_CONEXION`;
  - el comportamiento se decide por `codigo` (`lib/errores.ts`), nunca por el texto;
  - en los formularios: `aplicarErroresDeCampo` / `erroresDeCampo`; lo demás va con `EstadoError` o `mensajeDeError`.
- **Formularios:** React Hook Form + Zod, con mensajes en español junto al campo (BF-05).
- **Guardar:** el botón usa `ocupado` mientras la petición está en curso (BF-10). Las creaciones de documentos envían `Idempotency-Key`, generada al abrir el formulario (guía §9).
- **Formato:** solo con `lib/formato.ts` (BF-07). El dinero llega como texto decimal y nunca se convierte a `number`.
- **Estilos:**
  - clases de Tailwind con los tokens de `styles/tokens.css`, cuyos nombres están en español (`fondo`, `tinta`, `acento-700`, `neutro-700`, `peligro-700`…);
  - la escala de espaciado es la del prototipo: 1 unidad = 3,4 px (`p-4` = 13,6 px). Los tamaños fijos se escriben con valores arbitrarios (`min-h-[44px]`);
  - corte celular / computador: 820 px (`escritorio:` en CSS, `useEsEscritorio()` en componentes).
- **Accesibilidad:** áreas táctiles de al menos 44 px, etiqueta en todos los campos, foco visible y botones de solo ícono con `aria-label` (BF-11).
- **Pruebas:**
  - se prueba lo que ve el usuario (roles y textos);
  - la API se simula con `http` de `@/test/servidor`, tipado con el contrato;
  - `renderizarApp({ ruta, conToken, escritorio })` monta la app completa.

## Decisiones técnicas

| Decisión                                                                          | Motivo                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| openapi-typescript + openapi-fetch + openapi-react-query, no orval                | Los `operationId` del contrato los numera springdoc (`listar_8`) y cambian al agregar controladores. Los tipos por ruta son estables (plan, sección 3.1).                                                                   |
| Copia del contrato en `contrato/openapi.json`, con su origen en `contrato/ORIGEN` | La CI no depende de italarm-api y falla si los tipos no corresponden a la copia (`api:verificar`).                                                                                                                          |
| Token en `localStorage` (`italarm.token`) y sesión = consulta `GET /sesion`       | P-05. Un 401 en cualquier petición borra el token, vacía la caché y lleva a `/ingresar?volver=…`.                                                                                                                           |
| CSP en `<meta>`, solo en la compilación                                           | `script-src 'self'` protege el token. `style-src` admite `'unsafe-inline'` porque Radix inyecta `<style>` para bloquear el desplazamiento y su contenido varía. `frame-ancestors` y las cabeceras van en el hosting (P-04). |
| Botón primario en `acento-700` (#416180), no en #5980a6                           | Con texto claro, #5980a6 da 3,7:1 y BF-11 pide 4,5:1. #5980a6 sigue como acento (foco, bordes, ícono).                                                                                                                      |
| Escala `peligro` (roja)                                                           | W-02: solo para errores, acciones destructivas y estados negativos, siempre con ícono y texto.                                                                                                                              |
| Menú según RF-01/RF-03; Configuración y Usuarios en el menú del usuario           | W-01. Proveedores irá dentro de Compras y Tasas, en el recuadro de tasas (Fase 1).                                                                                                                                          |
| Ícono provisional: "I" blanca sobre #5980a6                                       | W-03. `npm run iconos:generar`; se reemplaza por el logo de ITALARM.                                                                                                                                                        |
| `zod/mini` en los archivos que cargan al arrancar (`problema.ts`, `entorno.ts`)   | Menos peso en la primera carga (BF-12). Los formularios usan Zod completo en sus paquetes diferidos.                                                                                                                        |
| TypeScript 5.9                                                                    | typescript-eslint y openapi-typescript todavía no admiten TypeScript 7.                                                                                                                                                     |
| Service worker solo con los archivos de la app                                    | BF-13: no se trabaja sin conexión y las respuestas de la API nunca se guardan en caché.                                                                                                                                     |

## Dependencias abiertas con el backend

- **D-01:** `ProblemDetail` no declara `codigo`, `correlationId` ni `errores`. Por ahora se validan en `api/problema.ts`.
- **D-02:** los esquemas de respuesta no marcan qué campos son obligatorios ni cuáles pueden llegar `null`, así que todos quedan opcionales en TypeScript.
- **P-04:** el hosting define la URL de pruebas, el origen de los archivos (`VITE_ORIGEN_ARCHIVOS`) y las cabeceras de seguridad.
