# Plan de la Fase 1 — Catálogo, terceros, tasas y configuración (italarm-web)

> Estado: **aprobado por ITALARM el 06/10/2026**, con las propuestas de W-04 y W-05. En implementación.
> Base: `docs/requerimientos.md` (3.3, 3.5, 3.6 —proveedores—, 3.10, 3.17 y 12.3), `italarm-api/docs/preguntas.md` (P-09 a P-18), `italarm-api/docs/guia-frontend.md` (§3 a §8), `italarm-api/docs/plan-fase-1.md` (endpoints ya terminados), el prototipo `docs/Italarm v2.html` (pantallas Inventario, Clientes, Cliente · detalle y Tasas de cambio) y el contrato `contrato/openapi.json` (`dev` @ `4977fa0`).
> Alcance: solo **italarm-web**. El backend de esta fase ya está terminado; no se necesitan endpoints nuevos.

## 1. Objetivo y entregable

Registrar la información maestra desde la app y tener las tasas del día visibles en todo el sistema.

Entregable (12.3): el catálogo de productos, los clientes y los proveedores se cargan desde la app; las tasas del día se ven en el menú y en la barra del celular; la tasa del bolívar se registra con doble digitación y alerta de variación; y la configuración, las categorías, las unidades y los usuarios se administran desde el menú del usuario.

## 2. Qué queda fuera de esta fase

- **Stock, costo, kárdex, seriales, compras y ajustes:** Fase 2. En esta fase el producto se muestra con su stock y costo de solo lectura, tal como los entrega la API.
- **Indicador de productos bajo mínimo en el menú (RF-02):** Fase 2, con el inventario.
- **Crear un cliente desde los formularios de venta, instalación y cotización (RF-79):** se hace en la Fase 3. El formulario de cliente de esta fase se construye reutilizable para poder abrirlo en un diálogo.
- **Historial de compras del proveedor (RF-38):** Fase 2, con las compras.
- **Pendientes F6-01 a F6-05** de la Fase 0: siguen en la Fase 6.

## 3. Tareas

### T1. Utilidades comunes — `feat:`

- **Entrada de decimales** (`lib/decimal.ts`): convierte lo que escribe el usuario al texto decimal de la API, sin pasar por `number` (RT-06). Ver la pregunta W-04 para el separador decimal. La conversión de vuelta (texto de la API → campo editable) usa la misma regla.
- **Cantidades según la unidad** (P-09): sin decimales si `admiteDecimales` es falso; hasta 2 si es verdadero.
- **Componentes nuevos** en `components/ui/`:
  - Selector nativo (`<select>`) con el estilo de los campos: accesible y cómodo en el celular.
  - Área de texto, casilla de verificación y selector segmentado (`.seg` del prototipo).
  - Buscador con espera de 300 ms antes de consultar.
  - Paginación ("Anterior · Página 2 de 5 · Siguiente").
  - Lista de filas que se adapta: tabla en computador y tarjetas en celular, como el prototipo.
  - Diálogo de confirmación para acciones destructivas.
  - Selector de imagen con vista previa.
- **Filtros en la URL** (`?buscar=…&categoriaId=…&page=…`): el botón Atrás conserva la búsqueda y la página.
- **Compresión de imágenes** (BF-14, `lib/imagen.ts`): reduce la imagen a 1600 px y la convierte a WebP. Si el navegador no puede generar WebP (Safari), usa JPEG para fotos y PNG para el logo. Rechaza en el navegador lo que no sea JPEG, PNG o WebP, o lo que pese más de 5 MB después de comprimir (P-16).
- **Subida de archivos** con `multipart/form-data` y el campo `archivo` (guía §6). Los enlaces firmados (`fotoUrl`, `logoUrl`) se usan directo en `<img>` y no se guardan: vencen en 15 minutos.
- **Edición con control de versión** (BP-12, guía §5): al recibir `MODIFICADO_POR_OTRO_USUARIO`, se recarga el registro, el formulario muestra los datos actuales y aparece el aviso "Otro usuario modificó este registro. Se cargaron los datos actuales: revisa y vuelve a guardar."

### T2. Productos (3.3, RF-14 a RF-18) — `feat:`

Siguen la pantalla Inventario del prototipo. En la Fase 2, esa misma pantalla suma el valor en bodega, el kárdex y los seriales.

