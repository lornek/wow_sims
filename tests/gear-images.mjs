import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {equipmentIconName,equipmentImageSources,setEquipmentImage}from '../public/healing/gear-images.mjs';
import{bundledIconFiles}from '../public/healing/bundled-icon-files.mjs';
test('every bundled preset icon loads locally before trying an external CDN',async()=>{
 let local=0;
 for(const cls of ['shaman','druid','priest','paladin']){const config=(await import('../public/healing/'+cls+'.mjs')).default;for(const kit of Object.values(config.loadouts))for(const item of Object.values(kit)){
 const name=equipmentIconName(item);assert.ok(name,item.name+' has an icon name');
 if(bundledIconFiles[name]){local++;assert.equal(equipmentImageSources(item)[0],new URL('../public/healing/'+bundledIconFiles[name],import.meta.url).href);assert.ok(fs.existsSync(new URL('../public/healing/'+bundledIconFiles[name],import.meta.url)))}
 }}assert.ok(local>100);
});
test('missing catalog icon names recover the original local item art',()=>{for(const [id,name]of [[252561,'inv_helmet_19'],[250600,'inv_pants_plate_03'],[275609,'inv_boots_cloth_05']]){assert.equal(equipmentIconName({id}),name);assert.ok(equipmentImageSources({id})[0].endsWith('/icons/'+name+'.jpg'))}});
test('local and CDN errors reach a slot placeholder, then a terminal embedded fallback',()=>{
 const image={dataset:{}};setEquipmentImage(image,{icon:'inv_helmet_13'},'head');assert.ok(image.src.includes('/icons/inv_helmet_13.jpg'));image.onerror();assert.ok(image.src.startsWith('https://wow.zamimg.com/'));image.onerror();assert.ok(image.src.endsWith('/slots/head.jpg'));assert.equal(image.dataset.iconFallback,'true');image.onerror();assert.ok(image.src.startsWith('data:image/svg+xml,'));assert.equal(image.onerror,null);
});
test('missing or malformed names never emit undefined or arbitrary URLs; empty slots stay local',()=>{
 for(const item of [{},{icon:'https://bad.example/icon'},{icon:'../broken'}]){const sources=equipmentImageSources(item);assert.ok(sources[0].endsWith('/slots/empty.jpg'));assert.ok(sources.every(s=>!s.includes('undefined')&&!s.includes('bad.example')))}assert.ok(equipmentImageSources(null,'feet')[0].endsWith('/slots/feet.jpg'));assert.equal(equipmentIconName({icon:'INV_HELMET_13.JPG'}),'inv_helmet_13');
});
test('unknown catalog art can use CDN, and stale handlers cannot replace newly equipped art',()=>{
 const image={dataset:{}};setEquipmentImage(image,{icon:'new_item_icon'},'mainhand');const stale=image.onerror;assert.ok(image.src.startsWith('https://wow.zamimg.com/'));setEquipmentImage(image,{icon:'inv_helmet_13'},'head');const selected=image.src;stale();assert.equal(image.src,selected);
});
