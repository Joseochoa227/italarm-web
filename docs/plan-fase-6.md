# Plan de la Fase 6 — Inicio, reportes, Excel y validación en local (italarm-web)

> Estado: **aprobado por ITALARM el 12/10/2026** con las propuestas de W-13 a W-16.
> Base: `docs/requerimientos.md` (3.1, 3.2, 3.16, RNF-04, RNF-06, RNF-08 y 12.8), `italarm-api/docs/preguntas.md` (P-56 a P-63), `italarm-api/docs/guia-frontend.md` (§18 a §20), `italarm-api/docs/plan-fase-6.md` (sección 9, lista de verificación), el prototipo `docs/Italarm v2.html` (Inicio y Reportes) y el contrato de `dev` @ `4a4ba37`.
> Alcance: solo **italarm-web**. El backend de esta fase ya está terminado en `dev`: Inicio, reportes y Excel (14 rutas nuevas, sin cambios en las existentes).

## 1. Objetivo y entregable

Terminar todas las pantallas y dejar el sistema completo **listo para que ITALARM lo pruebe en su computador** (y en el celular, en la misma red Wi-Fi) antes de salir a producción.

Por decisión de ITALARM (P-56), la sección 12.8 se divide en dos fases:

- **Fase 6 (este plan):** lo que falta del frontend y la validación en local.
- **Fase 7 — Salida a producción:** se planea solo cuando ITALARM valide esta fase en local y defina el hosting (P-04).

Entregable:

- la pantalla de **Inicio** completa;
- la pantalla de **Reportes** con período, gráficos, utilidad por documento y seriales;
- el botón **Excel** en cada listado y reporte;
- los pendientes F6-01 y F6-06 (y F6-04 si llega el logo);
- una **guía paso a paso para correr todo en Windows** y la lista de verificación para ITALARM.

## 2. Qué queda fuera (pasa a la Fase 7)

- **Despliegue:** hosting, dominio y HTTPS (F6-02).
- **Seguridad del hosting:**
  - CSP definitiva con el origen real de la API y de los archivos;
  - `frame-ancestors` y cabeceras de seguridad del hosting;
  - prueba extremo a extremo contra el ambiente real.
- **Celular con HTTPS:** prueba en celulares reales de lo que el navegador solo permite con HTTPS (ver la sección 9).
- **Copias de seguridad automáticas, monitoreo y alertas:** son del backend y del hosting.
- **Producción:** carga de los datos reales y manual corto de uso.
- **Ajustes del contrato** D-01 y D-02 (F6-03): el backend no los hizo en su Fase 6. El frontend sigue validando los errores al recibirlos.

## 3. Tareas

### T1. Contrato y cliente — `build:`

`npm run api:sincronizar -- --ref origin/dev`: copia el contrato de `dev` (@ `4a4ba37`) y regenera `src/api/esquema.ts`.

### T2. Pantalla de Inicio (RF-06 a RF-13) — `feat:`

`/` con una sola petición, `GET /inicio` (RNF-08), en el orden del prototipo:

- **Aviso de tasas** (RF-07): si falta la tasa del bolívar de hoy o no llegó la TRM, va primero, destacado, con el botón **Registrar tasa** (lleva a `/tasas`).
- **Saludo** (RF-06): nombre y fecha de hoy.
- **Cuatro indicadores del mes** (RF-08, P-57):
  - **Ventas del mes**, con la cantidad;
  - **Instalaciones del mes**, con la cantidad;
  - **Utilidad del mes**, con el porcentaje sobre lo cobrado;
  - **Inventario valorizado**, con los productos en bodega.
  - Cada uno en USD con su equivalente en COP y VES, y lo cobrado en cada moneda.
- **Accesos rápidos** (RF-09): Nueva venta, Nueva instalación, Registrar compra y Nueva cotización.
- **Stock bajo** (RF-10): producto, stock y mínimo, con la barra de nivel. Enlace **Ver inventario**.
- **Garantías por vencer** (RF-11): cliente, consecutivo, vencimiento y días restantes. **Ver todas** lleva a `/garantias` filtrado por Por vencer.
- **Cotizaciones en evaluación** (RF-12): cliente, valor y días para vencer; resaltadas las que vencen en 3 días o menos. **Ver todas** lleva al listado filtrado.
- **Últimos movimientos** (RF-13): tipo, consecutivo, cliente o proveedor, usuario, fecha y hora, valor y la marca **Anulado**. Al tocarlo se abre su detalle.
- Cada bloque muestra hasta 10 filas y su total. Si no tiene nada, muestra un mensaje corto (por ejemplo "No hay productos bajo el mínimo").
- En el celular, los bloques van uno debajo del otro.

