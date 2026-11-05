# Mandadito · servidor

Servidor Node.js 24 con SQLite, cliente web, panel de administración, páginas públicas (privacidad, condiciones, eliminación de cuenta) y pruebas. Es el repo que se despliega en **Railway**.

La app móvil vive en el repo **mandadito-app**. Al compilar, la app copia la interfaz web (`index.html`, `assets/`, `favicon.ico`, `manifest.webmanifest`) desde este repo: cualquier cambio de interfaz se hace aquí.

## Estructura

| Ruta | Contenido |
|---|---|
| `server.mjs` y `*.mjs` | API, tiempo real (SSE), push, promociones, comercios |
| `index.html`, `administracion.html`, `assets/` | Cliente web y administración (también se empaquetan en la app) |
| `tests/` | Pruebas (`npm test`) |
| `deploy/` | Dockerfile (Railway y VPS), `compose.yml` + Caddy para VPS |
| `railway.json` | Configuración de Railway |
| `scripts/` | `configure`, `check-server`, `backup` |
| `docs/` | Activación de servicios y despliegue en Railway |

## Comandos

```sh
npm test            # pruebas
npm run configure   # crea .env con dominio y secretos
npm run check       # comprueba la configuración de producción
npm start           # arranca con .env
npm run backup -- data/mandadito.sqlite copia.sqlite
```

## Desplegar

- Railway: `docs/RAILWAY.md`.
- VPS con Docker: `docs/ACTIVAR.md` → "Desplegar con Docker y HTTPS".

Una sola instancia con disco persistente (SQLite). No compartas `.env`, `deploy/secrets/` ni claves.

## Operación incluida

Registro con teléfono, contraseña y foto; recuperación por SMS; comercios autorizados por administración; catálogo con opciones; carrito; cupones e invitaciones; pedidos en tiempo real; asignación de repartidor; chat; calificaciones; mapas y ETA; notificaciones push; bloqueo por teléfono; eliminación de cuenta. Pago en efectivo al recibir; sin pasarela de tarjetas.
