import test from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
import {applyTalents} from '../public/healing/druid-profile.mjs';
import {swiftmendRange} from '../public/healing/healing-preview.mjs';
const raw={key:'regrowth',name:'Regrowth',low:100,high:100,coefficient:.5,cast:0,gcd:0,cost:0,cooldown:0,
  duration:6,periodicCrit:true,swiftmendable:true,hot:{low:40,high:40,coefficient:.1,period:3}};
const swiftmend={key:'swiftmend',name:'Swiftmend',swiftmend:true,cost:0,cast:0,gcd:0,cooldown:0};
const encounter={party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0})),health:1e9,swing:0,limit:100};
function run(source,crit,roll) {
  const events=[];
  const p=createPull({mana:10000,regen:0,mp5:0,castingRegen:0,power:100,crit}, {[source.key]:source,swiftmend},encounter,()=>roll,e=>events.push(e));
  p.start();p.state.party[0].hp=1000;p.cast(source.key,0);p.step(3);
  return {p,events};
}
test('Improved Regrowth crit chance applies to both its initial heal and periodic ticks',()=>{
  for(const [rank,expected] of [[0,false],[5,true]]) {
    const source=applyTalents(raw,{'Improved Regrowth':rank});
    const {events}=run(source,.1,.55);
    assert.equal(source.bonusCrit,rank*.1);
    assert.equal(events.length,2);
    assert.equal(events[0].crit,expected);
    assert.equal(events[1].crit,expected);
  }
});
test('Swiftmend starts from uncritted HoT value even after direct and periodic Regrowth crits',()=>{
  const source=applyTalents(raw,{'Gift of Nature':5,Genesis:5,'Improved Regrowth':5});
  const {p,events}=run(source,0,.25);
  assert.equal(events[0].crit,true);assert.equal(events[1].crit,true);
  const effect=p.state.effects.find(e=>e.key==='regrowth');
  assert.ok(Math.abs(effect.amount-60.5)<1e-10);
  p.cast('swiftmend',0);
  const heal=events.at(-1);
  assert.equal(heal.key,'swiftmend');assert.equal(heal.crit,false);
  assert.equal(heal.amount,121);
  assert.deepEqual(swiftmendRange(source,100),[121,121]);
  assert.ok(p.state.effects.includes(effect));
});
test('Swiftmend rolls its own crit once without inheriting Improved Regrowth crit bonus',()=>{
  const source=applyTalents(raw,{'Gift of Nature':5,Genesis:5,'Improved Regrowth':5});
  const {p,events}=run(source,1,.25);
  p.cast('swiftmend',0);
  assert.equal(events.at(-1).crit,true);
  assert.equal(events.at(-1).amount,Math.round(121*1.5));
  assert.equal(events.at(-1).amount,182);
});


test('Swiftmend from Rejuvenation also uses uncritted full-duration healing then its own crit',()=>{
  const source=applyTalents({...raw,key:'rejuvenation',name:'Rejuvenation',hot:undefined,period:3,low:40,high:40,coefficient:.1},
    {'Gift of Nature':5,Genesis:5,'Improved Rejuvenation':3,"Nature's Splendor":1});
  const {p,events}=run(source,1,.25);
  assert.equal(events[0].crit,true);
  const base=swiftmendRange(source,100)[0];
  const effect=p.state.effects.find(e=>e.key==='rejuvenation');
  const rawFull=effect.amount*effect.ticks;
  assert.equal(base,Math.round(rawFull));
  p.cast('swiftmend',0);
  assert.equal(events.at(-1).key,'swiftmend');
  assert.equal(events.at(-1).amount,Math.round(rawFull*1.5));
});
