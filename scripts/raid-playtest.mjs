import {buffs}from'../public/healing/profile.mjs';
import {raidRoster,raidSettings,companionBuild,createRaidPull,chooseHeal,raidMemberMax}from'../public/healing/raid.mjs';
import {encounters}from'../public/healing/party-combat.mjs';
import {performance}from'node:perf_hooks';
const adapters={};for(const name of ['shaman','druid','paladin','priest'])adapters[name]=(await import('../public/healing/'+name+'.mjs')).default;
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const stress=process.argv.includes('--stress');
const selectedBuffs=new Set(process.argv.includes('--unbuffed')?['mageblood']:buffs.map(([key])=>key));
const results=[];const begin=performance.now();
for(const size of [20,10])for(const cls of Object.keys(adapters))for(const boss of ['rend','patchwerk','sapphiron'])for(const seed of [17,91,503]){
 const build=companionBuild(adapters[cls],75,selectedBuffs),config=raidSettings({size}),party=raidRoster(config,{name:adapters[cls].healer,className:cls,role:'Healer',max:build.profile.health,color:adapters[cls].healerColor,dps:0});
 for(const unit of party)if(unit.role!=='Healer')unit.max=raidMemberMax(unit,selectedBuffs);
 const encounter={...encounters[boss],id:boss,party,health:encounters[boss].health*(size===20?12:4),limit:400};
 for(const key of ['swing','frost','strike','flurry','poisonTick'])if(encounter[key])encounter[key]*=stress?2.5:1.1;
 const p=createRaidPull(build.profile,build.spells,encounter,rng(seed),()=>{},()=>{},()=>{},adapters,75,selectedBuffs);p.start();
 const actor={...build,pull:p,unit:p.state.party.at(-1),focus:'raid'};
 for(let i=0;i<4000&&p.state.phase==='active';i++){if(i%2===0){const c=chooseHeal(actor,p.state.party,p.incomingHealing());if(c)p.cast(c.key,c.index);}p.step(.1);}
 const all=p.state.raidActors,effective=all.reduce((s,a)=>s+a.pull.state.healing,0),overheal=all.reduce((s,a)=>s+a.pull.state.overheal,0);
 results.push({size,className:cls,boss,seed,result:p.state.phase,seconds:+p.state.time.toFixed(1),survivors:p.state.party.filter(u=>u.hp).length,healing:Math.round(effective),overhealPct:+(overheal/(effective+overheal||1)*100).toFixed(1),playerHealing:Math.round(p.state.healing),mana:Math.round(p.state.mana),companions:all.slice(1).map(a=>({name:a.unit.name,healing:Math.round(a.pull.state.healing),mana:Math.round(a.pull.state.mana)}))});
}
console.log(JSON.stringify({buffs:[...selectedBuffs],pressure:stress?'2.5x stress':'1.1x normal',scenarioCount:results.length,elapsedMs:Math.round(performance.now()-begin),results},null,2));
