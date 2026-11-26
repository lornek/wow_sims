import test from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
import {omenChance,omenModel} from '../public/healing/omen-of-clarity.mjs';
import {applyTalents,buildProfile} from '../public/healing/druid-profile.mjs';
const profile={mana:10000,regen:0,mp5:0,castingRegen:.5,power:0,crit:0,omen:true};
const encounter={party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0})),health:1e9,swing:0,limit:1000};
const base={key:'touch',name:'Healing Touch',level:60,cost:100,cast:0,gcd:0,cooldown:0,coefficient:0,multiplier:1,low:100,high:100,omenEligible:true};
function make(spells={touch:base},overrides={},random=()=>0){
  const pull=createPull({...profile,...overrides},spells,encounter,random);pull.start();pull.state.nextPoison=Infinity;pull.state.nextSwing=Infinity;pull.state.party.forEach(u=>u.hp=5000);return pull;
}
test('Druid buff enables the estimated model and only eligible spells roll',()=>{
  assert.equal(buildProfile('Ungeared',new Set(['omen']),0).omen,true);
  assert.equal(buildProfile('Ungeared',new Set(),0).omen,false);
  assert.equal(omenChance(base),.05);
  assert.equal(omenChance({...base,key:'regrowth'}),.08);
  assert.ok(Math.abs(omenChance({...base,level:1})-.01)<1e-12);
  assert.equal(omenChance({...base,omenEligible:false}),0);
  for(const key of ['regrowth','touch','growth','rejuvenation','swiftmend','poison','tranquility'])assert.equal(applyTalents({...base,key},{}).omenEligible,true);
  assert.equal(applyTalents({...base,key:'potion'},{}).omenEligible,false);
});
test('proc does not refund its triggering spell; the next eligible spell is free at zero mana',()=>{
  const pull=make();pull.cast('touch',0);
  assert.equal(pull.state.mana,9900);assert.equal(pull.state.omenProcs,1);
  assert.equal(pull.state.clearcastingUntil,15);assert.equal(pull.state.omenNext,10);
  pull.state.mana=0;pull.cast('touch',0);
  assert.equal(pull.state.mana,0);assert.equal(pull.state.manaSpent,100);
  assert.equal(pull.state.clearcastingUses,1);assert.equal(pull.state.clearcastingUntil,0);
  assert.equal(pull.state.meters.touch.mana,100);
  assert.equal(pull.state.manaSources['Omen of Clarity · spell cost'],100);
  assert.equal(pull.state.omenProcs,1);
});
test('10-second ICD is exact and a new proc can refresh one nonstacking charge',()=>{
  const pull=make();pull.cast('touch',0);pull.step(9.99);pull.cast('touch',0);
  assert.equal(pull.state.omenProcs,1);pull.step(.01);pull.cast('touch',0);
  assert.equal(pull.state.omenProcs,2);assert.equal(pull.state.clearcastingUntil,25);
  assert.equal(pull.state.omenNext,20);
});
test('HoT applications roll once; periodic ticks and party targets never add rolls',()=>{
  let rolls=0;const random=()=>{rolls++;return 0;};
  const spell={...base,key:'growth',party:true,period:1,duration:20};
  const pull=make({growth:spell},{},random);pull.cast('growth',0);
  assert.equal(pull.state.omenProcs,1);
  for(let i=0;i<12;i++)pull.step(1);
  assert.equal(pull.state.omenProcs,1);
  assert.ok(pull.state.meters.growth.hits>=50);
  // One amount roll and one proc roll; periodic non-crits add none.
  assert.equal(rolls,2);
});
test('Clearcasting expires at 15 seconds and disabled Druid does not proc',()=>{
  const pull=make();pull.cast('touch',0);pull.step(15);pull.state.mana=0;pull.cast('touch',0);
  assert.equal(pull.state.clearcastingUses,0);assert.equal(pull.state.meters.touch.casts,1);
  const disabled=make(undefined,{omen:false});disabled.cast('touch',0);assert.equal(disabled.state.omenProcs,0);
});
test('free cast reserved at cast start survives expiry and does not restart five-second rule',()=>{
  const pull=make({touch:{...base,cast:2}},{regen:10});
  pull.cast('touch',0);pull.step(2);assert.equal(pull.state.clearcastingUntil,17);
  pull.step(14);pull.state.mana=1000;pull.cast('touch',0);assert.equal(pull.state.clearcastingUntil,0);
  pull.step(2);assert.equal(pull.state.clearcastingUses,1);assert.equal(pull.state.lastSpend,2);
  pull.step(1);assert.ok(pull.state.manaSources['Omen of Clarity · Spirit regeneration']>0);
});
test('unrelated utilities and rejected casts do not consume Clearcasting',()=>{
  const potion={...base,key:'potion',cost:0,omenEligible:false,manaRange:[100,100]};
  const pull=make({touch:base,potion});pull.cast('touch',0);pull.cast('potion',4);
  assert.equal(pull.state.clearcastingUntil,15);assert.equal(pull.state.clearcastingUses,0);
  pull.state.party[0].hp=0;pull.cast('touch',0);assert.equal(pull.state.clearcastingUntil,15);
});
test('seeded trials fit the selected spell rates',()=>{
  let seed=12345;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
  for(const key of ['touch','regrowth']){
    const chance=omenChance({...base,key});let procs=0;
    for(let i=0;i<100000;i++)if(random()<chance)procs++;
    assert.ok(Math.abs(procs/100000-chance)<.003);
  }
  assert.equal(omenModel.duration,15);
});
test('engine uses separate 5% and 8% thresholds',()=>{
  const normal=make(undefined,{},()=>.06);normal.cast('touch',0);assert.equal(normal.state.omenProcs,0);
  const regrowth=make({regrowth:{...base,key:'regrowth'}},{},()=>.06);regrowth.cast('regrowth',0);assert.equal(regrowth.state.omenProcs,1);
});
test('Omen Spirit savings stop after the free cast counterfactual window',()=>{
  const pull=make(undefined,{regen:10});pull.state.mana=1000;
  pull.cast('touch',0);pull.step(6);pull.cast('touch',0);pull.step(5);
  const saved=pull.state.manaSources['Omen of Clarity · Spirit regeneration'];
  assert.equal(saved,25);pull.step(5);
  assert.equal(pull.state.manaSources['Omen of Clarity · Spirit regeneration'],saved);
});
