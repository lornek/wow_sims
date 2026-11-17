import test from 'node:test';
import assert from 'node:assert/strict';
import {recordHealingEvent, healingEventRows, healingMeterEntries} from '../public/healing/healing-events.mjs';
import {createPull} from '../public/healing/engine.mjs';
import shaman from '../public/healing/shaman.mjs';

const profile = {mana:10000,regen:0,mp5:0,castingRegen:0,power:0,crit:1};
const encounter = {party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0})), health:1e9,swing:0,limit:100,startWaterShield:true};
const base = {cost:0,cast:0,gcd:0,cooldown:0,coefficient:0,multiplier:1,low:100,high:100};

test('four categories preserve effective healing and crit rates within each event type', () => {
  const stats={};
  for(let i=0;i<4;i++)recordHealingEvent(stats,false,false,100,0);
  for(let i=0;i<6;i++)recordHealingEvent(stats,false,true,120,30);
  for(let i=0;i<9;i++)recordHealingEvent(stats,true,false,40,10);
  recordHealingEvent(stats,true,true,50,25);
  const rows=healingEventRows(stats);
  assert.deepEqual(rows.map(r=>r.key),['d_crits','d_hits','p_hits','p_crits']);
  assert.deepEqual(rows.map(r=>r.count),[6,4,9,1]);
  assert.equal(rows[0].critPercent,60);
  assert.equal(rows[3].critPercent,10);
  assert.equal(rows.reduce((n,r)=>n+r.effective,0),1530);
  assert.equal(rows.reduce((n,r)=>n+r.overheal,0),295);
});

test('Healing Stream can crit on every target without consuming Water Shield charges', () => {
  const stream=shaman.configureSpell({...base,key:'stream',name:'Healing Stream Totem',period:2,duration:6,party:true});
  assert.equal(stream.periodicCrit,true);
  const pull=createPull(profile,{stream,waterShield:{duration:600}},encounter,()=>.5);
  pull.start();pull.state.party.forEach(u=>u.hp=5000);pull.state.mana=1000;
  pull.cast('stream',4);pull.step(2);
  const stats=pull.state.meters.stream;
  assert.equal(stats.hits,5);assert.equal(stats.crits,5);
  assert.equal(stats.effective,750);
  const rows=healingEventRows(stats);
  assert.deepEqual(rows.map(r=>r.key),['p_crits','p_hits']);
  assert.equal(rows[0].count,5);assert.equal(rows[0].critPercent,100);
  assert.equal(pull.state.waterShield.charges,3);
  assert.equal(pull.state.manaSources['Water Shield'],undefined);
});

test('hybrid heals separately record direct and periodic critical events including overhealing', () => {
  const spell={...base,key:'regrowth',name:'Regrowth',duration:6,periodicCrit:true,
    hot:{low:40,high:40,coefficient:0,multiplier:1,period:3}};
  const pull=createPull(profile,{regrowth:spell}, {...encounter,startWaterShield:false},()=>.5);
  pull.start();pull.state.party[0].hp=9990;
  pull.cast('regrowth',0);pull.step(3);
  const stats=pull.state.meters.regrowth;
  const rows=healingEventRows(stats);
  assert.deepEqual(Object.fromEntries(rows.map(r=>[r.key,r.count])),{d_crits:1,d_hits:0,p_hits:0,p_crits:1});
  assert.equal(rows.reduce((n,r)=>n+r.effective,0),stats.effective);
  assert.equal(rows.reduce((n,r)=>n+r.overheal,0),stats.overheal);
  assert.equal(rows.reduce((n,r)=>n+r.count,0),stats.hits);
  assert.equal(healingEventRows({}).length,0);
});

for (const key of ['regrowth', 'chain']) test(key + ' split preserves healing, overhealing and full-spell HPM', () => {
  const spell = key === 'regrowth' ? {...base,key,duration:6,periodicCrit:true,
    hot:{low:40,high:40,coefficient:0,multiplier:1,period:3}}
    : {...base,key,chain:3,falloff:.5};
  const pull=createPull(profile,{[key]:spell},encounter,()=>.5);
  pull.start();pull.state.party.forEach(u=>u.hp=5000);
  pull.cast(key,0);pull.step(3);
  const original=pull.state.meters[key];
  original.mana=100;
  const entries=healingMeterEntries(pull.state.meters,true);
  assert.equal(entries.length,key === 'regrowth' ? 2 : 3);
  for (const field of ['effective','overheal','hits','crits'])
    assert.equal(entries.reduce((sum,e)=>sum+e.stats[field],0),original[field]);
  assert.ok(entries.every(e=>e.spellStats === original));
  assert.equal(healingMeterEntries(pull.state.meters,false).length,1);
  assert.equal(healingMeterEntries({[key]:{hits:1,effective:10}},true).length,1);
});
