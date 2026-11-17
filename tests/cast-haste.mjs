import test from 'node:test';import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
import {normalizeAdditionalStats} from '../public/healing/additional-stats.mjs';
const profile={mana:10000,regen:0,mp5:0,power:0,crit:0,haste:1};
const encounter={health:1e9,limit:100,swing:0,flurry:0,poisonTick:0,party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0}))};
const spell={key:'heal',name:'Heal',cast:1.5,gcd:1.5,cooldown:0,cost:100,low:100,high:100,coefficient:0,multiplier:1};
test('100% haste halves a 1.5s heal while preserving the remaining 0.75s GCD',()=>{
 const p=createPull(profile,{heal:spell},encounter,()=>.5);p.start();p.cast('heal',0);
 assert.equal(p.state.cast.end,.75);assert.equal(p.state.gcd,1.5);
 p.step(.75);assert.equal(p.state.cast,null);assert.equal(p.state.meters.heal.casts,1);
 p.cast('heal',0);assert.equal(p.state.cast,null);
 p.step(.75);p.cast('heal',0);assert.equal(p.state.cast.end,2.25);
});
test('instant healing starts the fixed GCD; haste does not speed periodic healing or streams',()=>{
 for(const party of [false,true]){const hot={...spell,cast:0,period:3,duration:12,party};const p=createPull(profile,{heal:hot},encounter,()=>.5);p.start();p.state.party.forEach(u=>u.hp=5000);p.cast('heal',0);
 assert.equal(p.state.cast,null);assert.equal(p.state.gcd,1.5);assert.equal(p.state.effects[0].period,3);assert.equal(p.state.effects[0].next,3);assert.equal(p.state.effects[0].ticks,4);
 p.step(2.9);assert.equal(p.state.meters.heal.hits,0);p.step(.1);assert.equal(p.state.meters.heal.hits,party?5:1);}
});
test('crit and haste accept fractional percentage points and persist through normalization',()=>{
 assert.equal(normalizeAdditionalStats({crit:2.5,haste:12.75}).crit,2.5);assert.equal(normalizeAdditionalStats({haste:12.75}).haste,12.75);
});
for(const cls of ['shaman','druid','paladin','priest'])test(`${cls} custom crit and haste apply as percentage points`,async()=>{const {default:adapter}=await import('../public/healing/'+cls+'.mjs');const loadout=Object.keys(adapter.loadouts)[0];const a=adapter.buildProfile(loadout,new Set(),{},{}),b=adapter.buildProfile(loadout,new Set(),{crit:2.5,haste:100},{});assert.ok(Math.abs(b.crit-a.crit-.025)<1e-10);assert.ok(Math.abs(b.haste-a.haste-1)<1e-10);});