### T3. Indicador de bajo mínimo en el menú (RF-02, F6-06) — `feat:`

La opción **Inventario** del menú lateral, y la del celular, muestra la cantidad de productos bajo el mínimo (`totalStockBajo` de `GET /inicio`). Se actualiza al abrir la app y después de guardar una compra, venta, instalación o ajuste. Ver **W-13**.

### T4. Pantalla de Reportes (RF-135 a RF-143) — `feat:`

`/reportes`, con tres pestañas: **Resumen**, **Utilidad por documento** y **Seriales**.

- **Período** (RF-135, P-60):
  - **Semana** (lunes a domingo), **Mes** o **Año**, con flechas para ir al anterior y al siguiente (`anterior` y `siguiente` de la respuesta);
  - **Rango** de fechas libre;
  - por defecto, el mes en curso;
  - el período queda en la URL, así el botón Atrás lo conserva.
- **Resumen** (`GET /reportes/periodo`):
  - **Indicadores** (RF-136): ventas de material, instalaciones, utilidad con su margen e inventario valorizado "al día de hoy" (P-58).
  - **Gráfico de barras** de ventas e instalaciones (RF-137), por semana o por mes según `agrupacion`, en USD. Debajo, la tabla con los mismos números, para leerlos exactos y por accesibilidad.
  - **Más vendidos** y **más usados en instalaciones** (RF-138, P-59): los 10 primeros por valor, con cantidad y unidad.
  - **Compras por proveedor** (RF-139), con barras y el total.
  - **Stock bajo** completo (RF-140), con enlace al inventario.
  - **Cotizaciones** (RF-142): cantidad por estado y porcentaje de aprobadas.
- **Utilidad por documento** (RF-143, P-63, `GET /reportes/utilidad`):
  - ventas e instalaciones del período, con cobrado, costo, utilidad y margen, y los totales en USD;
  - filtro por tipo y opción de ordenar por utilidad;
  - paginado; cada documento abre su detalle.
- **Seriales** (RF-141, `GET /reportes/seriales`):
  - cuántos hay en bodega, vendidos, instalados…;
  - listado filtrable por estado y por producto, con entrada, salida y garantía;
  - cada serial abre su historial.
- **Gráficos:** barras con HTML y CSS, sin librería de gráficos, para no sumar peso a la carga (BF-12). Sus colores siguen los tokens del prototipo y no dependen solo del color (BF-11).

### T5. Exportar a Excel (RF-144, RNF-06, P-62) — `feat:`

Botón **Excel** en cada listado y reporte, con los mismos filtros que se ven en pantalla:

| Pantalla                                     | Ruta                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| Inventario                                   | `GET /inventario/excel`                                                               |
| Kárdex (detalle del producto)                | `GET /inventario/productos/{id}/kardex/excel`                                         |
| Compras, ventas, instalaciones, cotizaciones | `GET /compras/excel`, `/ventas/excel`, `/instalaciones/excel`, `/cotizaciones/excel`  |
| Garantías                                    | `GET /garantias/excel`                                                                |
| Reportes (cada pestaña)                      | `GET /reportes/periodo/excel`, `/reportes/utilidad/excel`, `/reportes/seriales/excel` |

- Se descarga con el token, como los PDF, con el nombre que da el backend (por ejemplo `ventas-2026-10-12.xlsx`).
- El botón muestra que está trabajando mientras se genera.
- Si pasa de 20.000 filas, el backend responde `EXPORTACION_MUY_GRANDE`: se muestra el mensaje para acotar las fechas.

### T6. Pendientes de la Fase 0 — `feat:`

- **F6-01, acceso al listado de Compras en el celular:** ver **W-14**. Cotizaciones ya lo tiene (W-11).
- **F6-04, logo:** si ITALARM entrega el logo, se generan los íconos de la app y se reemplaza el provisional (W-03). Ver **W-15**.

