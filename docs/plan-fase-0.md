# Plan de la Fase 0 — Fundaciones (italarm-web)

> Estado: **terminado el 06/10/2026** y subido a la rama `dev`. Aprobado por ITALARM con las propuestas de W-01, W-02 y W-03. Lo pendiente pasa a la Fase 6 (sección 10).
> Base: `italarm-api/docs/requerimientos.md` (secciones 3.1, 8, 9, 11, 12.1 y 12.2), `italarm-api/docs/preguntas.md` (P-01 a P-08 y P-16), `italarm-api/docs/guia-frontend.md` (secciones 1, 2, 3 y 18), el prototipo `docs/Italarm v2.html` y el contrato `italarm-api/contrato/openapi.json` (rama `dev`, commit `4977fa0`, fases 0 a 5).
> Alcance: solo el repositorio **italarm-web**. El backend de la Fase 0 ya está terminado (`italarm-api/docs/plan-fase-0.md`).

## 1. Objetivo y entregable

Dejar lista la base técnica del frontend, con el ingreso al sistema funcionando contra el backend real.

Entregable (12.2): Jose y Victor ingresan con su correo y contraseña desde el celular y el computador, ven el menú (todavía sin pantallas) y pueden cambiar su contraseña y cerrar sesión. El despliegue a pruebas espera la elección del hosting (P-04), igual que en el backend.

## 2. Decisiones que cambian o precisan los requerimientos

| Tema                   | Requerimientos / prototipo                                 | Lo que se construye                                                                            | Fuente        |
| ---------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------- |
| Sesión                 | Cookie + CSRF (9.1)                                        | Token `Bearer` en `localStorage`, sin cookies ni CSRF.                                         | P-05, guía §1 |
| Ingreso                | Campo "Usuario" (RU-05, prototipo)                         | Campo **Correo**.                                                                              | P-01          |
| Duración de la sesión  | —                                                          | El token no vence. Cualquier 401 cierra la sesión en el navegador y vuelve al ingreso.         | P-03, guía §1 |
| Contraseña nueva       | —                                                          | Al menos 8 caracteres, con mayúscula, minúscula, número y signo. El backend también lo valida. | P-07, P-08    |
| Usuarios del prototipo | Andrés y Julián                                            | Los datos vienen de `GET /sesion` (Jose y Victor).                                             | Sección 8     |
| Menú                   | El prototipo tiene "Documentos", "Tasas de cambio" y "Más" | Se siguen RF-01 y RF-03, que prevalecen sobre el prototipo (AG-01). Ver la pregunta W-01.      | RF-01, RF-03  |

## 3. Tecnología

| Tema                   | Elección                                                                                                                                                                  | Por qué                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Base                   | React 19 + TypeScript (`strict`, más `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`) + Vite                                                                    | Cumple 9.1 ("React 18+") y BF-01.                                                                        |
| Estilos                | Tailwind CSS v4 con los tokens del prototipo en `src/styles/tokens.css` (`@theme`)                                                                                        | 9.1, 11.1 (`styles/`).                                                                                   |
| Tipografías            | Barlow (400, 500 y 700) y Barlow Condensed (400 y 600), servidas desde la propia app con `@fontsource`                                                                    | Son las del prototipo. Se sirven localmente para no abrir la CSP a Google Fonts.                         |
| Íconos                 | `lucide-react`                                                                                                                                                            | El prototipo usa los mismos trazos de Lucide (house, package, cart, wrench, truck, file, users, chart…). |
| Componentes accesibles | Primitivas de Radix (Dialog, DropdownMenu y Toast) con estilo propio en `components/ui/`, al estilo shadcn/ui                                                             | 9.1 y BF-11.                                                                                             |
| Rutas                  | React Router (modo datos), con rutas diferidas                                                                                                                            | BF-12.                                                                                                   |
| Datos del servidor     | TanStack Query                                                                                                                                                            | BF-03.                                                                                                   |
| Formularios            | React Hook Form + Zod, con mensajes en español                                                                                                                            | BF-05.                                                                                                   |
| **Cliente de la API**  | **openapi-typescript + openapi-fetch + openapi-react-query**                                                                                                              | Ver la sección 3.1.                                                                                      |
| Pruebas                | Vitest, React Testing Library, MSW (con `openapi-msw` para que los simulacros se validen contra el contrato) y Playwright                                                 | 11.3.                                                                                                    |
| PWA                    | `vite-plugin-pwa`                                                                                                                                                         | BF-13.                                                                                                   |
| Calidad                | ESLint (flat config: `typescript-eslint` estricto con tipos, `react-hooks`, `react-refresh`, `jsx-a11y`), Prettier con `prettier-plugin-tailwindcss`, Husky + lint-staged | BF-16.                                                                                                   |
| Node                   | 22 LTS (`.nvmrc`)                                                                                                                                                         | Es la versión del entorno.                                                                               |

