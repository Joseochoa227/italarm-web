# italarm-web

Aplicación web de ITALARM: inventario, compras, ventas, instalaciones y cotizaciones. Es una SPA en React + TypeScript que consume la API de [italarm-api](https://github.com/Joseochoa227/italarm-api). Se puede instalar en el celular como PWA.

## Requisitos

- Node 22 (`.nvmrc`).
- La API corriendo en local (ver el README de italarm-api), por defecto en `http://localhost:8080`.

## Ejecutar en local

```bash
npm install
cp .env.example .env.local   # VITE_API_URL=http://localhost:8080
npm run dev                  # http://localhost:5173
```

El backend permite por CORS el origen `http://localhost:5173` (`ITALARM_CORS_ORIGENES`).

## Comandos

| Comando                                                 | Qué hace                                                                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                                           | Servidor de desarrollo en el puerto 5173.                                                                                    |
| `npm run build`                                         | Revisa los tipos y compila para producción en `dist/` (con la CSP y el service worker).                                      |
| `npm run preview`                                       | Sirve la compilación en el puerto 4173.                                                                                      |
| `npm run lint` / `npm run format` / `npm run typecheck` | ESLint, Prettier y TypeScript.                                                                                               |
| `npm test`                                              | Pruebas de componentes y hooks (Vitest + Testing Library + MSW).                                                             |
| `npm run test:cobertura`                                | Las mismas pruebas con cobertura (mínimo 80 % de líneas).                                                                    |
| `npm run e2e`                                           | Pruebas extremo a extremo con Playwright, en tamaño celular y computador.                                                    |
| `npm run api:sincronizar`                               | Copia el contrato desde `../italarm-api/contrato/openapi.json` y regenera los tipos. Con `-- --ref dev` lo toma de esa rama. |
| `npm run api:generar`                                   | Regenera `src/api/esquema.ts` desde `contrato/openapi.json`.                                                                 |
| `npm run iconos:generar`                                | Regenera los íconos provisionales de la PWA.                                                                                 |

Para las pruebas extremo a extremo con un Chromium ya instalado: `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/ruta/chrome npm run e2e`. Si no, primero `npx playwright install chromium`.

## Documentación

- `docs/requerimientos.md`: requerimientos del sistema. Las decisiones de ITALARM están en `italarm-api/docs/preguntas.md` y prevalecen.
- `docs/plan-fase-N.md`: plan de cada fase.
- `italarm-api/docs/guia-frontend.md`: cómo usar la API (sesión, errores, dinero, paginación…).
- `CLAUDE.md`: convenciones y decisiones técnicas.
- `CHANGELOG.md`: cambios por fase.
