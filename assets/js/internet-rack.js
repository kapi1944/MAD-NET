// Internet — przeniesiony podgląd technologii, bez mechaniki przewodów.
(() => {
 const przyciski=[...document.querySelectorAll('[data-rack-technologia]')];
 const panel=document.getElementById('hero-opis-technologii');
 if(!panel)return;
 document.querySelectorAll('.rack-internetu [data-technologia-kanalu]').forEach((kanal,numer)=>{
  const predkosc=Number(kanal.querySelector('title').textContent.match(/(\d+) Mbit/)[1]);
  kanal.style.setProperty('--tempo',`${2.4/(1+Math.log2(predkosc/10))}s`);
  kanal.style.setProperty('--faza',`${-numer*.19}s`);
 });
 const opisy={
  LAN:['LAN / Ethernet','Transmisja kablem miedzianym. Złącza RJ-45.'],
  FIBER:['FIBER / Światłowód','Transmisja światłem. Zielone złącza SC/APC Simplex, polerowanie 8°.'],
  AIR:['AIR / Radio','Transmisja radiowa. Bez kabla pomiędzy punktami radiowymi.']
 };
 function pokazTechnologie(technologia){
  przyciski.forEach(przycisk=>przycisk.setAttribute('aria-pressed',String(przycisk.dataset.rackTechnologia===technologia)));
  panel.dataset.technologia=technologia;
  panel.getAnimations().forEach(animacja=>animacja.cancel());
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches)panel.animate([{opacity:.45},{opacity:1}],{duration:180});
  panel.querySelector('strong').textContent=opisy[technologia][0];
  panel.querySelector('p').textContent=opisy[technologia][1];
  const link=panel.querySelector('a');
  link.href=`./cennik.html?technologia=${technologia}#cennik`;
  link.firstChild.textContent=`Poznaj pakiety ${technologia} `;
 }
 przyciski.forEach(przycisk=>{
  przycisk.addEventListener('click',()=>pokazTechnologie(przycisk.dataset.rackTechnologia));
  przycisk.addEventListener('focus',()=>pokazTechnologie(przycisk.dataset.rackTechnologia));
  przycisk.addEventListener('pointerenter',zdarzenie=>{
   if(zdarzenie.pointerType==='mouse'&&matchMedia('(hover:hover) and (pointer:fine)').matches)pokazTechnologie(przycisk.dataset.rackTechnologia);
  });
 });
})();
