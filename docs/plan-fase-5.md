# Plan de la Fase 5 — Cotizaciones (italarm-web)

> Estado: **propuesto el 09/10/2026**, pendiente de la aprobación de ITALARM (AG-02).
> Base: `docs/requerimientos.md` (3.11, 12.7 y casos CP-09, CP-21 a CP-24 y CP-26), `italarm-api/docs/preguntas.md` (P-46 a P-55), `italarm-api/docs/guia-frontend.md` (§9 y §17), el prototipo `docs/Italarm v2.html` (pantalla Cotización) y el contrato `contrato/openapi.json` (`dev` @ `26aa62c`).
> Alcance: solo **italarm-web**. El backend de esta fase ya está terminado; no se necesitan endpoints nuevos.

## 1. Objetivo y entregable

Que ITALARM cotice, haga seguimiento a sus cotizaciones y las convierta en venta o instalación (12.7).

Entregable:

- el formulario de cotización (de instalación o de venta) con la vista previa del PDF en vivo en el computador;
- el listado con filtros por estado y días para vencer, y las próximas a vencer resaltadas;
- el detalle con sus versiones y las acciones: enviar por WhatsApp, descargar PDF, aprobar, rechazar con motivo, duplicar, editar, seguimiento y convertir;
- la conversión, que abre la venta o la instalación precargada.

## 2. Qué queda fuera de esta fase

- **"Cotizaciones por vencer" en Inicio**: Fase 6, con la pantalla de Inicio. En esta fase se consultan en el listado (filtro **Por vencer**).
- **Exportar a Excel**: Fase 6.
- **Pendientes F6-02 a F6-06**: siguen en la Fase 6. F6-01 queda resuelto en parte para Cotizaciones si se aprueba W-11.

**Diferencias con el prototipo:**

- Igual que en ventas e instalaciones, no se pone el selector "Precio: Instalador / Cliente final". El precio lo decide el tipo de cliente y se cambia a mano en cada línea (RF-78, RN-01).
- No hay botón "Eliminar": las cotizaciones no se borran; se rechazan con el motivo **Otro** (P-55).

## 3. Tareas

### T1. Nueva cotización (RF-80 a RF-86) — `feat:`

`/cotizaciones/nueva` (también con `?clienteId=`, desde el detalle del cliente), con los bloques del prototipo:

- **Tipo**: **Instalación** o **Venta de material** (control segmentado). Cambia lo que se muestra: la mano de obra y la dirección solo en las de instalación.
- **01 · Cliente**: el selector de las fases 3 y 4 (que también crea clientes); dirección y descripción del trabajo en las de instalación.
- **Validez**: **8**, **15** o **30 días** (por defecto, el de Configuración), con la fecha en que vence según el backend. La fecha de la cotización es siempre hoy (P-49).
- **02 · Ítems**: la línea de material del módulo `comercial`, sin seriales (se eligen al convertir):
  - precio sugerido, que se puede cambiar;
  - costo a la tasa de hoy y a la tasa de la última compra (**CP-09**), con la nota "Los costos son internos: no salen en el PDF";
  - disponibilidad solo como aviso: cotizar no reserva ni descuenta stock (**CP-26**).
- **Cobro**: moneda, mano de obra (instalación), descuento, total en las tres monedas, costo y utilidad, todo como lo devuelve `POST /cotizaciones/vista-previa` 400 ms después del último cambio (BF-06), con sus `avisos`.
- **Monedas en el PDF**, condiciones y observaciones.
- **Guardar** con `Idempotency-Key`: queda en **Borrador** y lleva al detalle, donde están **Enviar por WhatsApp** y **Descargar PDF**.

### T2. Vista previa del PDF en vivo (RF-85) — `feat:`

En el computador, la columna derecha muestra la cotización como saldrá en el PDF: datos y logo de la empresa (Configuración), "COTIZACIÓN", fecha, válida hasta, cliente, ítems, mano de obra, descuento, totales en las monedas elegidas con la nota de la tasa, y el pie (condiciones de pago, garantía y "Documento no válido como factura").

