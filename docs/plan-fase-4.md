# Plan de la Fase 4 — Instalaciones, fotos y garantías (italarm-web)

> Estado: **propuesto el 08/10/2026**, pendiente de aprobación de ITALARM (AG-02).
> Base: `docs/requerimientos.md` (3.9, 3.13, 3.14, 3.15 y 12.6), `italarm-api/docs/preguntas.md` (P-37 a P-45), `italarm-api/docs/guia-frontend.md` (§4, §9, §15 y §16), el prototipo `docs/Italarm v2.html` (pantalla Nueva instalación) y el contrato `contrato/openapi.json` (`dev` @ `26aa62c`).
> Alcance: solo **italarm-web**. El backend de esta fase ya está terminado; no se necesitan endpoints nuevos.

## 1. Objetivo y entregable

Que ITALARM registre el trabajo completo de cada instalación —cliente, técnicos, material con seriales, fotos, garantía y cobro— y consulte las garantías (12.6).

Entregable: el formulario de instalación en 4 pasos con el panel de cobro, la subida de fotos con la cámara del celular, la confirmación con WhatsApp y PDF, el listado y el detalle de instalaciones (con edición de lo descriptivo y anulación), la consulta de garantías y los reclamos.

## 2. Qué queda fuera de esta fase

- **Instalación desde una cotización** (`cotizacionId`, CP-22, CP-23): Fase 5. El formulario queda listo para recibirla.
- **"Garantías por vencer" en Inicio**: Fase 6, con la pantalla de Inicio. En esta fase se consulta en `/garantias`.
- **Exportar a Excel**: Fase 6.
- **Pendientes F6-01 a F6-06**: siguen en la Fase 6.

**Diferencia con el prototipo:** igual que en ventas (Fase 3), no se pone el selector "Precio del material: Instalador / Cliente final". El precio lo decide el tipo de cliente y se cambia a mano en cada línea (RF-78, RN-01).

## 3. Tareas

### T1. Reutilizar lo de ventas — `refactor:`

Instalaciones y ventas comparten casi todo el material (RF-108). Lo común pasa al módulo `comercial`, sin cambiar cómo se ven las ventas:

- la línea de material (precio, disponibilidad, costo a la tasa de hoy y de la última compra, cantidad o seriales que salen, avisos);
- el resumen con descuento, total, costo y utilidad;
- las monedas del comprobante y la pantalla de confirmación.

Lo nuevo de esta fase:

- **Técnicos** (P-37): casillas con los usuarios activos (`GET /usuarios/tecnicos`), al menos uno. Por defecto, quien registra.
- **Fotos** (RF-110 a RF-112, P-42):
  - tres grupos —**Antes**, **Durante** y **Después**— con su contador ("Antes · 4");
  - en el celular, **Tomar foto** abre la cámara (`capture="environment"`); también se pueden elegir de la galería, varias a la vez;
  - cada foto se comprime en el navegador (BF-14) y se valida: JPEG, PNG o WebP, 5 MB como máximo y 30 por grupo;
  - miniaturas con la opción de quitar; al tocar una, se ve en grande.
- **Documento → enlace**: INSTALACION lleva a `/instalaciones/:id` (kárdex, historial del serial e historial del cliente).

### T2. Nueva instalación (RF-107 a RF-119) — `feat:`

`/instalaciones/nueva`, en los cuatro pasos del prototipo y el panel **Cobro** al lado (abajo en el celular):

- **Encabezado** (RF-05): fecha, usuario y "el consecutivo se asigna al guardar".
- **01 · Cliente y trabajo** (RF-107):
  - cliente (selector de la Fase 3, que también crea clientes; o el que llega con `?clienteId=`);
  - dirección: se propone la del cliente y se puede cambiar;
  - fecha: hoy por defecto, puede ser anterior y nunca futura; las tasas y las garantías se toman de esa fecha (P-38);
  - técnicos y descripción del trabajo.
- **02 · Material usado** (RF-108, RF-109): igual que en la venta. Sin stock no deja guardar (**CP-15**). Se puede registrar sin material si hay mano de obra (P-41).
- **03 · Fotos**: se eligen o se toman mientras se llena el formulario. Como la API recibe las fotos de una instalación ya guardada, se suben **justo después de guardar**, con su avance en la confirmación. Si alguna falla, la instalación ya quedó registrada y el detalle permite volver a subirla (como la factura de las compras).
- **04 · Garantía** (RF-113 a RF-115, P-39):
  - mano de obra: **1**, **2** o **3 meses** (por defecto, el de Configuración), con la fecha de vencimiento que calcula el backend;
  - equipos: 3 meses, con su vencimiento (no se elige);
  - condiciones: el texto de Configuración, editable en cada instalación.
