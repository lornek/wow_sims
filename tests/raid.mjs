import test from 'node:test';import assert from 'node:assert/strict';
import {raidSettings,raidRoster,companionBuild,matchingKit,chooseHeal,createRaidPull}from'../public/healing/raid.mjs';
import {createPull}from'../public/healing/engine.mjs';
import {encounters}from'../public/healing/party-combat.mjs';
const adapters={};for(const cls of ['shaman','druid','priest','paladin'])adapters[cls]=(await import('../public/healing/'+cls+'.mjs')).default;
const hero={name:'Malfurion',className:'druid',role:'Healer',max:4000,dps:0,color:'#f90'};
const profile={mana:10000,regen:0,mp5:0,power:0,crit:0};
function fixture(size=20){const settings=raidSettings({size}),party=raidRoster(settings,hero);return {settings,party,encounter:{...encounters.sapphiron,id:'sapphiron',party,health:30000*(size===20?12:4),limit:400}};}
test('raid sizes enforce five-player groups, healer caps, unique names and stable player index',()=>{
 for(const size of [10,20]){const f=fixture(size);assert.equal(f.party.length,size);assert.equal(f.party.at(-1).name,hero.name);assert.equal(f.party.filter(u=>u.role==='Healer').length,size===20?4:2);assert.equal(new Set(f.party.map(u=>u.name)).size,size);for(let g=0;g<size/5;g++)assert.equal(f.party.filter(u=>u.group===g).length,5);}
 const config=raidSettings({groups:Array(20).fill(0),healers:[{className:'bogus'}]});assert.equal(config.healers[0].className,'paladin');assert.equal(config.groups.filter(g=>g===0).length,5);
});
test('companion gear picks nearest average item level and uses actual class spells',()=>{
 for(const adapter of Object.values(adapters)){const choices=Object.entries(adapter.loadouts);const b=companionBuild(adapter,75);assert.ok(b.profile.mana>0);assert.ok(Object.keys(b.spells).length>5);assert.equal(b.kit.name,matchingKit(adapter,75).name);assert.ok(choices.some(([name])=>name===b.kit.name));assert.ok(b.spells.potion&&b.spells.darkRune);}
});
test('party healing is group restricted while incoming casts remain visible on shared health',()=>{
 const {encounter}=fixture();const base=createPull(profile,{},encounter,()=>.5);base.state.party.forEach(u=>u.hp=1000);
 const spell={key:'prayer',name:'Prayer of Healing',low:200,high:200,cost:0,coefficient:0,multiplier:1,cast:1,gcd:0,cooldown:0,party:true};
 const support=createPull(profile,{prayer:spell},{...encounter,raid:true,supportMode:true,sharedParty:base.state.party,healerIndex:16},()=>.5);support.start();support.cast('prayer',16);assert.equal(support.incomingHealing().filter(n=>n>0).length,5);support.step(1);assert.equal(base.state.party.filter(u=>u.hp===1200).length,5);assert.equal(base.state.boss,encounter.health);
});
test('support shields credit their caster instead of the player healing meter',()=>{
 const {encounter}=fixture();const main=createPull(profile,{},encounter,()=>.5);
 const shield={key:'shield',name:'Power Word: Shield',shield:500,coefficient:0,multiplier:1,duration:30,cost:0,cast:0,gcd:0,cooldown:0};
 const support=createPull(profile,{shield},{...encounter,raid:true,supportMode:true,sharedParty:main.state.party,healerIndex:16},()=>.5);support.start();support.cast('shield',0);main.start();main.step(2);assert.ok(support.state.healing>0);assert.equal(main.state.healing,0);
});
test('support simulations never apply boss damage or DPS a second time',()=>{
 const {encounter}=fixture();const main=createPull(profile,{},encounter,()=>.5);const support=createPull(profile,{}, {...encounter,raid:true,supportMode:true,sharedParty:main.state.party,healerIndex:16},()=>.5);support.start();const health=main.state.party.map(u=>u.hp);support.step(10);assert.deepEqual(main.state.party.map(u=>u.hp),health);assert.equal(support.state.boss,encounter.health);
});
test('same-group Mana Tide reaches other healers and excludes other groups',()=>{
 const f=fixture(),b=companionBuild(adapters.druid,75);const p=createRaidPull(b.profile,b.spells,f.encounter,()=>.5,()=>{},()=>{},()=>{},adapters,75);p.start();const shaman=p.state.raidActors.find(a=>a.unit.className==='shaman');const priest=p.state.raidActors.find(a=>a.unit.className==='priest');p.state.mana=0;priest.pull.state.mana=0;priest.unit.group=0;shaman.pull.cast('tide',f.party.length-3);for(let i=0;i<31;i++)p.step(.1);assert.ok(p.state.manaSources['Mana Tide Totem · group']>0);assert.equal(priest.pull.state.manaSources['Mana Tide Totem · group'],undefined);
});
test('tank-focus AI prioritizes an endangered tank and avoids full-health filler heals',()=>{
 const {encounter}=fixture(),b=companionBuild(adapters.paladin,75);const pull=createPull(b.profile,b.spells,encounter,()=>.5);pull.start();const actor={...b,pull,unit:pull.state.party[16],focus:'tanks'};assert.equal(chooseHeal(actor,pull.state.party,Array(20).fill(0)).key,'oath');pull.state.oath={target:pull.state.party[0],expires:300};assert.equal(chooseHeal(actor,pull.state.party,Array(20).fill(0)),null);pull.state.party[0].hp=300;pull.state.party[2].hp=100;let choice=chooseHeal(actor,pull.state.party,Array(20).fill(0));if(choice.key==='favor'){pull.cast(choice.key,choice.index);choice=chooseHeal(actor,pull.state.party,Array(20).fill(0));}assert.equal(choice.index,0);
});
test('companion Mending triggers at most once for one simultaneous Frost Aura pulse',()=>{
 const f=fixture(),b=companionBuild(adapters.druid,75),p=createRaidPull(b.profile,b.spells,f.encounter,()=>.5,()=>{},()=>{},()=>{},adapters,75);p.start();
 const priest=p.state.raidActors.find(a=>a.unit.className==='priest');priest.spells.mending={key:'mending',name:'Prayer of Mending',mending:true,low:100,high:100,coefficient:0,multiplier:1,cost:0,cast:0,gcd:0,cooldown:0};priest.pull.cast('mending',3);
 for(let i=0;i<20;i++)p.step(.1);assert.equal(priest.pull.state.meters.mending.hits,1);
});
test('raid end freezes companion casts, effects and healing meters',()=>{
 const f=fixture(),b=companionBuild(adapters.druid,75),p=createRaidPull(b.profile,b.spells,f.encounter,()=>.5,()=>{},()=>{},()=>{},adapters,75);p.start();p.state.boss=0;p.step(.1);const values=p.state.raidActors.map(a=>[a.pull.state.time,a.pull.state.healing]);p.step(5);assert.deepEqual(p.state.raidActors.map(a=>[a.pull.state.time,a.pull.state.healing]),values);assert.ok(p.state.raidActors.every(a=>!a.pull.state.cast));
});
test('dead companions cannot leave phantom incoming casts behind',()=>{
 const f=fixture(),b=companionBuild(adapters.druid,75),p=createRaidPull(b.profile,b.spells,f.encounter,()=>.5,()=>{},()=>{},()=>{},adapters,75);p.start();const a=p.state.raidActors.find(a=>a.unit.className==='paladin');p.state.party[0].hp=1000;a.pull.cast('holyLight',0);assert.ok(a.pull.state.cast);a.unit.hp=0;p.step(.1);assert.equal(a.pull.state.cast,null);assert.deepEqual(a.pull.state.effects,[]);assert.ok(a.pull.incomingHealing().every(n=>n===0));
});
test('multiple Priest Aegis contributors retain separate absorption credit',()=>{
 const {encounter}=fixture();const main=createPull(profile,{},encounter,()=>0);const spell={key:'flash',name:'Flash Heal',low:500,high:500,coefficient:0,multiplier:1,cost:0,cast:0,gcd:0,cooldown:0};const supports=[16,17].map(healerIndex=>createPull({...profile,crit:1,aegis:.15},{flash:spell},{...encounter,raid:true,supportMode:true,sharedParty:main.state.party,healerIndex},()=>0));for(const p of supports){p.start();p.cast('flash',0);}main.start();main.step(2);for(const p of supports)assert.equal(p.state.meters.aegis.effective,112.5);assert.equal(main.state.healing,0);
});
