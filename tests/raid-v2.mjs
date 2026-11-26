import test from'node:test';import assert from'node:assert/strict';
import {createPull}from'../public/healing/engine.mjs';
import {raidSettings,raidRoster,companionBuild,createRaidPull,raidMemberMax}from'../public/healing/raid.mjs';
import {raidDpsStats,raidCombatStats}from'../public/healing/raid-dps.mjs';
import {buffs}from'../public/healing/profile.mjs';
const adapters={};for(const name of ['shaman','druid','priest','paladin'])adapters[name]=(await import('../public/healing/'+name+'.mjs')).default;
const profile={mana:1e5,regen:0,mp5:0,power:0,crit:0};
const party=()=>Array.from({length:20},(_,i)=>({name:'P'+i,group:Math.floor(i/5),max:10000,dps:0,role:'Damage'}));
const encounter=()=>({party:party(),health:1e8,swing:0,limit:200,raid:true});
const basic={low:100,high:100,cost:0,cast:0,gcd:0,cooldown:0,coefficient:0,multiplier:1};
for(const key of ['growth','prayer'])test(`${key}: selected target's group controls healing and incoming previews`,()=>{
 const spell={...basic,key,name:key,party:true,...(key!=='prayer'?{period:1,duration:3}:{}),cast:1};
 const p=createPull(profile,{[key]:spell},encounter(),()=>.5);p.state.party.forEach(u=>u.hp=5000);p.start();p.cast(key,2);
 assert.deepEqual(p.incomingHealing().map((n,i)=>n>0?i:null).filter(i=>i!==null),[0,1,2,3,4]);p.step(1);p.step(1);
 assert.ok(p.state.party.slice(0,5).every(u=>u.hp>5000));assert.ok(p.state.party.slice(5).every(u=>u.hp===5000));
});
test('Chain Heal stays in target group while Prayer of Mending can cross groups',()=>{
 const chain={...basic,key:'chain',name:'Chain Heal',chain:3,falloff:.5};const mending={...basic,key:'mending',name:'Prayer of Mending',mending:true};
 const p=createPull(profile,{chain,mending},encounter(),()=>.5);p.state.party.forEach(u=>u.hp=9000);p.state.party[8].hp=1000;p.start();p.cast('chain',1);assert.equal(p.state.party[8].hp,1000);assert.equal(p.state.party.filter(u=>u.hp>9000).length,3);
 p.cast('mending',1);p.reactToDamage(p.state.party[1]);assert.equal(p.state.mending.target,p.state.party[8]);
});
test("Light's Vigil group burst follows the marked target's group",()=>{
 const vigil={...basic,key:'vigil',name:"Light's Vigil",mark:'vigil',duration:30},shock={...basic,key:'shock',name:'Holy Shock'};const p=createPull(profile,{vigil,shock},encounter(),()=>.5);p.state.party.forEach(u=>u.hp=5000);p.start();p.cast('vigil',3);p.cast('shock',3);assert.ok(p.state.party.slice(0,5).every(u=>u.hp>5000));assert.ok(p.state.party.slice(5).every(u=>u.hp===5000));
});
for(const className of Object.keys(adapters))test(`${className}: Fortitude and selected consumables propagate into companion stats`,()=>{
 const all=new Set(buffs.map(([key])=>key));const a=companionBuild(adapters[className],75,all),noFort=new Set(all),noElixir=new Set(all);noFort.delete('fortitude');noElixir.delete('mageblood');
 assert.equal(a.profile.health-companionBuild(adapters[className],75,noFort).profile.health,770);assert.equal(a.profile.mp5-companionBuild(adapters[className],75,noElixir).profile.mp5,20);
});
test('Fortitude applies to ordinary raid members and all requested specs exist in 20m',()=>{
 assert.equal(raidMemberMax({max:2900,stamina:180},new Set(['fortitude'])),3600);
 const members=raidRoster(raidSettings(),{name:'Hero',role:'Healer',max:5000});for(const spec of Object.keys(raidDpsStats))assert.ok(members.some(u=>u.spec===spec),spec);
 assert.equal(members[1].spec,'protectionPaladin');assert.equal(members.find(u=>u.name==='Illidan').className,'rogue');
});
for(const spec of Object.keys(raidDpsStats))test(`${spec}: sourced priorities produce spell damage with bounded resources`,()=>{
 const member={name:spec,spec,combatantKey:spec,combatStats:raidCombatStats({spec},new Set(['intellect','mageblood','wisdom'])),max:10000,dps:0},p=createPull(profile,{}, {id:'sapphiron',party:[member,{name:'Hero',max:10000,dps:0}],health:1e7,limit:200,swing:0,frost:0},()=>.5);p.start();for(let i=0;i<600;i++)p.step(.1);const u=p.state.party[0];assert.ok(Object.entries(u.damage).filter(([name,m])=>!name.includes('swing')&&m.total>0).length>=2);assert.ok(u.resource.value>=0&&u.resource.value<=u.resource.max);assert.ok(Object.values(u.damage).every(m=>Number.isFinite(m.total)));
 if(spec==='affliction')assert.ok(u.damage['Shadow Bolt']?.total>0&&u.damage['Siphon Life']?.total>0);
 if(spec==='shadow')assert.ok(u.damage['Devouring Plague']?.total>0);
});
