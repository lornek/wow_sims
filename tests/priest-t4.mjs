import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {loadouts} from '../public/healing/priest-gear.mjs';
import priest from '../public/healing/priest.mjs';
import {sanitizeEquipment,effectiveEquipment} from '../public/healing/equipment.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../public/healing/catalog/items.json',import.meta.url)));
const expected={Head:241078,Neck:241072,Shoulders:241153,Back:241025,Chest:241159,Wrists:239588,Hands:239584,Waist:239590,Legs:239587,Feet:239589,'Finger 1':241031,'Finger 2':241032,'Trinket 1':241068,'Trinket 2':23047,'Main hand':236399,Relic:241004};
test('Priest T4 exactly matches the uploaded gear and keeps valid enchants',()=>{
 const kit=loadouts['Tier 4 raid · SoD'];assert.deepEqual(Object.fromEntries(Object.entries(kit).map(([slot,item])=>[slot,item.id])),expected);
 const enchants={Head:'2590:24158',Shoulders:'2715:29474',Wrists:'2566:23796',Hands:'2617:25067',Legs:'2590:24158','Main hand':'8212:1248636'};
 assert.deepEqual(Object.fromEntries(Object.entries(kit).filter(([,i])=>i.enchantId).map(([s,i])=>[s,i.enchantId])),enchants);
 assert.deepEqual(sanitizeEquipment(kit,'priest',catalog),kit);assert.ok(!kit['Off hand']);
 const effective=effectiveEquipment(kit,catalog);assert.equal(Object.values(effective).reduce((n,i)=>n+(i.stats.power??0),0),1570);
 assert.equal(Object.values(kit).reduce((n,i)=>n+(i.stats.haste??0),0),5);
});
test('Holy and Discipline use the same corrected T4 equipment before their distinct talents',()=>{
 const kit=effectiveEquipment(loadouts['Tier 4 raid · SoD'],catalog);
 for(const spec of ['Holy','Discipline']){const profile=priest.buildProfile(kit,new Set(),{},priest.presets[spec]);assert.ok(profile.power>=1570);assert.equal(profile.haste,.05);}
});
test('healing and damage remain distinct for Stiltz, Revelation, the ring and Priest Atiesh',()=>{
 for(const [id,power,damage]of [[241068,88,30],[239588,55,19],[239584,73,25],[239590,73,25],[239587,108,36],[239589,79,27],[241032,84,28],[236399,362,169]]){
  const item=catalog.items.find(i=>i.key==='Season of Discovery:'+id);assert.equal(item.stats.power,power);assert.equal(item.stats.spellDamage,damage);assert.ok(item.verification.revision);
 }
 const stale={...loadouts['Tier 4 raid · SoD']['Trinket 1'],stats:{power:30}};
 assert.equal(sanitizeEquipment({'Trinket 1':stale},'priest',catalog)['Trinket 1'].stats.power,88);
});
