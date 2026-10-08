# Plan de la Fase 2 — Compras, inventario, costo y carga inicial (italarm-web)

> Estado: **aprobado por ITALARM el 08/10/2026** con la propuesta de W-06; W-07 y W-08 rechazadas (ver sección 8). **Implementado el 08/10/2026.** Falta la CI en GitHub y el despliegue (F6-02).
> Base: `docs/requerimientos.md` (3.4, 3.6, 3.7, 3.8, 3.9, 3.18 y 12.4), `italarm-api/docs/preguntas.md` (P-19 a P-26), `italarm-api/docs/guia-frontend.md` (§9 a §13), `italarm-api/docs/plan-fase-2.md`, el prototipo (pantallas Inventario, Producto · Kárdex y Nueva compra) y el contrato `contrato/openapi.json` (rama de trabajo de italarm-api @ `26aa62c`, con D-05 corregido).
> Alcance: solo **italarm-web**. El backend de esta fase ya está terminado; no se necesitan endpoints nuevos.

## 1. Objetivo y entregable

Que ITALARM cargue su inventario real, registre compras y vea cómo cambia el costo en USD, con stock, seriales y kárdex que cuadren siempre (12.4).

Entregable: el inventario valorizado, el detalle de cada producto con su kárdex, seriales e historial de costo, el registro de compras con vista previa del costo y seriales, el listado y la anulación de compras, los ajustes de inventario y la carga inicial desde Excel.

## 2. Qué queda fuera de esta fase

- **Exportar a Excel** (RF-50): Fase 6, como en el backend. El botón no se muestra hasta entonces.
- **Costo con la tasa de hoy y la de la última compra** (RF-69): se muestra al vender, instalar y cotizar (fases 3 a 5).
- **Ventas e instalaciones**: en el kárdex y en el historial de un serial se ven con su consecutivo, pero sin enlace hasta las fases 3 y 4.
- **Pendientes F6-01 a F6-05**: siguen en la Fase 6.

## 3. Tareas

### T1. Utilidades comunes — `feat:`

- **Idempotency-Key** (RT-07, BF-10, guía §9): un hook genera la clave con `crypto.randomUUID()` al abrir el formulario y la conserva mientras esté abierto. Se envía en la cabecera al crear compras, ajustes y la carga inicial. Después de guardar, el siguiente documento recibe una clave nueva.
- **Cantidades decimales sin `number`** (`lib/decimal.ts`): suma, resta y comparación de textos decimales con enteros grandes (`BigInt`). Solo para vistas previas del frontend (el nuevo stock de un ajuste, contar seriales); los valores oficiales los da el backend (BF-06).
- **Captura de seriales** (RF-20, RF-43, BF-14), un componente para compras y ajustes de entrada:
  - una casilla por unidad (cantidad = número de casillas), que se llena con el teclado (W-07: no se usa lector de códigos);
  - botón **Escanear** con la cámara del celular, usando `@zxing/browser` (BF-14);
  - los seriales se guardan sin espacios y en mayúsculas (P-22); los repetidos se marcan antes de enviar;
  - indicador "Seriales · 3 de 5" y "Completos", como el prototipo.
- **Selector de seriales en bodega** (RF-59): lista con casillas de los seriales `EN_BODEGA` del producto (`GET /inventario/productos/{id}/seriales?estado=EN_BODEGA`), para los ajustes de salida.
- **Selector de producto** con búsqueda por código o nombre (`GET /productos?activo=true&buscar=`), para las líneas de compra.
- **Descarga de archivos con sesión**: la plantilla de Excel se pide con el token y se guarda con el nombre que da el backend.
- **Documento → enlace**: `documento: { tipo, id, consecutivo }` lleva a su detalle: COMPRA → `/compras/:id`, AJUSTE → `/inventario/ajustes/:id`, INVENTARIO_INICIAL → la carga inicial. VENTA e INSTALACION, sin enlace hasta su fase.

### T2. Inventario valorizado (RF-49 a RF-52) — `feat:`

La pantalla `/inventario` pasa a usar `GET /inventario`:

