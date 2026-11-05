# Activar el servidor y crear tu operación

## Configuración inicial

Ejecuta `npm run configure` en este repo. Edita `.env` con un editor local. El servidor en producción rechaza OTP de prueba, secretos cortos, dominio inválido y ausencia de proveedor SMS o rutas.

El dominio debe coincidir exactamente en PUBLIC_ORIGIN y en `app.config.json` → apiOrigin del repo mandadito-app, sin ruta ni barra final. Configura el DNS hacia tu servidor. El servidor requiere almacenamiento persistente; no subas SQLite al almacenamiento efímero de una función serverless. La landing de prerregistros de Codivo es otro proyecto; no se transfieren esos registros automáticamente.

### SMS

Puedes usar Twilio Programmable Messaging: completa TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_MESSAGING_SERVICE_SID o TWILIO_FROM. Habilita el envío a los países requeridos y usa un remitente autorizado para tu operación. La entrega y sus costos dependen del proveedor.

También puedes usar SMS_VERIFY_WEBHOOK y VERIFY_WEBHOOK_TOKEN. El servidor envía un POST autenticado con destination, code y brand. Tu servicio debe enviar el SMS y devolver un estado HTTP satisfactorio. WhatsApp sólo se habilita en el registro cuando configures WHATSAPP_VERIFY_WEBHOOK; este endpoint debe realizar el envío mediante una integración autorizada y sus plantillas cuando correspondan.

No habilites DEV_OTP en producción. No se utilizaron tus cuentas de mensajería ni se enviaron SMS reales durante esta preparación.

### Rutas y mapas

Configura MAPBOX_DIRECTIONS_TOKEN para cotizar rutas por calles con Mapbox, o ROUTING_BASE_URL con tu servicio de rutas compatible con OSRM. Para mostrar el mapa de Mapbox, entra después en Administración y guarda un token público con las restricciones de tu dominio y del origen de la app, según la configuración de tu cuenta. Los mapas de direcciones conservan su proveedor de teselas actual; confirma sus límites y permisos antes de recibir tráfico público. Revisa cobertura y exactitud de las rutas en Zumpango.

### Push Android

Registra el identificador definitivo de la app en Firebase y habilita Cloud Messaging. El archivo google-services.json va en el repo mandadito-app (android/app/). Guarda la cuenta de servicio exclusivamente en el servidor y configura FCM_SERVICE_ACCOUNT_FILE. En contenedores, coloca ese archivo en deploy/secrets y apunta a /run/secrets/nombre.json; en Railway usa FCM_SERVICE_ACCOUNT_JSON. Nunca lo copies al repo de la app.

### Push iPhone

Usa tu cuenta Apple Developer para habilitar Push Notifications y el App ID. En el servidor configura APNS_KEY_FILE (o APNS_KEY en Railway), APNS_KEY_ID, APPLE_TEAM_ID y APP_ID. APNS_SANDBOX=1 sólo corresponde a compilaciones de desarrollo; para distribución usa 0. Los archivos de entitlements del proyecto distinguen Debug y Release. Selecciona el equipo y los perfiles de firma correctos en Xcode.

Activa pushEnabled en app.config.json del repo mandadito-app después de configurar cada plataforma. La app solicita permiso al terminar el acceso verificado. Los avisos se encolan en SQLite, se reintentan con espera y no incluyen direcciones ni contenido de chat en la pantalla bloqueada. La recepción real de FCM/APNs no se probó con credenciales del titular.

## Desplegar en Railway

Consulta `docs/RAILWAY.md`.

## Desplegar con Docker y HTTPS (VPS)

Instala Docker con Compose en tu servidor. Crea .env en la raíz de este repo y configura el dominio. En la carpeta deploy ejecuta:

```sh
MANDADITO_DOMAIN=tu-dominio-real.com docker compose up -d --build
```

En PowerShell usa `$env:MANDADITO_DOMAIN = 'tu-dominio-real.com'` y luego `docker compose up -d --build`.

Caddy expone 80/443 y solicita HTTPS. El contenedor de la app no expone el puerto 4173 a internet. Si la subred 172.30.240.0/24 ya está ocupada, ajusta sus direcciones y TRUST_PROXY_IP en compose.yml. No configures varios servidores de aplicación detrás del balanceador: esta edición usa SQLite y eventos en una única instancia.

También puedes usar Node.js 24 en un servidor con proxy HTTPS: ejecuta `npm start` en este repo. Ajusta TRUST_PROXY_IP a la dirección exacta del proxy o desactiva TRUST_PROXY si el servidor recibe las peticiones directamente. Protege el puerto y la carpeta de datos.

## Administración y primeros usuarios

La base se crea vacía al iniciar. El secreto administrativo lo genera la configuración local. Abre `https://tu-dominio/administracion.html` y usa el valor MANDADITO_ADMIN_TOKEN guardado en tu servidor. No lo compartas con clientes ni lo incluyas en la aplicación móvil.

Configura tarifa y lluvia, contacto para repartidores, mapas y publicaciones. Los comercios se registran desde su cuenta; revisa y autoriza su publicación antes de que sean visibles. Los repartidores presentan su solicitud y administración la aprueba. Cada usuario verifica su teléfono y carga su propia foto. No existen cuentas autorizadas precargadas.

## Copias de seguridad

Puedes crear una copia consistente con `npm run backup -- ruta/mandadito.sqlite ruta/copia.sqlite`. Guarda las copias fuera del directorio servido por HTTP y define una política de renovación. Para restaurar, detén la app, conserva una copia de la base actual y restaura el archivo verificado. No borres el volumen de Docker para actualizar código; contiene tus registros.

La eliminación de una cuenta retira sus datos personales del sistema activo. El responsable debe gestionar también las copias retenidas, solicitudes de soporte y periodos de conservación antes de publicar la captación.
