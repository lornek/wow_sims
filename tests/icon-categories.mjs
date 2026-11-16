import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../public/healing/custom-icons/',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
test('equipment and spell catalogs are disjoint and cover the master library',()=>{
 const master=read('catalog.json'),spells=read('spells-catalog.json'),gear=read('equipment/catalog.json');
 assert.equal(spells.icons.length,600);assert.equal(gear.icons.length,400);assert.equal(master.icons.length,1000);
 assert.ok(spells.icons.every(i=>i.category==='spells'&&!i.path.startsWith('equipment/')));
 assert.ok(gear.icons.every(i=>i.category==='equipment'&&i.path.startsWith('equipment/')&&i.equipmentType));
 const ids=new Set([...spells.icons,...gear.icons].map(i=>i.id));assert.equal(ids.size,1000);
 for(const i of master.icons){assert.ok(ids.has(i.id));assert.ok(fs.existsSync(new URL(i.path,root)),i.path);}
 assert.equal(gear.sets.length,4);for(const set of gear.sets)assert.equal(gear.icons.filter(i=>i.set===set.id).length,100);
});
test('download parts stay category-specific and below the hosting size limit',()=>{
 const master=read('catalog.json'),downloads=read('downloads.json');
 for(const category of ['spells','equipment'])assert.equal(downloads.parts.filter(p=>p.category===category).reduce((n,p)=>n+p.iconCount,0),master.icons.filter(i=>i.category===category).length);
 for(const part of downloads.parts)assert.ok(part.sizeBytes<25*1024*1024);
});