Las versiones exactas son las estables al momento de instalar y quedan fijadas en `package-lock.json`.

### 3.1 Por qué openapi-typescript y no orval

Los `operationId` del contrato los numera springdoc automáticamente (`listar_8`, `registrar_5`, `detalle_9`…). Esos números cambian cuando el backend agrega un controlador. Orval nombra las funciones y los hooks a partir del `operationId`, así que un endpoint nuevo en el backend renombraría hooks que nada tienen que ver con él.

openapi-typescript genera los tipos a partir de las **rutas** (`/api/v1/sesion`, `/api/v1/productos/{id}`), que sí son estables. Con openapi-fetch las llamadas quedan tipadas por ruta y método (`api.GET("/api/v1/sesion")`), y openapi-react-query las conecta con TanStack Query (`$api.useQuery("get", "/api/v1/productos", …)`). Ningún tipo de la API se escribe a mano (BF-04, RT-08).

### 3.2 Cómo se mantiene el contrato

- `contrato/openapi.json`: copia del contrato del backend, versionada en este repositorio para que la CI no dependa de italarm-api. `contrato/ORIGEN` guarda el commit de italarm-api del que salió la copia.
- `npm run api:sincronizar`: copia el contrato desde `../italarm-api/contrato/openapi.json` (o desde la ruta de `CONTRATO_ORIGEN`), actualiza `ORIGEN` y regenera los tipos.
- `npm run api:generar`: genera `src/api/esquema.ts` a partir de la copia. Ese archivo no se edita a mano y queda fuera de ESLint y Prettier.
- La CI regenera los tipos y falla si salen distintos de los versionados.

## 4. Tareas

### T0. Orden del repositorio — `docs:`

- Renombrar `docs/Requerimientos_Sistema_Inventario_v0.7.md` a `docs/requerimientos.md`, igual que en el backend (tienen el mismo contenido).
- `README.md` (cómo instalar, ejecutar contra la API local y probar), `CLAUDE.md` (comandos, convenciones y decisiones técnicas, AG-07), `CHANGELOG.md`, `.editorconfig`, `.nvmrc`, `.gitignore`.

### T1. Proyecto base — `build:`

- Vite + React + TypeScript con las opciones estrictas de la sección 3.
- Estructura de 11.1: `app/`, `api/`, `components/ui/`, `features/<funcionalidad>/{components,hooks,pages,schemas}`, `lib/` y `styles/`.
- `.env.example` con `VITE_API_URL=http://localhost:8080`. `lib/entorno.ts` lee y valida las variables con Zod al arrancar: si falta una, la app lo dice claramente en lugar de fallar en silencio (BF-15).

### T2. Calidad — `build:`

