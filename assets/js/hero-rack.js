
/* Panel zachowuje ostatni wybór myszy, dotyku lub klawiatury. */
(()=>{
 const szafa=document.getElementById('hero-rack-stage');
 const panel=document.getElementById('hero-tech-panel');
 const tresc=document.getElementById('hero-tech-panel-content');
 if(!szafa||!panel||!tresc)return;
 const warianty={
  LAN:{index:'01',icon:'▣',title:'LAN',subtitle:'kablowy',text:'Stabilne łącze Ethernet przez RJ-45. Prędkości od 10 do 80 Mbit/s.',count:'5 wariantów',socket:'RJ-45 / Ethernet'},
  FIBER:{index:'02',icon:'✦',title:'FIBER',subtitle:'światłowód',text:'Łącze światłowodowe SC/APC Simplex. Prędkości 50, 100 i 300 Mbit/s.',count:'3 warianty',socket:'SC/APC Simplex'},
  AIR:{index:'03',icon:'◉',title:'AIR',subtitle:'bezprzewodowy',text:'Internet radiowy bez przewodu do budynku. Od 10 do 80 Mbit/s, zależnie od lokalnych warunków.',count:'5 wariantów',socket:'Radio / bez gniazda'}
 };
 const ograniczonyRuch=window.matchMedia('(prefers-reduced-motion:reduce)');
 let aktualna='LAN',zegar=0,numerZmiany=0;
 document.querySelectorAll('[data-hero-rack-logo]').forEach(obraz=>{
  const marka=document.querySelector('.brand img');
  if(marka&&marka.src)obraz.src=marka.src;
 });
 function zastosuj(technologia){
  const wariant=warianty[technologia];
  panel.dataset.tech=technologia; szafa.dataset.currentTech=technologia;
  document.getElementById('hero-tech-index').textContent=wariant.index;
  document.getElementById('hero-tech-icon').textContent=wariant.icon;
  document.getElementById('hero-tech-title').replaceChildren(document.createTextNode(wariant.title+' '),(()=>{const element=document.createElement('span');element.textContent='/ '+wariant.subtitle;return element})());
  document.getElementById('hero-tech-description').textContent=wariant.text;
  document.getElementById('hero-tech-count').textContent=wariant.count;
  document.getElementById('hero-tech-socket').textContent=wariant.socket;
  document.getElementById('hero-tech-link').firstChild.textContent='Zobacz pakiety '+technologia+' ';
  document.getElementById('rack-current-label').textContent=technologia+' · '+wariant.subtitle;
  szafa.querySelectorAll('.rack-device').forEach(urzadzenie=>{const aktywny=urzadzenie.dataset.rackTech===technologia;urzadzenie.classList.toggle('is-active',aktywny);urzadzenie.setAttribute('aria-pressed',String(aktywny));});
  tresc.classList.remove('is-switching');
 }
 function pokaz(technologia){
  if(!Object.prototype.hasOwnProperty.call(warianty,technologia))return;
  if(technologia===aktualna)return;
  const taZmiana=++numerZmiany;clearTimeout(zegar);
  aktualna=technologia;
  if(ograniczonyRuch.matches||document.body.classList.contains('mot-off')){zastosuj(technologia);return;}
  tresc.classList.add('is-switching');
  zegar=setTimeout(()=>{if(taZmiana===numerZmiany)zastosuj(technologia)},175);
 }
 for(const urzadzenie of szafa.querySelectorAll('.rack-device')){
  urzadzenie.addEventListener('pointerenter',zdarzenie=>{if(zdarzenie.pointerType==='mouse'||zdarzenie.pointerType==='pen')pokaz(urzadzenie.dataset.rackTech)});
  let poczatekDotyku=null;
  urzadzenie.addEventListener('pointerdown',zdarzenie=>{if(zdarzenie.pointerType==='touch')poczatekDotyku={x:zdarzenie.clientX,y:zdarzenie.clientY}});
  urzadzenie.addEventListener('pointerup',zdarzenie=>{if(zdarzenie.pointerType!=='touch'||!poczatekDotyku)return; const roznicaX=zdarzenie.clientX-poczatekDotyku.x,roznicaY=zdarzenie.clientY-poczatekDotyku.y;poczatekDotyku=null;if(Math.hypot(roznicaX,roznicaY)<12)pokaz(urzadzenie.dataset.rackTech)});
  urzadzenie.addEventListener('pointercancel',()=>{poczatekDotyku=null});
  urzadzenie.addEventListener('focus',()=>pokaz(urzadzenie.dataset.rackTech));
  urzadzenie.addEventListener('click',()=>pokaz(urzadzenie.dataset.rackTech));
 }
 document.getElementById('hero-tech-link').addEventListener('click',()=>{
  const cel=document.querySelector('.device-tech-tabs button[data-technology="'+aktualna+'"]');
  if(cel)cel.click();
 });
 function zatrzymajPrzejscie(){
  if(ograniczonyRuch.matches||document.body.classList.contains('mot-off')){
   clearTimeout(zegar);
   zastosuj(aktualna);
  }
 }
 ograniczonyRuch.addEventListener('change',zatrzymajPrzejscie);
 document.getElementById('animation-toggle').addEventListener('click',zatrzymajPrzejscie);
 zastosuj(aktualna);

 // Mierzymy tylko szafę i kontener. Zapis geometrii panelu nie zmienia ich rozmiaru.
 const uklad=szafa.closest('.hero-in');
 const obudowa=szafa.querySelector('.rack-box');
 const sciana=szafa.querySelector('.tylna-krawedz')||szafa.querySelector('.rack-sidewall');
 let klatkaPomiaru=0;
 function dopasujPanel(){
  klatkaPomiaru=0;
  if(!window.matchMedia('(min-width:1231px)').matches)return;
  const granice=uklad.getBoundingClientRect();
  const tyl=sciana.getBoundingClientRect();
  const wymiary={
   '--panel-lewo':tyl.right-granice.left-34,
   '--panel-gora':tyl.top-granice.top+8,
   '--panel-wysokosc':tyl.height-16
  };
  for(const [nazwa,liczba] of Object.entries(wymiary)){
   const wartosc=liczba.toFixed(2)+'px';
   if(panel.style.getPropertyValue(nazwa)!==wartosc)panel.style.setProperty(nazwa,wartosc);
  }
 }
 function zaplanujPomiar(){
  if(!klatkaPomiaru)klatkaPomiaru=requestAnimationFrame(dopasujPanel);
 }
 const obserwator=new ResizeObserver(zaplanujPomiar);
 obserwator.observe(obudowa);
 obserwator.observe(uklad);
 window.addEventListener('resize',zaplanujPomiar,{passive:true});
 document.fonts.ready.then(zaplanujPomiar);
 zaplanujPomiar();
})();
