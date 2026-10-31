
/* V18: hover mouse, tap (without moving) or keyboard focus updates the right technology panel. */
(()=>{
 const rack=document.getElementById('hero-rack-stage');
 const panel=document.getElementById('hero-tech-panel');
 const content=document.getElementById('hero-tech-panel-content');
 if(!rack||!panel||!content)return;
 const options={
  LAN:{index:'01',icon:'▣',title:'LAN',subtitle:'kablowy',text:'Stabilne połączenie przewodowe Ethernet przez RJ-45. Pięć pakietów o prędkości od 10 do 80 Mbit/s.',count:'5 wariantów',socket:'RJ-45 / Ethernet'},
  FIBER:{index:'02',icon:'✦',title:'FIBER',subtitle:'światłowód',text:'Wydajne połączenie światłowodowe ze złączem SC/UPC Simplex. Trzy pakiety: 50, 100 i 300 Mbit/s.',count:'3 warianty',socket:'SC/UPC Simplex'},
  AIR:{index:'03',icon:'◉',title:'AIR',subtitle:'bezprzewodowy',text:'Internet radiowy bez konieczności doprowadzenia przewodu do budynku. Pięć pakietów od 10 do 80 Mbit/s — w zależności od lokalnych warunków.',count:'5 wariantów',socket:'Radio / RF'}
 };
 const reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
 let current='LAN',timer=0,transitionId=0;
 document.querySelectorAll('[data-hero-rack-logo]').forEach(img=>{
  const brand=document.querySelector('.brand img');
  if(brand&&brand.src)img.src=brand.src;
 });
 function apply(tech){
  const o=options[tech];
  panel.dataset.tech=tech; rack.dataset.currentTech=tech;
  document.getElementById('hero-tech-index').textContent=o.index;
  document.getElementById('hero-tech-icon').textContent=o.icon;
  document.getElementById('hero-tech-title').replaceChildren(document.createTextNode(o.title+' '),(()=>{const el=document.createElement('span');el.textContent='/ '+o.subtitle;return el})());
  document.getElementById('hero-tech-description').textContent=o.text;
  document.getElementById('hero-tech-count').textContent=o.count;
  document.getElementById('hero-tech-socket').textContent=o.socket;
  document.getElementById('hero-tech-link').firstChild.textContent='Zobacz pakiety '+tech+' ';
  document.getElementById('rack-current-label').textContent=tech+' · '+o.subtitle;
  rack.querySelectorAll('.rack-device').forEach(d=>{const active=d.dataset.rackTech===tech;d.classList.toggle('is-active',active);d.setAttribute('aria-pressed',String(active));});
  content.classList.remove('is-switching');
 }
 function show(tech){
  if(!Object.prototype.hasOwnProperty.call(options,tech))return;
  if(tech===current)return;
  const thisChange=++transitionId;clearTimeout(timer);
  current=tech;
  if(reduced.matches){apply(tech);return;}
  content.classList.add('is-switching');
  timer=setTimeout(()=>{if(thisChange===transitionId)apply(tech)},175);
 }
 for(const d of rack.querySelectorAll('.rack-device')){
  d.addEventListener('pointerenter',ev=>{if(ev.pointerType==='mouse'||ev.pointerType==='pen')show(d.dataset.rackTech)});
  let touchStart=null;
  d.addEventListener('pointerdown',ev=>{if(ev.pointerType==='touch')touchStart={x:ev.clientX,y:ev.clientY}});
  d.addEventListener('pointerup',ev=>{if(ev.pointerType!=='touch'||!touchStart)return; const dx=ev.clientX-touchStart.x,dy=ev.clientY-touchStart.y;touchStart=null;if(Math.hypot(dx,dy)<12)show(d.dataset.rackTech)});
  d.addEventListener('pointercancel',()=>{touchStart=null});
  d.addEventListener('focus',()=>show(d.dataset.rackTech));
  d.addEventListener('click',()=>show(d.dataset.rackTech));
 }
 document.getElementById('hero-tech-link').addEventListener('click',()=>{
  const target=document.querySelector('.device-tech-tabs button[data-technology="'+current+'"]');
  if(target)target.click();
 });
 apply(current);
})();
