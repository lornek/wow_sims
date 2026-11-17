import test from 'node:test';
import assert from 'node:assert/strict';
import shaman from '../public/healing/shaman.mjs';
import druid from '../public/healing/druid.mjs';
import priest from '../public/healing/priest.mjs';
import paladin from '../public/healing/paladin.mjs';
import {normalizeAdditionalStats,spellCritPercentPerIntellect} from '../public/healing/additional-stats.mjs';
const additional={power:140,intellect:80,spirit:100,mp5:30};
const buffs=new Set(['kings','mark','intellect','spirit','wisdom','mageblood']);
const setups=[
  [shaman,{ancestral:5,mindfulness:3,crit:5,thundering:5}],
  [druid,{'Heart of the Wild':5,'Living Spirit':3,'Gift of Nature':5,Bloom:1,Reflection:3}],
  [priest,{'Mental Strength':5,'Spiritual Guidance':5,Meditation:3,'Holy Specialization':5}],
  [paladin,{'Divine Intellect':5,Reverence:2,Conviction:3}]
];
for(const [adapter,talents] of setups) {
 test(`${adapter.className}: additional stats exactly match gear through buffs and talents`,()=>{
   const name=Object.keys(adapter.loadouts)[0];
   const actual=adapter.buildProfile(name,buffs,additional,talents);
   adapter.loadouts.__additionalTest={...adapter.loadouts[name],Additional:{stats:additional}};
   try {assert.deepEqual(actual,adapter.buildProfile('__additionalTest',buffs,0,talents));}
   finally {delete adapter.loadouts.__additionalTest;}
   assert.equal(Object.values(actual.mp5Sources).reduce((a,b)=>a+b,0),actual.mp5);
   assert.ok(Math.abs(Object.values(actual.spiritRates).reduce((a,b)=>a+b,0)-actual.regen)<1e-9);
 });
 test(`${adapter.className}: all added Intellect contributes to mana and class-specific spell crit`,()=>{
   const name=Object.keys(adapter.loadouts)[0];
   const baseline=adapter.buildProfile(name,buffs,0,talents);
   const boosted=adapter.buildProfile(name,buffs,{intellect:80},talents);
   const intellect=boosted.intellect-baseline.intellect;
   assert.ok(intellect>80); // Kings and the class's Intellect talent both apply.
   assert.equal(boosted.mana-baseline.mana,intellect*15);
   assert.ok(Math.abs(boosted.crit-baseline.crit-intellect*spellCritPercentPerIntellect[adapter.className]/100)<1e-12);
 });
}
test('legacy custom +healing is migrated without double counting; invalid stats are bounded',()=>{
 assert.deepEqual(normalizeAdditionalStats(200),{power:200,intellect:0,spirit:0,mp5:0});
 assert.deepEqual(normalizeAdditionalStats({power:Infinity,intellect:-1,spirit:42.8,mp5:99999}),{power:0,intellect:0,spirit:42,mp5:5000});
 for(const [adapter,talents] of setups){const name=Object.keys(adapter.loadouts)[0];assert.deepEqual(adapter.buildProfile(name,buffs,200,talents),adapter.buildProfile(name,buffs,{power:200},talents));}
});
