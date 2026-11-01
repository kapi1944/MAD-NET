/* Wyłącznie trzy publiczne fragmenty dawnego cennika; pozostałe sekcje HOME bez przekierowania. */
(() => {
  const cele = {
    '#cennik': './cennik.html#cennik',
    '#oplaty': './cennik.html#oplaty',
    '#kontakt': './cennik.html#kontakt',
  };
  const przekieruj = () => {
    const cel = cele[location.hash];
    if (cel) location.replace(new URL(cel, location.href).href);
  };
  przekieruj();
  window.addEventListener('hashchange', przekieruj);
})();