- **Encabezado**: cantidad de productos y valor total en USD, COP y VES (RF-49). Si falta una tasa, el equivalente dice "—" y se muestran los `avisos`.
- **Botones**: Registrar compra y Nuevo producto (RF-50; Excel en la Fase 6).
- **Filtros**: categoría, estado y buscador por nombre, código, marca **o serial** (RF-51).
- **Cada producto** (RF-52): nombre, código, categoría, marca, stock con su unidad, etiqueta **Bajo**, costo actual en USD y valor en bodega en las tres monedas. Lleva al detalle.
- **Indicador del menú** (RF-02): pasa a la Fase 6, con el endpoint de Inicio (W-08, F6-06).

### T3. Detalle del producto (RF-53 a RF-57) — `feat:`

`/inventario/productos/:id`, según la pantalla Producto · Kárdex del prototipo:

- **Datos**: código, categoría, nombre, marca, modelo y unidad, con los botones **Editar** (formulario de la Fase 1) y **Ajustar inventario** (RF-53).
- **Indicadores** en las tres monedas: stock y mínimo, costo actual, valor en bodega, precio instalador y precio cliente final (RF-54).
- **Seriales** (RF-55): resumen por estado (en bodega, vendidos, instalados, dados de baja, anulados) y la lista con su estado y documento ("Vendido · V-0318"). Cada serial lleva a su historial.
- **Kárdex** (RF-56): fecha, movimiento (con el motivo en los ajustes), documento con enlace, entrada, salida, saldo y usuario. Paginado, el más reciente primero.
- **Historial de costo** (RF-57): fecha, compra que lo originó, moneda y tasa de la factura, costo anterior, costo nuevo y regla (sube, promedio, sin stock, ajuste, inventario inicial).

### T4. Seriales (RF-22, RF-24) — `feat:`

- **Buscar un serial desde cualquier pantalla** (RF-24, W-06): botón de lupa en la barra superior del celular y en el menú lateral del computador. Abre un diálogo con el campo, el botón **Escanear** y los resultados; cada resultado lleva al historial del serial.
- **Historial del serial** (`/seriales/:id`): producto, estado, entrada (proveedor y compra), salidas, vencimiento de la garantía (desde la Fase 3) y reclamos (desde la Fase 4).

### T5. Compras (RF-39 a RF-48) — `feat:`

- **Listado** (`/compras`, pestaña Compras; RF-46, RF-47):
  - por defecto, el mes en curso; filtros por proveedor, producto, rango de fechas e incluir anuladas;
  - **totales del período** por moneda y en USD, sin las anuladas (RF-73);
  - cada compra: consecutivo, fecha, proveedor, factura, usuario, resumen de productos, total y equivalente en USD, tasa guardada, enlace a la factura adjunta y la marca **Anulada**.
- **Registrar compra** (`/compras/nueva`; RF-39 a RF-45), en las dos secciones del prototipo:
  - **Encabezado** (RF-05): fecha, usuario y "el consecutivo se asigna al guardar". La API no da el consecutivo antes de guardar.
  - **01 · Proveedor y factura**:
    - proveedor ("Suele facturar en COP") y moneda de la factura, que se propone según el proveedor y se puede cambiar (RF-40);
    - número de factura;
    - fecha de la factura: hoy por defecto, puede ser anterior y nunca futura (P-19).
  - **02 · Productos comprados**:
    - una línea por producto (P-20), con cantidad (decimales según la unidad, P-09), costo unitario en la moneda de la factura (mayor que 0, P-21) y seriales si el producto los controla (RF-43);
    - **vista previa en vivo** (`POST /compras/vista-previa`, RF-41, RF-42): por línea, "Costo US$ 20,00 → US$ 19,50 · promedio", stock actual y subtotal en las tres monedas; además, el total, las tasas que se usarán (TRM y bolívar con su fecha) y los `avisos` (por ejemplo, que la tasa no es de la fecha de la factura). Se pide cada vez que cambian las líneas, con una espera de 400 ms, y se muestra tal cual (BF-06).
  - **Factura adjunta** (RF-44): foto o PDF, hasta 5 MB. En el celular se puede tomar la foto directamente. Las fotos se comprimen (BF-14); el PDF se sube tal cual. Se sube justo después de guardar la compra. Si esa subida falla, la compra ya quedó guardada y el detalle permite reintentar.
  - **Guardar y sumar al inventario** (RF-45):
    - bloqueado mientras falten seriales o no coincidan con la cantidad (**CP-13**);
    - deshabilitado mientras guarda, con `Idempotency-Key` (BF-10);
    - texto: "Una vez guardada no se edita: se anula y se registra de nuevo".
  - **Errores**: van junto a la línea y al campo que corresponden (`COMPRA_FECHA_FUTURA`, `COMPRA_PRODUCTO_REPETIDO`, `COMPRA_COSTO_INVALIDO`, `SERIALES_NO_COINCIDEN`, `SERIAL_INVALIDO`, `SERIAL_DUPLICADO`, `PRODUCTO_INACTIVO`), y como aviso general `TASA_NO_DISPONIBLE`.
  - **Al guardar**: aviso "Compra C-0001 registrada" y paso al detalle.
