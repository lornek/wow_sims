import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {purposeIcons,purposeIconPath,iconRegistryVersion}from '../public/healing/purpose-icons.mjs';
import {manaVisuals,contributionIcons}from '../public/healing/report-style.mjs';
import {healingEventKinds}from '../public/healing/healing-events.mjs';
const root=new URL('../public/healing/',import.meta.url);const read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
test('live registry, review sheet and authored source cannot drift',()=>{const master=read('custom-icons/icon-purposes.json'),review=read('custom-icons/icon-review.json');assert.equal(review.registryVersion,iconRegistryVersion);assert.deepEqual(review.rows,master.rows);assert.equal(master.rows.length,Object.keys(purposeIcons).length);for(const row of master.rows){assert.deepEqual(row.current,purposeIcons[row.key]);assert.ok(fs.existsSync(new URL(purposeIconPath(row.key),root)));assert.equal(row.options.length,3);assert.equal(new Set(row.options.map(i=>i.id)).size,3);assert.ok(row.options.every(i=>i.id!==row.current.id))}});
test('mana sources, contributions and event kinds use the selected semantic identities',()=>{assert.equal(purposeIcons.spirit.id,'mystical-healing-037');assert.equal(purposeIcons.mp5.id,'arcane-vitality-091');assert.equal(manaVisuals['Spirit regeneration'][0],purposeIconPath('spirit'));assert.equal(manaVisuals['Mana / 5'][0],purposeIconPath('mp5'));assert.equal(contributionIcons['Base Spirit'],purposeIconPath('spirit'));assert.equal(contributionIcons['Spirit talents'],purposeIconPath('spirit'));assert.equal(contributionIcons.Gear,purposeIconPath('gear'));assert.equal(contributionIcons['Human racial'],purposeIconPath('human'));assert.deepEqual(healingEventKinds.map(i=>i.icon),['direct-hits','crits','periodic-hits','periodic-crits'].map(purposeIconPath));assert.ok(!healingEventKinds.some(i=>i.badge));assert.equal(purposeIcons.casts.id,'mystical-healing-049');assert.equal(purposeIcons['direct-hits'].id,'arcane-vitality-021');assert.equal(purposeIcons.gained.id,'mana-renewal-044');assert.equal(purposeIcons.survived.id,'mystical-healing-073');assert.equal(purposeIconPath('hps'),purposeIconPath('periodic-hits'));assert.notEqual(purposeIconPath('normal-hits'),purposeIconPath('survived'))});
test('picker indexes every custom and local ability/report file with valid paths',()=>{const list=read('custom-icons/available-icons.json').icons;assert.equal(new Set(list.map(i=>i.id)).size,list.length);assert.equal(list.filter(i=>i.path.startsWith('custom-icons/')).length,read('custom-icons/catalog.json').icons.length);for(const family of ['icons','report-icons'])for(const name of fs.readdirSync(new URL(family+'/',root)))if(/\.(png|jpg|webp)$/.test(name))assert.ok(list.some(i=>i.path===family+'/'+name));for(const icon of list)assert.ok(fs.existsSync(new URL(icon.path,root)))});
test('enchant effect icons are distinct spell-library selections not assigned to other purposes',async()=>{
 const {enchantIconPurposes,enchantIconPath}=await import('../public/healing/enchant-icons.mjs');
 const keys=Object.values(enchantIconPurposes),paths=keys.map(purposeIconPath);
 assert.equal(keys.length,9);assert.equal(new Set(paths).size,9);
 for(const [id,key]of Object.entries(enchantIconPurposes)){
  assert.equal(enchantIconPath({id:id+':123'}),purposeIconPath(key));
  assert.ok(purposeIconPath(key).startsWith('custom-icons/'));
  assert.equal(Object.entries(purposeIcons).filter(([,value])=>value.path===purposeIconPath(key)).length,1);
 }
 assert.equal(enchantIconPath({id:7941}),null);
});
