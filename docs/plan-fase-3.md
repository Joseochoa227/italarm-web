# Plan de la Fase 3 — Ventas, comprobantes y anulaciones (italarm-web)

> Estado: **aprobado por ITALARM el 08/10/2026** con la propuesta de W-09. **Implementado el 08/10/2026.** Falta la CI en GitHub y el despliegue (F6-02).
> Base: `docs/requerimientos.md` (3.9, 3.12, 3.14, 3.15 y 12.5), `italarm-api/docs/preguntas.md` (P-27 a P-36), `italarm-api/docs/guia-frontend.md` (§4, §9 y §14), el prototipo `docs/Italarm v2.html` (pantallas Nueva venta y Documentos) y el contrato `contrato/openapi.json` (`dev` @ `26aa62c`).
> Alcance: solo **italarm-web**. El backend de esta fase ya está terminado; no se necesitan endpoints nuevos.

## 1. Objetivo y entregable

Que ITALARM venda material con el precio del tipo de cliente, controlando stock y seriales, y envíe el comprobante por WhatsApp (12.5).

Entregable: el formulario de nueva venta con vista previa (precio, costo con las tasas de hoy y de la última compra, disponibilidad, descuento, total y utilidad), la pantalla de confirmación con **Enviar por WhatsApp** y **Descargar PDF**, el listado y el detalle de ventas, y la anulación.

## 2. Qué queda fuera de esta fase

- **Venta desde una cotización** (`cotizacionId`, RF-93 a RF-96): Fase 5. El formulario queda listo para recibirla.
- **Consulta de garantías y reclamos** (RF-123 a RF-125): Fase 4. En esta fase, el vencimiento de la garantía se ve en el detalle de la venta y en el historial del serial.
- **Exportar a Excel**: Fase 6.
- **Pendientes F6-01 a F6-06**: siguen en la Fase 6.

**Diferencia con el prototipo:** el prototipo deja elegir "Precio aplicado: Instalador / Cliente final" en la venta. RF-78 y RN-01 dicen que el precio lo decide el tipo de cliente y que se cambia a mano **en cada línea**; el contrato tampoco tiene ese campo. Se sigue el documento de requerimientos (AG-01): se muestra el precio que se aplicará, sin selector.

## 3. Tareas

### T1. Utilidades comunes — `feat:`

- **Selector de cliente** con búsqueda (`GET /clientes?buscar=`), que muestra el tipo y el texto del precio que se aplicará ("Se le aplicará el precio instalador"). Lo usarán también instalaciones y cotizaciones.
- **Crear un cliente sin salir del formulario** (RF-79): botón **Nuevo cliente** que abre el formulario de la Fase 1 en un diálogo; al guardar, queda elegido.
- **Seriales que salen** (RF-21, RF-22): chips con los seriales `EN_BODEGA` del producto, que se marcan y desmarcan como en el prototipo. Además, **Escanear** con la cámara marca el serial leído si está en bodega; si no, lo dice ("SN-123 no está en bodega"). Solo se ofrecen los que están en bodega (**CP-14**).
- **Comprobantes**:
  - **Descargar PDF** con la sesión (`GET /ventas/{id}/comprobante`), con el nombre que da el backend.
  - **Enviar por WhatsApp** (RF-134, guía §14):
    - en el celular, descarga el PDF y abre el compartir del sistema con el archivo adjunto (`navigator.share`);
    - en el computador, o si el navegador no permite compartir archivos, pide el enlace (`POST /ventas/{id}/enlace`) y abre `whatsappUrl` (número del cliente y mensaje con el enlace, válido 30 días, P-33).
  - Si el cliente no tiene teléfono, `whatsappUrl` abre WhatsApp sin destinatario para elegirlo.
- **Documento → enlace**: VENTA ahora lleva a `/ventas/:id` (kárdex, historial del serial e historial del cliente).

### T2. Nueva venta (RF-97 a RF-103) — `feat:`

`/ventas/nueva`, en las dos secciones del prototipo y un resumen al lado (abajo en el celular):

- **Encabezado** (RF-05): fecha de hoy (la venta siempre es de hoy, P-27), usuario, "de contado" y "el consecutivo se asigna al guardar".
- **01 · Cliente y moneda** (RF-98):
  - cliente (selector de T1, o el que llega de la pantalla del cliente con `?clienteId=`), con su tipo y el precio que se aplicará;
  - moneda de la venta (USD, COP, VES) y las tasas del día que quedarán guardadas.