- **Listado** (`/inventario`):
  - Cada fila muestra ícono o foto, nombre, código, categoría, si controla serial, stock con su abreviatura, la etiqueta **Bajo** si `bajoMinimo`, precio instalador, precio cliente final y la etiqueta **Inactivo** si corresponde.
  - Filtros: categoría (chips, como el prototipo), Activos / Inactivos / Todos y buscador por nombre, código o marca.
  - Paginado y ordenado por nombre.
  - Botón **Nuevo producto**.
- **Formulario** (`/inventario/productos/nuevo` y `/inventario/productos/:id/editar`):
  - Campos de 3.3: código, nombre, marca, modelo, categoría, unidad de medida, controla serial, moneda del precio (USD por defecto), precio instalador, precio cliente final, stock mínimo (con los decimales que admita la unidad) y descripción.
  - Foto: subir, reemplazar y quitar. Solo después de crear el producto, porque necesita su `id`.
  - El stock y el costo actual se muestran de solo lectura (RF-16).
  - Si el producto ya tiene movimientos, la unidad y "controla serial" quedan bloqueadas con su explicación (P-17). El backend responde `PRODUCTO_CAMBIO_NO_PERMITIDO`, que se muestra junto al campo.
  - `PRODUCTO_CODIGO_DUPLICADO` se muestra en el campo Código.
- **Acciones:**
  - Desactivar y activar (RF-14).
  - Eliminar, con confirmación. Si ya tiene movimientos (`PRODUCTO_CON_MOVIMIENTOS`), se explica y se ofrece desactivarlo.

### T3. Clientes (3.10, RF-75 a RF-78) — `feat:`

- **Listado** (`/clientes`), según el prototipo:
  - Encabezado "El tipo de cliente define el precio que se aplica" y botón **Nuevo cliente**.
  - Filtro Todos / Instaladores / Clientes finales y buscador por nombre, documento, teléfono o ciudad.
  - Cada fila: iniciales, nombre, tipo, teléfono · ciudad, cantidad de movimientos y fecha del último (RF-76).
- **Formulario** (`/clientes/nuevo` y `/clientes/:id/editar`):
  - Tipo, nombre o razón social, tipo y número de documento, teléfono/WhatsApp, correo, dirección y ciudad.
  - Al elegir el tipo aparece "Se le aplicará el precio instalador" o "… cliente final" (RF-75).
  - El teléfono acepta el número sin indicativo y el formulario avisa que se asume +57 (P-10). El backend lo normaliza; `TELEFONO_INVALIDO` se muestra en el campo.
  - `CLIENTE_DOCUMENTO_DUPLICADO` se muestra en el campo Documento (P-12).
  - Sin botón de eliminar (P-11).
- **Detalle** (`/clientes/:id`, RF-77), según el prototipo:
  - Tipo, nombre, documento, dirección, correo y ciudad.
  - **WhatsApp**: abre `https://wa.me/<número>`.
  - Botones **Venta**, **Instalación** y **Cotización**, que llevan al formulario con el cliente elegido (`?clienteId=`). Esos formularios siguen pendientes hasta las fases 3 a 5.
  - Precio que se le aplica y cantidad de compras de material e instalaciones.
  - Historial (`GET /clientes/{id}/historial`): consecutivo, tipo, descripción, fecha y usuario, tal como los entrega la API (el contrato no trae valor ni estado en el historial). Estará vacío hasta que existan ventas e instalaciones.

### T4. Proveedores (3.6, RF-37) — `feat:`

- En la pantalla **Compras** (W-01): pestañas **Compras** (sigue pendiente hasta la Fase 2) y **Proveedores**.
- Listado con buscador por nombre, NIT o ciudad. Cada fila: nombre, moneda habitual, NIT, ciudad y teléfono (RF-37).
- Formulario de crear y editar (`/compras/proveedores/nuevo` y `/compras/proveedores/:id/editar`): nombre, NIT, teléfono, correo, ciudad y moneda habitual. Sin botón de eliminar (P-11).

### T5. Tasas de cambio (3.5, RF-29 a RF-36) — `feat:`

- **Recuadro de tasas** (RF-01, RF-03, RF-30), con `GET /tasas/vigentes`, consultado al entrar y cada 5 minutos:
  - Computador: al pie del menú lateral, como el prototipo: "Tasas de hoy · 1 USD", COP y VES, más un ícono de alerta si alguna no es de hoy.
  - Celular: en la barra superior, COP y VES con el ícono de alerta.
  - Al tocarlo se abre la pantalla de tasas.