- ESLint y Prettier (sección 3). `any` queda prohibido: si alguna vez hace falta, se justifica con un comentario (BF-01).
- Scripts: `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `typecheck`, `test`, `test:cobertura`, `e2e`, `api:generar` y `api:sincronizar`.
- Husky + lint-staged: ESLint y Prettier sobre los archivos del commit.

### T3. Tokens del prototipo y Tailwind — `feat:`

Se traducen a `@theme` los tokens del prototipo (`:root` del archivo `Italarm v2.html`):

| Grupo           | Valores                                                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base            | `bg #f2f2f3`, `surface #e9e9ea`, `text #1d1f20`, `accent #5980a6`, `accent-2 #728fab`, `divider` = texto al 16 %; tarjetas `#fafafb` con borde de texto al 9 % |
| Escalas 100–900 | `neutral` (#f5f5f8 … #2b2b2d), `accent` (#eef6ff … #1d2d3d), `accent-2` (#eef6ff … #1f2d3a)                                                                    |
| Tipografía      | títulos en Barlow Condensed 600 (interletrado −0,015 em; la marca ITALARM con 0,14 em); texto en Barlow 15 px / 1,55                                           |
| Radios          | `sm 2px`, `md 4px`, `lg 7px`                                                                                                                                   |
| Sombras         | `sm`, `md` y `lg` en tinta #2b2b2d al 14, 16 y 22 %                                                                                                            |
| Espaciado       | escala del prototipo con base de 3,4 px (`space-1` … `space-8`)                                                                                                |

Se toma lo que muestran las pantallas del prototipo (radios `md`/`lg` en botones, campos y tarjetas), no la variante "blueprint" de esquinas rectas que trae su hoja de estilos base. Áreas táctiles de al menos 44 px (BF-11).

### T4. Cliente de la API — `feat:`

- Generación de tipos (sección 3.2).
- `api/cliente.ts`: una instancia de openapi-fetch con `baseUrl = VITE_API_URL` y dos middlewares:
  1. agrega `Authorization: Bearer <token>` cuando hay token;
  2. ante un **401** en cualquier petición que no sea `POST /sesion`, borra el token, vacía la caché de TanStack Query y lleva al ingreso conservando la ruta (`/ingresar?volver=/compras`).
- `api/problema.ts`: lee el cuerpo `application/problem+json` (`codigo`, `detail`, `errores`, `correlationId`) y lo convierte en un error tipado `ErrorApi`. El contrato no declara esos campos (sección 8, dependencia D-01), así que se validan con un esquema Zod mínimo mientras el backend los documenta.
- `lib/errores.ts`: decide el comportamiento por `codigo`, nunca por el texto (guía §2):
  - `VALIDACION`: un mensaje por campo en el formulario;
  - códigos de negocio: se muestra `detail`;
  - `ERROR_INTERNO`, fallas de red y respuestas sin `codigo`: mensaje genérico con **Reintentar** y el `correlationId` para soporte (BF-09).
- TanStack Query: no reintenta los 4xx; reintenta una vez los errores de red y los 5xx de las consultas; las mutaciones nunca se reintentan solas.

### T5. Sesión — `feat:`

- `features/auth`:
  - token en `localStorage` (`italarm.token`), con todo acceso dentro de try/catch;
  - la sesión es la consulta `['sesion']` = `GET /api/v1/sesion` (BF-03): no se copia a ningún otro estado.
- **Al cargar la app:** si hay token, se pide `GET /sesion` y se muestra un esqueleto mientras responde. 200 entra a la app; 401 borra el token y muestra el ingreso.
- **Pantalla de ingreso** (`/ingresar`), según el prototipo: tarjeta centrada con "ITALARM", "Inventario · Ventas · Instalaciones", Correo, Contraseña y el botón Ingresar.
  - El botón queda deshabilitado mientras la petición está en curso (BF-10).
  - `CREDENCIALES_INVALIDAS` muestra el `detail` del backend.
  - Después de ingresar, vuelve a la ruta de `?volver=` o a Inicio.
- **Rutas protegidas:** sin sesión, cualquier ruta lleva a `/ingresar?volver=…`.
- **Cerrar sesión:** `DELETE /sesion`, borrar el token y vaciar la caché. Aunque la petición falle, el navegador queda sin sesión.
- **Cambiar contraseña** (`/cuenta/contrasena`), RU-07: contraseña actual, nueva y confirmación.
  - Zod valida las reglas de P-07/P-08 y que la confirmación coincida, con los mensajes junto a cada campo.
  - `CONTRASENA_ACTUAL_INCORRECTA` se muestra en el campo de la contraseña actual; `CONTRASENA_DEBIL` y `CONTRASENA_NO_COINCIDE`, en los suyos.
  - Al terminar, un toast: "Contraseña cambiada. Se cerraron tus otras sesiones."

### T6. Layout y navegación — `feat:`

Según el prototipo, con el corte entre celular y computador en **820 px** (el mismo del prototipo):

- **Computador** (RF-01): menú lateral fijo de 240 px.
  - Arriba: marca "ITALARM" y "Control interno".
  - Opciones: Inicio, Inventario, Nueva venta, Nueva instalación, Compras, Cotizaciones, Clientes y Reportes. La opción activa va en `accent-100` / `accent-800`.
  - Abajo: el espacio del recuadro de tasas (se llena en la Fase 1) y el usuario conectado (inicial, nombre) con su menú: Cambiar contraseña y Cerrar sesión.
- **Celular** (RF-03): barra superior y barra inferior.
  - La barra superior lleva "ITALARM", el espacio de la TRM (Fase 1) y el botón del usuario con el mismo menú.
  - La barra inferior lleva Inicio, Inventario, **Nuevo (+)** destacado, Clientes y Reportes, con botones de al menos 56 px de alto y respetando `safe-area-inset-bottom`.
  - Nuevo (+) abre la hoja inferior del prototipo (RF-04): Nueva venta, Nueva instalación, Registrar compra y Nueva cotización.
- **Rutas** (todas diferidas, BF-12): `/`, `/inventario`, `/ventas/nueva`, `/instalaciones/nueva`, `/compras`, `/compras/nueva`, `/cotizaciones`, `/cotizaciones/nueva`, `/clientes`, `/reportes`, `/cuenta/contrasena`, y una página 404.
  - Las pantallas de módulos que aún no existen muestran un estado vacío: "Esta sección llega en la Fase N". Es el "menú vacío" del entregable.
- **Inicio** de esta fase: solo el saludo con el nombre y la fecha de hoy (RF-06). El resto de Inicio es de la Fase 6.
- Los indicadores del menú (cantidad bajo mínimo en Inventario, RF-02) y el aviso de tasas quedan para las fases 1 y 2.

### T7. Sistema de diseño base — `feat:`

- `components/ui/`: Botón (primario, secundario, fantasma, ícono; con estado "guardando"), Campo (etiqueta, ayuda y error asociados con `aria-describedby`), Entrada, Contraseña con "mostrar", Tarjeta, Etiqueta (tag), Diálogo, Menú desplegable, Hoja inferior, Toast, Esqueleto, Estado vacío y Estado de error con Reintentar.
- Error boundary por ruta con Reintentar (BF-09).
- Aviso "Sin conexión a internet" en la parte superior mientras el navegador esté desconectado (BF-13).
- Textos de la interfaz en español, en un archivo `textos.ts` por funcionalidad (BF-17).

### T8. Formato de dinero y fechas — `feat:`

`lib/formato.ts` (BF-07, guía §3), sin pasar nunca el texto decimal por `number`:

- `formatearDinero({ monto: "1250000.0000", moneda: "COP" })` → `$ 1.250.000` (COP, sin decimales);
- `formatearDinero({ monto: "1939.04", moneda: "USD" })` → `US$ 1.939,04`;
- `formatearDinero({ monto: "1234.56", moneda: "VES" })` → `Bs 1.234,56`.

`Intl.NumberFormat("es-CO")` recibe el texto decimal tal cual: los navegadores actuales lo formatean sin perder precisión. Para VES se arma el prefijo `Bs` a mano, porque Intl no trae ese símbolo.

- `formatearFecha("2026-10-06")` → `06/10/2026`, separando el texto sin `new Date()`, para que la zona horaria no corra el día.
- `formatearFechaHora(instante)` → `dd/mm/aaaa hh:mm`, en la zona America/Bogota.
- `formatearCantidad("12.5", unidad)` → `12,5`.

### T9. PWA y seguridad del navegador — `feat:`

- `vite-plugin-pwa`:
  - manifiesto "ITALARM", `theme_color #5980a6`, `background_color #f2f2f3`, `display: standalone`;
  - íconos de 192 y 512 px y su versión _maskable_ (ver W-03);
  - el service worker guarda en caché solo los archivos de la app, **nunca** las respuestas de la API;
  - cuando hay una versión nueva, un toast ofrece "Actualizar".
- **CSP estricta** en la compilación de producción (guía §1, por el token en `localStorage`): `default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob: <origen de archivos>; connect-src 'self' <VITE_API_URL>; base-uri 'self'; form-action 'self'; object-src 'none'`.
  - Se inyecta como `<meta>` en `index.html` al compilar.
  - `frame-ancestors` y las demás cabeceras (`X-Content-Type-Options`, `Referrer-Policy`) se configuran en el hosting (P-04).
  - El origen de las fotos y los logos firmados entra por la variable `VITE_ORIGEN_ARCHIVOS`, porque depende del almacenamiento que se elija.
  - Prohibido `dangerouslySetInnerHTML` (regla de ESLint).

### T10. CI — `ci:`

GitHub Actions en cada push y Pull Request:

1. `npm ci`;
2. revisar que los tipos generados coincidan con el contrato;
3. `lint`, `format:check` y `typecheck`;
4. pruebas con cobertura mínima del **80 % de líneas** (la misma meta del backend);
5. `build`;
6. Playwright en tamaño celular (390×844) y computador (1280×800) contra la app compilada, con la API simulada.

### T11. Documentación — `docs:`

- `CLAUDE.md` y `README.md` con los comandos y las decisiones de este plan.
- `CHANGELOG.md` con la Fase 0.
- La lista de verificación para ITALARM (sección 7).

## 5. Endpoints que usa esta fase

| Método y ruta                            | Uso                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `POST /api/v1/sesion`                    | Ingresar: `{ correo, contrasena }` → `{ token, usuario }`                    |
| `GET /api/v1/sesion`                     | Validar el token al cargar y obtener el usuario (`id`, `nombre`, `correo`)   |
| `DELETE /api/v1/sesion`                  | Cerrar sesión                                                                |
| `PUT /api/v1/usuarios/actual/contrasena` | Cambiar la contraseña: `{ contrasenaActual, contrasenaNueva, confirmacion }` |

No hay migraciones: el frontend no tiene base de datos.

## 6. Pruebas

**Componentes y hooks** (Vitest + RTL + MSW), probando lo que ve y hace el usuario (BF-18, BF-19):

- **Ingreso correcto:** se guarda el token y se ve el menú con el nombre del usuario.
- **Ingreso incorrecto:** se ve el mensaje de `CREDENCIALES_INVALIDAS` y no se guarda ningún token.
- **Botón deshabilitado** mientras se ingresa (BF-10).
- **Validación del formulario:** correo inválido o campos vacíos muestran el mensaje junto al campo.
- **Al cargar:**
  - con un token válido entra directo;
  - con un token inválido (401) lo borra y muestra el ingreso.
- **401 en cualquier petición:** vuelve al ingreso y conserva `?volver=`.
- **Ruta protegida sin sesión:** lleva al ingreso; después de ingresar, vuelve a esa ruta.
- **Cerrar sesión:**
  - llama a `DELETE /sesion` y borra el token;
  - si la petición falla, igual se cierra en el navegador.
- **Cambiar contraseña:**
  - las reglas de P-07/P-08 y la confirmación se validan junto a cada campo;
  - `CONTRASENA_ACTUAL_INCORRECTA` aparece en su campo;
  - el éxito muestra el toast.
- **Navegación:**
  - menú lateral en computador y barras en celular;
  - Nuevo (+) abre las cuatro opciones;
  - la opción activa queda marcada.
- **Errores:** `ERROR_INTERNO` y una falla de red muestran el mensaje genérico con Reintentar.
- **Formato** (CP de la Fase 0): COP, USD y VES con los ejemplos de BF-07, cantidades con y sin decimales, fechas sin corrimiento de zona y textos con más de 15 dígitos sin perder precisión.

**Extremo a extremo** (Playwright, BF-20), en celular y en computador: ingresar, navegar el menú, cambiar la contraseña y cerrar sesión.

- En la CI corre contra la API simulada.
- Contra el ambiente de pruebas real cuando exista (P-04).
- Si el entorno lo permite, se prueba también una vez contra el backend local (`docker compose` en italarm-api).

## 7. Definición de terminado (12.1) aplicada a esta fase

- [ ] Pull Request revisado, con la CI en verde (tipos sincronizados, lint, formato, tipos, pruebas con cobertura ≥ 80 %, compilación y e2e).
- [x] Pruebas de la sección 6 escritas y pasando (Vitest y Playwright). Además, el recorrido completo se probó con el navegador contra el backend real de `dev` en local.
- [x] Cliente generado desde el contrato vigente de italarm-api (`dev` @ `4977fa0`).
- [ ] Desplegado en pruebas y probado en celular y computador junto con el backend. _(Requiere P-04.)_
- [x] `CHANGELOG.md` actualizado y lista para ITALARM:
  1. Abrir la app en el celular y en el computador.
  2. Ingresar como Jose y como Victor con el correo y la contraseña inicial.
  3. Intentar con una contraseña errada y ver el mensaje.
  4. Recorrer el menú: lateral en computador; barras y Nuevo (+) en celular.
  5. Cambiar la contraseña, cerrar sesión y volver a ingresar con la nueva.
  6. Comprobar que la sesión del otro dispositivo se cerró.
  7. Instalar la app en el celular desde el navegador ("Agregar a la pantalla de inicio").

## 8. Preguntas para ITALARM y dependencias

| #    | Tema             | Pregunta                                                                                                                                                                         | Propuesta                                                                                                                                                                                                                                              | Respuesta de ITALARM         |
| ---- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| W-01 | Menú             | El prototipo tiene "Documentos", "Tasas de cambio" y un botón "Más" en el celular. RF-01 y RF-03 no los incluyen, y no dicen dónde quedan Configuración, Usuarios y Proveedores. | Seguir RF-01 y RF-03 al pie de la letra. Configuración y Usuarios van en el menú del usuario (junto a Cambiar contraseña y Cerrar sesión). Proveedores va dentro de Compras. Tasas se abre desde el recuadro de tasas (Fase 1).                        | De acuerdo con la propuesta. |
| W-02 | Colores de error | El prototipo solo usa azules y grises: sus alertas son `accent-200` con texto `accent-900`. No tiene rojo para errores, "Anulada" o "Stock insuficiente".                        | Agregar una sola escala roja de "peligro", con la misma luminosidad que las demás. Se usaría solo para errores, acciones destructivas y estados negativos, siempre con ícono y texto (no solo color). Los avisos siguen en azul, como en el prototipo. | De acuerdo con la propuesta. |
| W-03 | Ícono de la app  | No hay logo de ITALARM en el repositorio.                                                                                                                                        | Ícono provisional: "I" en Barlow Condensed blanco sobre `#5980a6`. Se reemplaza cuando ITALARM entregue el logo.                                                                                                                                       | De acuerdo con la propuesta. |

**Dependencias con el backend (no bloquean esta fase):**

- **D-01:** el esquema `ProblemDetail` del contrato no declara `codigo`, `correlationId` ni `errores`. Se propone documentarlos en italarm-api, para que también salgan del contrato. Mientras tanto, el frontend los valida en tiempo de ejecución (T4).
- **D-02:** 92 de los 122 esquemas no marcan sus campos como obligatorios, y los que pueden llegar `null` (por ejemplo `aviso` en las tasas) no lo declaran. Con eso todos los campos de respuesta quedan opcionales en TypeScript. Se propone que el backend marque los campos obligatorios y los que admiten `null` antes de la Fase 1, que es donde empieza a pesar.
- **D-03:** el contrato con las fases 0 a 5 está en la rama `dev` de italarm-api; `main` todavía no lo tiene. La copia se toma de `dev`.
- **P-04 (hosting):** bloquea solo el despliegue a pruebas, la CSP definitiva (origen de la API y de los archivos) y el e2e contra el ambiente real.

**Rama:** el trabajo se sube a `claude/vibrant-euler-91glev`, la rama indicada para esta sesión, con commits por tarea (Conventional Commits, AG-06).

## 10. Pendientes que pasan a la Fase 6

Por decisión de ITALARM (06/10/2026), estos puntos quedan para la Fase 6:

| #     | Pendiente                                                     | Detalle                                                                                                                                                                                                                                               |
| ----- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F6-01 | Acceso a los listados de Compras y Cotizaciones en el celular | RF-03 no los pone en la barra inferior; hoy, en el celular solo se llega a sus formularios con Nuevo (+). Se resuelve con los bloques de Inicio de la Fase 6 o con un acceso en el menú del usuario.                                                  |
| F6-02 | Despliegue a pruebas y prueba en celulares reales             | Requiere el hosting (P-04). Con él se completan la CSP definitiva (origen de la API y de los archivos), `frame-ancestors` y las cabeceras de seguridad en el hosting, y el e2e contra el ambiente real.                                               |
| F6-03 | Ajustes del contrato en italarm-api                           | D-01: declarar `codigo`, `correlationId` y `errores` en `ProblemDetail`. D-02: marcar los campos obligatorios y los que admiten `null`. Mientras tanto, el frontend valida los errores al recibirlos y trata como opcionales los campos de respuesta. |
| F6-04 | Logo de ITALARM                                               | Reemplaza el ícono provisional (W-03) con `npm run iconos:generar` o con los archivos que entregue ITALARM.                                                                                                                                           |
| F6-05 | Revisión de la CI en GitHub                                   | La CI está escrita y sus pasos pasan en local y en un clon limpio. Falta verla en verde en GitHub Actions al abrir el primer Pull Request.                                                                                                            |
