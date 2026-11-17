import test from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
import {healingRange} from '../public/healing/healing-preview.mjs';

const chain = {key:'chain',name:'Chain Heal',low:1000,high:1000,coefficient:0,multiplier:1,
  chain:3,falloff:.5,cost:0,cast:2,gcd:0,cooldown:0};
const riptide = {key:'riptide',name:'Riptide',low:0,high:0,coefficient:0,multiplier:1,
  period:3,duration:15,directChainBonus:.25,cost:0,cast:0,gcd:0,cooldown:0};
function setup({target=0,duration=15,crit=0,random=()=>.9}={}) {
  const events=[];
  const p=createPull({mana:10000,regen:0,mp5:0,power:0,crit},
    {chain,riptide:{...riptide,duration}},
    {party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0})),health:1e9,swing:0,limit:100},
    random,event=>events.push(event));
  p.start();
  p.state.party.forEach(unit=>unit.hp=1000);
  p.cast('riptide',target);
  return {p,events};
}
function finish({p,events}) {
  p.cast('chain',0);p.step(2);
  return events.filter(event=>event.key==='chain');
}
test('Riptide boosts the whole chain, and incoming previews agree with actual healing',()=>{
  const run=setup();run.p.cast('chain',0);
  assert.deepEqual(run.p.incomingHealing().slice(0,3),[1250,625,313]);
  run.p.step(2);
  const hits=run.events.filter(event=>event.key==='chain');
  assert.deepEqual(hits.map(event=>event.amount),[1250,625,313]);
  assert.deepEqual(hits.map(event=>event.bounce),[0,1,2]);
  assert.deepEqual([0,1,2].map(index=>healingRange(chain,0,1.25*chain.falloff**index)[0]),hits.map(event=>event.amount));
});
test('Riptide on a bounce target alone does not activate the cast bonus',()=>{
  assert.deepEqual(finish(setup({target:1})).map(event=>event.amount),[1000,500,250]);
});
test('Riptide expiring before the cast lands removes its bonus from every hit and preview',()=>{
  const run=setup({duration:1});run.p.cast('chain',0);
  assert.deepEqual(run.p.incomingHealing().slice(0,3),[1000,500,250]);
  run.p.step(2);
  assert.deepEqual(run.events.filter(event=>event.key==='chain').map(event=>event.amount),[1000,500,250]);
});
test('primary overhealing does not reduce bounce healing',()=>{
  const run=setup();run.p.state.party[0].hp=9950;
  const hits=finish(run);
  assert.deepEqual(hits.map(event=>event.effective),[50,625,313]);
});
test('each target still rolls its own critical heal',()=>{
  const rolls=[.9,.5,0,.9,.9];
  const hits=finish(setup({crit:.5,random:()=>rolls.shift()??.9}));
  assert.deepEqual(hits.map(event=>event.crit),[true,false,false]);
  assert.deepEqual(hits.map(event=>event.amount),[1875,625,313]);
});
