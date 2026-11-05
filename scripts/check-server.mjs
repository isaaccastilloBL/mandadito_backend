import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {validateProduction} from '../production.mjs';
// Comprueba la configuración de producción del servidor. Lee .env si existe; si no, usa las variables del entorno (útil en Railway: `railway run npm run check`).
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),envPath=path.join(root,'.env'),errors=[];let env={...process.env};
if(fs.existsSync(envPath)){for(let line of fs.readFileSync(envPath,'utf8').split(/\r?\n/)){let m=/^([A-Z_]+)=(.*)$/.exec(line);if(m)env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}}else if(!env.PUBLIC_ORIGIN)errors.push('Crear .env con npm run configure o definir las variables en el entorno');
try{validateProduction({...env,NODE_ENV:'production'})}catch(e){errors.push(...e.message.split('\n'))}
if(!env.FCM_SERVICE_ACCOUNT_FILE&&!env.FCM_SERVICE_ACCOUNT_JSON)errors.push('Configurar FCM_SERVICE_ACCOUNT_FILE o FCM_SERVICE_ACCOUNT_JSON');
if(!env.APNS_KEY_FILE&&!env.APNS_KEY)errors.push('Configurar APNS_KEY_FILE o APNS_KEY');
for(let key of ['APNS_KEY_ID','APPLE_TEAM_ID','APP_ID'])if(!env[key])errors.push('Configurar '+key);
console.log(errors.length?'SERVIDOR NO LISTO PARA PRODUCCIÓN':'Configuración del servidor completa.');for(let e of errors)console.log('- '+e);process.exitCode=errors.length?1:0;
