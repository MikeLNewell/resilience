import {doc,getDoc,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
export const heatingDefaults={kw:5,efficiency:81,hours:4,days:4,weeks:22,reserve:20,energy:4.1,density:425,looseDensity:275,bagKg:10,price:.4};
export function heatingMath(s,batches,uses){
 const measured=uses.reduce((a,u)=>({kg:a.kg+u.kg,hours:a.hours+u.hours}),{kg:0,hours:0});
 const hourly=measured.hours>=8?measured.kg/measured.hours:s.kw/(s.energy*s.efficiency/100);
 const evening=hourly*s.hours,weekly=evening*s.days,target=weekly*s.weeks*(1+s.reserve/100);
 const usable=batches.filter(b=>b.moisture<=20&&b.moisture>0).reduce((a,b)=>a+b.kg,0);
 return {hourly,evening,weekly,target,usable,seasoning:batches.reduce((a,b)=>a+b.kg,0)-usable,shortfall:Math.max(0,target-usable),evenings:usable/evening,measured:measured.hours>=8};
}
export function woodKg(q,unit,factor){return unit==='kg'?q:q*factor}
export function createWood({db,getUser,safe,money,say}){
 let state={settings:{...heatingDefaults},batches:[],uses:[]},uid='',ready=false,editing='',busy=false;
 const $=i=>document.getElementById(i),n=(v,d=1)=>Number(v).toFixed(d);
 const ref=u=>doc(db,'households',u,'heating','wood');
 const redraw=()=>document.querySelector('[data-tab="wood"]')?.click();
 const fresh=d=>({settings:{...heatingDefaults,...d?.settings},batches:Array.isArray(d?.batches)?d.batches:[],uses:Array.isArray(d?.uses)?d.uses:[]});
 async function load(){
  const u=getUser()?.uid;if(!u)return;
  if(uid!==u){uid=u;state=fresh();ready=false;editing=''}
  try{const snap=await getDoc(ref(u));if(getUser()?.uid!==u)return;state=fresh(snap.exists()?snap.data():null);ready=true}
  catch(e){if(getUser()?.uid===u){ready=false;say('Wood stock could not load: '+e.message,'error')}}
  if(getUser()?.uid===u)redraw();
 }
 function reset(){uid='';ready=false;editing='';state=fresh()}
 async function mutate(fn){
  if(busy||!ready||getUser()?.uid!==uid)return;
  busy=true;const u=uid;
  try{state=await runTransaction(db,async tx=>{const r=ref(u),snap=await tx.get(r),d=fresh(snap.exists()?snap.data():null);fn(d);tx.set(r,{...d,updatedAt:serverTimestamp()});return d});editing='';say('Wood stock saved','success')}
  catch(e){say(e.code==='permission-denied'?'Publish the updated Firestore rules to enable wood stock.':e.message,'error')}
  finally{busy=false;if(getUser()?.uid===u)redraw()}
 }
 const fields=[['kw','Average stove output (kW)',1,12,.1],['efficiency','Efficiency (%)',40,95,1],['hours','Hours per evening',.5,24,.5],['days','Evenings per week',1,7,1],['weeks','Heating season (weeks)',1,52,1],['reserve','Reserve (%)',0,100,5],['energy','Fuel energy (kWh/kg)',2,5,.1],['density','Stacked kg/m³',100,900,5],['looseDensity','Loose kg/m³',100,700,5],['bagKg','Default kg per bag',1,100,.1],['price','Budget price (£/kg)',0,10,.01]];
 function render(){
  const s=state.settings,m=heatingMath(s,state.batches,state.uses),b=state.batches.find(x=>x.id===editing);
  const metric=(label,value)=>'<div class="metric"><small>'+label+'</small><div class="value">'+value+'</div></div>';
  const input=(id,label,value,min,max,step)=>'<label>'+label+'<input id="'+id+'" type="number" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'" required></label>';
  return '<section class="card"><h2>Varde Aura 1</h2><p>Working assumption: 5 kW nominal output and 81% efficiency. Confirm against your stove rating plate. Fuel estimates describe stove operation, not whole-house heat demand.</p><p class="muted">Dry untreated wood only; check moisture on a freshly split face. Stock with unknown moisture or above 20% is excluded from usable reserves.</p><div class="grid">'+metric('Seasonal target',Math.ceil(m.target)+' kg')+metric('Dry usable stock',n(m.usable)+' kg')+metric('Heating evenings left',n(m.evenings,0))+metric('Additional dry wood',Math.ceil(m.shortfall)+' kg')+'</div><progress class="progress" max="'+Math.max(1,m.target)+'" value="'+Math.min(m.target,m.usable)+'"></progress><p>Burn rate '+n(m.hourly,2)+' kg/h · '+n(m.evening)+' kg/evening · '+n(m.weekly)+' kg/week · '+(m.measured?'based on recorded consumption':'theoretical estimate')+'</p><p>Seasoning / unknown moisture: '+n(m.seasoning)+' kg. Target equivalent: '+n(m.target/s.density,2)+' stacked m³ / '+n(m.target/s.looseDensity,2)+' loose m³ / '+Math.ceil(m.target/s.bagKg)+' bags. Estimated seasonal budget: '+money(m.target*s.price)+'.</p></section>'+
  '<section class="card"><h2>Heating settings</h2><form id="woodSettings" class="row">'+fields.map(f=>input('wood-'+f[0],f[1],s[f[0]],f[2],f[3],f[4])).join('')+'<button>Save heating settings</button></form><p class="muted">Volume-to-weight conversions are adjustable estimates. Use actual delivered weight when available.</p></section>'+
  (!ready?'<section class="card"><p>Wood storage is not available yet. Try loading it again or publish the latest database rules.</p><button id="woodLoad">Load wood stock</button></section>':
  '<section class="card"><h2>'+(b?'Edit wood batch':'Record wood delivery / existing stock')+'</h2><form id="woodBatch" class="row"><label>Source / description<input id="woodName" maxlength="100" required value="'+safe(b?.name||'')+'"></label><label>Wood type<select id="woodType">'+['Hardwood','Softwood','Mixed','Unknown'].map(x=>'<option '+(b?.type===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+input('woodQty','Quantity',b?.qty||1,.01,100000,.01)+'<label>Unit<select id="woodUnit">'+['kg','bags','stacked m³','loose m³'].map(x=>'<option '+(b?.unit===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+input('woodFactor','kg per bag or m³ (ignored for kg)',b?.factor||s.bagKg,.01,1000,.01)+input('woodMoisture','Moisture % (0 = unknown)',b?.moisture??0,0,80,.1)+input('woodCost','Total paid (£)',b?.cost??0,0,100000,.01)+'<button>'+ (b?'Save batch changes':'Add wood batch')+'</button>'+(b?'<button type="button" id="woodCancel" class="secondary">Cancel edit</button>':'')+'</form></section>'+
  '<section class="card"><h2>Firewood stock</h2>'+(state.batches.length?state.batches.map(x=>'<div class="item"><div class="item-name"><strong>'+safe(x.name)+'</strong><small>'+safe(x.type)+' · '+n(x.qty,2)+' '+safe(x.unit)+' · '+n(x.kg)+' kg remaining · '+(x.moisture?x.moisture+'% moisture':'moisture unknown')+'</small><small>Paid '+money(x.cost)+' · '+money(x.cost/(x.originalKg||x.kg))+'/kg at purchase</small></div><div class="row"><button class="secondary" data-wood-edit="'+safe(x.id)+'">Edit</button><button class="secondary" data-wood-delete="'+safe(x.id)+'">Delete</button></div></div>').join(''):'<p>No batches recorded.</p>')+'</section>'+
  '<section class="card"><h2>Record wood used</h2><form id="woodUse" class="row">'+input('woodUsed','Wood burned (kg)',6,.01,1000,.01)+input('woodHours','Burn duration (hours)',s.hours,.1,24,.1)+'<button>Record consumption</button></form><p class="muted">Deducts from dry batches, oldest first. After eight recorded hours the calculator uses measured consumption.</p><h3>Recent consumption</h3>'+state.uses.slice(-10).reverse().map(x=>'<p>'+safe(x.date)+' · '+n(x.kg)+' kg · '+n(x.hours)+' hours</p>').join('')+'</section>');
 }
 function bind(){
  if(!$('woodSettings'))return;
  if(!ready){$('woodSettings').querySelector('button').disabled=true;$('woodLoad').onclick=load;return}
  $('woodSettings').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(fields.map(f=>[f[0],$('wood-'+f[0]).valueAsNumber]));if(fields.some(f=>!Number.isFinite(v[f[0]])||v[f[0]]<f[2]||v[f[0]]>f[3]))return;mutate(d=>{d.settings=v})};
  $('woodUnit').onchange=()=>{$('woodFactor').value=({'kg':1,'bags':state.settings.bagKg,'stacked m³':state.settings.density,'loose m³':state.settings.looseDensity})[$('woodUnit').value]};
  $('woodBatch').onsubmit=e=>{e.preventDefault();const qty=$('woodQty').valueAsNumber,unit=$('woodUnit').value,factor=$('woodFactor').valueAsNumber,kg=woodKg(qty,unit,factor),cost=$('woodCost').valueAsNumber,moisture=$('woodMoisture').valueAsNumber,name=$('woodName').value.trim(),type=$('woodType').value;
   if(!name||name.length>100||![kg,cost,moisture].every(Number.isFinite)||kg<=0||kg>1000000||cost<0||moisture<0||moisture>80)return;
   const key=editing||crypto.randomUUID();mutate(d=>{const old=d.batches.find(x=>x.id===key);if(editing&&!old)throw Error('Batch no longer exists.');if(!old&&d.batches.length>=100)throw Error('Maximum 100 batches.');const record={id:key,name,type,qty,unit,factor,kg,originalKg:old?Math.max(kg,(old.originalKg||old.kg)+kg-old.kg):kg,cost,moisture,date:old?.date||new Date().toISOString().slice(0,10)};d.batches=old?d.batches.map(x=>x.id===key?record:x):[...d.batches,record]});
  };
  if($('woodCancel'))$('woodCancel').onclick=()=>{editing='';redraw()};
  document.querySelectorAll('[data-wood-edit]').forEach(x=>x.onclick=()=>{editing=x.dataset.woodEdit;redraw();$('woodBatch')?.scrollIntoView({block:'start'})});
  document.querySelectorAll('[data-wood-delete]').forEach(x=>x.onclick=()=>{if(confirm('Remove this wood batch from stock?'))mutate(d=>{d.batches=d.batches.filter(b=>b.id!==x.dataset.woodDelete)})});
  $('woodUse').onsubmit=e=>{e.preventDefault();const kg=$('woodUsed').valueAsNumber,hours=$('woodHours').valueAsNumber;if(!Number.isFinite(kg)||kg<=0||!Number.isFinite(hours)||hours<=0)return;
   mutate(d=>{if(d.batches.filter(b=>b.moisture>0&&b.moisture<=20).reduce((a,b)=>a+b.kg,0)+1e-8<kg)throw Error('Not enough confirmed dry stock.');let left=kg;for(const b of d.batches){if(b.moisture<=0||b.moisture>20||left<=0)continue;const take=Math.min(left,b.kg);b.kg-=take;b.qty=b.unit==='kg'?b.kg:b.kg/b.factor;left-=take}d.batches=d.batches.filter(b=>b.kg>1e-8);d.uses=[...d.uses,{kg,hours,date:new Date().toISOString().slice(0,10)}].slice(-365)});
  };
 }
 return {render,bind,load,reset,isLoaded:()=>ready&&uid===getUser()?.uid};
}
