# Guía para probar ITALARM en tu computador

Esta guía deja el sistema completo (base de datos, API y aplicación) funcionando en un computador con **Windows 10 u 11**, para probarlo antes de la salida a producción (Fase 7). Al final está la **lista de verificación** de la Fase 6.

Tiempo aproximado la primera vez: 45 minutos, casi todo en descargas.

## 1. Instalar los programas (una sola vez)

Instala, en este orden, con las opciones que trae cada instalador:

| Programa           | Dónde                                                | Para qué                     |
| ------------------ | ---------------------------------------------------- | ---------------------------- |
| **Git**            | https://git-scm.com/download/win                     | Descargar el código.         |
| **Node.js 22 LTS** | https://nodejs.org (versión "LTS")                   | La aplicación (frontend).    |
| **JDK 21**         | https://adoptium.net (Temurin 21, instalador `.msi`) | La API (backend).            |
| **Docker Desktop** | https://www.docker.com/products/docker-desktop       | La base de datos PostgreSQL. |

Después de instalar Docker Desktop, reinicia el computador y ábrelo una vez: debe quedar en verde ("Engine running").

Para comprobar, abre **PowerShell** (menú Inicio → escribe "PowerShell") y ejecuta:

```powershell
git --version
node --version     # debe decir v22.x
java -version      # debe decir 21
docker --version
```

## 2. Descargar los dos proyectos (una sola vez)

En PowerShell, en la carpeta donde quieras guardarlos (por ejemplo `Documentos`):

```powershell
cd $HOME\Documents
git clone -b dev https://github.com/Joseochoa227/italarm-api.git
git clone -b dev https://github.com/Joseochoa227/italarm-web.git
```

Para traer después la última versión: `git pull` dentro de cada carpeta.

## 3. Arrancar la API (backend)

**La primera vez**, crea el archivo de configuración:

```powershell
cd $HOME\Documents\italarm-api
copy .env.example .env
notepad .env
```

En el Bloc de notas, completa:

- `POSTGRES_PASSWORD` y `ITALARM_DB_CLAVE`: la misma contraseña, la que quieras, para la base de datos local.
- `ITALARM_CLAVE_INICIAL`: la contraseña con la que Jose y Victor entran la primera vez (8 a 64 caracteres, con mayúscula, minúscula, número y signo). Después cada uno la cambia en la aplicación.
- Deja lo demás como está.

Guarda y cierra. Este archivo nunca se sube a GitHub.

**Cada vez** que quieras usar el sistema:

```powershell
cd $HOME\Documents\italarm-api
docker compose up -d            # enciende la base de datos
.\mvnw.cmd spring-boot:run      # arranca la API (la primera vez descarga dependencias)
```

Está lista cuando aparece `Started ItalarmApiApplication`. Deja esa ventana abierta. Para comprobarla, abre http://localhost:8080/swagger-ui.html.

## 4. Arrancar la aplicación (frontend)

Abre **otra** ventana de PowerShell:

```powershell
cd $HOME\Documents\italarm-web
npm install        # solo la primera vez o después de un git pull
npm run dev
```

Abre http://localhost:5173 e ingresa con tu correo y la contraseña inicial. Cámbiala después desde el menú de tu cuenta (Cambiar contraseña).

Para apagar todo: `Ctrl + C` en cada ventana y `docker compose stop` en la carpeta `italarm-api`. Los datos quedan guardados para la próxima vez.

## 5. Probar desde el celular (misma red Wi-Fi)

El celular y el computador deben estar en la **misma red Wi-Fi**.

1. **IP del computador:** en PowerShell, `ipconfig`. Busca "Dirección IPv4" del adaptador Wi-Fi, por ejemplo `192.168.1.20`. En los pasos siguientes, cambia `192.168.1.20` por la tuya.
2. **API:** en `italarm-api\.env` cambia estas dos líneas y vuelve a arrancar la API:

   ```
   ITALARM_CORS_ORIGENES=http://localhost:5173,http://192.168.1.20:5173
   ITALARM_URL_PUBLICA=http://192.168.1.20:8080
   ```

3. **Aplicación:** en la carpeta `italarm-web` crea el archivo `.env.local` con:

   ```
   VITE_API_URL=http://192.168.1.20:8080
   ```

   y arráncala con `npm run dev -- --host`.

4. **Firewall de Windows:** la primera vez que arranques la API y la aplicación, Windows pregunta si permite el acceso: elige **Redes privadas** y **Permitir**. Si no preguntó, en PowerShell como administrador:

   ```powershell
   New-NetFirewallRule -DisplayName "ITALARM" -Direction Inbound -Protocol TCP -LocalPort 5173,8080 -Action Allow -Profile Private
   ```

5. En el celular, abre `http://192.168.1.20:5173`.

**Qué funciona sin HTTPS:** casi todo. Los navegadores solo permiten la cámara para **leer seriales** y el **compartir** del sistema (enviar el PDF por WhatsApp como archivo) en sitios con HTTPS. En esta prueba:

- las **fotos** de la instalación con la cámara sí funcionan (usan la cámara del sistema);
- los seriales se escriben a mano;
- WhatsApp envía el **enlace** del comprobante en lugar del archivo.

En **Android** puedes habilitar lo demás en Chrome:

1. abre `chrome://flags/#unsafely-treat-insecure-origin-as-secure`;
2. escribe `http://192.168.1.20:5173`;
3. elige **Enabled** y toca **Relaunch**.

