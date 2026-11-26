// Run with: node scripts/legendary-audit.mjs > docs/legendary-audit-results.json
// Uses the live engine/tuning; policies are automated benchmarks, not human play.
import {buffs} from '../public/healing/profile.mjs';
import {raidRoster,raidSettings,companionBuild,createRaidPull,chooseHeal,raidMemberMax} from '../public/healing/raid.mjs';
import {encounters,encounterTuning} from '../public/healing/party-combat.mjs';
import {combatantVitals} from '../public/healing/raid-vitals.mjs';
import {createPull} from '../public/healing/engine.mjs';
import {execSync} from 'node:child_process';
const adapters={};for(const cls of ['druid','shaman','paladin','priest'])adapters[cls]=(await import('../public/healing/'+cls+'.mjs')).default;
const specs=['druid','shaman','paladin','discipline','holy'],enabled=new Set(buffs.map(([key])=>key));
const clsFor=spec=>['holy','discipline'].includes(spec)?'priest':spec;
const healer=(spec,focus='raid')=>({className:spec==='none'?'none':clsFor(spec),spec,focus});
const teams={default:[healer('paladin','tanks'),healer('shaman'),healer('discipline')],diverse:[healer('paladin','tanks'),healer('druid'),healer('holy')],paladins:[healer('paladin','tanks'),healer('paladin'),healer('paladin')],priests:[healer('discipline','tanks'),healer('holy'),healer('holy')],two:[healer('paladin','tanks'),healer('shaman'),healer('none')],solo:[healer('none'),healer('none'),healer('none')]};
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
const cache=new Map();
function run({size,spec,boss,team='default',strategy='efficient',gear=75,seed}){
 const cls=clsFor(spec),key=spec+':'+gear;let build=cache.get(key);if(!build){build=companionBuild(adapters[cls],gear,enabled,spec);cache.set(key,build)}
 const hero={name:'Player',className:cls,spec,role:'Healer',max:build.profile.health,dps:0};
 const party=size===5?['Cairne','Illidan','Sylvanas','Jaina'].map((name,i)=>({name,className:['warrior','rogue','hunter','mage'][i],role:i?'Damage':'Tank',...combatantVitals(name)})).concat(hero):raidRoster(raidSettings({size,healers:teams[team]}),hero);
 for(const u of party)if(u.role!=='Healer')u.max=raidMemberMax(u,enabled);
 const encounter={...encounterTuning(encounters[boss],3,size),id:boss,party,mitigation:true,windfuryTotem:enabled.has('windfury'),startWaterShield:enabled.has('waterShield'),hazard:adapters[cls].hazard??'poison'};
 const args=[build.profile,build.spells,encounter,rng(seed),()=>{},()=>{},()=>{}];
 const p=size===5?createPull(...args):createRaidPull(...args,adapters,gear,enabled);p.start();
 const actor={...build,pull:p,unit:p.state.party.at(-1),focus:strategy==='tank-priority'?'tanks':'raid'};
 let firstDeath=null,firstOom=null;const knownDead=new Set(),deaths=[];
 for(let i=0;i<Math.ceil(encounter.limit*10)+2&&p.state.phase==='active';i++){
  if(i%2===0&&strategy!=='idle'){
   let choice=chooseHeal(actor,p.state.party,p.incomingHealing());
   if(strategy==='reactive-fast'){
    const target=p.state.party.filter(u=>u.hp).sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];
    const key={druid:'regrowth',shaman:'lesser',paladin:'flash',discipline:'flash',holy:'flash'}[spec];
    if(target&&target.hp<target.max*.95)choice={key,index:p.state.party.indexOf(target)};
   }
   if(choice)p.cast(choice.key,choice.index);
  }
  p.step(.1);
  if(firstOom===null&&p.state.mana<build.profile.mana*.1)firstOom=p.state.time;
  for(const u of p.state.party)if(!u.hp&&!knownDead.has(u.name)){knownDead.add(u.name);firstDeath??=p.state.time;deaths.push({name:u.name,role:u.role,time:+p.state.time.toFixed(1)})}
 }
 const all=p.state.raidActors??[actor],effective=all.reduce((n,a)=>n+a.pull.state.healing,0),overheal=all.reduce((n,a)=>n+a.pull.state.overheal,0);
 return{size,spec,boss,team,strategy,gear,seed,kit:build.kit.name,result:p.state.phase,seconds:+p.state.time.toFixed(1),bossRemainingPct:+(100*p.state.boss/p.state.bossMax).toFixed(1),survivors:p.state.party.filter(u=>u.hp).length,firstDeath:firstDeath===null?null:+firstDeath.toFixed(1),deaths,playerManaPct:+(100*p.state.mana/build.profile.mana).toFixed(1),firstOom:firstOom===null?null:+firstOom.toFixed(1),overhealPct:+(100*overheal/(effective+overheal||1)).toFixed(1),playerHealing:Math.round(p.state.healing),playerCasts:Object.fromEntries(Object.entries(p.state.meters).filter(([,m])=>m.casts).map(([k,m])=>[k,m.casts])),companionMana:all.slice(1).map(a=>({spec:a.unit.spec,manaPct:+(100*a.pull.state.mana/a.profile.mana).toFixed(1)}))};
}
const scenarios=[];
for(const size of [5,10,20])for(const spec of specs)for(const boss of Object.keys(encounters))scenarios.push({size,spec,boss});
for(const team of ['diverse','paladins','priests','two','solo'])for(const spec of specs)for(const boss of Object.keys(encounters))scenarios.push({size:20,spec,boss,team});
for(const strategy of ['tank-priority','reactive-fast','idle'])for(const spec of specs)for(const boss of Object.keys(encounters))scenarios.push({size:20,spec,boss,strategy});
for(const spec of specs)for(const boss of Object.keys(encounters))scenarios.push({size:20,spec,boss,gear:95});
const results=[];for(const scenario of scenarios)for(let i=0;i<30;i++)results.push(run({...scenario,seed:17+i*7919}));
console.log(JSON.stringify({commit:execSync('git rev-parse HEAD',{encoding:'utf8'}).trim(),seeds:30,runs:results.length,description:'Legendary level 3; all available buffs; Tier 2 nearest average ilvl 75 unless gear=95; 0.1s engine steps, 0.2s decisions; same seeds per scenario; default group assignments; no human input.',results},null,2));
