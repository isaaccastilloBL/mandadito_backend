// Local pilot approval tool. Run only on the operator's machine; do not expose as a web endpoint.
import {DatabaseSync} from 'node:sqlite';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const dbPath=path.join(process.env.MANDADITO_DATA_DIR||path.join(root,'data'),'mandadito.sqlite');
if(!fs.existsSync(dbPath)){console.error('No existe la base de datos en esta carpeta. Inicia Mandadito y registra tu cuenta primero.');process.exit(1)}
const db=new DatabaseSync(dbPath);
const [command,id]=process.argv.slice(2);
if(command==='list'){
 const rows=db.prepare("SELECT a.id,a.role,a.status,u.name,u.email,u.phone,u.verified_phone FROM applications a JOIN users u ON u.id=a.user_id WHERE a.status='pending' ORDER BY a.created_at").all();
 console.table(rows);
}else if(command==='approve'&&id){
 const a=db.prepare("SELECT a.*,u.verified_phone FROM applications a JOIN users u ON u.id=a.user_id WHERE a.id=?").get(id);
 if(!a||a.status!=='pending'||!a.verified_phone){console.error('No hay una solicitud pendiente con teléfono verificado.');process.exitCode=1}
 else{db.prepare("UPDATE applications SET status='approved',reviewed_at=? WHERE id=?").run(new Date().toISOString(),id);db.prepare('INSERT INTO audit VALUES(?,?,?,?,?)').run(randomBytes(16).toString('hex'),'operator','application_approved',id,new Date().toISOString());console.log('Solicitud aprobada:',id,a.role)}
}else if(command==='approve-email'&&id){
 const email=id.trim().toLowerCase();
 const u=db.prepare('SELECT id,name,email,verified_phone FROM users WHERE email=?').get(email);
 if(!u){console.error('No existe la cuenta '+email+' en esta base de datos. Regístrala en esta instalación primero.');process.exitCode=1}
 else if(!u.verified_phone||!db.prepare('SELECT 1 FROM profile_photos WHERE user_id=?').get(u.id)){console.error('Primero confirma el teléfono y carga la foto de perfil de '+email+'.');process.exitCode=1}
 else{
  const existing=db.prepare('SELECT id,status FROM applications WHERE user_id=? AND role=?').get(u.id,'courier');
  if(existing?.status==='rejected'){console.error('La solicitud anterior fue rechazada; requiere revisión manual.');process.exitCode=1}
  else{
   const now=new Date().toISOString();
   db.prepare("INSERT INTO applications(id,user_id,role,status,active,created_at,reviewed_at) VALUES(?,?,?,'approved',0,?,?) ON CONFLICT(user_id,role) DO UPDATE SET status='approved',reviewed_at=excluded.reviewed_at").run(randomBytes(16).toString('hex'),u.id,'courier',now,now);
   db.prepare('INSERT INTO audit VALUES(?,?,?,?,?)').run(randomBytes(16).toString('hex'),'operator','application_approved_email',u.id,now);
   console.log('Repartidor autorizado para '+u.email+'. Inicia sesión y activa el switch en Cuenta > Trabaja con Mandadito.');
  }
 }
}else{console.log('Uso: node admin.mjs list | node admin.mjs approve ID | node admin.mjs approve-email correo@example.com')}
db.close();
