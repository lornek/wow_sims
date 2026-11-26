import test from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
const profile={mana:10000,regen:0,mp5:0,castingRegen:0,power:0,crit:0,pushbackResist:0};
const heal={key:'heal',name:'Heal',cast:4,cost:0,gcd:0,cooldown:0,low:100,high:100,coefficient:0,multiplier:1};
const encounter={id:'sapphiron',party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0})),health:1e9,swing:0,frost:105,limit:100};
test('Frost Aura damages the healer and triggers Water Shield and Mending without delaying casts',()=>{
 const mending={...heal,key:'mending',name:'Prayer of Mending',cast:0,mending:true};
 const p=createPull(profile,{heal,mending,waterShield:{duration:600}},{...encounter,startWaterShield:true},()=>.5);
 p.start();p.state.mana=5000;p.cast('mending',4);p.cast('heal',0);p.step(2);
 assert.equal(p.state.cast.pushbacks,0);assert.equal(p.state.cast.end,4);
 assert.equal(p.state.party[4].hp,9995);assert.equal(p.state.waterShield.charges,2);assert.equal(p.state.meters.mending.hits,1);
 p.step(2);assert.equal(p.state.cast,null);assert.equal(p.state.meters.heal.casts,1);
});
test('Sapphiron melee still causes pushback while its simultaneous aura does not',()=>{
 const p=createPull(profile,{heal},{...encounter,swing:100},()=>.5);p.start();p.state.party.slice(0,4).forEach(u=>u.hp=0);
 p.cast('heal',4);p.step(2);assert.equal(p.state.cast.pushbacks,1);assert.equal(p.state.cast.end,4.5);
});
test('other party damage retains ordinary spell pushback',()=>{
 const p=createPull(profile,{heal},{...encounter,id:'rend',firstFlurry:2,flurry:100},()=>.5);
 p.start();p.cast('heal',0);p.step(2);assert.equal(p.state.cast.pushbacks,1);assert.equal(p.state.cast.end,4.5);
});