- **02 · Productos** (RF-99):
  - agregar productos con el selector de la Fase 2 (una línea por producto);
  - cada línea muestra, según la vista previa del backend:
    - precio sugerido por unidad y la cantidad disponible ("hay 24 und");
    - costo en USD con su equivalente a las tasas de hoy y a las de la última compra (RF-69, P-32; si el producto nunca se compró, solo el de hoy);
    - subtotal en la moneda de la venta y su equivalente en las otras;
  - **cantidad**: en los productos con serial, la da el número de seriales marcados; en los demás, se escribe (decimales según la unidad, P-09);
  - **precio unitario**: se propone el sugerido y se puede cambiar, incluso a 0 o por debajo del costo (P-29); en ese caso se muestra el `avisoPrecio`, sin bloquear;
  - si cambia la moneda, los precios escritos a mano vuelven al sugerido en la nueva moneda (con un aviso), para no vender en pesos un precio pensado en dólares;
  - **stock insuficiente** (RF-101): el aviso de la línea ("Stock insuficiente · quedan 3 und") y el botón Guardar bloqueado mientras `puedeGuardar` sea `false`.
- **Resumen** (RF-100): subtotal, descuento (**Sin descuento**, **%** o **Valor**, P-30), total de contado en las tres monedas, costo del material y utilidad en valor y porcentaje. Todo viene de la vista previa (`POST /ventas/vista-previa`, 400 ms después del último cambio, BF-06), como en compras.
- **Comprobante**: "Mostrar el total también en" COP / VES / USD (por defecto, solo la moneda de la venta, P-34) y observaciones.
- **Guardar venta** con `Idempotency-Key`. Errores en su campo o línea cuando el backend lo indica (`DESCUENTO_INVALIDO` → descuento, `PRECIO_INVALIDO`, `SERIAL_NO_DISPONIBLE`, `STOCK_INSUFICIENTE`); los demás, como aviso general.

### T3. Confirmación (RF-104) — `feat:`

Al guardar, el resumen se reemplaza por la confirmación del prototipo: "Venta V-0001 registrada", cliente y total, y los botones **Enviar comprobante por WhatsApp**, **Descargar PDF**, **Ver la venta** y **Registrar otra venta** (formulario vacío con una clave de idempotencia nueva).

### T4. Ventas: listado, detalle y anulación (RF-105, RF-106, RF-72, RF-73) — `feat:`

- **Listado** (`/ventas`): por defecto el mes en curso; filtros por cliente, producto, fechas e incluir anuladas; totales del período por moneda, en USD y la utilidad, sin las anuladas. Cada venta: consecutivo, fecha, cliente, productos, usuario, total, utilidad y la marca **Anulada**. Botón **Nueva venta**. Cómo se llega: ver **W-09**.
- **Detalle** (`/ventas/:id`):
  - cliente (los datos guardados al vender, P-35), fecha, moneda, tasas, usuario y hora;
  - líneas con precio sugerido y precio cobrado, cantidad, subtotal y costo en USD guardado (RF-68); los seriales con su **garantía hasta** (RF-103, **CP-25**);
  - resumen con descuento, total en las tres monedas, costo y utilidad tal como quedaron guardados (**CP-08**, **CP-27**);
  - botones **Enviar por WhatsApp** y **Descargar PDF** (también en las anuladas, que salen con la marca "ANULADA");
  - **editar** observaciones y monedas del comprobante (lo único editable, RF-70), con control de versión.
- **Anular** (P-31): pide el motivo y confirma; la venta queda visible como anulada con motivo, usuario y fecha, y el material y los seriales vuelven a bodega (**CP-18**).

## 4. Pantallas y rutas

| Ruta            | Pantalla                                               |
| --------------- | ------------------------------------------------------ |
| `/ventas/nueva` | Nueva venta (reemplaza la página "llega en la Fase 3") |
| `/ventas`       | Listado de ventas                                      |
| `/ventas/:id`   | Detalle de la venta                                    |

## 5. Endpoints que usa esta fase

Todos existen en el contrato.

| Tema         | Endpoints                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Ventas       | `GET/POST /ventas`, `POST /ventas/vista-previa`, `GET/PUT /ventas/{id}`, `POST /ventas/{id}/anular`                                    |
| Comprobantes | `GET /ventas/{id}/comprobante`, `POST /ventas/{id}/enlace` (el enlace público `GET /comprobantes/{token}` lo sirve el backend)         |
| Apoyo        | `GET /clientes`, `POST /clientes`, `GET /productos`, `GET /inventario/productos/{id}/seriales?estado=EN_BODEGA`, `GET /tasas/vigentes` |

## 6. Pruebas

**Componentes** (Vitest + Testing Library + MSW tipado con el contrato):