- **Detalle** (`/compras/:id`; RF-48):
  - proveedor, factura, fecha, moneda, tasas guardadas, usuario y hora;
  - líneas con cantidad, costo unitario, subtotal, cambio de costo y regla, y seriales;
  - total y equivalente en USD;
  - factura adjunta: ver, reemplazar y quitar (dato descriptivo, RF-70).
- **Anular** (RF-71, RF-73):
  - si `anulable`, el botón pide el motivo y confirma (**CP-16**);
  - si no, el botón queda deshabilitado con `motivoNoAnulable` al lado y la indicación de corregir con un ajuste (**CP-17**);
  - una compra anulada muestra motivo, usuario y fecha, y sigue visible.
- **Historial del proveedor** (RF-38): en el formulario del proveedor, el enlace "Ver compras" lleva al listado filtrado por ese proveedor.

### T6. Ajustes de inventario (RF-58 a RF-62) — `feat:`

- **Registrar** desde el detalle del producto (`/inventario/productos/:id/ajuste`):
  - **tipo**: Entrada o Salida (selector segmentado) y cantidad positiva. Se envía con signo: positiva es entrada y negativa salida (guía §11);
  - **motivo**: Pérdida, Daño, Conteo físico, Garantía u Otro, que exige descripción;
  - **vista previa del nuevo stock**: "Stock 10 und → 12 und" (RF-58). La salida no puede pasar del stock: el botón se bloquea y se muestra "Stock insuficiente · quedan N und" (RF-62, RF-65);
  - **entrada en un producto sin costo**: pide el costo unitario en USD (P-25). En los demás casos explica que entra al costo vigente y no lo cambia (RF-61, **CP-19**);
  - **seriales** (RF-59): en una entrada, los nuevos (captura de T1); en una salida, se eligen los que están en bodega y la cantidad es la de los elegidos;
  - con `Idempotency-Key`; los errores `STOCK_INSUFICIENTE`, `SERIAL_NO_DISPONIBLE` y `COSTO_REQUERIDO` van en su campo.
- **Detalle** (`/inventario/ajustes/:id`): consecutivo AJ-001, producto, motivo, cantidad, costo, valor, seriales, usuario y fecha. Los ajustes no se editan ni se anulan; un error se corrige con otro ajuste en sentido contrario (P-24), y la pantalla lo dice.
- **Listado** (`/inventario/ajustes`): filtros por producto y fechas. Se llega desde el inventario.

### T7. Carga inicial desde Excel (3.18, RF-149 a RF-152) — `feat:`

En Configuración, nueva pestaña **Carga inicial** (`/configuracion?pestana=carga`); el inventario vacío también la enlaza:

1. **Descargar plantilla** (RF-149).
2. **Subir el archivo** (`.xlsx`, máximo 5 MB) y **validar** sin guardar (RF-150):
   - si hay errores, se muestran **agrupados por hoja, con el número de fila de Excel** (**CP-29**), y no se puede confirmar;
   - si es válido, se muestra el resumen: productos, clientes, proveedores, productos con stock y valor en USD.
