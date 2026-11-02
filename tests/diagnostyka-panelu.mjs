import {wybierzPort,poczekajNaSerwer,uruchomPrzegladarke} from './srodowisko.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
const pomiary=[];await mkdir('test-results/panel',{recursive:true});
const port=await wybierzPort('MADNET_PORT_PANELU');
const serwer=spawn(process.execPath,['scripts/serve.mjs','--root','dist','--no-live'],{env:{...process.env,PORT:port}});
let przegladarka;
try {
await poczekajNaSerwer(serwer);
przegladarka=await uruchomPrzegladarke(chromium);
const strona=await przegladarka.newPage();
for(const szerokosc of [320,360,375,380,390,400,414,430,480,560,768,800,1024,1230,1231,1440,1920]){
await strona.setViewportSize({width:szerokosc,height:1250});await strona.goto(`http://127.0.0.1:${port}/cennik.html`);await strona.evaluate(()=>document.fonts.ready);
for(const technologia of ['LAN','FIBER','AIR']){
await strona.locator(`[data-rack-tech="${technologia}"]`).hover();await strona.locator(`[data-rack-tech="${technologia}"]`).click();await strona.waitForFunction(t=>document.querySelector('#hero-tech-panel').dataset.tech===t,technologia);
const pomiar=await strona.evaluate(()=>Object.fromEntries(['.hero-tech-panel','.hero-tech-panel-content','#hero-tech-description','.hero-tech-facts','.hero-tech-link'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return[s,{top:r.top,bottom:r.bottom,height:r.height,rows:getComputedStyle(e).gridTemplateRows}]})));
pomiary.push({szerokosc,technologia,...pomiar});
assert.ok(pomiar['#hero-tech-description'].bottom<=pomiar['.hero-tech-facts'].top);
const fakty=await strona.locator('.hero-tech-facts').boundingBox(),cta=await strona.locator('.hero-tech-link').boundingBox();
assert.ok(fakty.x+fakty.width<=cta.x || fakty.y+fakty.height<=cta.y,`Kolizja ${szerokosc} ${technologia}`);
assert.equal(await strona.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
assert.ok(cta.y+cta.height<=pomiar['.hero-tech-panel'].bottom);
const bazowy=pomiary.find(p=>p.szerokosc===szerokosc);
assert.equal(pomiar['.hero-tech-panel'].height,bazowy['.hero-tech-panel'].height);
await strona.waitForTimeout(400);
await strona.screenshot({path:`test-results/panel/${szerokosc}-${technologia}.png`});
console.log(`PASS panel ${szerokosc} ${technologia}`);
}}
}finally{await writeFile('test-results/panel/pomiary.json',JSON.stringify(pomiary,null,2));await przegladarka?.close();serwer.kill();}
