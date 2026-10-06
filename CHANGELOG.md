# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

### Fase 1 — Catálogo, terceros, tasas y configuración

#### Agregado

- **Tasas de cambio:** recuadro con las tasas del día en el menú lateral y en la barra del celular (cada 5 minutos), aviso destacado cuando falta la tasa de hoy (W-05: en todas las pantallas), pantalla de tasas con historial por fecha y correcciones, y diálogo de registro y corrección con doble digitación, vista previa de la variación y confirmación expresa si supera el límite (CP-10, CP-11, CP-12). Reintento de la TRM automática y TRM manual cuando falla.
- **Productos** (en Inventario): listado con filtros por categoría, estado y búsqueda en la URL, formulario de crear y editar, foto comprimida en el navegador, activar, desactivar y eliminar.
- **Clientes:** listado con filtro por tipo, formulario con el precio que se aplicará, detalle con WhatsApp, accesos a venta, instalación y cotización, e historial.
- **Proveedores:** pestaña en Compras con listado y formulario.
- **Configuración:** datos de la empresa y logo, valores por defecto, categorías y unidades de medida.
- **Usuarios:** crear, desactivar, activar y restablecer la contraseña.
- Decimales escritos con coma o punto, sin separador de miles (W-04); edición con control de versión (`MODIFICADO_POR_OTRO_USUARIO` recarga los datos y avisa).

#### Corregido

- Los formularios ya no pueden perder lo escrito justo al abrirse.
- La CSP permite las imágenes que sirve la API (fotos y logo en modo disco).

#### Dependencias con el backend

- D-05: colisión de nombres en el contrato (`Linea`, `Movimiento`, `TotalMoneda`); **debe corregirse antes de la Fase 2**.
- D-06: el listado de tasas no trae las correcciones.

### Fase 0 — Fundaciones

#### Agregado

- Proyecto React 19 + TypeScript estricto + Vite, con ESLint, Prettier, Husky y lint-staged.
- Tailwind CSS v4 con los tokens del prototipo (colores, Barlow y Barlow Condensed, radios, sombras y espaciado) y una escala roja de "peligro" para errores (W-02).
- Cliente de la API generado desde `contrato/openapi.json` (openapi-typescript + openapi-fetch + openapi-react-query), con el token Bearer y los errores Problem Details convertidos en `ErrorApi` por su `codigo`.
- Ingreso con correo y contraseña, validación del token al cargar, cierre de sesión, cierre automático ante cualquier 401 y cambio de contraseña con la política de P-07/P-08.
- Menú lateral en computador y barras superior e inferior con el botón Nuevo (+) en celular (RF-01 a RF-04). Configuración y Usuarios van en el menú del usuario (W-01). Las secciones de fases posteriores muestran en qué fase llegan.
- Componentes base (botón, campo, contraseña, tarjeta, etiqueta, diálogo, menú, avisos, esqueleto, estados vacío y de error) y formato de dinero, cantidades y fechas en `lib/formato.ts`.
- PWA instalable con íconos provisionales (W-03), aviso de versión nueva y aviso de sin conexión.
- CSP en la compilación de producción.
- CI en GitHub Actions: contrato sincronizado, lint, formato, tipos, pruebas con cobertura, compilación y Playwright en celular y computador.

#### Corregido

- Sin `.env.local` la app quedaba en blanco. Ahora `npm run dev` usa `http://localhost:8080` por defecto (`.env.development`), y si la configuración es inválida, la app muestra el error en pantalla.

#### Pendiente (pasa a la Fase 6)

- Acceso a los listados de Compras y Cotizaciones en el celular, despliegue a pruebas (P-04), ajustes del contrato (D-01, D-02), logo de ITALARM y CI en verde en GitHub. Detalle en `docs/plan-fase-0.md`, sección 10.