- **Aviso destacado** (RF-07, RF-33):
  - Muestra el `aviso` de la API con el botón **Registrar tasa del día**, o **Ingresar TRM manual** si `trmAutomaticaFallo`.
  - Si la TRM automática falló, ofrece además **Reintentar consulta** (`POST /tasas/trm/consultar`) y muestra el resultado.
  - Ver la pregunta W-05 sobre en qué pantallas aparece.
- **Pantalla Tasas de cambio** (`/tasas`), según el prototipo:
  - Tarjetas USD/COP · TRM y USD/VES · ingreso manual, cada una con su valor, fuente, fecha y hora, usuario y estado.
  - **Historial diario** (RF-34): una fila por fecha con USD/COP, su origen, USD/VES, su origen y quién lo registró. Por defecto muestra los últimos 30 días y se puede filtrar por rango de fechas. Se arma con `GET /tasas` de cada par sobre el mismo rango.
  - **Corregir** en cada tasa (RF-36, P-14).
  - **Correcciones de tasas**: valor anterior → nuevo, usuario, fecha y motivo (`GET /tasas/{id}`).
- **Diálogo de registro y corrección** (RF-35), el mismo para VES, TRM manual y correcciones:
  1. La tasa se digita dos veces. Si no coinciden: "Los dos valores no coinciden. Digítala de nuevo." y **no se envía nada** (CP-10).
  2. Con las dos iguales, `POST /tasas/vista-previa` muestra la anterior, la nueva y el porcentaje de variación.
  3. Si `superaLimite`, aparece una alerta destacada con una casilla obligatoria: "Confirmo la variación de X %". Sin marcarla no se puede guardar (CP-11).
  4. Guardar envía `aceptarVariacion` y, en una corrección, el `motivo` (opcional).
  5. Respuestas especiales: `TASA_YA_REGISTRADA` ofrece corregir la de hoy; `TRM_AUTOMATICA_DISPONIBLE` explica que la TRM oficial ya llegó.
- Al guardar, se actualizan el recuadro, el aviso y el historial.

### T6. Configuración (3.17, RF-145 a RF-148) — `feat:`

Desde el menú del usuario (W-01), en `/configuracion`, con pestañas:

- **Empresa**: nombre, lema, NIT, ciudad, teléfono y correo, más el logo (subir, reemplazar y quitar).
- **Valores por defecto**:
  - validez de cotización (8, 15 o 30 días);
  - garantía de mano de obra y de equipos (1 a 3 meses);
  - condiciones de garantía y pie de los PDF;
  - límite de variación de tasas (%).
  - Se guardan con `version` (guía §5).
- **Categorías** (RF-15, RF-148): lista con la cantidad de productos, crear, renombrar y eliminar. `CATEGORIA_CON_PRODUCTOS` se explica; `CATEGORIA_DUPLICADA` va en el campo.
- **Unidades de medida** (RF-148, P-09): nombre, abreviatura y "admite decimales"; crear, editar y eliminar. `UNIDAD_EN_USO` se explica; `UNIDAD_DUPLICADA` va en el campo.

### T7. Usuarios (RF-148, RU-04, P-15) — `feat:`

Desde el menú del usuario, en `/usuarios`:

- Lista con nombre, correo y estado (activo o inactivo).
- **Nuevo usuario**: nombre, correo, contraseña y confirmación, con la misma política de la Fase 0 (P-07, P-08).
- **Desactivar** y **activar**: no aparecen para el propio usuario (`NO_PUEDE_DESACTIVARSE_A_SI_MISMO`). Desactivar pide confirmación y explica que se cierran sus sesiones.
- **Restablecer contraseña** de otro usuario, con doble digitación y la política.

### T8. Pruebas y documentación — `test:` / `docs:`

- Pruebas de la sección 6.
- Contrato y tipos al día (`npm run api:sincronizar -- --ref origin/dev`).
- CHANGELOG, CLAUDE.md (decisiones nuevas) y lista para ITALARM.

## 4. Pantallas y rutas nuevas

