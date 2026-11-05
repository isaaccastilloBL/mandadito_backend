const fail=message=>{throw Object.assign(Error(message),{status:400})};
const cents=n=>Math.round(n*100);
const identifier=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,48}$/.test(v);
function label(v,description){if(typeof v!=='string'||v.trim().length<1||v.trim().length>60||/[\u0000-\u001f]/.test(v))fail('Revisa '+description);return v.trim()}
export function normalizeProductOptions(value){
 if(value===undefined)return {allowNote:true,groups:[]};
 if(!value||typeof value!=='object'||Array.isArray(value)||!Array.isArray(value.groups)||value.groups.length>6||(value.allowNote!==undefined&&typeof value.allowNote!=='boolean'))fail('Configura hasta 6 grupos de opciones');
 let groupIds=new Set();
 let groups=value.groups.map(g=>{if(!g||!identifier(g.id)||groupIds.has(g.id))fail('Identificador de grupo inválido o repetido');groupIds.add(g.id);let name=label(g.name,'el nombre del grupo');if(!Array.isArray(g.choices)||g.choices.length<1||g.choices.length>20)fail(name+': agrega entre 1 y 20 opciones');if(!Number.isInteger(g.min)||!Number.isInteger(g.max)||g.min<0||g.max<1||g.max>g.choices.length||g.min>g.max)fail(name+': revisa cuántas opciones debe elegir el cliente');let choiceIds=new Set();let choices=g.choices.map(c=>{if(!c||!identifier(c.id)||choiceIds.has(c.id))fail(name+': identificador de opción inválido o repetido');choiceIds.add(c.id);if(!Number.isFinite(c.price)||c.price<0||c.price>100000||(c.available!==undefined&&typeof c.available!=='boolean'))fail(name+': costo adicional inválido');return {id:c.id,name:label(c.name,'el nombre de la opción'),price:cents(c.price)/100,available:c.available!==false}});if(choices.filter(c=>c.available).length<g.min)fail(name+': deja suficientes opciones disponibles para completar la selección obligatoria');return {id:g.id,name,min:g.min,max:g.max,choices}});
 return {allowNote:value.allowNote!==false,groups};
}
export function priceOrderItems(store,lines){
 if(!Array.isArray(lines)||!lines.length||lines.length>30)fail('Agrega de 1 a 30 productos al pedido');
 let subtotalCents=0;
 let items=lines.map(line=>{
  if(!line||!Number.isInteger(line.qty)||line.qty<1||line.qty>30)fail('Cantidad inválida: de 1 a 30 por producto');
  let p=store.products.find(p=>p[0]===line.id);if(!p||p[6]===false)fail('Este producto ya no está disponible');
  let config=normalizeProductOptions(p[7]),requested=line.selections??[];
  if(!Array.isArray(requested)||requested.length>6)fail('Selección de opciones inválida');
  let chosen=new Map();for(let selected of requested){if(!selected||!identifier(selected.groupId)||chosen.has(selected.groupId)||!config.groups.some(g=>g.id===selected.groupId)||!Array.isArray(selected.choiceIds)||selected.choiceIds.length>20||selected.choiceIds.some(id=>!identifier(id))||new Set(selected.choiceIds).size!==selected.choiceIds.length)fail('Una opción del producto cambió o es inválida');chosen.set(selected.groupId,selected.choiceIds)}
  let extraCents=0,selections=config.groups.map(g=>{let ids=chosen.get(g.id)||[];if(ids.length<g.min||ids.length>g.max)fail(`${p[1]} · ${g.name}: elige ${g.min===g.max?g.min:'entre '+g.min+' y '+g.max} ${g.max===1?'opción':'opciones'}`);if(ids.some(id=>!g.choices.some(c=>c.id===id&&c.available)))fail(g.name+': una opción ya no está disponible');let choices=g.choices.filter(c=>ids.includes(c.id)).map(c=>{extraCents+=cents(c.price);return {id:c.id,name:c.name,price:c.price}});return {groupId:g.id,name:g.name,choices}}).filter(g=>g.choices.length);
  let note=line.note===undefined?'':line.note;if(typeof note!=='string'||note.trim().length>300||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(note))fail('La nota del producto debe tener hasta 300 caracteres');note=note.trim();if(note&&!config.allowNote)fail('Este producto no admite notas');
  let base=cents(p[3]),unit=base+extraCents;subtotalCents+=unit*line.qty;
  return {id:p[0],name:p[1],basePrice:base/100,optionsPrice:extraCents/100,price:unit/100,qty:line.qty,selections,note};
 });
 return {items,subtotal:subtotalCents/100};
}