Se arma en la pantalla con los datos de la vista previa del backend, porque el PDF real solo existe para una cotización guardada (`GET /cotizaciones/{id}/comprobante`). No muestra costos ni utilidad. En el celular no se muestra; el PDF se ve después de guardar. Ver **W-12**.

### T3. Listado (RF-87, RF-91) — `feat:`

`/cotizaciones`:

- filtros por estado, cliente, tipo, fechas y **Por vencer**;
- cada cotización: consecutivo con su versión (COT-0001 v2), fecha, cliente, tipo, total, estado con su color e ícono, y **días para vencer**;
- las que vencen en 3 días o menos (`porVencer`) se resaltan (RF-91);
- desde cada fila se abre el detalle.

Cómo se llega: ver **W-11**.

### T4. Detalle, estados y acciones (RF-87 a RF-92) — `feat:`

`/cotizaciones/:id`:

- **Datos**: cliente, tipo, fecha, validez y vencimiento, ítems con precios, cobro, condiciones, usuario y hora.
- **Historial de estados**: enviada, aprobada, rechazada (motivo y detalle) o vencida, con su fecha.
- **Documento generado**: enlace a la venta o la instalación.
- **Versiones anteriores**: cada una con su fecha y sus valores (P-46).

Las acciones se muestran según el estado; el backend tiene la última palabra (`TRANSICION_NO_PERMITIDA` → aviso y recarga):

| Acción                                  | Estados                        | Qué hace                                                                                                                                                                        |
| --------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Enviar por WhatsApp**                 | Borrador, Evaluación           | Como en ventas: en el celular comparte el PDF y luego llama a `/enviar`; en el computador pide `/enlace` y abre WhatsApp. Pasa a **En evaluación**. En las demás, solo reenvía. |
| **Descargar PDF**                       | Todos                          | `GET /comprobante`; en Borrador y En evaluación llama además a `/enviar` (P-50).                                                                                                |
| **Editar**                              | Borrador, Evaluación           | Mismo formulario con control de versión. En una En evaluación avisa antes: "Se creará la versión 2 y la anterior quedará guardada" (RF-88, P-46).                               |
| **Cliente aprobó**                      | Borrador, Evaluación           | `/aprobar`, con confirmación (P-51).                                                                                                                                            |
| **Rechazar**                            | Borrador, Evaluación, Aprobada | Diálogo con motivo **Precio**, **Competencia** u **Otro** y detalle opcional (P-52).                                                                                            |
| **Convertir en venta / en instalación** | Aprobada                       | Abre el formulario precargado (T5).                                                                                                                                             |
| **Duplicar**                            | Todos                          | `/duplicar` con `Idempotency-Key`; crea un Borrador nuevo con los mismos precios cotizados (P-53) y lo abre. Es la forma de "reabrir" una Rechazada o Vencida (P-47).           |
| **Seguimiento por WhatsApp**            | En evaluación                  | `GET /seguimiento` y abre WhatsApp con el mensaje que arma el backend (RF-92, P-54).                                                                                            |

### T5. Conversión en venta o instalación (RF-93 a RF-96) — `feat:`

- **Convertir** lleva a `/ventas/nueva?cotizacionId=` o `/instalaciones/nueva?cotizacionId=`, según el tipo.
- El formulario pide `GET /cotizaciones/{id}/conversion` y se abre con el cliente, la dirección, la descripción, los ítems con sus precios cotizados, la mano de obra y el descuento (**CP-22**):
  - el cliente y el tipo no se cambian (P-55);
  - los seriales se eligen en ese momento;
  - los `avisos` de la conversión se muestran arriba: precio distinto al actual, costo que cambió, stock insuficiente, producto inactivo y tasa;
  - sin stock suficiente no deja guardar hasta ajustar la cantidad (**CP-23**), como cualquier venta o instalación.
