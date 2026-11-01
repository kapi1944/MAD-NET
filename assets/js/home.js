
'use strict';

/** MAD-NET / strona główna — JavaScript bez zewnętrznych zależności. */
(() => {
  const wybierz = (selektor, element = document) => element.querySelector(selektor);
  const wybierzWszystkie = (selektor, element = document) => [...element.querySelectorAll(selektor)];

  const daneUslug = {
    monitoring: {
      tytul: 'Monitoring i alarmy',
      opis: 'Zadbaj o bezpieczeństwo domu, firmy albo obiektu. Dobierzemy kamery i system zabezpieczeń do warunków na miejscu oraz Twoich oczekiwań.',
      ikona: 'ik-kamera',
      zakres: ['Monitoring wizyjny', 'Systemy alarmowe', 'Kontrola dostępu', 'Montaż i konfiguracja'],
      temat: 'Zapytanie o monitoring i alarmy'
    },
    it: {
      tytul: 'Usługi IT i sieci',
      opis: 'Projektujemy i porządkujemy infrastrukturę sieciową. Pomagamy z komputerami, urządzeniami sieciowymi i techniczną obsługą firmy.',
      ikona: 'ik-serwer',
      zakres: ['Sieci LAN i Wi-Fi', 'Okablowanie strukturalne', 'Serwis komputerów', 'Konfiguracja urządzeń'],
      temat: 'Zapytanie o usługi IT i sieci'
    },
    www: {
      tytul: 'Strony WWW i hosting',
      opis: 'Pomożemy Ci zbudować obecność w internecie — od strony WWW po konfigurację niezbędnych usług i późniejsze wsparcie techniczne.',
      ikona: 'ik-kod',
      zakres: ['Strony internetowe', 'Hosting', 'Opieka techniczna', 'Konsultacje i rozwój'],
      temat: 'Zapytanie o stronę internetową i hosting'
    },
    anteny: {
      tytul: 'Instalacje antenowe i TV/SAT',
      opis: 'Instalacje telewizyjne, satelitarne i sieciowe dla domów, firm i obiektów noclegowych. Dobór sprzętu i realizacja na miejscu.',
      ikona: 'ik-antena',
      zakres: ['Antena naziemna', 'Telewizja satelitarna', 'Okablowanie sygnałowe', 'Montaż i ustawienie'],
      temat: 'Zapytanie o instalację antenową TV/SAT'
    },
    kontakt: {
      tytul: 'Zgłoś awarię lub zadaj pytanie',
      opis: 'Potrzebujesz pomocy z połączeniem internetowym, monitoringiem albo inną usługą? Zadzwoń do MAD-NET lub napisz e-mail, opisując problem i lokalizację.',
      ikona: 'ik-telefon',
      zakres: ['Zgłoszenie problemu', 'Pytanie techniczne', 'Wycena i konsultacja', 'Kontakt z lokalnym zespołem'],
      temat: 'Zgłoszenie / pytanie do MAD-NET'
    }
  };

  // Menu mobilne: przycisk, Escape, wybór elementu, kliknięcie poza menu.
  const przyciskMenu = wybierz('#otworz-menu');
  const nawigacja = wybierz('#nawigacja');
  const zamknijMenu = () => {
    nawigacja.classList.remove('otwarte');
    przyciskMenu.setAttribute('aria-expanded', 'false');
    przyciskMenu.setAttribute('aria-label', 'Otwórz menu');
  };
  przyciskMenu.addEventListener('click', () => {
    const otworzyc = !nawigacja.classList.contains('otwarte');
    nawigacja.classList.toggle('otwarte', otworzyc);
    przyciskMenu.setAttribute('aria-expanded', String(otworzyc));
    przyciskMenu.setAttribute('aria-label', otworzyc ? 'Zamknij menu' : 'Otwórz menu');
  });
  wybierzWszystkie('a', nawigacja).forEach(link => link.addEventListener('click', zamknijMenu));
  document.addEventListener('pointerdown', zdarzenie => {
    if (!nawigacja.contains(zdarzenie.target) && !przyciskMenu.contains(zdarzenie.target)) zamknijMenu();
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 780) zamknijMenu(); });

  // Ilustracyjna mapa: podświetlenie miejscowości, bez sugerowania potwierdzonego zasięgu.
  const wyboryMiast = wybierzWszystkie('[data-miasto]');
  const nazwaMiasta = wybierz('#wybrane-miasto');
  function ustawMiasto(miasto) {
    nazwaMiasta.textContent = miasto;
    wyboryMiast.forEach(element => {
      const aktywny = element.dataset.miasto === miasto;
      element.classList.toggle('aktywny', aktywny);
      element.classList.toggle('wybrany', aktywny);
      if (element.classList.contains('punkt-mapy')) element.setAttribute('aria-pressed', String(aktywny));
      if (element.closest('.miejscowosci-przyciski')) element.setAttribute('aria-pressed', String(aktywny));
    });
  }
  wyboryMiast.forEach(element => element.addEventListener('click', () => ustawMiasto(element.dataset.miasto)));

  // Dialog ofertowy i kontaktowy — faktycznie klikalny, bez pozorowania wysyłki.
  const modalTlo = wybierz('#modal-tlo');
  const modal = wybierz('.okno-modalne', modalTlo);
  const zamknijModalPrzycisk = wybierz('#modal-zamknij');
  let poprzedniFokus = null;
  const elementyFokusu = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const unikodTekstu = tekst => String(tekst).replace(/[&<>"']/g, znak => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[znak]));
  function otworzModal(typ) {
    const dane = daneUslug[typ];
    if (!dane) return;
    poprzedniFokus = document.activeElement;
    wybierz('#modal-etykieta').textContent = typ === 'kontakt' ? 'MAD-NET / BEZPOŚREDNI KONTAKT' : 'MAD-NET / POZNAJ ROZWIĄZANIA';
    wybierz('#modal-tytul').textContent = dane.tytul;
    wybierz('#modal-opis').textContent = dane.opis;
    wybierz('#modal-ikona').innerHTML = `<svg class="ikona"><use href="#${dane.ikona}"></use></svg>`;
    wybierz('#modal-zakres').innerHTML = dane.zakres.map(punkt => `<span>${unikodTekstu(punkt)}</span>`).join('');
    wybierz('#modal-mail').href = `mailto:biuro@mad-net.pl?subject=${encodeURIComponent(dane.temat)}`;
    modalTlo.hidden = false;
    document.body.classList.add('modal-otwarty');
    zamknijModalPrzycisk.focus();
  }
  function zamknijModal() {
    if (modalTlo.hidden) return;
    modalTlo.hidden = true;
    document.body.classList.remove('modal-otwarty');
    if (poprzedniFokus && typeof poprzedniFokus.focus === 'function') poprzedniFokus.focus();
  }
  wybierzWszystkie('[data-usluga]').forEach(przycisk => przycisk.addEventListener('click', () => otworzModal(przycisk.dataset.usluga)));
  wybierzWszystkie('[data-otworz-kontakt]').forEach(przycisk => przycisk.addEventListener('click', () => otworzModal('kontakt')));
  zamknijModalPrzycisk.addEventListener('click', zamknijModal);
  modalTlo.addEventListener('click', zdarzenie => { if (zdarzenie.target === modalTlo) zamknijModal(); });
  document.addEventListener('keydown', zdarzenie => {
    if (zdarzenie.key === 'Escape') { zamknijMenu(); zamknijModal(); }
    if (zdarzenie.key !== 'Tab' || modalTlo.hidden) return;
    const dostepne = wybierzWszystkie(elementyFokusu, modal).filter(el => el.getClientRects().length);
    if (!dostepne.length) return;
    const pierwszy = dostepne[0];
    const ostatni = dostepne[dostepne.length - 1];
    if (zdarzenie.shiftKey && document.activeElement === pierwszy) { zdarzenie.preventDefault(); ostatni.focus(); }
    if (!zdarzenie.shiftKey && document.activeElement === ostatni) { zdarzenie.preventDefault(); pierwszy.focus(); }
  });

  // Używamy bieżącego roku zamiast wpisanego na sztywno.
  const rok = wybierz('#rok');
  if (rok) rok.textContent = String(new Date().getFullYear());

  // Linki cennika i formularza wykorzystują stan rzeczywisty main (index.html): #cennik i #kontakt.
  // Przy integracji do repo, gdy cennik zostanie przeniesiony do cennik.html,
  // można zastąpić link docelowy na './cennik.html#cennik' / './cennik.html#kontakt'.
})();


// MAD-NET V3 — boczne trasy PCB za treścią, aktywne impulsy bez nakładania na litery.
// Trasy zaczynają się poza krawędzią i kończą w bezpiecznych strefach bocznych.
(function dodajObwodyZImpulsami(){
 const sciezki = [
  'M -36 28 H 98 L 127 58 V 91 L 158 122 H 286',
  'M -36 43 H 87 L 114 70 V 104 L 149 138 H 258',
  'M -36 63 H 67 L 99 95 V 118 L 134 151 H 217',
  'M 1636 21 H 1500 L 1471 49 H 1390 L 1362 78 V 104 L 1336 130 H 1210',
  'M 1636 35 H 1509 L 1483 62 H 1409 L 1380 89 V 118 L 1352 143 H 1240',
  'M 1636 52 H 1516 L 1494 76 H 1428 L 1397 109 V 136 L 1372 156 H 1288'
 ];
 document.querySelectorAll('.sekcja-uslugi,.sekcja-obszar,.sekcja-powody,.sekcja-proces,.sekcja-relacje,.sekcja-kontakt').forEach((sekcja,index)=>{
   const ns='http://www.w3.org/2000/svg';
   const svg=document.createElementNS(ns,'svg');
   svg.setAttribute('viewBox','0 0 1600 170');svg.setAttribute('preserveAspectRatio','none');
   svg.setAttribute('class','pcb-ornament');svg.setAttribute('aria-hidden','true');
   for(const [numer,d] of sciezki.entries()){
     const obrys=document.createElementNS(ns,'path');obrys.setAttribute('d',d);obrys.setAttribute('class','pcb-obrys');svg.append(obrys);
     if(numer===0||numer===3||numer===5){
       const impuls=document.createElementNS(ns,'path');impuls.setAttribute('d',d);impuls.setAttribute('class','pcb-iskra');
       impuls.style.animationDelay=`-${(index*1.6+numer*.7).toFixed(1)}s`;
       svg.append(impuls);
     }
   }
   sekcja.prepend(svg);
 });
})();



'use strict';
/**
 * MAD-NET / mapa rzeczywista bez frameworków i kluczy API.
 * Geolokalizacje pochodzą z punktów miejscowości OSM (dostęp przez Mapcarta).
 * Podkład: tiles OpenStreetMap/CARTO lub Esri. To NIE jest mapa zasięgu usług.
 * Pozycja każdego punktu jest rzutowana matematycznie (Web Mercator / EPSG:3857).
 */
(() => {
  const dane = [
    {nazwa:'Pobierowo', lat:54.05708, lon:14.93326},
    {nazwa:'Rewal', lat:54.08207, lon:15.01419},
    {nazwa:'Niechorze', lat:54.09537, lon:15.08200},
    {nazwa:'Pogorzelica', lat:54.10189, lon:15.12119},
    {nazwa:'Trzebiatów', lat:54.06263, lon:15.26566},
    {nazwa:'Mrzeżyno', lat:54.14350, lon:15.29055},
    {nazwa:'Rogowo', lat:54.15045, lon:15.33734}
  ];
  const element = document.getElementById('mapa-ramka');
  if (!element) return;
  const podklad = document.getElementById('mapa-podklad');
  const znaczniki = document.getElementById('mapa-pinezki');
  let status = document.getElementById('mapa-status');
  const przypis=document.querySelector('.mapa-legenda');
  const wspolrzedne = document.getElementById('wybrane-wspolrzedne');
  const osmLink = document.getElementById('otworz-w-osm');
  const stan = { lat:54.1058,lon:15.139,z:10,tryb:'satelita', wybrane:'Trzebiatów',renderowane:0,drag:null, blokadaKlikniecia:false };
  const tileSize = 256;
  element.classList.add('mapa-satelitarna');
  document.getElementById('mapa-dark').setAttribute('aria-pressed','false');
  document.getElementById('mapa-satelita').setAttribute('aria-pressed','true');
  const zoomMin=8, zoomMax=13;
  const licz = v=>Math.max(0, Math.min(1, v));
  const xy = (lat,lon,z) => {
    const skala = tileSize * (2**z),rad = lat*Math.PI/180;
    return [(lon+180)/360*skala,(1-Math.asinh(Math.tan(rad))/Math.PI)/2*skala];
  };
  const odwroc = (x,y,z) => {
    const skala = tileSize * (2**z);
    return {lon:x/skala*360-180,lat:Math.atan(Math.sinh(Math.PI*(1-2*y/skala)))*180/Math.PI};
  };
  const bezpieczna = s=>String(s).replace(/[&<>"']/g,t=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[t]));
  function wyliczWidok() {
    const w=element.clientWidth,h=element.clientHeight;
    const wsp = xy(stan.lat,stan.lon,stan.z);
    return {w,h,ox:wsp[0]-w/2,oy:wsp[1]-h/2};
  }
  let kluczPodkladu=''; let tiles=new Map();
  function urlTile(z,x,y){
    if(stan.tryb==='satelita')return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    return `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;
  }
  function renderuj() {
    if (!element.clientWidth || !element.clientHeight)return;
    const {w,h,ox,oy}=wyliczWidok();
    const firstX=Math.floor(ox/tileSize),lastX=Math.floor((ox+w)/tileSize);
    const firstY=Math.floor(oy/tileSize),lastY=Math.floor((oy+h)/tileSize);
    const potrzebne=new Set();
    for(let x=firstX;x<=lastX;x++)for(let y=firstY;y<=lastY;y++) {
      if(x<0||x>=2**stan.z||y<0||y>=2**stan.z)continue;
      const key=`${stan.tryb}/${stan.z}/${x}/${y}`;
      potrzebne.add(key);
      let img=tiles.get(key);
      if(!img){
        img=document.createElement('img');img.className='mapa-kafelek';
        img.alt='';img.draggable=false;img.decoding='async';img.referrerPolicy='no-referrer';
        img.loading='eager';img.src=urlTile(stan.z,x,y);
        img.addEventListener('load',()=>{status.textContent=stan.tryb==='satelita'?'Źródło: Esri World Imagery':'Źródło: CARTO / OpenStreetMap';element.classList.add('mapa-zaladowana')});
        img.addEventListener('error',()=>{
          status.textContent='Podkład wymaga internetu — punkty GPS są poprawne';
          if(stan.tryb==='satelita'&&!stan.autoFallback){
            stan.autoFallback=true;stan.tryb='dark';element.classList.remove('mapa-satelitarna');
            document.getElementById('mapa-dark').setAttribute('aria-pressed','true');
            document.getElementById('mapa-satelita').setAttribute('aria-pressed','false');
            renderuj();
          }
        });
        podklad.appendChild(img);tiles.set(key,img);
      }
      img.style.left=`${x*tileSize-ox}px`;
      img.style.top=`${y*tileSize-oy}px`;
    }
    for(const [key,img] of tiles){ if(!potrzebne.has(key)){img.remove();tiles.delete(key);} }
    if(kluczPodkladu!==stan.tryb){
      przypis.dataset.tryb=stan.tryb;
      if(stan.tryb==='satelita')przypis.innerHTML='<span id="mapa-status">Podkład satelitarny online</span> · © Esri / Maxar';
      else przypis.innerHTML='<span id="mapa-status">Podkład geograficzny online</span> · © OpenStreetMap / CARTO';
      status=document.getElementById('mapa-status');
      kluczPodkladu=stan.tryb;
    }
    for(const p of dane) {
      let marker=znaczniki.querySelector(`[data-mapa-miasto="${p.nazwa}"]`);
      if(!marker){
        marker=document.createElement('button');marker.type='button';marker.className='punkt-mapy punkt-prawdziwy';
        marker.dataset.mapaMiasto=p.nazwa;marker.dataset.miasto=p.nazwa;
        marker.setAttribute('aria-label',`${p.nazwa} — ${p.lat.toFixed(5)}°N, ${p.lon.toFixed(5)}°E`);
        marker.innerHTML=`<span class="kropka-mapy"></span><span class="napis-mapy">${bezpieczna(p.nazwa)}</span>`;
        marker.addEventListener('click',()=>wybierzMiasto(p.nazwa));
        znaczniki.appendChild(marker);
      }
      const pt=xy(p.lat,p.lon,stan.z);
      marker.style.left=`${pt[0]-ox}px`;marker.style.top=`${pt[1]-oy}px`;
      marker.hidden=(pt[0]-ox<-100||pt[0]-ox>w+100||pt[1]-oy<-30||pt[1]-oy>h+30);
      marker.classList.toggle('aktywny',stan.wybrane===p.nazwa);
      marker.setAttribute('aria-pressed',String(stan.wybrane===p.nazwa));
    }
  }
  function wybierzMiasto(nazwa) {
    const p = dane.find(d=>d.nazwa===nazwa);
    if(!p)return;
    stan.wybrane=nazwa;
    document.getElementById('wybrane-miasto').textContent=nazwa;
    wspolrzedne.textContent=`${p.lat.toFixed(5)}°N · ${p.lon.toFixed(5)}°E`;
    osmLink.href=`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=13/${p.lat}/${p.lon}`;
    document.querySelectorAll('.miejscowosci-przyciski [data-miasto]').forEach(b=>{
      b.classList.toggle('wybrany',b.dataset.miasto===nazwa);
      b.setAttribute('aria-pressed',String(b.dataset.miasto===nazwa));
    });
    // Gdy punkt jest poza widokiem, przesuń do niego mapę, zachowując skale.
    const {w,h,ox,oy}=wyliczWidok(),pt=xy(p.lat,p.lon,stan.z);
    const px=pt[0]-ox,py=pt[1]-oy;
    if(px<45||px>w-55||py<38||py>h-60){stan.lat=(stan.lat+p.lat)/2;stan.lon=(stan.lon+p.lon)/2;}
    renderuj();
  }
  // Fit do faktycznego bounding boxa GPS siedmiu miejscowości.
  function pokazCalyRegion(){
    const minLat=Math.min(...dane.map(p=>p.lat)),maxLat=Math.max(...dane.map(p=>p.lat));
    const minLon=Math.min(...dane.map(p=>p.lon)),maxLon=Math.max(...dane.map(p=>p.lon));
    const w=element.clientWidth,h=element.clientHeight;
    let dopasowanie=10;
    for(let z=12;z>=8;z--){
      const p1=xy(maxLat,minLon,z),p2=xy(minLat,maxLon,z);
      if(Math.abs(p2[0]-p1[0])<=w-145 && Math.abs(p2[1]-p1[1])<=h-155){dopasowanie=z;break;}
    }
    stan.z=dopasowanie;
    const pt1=xy(maxLat,minLon,stan.z),pt2=xy(minLat,maxLon,stan.z);
    const center=odwroc((pt1[0]+pt2[0])/2,(pt1[1]+pt2[1])/2,stan.z);
    stan.lat=center.lat;stan.lon=center.lon;
    renderuj();
  }
  document.querySelectorAll('.miejscowosci-przyciski [data-miasto]').forEach(button=>{
    button.addEventListener('click',()=>wybierzMiasto(button.dataset.miasto));
  });
  document.getElementById('mapa-przybliz').addEventListener('click',()=>{stan.z=Math.min(zoomMax,stan.z+1);renderuj()});
  document.getElementById('mapa-oddal').addEventListener('click',()=>{stan.z=Math.max(zoomMin,stan.z-1);renderuj()});
  document.getElementById('mapa-widok').addEventListener('click',pokazCalyRegion);
  for(const [id,tryb] of [['mapa-dark','dark'],['mapa-satelita','satelita']]) {
    document.getElementById(id).addEventListener('click',()=>{
      stan.tryb=tryb;element.classList.toggle('mapa-satelitarna',tryb==='satelita');
      document.getElementById('mapa-dark').setAttribute('aria-pressed',String(tryb==='dark'));
      document.getElementById('mapa-satelita').setAttribute('aria-pressed',String(tryb==='satelita'));
      status.textContent='Ładowanie mapy...';element.classList.remove('mapa-zaladowana');renderuj();
    });
  }
  // Przeciąganie na komputerach, nie przechwytujemy scrollowania palcem.
  podklad.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0)return;const p=xy(stan.lat,stan.lon,stan.z);stan.drag={x:e.clientX,y:e.clientY,px:p[0],py:p[1]};podklad.setPointerCapture(e.pointerId);element.classList.add('mapa-przeciaganie');});
  podklad.addEventListener('pointermove',e=>{if(!stan.drag)return;const dx=e.clientX-stan.drag.x,dy=e.clientY-stan.drag.y;const center=odwroc(stan.drag.px-dx,stan.drag.py-dy,stan.z);stan.lat=center.lat;stan.lon=center.lon;renderuj()});
  const koniec=()=>{stan.drag=null;element.classList.remove('mapa-przeciaganie')};
  podklad.addEventListener('pointerup',koniec);podklad.addEventListener('pointercancel',koniec);
  // Ogranicz liczbę klatek podczas resize.
  if('ResizeObserver' in window){new ResizeObserver(()=>pokazCalyRegion()).observe(element)}
  else window.addEventListener('resize',pokazCalyRegion);
  requestAnimationFrame(pokazCalyRegion);
})();
