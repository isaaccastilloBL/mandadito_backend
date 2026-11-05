# Desplegar el servidor en Railway

Railway compila `deploy/Dockerfile` (definido en `railway.json`), sirve HTTPS y guarda SQLite en un volumen. No se usan Caddy ni `compose.yml`.

## 1. Crear el servicio

1. Sube **este repo (mandadito-backend)** a un repositorio privado de GitHub. `.gitignore` ya excluye `.env`, `deploy/secrets/` y los `.p8`/`.json` privados.
2. En Railway: **New Project → Deploy from GitHub repo**. Railway detecta `railway.json` en la raíz.
3. **Settings → Volumes → Add Volume**, ruta de montaje: `/data`.
4. **Settings → Networking → Generate Domain** (o conecta tu dominio propio con un CNAME). El puerto de destino es `4173`.

## 2. Variables (Settings → Variables)

Obligatorias (el servidor no arranca sin ellas):

| Variable | Valor |
|---|---|
| `RAILWAY_RUN_UID` | `0` (permite escribir en el volumen) |
| `PORT` | `4173` |
| `TRUST_PROXY` | `railway` |
| `PUBLIC_ORIGIN` | `https://tu-dominio` sin barra final; debe coincidir con `apiOrigin` de `app.config.json` en mandadito-app |
| `MANDADITO_ADMIN_TOKEN` | 32+ caracteres aleatorios (`openssl rand -hex 32`) |
| `OTP_SECRET` | 32+ caracteres aleatorios, distinto del anterior |
| SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_MESSAGING_SERVICE_SID` o `TWILIO_FROM` — o bien `SMS_VERIFY_WEBHOOK` + `VERIFY_WEBHOOK_TOKEN` |
| Rutas | `MAPBOX_DIRECTIONS_TOKEN` o `ROUTING_BASE_URL` |

`NODE_ENV=production`, `HOST=0.0.0.0` y `MANDADITO_DATA_DIR=/data` ya vienen en el Dockerfile. No pongas `TRUST_PROXY_IP` ni `DEV_OTP`.

Opcionales: `OPERATOR_NAME`, `SUPPORT_EMAIL`, `SUPPORT_PHONE`, `WHATSAPP_VERIFY_WEBHOOK`.

### Notificaciones push (sin archivos)

- Android: `FCM_SERVICE_ACCOUNT_JSON` = el JSON completo de la cuenta de servicio de Firebase (o en base64: `base64 -i cuenta.json`).
- iPhone: `APNS_KEY` = el contenido del `.p8` (o en base64: `base64 -i AuthKey.p8`), más `APNS_KEY_ID`, `APPLE_TEAM_ID`, `APP_ID` y `APNS_SANDBOX=0`.

## 3. Comprobar

- `https://tu-dominio/api/health` debe responder 200.
- Entra a `https://tu-dominio/administracion.html` con `MANDADITO_ADMIN_TOKEN`.
- Comprueba las variables desde tu equipo con `railway run npm run check` (CLI de Railway).
- Después pon ese dominio en mandadito-app y recompila (`npm run sync`).

## Límites

- **Una sola réplica.** SQLite vive en un único volumen: no aumentes réplicas ni actives otra región. `railway.json` fija `numReplicas: 1`.
- Con volumen, cada despliegue tiene unos segundos de corte (Railway detiene el contenedor anterior antes de montar el volumen en el nuevo). La app reconecta sola.
- **Copias:** activa *Backups* del volumen en Railway y descarga copias periódicas fuera de Railway.