- Al guardar se envía `cotizacionId`: la cotización queda **Convertida** y enlazada. Si mientras tanto dejó de estar Aprobada, el backend responde `COTIZACION_NO_CONVERTIBLE` y la pantalla lo explica con el enlace a la cotización.
- El detalle de la venta y de la instalación muestra "Desde la cotización COT-0001" con su enlace.
- Al **anular** una venta o instalación que vino de una cotización, el diálogo avisa que la cotización vuelve a **Aprobada** (**CP-24**).

### T6. Cotizaciones del cliente (P-36) — `feat:`

El detalle del cliente agrega sus cotizaciones (las últimas, con estado y enlace) y **Ver todas**, que abre el listado filtrado por ese cliente.

## 4. Pantallas y rutas

| Ruta                                 | Pantalla                                                           |
| ------------------------------------ | ------------------------------------------------------------------ |
| `/cotizaciones/nueva`                | Nueva cotización (reemplaza la página "llega en la Fase 5")        |
| `/cotizaciones`                      | Listado de cotizaciones (reemplaza la página "llega en la Fase 5") |
| `/cotizaciones/:id`                  | Detalle, versiones y acciones                                      |
| `/cotizaciones/:id/editar`           | Edición (mismo formulario)                                         |
| `/ventas/nueva?cotizacionId=`        | Venta desde una cotización                                         |
| `/instalaciones/nueva?cotizacionId=` | Instalación desde una cotización                                   |

## 5. Endpoints que usa esta fase

Todos existen en el contrato.

| Tema         | Endpoints                                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Cotizaciones | `GET/POST /cotizaciones`, `POST /cotizaciones/vista-previa`, `GET/PUT /cotizaciones/{id}`                                                     |
| Estados      | `POST /cotizaciones/{id}/enviar`, `/aprobar`, `/rechazar`, `/duplicar`                                                                        |
| Comprobantes | `GET /cotizaciones/{id}/comprobante`, `POST /cotizaciones/{id}/enlace`, `GET /cotizaciones/{id}/seguimiento`                                  |
| Conversión   | `GET /cotizaciones/{id}/conversion`, `POST /ventas` y `POST /instalaciones` con `cotizacionId`                                                |
| Apoyo        | `GET /configuracion`, `GET /clientes`, `GET /productos`, `GET /usuarios/tecnicos`, `GET /inventario/productos/{id}/seriales?estado=EN_BODEGA` |

## 6. Pruebas

**Componentes** (Vitest + Testing Library + MSW tipado con el contrato):

- **Formulario**:
  - tipo instalación y venta (mano de obra y dirección solo en instalación);
  - validez 8/15/30 con el vencimiento del backend;
  - **CP-09**: costo US$19,50 → $81.900 a la tasa de hoy y $78.000 a la de compra, como los devuelve la vista previa;
  - **CP-26**: cotizar más de lo que hay en bodega se permite, con aviso;
  - `Idempotency-Key` y errores del backend en su campo.
- **Vista previa del PDF**: muestra lo de la vista previa y la empresa, y nunca los costos ni la utilidad; no aparece en el celular.
- **Listado**: filtros, días para vencer y resaltado de las próximas a vencer; **CP-21** (una Vencida, como la marca el backend).
- **Detalle y acciones**:
  - acciones visibles según el estado;
  - **transiciones no permitidas**: respuesta `TRANSICION_NO_PERMITIDA` → aviso y recarga;
  - editar una En evaluación crea la versión 2 y muestra la anterior;
  - rechazar con motivo y detalle, duplicar, seguimiento, PDF y WhatsApp (P-50).
- **Conversión**:
  - **CP-22**: la instalación se abre con cliente, ítems, precios y mano de obra, y se envía `cotizacionId`;
  - **CP-23**: 4 cámaras con 3 en bodega → Guardar bloqueado;
  - `COTIZACION_NO_CONVERTIBLE` y avisos de la conversión;
  - **CP-24**: anular una venta que vino de una cotización avisa que vuelve a Aprobada.