- **Cobro** (RF-116 a RF-119): moneda, material (suma automática), **mano de obra** escrita por el usuario, descuento (P-40), total en las tres monedas, costo y utilidad. Todo viene de la vista previa (`POST /instalaciones/vista-previa`, 400 ms después del último cambio, BF-06), con sus `avisos` (por ejemplo, la tasa de una fecha anterior).
- **Guardar** con `Idempotency-Key`; errores en su campo cuando el backend lo indica (`INSTALACION_SIN_DIRECCION` → dirección, `INSTALACION_FECHA_FUTURA` → fecha…), los demás como aviso general.

### T3. Confirmación (RF-120) — `feat:`

"Instalación I-0001 registrada" con cliente, total y **vencimiento de la garantía**, el avance de la subida de fotos y los botones **Enviar comprobante por WhatsApp**, **Descargar PDF**, **Ver la instalación** y **Registrar otra instalación**.

### T4. Instalaciones: listado, detalle, edición y anulación (RF-121, RF-122) — `feat:`

- **Listado** (`/instalaciones`): por defecto el mes en curso; filtros por cliente, técnico, fechas, **estado de la garantía** (vigente, por vencer, vencida) e incluir anuladas; totales y utilidad del período. Cada instalación: consecutivo, fecha, cliente, dirección, técnicos, total, utilidad, estado de la garantía y la marca **Anulada**. Se llega con **Ver instalaciones** desde Nueva instalación (como W-09).
- **Detalle** (`/instalaciones/:id`):
  - cliente, dirección, fecha, técnicos, descripción, tasas, usuario y hora;
  - material con precios, costo y seriales; cobro con mano de obra, descuento, total, costo y utilidad guardados;
  - **garantías**: mano de obra y equipos con su vencimiento y estado, y las condiciones;
  - **fotos** por grupo, con agregar y quitar (también en las anuladas, P-42);
  - **reclamos** de la instalación (T5);
  - **Enviar por WhatsApp** y **Descargar PDF**.
- **Editar** (RF-122, P-44): dirección, técnicos, descripción, condiciones, observaciones y monedas del comprobante, con control de versión. La fecha, el plazo de garantía y los valores no se editan.
- **Anular**: con motivo; el material vuelve a bodega y las fotos se conservan.

### T5. Garantías y reclamos (RF-123 a RF-125) — `feat:`

- **Consulta** (`/garantias`, `GET /garantias`): una fila por garantía —la mano de obra de cada instalación y cada equipo con serial vendido o instalado— con cliente, documento (con enlace), serial, vencimiento, días restantes y estado (**Vigente**, **Por vencer**, **Vencida**). Filtros por estado, cliente, tipo (instalación o venta) y **serial** (RF-124). Ordenadas por la que vence primero. Cómo se llega: ver **W-10**.
- **Reclamos** (P-45):
  - **Registrar reclamo** desde una garantía, desde el detalle de la instalación o desde el historial del serial: fecha (hoy por defecto), problema y, si ya se sabe, la solución;
  - si la garantía ya venció, se registra igual y queda marcado **Fuera de garantía**;
  - la solución se puede escribir después; los reclamos no se borran;
  - si sale un equipo de reemplazo de la bodega, la pantalla recuerda registrarlo con un ajuste de salida con motivo Garantía (RF-125), con el enlace al ajuste del producto.
- **Historial del serial**: muestra la garantía y los reclamos (ya existía, ahora con el botón **Registrar reclamo**).

## 4. Pantallas y rutas

| Ruta                   | Pantalla                                                     |
| ---------------------- | ------------------------------------------------------------ |
| `/instalaciones/nueva` | Nueva instalación (reemplaza la página "llega en la Fase 4") |
| `/instalaciones`       | Listado de instalaciones                                     |
| `/instalaciones/:id`   | Detalle de la instalación                                    |
| `/garantias`           | Consulta de garantías y reclamos                             |

## 5. Endpoints que usa esta fase

Todos existen en el contrato.

| Tema          | Endpoints                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalaciones | `GET/POST /instalaciones`, `POST /instalaciones/vista-previa`, `GET/PUT /instalaciones/{id}`, `POST /instalaciones/{id}/anular`                                     |
| Fotos         | `POST /instalaciones/{id}/fotos?grupo=`, `DELETE /instalaciones/{id}/fotos/{fotoId}`                                                                                |
| Comprobantes  | `GET /instalaciones/{id}/comprobante`, `POST /instalaciones/{id}/enlace`                                                                                            |
| Garantías     | `GET /garantias`, `GET/POST /garantias/reclamos`, `PUT /garantias/reclamos/{id}`                                                                                    |
| Apoyo         | `GET /usuarios/tecnicos`, `GET /configuracion`, `GET /clientes`, `GET /productos`, `GET /inventario/productos/{id}/seriales?estado=EN_BODEGA`, `GET /seriales/{id}` |

