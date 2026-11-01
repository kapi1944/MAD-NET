/* Wspólne menu: hover wyłącznie dla myszy, dotyk przez klik, bez pułapki fokusu. */
(() => {
  const naglowek = document.querySelector('.wspolny-naglowek');
  if (!naglowek) return;
  const menu = naglowek.querySelector('#nawigacja');
  const przyciskMenu = naglowek.querySelector('#otworz-menu');
  const grupa = naglowek.querySelector('.menu-uslugi');
  const przyciskUslug = grupa.querySelector('.rozwijanie-uslug');
  const lista = grupa.querySelector('.lista-uslug');
  let ostatniDotyk = false;
  const ustawListe = otwarta => {
    przyciskUslug.setAttribute('aria-expanded', String(otwarta));
    lista.hidden = !otwarta;
  };
  const ustawMenu = otwarte => {
    menu.dataset.otwarte = String(otwarte);
    przyciskMenu.setAttribute('aria-expanded', String(otwarte));
    przyciskMenu.setAttribute('aria-label', otwarte ? 'Zamknij menu' : 'Otwórz menu');
    if (!otwarte) ustawListe(false);
  };
  naglowek.addEventListener('pointerdown', zdarzenie => { ostatniDotyk = zdarzenie.pointerType === 'touch'; });
  naglowek.addEventListener('keydown', () => { ostatniDotyk = false; });
  przyciskMenu.addEventListener('click', () => ustawMenu(przyciskMenu.getAttribute('aria-expanded') !== 'true'));
  przyciskUslug.addEventListener('click', () => ustawListe(lista.hidden));
  grupa.addEventListener('pointerenter', zdarzenie => {
    if (zdarzenie.pointerType !== 'touch' && matchMedia('(hover:hover) and (pointer:fine)').matches) ustawListe(true);
  });
  grupa.addEventListener('pointerleave', () => { if (!grupa.contains(document.activeElement)) ustawListe(false); });
  grupa.addEventListener('focusin', zdarzenie => {
    if (!ostatniDotyk && !grupa.contains(zdarzenie.relatedTarget)) ustawListe(true);
  });
  grupa.addEventListener('focusout', () => setTimeout(() => { if (!grupa.contains(document.activeElement)) ustawListe(false); }, 0));
  document.addEventListener('pointerdown', zdarzenie => { if (!naglowek.contains(zdarzenie.target)) ustawMenu(false); });
  document.addEventListener('keydown', zdarzenie => {
    if (zdarzenie.key !== 'Escape') return;
    if (!lista.hidden) { przyciskUslug.focus(); ustawListe(false); }
    else if (przyciskMenu.getAttribute('aria-expanded') === 'true') { ustawMenu(false); przyciskMenu.focus(); }
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => ustawMenu(false)));
  window.addEventListener('resize', () => { if (innerWidth > 900) ustawMenu(false); });
  const rok = document.querySelector('#rok');
  if (rok) rok.textContent = String(new Date().getFullYear());
})();
