import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {wybierzPort,poczekajNaSerwer,uruchomPrzegladarke} from './srodowisko.mjs';

test('środowisko: zajęty jawny port zgłasza błąd i pozostawia obcy serwer',async()=>{
 const obcy=createServer();await new Promise(zakoncz=>obcy.listen(0,'127.0.0.1',zakoncz));
 process.env.MADNET_PORT_PROBA=String(obcy.address().port);
 try{await assert.rejects(wybierzPort('MADNET_PORT_PROBA'),/niedostępny/);assert.equal(obcy.listening,true);}
 finally{delete process.env.MADNET_PORT_PROBA;await new Promise(zakoncz=>obcy.close(zakoncz));}
});
test('środowisko: przedwczesne wyjście własnego serwera nie zawiesza testu',async()=>{
 const serwer=spawn(process.execPath,['-e','process.exit(2)']);
 await assert.rejects(poczekajNaSerwer(serwer),/kod 2/);
});
test('środowisko: brak przeglądarki podaje instrukcję i respektuje MADNET_PRZEGLADARKA',async()=>{
 const poprzednia=process.env.MADNET_PRZEGLADARKA;
 process.env.MADNET_PRZEGLADARKA='madnet-nieistniejaca-przegladarka';
 try{await assert.rejects(uruchomPrzegladarke(),/MADNET_PRZEGLADARKA=madnet-nieistniejaca-przegladarka.*npx playwright-core install/s);}
 finally{if(poprzednia===undefined)delete process.env.MADNET_PRZEGLADARKA;else process.env.MADNET_PRZEGLADARKA=poprzednia;}
});
