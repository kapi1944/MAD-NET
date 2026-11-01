'use strict';
// Wspólne modele SC/APC: jedna ferrula ceramiczna 2,5 mm, bez osłonki transportowej.
const definicjeSprzetuFiber = document.createElementNS('http://www.w3.org/2000/svg','svg');
definicjeSprzetuFiber.setAttribute('class','modele-sprzetu-fiber');
definicjeSprzetuFiber.setAttribute('aria-hidden','true');
definicjeSprzetuFiber.innerHTML=`<defs>
 <linearGradient id="sc-zielen" x1="0" y1="0" x2="1" y2=".35"><stop stop-color="#78b86a"/><stop offset=".22" stop-color="#4a9646"/><stop offset=".7" stop-color="#317b37"/><stop offset="1" stop-color="#20572b"/></linearGradient>
 <linearGradient id="sc-ceramika"><stop stop-color="#adb3aa"/><stop offset=".4" stop-color="#faf9ee"/><stop offset=".75" stop-color="#e6e7da"/><stop offset="1" stop-color="#a0a79e"/></linearGradient>
 <linearGradient id="sc-panel" x2="0" y2="1"><stop stop-color="#353a3d"/><stop offset=".22" stop-color="#202527"/><stop offset="1" stop-color="#101517"/></linearGradient>
 <linearGradient id="sc-tlo-opisu" gradientUnits="userSpaceOnUse" x1="270" x2="475"><stop stop-color="#cd5b13"/><stop offset="1" stop-color="#71391e"/></linearGradient>
 <symbol id="sc-apc-adapter" viewBox="0 0 48 40">
  <path d="M2 7h44v28H2z" fill="#1e4c29" stroke="#0f2819"/>
  <path d="M4 6h40v28H4z" fill="url(#sc-zielen)" stroke="#80b773" stroke-width=".7"/>
  <path d="M8 3h32l4 3H4z" fill="#79ac6a"/><path d="M40 3l4 3v28l-4-3z" fill="#245e2d"/>
  <path d="M10 9h28v23H10z" fill="#15391f" stroke="#91b887" stroke-width=".6"/>
  <path d="M13 11h22v19H13z" fill="#080f0b"/>
  <path d="M13 11h22l-3 4H16z" fill="#25452e"/><path d="M13 11v19l3-3V15z" fill="#3f6943"/>
  <path d="M20 11v3h8v-3M16 27h16" fill="none" stroke="#5c8060" stroke-width="1.2"/>
  <path d="M1 14h4v11H1zM43 14h4v11h-4z" fill="#67846a" stroke="#0d2718"/>
  <path d="M7 7v25M10 34h28" stroke="#9bc288" stroke-opacity=".4" fill="none"/>
 </symbol>
 <symbol id="sc-apc-zaslepka" viewBox="0 0 48 40">
  <path d="M12 10h24v22H12z" fill="#101815" stroke="#435148"/>
  <path d="M19 14h10v14H19z" fill="#27352c" stroke="#566257" stroke-width=".7"/>
  <path d="M20 15h8M14 11h20" stroke="#829183" stroke-opacity=".45"/>
 </symbol>
 <symbol id="sc-apc-konektor" viewBox="0 0 48 112">
  <path d="M20 2l8-1.125v12.125h-8z" fill="url(#sc-ceramika)" stroke="#929c8e" stroke-width=".6"/>
  <path d="M14 10h20v20H14z" fill="url(#sc-ceramika)" stroke="#c2c9b9"/>
  <path d="M6 17l4-5h28l4 5v39l-4 5H10l-4-5z" fill="url(#sc-zielen)" stroke="#204d28"/>
  <path d="M10 12h28l4 5H6z" fill="#8cba77"/><path d="M38 17h4v39l-4 5z" fill="#245b2c"/>
  <path d="M7 21h6v12H7zM35 21h6v12h-6z" fill="#d8dfce" stroke="#2b6233"/>
  <path d="M20 16h8v15l-2 3h-6z" fill="#78a961" stroke="#326b35"/>
  <path d="M21 16h6" stroke="#bdd5a3"/>
  <path d="M10 39h27M10 43h27M10 47h27M10 51h27M10 55h27" stroke="#245f2b" stroke-width="1.8"/>
  <path d="M10 38h27M10 42h27M10 46h27M10 50h27M10 54h27" stroke="#8fb97c" stroke-width=".8"/>
  <path d="M15 61h18l-4 35H19z" fill="url(#sc-zielen)" stroke="#255d30"/>
  <path d="M16 66h16M17 72h14M17 78h14M18 84h12M19 90h10" stroke="#194e27" stroke-width="2.8"/>
  <path d="M18 64l3 29" stroke="#a8c78c" stroke-width="1" opacity=".6"/>
  <path d="M24 96v16" stroke="#ad8735" stroke-width="8"/><path d="M24 96v16" stroke="#e7c66a" stroke-width="5"/>
 </symbol>
</defs>`;
document.body.prepend(definicjeSprzetuFiber);

function rysunekSprzetuFiber(nazwa,klasa=''){
 return `<svg class="${klasa}" viewBox="0 0 ${nazwa==='konektor'?'48 112':'48 40'}" aria-hidden="true"><use href="#sc-apc-${nazwa}"/></svg>`;
}
function adapterFiber(zZaslepka=true){
 return `<span class="sc-simplex" data-stan-polaczenia="IDLE" aria-hidden="true">${rysunekSprzetuFiber('adapter','sc-adapter')}${zZaslepka?rysunekSprzetuFiber('zaslepka','sc-zaslepka'):''}<span class="sc-wtyk-tor"><span class="sc-konektor">${rysunekSprzetuFiber('konektor')}<i class="sc-kabel-punkt"></i></span></span></span>`;
}
function gniazdoScienneFiber(){
 return `<span class="gniazdo-sc" aria-hidden="true"><span class="gniazdo-sc-ramka"><span class="gniazdo-sc-wklad">${adapterFiber(false)}</span><span class="sc-zawias"></span><span class="sc-pokrywa"><span></span></span></span><span class="gniazdo-sc-opis">SC/APC</span></span>`;
}

// HERO zachowuje bitmapę i jej perspektywę; zmieniamy wyłącznie panel adapterów FIBER.
const warstwaSzafyFiber=document.querySelector('.grafika-hybrydowa');
if(warstwaSzafyFiber){
 const panelFiber=document.createElementNS('http://www.w3.org/2000/svg','g');
 panelFiber.setAttribute('class','panel-sprzetu-fiber');
 panelFiber.innerHTML=`<path d="M603 492l250-3v78l-250 1z" fill="url(#sc-panel)" stroke="#4f5554"/>
  <path d="M610 498h236M610 563h236" stroke="#747e77" stroke-opacity=".25"/>
  ${[610,846].map(polozenie=>`<circle cx="${polozenie}" cy="530" r="3" fill="#121816" stroke="#67746b"/><path d="M${polozenie-1.5} 530h3" stroke="#9ca79b"/>`).join('')}
  ${[620,698,776].map(polozenie=>`<g class="adapter-szafy-fiber" transform="translate(${polozenie} 501) scale(1.3)"><use href="#sc-apc-adapter" width="48" height="40"/><use href="#sc-apc-zaslepka" width="48" height="40"/></g>`).join('')}
  <path d="M270 558h202v26H270z" fill="url(#sc-tlo-opisu)"/>
  <text x="272" y="578" fill="#f4f1e8" font-family="Arial,sans-serif" font-size="18" font-weight="600">SC/APC SIMPLEX</text>`;
 warstwaSzafyFiber.append(panelFiber);
}
