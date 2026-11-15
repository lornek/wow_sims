import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canEquip,canEnchant,sanitizeEquipment,effectiveEquipment,equipItem,createGearHistory,loadGearCatalog} from '../public/healing/equipment.mjs';
import {humanProfile} from '../public/healing/human-healer.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../public/healing/catalog/items.json',import.meta.url)));
const find=(id,source='Season of Discovery')=>catalog.items.find(i=>i.id===id&&i.source===source);
test('all presets obey class, weapon, slot and level restrictions',async()=>{
 for(const [cls,file]of Object.entries({paladin:'paladin-gear',priest:'priest-gear',druid:'druid-gear',shaman:'gear'})){
  const m=await import('../public/healing/'+file+'.mjs');
  for(const [name,kit]of Object.entries(m.loadouts??m.equipmentSets))for(const [slot,item]of Object.entries(kit))assert.ok(canEquip(item,slot,cls),`${cls} ${name}: ${slot} ${item.name}`);
 }
});
test('Paladin T4 equips a strong healing mace and shield, never the Mirage staff',async()=>{
 const {loadouts}=await import('../public/healing/paladin-gear.mjs');const kit=loadouts['Tier 4 raid · SoD'];
 assert.equal(kit['Main hand'].weaponType,4);assert.ok(kit['Main hand'].stats.power>=169);assert.equal(kit['Off hand'].weaponType,7);assert.ok(kit['Off hand'].stats.power>0);
 assert.equal(canEquip(find(241003),'Main hand','paladin'),false);
});
test('two-handed equipment clears offhand, shields clear two-handers, unique rings cannot duplicate',()=>{
 const staff=find(241003),shield=find(241017);let kit=equipItem({'Off hand':shield},'Main hand',staff);assert.equal(kit['Off hand'],undefined);
 kit=equipItem(kit,'Off hand',shield);assert.equal(kit['Main hand'],undefined);
 const ring={key:'test',unique:true};assert.equal(equipItem({'Finger 1':ring},'Finger 2',ring)['Finger 1'],undefined);
});
test('saved equipment ignores forged stats, incompatible weapons and invalid enchants',()=>{
 const mace=find(241001);const raw={'Main hand':{...mace,stats:{power:999999},enchantId:'fake'},'Off hand':find(241003),Head:null};
 const kit=sanitizeEquipment(raw,'paladin',catalog);assert.equal(kit['Main hand'].stats.power,169);assert.equal(kit['Main hand'].enchantId,undefined);assert.equal(kit['Off hand'],undefined);
});
test('enchants apply as gear before talents and Kings; shield/two-hand enchants stay on compatible weapons',()=>{
 const mace=find(241001);const enchant=catalog.enchants.find(e=>e.name==='Enchant Weapon - Mighty Intellect');assert.ok(enchant);assert.ok(canEnchant(enchant,mace,'paladin'));const kit=effectiveEquipment({'Main hand':{...mace,enchantId:enchant.id}},catalog);
 const profile=humanProfile('paladin',{});const base=profile({'Main hand':mace},new Set(['kings']),{}, {'Divine Intellect':5});const extra=profile(kit,new Set(['kings']),{}, {'Divine Intellect':5});
 assert.ok(extra.intellect>base.intellect);assert.ok(extra.crit>base.crit);assert.ok(extra.mana>base.mana);
 const shieldEnchant=catalog.enchants.find(e=>e.enchantType===2);assert.ok(shieldEnchant);assert.equal(canEnchant(shieldEnchant,mace,'paladin'),false);assert.equal(canEnchant(shieldEnchant,find(241017),'paladin'),true);
 const two=catalog.enchants.find(e=>e.enchantType===1);assert.equal(canEnchant(two,mace,'paladin'),false);assert.equal(canEnchant(two,find(241003),'druid'),true);
});
test('undo restores equipment, enchants and named sets using independent snapshots',()=>{
 const history=createGearHistory({kit:{},sets:{}});history.set({kit:{Head:{id:1}},sets:{Raid:{Head:{id:1}}}});const value=history.value;value.kit.Head.id=900;assert.equal(history.value.kit.Head.id,1);
 history.set({kit:{},sets:{}});assert.equal(history.undo().kit.Head.id,1);assert.deepEqual(history.undo(),{kit:{},sets:{}});assert.equal(history.canUndo,false);
});
test('catalog loads once, caches locally, and removes obsolete version caches',async()=>{
 const originalFetch=globalThis.fetch,originalCaches=globalThis.caches;let requests=0,puts=0;const deleted=[];
 globalThis.fetch=async()=>{requests++;return new Response(JSON.stringify(catalog))};
 globalThis.caches={open:async()=>({match:async()=>undefined,put:async()=>{puts++}}),keys:async()=>['healbot-gear-old','unrelated'],delete:async name=>deleted.push(name)};
 try{const [a,b]=await Promise.all([loadGearCatalog(),loadGearCatalog()]);assert.equal(a,b);assert.equal(requests,1);assert.equal(puts,1);assert.deepEqual(deleted,['healbot-gear-old'])}finally{globalThis.fetch=originalFetch;globalThis.caches=originalCaches}
});