- **Venta:**
  - cliente elegido con el texto del precio; cliente creado desde el formulario (RF-79);
  - vista previa con disponible, costo hoy y a tasa de compra, subtotal y resumen tal como responde el backend;
  - **venta sin stock rechazada**: `puedeGuardar: false` → aviso en la línea y Guardar bloqueado;
  - **CP-14**: solo se ofrecen los seriales en bodega; escanear un serial que no está en bodega lo avisa;
  - **CP-27**: descuento de US$7 sobre US$100 → total y utilidad del backend (US$93);
  - precio cambiado por debajo del costo: aviso sin bloquear (P-29);
  - cambio de moneda: los precios a mano vuelven al sugerido;
  - `Idempotency-Key` igual en un reintento; errores en su campo.
- **Confirmación**: Descargar PDF; WhatsApp con compartir nativo (simulado) y con enlace en el computador; Registrar otra venta con clave nueva.
- **Detalle**: **CP-25** (garantía por serial), **CP-08** (la utilidad guardada no se recalcula), edición de observaciones con conflicto de versión, anulación con motivo (**CP-18**).
- **Listado**: totales, filtros en la URL y anuladas marcadas.

**Extremo a extremo** (Playwright, celular y computador, con la API simulada):

- vender una cámara con serial y un cable por metro, con descuento, y ver la confirmación;
- intentar vender más de lo disponible (bloqueado);
- anular la venta y ver el serial de nuevo en bodega.

**Contra el backend real en local**, como en las fases anteriores: CP-08, CP-14, CP-18, CP-25, CP-27 y la venta sin stock, recorridos desde la pantalla, más el PDF descargado y el enlace público.

## 7. Definición de terminado (12.1)

- [ ] Pull Request con la CI en verde.
- [x] Pruebas de la sección 6 escritas y pasando, incluidos CP-08, CP-14, CP-18, CP-25, CP-27 y la venta sin stock: 238 de componentes (cobertura 93,4 % de líneas) y 11 escenarios extremo a extremo, cada uno en celular y computador. Además, el recorrido se probó contra el backend real de `dev` en local, incluidos el PDF descargado, el mensaje de WhatsApp y el enlace público sin sesión.
- [x] Cliente generado desde el contrato vigente (`dev` @ `26aa62c`).
- [ ] Desplegado en pruebas. _(Pasa a la Fase 6: F6-02.)_
- [x] `CHANGELOG.md` actualizado y lista para ITALARM:
  1. Registrar una venta a un instalador en COP con una cámara con serial y cable por metro; revisar el precio sugerido, el costo a la tasa de hoy y a la de compra, y la utilidad.
  2. Aplicar un descuento y ver cómo cambian el total y la utilidad.
  3. Intentar vender más de lo que hay (no deja guardar).
  4. Enviar el comprobante por WhatsApp desde el celular y desde el computador, y descargar el PDF.
  5. Ver la venta en el listado, en el historial del cliente, en el kárdex y en el historial del serial (con su garantía).
  6. Anular la venta y comprobar que el serial vuelve a bodega.

## 8. Preguntas para ITALARM

| #    | Tema                    | Pregunta                                                                                                              | Propuesta                                                                                                                                                                                                                                                                                                                    | Respuesta de ITALARM         |
| ---- | ----------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| W-09 | Dónde se ven las ventas | El menú (RF-01, RF-03) tiene **Nueva venta**, pero no un listado de ventas (RF-105). ¿Desde dónde se abre el listado? | Sin cambiar el menú: en **Nueva venta**, un enlace **Ver ventas** en el encabezado; en el listado, el botón **Nueva venta**. También se llega desde el historial del cliente, el kárdex y el historial de un serial. Lo mismo valdrá para las instalaciones (Fase 4). El acceso desde Inicio se revisa en la Fase 6 (F6-01). | De acuerdo con la propuesta. |

## 9. Riesgos y dependencias

- **Compartir archivos** (`navigator.share` con archivos) solo funciona con HTTPS. En local se prueba en `localhost`; en el celular, con el ambiente de pruebas (F6-02). Mientras tanto, el enlace funciona en todos.
- **Enlace público del comprobante**: lo arma el backend con `ITALARM_URL_PUBLICA`; en el hosting debe ser la URL pública de la API (P-04).
- **Tasas faltantes**: una venta en COP o VES sin tasa responde `TASA_NO_DISPONIBLE`. La pantalla lo explica y ofrece registrar la tasa (diálogo de la Fase 1).
- **D-02** (pasa a la Fase 6): todos los campos de respuesta siguen siendo opcionales en TypeScript.
