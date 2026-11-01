/* Link z podstrony Internet wybiera istniejący przycisk, bez drugiej kopii danych pakietów. */
(() => {
  const technologia = new URLSearchParams(location.search).get('technologia');
  if (!['LAN', 'FIBER', 'AIR'].includes(technologia)) return;
  document.querySelector(`.device-tech-tabs button[data-technology="${technologia}"]`)?.click();
})();
