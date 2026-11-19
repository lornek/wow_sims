import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {healerEnchantChoices} from '../public/healing/healer-enchants.mjs';
import {canEnchant,sanitizeEquipment} from '../public/healing/equipment.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../public/healing/catalog/items.json',import.meta.url)));
const names=(item,cls='priest')=>healerEnchantChoices(catalog.enchants,item,cls).map(e=>e.name);
test('bracers offer endgame healer tradeoffs without leveling or melee enchants',()=>{
 const result=names({type:6});
 for(const name of ['Healing Power','Mana Regeneration','Superior Intellect','Superior Spirit','Superior Stamina'])assert.ok(result.includes('Enchant Bracer - '+name));
 assert.ok(result.every(name=>!/(Minor|Lesser|Agility|Strength|Spell Power)/.test(name)));
});
test('two-handed healing choices hide weaker healing enchants and preserve mana-stat choices',()=>{
 const result=names({type:13,weaponType:4,twoHand:true});
 assert.ok(result.includes('Enchant 2H Weapon - Mighty Healing Power'));
 assert.ok(result.includes('Enchant Weapon - Mighty Intellect'));
 assert.ok(!result.includes('Enchant Weapon - Healing Power'));
 assert.ok(names({type:13,weaponType:2}).includes('Enchant Weapon - Healing Power'));
});
test('class restrictions and item compatibility still apply',()=>{
 const priest=names({type:1}),druid=names({type:1},'druid');
 assert.ok(priest.includes('Prophetic Aura'));assert.ok(!priest.includes("Animist's Caress"));
 assert.ok(druid.includes("Animist's Caress"));
 for(const cls of ['priest','druid','shaman','paladin'])for(const item of catalog.items.filter(i=>[1,3,4,5,6,7,9,10,13].includes(i.type)).slice(0,100))
  assert.ok(healerEnchantChoices(catalog.enchants,item,cls).every(e=>canEnchant(e,item,cls)));
});
test('filtering does not remove old enchants from saved equipment',()=>{
 const enchant=catalog.enchants.find(e=>e.name==='Enchant Bracer - Minor Spirit');
 const item=catalog.items.find(i=>i.type===6&&canEnchant(enchant,i,'priest'));
 assert.ok(item);const result=sanitizeEquipment({Wrists:{...item,enchantId:enchant.id}},'priest',catalog);
 assert.equal(result.Wrists.enchantId,enchant.id);
 assert.ok(!healerEnchantChoices(catalog.enchants,item,'priest').some(e=>e.id===enchant.id));
});
