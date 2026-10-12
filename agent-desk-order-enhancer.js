const API_BASE='https://rmc-web-solutions-api-staging.onrender.com';
const apiUrl=path=>API_BASE+path;

const params=new URLSearchParams(window.location.search);
if(params.get('admin')==='1'){
 const SESSION_KEY='rmc-project-admin-session';
 const names={portfolio:'Portfolio',trust:'Trust / proof',reviews:'Utisci',about:'O nama',faq:'FAQ',booking:'Zakazivanje',location:'Lokacija',contact:'Kontakt'};
 const byName=Object.fromEntries(Object.entries(names).map(([id,label])=>[label,id]));
 const defaults=Object.keys(names);
 let savedOrder=[],savedSiteId='',working=false,timer=0;

 const token=()=>sessionStorage.getItem(SESSION_KEY)||'';
 const siteId=()=>document.querySelector('.rmc-agent-head p strong')?.textContent?.trim()||'';
 const editor=()=>document.querySelector('.rmc-agent-module-editor');
 const moduleId=section=>byName[section.querySelector(':scope > button span')?.textContent?.trim()]||'';
 const sections=()=>[...(editor()?.querySelectorAll(':scope > .rmc-agent-module')||[])];
 const selected=()=>sections().map(moduleId).filter(id=>defaults.includes(id));
 const normalize=(value,allowed=selected())=>{
  const set=new Set(allowed),seen=new Set(),result=[];
  for(const id of Array.isArray(value)?value:[])if(set.has(id)&&!seen.has(id)){seen.add(id);result.push(id);}
  for(const id of defaults)if(set.has(id)&&!seen.has(id)){seen.add(id);result.push(id);}
  return result;
 };
 const status=(text,isError=false)=>{
  const host=editor();if(!host)return;
  let node=host.querySelector('.rmc-agent-order-status');
  if(!node){node=document.createElement('small');node.className='rmc-agent-order-status';host.querySelector('h4')?.after(node);}
  node.textContent=text||'';node.dataset.error=isError?'1':'0';
 };
 const css=()=>{
  if(document.getElementById('rmc-agent-order-css'))return;
  const style=document.createElement('style');style.id='rmc-agent-order-css';style.textContent=`
   .rmc-agent-module-editor{display:flex!important;flex-direction:column!important}
   .rmc-agent-module-editor>h4{order:-10000}
   .rmc-agent-order-status{order:-9999;display:block;min-height:18px;margin:-5px 0 10px;color:#5a6b7f}
   .rmc-agent-order-status[data-error="1"]{color:#a12a2a}
   .rmc-agent-order-controls{display:flex;gap:6px;justify-content:flex-end;margin:-46px 46px 10px 0;position:relative;z-index:2;pointer-events:none}
   .rmc-agent-order-controls button{pointer-events:auto;width:34px;height:32px;border:1px solid #ccd7e4;border-radius:8px;background:#fff;color:#17304f;font-weight:900;cursor:pointer}
   .rmc-agent-order-controls button:disabled{opacity:.28;cursor:not-allowed}
  `;document.head.append(style);
 };
 const arrange=()=>{
  const host=editor();if(!host)return;
  const order=normalize(savedOrder),all=sections();
  let fixedIndex=0;
  for(const section of all){
   const id=moduleId(section);
   if(defaults.includes(id))section.style.order=String(100+Math.max(0,order.indexOf(id)));
   else section.style.order=String(fixedIndex++);
  }
  const current=normalize(savedOrder);
  for(const section of all){
   const id=moduleId(section);if(!defaults.includes(id))continue;
   let controls=section.querySelector(':scope > .rmc-agent-order-controls');
   if(!controls){controls=document.createElement('div');controls.className='rmc-agent-order-controls';controls.innerHTML='<button type="button" data-move="-1" aria-label="Pomeri modul gore">↑</button><button type="button" data-move="1" aria-label="Pomeri modul dole">↓</button>';section.querySelector(':scope > button')?.after(controls);}
   const index=current.indexOf(id),buttons=controls.querySelectorAll('button');
   buttons[0].disabled=working||index<=0;buttons[1].disabled=working||index<0||index>=current.length-1;
  }
 };
 const refreshPreview=()=>{
  const scope=document.querySelector('.rmc-agent-personalization:not([hidden])')||document;
  const button=[...scope.querySelectorAll('button')].find(node=>node.textContent.trim()==='Osveži preview');
  button?.click();
 };
 const load=async()=>{
  const id=siteId();if(!id||id===savedSiteId||!token())return;
  savedSiteId=id;
  try{
   const response=await fetch(apiUrl(`/api/admin/projects/${encodeURIComponent(id)}`),{headers:{Authorization:`Bearer ${token()}`}}),data=await response.json();
   if(!response.ok)throw new Error(data.error||'Redosled modula nije učitan.');
   savedOrder=Array.isArray(data.project?.siteConfig?.presentation?.moduleOrder)?data.project.siteConfig.presentation.moduleOrder:[];
   status(savedOrder.length?'Redosled modula je učitan.':'Koristi se postojeći redosled dok prvi put ne pomerite modul.');arrange();
  }catch(error){status(error.message,true);}
 };
 const save=async(next)=>{
  const id=siteId();if(!id||!token()||working)return;
  working=true;savedOrder=next;arrange();status('Čuvam redosled…');
  try{
   const response=await fetch(apiUrl(`/api/admin/projects/${encodeURIComponent(id)}/module-order`),{method:'PUT',headers:{Authorization:`Bearer ${token()}`,'Content-Type':'application/json'},body:JSON.stringify({moduleOrder:next})}),data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||`Redosled modula nije sačuvan (${response.status}).`);
   savedOrder=data.project?.siteConfig?.presentation?.moduleOrder||next;status('Redosled je sačuvan.');arrange();refreshPreview();
  }catch(error){status(error.message,true);}finally{working=false;arrange();}
 };
 const click=event=>{
  const button=event.target.closest('.rmc-agent-order-controls button');if(!button)return;
  event.preventDefault();event.stopPropagation();
  const section=button.closest('.rmc-agent-module'),id=moduleId(section),order=normalize(savedOrder),index=order.indexOf(id),to=index+Number(button.dataset.move);
  if(index<0||to<0||to>=order.length)return;
  [order[index],order[to]]=[order[to],order[index]];save(order);
 };
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{css();load();arrange();},40);};
 document.addEventListener('click',click,true);
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
 schedule();
}
