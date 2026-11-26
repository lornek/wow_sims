import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveMelee,bossMeleeRaw} from '../public/healing/defenses.mjs';
import {companionBuild,chooseHeal,raidRoster,raidSettings,createRaidPull} from '../public/healing/raid.mjs';
import {advanceRaidDps,raidDpsStats} from '../public/healing/raid-dps.mjs';
import {setupPartyCombat} from '../public/healing/party-combat.mjs';
import paladin from '../public/healing/paladin.mjs';
import priest from '../public/healing/priest.mjs';
const seeded=(seed=91)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('representative mitigation preserves mean tank intake and makes hits larger and cloth dangerous',()=>{
 const random=seeded(),tank={role:'Tank'},cloth={role:'Damage',className:'mage'};let total=0,max=0,miss=0;
 for(let i=0;i<100000;i++){const r=resolveMelee(tank,360,random);total+=r.amount;max=Math.max(max,r.amount);miss+=Number(r.amount===0);}
 assert.ok(Math.abs(total/100000-(360-11.25))<4);assert.ok(max>450);assert.ok(miss>20000);assert.ok(resolveMelee(cloth,360,()=>.99).amount>max*1.6);
 assert.equal(resolveMelee(tank,360,()=>.05).outcome,'dodge');assert.equal(resolveMelee(tank,360,()=>.2).outcome,'parry');assert.equal(resolveMelee(tank,360,()=>.4).outcome,'block');
});
test('companion compiler selects highest level Holy Shock and separates priest builds',()=>{
 const p=companionBuild(paladin,75);assert.equal(p.spells.shock.rank,'Rank 4');
 const disc=companionBuild(priest,75,new Set(),'discipline'),holy=companionBuild(priest,75,new Set(),'holy');assert.ok(disc.spells.pi&&disc.spells.penance);assert.ok(!holy.spells.pi&&!holy.spells.penance&&holy.spells.mending);assert.ok(holy.spells.flash.selfCopy>0);
});
test('PI selects a mage at pull and the top live caster at later cooldowns',()=>{
 const build=companionBuild(priest,75),units=[{name:'Mage',className:'mage',role:'Damage',hp:100,max:100,damage:{}},{name:'Lock',className:'warlock',role:'Damage',hp:100,max:100,damage:{bolt:{total:1000}}},{name:'Priest',hp:100,max:100},{name:'Enhancement',className:'shaman',spec:'enhancement',role:'Damage',hp:100,max:100,damage:{melee:{total:5000}}}];
 const actor={...build,unit:units[2],focus:'raid',pull:{state:{time:0,mana:1e5,cooldowns:{},gcd:0,effects:[]}}};assert.deepEqual(chooseHeal(actor,units,[0,0,0]),{key:'pi',index:0});actor.pull.state.time=180;assert.deepEqual(chooseHeal(actor,units,[0,0,0]),{key:'pi',index:1});units[1].hp=0;assert.equal(chooseHeal(actor,units,[0,0,0]).index,0);
});
test('Paladin primes and consumes Vigil for an injured group instead of ignoring the talent',()=>{
 const build=companionBuild(paladin,75),units=Array.from({length:5},(_,i)=>({name:'P'+i,hp:1500,max:4000,role:i===0?'Tank':'Healer',group:0})),state={time:5,mana:1e5,cooldowns:{},gcd:0,effects:[],oath:{target:units[0],expires:100}},actor={...build,unit:units[4],focus:'raid',pull:{state}};
 assert.equal(chooseHeal(actor,units,[0,0,0,0,0]).key,'vigil');state.vigil={target:units[0],expires:30};assert.equal(chooseHeal(actor,units,[0,0,0,0,0]).key,'shock');
});
function runDps(spec,seconds=180){const unit={name:'Test',spec,hp:1e6,max:1e6,combatStats:{...raidDpsStats[spec],max:1e8,regen:10000,windfuryTotem:true}};setupPartyCombat([unit]);const s={time:0,boss:1e9,bossMax:1e9,party:[unit]};const random=seeded(17);for(let i=0;i<seconds*10;i++){s.time=i/10;advanceRaidDps(s,unit,.1,random,()=>{},0);}return unit;}
test('audited DPS profiles include Eclipse cycle, seals, two-handed Enhancement and raid Windfury',()=>{
 const b=runDps('balance'),r=runDps('retribution'),e=runDps('enhancement');
 assert.ok(b.damage.Wrath.total>0&&b.damage.Starfire.total>0&&b.damage.Moonfire.total>0);assert.ok(r.damage['Seal of Command'].total>0&&r.damage['Seal of Righteousness'].total>0&&r.damage['Windfury Totem'].total>0);
 assert.equal(raidDpsStats.enhancement.dual,false);assert.ok(!e.damage['Off-hand swing']&&!e.damage['Stormstrike · off hand']);assert.ok(e.damage['Windfury Attack'].total>0);assert.ok(!e.damage['Windfury Totem']);
 const shadow=runDps('shadow');assert.ok(shadow.damage['Mind Blast'].attempts>=25);assert.ok(shadow.damage['Shadow Word: Pain'].total>0&&shadow.damage['Devouring Plague'].total>0);
});
