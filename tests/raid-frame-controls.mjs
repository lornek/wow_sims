import test from 'node:test';import assert from 'node:assert/strict';
import {createPull}from'../public/healing/engine.mjs';
import{chooseHeal,companionBuild}from'../public/healing/raid.mjs';
import paladin from'../public/healing/paladin.mjs';import priest from'../public/healing/priest.mjs';
import{spellSounds,spellCastingSound}from'../public/healing/spell-sounds.mjs';
import{reportManaVisual}from'../public/healing/report-style.mjs';
const party=()=>Array.from({length:5},(_,i)=>({name:'P'+i,role:i<2?'Tank':i===4?'Healer':'Damage',max:4000,dps:0,group:0}));
function actorFor(adapter,spec,focus='raid'){const b=companionBuild(adapter,75,new Set(),spec);const p=createPull(b.profile,b.spells,{party:party(),health:1e8,swing:0,limit:200},()=>.5);p.start();return{...b,pull:p,unit:p.state.party[4],focus};}
test('tank priority maintains Oath, helps raid targets under covered tanks and survives tank deaths',()=>{
 const a=actorFor(paladin,'paladin','tanks'),s=a.pull.state,units=s.party;assert.equal(chooseHeal(a,units,Array(5).fill(0)).key,'oath');s.oath={target:units[0],expires:300};units[2].hp=1700;
 assert.equal(chooseHeal(a,units,Array(5).fill(0)).index,2);units[0].hp=3500;assert.equal(chooseHeal(a,units,Array(5).fill(0)).index,2);units[0].hp=3000;
 assert.equal(chooseHeal(a,units,[1000,0,0,0,0]).index,2);units[0].hp=400;assert.equal(chooseHeal(a,units,Array(5).fill(0)).index,0);
 units[0].hp=0;units[1].hp=0;assert.equal(chooseHeal(a,units,Array(5).fill(0)).index,2);
});
test('Holy priest prefers Mending and pairs Prayer with Inner Focus instead of spamming it',()=>{
 const a=actorFor(priest,'holy'),s=a.pull.state;for(const u of s.party){u.hp=1500;u.weakened=100;}
 assert.equal(chooseHeal(a,s.party,Array(5).fill(0)).key,'mending');s.cooldowns.mending=100;
 assert.equal(chooseHeal(a,s.party,Array(5).fill(0)).key,'focus');s.innerFocus=20;assert.equal(chooseHeal(a,s.party,Array(5).fill(0)).key,'prayer');
 s.innerFocus=0;s.cooldowns.focus=100;assert.notEqual(chooseHeal(a,s.party,Array(5).fill(0)).key,'prayer');
});
test('cancelling pending casts spends no mana or healing, and cancelling channels stops future ticks',()=>{
 const base={name:'Heal',key:'heal',cost:10,cast:3,gcd:1.5,cooldown:0,low:100,high:100,coefficient:0,multiplier:1};const p=createPull({mana:1000,power:0,crit:0,regen:0,mp5:0},{heal:base,channel:{...base,key:'channel',cast:0,channel:true,period:1,duration:3}},{party:party(),health:1e8,swing:0,limit:100},()=>.5);p.start();p.state.party[0].hp=1000;
 p.cast('heal',0);p.step(.5);assert.equal(p.cancelCast(),true);p.step(3);assert.equal(p.state.manaSpent,0);assert.equal(p.state.healing,0);assert.equal(p.cancelCast(),false);
 p.cast('channel',0);p.step(1);const healing=p.state.healing;assert.ok(healing>0);p.cancelCast();p.step(4);assert.equal(p.state.healing,healing);assert.equal(p.state.manaSpent,10);
});
test('Wild Growth has a casting loop plus landing cues, and group mana reports use named totem icons',()=>{
 assert.ok(spellCastingSound({name:'Wild Growth'}));assert.ok(spellSounds['Wild Growth'].landing.length>=1);
 assert.match(reportManaVisual('Mana Tide Totem · group')[0],/spell_frost_summonwaterelemental/);assert.match(reportManaVisual('Mana Spring · DPS Shaman')[0],/spell_nature_manaregentotem/);
});
test('cancelled pending free casts retain their original buff expiry without granting a new duration',()=>{
 const spell={name:'Healing Touch',key:'touch',cost:100,cast:3,gcd:1.5,cooldown:0,low:100,high:100,coefficient:0,multiplier:1,omenEligible:true};const p=createPull({mana:1000,power:0,crit:0,regen:0,mp5:0,omen:true},{touch:spell},{party:party(),health:1e8,swing:0,limit:100},()=>.5);p.start();p.state.clearcastingUntil=15;p.cast('touch',0);assert.equal(p.state.clearcastingUntil,0);p.step(.2);p.cancelCast();assert.equal(p.state.clearcastingUntil,15);assert.equal(p.state.clearcastingUses,0);assert.equal(p.state.manaSpent,0);
});
