import {combatantVitals} from './raid-vitals.mjs';
import {raidCombatStats} from './raid-dps.mjs';
import {combatants} from './party-combat.mjs';
import {classColors} from './class-colors.mjs';
import {manaConsumables} from './consumables.mjs';
import {createPull} from './engine.mjs';
export const raidStorageKey='wow-forever-sims.raid.v1';
export const raidColors=classColors;
export function raidSettings(value={}){
 value=value&&typeof value==='object'?value:{};
 const size=Number(value.size)===10?10:20,classes=['paladin','shaman','priest'];
 return {size,layout:['groups','columns','left'].includes(value.layout)?value.layout:'groups',healers:Array.from({length:size===20?3:1},(_,i)=>({className:['none','shaman','druid','paladin','priest'].includes(value.healers?.[i]?.className)?value.healers[i].className:classes[i],spec:value.healers?.[i]?.spec==='holy'?'holy':'discipline',focus:['tanks','raid','group'].includes(value.healers?.[i]?.focus)?value.healers[i].focus:i===0?'tanks':'raid'})),groups:Array.isArray(value.groups)&&value.groups.length===size&&value.groups.every(g=>Number.isInteger(g)&&g>=0&&g<size/5)&&Array.from({length:size/5},(_,g)=>value.groups.filter(n=>n===g).length).every(n=>n===5)?value.groups:Array.from({length:size},(_,i)=>Math.floor(i/5))};
}
const heroes=[['Cairne','warrior','Cairne'],['Gavinrad','paladin','protectionPaladin'],['Sylvanas','hunter','Sylvanas'],['Jaina','mage','Jaina'],['Krag’jin','shaman','enhancement'],['Illidan','rogue','Illidan'],['Rexxar','hunter','Sylvanas'],['Kael','mage','Jaina'],['Grom','warrior','fury'],['Drek’Thar','shaman','elemental'],['Califax','druid','balance'],['Kathris','priest','shadow'],['Kel’Thuzad','warlock','affliction'],['Gul’dan','warlock','destruction'],['Turalyon','paladin','retribution'],['Maiev','rogue','mutilate'],['Antonidas','mage','Jaina'],['Vashj','hunter','Sylvanas'],['Rokhan','shaman','elemental']];
const healerNames={paladin:'Tirion',priest:'Tyrande',druid:'Cenarius',shaman:'Rehgar'};
export function raidRoster(settings,hero){
 const config=raidSettings(settings),members=(config.size===10?[0,1,2,3,5,9,10,12,14].map(i=>heroes[i]):heroes.slice(0,config.size-1)).map(([name,className,combatantKey],i)=>({name,className,combatantKey,spec:combatantKey,role:i<2?'Tank':'Damage',...combatantVitals(combatantKey),dps:0,color:raidColors[className],group:config.groups[i]}));
 config.healers.forEach((spec,i)=>{if(spec.className==='none')return;const index=config.size-2-i;members[index]={name:healerNames[spec.className]+(config.healers.filter(h=>h.className===spec.className).length>1?' '+['I','II','III'][config.healers.slice(0,i).filter(h=>h.className===spec.className).length]:''),className:spec.className,spec:spec.className==='priest'?spec.spec:spec.className,role:'Healer',max:3000,dps:0,color:raidColors[spec.className],group:config.groups[index],support:i,focus:spec.focus};});
 members.push({...hero,group:config.groups[config.size-1]});return members;
}
export function averageItemLevel(kit){const items=Object.values(kit??{}).filter(i=>i?.stats&&Number.isFinite(i.ilvl));return items.length?items.reduce((s,i)=>s+i.ilvl,0)/items.length:0;}
export function matchingKit(adapter,average){return Object.entries(adapter.loadouts).map(([name,kit])=>({name,average:averageItemLevel(kit)})).sort((a,b)=>Math.abs(a.average-average)-Math.abs(b.average-average))[0];}
export function companionBuild(adapter,average,enabledBuffs=new Set(['mageblood']),spec){
 const kit=matchingKit(adapter,average),build=(spec==='holy'?adapter.presets?.Holy:spec==='discipline'?adapter.presets?.Discipline:null)??adapter.defaultTalents??{},points=Object.fromEntries(adapter.talents.map(([key,name])=>[key,build[name]??build[key]??0]));
 const profile=adapter.buildProfile(kit.name,new Set([...enabledBuffs,...(adapter.className==='druid'?['omen']:[])]),0,points),spells={};
 for(const[key,name]of adapter.slots){
  if(adapter.unlocks?.includes(key)&&!build[name])continue;
  const row=adapter.ranks.filter(r=>r.name===name&&r.level<=60).sort((a,b)=>a.level-b.level||a.id-b.id).at(-1);if(!row)continue;
  const tip=adapter.catalog[name]?.ranks.find(r=>r.rank===row.rank)??adapter.catalog[name]?.ranks.at(-1);
  const effect=row.effects.find(e=>e.type==='E_HEAL'||e.aura==='A_PERIODIC_HEAL'),range=tip?.description?.match(/for (\d[\d,]*) to (\d[\d,]*)/),pct=tip?.details?.match(/(\d+)% of base mana/);
  let spell={...row,key,name,cost:pct||row.costPct?Math.floor(profile.baseMana*Number(pct?.[1]??row.costPct)/100):row.cost,low:range?Number(range[1].replaceAll(',','')):effect?.base??0,high:range?Number(range[2].replaceAll(',','')):effect?.base??0,coefficient:effect?.coefficient??0,period:effect?.period,chain:effect?.chain,falloff:effect?.falloff,party:key==='stream',waterTotem:key==='stream',dispel:key==='poison',...adapter.utility[key],directChainBonus:key==='riptide'?.25:0};
  if(key==='spring')spell.manaTick=Number(tip?.description.match(/restores (\d+) mana/)?.[1]??0);
  spell=adapter.configureSpell?.(spell,row,tip,profile)??spell;if(['growth','prayer'].includes(key))delete spell.self;spells[key]=adapter.applyTalents(spell,points);
 }
 Object.assign(spells,Object.fromEntries(Object.entries(manaConsumables).map(([key,spell])=>[key,{...spell,key}])));
 return {profile,spells,kit};
}
// Practice policy: preserve more mana early in a pull and as reserves fall.
export function healerConservation(actor){
 const s=actor.pull.state,mana=Math.max(0,Math.min(1,s.mana/Math.max(1,actor.profile.mana))),boss=Math.max(0,Math.min(1,(s.boss??1)/Math.max(1,s.bossMax??s.boss??1)));
 return Math.min(1,.6*boss+.8*(1-mana));
}
export function chooseHeal(actor,party,incoming){
 const {pull,spells,unit,focus}=actor,s=pull.state;
 if(!unit.hp||s.cast)return null;
 const can=key=>spells[key]&&(s.mana>=spells[key].cost||key!=='focus'&&s.innerFocus>s.time||spells[key].omenEligible&&s.clearcastingUntil>s.time)&&(s.cooldowns[key]??0)<=s.time;
 const cast=(key,target=unit)=>can(key)?{key,index:party.indexOf(target)}:null;
 // PI is useful before damage starts; subsequent uses follow measured caster output.
 if(can('pi')){const casters=party.filter(u=>u.hp&&u.role==='Damage'&&['mage','priest','warlock','druid','shaman'].includes(u.className)&&(u.className!=='shaman'||u.spec==='elemental'));const output=u=>Object.values(u.damage??{}).reduce((n,m)=>n+m.total,0);const recipient=s.time<5?casters.find(u=>u.className==='mage'):casters.sort((a,b)=>output(b)-output(a))[0];if(recipient)return cast('pi',recipient);}
 if(s.gcd>s.time)return null;
 if(s.mana<actor.profile.mana*.28){for(const key of ['innervate','tide',...(!spells.prayer?['focus']:[]),'potion',...(unit.hp>1000?['darkRune']:[])]){const choice=cast(key);if(choice)return choice;}}
 if(spells.waterShield&&(!s.waterShield?.charges||s.waterShield.expires<=s.time)){const choice=cast('waterShield');if(choice)return choice;}
 const estimate=key=>{const sp=spells[key];if(!sp)return 0;return ((sp.low+sp.high)/2+(sp.coefficient??0)*actor.profile.power)*(sp.multiplier??1)*(1+(.5+(actor.profile.critHealingBonus??0))*((actor.profile.crit??0)+(sp.bonusCrit??0)));};
 const conservation=healerConservation(actor),fit=.85+.1*conservation;
 const tankHealThreshold=Math.max(300,fit*estimate(['flash','lesser','penance','regrowth','touch'].find(key=>spells[key])));
 const alive=party.filter(u=>u.hp),need=u=>Math.max(0,u.max-u.hp-(incoming[party.indexOf(u)]??0));
 // A tank assignment is a priority, not an exclusion of the rest of the raid.
 const candidates=alive.filter(u=>focus!=='group'||u.group===unit.group);
 if(can('oath')&&(!(s.oath?.expires>s.time)||!s.oath.target.hp)){const tank=alive.find(u=>u.role==='Tank');if(tank)return cast('oath',tank);}
 const targets=candidates.map(u=>({unit:u,deficit:Math.max(0,u.max-u.hp-(incoming[party.indexOf(u)]??0))})).sort((a,b)=>(b.deficit/b.unit.max+(b.unit.role==='Tank'?(focus==='tanks'&&b.deficit>=tankHealThreshold?.45:.12):0)+(b.unit===unit&&unit.hp/unit.max<.25?.5:0))-(a.deficit/a.unit.max+(a.unit.role==='Tank'?(focus==='tanks'&&a.deficit>=tankHealThreshold?.45:.12):0)+(a.unit===unit&&unit.hp/unit.max<.25?.5:0)));
 const target=targets[0];if(!target)return null;
 const injured=targets.filter(t=>t.deficit>t.unit.max*.2);
 const dispel=candidates.find(u=>u.poison>s.time);
 if(dispel&&can('poison'))return cast('poison',dispel);
 const groupHurt=party.filter(u=>u.hp&&u.group===target.unit.group&&u.max-u.hp-(incoming[party.indexOf(u)]??0)>u.max*.2).length,ownGroupHurt=party.filter(u=>u.hp&&u.group===unit.group&&u.max-u.hp-(incoming[party.indexOf(u)]??0)>u.max*.2).length;
 if(can('stream')&&ownGroupHurt>=2&&!s.effects.some(e=>['stream','tide'].includes(e.key)))return cast('stream');
 if(can('spring')&&!injured.length&&!s.effects.some(e=>e.waterTotem))return cast('spring');
 const emergency=target.unit.hp/target.unit.max<.4;
 if(!emergency&&target.deficit<Math.max(220,target.unit.max*(.08+.05*conservation)))return null;

 // Vigil's mark primes Holy Shock: use the pair only when its group heal is useful.
 if(can('shock')&&s.vigil?.expires>s.time){const marked=s.vigil.target;const hurt=party.filter(u=>u.hp&&u.group===marked.group&&u.max-u.hp>300);if(hurt.length>=2||marked.max-marked.hp>estimate('shock')*.85)return cast('shock',marked);}
 if(can('vigil')&&can('shock')&&groupHurt>=(conservation>.6?5:4)&&s.mana>actor.profile.mana*.45&&party.filter(u=>u.hp&&u.group===target.unit.group).reduce((n,u)=>n+need(u),0)>estimate('vigil')*3.5&&!(s.vigil?.expires>s.time))return cast('vigil',target.unit);
 if(can('mending')&&party.some(u=>u.hp&&need(u)>180))return cast('mending',target.unit);
 if(can('swiftmend')&&target.unit.hp/target.unit.max<.5&&s.effects.some(e=>['regrowth','rejuvenation'].includes(e.key)&&e.target===target.unit))return cast('swiftmend',target.unit);
 if(can('shock')&&target.deficit>estimate('shock')*.85)return cast('shock',target.unit);
 if(can('penance')&&(emergency||target.deficit>estimate('penance')*3*(.5+.2*conservation)))return cast('penance',target.unit);
 if(can('tranquility')&&ownGroupHurt>=3)return cast('tranquility',unit);
 if(can('favor')&&target.deficit>1400&&!(s.divineFavor>s.time))return cast('favor');
 if(can('shield')&&target.unit.hp/target.unit.max<(.55-.15*conservation)&&!(target.unit.weakened>s.time))return cast('shield',target.unit);
 const groupDeficit=party.filter(u=>u.hp&&u.group===target.unit.group).reduce((n,u)=>n+need(u),0);
 if(can('prayer')&&groupHurt>=3&&groupDeficit>estimate('prayer')*3){if(s.innerFocus>s.time)return cast('prayer',target.unit);if(can('focus'))return cast('focus');}
 if(injured.length>=3){for(const key of ['chain','growth']){const sp=spells[key];if(!sp)continue;const total=estimate(key)*(key==='chain'?1+(sp.falloff??.5)+(sp.falloff??.5)**2:5*Math.floor(sp.duration/sp.period));if(!emergency&&groupDeficit<total*(.65+.2*conservation))continue;if(injured.filter(t=>t.unit.group===target.unit.group).length<3)continue;const choice=cast(key,target.unit);if(choice)return choice;}}
 for(const key of ['riptide','rejuvenation','renew'])if(can(key)&&target.deficit>Math.max(key==='rejuvenation'?650:500,estimate(key)*Math.floor(spells[key].duration/(spells[key].period||spells[key].duration))*(.35+.35*conservation))&&!s.effects.some(e=>e.key===key&&e.target===target.unit))return cast(key,target.unit);
 const keys=emergency?['shock','flash','lesser','regrowth','greater','holyLight','wave','touch','heal']:['holyLight','greater','wave','touch','heal','lesser','flash','regrowth'];
 // Rank max-level choices by useful healing/mana, allowing for crit refunds.
 if(!emergency)keys.sort((a,b)=>{const score=k=>{const sp=spells[k];if(!sp)return -1;const expected=estimate(k);if(target.deficit<expected*fit)return -1;return Math.min(expected,target.deficit)/Math.max(1,sp.cost*(1-(sp.illumination??0)*(actor.profile.crit??0)));};return score(b)-score(a);});
 for(const key of keys){if(!can(key))continue;const expected=estimate(key);
  if(emergency||target.deficit>=expected*fit)return cast(key,target.unit);
 }
 return null;
}
export function createRaidPull(profile,spells,encounter,random,onHeal,onDamage,onSpell,adapters,average,enabledBuffs=new Set(['mageblood'])){
 const actors=[],all=[];
 const onGroupMana=(caster,amount,source,members)=>{for(const actor of all)if(actor.unit!==caster&&actor.unit.hp&&(members?members.includes(actor.unit):actor.unit.group===caster.group))actor.pull.grantMana(amount,source+' · group');};
 const main=createPull(profile,spells,{...encounter,bossMax:encounter.health,party:encounter.party.map(unit=>({...unit,combatStats:raidCombatStats(unit,enabledBuffs,combatants[unit.combatantKey??unit.name])})),raid:true,onGroupMana,onDamageTaken:(unit,amount)=>{if(amount>0)for(const a of actors)a.pull.reactToDamage(unit);},onRaidDamageBatch:units=>{for(const a of actors){const target=a.pull.state.mending?.target??a.unit;if(units.includes(target))a.pull.reactToDamage(target);}}},random,onHeal,onDamage,onSpell);
 const party=main.state.party;all.push({pull:main,unit:party.at(-1),profile,spells});
 for(const unit of party.filter(u=>u.support!==undefined)){
  const build=companionBuild(adapters[unit.className],average,enabledBuffs,unit.spec);unit.max=build.profile.health;unit.hp=unit.max;
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
  for(const a of actors)if(a.unit.hp){a.pull.state.boss=main.state.boss;a.pull.state.bossMax=main.state.bossMax;a.pull.step(dt);}else {a.pull.state.phase='lost';a.pull.state.cast=null;a.pull.state.effects=[];a.pull.state.mending=null;}
  if(main.state.time>=nextDecision){nextDecision=main.state.time+.2;for(const a of actors){const choice=chooseHeal(a,party,totals());if(choice)a.pull.cast(choice.key,choice.index);}}
  if(main.state.time>=nextSpring){nextSpring=main.state.time+2;const groups=new Set(party.filter(u=>u.role==='Damage'&&u.className==='shaman'&&u.hp).map(u=>u.group));for(const a of all)if(groups.has(a.unit.group)&&!all.some(other=>other.pull.state.effects.some(e=>e.key==='spring'&&e.expires>main.state.time&&(e.members?e.members.includes(a.unit):other.unit.group===a.unit.group))))a.pull.grantMana(20,'Mana Spring · DPS Shaman');}
 }};
}

export function raidMemberMax(unit,buffs){const base=unit.stamina??180,bonus=(buffs.has('fortitude')?70:0)+(buffs.has('mark')?16:0),stamina=Math.floor((base+bonus)*(buffs.has('kings')?1.1:1));return Math.round(unit.max+(stamina-base)*10*(unit.healthMultiplier??1));}

export const raidSpecLabels={fury:'Fury Warrior',mutilate:'Mutilate Rogue',enhancement:'Enhancement Shaman',elemental:'Elemental Shaman',balance:'Balance Druid',shadow:'Shadow Priest',affliction:'Affliction Warlock',destruction:'Destruction Warlock',retribution:'Retribution Paladin',protectionPaladin:'Protection Paladin',Cairne:'Protection Warrior',Illidan:'Combat Rogue',Sylvanas:'Hunter',Jaina:'Mage'};