3. **Confirmar la carga** con el mismo archivo y `Idempotency-Key` (RF-151). Responde con el documento II-001 (**CP-28**). Si mientras tanto apareció un error (`CARGA_INICIAL_CON_ERRORES`), se muestran los errores y no se guarda nada.
4. **Cargas realizadas**: consecutivo, fecha, usuario, archivo y totales.

### T8. Pruebas y documentación — `test:` / `docs:`

Pruebas de la sección 6, contrato y tipos al día, CHANGELOG, CLAUDE.md y lista para ITALARM.

## 4. Pantallas y rutas

| Ruta                                                           | Pantalla                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `/inventario`                                                  | Inventario valorizado                                                    |
| `/inventario/productos/:id`                                    | Detalle del producto: indicadores, seriales, kárdex e historial de costo |
| `/inventario/productos/:id/ajuste`                             | Registrar ajuste                                                         |
| `/inventario/ajustes`, `/inventario/ajustes/:id`               | Listado y detalle de ajustes                                             |
| `/seriales/:id`                                                | Historial de un serial                                                   |
| `/compras` (pestaña Compras), `/compras/nueva`, `/compras/:id` | Compras                                                                  |
| `/configuracion?pestana=carga`                                 | Carga inicial                                                            |

Los productos siguen editándose en `/inventario/productos/:id/editar` (Fase 1). En el listado, cada producto ahora lleva a su detalle.

## 5. Endpoints que usa esta fase

Todos existen en el contrato.

| Tema          | Endpoints                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Inventario    | `GET /inventario`, `GET /inventario/productos/{id}`, `…/{id}/kardex`, `…/{id}/historial-costo`, `…/{id}/seriales?estado=`               |
| Seriales      | `GET /seriales?numero=`, `GET /seriales/{id}`                                                                                           |
| Compras       | `GET/POST /compras`, `POST /compras/vista-previa`, `GET /compras/{id}`, `POST /compras/{id}/anular`, `PUT/DELETE /compras/{id}/factura` |
| Ajustes       | `GET/POST /ajustes`, `GET /ajustes/{id}`                                                                                                |
| Carga inicial | `GET /carga-inicial/plantilla`, `POST /carga-inicial/validar`, `POST /carga-inicial`, `GET /carga-inicial`                              |

## 6. Pruebas

**Componentes** (Vitest + Testing Library + MSW tipado con el contrato):

- **Compras:**
  - **CP-13**: 3 cámaras con 2 seriales → no se puede guardar;
  - seriales repetidos y en minúsculas;
  - moneda propuesta por el proveedor (RF-40);
  - fecha futura rechazada (P-19);
  - vista previa con su regla y sus avisos;
  - `Idempotency-Key` igual en un reintento y distinta en la siguiente compra;
  - botón deshabilitado mientras guarda;
  - errores por línea;
  - factura PDF e imagen.
- **Anulación**: **CP-16**, anulable con motivo; **CP-17**, no anulable con su motivo y el botón deshabilitado.
- **Ajustes:**
  - **CP-19**: entrada de 2 al costo vigente, que no cambia;
  - salida mayor al stock bloqueada (RF-62);
  - entrada sin costo previo pide el costo en USD (P-25);
  - seriales de salida elegidos entre los que están en bodega;
  - Otro exige descripción.
- **Inventario y detalle**: valor total en tres monedas con avisos; búsqueda por serial; kárdex con enlaces; historial de costo con su regla; seriales por estado.
- **Carga inicial**: **CP-29**, error en la hoja de inventario, fila 8, sin poder confirmar; **CP-28**, carga válida → II-001; `CARGA_INICIAL_CON_ERRORES` al confirmar.
- **Utilidades**: aritmética decimal y captura de seriales (teclado, mayúsculas, repetidos).

**Extremo a extremo** (Playwright, celular y computador, con la API simulada):

- registrar una compra con seriales y ver el costo y el kárdex;
- ajuste de salida eligiendo un serial;
- carga inicial con un error por fila y luego válida.

**Contra el backend real en local**, como en las fases 0 y 1, con los casos CP-01 a CP-07 (costo) recorridos desde la pantalla.

## 7. Definición de terminado (12.1)