**Extremo a extremo** (Playwright, celular y computador, con la API simulada):

- crear una cotización de instalación, enviarla por WhatsApp y verla En evaluación;
- aprobarla y convertirla en instalación; ver la cotización Convertida y enlazada;
- rechazar una cotización y duplicarla.

**Contra el backend real en local**, como en las fases anteriores: CP-09, CP-22, CP-23, CP-24, CP-26, versión 2 al editar, transiciones no permitidas, PDF y enlace. CP-21 depende de la tarea diaria del backend; se revisa en el listado con una cotización de fecha anterior si se puede preparar en la base de datos.

## 7. Definición de terminado (12.1)

- [ ] Pull Request con la CI en verde.
- [ ] Pruebas de la sección 6 escritas y pasando, incluidos CP-09, CP-21 a CP-24, CP-26 y las transiciones no permitidas.
- [ ] Cliente generado desde el contrato vigente.
- [ ] Desplegado en pruebas. _(Pasa a la Fase 6: F6-02.)_
- [ ] `CHANGELOG.md` actualizado y lista para ITALARM:
  1. Crear una cotización de instalación con cámaras, cable y mano de obra; revisar la vista previa del PDF en el computador.
  2. Enviarla por WhatsApp desde el celular y comprobar que queda En evaluación.
  3. Editarla y ver la versión 2 con la anterior guardada.
  4. Marcarla como aprobada y convertirla en instalación; elegir los seriales y guardar.
  5. Rechazar otra cotización con motivo y duplicarla.
  6. Revisar en el listado las que están por vencer y enviar un seguimiento por WhatsApp.
  7. Anular la instalación de prueba y comprobar que la cotización vuelve a Aprobada.

## 8. Preguntas para ITALARM

| #    | Tema                                  | Pregunta                                                                                                                                                                                                    | Propuesta                                                                                                                                                                                                                                              | Respuesta de ITALARM |
| ---- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| W-11 | Cómo se llega al listado              | El menú lleva a **Nueva cotización** (RF-01, RF-03). En el celular no hay cómo abrir el listado (F6-01). ¿Desde dónde se abre?                                                                              | Como en ventas e instalaciones (W-09): **Ver cotizaciones** arriba de Nueva cotización, en el celular y en el computador; además, el detalle del cliente y la confirmación llevan a sus cotizaciones. Con esto F6-01 queda resuelto para Cotizaciones. |                      |
| W-12 | Vista previa del PDF en el computador | El PDF real solo se genera para una cotización guardada. ¿Basta con que la vista previa mientras se escribe sea una réplica en pantalla del PDF (mismos datos y orden), y el PDF exacto después de guardar? | Sí: réplica en pantalla que se actualiza al escribir, y en el detalle el botón **Ver PDF** abre el PDF real. Pedir al backend un PDF de una cotización sin guardar haría más lento escribir y necesitaría un endpoint nuevo.                           |                      |

## 9. Riesgos y dependencias

- **Diferencias entre la réplica y el PDF** (W-12): si el PDF del backend cambia de diseño, la réplica debe ajustarse a mano. Se revisan lado a lado contra el backend real.
- **Conversión con cambios** (P-55): entre la aprobación y la conversión pueden cambiar el stock, el costo, el precio o las tasas. El formulario muestra los avisos de `/conversion` y el backend vuelve a validar al guardar.
- **Dos personas convirtiendo a la vez**: el backend solo deja un documento activo por cotización y responde `COTIZACION_NO_CONVERTIBLE` al segundo.
- **Vencimiento** (P-48): lo hace la tarea diaria del backend (00:05); el frontend solo muestra el estado y los días que responde.
- **D-02** (pasa a la Fase 6): todos los campos de respuesta siguen siendo opcionales en TypeScript.