| Ruta                                                                                            | Pantalla                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------- |
| `/inventario`                                                                                   | Listado de productos (catálogo) |
| `/inventario/productos/nuevo`, `/inventario/productos/:id/editar`                               | Formulario de producto          |
| `/clientes`, `/clientes/nuevo`, `/clientes/:id`, `/clientes/:id/editar`                         | Clientes                        |
| `/compras?pestana=proveedores`, `/compras/proveedores/nuevo`, `/compras/proveedores/:id/editar` | Proveedores                     |
| `/tasas`                                                                                        | Tasas de cambio                 |
| `/configuracion?pestana=empresa\|valores\|categorias\|unidades`                                 | Configuración                   |
| `/usuarios`                                                                                     | Usuarios                        |

## 5. Endpoints que usa esta fase

Todos existen en el contrato; no se pide nada nuevo al backend.

| Tema          | Endpoints                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Categorías    | `GET/POST /categorias`, `PUT/DELETE /categorias/{id}`                                                                                                                              |
| Unidades      | `GET/POST /unidades-medida`, `PUT/DELETE /unidades-medida/{id}`                                                                                                                    |
| Productos     | `GET/POST /productos`, `GET/PUT/DELETE /productos/{id}`, `POST /productos/{id}/activar\|desactivar`, `PUT/DELETE /productos/{id}/foto`                                             |
| Clientes      | `GET/POST /clientes`, `GET/PUT /clientes/{id}`, `GET /clientes/{id}/historial`                                                                                                     |
| Proveedores   | `GET/POST /proveedores`, `GET/PUT /proveedores/{id}`                                                                                                                               |
| Tasas         | `GET /tasas/vigentes`, `GET /tasas`, `GET /tasas/{id}`, `POST /tasas/vista-previa`, `POST /tasas/ves`, `POST /tasas/trm`, `POST /tasas/trm/consultar`, `POST /tasas/{id}/corregir` |
| Configuración | `GET/PUT /configuracion`, `PUT/DELETE /configuracion/logo`                                                                                                                         |
| Usuarios      | `GET/POST /usuarios`, `POST /usuarios/{id}/activar\|desactivar\|restablecer-contrasena`                                                                                            |

## 6. Pruebas

**Componentes** (Vitest + Testing Library + MSW tipado con el contrato):

- **Tasas:**
  - **CP-10:** dos valores distintos → mensaje y ninguna petición a la API.
  - **CP-11:** anterior 50 y nueva 500 → la alerta de variación aparece, Guardar queda bloqueado hasta marcar la casilla y se envía `aceptarVariacion: true`.
  - **CP-12** (parte del frontend): sin la tasa de hoy, el recuadro muestra la última con su alerta y aparece el aviso con **Registrar tasa del día**.
  - TRM manual solo cuando falló la automática; reintentar la consulta; corrección con motivo; historial combinado por fecha.
- **Productos:**
  - crear y editar;
  - código duplicado en su campo;
  - `MODIFICADO_POR_OTRO_USUARIO` recarga los datos;
  - campos bloqueados por P-17;
  - desactivar, activar y eliminar (también con `PRODUCTO_CON_MOVIMIENTOS`);
  - filtros y búsqueda en la URL;
  - decimales del stock mínimo según la unidad.
- **Foto y logo:** compresión, tipo no permitido (también `ARCHIVO_TIPO_NO_PERMITIDO` del backend), tamaño máximo, quitar.
- **Clientes:** texto del precio que se aplica según el tipo; teléfono sin indicativo; documento duplicado; filtros; detalle con el enlace de WhatsApp y el historial; sin botón de eliminar.
- **Proveedores:** crear, editar y buscar.
- **Configuración:** guardar con versión; categorías y unidades con sus errores (`CATEGORIA_CON_PRODUCTOS`, `UNIDAD_EN_USO` y los duplicados).
- **Usuarios:** crear con la política; sin desactivar para uno mismo; restablecer contraseña.
- **Utilidades:** conversión de decimales (W-04), cantidades según la unidad y compresión de imágenes.

**Extremo a extremo** (Playwright, celular y computador, con la API simulada):

- registrar la tasa del bolívar con doble digitación y alerta de variación, y verla en el recuadro;
- crear un producto con foto y encontrarlo en el listado;
- crear un cliente instalador y abrir su detalle.

**Contra el backend real en local** (como en la Fase 0): el mismo recorrido, más la configuración y los usuarios.

## 7. Definición de terminado (12.1)

