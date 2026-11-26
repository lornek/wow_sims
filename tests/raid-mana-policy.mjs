import test from 'node:test';import assert from 'node:assert/strict';
import {createPull}from'../public/healing/engine.mjs';import{chooseHeal,healerConservation,companionBuild}from'../public/healing/raid.mjs';import shaman from'../public/healing/shaman.mjs';
const basic={cost:0,cast:0,gcd:0,cooldown:0,low:100,high:100,coefficient:0,multiplier:1};
const party=()=>Array.from({length:20},(_,i)=>({name:'P'+i,group:Math.floor(i/5),max:4000,dps:0}));
test('Healing Stream heals and previews only the caster group, even when aimed at another group',()=>{
 const stream={...basic,key:'stream',name:'Healing Stream Totem',party:true,period:1,duration:3,cast:1};const p=createPull({mana:1e4,power:0,crit:0,regen:0,mp5:0},{stream},{party:party(),raid:true,health:1e8,swing:0,limit:100},()=>.5);p.state.party.forEach(u=>u.hp=2000);p.start();p.cast('stream',2);
 assert.deepEqual(p.incomingHealing().map((v,i)=>v>0?i:null).filter(v=>v!==null),[15,16,17,18,19]);p.step(1);p.step(1);assert.ok(p.state.party.slice(15).every(u=>u.hp>2000));assert.ok(p.state.party.slice(0,15).every(u=>u.hp===2000));assert.equal(companionBuild(shaman,75).spells.stream.self,true);
});
test('conservation responds to boss health and mana, while preferring efficient affordable direct heals',()=>{
 const units=party(),state={time:1,mana:10000,boss:100,bossMax:100,cooldowns:{},gcd:0,effects:[]},spell=(key,heal,cost)=>({...basic,key,name:key,cost,low:heal,high:heal});
 const actor={pull:{state},unit:units[19],profile:{mana:10000,power:0,crit:0},focus:'raid',spells:{wave:spell('wave',2000,200),lesser:spell('lesser',1000,300)}};units.forEach(u=>u.hp=u.max);units[0].hp=3100;
 const early=healerConservation(actor);assert.equal(chooseHeal(actor,units,Array(20).fill(0)),null);state.boss=10;assert.ok(healerConservation(actor)<early);assert.equal(chooseHeal(actor,units,Array(20).fill(0)).key,'lesser');state.mana=1000;assert.ok(healerConservation(actor)>early);assert.equal(chooseHeal(actor,units,Array(20).fill(0)),null);
 units[0].hp=2000;assert.equal(chooseHeal(actor,units,Array(20).fill(0)).key,'wave');units[0].hp=200;assert.ok(chooseHeal(actor,units,Array(20).fill(0)));
});
test('Holy Binding makes Flash Heal worthwhile when the raid priest also needs healing',()=>{
 const units=party();
 const unit=units[19];
 const state={time:1,mana:10000,boss:100,bossMax:100,cooldowns:{},gcd:0,effects:[]};
 const flash={...basic,key:'flash',cost:380,low:1000,high:1000,selfCopy:.5};
 const heal={...basic,key:'heal',cost:275,low:700,high:700};
 const actor={pull:{state},unit,profile:{mana:10000,power:0,crit:0},focus:'raid',spells:{flash,heal}};
 units.forEach(ally=>ally.hp=ally.max);
 units[0].hp=3300;
 const incoming=Array(20).fill(0);
 assert.deepEqual(chooseHeal(actor,units,incoming),{key:'heal',index:0});
 unit.hp=3500;
 assert.deepEqual(chooseHeal(actor,units,incoming),{key:'flash',index:0});
 incoming[19]=500;
 assert.deepEqual(chooseHeal(actor,units,incoming),{key:'heal',index:0});
});
test('Water Shield shares a 3.5-second ICD across crit and damage triggers and refresh does not reset it',()=>{
 const waterShield={...basic,key:'waterShield',name:'Water Shield',waterShield:true,self:true,duration:600};const heal={...basic,key:'heal',name:'Heal'};const p=createPull({mana:10000,power:0,crit:1,regen:0,mp5:0},{waterShield,heal},{party:party(),health:1e8,swing:0,limit:100,startWaterShield:true},()=>0);p.start();p.state.mana=0;p.cast('heal',0);assert.equal(p.state.waterShield.charges,2);p.reactToDamage(p.state.party[19]);assert.equal(p.state.waterShield.charges,2);p.cast('waterShield',19);p.reactToDamage(p.state.party[19]);assert.equal(p.state.waterShield.charges,3);p.step(3.4);p.reactToDamage(p.state.party[19]);assert.equal(p.state.waterShield.charges,3);p.step(.11);p.reactToDamage(p.state.party[19]);assert.equal(p.state.waterShield.charges,2);
});
test('Tranquility is reserved for a whole-group emergency after incoming heals',()=>{
 const units=party();units.forEach(u=>u.hp=u.max);
 const state={time:1,mana:10000,boss:100,bossMax:100,cooldowns:{},gcd:0,effects:[]};
 const actor={pull:{state},unit:units[19],profile:{mana:10000,power:0,crit:0},focus:'raid',spells:{tranquility:{...basic,key:'tranquility'}}};
 const incoming=Array(20).fill(0);
 units.slice(15,18).forEach(u=>u.hp=2800);
 assert.equal(chooseHeal(actor,units,incoming),null);
 units.slice(15).forEach(u=>u.hp=1600);units[15].hp=4000;
 assert.equal(chooseHeal(actor,units,incoming),null);
 units[15].hp=1600;
 assert.deepEqual(chooseHeal(actor,units,incoming),{key:'tranquility',index:19});
 incoming[15]=2000;
 assert.equal(chooseHeal(actor,units,incoming),null);
});