La prueba completa en celulares queda para la Fase 7, con HTTPS.

Cuando termines, borra `.env.local` y vuelve a dejar el `.env` de la API como estaba (o deja las dos direcciones: no estorban).

## 6. Copias de seguridad

Antes de empezar las pruebas, y cuando quieras guardar un punto al que volver, haz una copia de la base y de la carpeta de archivos. Los pasos para Windows están en `italarm-api\docs\copias-locales.md`, con la restauración.

## 7. Problemas comunes

| Qué pasa                                                 | Qué hacer                                                                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `docker compose up` falla o dice que no encuentra Docker | Abre Docker Desktop y espera a que diga "Engine running".                                                     |
| "Port 8080 (o 5173) is already in use"                   | Ya hay otra API o aplicación abierta: ciérrala (`Ctrl + C` en su ventana) o reinicia el computador.           |
| La aplicación dice que no hay conexión con el servidor   | La API no está corriendo o no terminó de arrancar: revisa su ventana.                                         |
| "Tu sesión terminó. Ingresa de nuevo."                   | Se cambió la contraseña o se cerró la sesión en otro equipo: vuelve a ingresar.                               |
| Inicio avisa que no llegó la TRM                         | Sin internet, la API no consulta la TRM oficial. Regístrala a mano en **Tasas de cambio**.                    |
| `.\mvnw.cmd` dice que no encuentra Java                  | Cierra y abre PowerShell después de instalar el JDK. Si sigue, reinstala Temurin 21 marcando "Set JAVA_HOME". |
| `npm install` falla                                      | Comprueba `node --version` (v22) y vuelve a intentar.                                                         |
| Desde el celular no abre                                 | Mismo Wi-Fi (no la red de invitados), la IP correcta y el firewall (paso 5.4).                                |

## 8. Lista de verificación de la Fase 6

Con la API y la aplicación corriendo, recorre estos pasos. Si algo no funciona como dice, anota la pantalla y lo que pasó (si aparece un **código de soporte**, anótalo también).

**Antes de empezar:** haz una copia (paso 6).

1. **Ingreso y configuración**
   - Ingresa con el correo y la contraseña inicial; cambia la contraseña (menú de tu cuenta → Cambiar contraseña).
   - En **Configuración**, revisa los datos de la empresa y sube el logo.
   - En **Usuarios**, crea un usuario y desactívalo.
2. **Tasas**
   - En **Tasas de cambio**, revisa la TRM del día.
   - Registra la tasa del bolívar escribiendo dos valores distintos: no se guarda (CP-10).
   - Regístrala bien y mira la alerta de variación.
3. **Catálogo y terceros**
   - Crea una categoría.
   - Crea un producto con serial y uno sin serial con stock mínimo.
   - Crea un cliente instalador, un cliente final y un proveedor.
4. **Carga inicial** (Configuración → Carga inicial)
   - Descarga la plantilla y llénala con productos y seriales.
   - Repite un serial a propósito y mira el error (CP-29).
   - Corrígelo y confirma.
5. **Compras e inventario**
   - Registra una compra en COP con seriales y adjunta la factura.
   - Mira el costo, el kárdex y el historial de costo del producto.
   - Haz un ajuste.
   - Anula la compra si fue la última.
6. **Venta**
   - En la vista previa, mira el precio según el tipo de cliente y el costo a las dos tasas.
   - Guarda con descuento.
   - Descarga el PDF y abre el enlace de WhatsApp.
   - Anúlala y mira que el material vuelve.
7. **Instalación**
   - Registra una con dos técnicos, cámaras con serial, cable y mano de obra.
   - Sube fotos de antes, durante y después.
   - Descarga el PDF.
   - En **Garantías**, búscala y registra un reclamo.
8. **Cotización**
   - Créala y envíala por WhatsApp: queda En evaluación.
   - Edítala: queda como versión 2.
   - Márcala como aprobada y conviértela en instalación.
   - Anula esa instalación: la cotización vuelve a Aprobada.
   - Rechaza otra cotización y duplícala.
9. **Inicio**
   - Si no registras la tasa del bolívar de hoy, Inicio muestra el aviso primero.
   - Compara los indicadores del mes con lo que registraste.
   - Mira el stock bajo con su barra y el número junto a Inventario en el menú.
   - Mira las garantías y cotizaciones por vencer.
   - Toca un movimiento de "Últimos movimientos": abre su detalle.
10. **Reportes**
    - Muévete por semana, mes y año con las flechas, y prueba un rango libre.
    - Mira el gráfico, los más vendidos, las compras por proveedor y el porcentaje de cotizaciones aprobadas.
    - Revisa las pestañas Utilidad por documento y Seriales.
11. **Excel**
    - Exporta inventario, kárdex (en el detalle de un producto), compras, ventas, instalaciones, cotizaciones y garantías.
    - Exporta cada pestaña de Reportes.
    - Ábrelos: los montos se pueden sumar.
12. **Celular** (paso 5): repite una venta y una instalación con fotos desde el celular.
13. **Copia y restauración**
    - Haz una copia.
    - Registra una venta de prueba.
    - Restaura la copia: la venta de prueba ya no está y el resto sí.

Cuando todo esté bien, se escribe el plan de la **Fase 7 — Salida a producción**.
