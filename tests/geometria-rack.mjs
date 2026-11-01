// Funkcja jest wykonywana w stronie przez Playwright; mierzy rzeczywiste SVG i obszary trafienia.
export function zmierzKanalyRack(){
 const rysunek=document.querySelector('.grafika-hybrydowa');
 const oczekiwane={LAN:[10,20,40,60,80],FIBER:[50,100,300],AIR:[10,20,40,60,80]};
 const adaptery=[...rysunek.querySelectorAll('.adapter-szafy-fiber')];
 const liczniki={LAN:0,FIBER:0,AIR:0};
 return [...rysunek.querySelectorAll('[data-technologia-kanalu]')].map(kanal=>{
  const technologia=kanal.dataset.technologiaKanalu;
  const numer=liczniki[technologia]++;
  const predkosc=Number(kanal.dataset.speed);
  const przycisk=document.querySelector(`[data-rack-tech="${technologia}"]`);
  const wycinek=kanal.querySelector('[clip-path]');
  const identyfikator=wycinek?.getAttribute('clip-path').match(/^url\(#([^)]+)\)$/)?.[1];
  const ksztalty=technologia==='AIR'?[document.getElementById(identyfikator)?.querySelector('rect')]:[kanal.querySelector('.dioda-link-szafy'),kanal.querySelector('.rj-link rect,.fiber-activity rect')];
  if(technologia==='FIBER')ksztalty.push(adaptery[numer]);
  const punkty=ksztalty.map(element=>{
   if(!element)return {blad:'Brak kształtu kanału'};
   const obrys=element.getBBox();
   // ClipPath ma współrzędne rysunku; adaptery i diody uwzględniają własne transformacje.
   const macierz=element.closest('clipPath')?rysunek.getScreenCTM():element.getScreenCTM();
   if(!macierz||!obrys.width||!obrys.height)return {blad:'Pusty obrys lub brak transformacji'};
   const punkt=new DOMPoint(obrys.x+obrys.width/2,obrys.y+obrys.height/2).matrixTransform(macierz);
   const trafiony=document.elementFromPoint(punkt.x,punkt.y);
   return {x:punkt.x,y:punkt.y,trafiony:!!przycisk&&przycisk.contains(trafiony)};
  });
  return {technologia,predkosc,numer,punkty,adaptery:adaptery.length,
   zgodny:oczekiwane[technologia]?.[numer]===predkosc&&punkty.length>0&&punkty.every(punkt=>punkt.trafiony===true)&& (technologia!=='FIBER'||adaptery.length===3)};
 });
}