- [ ] Pull Request con la CI en verde (tipos sincronizados, lint, formato, tipos, pruebas con cobertura ≥ 80 %, compilación y e2e).
- [ ] Pruebas de la sección 6 escritas y pasando, incluidos CP-10, CP-11 y CP-12.
- [ ] Cliente generado desde el contrato vigente.
- [ ] Desplegado en pruebas. _(Pasa a la Fase 6: F6-02.)_
- [ ] `CHANGELOG.md` actualizado y lista para ITALARM:
  1. Registrar la tasa del bolívar: digitarla distinta (no deja), luego bien con más del 5 % de variación (pide confirmar).
  2. Ver las tasas en el menú (computador) y en la barra superior (celular).
  3. Crear las categorías y unidades que falten.
  4. Crear un producto con foto, editarlo, desactivarlo y volver a activarlo.
  5. Crear un cliente instalador y uno final, y ver el texto del precio que se aplica.
  6. Abrir el detalle de un cliente y su WhatsApp.
  7. Crear un proveedor.
  8. Completar los datos de la empresa y el logo.
  9. Crear un usuario de prueba, desactivarlo y restablecer su contraseña.

## 8. Preguntas para ITALARM

| #    | Tema                          | Pregunta                                                                                                                                                                 | Propuesta                                                                                                                                                                                                                                                                    |
| ---- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W-04 | Separador decimal al escribir | Al digitar tasas, precios y cantidades, ¿qué separador se usa? "3.912,45" (colombiano) y "3912.45" se escriben distinto, y con las tasas un error de separador es grave. | Se acepta **coma o punto** como separador decimal, uno solo, y **sin separador de miles** al escribir. Debajo del campo se muestra cómo quedó el valor ("Se guardará: 3.912,45"). En las tasas, además, la doble digitación y la alerta de variación atajan un valor errado. | De acuerdo con la propuesta. |
| W-05 | Aviso de tasa sin registrar   | RF-07 pide el aviso en Inicio, "antes que cualquier otro bloque". El prototipo lo muestra en **todas** las pantallas, salvo en la de Tasas.                              | Mostrarlo en todas las pantallas, como el prototipo, porque toda venta, compra o cotización usa las tasas (RF-33). En Inicio queda arriba de todo.                                                                                                                           | De acuerdo con la propuesta. |

**Decisiones de diseño (no requieren respuesta salvo que no estés de acuerdo):**

- Los productos se administran en **Inventario**, como en el prototipo ("Nuevo producto" está en esa pantalla).
- El historial de tasas se muestra **una fila por fecha** con las dos tasas, como el prototipo, filtrado por rango de fechas.
- Categorías y unidades van en **Configuración** (RF-148).

## 9. Riesgos y dependencias

- **D-02 (pasa a la Fase 6, F6-03):** en el contrato, todos los campos de respuesta son opcionales. En esta fase eso obliga a manejar en cada pantalla un posible dato faltante (se muestra "—"). Es más código y más pruebas, no un bloqueo.
- **D-04 (nuevo):** el contrato marca `version` como obligatoria también al **crear** categorías, unidades, productos, clientes y proveedores, aunque el backend solo la exige al editar. Al crear se enviará `version: 0`, que el backend ignora. Se anota para corregirlo junto con F6-03.
- **D-05 (nuevo, encontrado al implementar):** el backend tiene registros internos con el mismo nombre (`Linea` en compras, ventas, instalaciones, cotizaciones y vistas previas; `Movimiento` en el historial del cliente y en el del serial; `TotalMoneda` en los listados de compras, ventas e instalaciones), y springdoc publicó **una sola** versión de cada uno. Los tipos generados para esos campos son incorrectos.
  - En esta fase solo afecta el historial del cliente: sus filas se validan al recibirlas (como D-01), con los campos reales (`tipo`, `id`, `consecutivo`, `fecha`, `descripcion`, `total` y `estado`).
  - **Bloquea la Fase 2 en adelante**, donde están las líneas de compras, ventas, instalaciones y cotizaciones. Debe corregirse en italarm-api antes de la Fase 2: un nombre de esquema único por registro (por ejemplo `CompraVistaLinea`), regenerando `contrato/openapi.json`.
- **TRM automática:** desde el entorno del agente, datos.gov.co está bloqueado, así que la falla de la TRM se prueba simulada. La consulta real se verifica en tu equipo.
- **Fotos en Safari:** no genera WebP desde el navegador; por eso se usa JPEG o PNG en ese caso (T1).