- [ ] Pull Request con la CI en verde.
- [x] Pruebas de la sección 6 escritas y pasando, incluidos CP-13, CP-16, CP-17, CP-19, CP-28 y CP-29: 223 de componentes (cobertura 93,9 % de líneas) y 9 escenarios extremo a extremo, cada uno en celular y computador. Además, el recorrido completo (CP-01 a CP-07, CP-13, CP-16, CP-17, CP-19, CP-28 y CP-29) se probó en el navegador contra el backend real de `dev` en local.
- [x] Cliente generado desde el contrato vigente (`dev` @ `26aa62c`).
- [ ] Desplegado en pruebas. _(Pasa a la Fase 6: F6-02.)_
- [x] `CHANGELOG.md` actualizado y lista para ITALARM:
  1. Descargar la plantilla, llenarla con el inventario real y cargarla (primero con un error a propósito, para ver el mensaje por fila).
  2. Revisar el inventario valorizado y el detalle de un producto: kárdex con II-001 y seriales en bodega.
  3. Registrar una compra en COP de un producto con serial, revisar la vista previa del costo y la regla, adjuntar la foto de la factura y guardar.
  4. Ver cómo cambiaron el costo, el kárdex y el historial de costo.
  5. Intentar anular una compra que no es la última (debe explicar por qué) y anular la última.
  6. Hacer un ajuste de salida eligiendo un serial y uno de entrada por conteo físico.
  7. Buscar un serial y ver su historial.

## 8. Preguntas para ITALARM

| #    | Tema                                                | Pregunta                                                                                                                 | Propuesta                                                                                                                                                                                                                                                                               | Respuesta de ITALARM                                                               |
| ---- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| W-06 | Buscar un serial "desde cualquier pantalla" (RF-24) | ¿Dónde va el buscador de seriales?                                                                                       | Un botón de lupa en la barra superior del celular y en el menú lateral del computador. Abre un diálogo con un campo (también con **Escanear**) y los resultados. Cada resultado lleva al historial del serial. Además, el buscador del inventario también encuentra por serial (RF-51). | De acuerdo con la propuesta.                                                       |
| W-07 | Lector de códigos de barras                         | ¿Usan o piensan usar un lector de códigos USB o Bluetooth en el computador?                                              | Funciona sin configurar nada: el lector escribe el serial y envía Enter, que salta a la casilla siguiente. En el celular se usa la cámara con **Escanear**.                                                                                                                             | Rechazada: no se usa lector. Los seriales se escriben o se escanean con la cámara. |
| W-08 | Indicador "bajo mínimo" en el menú (RF-02)          | No hay un endpoint que cuente los productos bajo el mínimo. ¿Lo mostramos ya o esperamos el endpoint de Inicio (Fase 6)? | Mostrarlo ya: se cuentan con `GET /inventario` (productos activos, hasta 100 por consulta, actualizado cada 5 minutos y al guardar compras o ajustes). Con más de 100 productos se mostraría "100+". En la Fase 6 se cambia al endpoint de Inicio.                                      | Rechazada: el indicador espera el endpoint de Inicio (Fase 6, F6-06).              |

**Decisiones de diseño (no requieren respuesta salvo que no estés de acuerdo):**

- La carga inicial va en **Configuración** (pestaña Carga inicial), porque se usa una vez al empezar. El inventario vacío la enlaza.
- El ajuste se registra con **Entrada / Salida** y una cantidad positiva, en lugar de pedir un número negativo.
- La factura se sube **después** de guardar la compra, porque el endpoint necesita el `id`.

## 9. Riesgos y dependencias

- **D-05 resuelto** y ya en `dev` de los dos repositorios (08/10/2026): los esquemas de líneas y totales de compras tienen nombre propio.
- **D-02** (pasa a la Fase 6): todos los campos de respuesta siguen siendo opcionales en TypeScript.
- **Cámara**: `@zxing/browser` necesita permiso de cámara y HTTPS. En local funciona en `localhost`; en el celular, con el ambiente de pruebas (F6-02). Si no hay cámara o se niega el permiso, la captura sigue por teclado.
- **Tasas faltantes**: una compra en COP o VES sin ninguna tasa responde `TASA_NO_DISPONIBLE`. La pantalla lo explica y ofrece registrar la tasa (diálogo de la Fase 1).
