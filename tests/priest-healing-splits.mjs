import test from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
import {healingMeterEntries} from '../public/healing/healing-events.mjs';
import priest from '../public/healing/priest.mjs';

const profile={mana:10000,regen:0,mp5:0,castingRegen:0,power:0,crit:0};
const encounter={party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0})),health:1e9,swing:0,limit:100};
const base={cost:0,cast:0,gcd:0,cooldown:0,coefficient:0,multiplier:1,low:100,high:100};
const mending={...base,key:'mending',mending:true};

for(const crit of [0,1])test('Holy Binding splits actual events, keeps totals and full-spell HPM (crit '+crit+')',()=>{
  const flash=priest.applyTalents({...base,key:'flash',cost:100},{'Holy Binding':1});
  const pull=createPull({...profile,crit},{flash},encounter,()=>.5);
  pull.start();pull.state.party[0].hp=9950;pull.state.party[4].hp=9975;
  pull.cast('flash',0);
  const stats=pull.state.meters.flash;
  const entries=healingMeterEntries(pull.state.meters,true);
  assert.deepEqual(entries.map(e=>e.label),['direct','holy binding']);
  assert.equal(stats.components.direct.effective,50);
  assert.equal(stats.components.binding.effective,25);
  for(const field of ['hits','crits','effective','overheal'])
    assert.equal(entries.reduce((sum,e)=>sum+e.stats[field],0),stats[field]);
  assert.ok(entries.every(e=>e.spellStats===stats && e.stats.casts===1));
  assert.equal(stats.effective/stats.mana,.75);
  assert.equal(stats.crits,crit*2);
});

test('Flash Heal without Holy Binding stays combined, and self-casting does not copy',()=>{
  for(const selfCopy of [0,.5]){
    const pull=createPull(profile,{flash:{...base,key:'flash',selfCopy}},encounter,()=>.5);
    pull.start();pull.state.party[4].hp=5000;pull.cast('flash',4);
    assert.equal(pull.state.meters.flash.hits,1);
    assert.equal(healingMeterEntries(pull.state.meters,true).length,1);
    assert.equal(pull.state.meters.flash.components?.binding,undefined);
  }
});

function auraPull(){
  const pull=createPull(profile,{mending}, {...encounter,id:'sapphiron',frost:100},()=>.5);
  pull.start();pull.state.party.forEach(u=>u.hp=5000);pull.state.nextSwing=Infinity;
  pull.cast('mending',0);return pull;
}

test('one Frost Aura pulse consumes one Mending charge, regardless of holder order',()=>{
  for(let target=0;target<5;target++){
    const pull=auraPull();pull.state.mending.target=pull.state.party[target];
    pull.step(2);
    assert.equal(pull.state.meters.mending.hits,1);
    assert.equal(pull.state.mending.left,4);
    assert.notEqual(pull.state.mending.target,pull.state.party[target]);
    assert.equal(pull.state.mending.expires,32);
  }
});

test('subsequent Frost Aura pulses use remaining charges, no artificial cooldown',()=>{
  const pull=auraPull();
  for(let i=1;i<=5;i++){
    pull.step(2);
    assert.equal(pull.state.meters.mending.hits,i);
    assert.equal(pull.state.mending?.left??0,5-i);
  }
  assert.equal(pull.state.mending,null);
});

test('Mending triggers on direct healing but not periodic healing, and cannot trigger itself',()=>{
  const flash={...base,key:'flash'};
  const renew={...base,key:'renew',period:1,duration:3};
  const pull=createPull(profile,{mending,flash,renew},encounter,()=>.5);
  pull.start();pull.state.party.forEach(u=>u.hp=5000);pull.state.nextSwing=Infinity;
  pull.cast('mending',0);pull.cast('renew',0);pull.step(1);
  assert.equal(pull.state.meters.mending.hits,0);
  pull.cast('flash',0);
  assert.equal(pull.state.meters.mending.hits,1);
  const next=pull.state.party.indexOf(pull.state.mending.target);
  pull.cast('flash',next);
  assert.equal(pull.state.meters.mending.hits,2);
});

test('expired Mending and fully absorbed Frost Aura do not proc',()=>{
  const pull=auraPull();pull.state.mending.expires=1;pull.step(2);
  assert.equal(pull.state.meters.mending.hits,0);
  const absorbed=auraPull();absorbed.state.party[0].shield={amount:1000,expires:30};
  absorbed.step(2);assert.equal(absorbed.state.meters.mending.hits,0);
  assert.equal(absorbed.state.mending.left,5);
});

test('separate melee and Frost Aura in the same update can each trigger Mending',()=>{
  // The boss melee amount is independent of its simultaneous party aura.
  const other=createPull(profile,{mending},{...encounter,id:'sapphiron',swing:100,frost:100},()=>.5);
  other.start();other.state.party.forEach(u=>u.hp=5000);other.cast('mending',0);
  other.step(2);
  assert.equal(other.state.meters.mending.hits,2);
  assert.equal(other.state.mending.left,3);
});

test('Blade Flurry also treats party damage as one pulse',()=>{
  const pull=createPull(profile,{mending},{...encounter,firstFlurry:2,flurry:100},()=>.5);
  pull.start();pull.state.party.forEach(u=>u.hp=5000);pull.cast('mending',0);pull.step(2);
  assert.equal(pull.state.meters.mending.hits,1);
  assert.equal(pull.state.mending.left,4);
});
