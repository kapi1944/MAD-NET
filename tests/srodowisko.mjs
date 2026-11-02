import {chromium} from 'playwright-core';
import {createServer} from 'node:net';

// System wybiera wolny port; jawnie wskazany zajęty port kończy tylko bieżący test.
export async function wybierzPort(nazwaZmiennej){
 const wskazany=process.env[nazwaZmiennej];
 const port=wskazany===undefined?0:Number(wskazany);
 if(!Number.isInteger(port)||port<0||port>65535)throw new Error(`Nieprawidłowy ${nazwaZmiennej}: ${wskazany}`);
 const kontrola=createServer();
 return new Promise((zakoncz,odrzuc)=>{
  kontrola.once('error',blad=>odrzuc(new Error(`Port ${port} (${nazwaZmiennej}) jest niedostępny: ${blad.code}. Wybierz inny port; nie zatrzymuj obcych procesów.`,{cause:blad})));
  kontrola.listen(port,'127.0.0.1',()=>{const wolny=kontrola.address().port;kontrola.close(blad=>blad?odrzuc(blad):zakoncz(String(wolny)));});
 });
}

export async function poczekajNaSerwer(serwer){
 return new Promise((zakoncz,odrzuc)=>{
  let log='';
  const zakonczStart=blad=>{
   clearTimeout(zegar);serwer.stdout.off('data',sprawdz);serwer.off('error',bladStartu);serwer.off('exit',wyjscie);
   if(blad){serwer.kill();odrzuc(blad);}else zakoncz();
  };
  const sprawdz=dane=>{log+=String(dane);if(log.includes('MAD-NET PREVIEW'))zakonczStart();};
  const bladStartu=blad=>zakonczStart(new Error(`Nie można uruchomić serwera testowego: ${blad.message}`,{cause:blad}));
  const wyjscie=kod=>zakonczStart(new Error(`Serwer testowy zakończył się przed startem (kod ${kod}): ${log}`));
  const zegar=setTimeout(()=>zakonczStart(new Error(`Serwer testowy nie wystartował w 8 s: ${log}`)),8000);
  serwer.stdout.on('data',sprawdz);serwer.stderr?.on('data',dane=>{log+=String(dane);});serwer.once('error',bladStartu);serwer.once('exit',wyjscie);
 });
}

export async function uruchomPrzegladarke(silnik=chromium,opcje={}){
 const sciezka=process.env.MADNET_PRZEGLADARKA;
 const ustawienia={headless:true,...opcje};
 try{
  if(sciezka)return await silnik.launch({...ustawienia,executablePath:sciezka});
  if(process.platform==='win32'&&silnik.name()==='chromium'){
   try{return await silnik.launch({...ustawienia,channel:'msedge'});}
   catch(blad){if(!/executable|distribution.*not found/i.test(blad.message))throw blad;}
  }
  return await silnik.launch(ustawienia);
 }catch(blad){throw new Error(`Nie można uruchomić ${silnik.name()}${sciezka?' przez MADNET_PRZEGLADARKA='+sciezka:''}. Zainstaluj przeglądarkę: npx playwright-core install ${silnik.name()} (Linux CI: --with-deps) albo ustaw MADNET_PRZEGLADARKA. ${blad.message}`,{cause:blad});}
}