## 6. Pruebas

**Componentes** (Vitest + Testing Library + MSW tipado con el contrato):

- **Instalación:**
  - dirección propuesta del cliente; fecha anterior permitida y futura rechazada; técnicos (al menos uno);
  - **CP-15**: 60 m de cable con 50 en bodega → aviso en la línea y Guardar bloqueado;
  - instalación solo de mano de obra (P-41);
  - garantía de 1, 2 o 3 meses con el vencimiento del backend; condiciones de Configuración editables;
  - cobro con mano de obra y descuento tal como responde el backend;
  - `Idempotency-Key`, fotos subidas después de guardar y una que falla.
- **Fotos**: tipos permitidos, 5 MB como máximo (después de comprimir), 30 por grupo, contador, quitar.
- **Detalle**: garantías con su estado, edición con conflicto de versión, anulación, fotos en una anulada.
- **Garantías**: **CP-20** (instalación del 1 de octubre → vence el 1 de enero; "Por vencer" en sus últimos 30 días, como lo marca el backend), filtros por estado, tipo, cliente y serial; reclamo dentro y fuera de garantía; solución escrita después.

**Extremo a extremo** (Playwright, celular y computador, con la API simulada):

- registrar una instalación con una cámara con serial, cable, mano de obra y dos fotos; ver la confirmación y el detalle con sus fotos;
- intentar usar más cable del que hay (bloqueado);
- buscar la garantía por serial y registrar un reclamo.

**Contra el backend real en local**, como en las fases anteriores: CP-15, CP-20 (con fecha anterior), subida de fotos (tipo y tamaño), PDF y enlace, anulación y reclamos.

## 7. Definición de terminado (12.1)

- [ ] Pull Request con la CI en verde.
- [ ] Pruebas de la sección 6 escritas y pasando, incluidos CP-15, CP-20 y la subida de fotos.
- [ ] Cliente generado desde el contrato vigente.
- [ ] Desplegado en pruebas. _(Pasa a la Fase 6: F6-02.)_
- [ ] `CHANGELOG.md` actualizado y lista para ITALARM:
  1. Registrar una instalación real desde el celular: cliente, técnicos, material con seriales, mano de obra y fotos tomadas con la cámara.
  2. Revisar el cobro: total, costo y utilidad.
  3. Enviar el comprobante por WhatsApp y descargar el PDF.
  4. Agregar una foto "Después" a la instalación ya guardada y corregir la descripción.
  5. Registrar una instalación con fecha de la semana pasada y revisar su vencimiento de garantía.
  6. Buscar un serial en Garantías y registrar un reclamo; escribir la solución después.
  7. Anular una instalación de prueba y comprobar que el material vuelve a bodega.

## 8. Preguntas para ITALARM

| #    | Tema                             | Pregunta                                                                                                                   | Propuesta                                                                                                                                                                                                                                                                         | Respuesta de ITALARM |
| ---- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| W-10 | Dónde se consultan las garantías | El menú (RF-01, RF-03) no tiene **Garantías**. ¿Desde dónde se abre la consulta de garantías y reclamos (RF-123 a RF-125)? | Sin cambiar el menú: un botón **Garantías** en los listados de instalaciones y de ventas, **Ver garantías** en el detalle del cliente (filtrado por ese cliente) y en el historial de un serial. En la Fase 6, Inicio mostrará "Garantías por vencer" con enlace a esta pantalla. |                      |

## 9. Riesgos y dependencias

- **Cámara y fotos**: `capture="environment"` abre la cámara en la mayoría de celulares; si no, se elige de la galería. La compresión se probó en la Fase 1 con la foto del producto.
- **Muchas fotos con mala señal**: se suben una por una después de guardar, con su avance. Si se corta la conexión, las que faltan se suben desde el detalle.
- **Enlaces de las fotos** (15 minutos): si la página queda abierta mucho tiempo, las miniaturas se vuelven a pedir al recargar el detalle.
- **Tasas de una fecha anterior** (P-38): si no hay tasa de ese día, el backend usa la última anterior y lo dice en `avisos`; si no hay ninguna, responde `TASA_NO_DISPONIBLE`.
- **D-02** (pasa a la Fase 6): todos los campos de respuesta siguen siendo opcionales en TypeScript.
