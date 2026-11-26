import test from 'node:test';import assert from 'node:assert/strict';
import {dpsManaCost,raidDpsStats,advanceRaidDps} from '../public/healing/raid-dps.mjs';
import {raidDpsSpells} from '../public/healing/raid-dps-data.mjs';
import {combatantVitals} from '../public/healing/raid-vitals.mjs';
import {encounters,encounterTuning,setupPartyCombat,advancePartyCombat} from '../public/healing/party-combat.mjs';
import {raidRoster,raidSettings} from '../public/healing/raid.mjs';
const rng=(seed=5)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('Shadowform halves shadow costs; Stormstrike uses base mana; shocks and Maelstrom receive talent reductions',()=>{
 assert.equal(dpsManaCost('shadow',raidDpsSpells['Mind Blast'],raidDpsStats.shadow),175);
 assert.equal(dpsManaCost('enhancement',raidDpsSpells.Stormstrike,{baseMana:1520,max:10000}),121.6);
 assert.ok(Math.abs(dpsManaCost('enhancement',raidDpsSpells['Earth Shock'],raidDpsStats.enhancement)-247.5)<1e-6);
 assert.equal(dpsManaCost('enhancement',raidDpsSpells['Lightning Bolt'],raidDpsStats.enhancement,5),0);
});
test('DPS potion/rune use is independent, cooldown-limited, and rune costs real health',()=>{
 const u={name:'Kathris',spec:'shadow',hp:4000,max:4000,combatStats:raidDpsStats.shadow};setupPartyCombat([u]);const s={party:[u],time:0,boss:1e9,bossMax:1e9};u.resource.value=0;let damage=0;
 advanceRaidDps(s,u,0,()=>.5,()=>{},0,(_,amount)=>{damage+=amount;u.hp-=amount;});assert.equal(u.manaGains['Major Mana Potion'],1800);
 u.resource.value=0;s.time=.1;advanceRaidDps(s,u,0,()=>.5,()=>{},0,(_,amount)=>{damage+=amount;u.hp-=amount;});assert.equal(u.manaGains['Dark Rune'],1200);assert.equal(damage,800);
 u.resource.value=0;s.time=1;advanceRaidDps(s,u,0,()=>.5,()=>{},0);assert.equal(u.manaGains['Major Mana Potion'],1800);assert.equal(u.manaGains['Dark Rune'],1200);
});
test('Fire mages cast fire on every boss; both rogue profiles deal poison damage',()=>{
 for(const boss of Object.keys(encounters)){
 const mage={name:'Jaina',hp:1e6,max:1e6},rogue={name:'Illidan',hp:1e6,max:1e6},mut={name:'Maiev',spec:'mutilate',combatantKey:'mutilate',hp:1e6,max:1e6};const s={party:[mage,rogue,mut],encounterId:boss,boss:1e8,bossMax:1e8,time:0};setupPartyCombat(s.party);const random=rng();for(let i=0;i<900;i++){s.time=i*.1;advancePartyCombat(s,.1,random);}
 assert.ok(mage.damage.Fireball.total>0);assert.ok(!mage.damage.Frostbolt);assert.ok(rogue.damage['Instant Poison'].total>0);assert.ok(mut.damage['Instant Poison'].total>0);assert.ok(mut.damage['Deadly Poison'].total>0);
 }
});
test('preset-derived health differs by spec and difficulty tuning never changes party HP',()=>{
 const roster=raidRoster(raidSettings({healers:[{className:'none'},{className:'none'},{className:'none'}]}),{name:'Player',max:4000});assert.ok(new Set(roster.slice(0,-1).map(u=>u.max)).size>=10);
 assert.equal(combatantVitals('shadow').max,2337);assert.equal(combatantVitals('Cairne').max,4179);
 const before=roster.map(u=>u.max);for(let level=0;level<5;level++)encounterTuning(encounters.rend,level,20);assert.deepEqual(roster.map(u=>u.max),before);
 assert.equal(encounters.rend.health,42000);assert.equal(encounters.patchwerk.health,45000);assert.equal(encounters.sapphiron.health,45000);
 assert.ok(encounterTuning(encounters.rend,3,20).swing>encounterTuning(encounters.rend,3,5).swing*2.4);
});
