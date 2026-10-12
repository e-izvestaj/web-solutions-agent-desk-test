(()=>{
  const FIELD_NAMES=new Set(['Nadnaslov','Naslov','Opis','Tekst dugmeta','Link dugmeta']);
  const clean=()=>{
    const labels=[...document.querySelectorAll('label')];
    for(const label of labels){
      const own=[...label.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent.trim()).join(' ').trim();
      if(!FIELD_NAMES.has(own)) continue;
      let scope=label.parentElement;
      let bookingScope=null;
      for(let i=0;scope&&i<8;i++,scope=scope.parentElement){
        const text=scope.textContent||'';
        if(text.includes('Zakazivanje')&&text.includes('Tekst dugmeta')&&text.includes('Link dugmeta')){bookingScope=scope;break;}
      }
      if(bookingScope) label.remove();
    }
  };
  const start=()=>{
    clean();
    const observer=new MutationObserver(clean);
    observer.observe(document.body,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
