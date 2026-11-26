// Reproducible all-spec practice runs. Optional HEALBOT_SOURCE points at a baseline archive.
import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const base=process.env.HEALBOT_SOURCE??resolve(import.meta.dirname,'..');
const mod=name=>import(pathToFileURL(resolve(base,'public/healing/'+name+'.mjs')));
const {buffs}=await mod('profile'),{encounters,encounterTuning}=await mod('party-combat'),{createPull}=await mod('engine');
const {raidSettings,raidRoster,raidMemberMax,createRaidPull,companionBuild,chooseHeal}=await mod('raid');
const adapters={};for(const cls of ['druid','shaman','paladin','priest'])adapters[cls]=(await mod(cls)).default;
const selected=new Set(buffs.map(([key])=>key));
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const stress=process.argv.includes('--stress');
const {combatantVitals}=await mod('raid-vitals');
const results=[],begin=performance.now();
for(const size of [5,20])for(const [cls,spec]of [['druid','druid'],['shaman','shaman'],['paladin','paladin'],['priest','discipline'],['priest','holy']])for(const boss of ['rend','patchwerk','sapphiron'])for(const seed of [17,91,503]){
 const build=companionBuild(adapters[cls],75,selected,spec),hero={name:'Player',className:cls,spec,role:'Healer',max:build.profile.health,color:'#f90',dps:0};
 let party=size===20?raidRoster(raidSettings({size}),hero):[{name:'Cairne',className:'warrior',role:'Tank',max:4000},{name:'Illidan',className:'rogue',role:'Damage',max:3200},{name:'Sylvanas',className:'hunter',role:'Damage',max:3200},{name:'Jaina',className:'mage',role:'Damage',max:3000},hero];
 for(const u of party)if(u.role!=='Healer'){if(size===5)Object.assign(u,combatantVitals(u.name));u.max=raidMemberMax(u,selected);}
 const encounter={...encounterTuning(encounters[boss],process.argv.includes('--legendary')?3:0,size),id:boss,party,mitigation:true,windfuryTotem:true};
 if(stress)for(const key of ['swing','strike','frost','flurry','poisonTick'])if(encounter[key])encounter[key]*=2.5;
 const args=[build.profile,build.spells,encounter,rng(seed),()=>{},()=>{},()=>{}];
 const p=size===20?createRaidPull(...args,adapters,75,selected):createPull(...args);p.start();const actor={...build,pull:p,unit:p.state.party.at(-1),focus:'raid'};
 for(let i=0;i<4000&&p.state.phase==='active';i++){if(i%2===0){const c=chooseHeal(actor,p.state.party,p.incomingHealing());if(c)p.cast(c.key,c.index);}p.step(.1);}
 const all=p.state.raidActors??[actor],healing=all.reduce((n,a)=>n+a.pull.state.healing,0),over=all.reduce((n,a)=>n+a.pull.state.overheal,0);
 results.push({size,spec,boss,seed,result:p.state.phase,seconds:+p.state.time.toFixed(1),survivors:p.state.party.filter(u=>u.hp).length,overhealPct:+(100*over/(healing+over||1)).toFixed(1),mana:Math.round(p.state.mana),casts:Object.fromEntries(Object.entries(p.state.meters).filter(([,m])=>m.casts).map(([k,m])=>[k,m.casts])),companions:all.slice(1).map(a=>({className:a.unit.className,casts:Object.fromEntries(Object.entries(a.pull.state.meters).filter(([,m])=>m.casts).map(([k,m])=>[k,m.casts]))}))});
}
console.log(JSON.stringify({runs:results.length,elapsedMs:Math.round(performance.now()-begin),results},null,2));