### T7. Revisión final — `fix:` / `test:`

- **Accesibilidad** (BF-11):
  - recorrido con el teclado de todas las pantallas;
  - revisión automática con axe en las pruebas extremo a extremo;
  - contraste, áreas táctiles de 44 px y etiquetas.
- **Estados vacíos, de carga y de error** en todas las pantallas, con el mismo estilo.
- **Rendimiento** (RNF-08):
  - peso de la carga inicial y de cada pantalla (`vite build`);
  - Inicio y Reportes medidos con los datos de volumen del backend (perfil `volumen`).
- **Extremo a extremo completas:** un recorrido de punta a punta en celular y computador, contra la API simulada, que pasa por todas las pantallas. Más una corrida contra el backend real de `dev` en local, con los casos CP-01 a CP-29 que tienen pantalla.

### T8. Guía para correr todo en local (Windows) — `docs:`

`docs/guia-local.md`, paso a paso y sin dar nada por sabido:

1. **Instalar:** Git, Node.js 22, JDK 21 y Docker Desktop.
2. **Descargar los dos repositorios** (rama `dev`).
3. **Backend:** crear el `.env` desde `.env.example`, `docker compose up -d` y `.\mvnw.cmd spring-boot:run`. Comprobar en Swagger que responde.
4. **Frontend:** `npm install` y `npm run dev`; abrir http://localhost:5173 e ingresar.
5. **Probar desde el celular** en la misma red Wi-Fi:
   - la IP del computador;
   - `.env.local` con `VITE_API_URL`;
   - `ITALARM_CORS_ORIGENES` e `ITALARM_URL_PUBLICA` con esa IP;
   - `npm run dev -- --host`;
   - permiso del firewall de Windows para los puertos 5173 y 8080;
   - qué funciona sin HTTPS (ver la sección 9).
6. **Copia y restauración:** remite a `italarm-api/docs/copias-locales.md`.
7. **Problemas comunes:**
   - puerto ocupado;
   - Docker apagado;
   - "La sesión terminó";
   - la TRM no llega sin internet: se registra a mano.

Además, el `README.md` remite a la guía.

### T9. Documentación de cierre — `docs:`

`CHANGELOG.md`, `CLAUDE.md` y la lista de verificación de la sección 7.

## 4. Pantallas y rutas

| Ruta                       | Pantalla                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `/`                        | Inicio completo (reemplaza el saludo de la Fase 0)                                    |
| `/reportes`                | Reportes: Resumen, Utilidad por documento y Seriales (reemplaza "llega en la Fase 6") |
| Listados y kárdex          | Botón Excel                                                                           |
| Menú lateral y del celular | Indicador de bajo mínimo en Inventario                                                |

## 5. Endpoints que usa esta fase

Todos están en el contrato de `dev`.

| Tema     | Endpoints                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| Inicio   | `GET /inicio`                                                                                                    |
| Reportes | `GET /reportes/periodo`, `GET /reportes/utilidad`, `GET /reportes/seriales`                                      |
| Excel    | `GET …/excel` de inventario, kárdex, compras, ventas, instalaciones, cotizaciones, garantías y los tres reportes |

## 6. Pruebas

**Componentes** (Vitest + Testing Library + MSW tipado con el contrato):

- **Inicio:**
  - el aviso de tasas va antes que todo y lleva a Tasas;
  - indicadores en USD con sus equivalentes y la cantidad;
  - stock bajo con su barra;
  - garantías y cotizaciones por vencer (resaltadas);
  - últimos movimientos que abren su detalle, con la marca Anulado;
  - bloques vacíos y error con Reintentar.
- **Indicador del menú:** muestra el número y se actualiza después de guardar un documento.
- **Reportes:**
  - semana, mes y año con las flechas;
  - rango libre;
  - el período en la URL;
  - barras y tabla del gráfico;
  - más vendidos, compras por proveedor y porcentaje de aprobadas;
  - utilidad por documento con filtro, orden y paginación;
  - seriales por estado y producto.
- **Excel:** cada botón llama a su ruta con los filtros de la pantalla y descarga con el nombre del backend; `EXPORTACION_MUY_GRANDE` muestra su mensaje.

**Extremo a extremo** (Playwright, celular y computador, con la API simulada):

