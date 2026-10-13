const params=new URLSearchParams(window.location.search);
if(params.get('admin')==='1'){
 const CONFIG_ID='commerce-order-form-config';
 const TRANSPORT_KEY='rmc-agent-form-transport:';
 const currentSiteId=()=>document.querySelector('.rmc-agent-head p strong')?.textContent?.trim()||'';
 const mode=()=>localStorage.getItem(TRANSPORT_KEY+currentSiteId())==='manual'?'manual':'portal';
 const manualDialog=`<dialog id="requestDialog" class="site-dialog service-dialog" aria-label="Pripremljen zahtev"><button class="dialog-close" type="button" data-close aria-label="Zatvori">×</button><div class="dialog-pad"><div class="kicker">ZAHTEV ZA TERMIN</div><h2>Poruka je spremna</h2><p>Zahtev još nije poslat. Izaberite kanal komunikacije.</p><pre id="requestMessage"></pre><div class="dialog-actions"><button id="copyRequest" class="primary" type="button">Kopiraj zahtev</button><a id="viberRequest" class="secondary" rel="noopener noreferrer" target="_blank">Viber</a><a id="waRequest" class="secondary" rel="noopener noreferrer" target="_blank">WhatsApp</a></div><p class="hint">Viber može skratiti dugu poruku. Potpun zahtev je dostupan preko dugmeta Kopiraj. Termin nije automatski potvrđen.</p><p id="copyRequestStatus" role="status"></p></div></dialog>`;
 const makeManual=html=>{
  if(typeof html!=='string'||!html.includes('id="requestForm"'))return html;
  html=html.replace(/Izaberite željeni termin\. Nakon objavljivanja i povezivanja sajta, zahtev se šalje firmi ([^<]+) preko Business Portala\. Termin nije potvrđen dok vam firma ne odgovori\./g,'Izaberite željeni termin. Zahtev pripremamo kao poruku koju možete poslati firmi $1 preko WhatsApp-a, Vibera ili kopiranjem teksta. Termin nije potvrđen dok vam firma ne odgovori.');
  html=html.replace(/<dialog id="requestDialog"[\s\S]*?<\/dialog>/i,manualDialog);
  html=html.replace(/"formTransport":"(?:portal|manual)"/,'"formTransport":"manual"');
  return html;
 };
 const sanitizeBody=init=>{
  if(!init?.body||typeof init.body!=='string')return init;
  let body;try{body=JSON.parse(init.body)}catch{return init;}
  const rows=body?.content?.customSections;
  if(Array.isArray(rows))body.content.customSections=rows.filter(row=>{
   if(row?.id!==CONFIG_ID)return true;
   return Array.isArray(row?.form?.fields)&&row.form.fields.length>0;
  });
  return {...init,body:JSON.stringify(body)};
 };
 const nativeFetch=window.fetch.bind(window);
 window.fetch=async(input,init)=>{
  const raw=typeof input==='string'?input:input?.url||'';
  const preview=/\/api\/admin\/projects\/[^/]+\/preview(?:\?|$)/.test(raw);
  const content=/\/api\/admin\/projects\/[^/]+\/content(?:\?|$)/.test(raw);
  if(preview||content)init=sanitizeBody(init);
  const response=await nativeFetch(input,init);
  if(!preview||mode()!=='manual'||!response.ok)return response;
  try{
   const data=await response.clone().json();
   if(data?.html)data.html=makeManual(data.html);
   const headers=new Headers(response.headers);headers.set('Content-Type','application/json; charset=utf-8');
   return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers});
  }catch{return response;}
 };
 const arrange=()=>{
  const personalization=document.querySelector('.rmc-agent-personalization');
  const grid=personalization?.querySelector('.rmc-agent-personalization-grid');
  const transport=document.querySelector('.rmc-agent-transport');
  if(personalization&&grid&&transport&&transport.parentElement!==personalization){
   transport.classList.add('rmc-agent-transport-personalization');
   grid.before(transport);
  }
  if(personalization){
   [...personalization.querySelectorAll('.rmc-agent-preview header button')].forEach(button=>{
    if(button.textContent.trim().startsWith('Review i finalni paket'))button.hidden=true;
   });
  }
 };
 let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(arrange,30)};
 document.addEventListener('change',event=>{
  if(event.target.matches('input[name="rmc-form-transport"]')){
   setTimeout(()=>{
    arrange();
    const personalization=document.querySelector('.rmc-agent-personalization:not([hidden])');
    const refresh=[...(personalization?.querySelectorAll('button')||[])].find(button=>button.textContent.trim()==='Osveži preview');
    refresh?.click();
   },60);
  }
 },true);
 new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
 schedule();
}
