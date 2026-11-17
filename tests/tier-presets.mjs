import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {canEquip,canEnchant,sanitizeEquipment,effectiveEquipment} from '../public/healing/equipment.mjs';
import {acquisition,enchantAcquisition,raidTier} from '../scripts/presets/tier-rules.mjs';
const report=JSON.parse(fs.readFileSync(new URL('../docs/tier-preset-review.json',import.meta.url)));
const catalog=JSON.parse(fs.readFileSync(new URL('../public/healing/catalog/items.json',import.meta.url)));
test('all twelve tier sets obey acquisition and enchant ceilings and survive saved-set validation',async()=>{
 assert.equal(report.presets.length,12);
 for(const preset of report.presets){
  const file={shaman:'gear',druid:'druid-gear',paladin:'paladin-gear'}[preset.className];const module=await import('../public/healing/'+file+'.mjs');const kit=(module.loadouts??module.equipmentSets)[preset.name];
  assert.ok(kit,preset.name);assert.ok(Object.keys(kit).length>=16);
  for(const row of preset.items){const item=kit[row.slot];assert.equal(item.key,row.key);assert.ok(canEquip(item,row.slot,preset.className));assert.ok(row.source.tier<=preset.tier,`${preset.name}: ${item.name}`);assert.ok(item.acquisitionTier<=preset.tier);
   if(row.source.zoneId in raidTier)assert.ok(raidTier[row.source.zoneId]<=preset.tier,`${item.name} from later raid`);
   const enchant=catalog.enchants.find(e=>e.id===item.enchantId&&canEnchant(e,item,preset.className));
   if(item.enchantId){assert.ok(enchant,item.name);assert.ok(enchantAcquisition(enchant).tier<=preset.tier);assert.equal(row.enchant.id,item.enchantId);}
   else assert.equal(catalog.enchants.filter(e=>canEnchant(e,item,preset.className)&&enchantAcquisition(e)?.tier<=preset.tier).length,0,`${item.name} omitted a supported enchant`);
  }
  assert.deepEqual(Object.fromEntries(Object.entries(sanitizeEquipment(kit,preset.className,catalog)).map(([s,i])=>[s,[i.key,i.enchantId]])),Object.fromEntries(Object.entries(kit).map(([s,i])=>[s,[i.key,i.enchantId]])));
  if(kit['Main hand'].twoHand)assert.ok(!kit['Off hand']);
 }
});
test('raid and outdoor progression gates override misleading phase numbers',()=>{
 const db={zones:[{id:3456,name:'Naxxramas'},{id:2677,name:'Blackwing Lair'},{id:1377,name:'Silithus'}],npcs:[],factions:[]};
 const item={name:'Example',source:'Forever',phase:1};
 for(const [zoneId,tier]of [[3456,3],[2677,2],[1377,3]])assert.equal(acquisition(item,{name:'Example',phase:1,sources:[{drop:{zoneId,npcId:15203}}]},db).tier,tier);
 assert.equal(acquisition(item,{name:'Example',sources:[{quest:{id:123,name:'Unverified quest'}}]},db),null);
 assert.equal(enchantAcquisition({name:'Zandalar Signet of Serenity'}).tier,3);
 assert.equal(enchantAcquisition({name:'Resilience of the Scourge'}).tier,3);
 assert.equal(enchantAcquisition({name:'Enchant Gloves - Healing Power'}).tier,3);
});
test('duplicate enchant IDs resolve against the actual equipment type',()=>{
 const boot=catalog.items.find(i=>i.type===10&&canEquip(i,'Feet','druid'));
 const kit=sanitizeEquipment({Feet:{...boot,enchantId:'851:13368'}},'druid',catalog);
 assert.equal(kit.Feet.enchantId,'851:13368');assert.equal(effectiveEquipment(kit,catalog).Feet.stats.spirit,(boot.stats.spirit??0)+5);
 const cloak=catalog.enchants.find(e=>e.id==='1889:20015');assert.equal(cloak.stats.armor,70);
});
