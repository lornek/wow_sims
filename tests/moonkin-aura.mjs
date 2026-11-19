import test from 'node:test';
import assert from 'node:assert/strict';
import druid from '../public/healing/druid.mjs';
import shaman from '../public/healing/shaman.mjs';
import priest from '../public/healing/priest.mjs';
import paladin from '../public/healing/paladin.mjs';
for (const healer of [druid,shaman,priest,paladin]) test(healer.className+' Moonkin Aura adds three percentage points of crit',()=>{
 const ordinary=healer.buildProfile('Ungeared',new Set(),0);
 const aura=healer.buildProfile('Ungeared',new Set(['moonkin']),0);
 assert.ok(Math.abs(aura.crit-ordinary.crit-.03)<1e-12);
 for(const stat of ['mana','power','intellect','regen'])assert.equal(aura[stat],ordinary[stat]);
 assert.equal(healer.buffs.filter(([key])=>key==='moonkin').length,1);
});