- Inicio con todos sus bloques y la navegación a cada detalle;
- reportes: cambiar de período y exportar;
- el recorrido completo de punta a punta (T7);
- revisión de accesibilidad con axe en las pantallas principales.

**Contra el backend real en local**, como en las fases anteriores: Inicio (contrastando los indicadores con lo registrado), reportes de semana, mes, año y rango, los Excel (que se abren y suman), y la lista de la sección 7 hasta donde se puede automatizar.

## 7. Definición de terminado y lista para ITALARM

- [ ] Pruebas de la sección 6 escritas y pasando; cobertura de al menos 80 % de líneas.
- [ ] Cliente generado desde el contrato vigente (`dev` @ `4a4ba37` o posterior).
- [ ] `docs/guia-local.md` probada siguiendo los pasos desde cero.
- [ ] `CHANGELOG.md` y `CLAUDE.md` actualizados.
- [ ] Todo en `dev` de los dos repositorios.
- [ ] **Validación de ITALARM en local.** Con ella se escribe el plan de la Fase 7.

La **lista de verificación para ITALARM** será la de la sección 9 del plan del backend (pasos 1 a 13: ingreso, tasas, catálogo, carga inicial, compras, venta, instalación, cotización, Inicio, reportes, Excel, celular y copia/restauración), ahora con todos los pasos en pantalla y sin Swagger. Va en `docs/guia-local.md`, para hacerla con la app abierta.

## 8. Preguntas para ITALARM

| #    | Tema                                        | Pregunta                                                                                           | Propuesta                                                                                                                                                                                                                                | Respuesta de ITALARM         |
| ---- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| W-13 | Indicador de bajo mínimo en el menú (F6-06) | ¿Con qué dato se cuenta y cuándo se actualiza?                                                     | Con el total de stock bajo de `GET /inicio`, al abrir la app y después de guardar cualquier documento que mueva inventario. Es la misma cifra del bloque de Inicio, así nunca se contradicen.                                            | De acuerdo con la propuesta. |
| W-14 | Listado de Compras en el celular (F6-01)    | La barra del celular (RF-03) no tiene Compras: hoy solo se llega a Registrar compra con Nuevo (+). | Como en ventas, instalaciones y cotizaciones (W-09, W-11): **Ver compras** arriba de Registrar compra. Además, las compras de Últimos movimientos en Inicio abren su detalle.                                                            | De acuerdo con la propuesta. |
| W-15 | Logo de ITALARM (F6-04)                     | ¿Hay logo para los íconos de la app (pantalla de inicio del celular y pestaña del navegador)?      | Si ITALARM lo entrega (PNG o SVG cuadrado, de al menos 512 × 512 px), se generan los íconos en esta fase. Si no, sigue el provisional y se cambia en la Fase 7 sin tocar el código. El logo de los PDF se sube aparte, en Configuración. | De acuerdo con la propuesta. |
| W-16 | Revisión de la CI en GitHub (F6-05)         | La CI solo se ve en verde al abrir un Pull Request en GitHub.                                      | Al terminar la fase, abrir un Pull Request de la rama de trabajo hacia `dev` en los dos repositorios para ver la CI en verde, y fusionarlo con el visto bueno de ITALARM (AG-06). No despliega nada.                                     | De acuerdo con la propuesta. |

## 9. Riesgos y dependencias

- **Celular en la red local sin HTTPS:**
  - el navegador solo permite la cámara para leer seriales y el "compartir" del sistema en sitios con HTTPS;
  - en la prueba desde el celular por Wi-Fi, las fotos con la cámara sí funcionan (es la cámara del sistema), pero el escáner de seriales y compartir el PDF no;
  - WhatsApp usa el enlace del comprobante, que sí funciona;
  - en Android se pueden habilitar con una opción de Chrome para esa dirección, que explicará la guía;
  - la prueba completa en celulares reales queda para la Fase 7, con HTTPS.
- **TRM sin internet:** si el computador no llega a datos.gov.co, la TRM se registra a mano y Inicio muestra el aviso. Es el comportamiento esperado.
- **Contrato:** si el backend cambia algo en `dev` mientras se hace esta fase, se vuelve a sincronizar (T1).
- **D-01, D-02 (F6-03):** siguen abiertas; no bloquean esta fase.
