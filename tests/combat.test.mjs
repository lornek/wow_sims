import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
import {nextThreat} from '../public/healing/threats.mjs';
const profile = {mana:1000, regen:0, power:0, crit:0, health:2000};
const spell = {key:'heal',name:'Test Heal',cost:100,cast:1,gcd:1.5,low:200,high:200};
const encounter = {health:100000,limit:30,swing:100,flurry:150,firstFlurry:5,poisonTick:0,party:[{name:'Tank',max:2000,dps:0},{name:'Healer',max:2000,dps:0}]};
function run() { let seed=7; return createPull(profile,{heal:spell},encounter,()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32)); }
test('cast acceptance, busy rejection, effective healing, mana and frozen report',()=>{
 const pull=run();pull.start(); pull.state.party[0].hp=1000;
 pull.cast('heal',0);assert.equal(pull.state.feedback.kind,'casting');
 pull.cast('heal',0);assert.equal(pull.state.feedback.kind,'blocked');
 for(let i=0;i<11;i++)pull.step(.1);
 assert.equal(pull.state.party[0].hp,1200);assert.equal(pull.state.mana,900);
 assert.equal(pull.state.feedback.kind,'landed');
 pull.state.mana=0;pull.state.gcd=0;pull.cast('heal',0);assert.match(pull.state.feedback.text,/mana/);
 while(pull.state.phase==='active')pull.step(.05);
 const final=JSON.stringify(pull.state);pull.step(2);assert.equal(JSON.stringify(pull.state),final);
});
test('seeded replay reproduces exact outcome and caps event history',()=>{
 const simulate=()=>{const p=run();p.start();for(let i=0;i<600;i++){p.cast('heal',0);p.step(.05);}return p.state;};
 assert.deepEqual(simulate(),simulate());assert.ok(simulate().events.length<=80);
});
test('threat timing and target follow existing boss rules',()=>{
 const state={phase:'active',time:8,nextSpecial:9,nextFlurry:10,enraged:false,party:[{hp:10,name:'Tank'},{hp:10,name:'Off-tank'}]};
 assert.deepEqual(nextThreat(state,{id:'patchwerk'}).targets,[1]);
 state.party[1].hp=0;assert.deepEqual(nextThreat(state,{id:'patchwerk'}).targets,[0]);
 assert.match(nextThreat(state,{id:'sapphiron'}).text,/Frost Aura in 1.0s/);
 assert.equal(nextThreat(state,{id:'rend'}).urgent,true);
});
test('critical and absorb feedback report actual healing and consumed shield',()=>{
 const p=createPull({...profile,crit:1},{heal:{...spell,cast:0},shield:{key:'shield',name:'Shield',cast:0,gcd:0,cost:50,duration:30,shield:300,multiplier:1,coefficient:0}},encounter,()=>0);
 p.start();p.state.party[0].hp=1000;p.cast('heal',0);
 assert.equal(p.state.feedback.kind,'crit');assert.equal(p.state.party[0].hp,1300);
 p.state.gcd=0;p.cast('shield',0);p.step(2);
 assert.equal(p.state.feedback.kind,'absorbed');assert.match(p.state.feedback.text,/100 absorbed/);
 assert.equal(p.state.party[0].hp,1300);assert.equal(p.state.party[0].shield.amount,200);
});
test('a dying cast target gives interruption feedback without spending mana',()=>{
 const p=run();p.start();p.cast('heal',0);p.state.party[0].hp=0;p.step(1);
 assert.match(p.state.feedback.text,/interrupted/);assert.equal(p.state.mana,1000);
});
