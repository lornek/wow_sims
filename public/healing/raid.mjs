import {manaConsumables} from './consumables.mjs';
import {createPull} from './engine.mjs';
export const raidStorageKey='wow-forever-sims.raid.v1';
export const raidColors={warrior:'#a97043',rogue:'#9a50be',hunter:'#548e30',mage:'#247fa3',shaman:'#0070de',paladin:'#d86da3',priest:'#b9b7a8',druid:'#bd6520'};
export function raidSettings(value={}){
 value=value&&typeof value==='object'?value:{};
 const size=Number(value.size)===10?10:20,classes=['paladin','shaman','priest'];
 return {size,layout:['groups','columns','left'].includes(value.layout)?value.layout:'groups',healers:Array.from({length:size===20?3:1},(_,i)=>({className:['none','shaman','druid','paladin','priest'].includes(value.healers?.[i]?.className)?value.healers[i].className:classes[i],focus:['tanks','raid','group'].includes(value.healers?.[i]?.focus)?value.healers[i].focus:i===0?'tanks':'raid'})),groups:Array.isArray(value.groups)&&value.groups.length===size&&value.groups.every(g=>Number.isInteger(g)&&g>=0&&g<size/5)&&Array.from({length:size/5},(_,g)=>value.groups.filter(n=>n===g).length).every(n=>n===5)?value.groups:Array.from({length:size},(_,i)=>Math.floor(i/5))};
}
const heroes=[['Cairne','warrior','Cairne'],['Muradin','warrior','Cairne'],['Sylvanas','hunter','Sylvanas'],['Jaina','mage','Jaina'],['Krag’jin','shaman','Jaina'],['Illidan','rogue','Illidan'],['Rexxar','hunter','Sylvanas'],['Kael','mage','Jaina'],['Grom','warrior','Illidan'],['Drek’Thar','shaman','Jaina'],['Shandris','hunter','Sylvanas'],['Antonidas','mage','Jaina'],['Maiev','rogue','Illidan'],['Rokhan','shaman','Jaina'],['Anub’arak','warrior','Illidan'],['Vashj','hunter','Sylvanas'],['Garithos','warrior','Illidan'],['Chen','rogue','Illidan'],['Akama','rogue','Illidan']];
const healerNames={paladin:'Tirion',priest:'Tyrande',druid:'Cenarius',shaman:'Rehgar'};
export function raidRoster(settings,hero){
 const config=raidSettings(settings),members=heroes.slice(0,config.size-1).map(([name,className,combatantKey],i)=>({name,className,combatantKey,role:i<2?'Tank':'Damage',max:i<2?4100:2900,dps:0,color:raidColors[className],group:config.groups[i]}));
 config.healers.forEach((spec,i)=>{if(spec.className==='none')return;const index=config.size-2-i;members[index]={name:healerNames[spec.className]+(config.healers.filter(h=>h.className===spec.className).length>1?' '+['I','II','III'][config.healers.slice(0,i).filter(h=>h.className===spec.className).length]:''),className:spec.className,role:'Healer',max:3000,dps:0,color:raidColors[spec.className],group:config.groups[index],support:i,focus:spec.focus};});
 members.push({...hero,group:config.groups[config.size-1]});return members;
}
export function averageItemLevel(kit){const items=Object.values(kit??{}).filter(i=>i?.stats&&Number.isFinite(i.ilvl));return items.length?items.reduce((s,i)=>s+i.ilvl,0)/items.length:0;}
export function matchingKit(adapter,average){return Object.entries(adapter.loadouts).map(([name,kit])=>({name,average:averageItemLevel(kit)})).sort((a,b)=>Math.abs(a.average-average)-Math.abs(b.average-average))[0];}
export function companionBuild(adapter,average){
 const kit=matchingKit(adapter,average),build=adapter.defaultTalents??adapter.presets?.Discipline??{},points=Object.fromEntries(adapter.talents.map(([key,name])=>[key,build[name]??build[key]??0]));
 const profile=adapter.buildProfile(kit.name,new Set(['mageblood']),0,points),spells={};
 for(const[key,name]of adapter.slots){
  if(adapter.unlocks?.includes(key)&&!build[name])continue;
  const row=adapter.ranks.filter(r=>r.name===name&&r.level<=60).at(-1);if(!row)continue;
  const tip=adapter.catalog[name]?.ranks.find(r=>r.rank===row.rank)??adapter.catalog[name]?.ranks.at(-1);
  const effect=row.effects.find(e=>e.type==='E_HEAL'||e.aura==='A_PERIODIC_HEAL'),range=tip?.description?.match(/for (\d[\d,]*) to (\d[\d,]*)/),pct=tip?.details?.match(/(\d+)% of base mana/);
  let spell={...row,key,name,cost:pct||row.costPct?Math.floor(profile.baseMana*Number(pct?.[1]??row.costPct)/100):row.cost,low:range?Number(range[1].replaceAll(',','')):effect?.base??0,high:range?Number(range[2].replaceAll(',','')):effect?.base??0,coefficient:effect?.coefficient??0,period:effect?.period,chain:effect?.chain,falloff:effect?.falloff,party:key==='stream',waterTotem:key==='stream',dispel:key==='poison',...adapter.utility[key],directChainBonus:key==='riptide'?.25:0};
  if(key==='spring')spell.manaTick=Number(tip?.description.match(/restores (\d+) mana/)?.[1]??0);
  spell=adapter.configureSpell?.(spell,row,tip,profile)??spell;spells[key]=adapter.applyTalents(spell,points);
 }
 Object.assign(spells,Object.fromEntries(Object.entries(manaConsumables).map(([key,spell])=>[key,{...spell,key}])));
 return {profile,spells,kit};
}
export function chooseHeal(actor,party,incoming){
 const {pull,spells,unit,focus}=actor,s=pull.state;
 if(!unit.hp||s.cast||s.gcd>s.time)return null;
 const can=key=>spells[key]&&s.mana>=spells[key].cost&&(s.cooldowns[key]??0)<=s.time;
 const cast=(key,target=unit)=>can(key)?{key,index:party.indexOf(target)}:null;
 if(s.mana<actor.profile.mana*.28){for(const key of ['innervate','tide','focus','potion',...(unit.hp>1000?['darkRune']:[])]){const choice=cast(key);if(choice)return choice;}}
 if(spells.waterShield&&(!s.waterShield?.charges||s.waterShield.expires<=s.time)){const choice=cast('waterShield');if(choice)return choice;}
 const candidates=party.filter(u=>u.hp&&(focus==='tanks'?u.role==='Tank'||u===unit&&u.hp/u.max<.4:focus==='group'?u.group===unit.group:true));
 const targets=candidates.map(u=>({unit:u,deficit:Math.max(0,u.max-u.hp-(incoming[party.indexOf(u)]??0)*.75)})).sort((a,b)=>(b.deficit/b.unit.max+(b.unit.role==='Tank'?.12:0)+(b.unit===unit&&unit.hp/unit.max<.25?.5:0))-(a.deficit/a.unit.max+(a.unit.role==='Tank'?.12:0)+(a.unit===unit&&unit.hp/unit.max<.25?.5:0)));
 const target=targets[0];if(!target)return null;
 const injured=targets.filter(t=>t.deficit>t.unit.max*.2);
 const dispel=candidates.find(u=>u.poison>s.time);
 if(dispel&&can('poison'))return cast('poison',dispel);
 const groupHurt=injured.filter(t=>t.unit.group===unit.group).length;
 if(can('stream')&&groupHurt>=2&&!s.effects.some(e=>['stream','tide'].includes(e.key)))return cast('stream');
 if(can('spring')&&!injured.length&&!s.effects.some(e=>e.waterTotem))return cast('spring');
 if(target.deficit<180)return null;
 if(can('penance')&&target.deficit>650)return cast('penance',target.unit);
 if(can('tranquility')&&groupHurt>=3)return cast('tranquility');
 if(can('favor')&&target.deficit>1400&&!(s.divineFavor>s.time))return cast('favor');
 if(can('shield')&&target.unit.hp/target.unit.max<.65&&!(target.unit.weakened>s.time))return cast('shield',target.unit);
 if(injured.length>=3){for(const key of ['chain','growth','prayer']){if(key==='prayer'&&injured.filter(t=>t.unit.group===unit.group).length<3)continue;const choice=cast(key,target.unit);if(choice)return choice;}}
 for(const key of ['riptide','rejuvenation','renew'])if(can(key)&&target.deficit>(key==='rejuvenation'?650:500)&&!s.effects.some(e=>e.key===key&&e.target===target.unit))return cast(key,target.unit);
 const emergency=target.unit.hp/target.unit.max<.4;
 const keys=emergency?['shock','flash','lesser','regrowth','greater','holyLight','touch']:['holyLight','greater','touch','lesser','flash','regrowth'];
 for(const key of keys){if(!can(key))continue;const spell=spells[key],expected=((spell.low+spell.high)/2+spell.coefficient*actor.profile.power)*spell.multiplier;
  if(emergency||target.deficit>=expected*.62)return cast(key,target.unit);
 }
 return null;
}
export function createRaidPull(profile,spells,encounter,random,onHeal,onDamage,onSpell,adapters,average){
 const actors=[],all=[];
 const onGroupMana=(caster,amount,source)=>{for(const actor of all)if(actor.unit!==caster&&actor.unit.hp&&actor.unit.group===caster.group)actor.pull.grantMana(amount,source+' · group');};
 const main=createPull(profile,spells,{...encounter,raid:true,onGroupMana,onDamageTaken:(unit,amount)=>{if(amount>0)for(const a of actors)a.pull.reactToDamage(unit);},onRaidDamageBatch:units=>{for(const a of actors){const target=a.pull.state.mending?.target??a.unit;if(units.includes(target))a.pull.reactToDamage(target);}}},random,onHeal,onDamage,onSpell);
 const party=main.state.party;all.push({pull:main,unit:party.at(-1),profile});
 for(const unit of party.filter(u=>u.support!==undefined)){
  const build=companionBuild(adapters[unit.className],average);unit.max=build.profile.health;unit.hp=unit.max;
  const actor={...build,unit,focus:unit.focus};
  actor.pull=createPull(build.profile,build.spells,{...encounter,raid:true,supportMode:true,sharedParty:party,healerIndex:party.indexOf(unit),startWaterShield:!!build.spells.waterShield,onGroupMana},random,()=>{});
  actors.push(actor);all.push(actor);
 }
 main.state.raidActors=all;
 const totals=()=>{const forecasts=all.map(a=>a.pull.incomingHealing());return party.map((unit,i)=>Math.max(0,Math.min(unit.max-unit.hp,forecasts.reduce((sum,f)=>sum+f[i],0))));};
 let nextDecision=0,nextSpring=2;
 return {...main,start(){main.start();for(const a of actors)a.pull.start();},incomingHealing:totals,
 step(dt){
  main.step(dt);if(main.state.phase!=='active'){for(const a of actors){a.pull.state.phase=main.state.phase;a.pull.state.cast=null;a.pull.state.effects=[];}return;}
  for(const a of actors)if(a.unit.hp)a.pull.step(dt);else {a.pull.state.phase='lost';a.pull.state.cast=null;a.pull.state.effects=[];a.pull.state.mending=null;}
  if(main.state.time>=nextDecision){nextDecision=main.state.time+.2;for(const a of actors){const choice=chooseHeal(a,party,totals());if(choice)a.pull.cast(choice.key,choice.index);}}
  if(main.state.time>=nextSpring){nextSpring=main.state.time+2;const groups=new Set(party.filter(u=>u.role==='Damage'&&u.className==='shaman'&&u.hp).map(u=>u.group));for(const a of all)if(groups.has(a.unit.group))a.pull.grantMana(20,'Mana Spring · DPS Shaman');}
 }};
}
