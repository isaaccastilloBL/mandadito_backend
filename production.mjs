export function validateProduction(env=process.env){
 if(env.NODE_ENV!=='production')return;
 let errors=[];try{let url=new URL(env.PUBLIC_ORIGIN);if(url.protocol!=='https:'||url.origin!==env.PUBLIC_ORIGIN||['localhost','127.0.0.1'].includes(url.hostname))throw Error()}catch{errors.push('PUBLIC_ORIGIN debe ser tu dominio HTTPS, sin ruta ni barra final')}
 for(let name of ['MANDADITO_ADMIN_TOKEN','OTP_SECRET'])if(!env[name]||env[name].length<32)errors.push(name+' requiere al menos 32 caracteres');
 if(env.DEV_OTP==='1')errors.push('DEV_OTP debe estar desactivado en producción');
 if(!smsConfigured(env))errors.push('Configura el proveedor SMS real antes de iniciar');
 if(!env.ROUTING_BASE_URL&&!env.MAPBOX_DIRECTIONS_TOKEN)errors.push('Configura un servicio de rutas para los envíos');
 if(errors.length)throw Error(errors.join('\n'));
}
export function smsConfigured(e=process.env){return !!((e.TWILIO_ACCOUNT_SID&&e.TWILIO_AUTH_TOKEN&&(e.TWILIO_MESSAGING_SERVICE_SID||e.TWILIO_FROM))||(e.SMS_VERIFY_WEBHOOK&&e.VERIFY_WEBHOOK_TOKEN))}
export async function deliverCode(destination,code,channel,env=process.env){
 if(channel==='sms'&&env.TWILIO_ACCOUNT_SID&&env.TWILIO_AUTH_TOKEN){let data=new URLSearchParams({To:destination,Body:`Tu código de Mandadito es ${code}. Vence en 10 minutos. No lo compartas.`});if(env.TWILIO_MESSAGING_SERVICE_SID)data.set('MessagingServiceSid',env.TWILIO_MESSAGING_SERVICE_SID);else data.set('From',env.TWILIO_FROM);let r=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_ACCOUNT_SID)}/Messages.json`,{method:'POST',headers:{authorization:'Basic '+Buffer.from(env.TWILIO_ACCOUNT_SID+':'+env.TWILIO_AUTH_TOKEN).toString('base64'),'content-type':'application/x-www-form-urlencoded'},body:data,signal:AbortSignal.timeout(10000)});if(!r.ok)throw Object.assign(Error('No se pudo enviar el SMS. Intenta más tarde.'),{status:502});return}
 let endpoint=channel==='whatsapp'?env.WHATSAPP_VERIFY_WEBHOOK:env.SMS_VERIFY_WEBHOOK;if(!endpoint||!env.VERIFY_WEBHOOK_TOKEN)throw Object.assign(Error('Este canal de verificación no está disponible'),{status:503});if(env.NODE_ENV==='production'&&new URL(endpoint).protocol!=='https:')throw Object.assign(Error('Configuración del proveedor inválida'),{status:503});let r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+env.VERIFY_WEBHOOK_TOKEN},body:JSON.stringify({destination,code,brand:'Mandadito'}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Object.assign(Error('No se pudo enviar el código'),{status:502});
}
export function requestPolicy(req,res){
 const origin=req.headers.origin,allowed=new Set([process.env.PUBLIC_ORIGIN,'capacitor://localhost','https://localhost','http://localhost']);
 if(process.env.NODE_ENV!=='production')allowed.add(`http://${req.headers.host}`);
 res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','strict-origin-when-cross-origin');res.setHeader('x-frame-options','DENY');
 if(origin&&!allowed.has(origin)){res.writeHead(403,{'content-type':'application/json'});res.end(JSON.stringify({error:'Origen no permitido'}));return false}
 if(origin){res.setHeader('access-control-allow-origin',origin);res.setHeader('vary','Origin');res.setHeader('access-control-allow-methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');res.setHeader('access-control-allow-headers','Authorization,Content-Type,X-Mandadito-Installation');}
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return false}return true;
}
