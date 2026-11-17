import fs from 'node:fs';
import test from 'node:test';import assert from 'node:assert/strict';
import {foreverSpellbook,foreverActiveTalents,foreverTrainerSpells}from '../public/healing/forever-spellbook.mjs';
import {spellbookEntries}from '../public/healing/spellbook-layout.mjs';
for(const cls of ['shaman','druid','priest','paladin'])test(`${cls}: only Forever trainer spells and reviewed active talent abilities appear`,async()=>{
 const c=(await import('../public/healing/'+cls+'.mjs')).default;
 const nodes=c.trees.flatMap(t=>t.nodes);const active=new Set(foreverActiveTalents[cls]);
 const b=foreverSpellbook(cls,{...c.catalog,'Invented SoD Ability':{ranks:[{level:1}]},'Healing Rain':{ranks:[{level:1}]}},c.trees,c.spellGroups);
 assert.equal(b['Invented SoD Ability'],undefined);assert.equal(b['Healing Rain'],undefined);
 for(const node of nodes)assert.equal(Boolean(b[node.name]),active.has(node.name),node.name);
 for(const [name,entry]of Object.entries(b)){assert.notEqual(c.spellGroups[name]?.[1],'removed');assert.ok(entry.talentAbility||foreverTrainerSpells[cls].includes(name));assert.ok(fs.existsSync(new URL('../public/healing/icons/'+entry.icon,import.meta.url)),name+' has a local icon');}
});
test('removed abilities are excluded even from a raw search and cannot return via all ranks',()=>{
 const rows=[{name:'Fire Nova Totem',school:'elemental',status:'removed',ranks:[{rank:{level:1}}]}];
 assert.equal(spellbookEntries(rows,{school:'Elemental',query:'nova',allRanks:true}).length,0);
});
test('highest-rank rows retain first-learned ordering, matching the trainer spellbook',()=>{
 const rows=[{name:'First learned',school:'holy',ranks:[{rank:{level:1}},{rank:{level:60}}]},{name:'Later learned',school:'holy',ranks:[{rank:{level:10}}]}];
 assert.deepEqual(spellbookEntries(rows,{school:'Holy'}).map(x=>x.name),['First learned','Later learned']);
});
