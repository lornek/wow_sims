import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createPull} from '../public/healing/engine.mjs';
import {enchantEffectDefinitions} from '../public/healing/enchant-effects.mjs';
import {effectiveEquipment} from '../public/healing/equipment.mjs';
import {healerEnchantChoices} from '../public/healing/healer-enchants.mjs';
import druid from '../public/healing/druid.mjs';
const base={key:'touch',name:'Healing Touch',level:60,cost:0,cast:0,gcd:0,cooldown:0,coefficient:1,multiplier:1,low:100,high:100};
const encounter={party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0})),health:1e9,swing:0,limit:1000};
function make(id,spells={touch:base},extra={},encounterExtra={}){
 const effect={...enchantEffectDefinitions[id],id:String(id),name:'Test enchant'};
 const profile={className:'druid',mana:10000,regen:0,mp5:0,castingRegen:0,power:0,crit:0,enchantEffects:[effect],...extra};
 const p=createPull(profile,spells,{...encounter,...encounterExtra},()=>.01);p.start();p.state.mana=1000;p.state.nextSwing=p.state.nextPoison=Infinity;p.state.party.forEach(u=>u.hp=5000);return p;
}
for(const [id,power] of [[7941,140],[7942,70]])test('grand enchant '+id+' restores mana, boosts subsequent healing, obeys ICD and expires',()=>{
 const p=make(id);p.cast('touch',0);assert.equal(p.state.meters.touch.effective,100);
 assert.ok(p.state.mana>=1300&&p.state.mana<=1500);assert.equal(p.healingPower(),power);
 p.cast('touch',0);assert.equal(p.state.enchantProcs[String(id)],1);assert.equal(p.state.meters.touch.effective,200+power);
 p.step(20);assert.equal(p.healingPower(),0);
});
test('Insight doubles Spirit regeneration and accounts for its capped mana separately',()=>{
 const p=make(8216,undefined,{spirit:100,regen:18.75,spiritHealingRatio:.25});p.cast('touch',0);
 assert.equal(p.healingPower(),25);assert.equal(p.manaRegenRate(),31.25);p.step(10);
 assert.equal(p.state.manaSources['Enchant Weapon - Insight'],125);assert.equal(p.manaRegenRate(),18.75);assert.equal(p.healingPower(),0);
 const n=p.state.enchantProcs['8216'];p.cast('touch',0);assert.equal(p.state.enchantProcs['8216'],n);p.step(35);p.cast('touch',0);assert.equal(p.state.enchantProcs['8216'],n+1);
});
test('Insight regeneration respects the mana cap',()=>{
 const p=make(8216,undefined,{spirit:100,regen:18.75});p.state.mana=9990;p.cast('touch',0);p.step(1);
 assert.equal(p.state.mana,10000);assert.ok(Math.abs(p.state.manaGained-10)<1e-9);
});
test('Revelation grants one direct crit without making Regrowth ticks crit',()=>{
 const regrowth={...base,key:'regrowth',name:'Regrowth',duration:6,hot:{low:20,high:20,coefficient:0,multiplier:1,period:3},periodicCrit:true};
 const p=make(8217,{touch:base,regrowth});p.cast('touch',0);assert.equal(p.state.enchantProcs['8217'],1);
 p.cast('regrowth',0);assert.equal(p.state.meters.regrowth.crits,1);assert.equal(p.state.enchantAuras['8217'].expires,0);
 p.step(3);assert.equal(p.state.meters.regrowth.crits,1);assert.equal(p.state.meters.regrowth.events.p_hits.count,1);
});
test('periodic heals and shield applications never roll spell-heal enchant procs',()=>{
 const hot={...base,key:'hot',period:1,duration:20,coefficient:0};
 const shield={...base,key:'shield',shield:100,duration:30};
 for(const id of [7941,7942,8216,8217]){const p=make(id,{hot,shield});p.cast('hot',0);p.cast('shield',0);for(let i=0;i<12;i++)p.step(1);assert.equal(p.state.enchantProcs[String(id)],undefined);}
});
test('physical hits trigger Absorption; its shield protects only subsequent physical damage',()=>{
 const p=make(8220,{}, {},{firstFlurry:1,flurry:100,id:'sapphiron',frost:100});
 p.state.nextSpecial=2;p.step(1);assert.equal(p.state.party[4].enchantAbsorb.amount,50);
 p.step(1);assert.equal(p.state.party[4].enchantAbsorb.amount,50);
 p.state.nextFlurry=3;p.step(1);assert.equal(p.state.meters.enchantAbsorb.effective,50);assert.equal(p.state.party[4].enchantAbsorb.amount,0);
});
test('new catalog stats and proc metadata reach character profiles without merging raw gear stats',()=>{
 const c=JSON.parse(fs.readFileSync(new URL('../public/healing/catalog/items.json',import.meta.url)));
 const weapon=c.items.find(i=>i.type===13&&i.twoHand&&i.weaponType===4);
 const effect=c.enchants.find(e=>e.name==='Enchant 2H Weapon - Grand Arcanist');
 const raw={'Main hand':{...weapon,enchantId:effect.id}},kit=effectiveEquipment(raw,c);
 assert.deepEqual(raw['Main hand'].stats,weapon.stats);assert.equal(kit['Main hand'].enchantEffects[0].power,140);
 const profile=druid.buildProfile(kit,new Set(),0);assert.equal(profile.enchantEffects[0].kind,'power');
 assert.ok(healerEnchantChoices(c.enchants,weapon,'druid').some(e=>e.id===effect.id));
 assert.equal(c.enchants.find(e=>e.name==='Enchant Shield - Critical Strike').stats.crit,1);
 assert.equal(c.enchants.find(e=>e.name==='Enchant Gloves - Minor Haste').stats.haste,1);
});
test('movement and threat enchant modifiers are represented without inventing encounter benefits',async()=>{
 const {enchantPassiveModifiers}=await import('../public/healing/enchant-effects.mjs');
 const mods=enchantPassiveModifiers({Boots:{enchantEffects:[enchantEffectDefinitions[8737]]},Back:{enchantEffects:[enchantEffectDefinitions[2621]]}});
 assert.equal(mods.movementSpeedMultiplier,1.08);assert.equal(mods.healingThreatMultiplier,.98);
});
test('Revelation covers all Penance bolts but not the separate Holy Binding copy',()=>{
 const starter={...base,name:'Greater Heal'};
 const penance={...base,key:'penance',name:'Penance',period:1,duration:2,channel:true,immediateTick:true,periodicCrit:true};
 const p=make(8217,{touch:starter,penance},{className:'priest'});p.cast('touch',0);p.cast('penance',0);p.step(1);p.step(1);
 assert.equal(p.state.meters.penance.hits,3);assert.equal(p.state.meters.penance.crits,3);
 const flash={...base,key:'flash',name:'Flash Heal',selfCopy:.5};
 const q=make(8217,{touch:starter,flash},{className:'priest'});q.cast('touch',0);q.cast('flash',0);
 assert.equal(q.state.meters.flash.components.direct.crits,1);assert.equal(q.state.meters.flash.components.binding.crits,0);
});
