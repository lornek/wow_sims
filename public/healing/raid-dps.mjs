import {raidDpsSpells as spells}from'./raid-dps-data.mjs';
const spec=(className,resource,options)=>({className,resource,max:resource==='Mana'?5200:100,regen:resource==='Energy'?10:resource==='Rage'?2:35,ap:900,power:350,crit:.2,hit:.94,weapon:150,speed:2.6,...options});
export const raidDpsStats={
 fury:spec('warrior','Rage',{ap:1250,power:0,dual:true,offHand:95}),
 mutilate:spec('rogue','Energy',{ap:1100,power:0,weapon:110,speed:1.8,dual:true,offHand:90}),
 enhancement:spec('shaman','Mana',{ap:1100,power:200,dual:false,weapon:199,speed:4,melee:true}),
 elemental:spec('shaman','Mana',{ap:0,power:450,castReduction:.5}),
 balance:spec('druid','Mana',{ap:0,power:430,castReduction:.5}),
 shadow:spec('priest','Mana',{ap:0,power:420,shadowMultiplier:1.15}),
 affliction:spec('warlock','Mana',{ap:0,power:440}),
 destruction:spec('warlock','Mana',{ap:0,power:440}),
 retribution:spec('paladin','Mana',{ap:1100,power:220,weapon:220,speed:3.5,melee:true}),
 protectionPaladin:spec('paladin','Mana',{ap:600,power:300,weapon:100,speed:2,melee:true}),
};
export function raidCombatStats(unit,buffs=new Set(),fallback){
 const base=raidDpsStats[unit.spec]??fallback;if(!base)return null;
 const kings=buffs.has('kings')?1.1:1,attributes=(buffs.has('mark')?16:0),intellect=base.resource==='Mana'?(150+attributes+(buffs.has('intellect')?31:0))*kings-150:0;
 return {...base,max:base.max+Math.max(0,intellect)*15+(base.resource==='Mana'&&buffs.has('flask')?2000:0),ap:(base.ap??0)*kings+attributes*2*kings,power:base.power??0,crit:base.crit,spellCritBonus:(base.resource==='Mana'&&buffs.has('moonkin')?.03:0)+Math.max(0,intellect)/6000,windfuryTotem:buffs.has('windfury'),regen:base.regen+(base.resource==='Mana'?((buffs.has('wisdom')?40:0)+(buffs.has('mageblood')?20:0))/5+((buffs.has('spirit')?40:0)+attributes)*.125*.15:0)};
}
const priorities={fury:['Execute','Whirlwind','Bloodthirst'],mutilate:['Shank','Slice and Dice','Rupture','Eviscerate','Mutilate'],enhancement:['Flame Shock','Stormstrike','Earth Shock','Lightning Bolt'],elemental:['Flame Shock','Chain Lightning','Earth Shock','Lightning Bolt'],balance:['Moonfire','Insect Swarm','Starfire','Wrath'],shadow:['Shadow Word: Pain','Devouring Plague','Mind Blast','Shadow Word: Death','Mind Flay'],affliction:['Corruption','Bane of Agony','Siphon Life','Shadow Bolt'],destruction:['Immolate','Conflagrate','Shadowburn','Incinerate'],retribution:['Hammer of Wrath','Judgement','Holy Strike','Exorcism'],protectionPaladin:['Judgement','Consecration','Holy Shield','Holy Strike','Exorcism']};
export const raidDpsPriorities=priorities;
export function advanceRaidDps(state,unit,dt,random,onDamage,armor,onSelfDamage=()=>{}){
 const stats=unit.combatStats??raidDpsStats[unit.spec],r=unit.rotation,now=state.time;
 r.dots??={};r.procs??=0;r.nextAuto??=stats.speed;r.nextOff??=stats.speed+.5;r.nextPet??=2;r.nextWindfury??=0;
 unit.resource.value=Math.min(unit.resource.max,unit.resource.value+stats.regen*dt);
 function hit(name,amount,magic=true,canCrit=true,ignoreArmor=false,guaranteed=false,critMultiplier){
  const m=unit.damage[name]??={attempts:0,hits:0,crits:0,total:0};m.attempts++;if(!guaranteed&&random()>stats.hit)return 0;
  const crit=canCrit&&random()<stats.crit+(unit.spec==='balance'&&name==='Wrath'?.20:0)+(magic?(stats.spellCritBonus??0):0);const raw=amount*((magic||ignoreArmor)?1:5500/(5500+armor))*(crit?(critMultiplier??(magic?1.5:2)):1)*(magic&&stats.shadowMultiplier?stats.shadowMultiplier:1)*(magic&&unit.powerInfusion?.expires>now?1.2:1);
  const damage=Math.max(0,Math.min(state.boss,Math.round(raw)));state.boss-=damage;m.hits++;m.crits+=Number(crit);m.total+=damage;if(damage)onDamage({source:unit.name,sourceIndex:state.party.indexOf(unit),color:unit.color,spell:name,amount:damage,crit,time:now});
  if(crit&&unit.spec==='mutilate')r.combo=Math.min(5,r.combo+1);return damage;
 }
 function base(effect){return Math.max(0,effect.BasePoints+Math.max(0,60-(r.spellLevel??60))*(effect.PPL??0));}
 function land(spell){
  const weapon=stats.weapon+stats.ap*(unit.spec==='enhancement'?3.3:2.4)/14,magic=spell.school!==1;
  if(spell.name==='Slice and Dice'){r.sliceUntil=now+6+3*r.combo;r.combo=0;return;}
  if(spell.name==='Holy Shield'){r.holyShieldUntil=now+10;r.holyShieldCharges=4;return;}
  if(spell.name==='Judgement'){hit('Judgement',280+.43*stats.power,true);return;}
  if(spell.name==='Bloodthirst'){hit(spell.name,stats.ap*.45,false);return;}
  if(spell.name==='Whirlwind'){hit(spell.name,weapon,false);hit(spell.name,((stats.offHand??0)+stats.ap*2.4/14)*.5,false);return;}
  if(spell.name==='Shank'){hit(spell.name,(stats.offHand+stats.ap*1.7/14)*.5,false);unit.resource.value=Math.min(unit.resource.max,unit.resource.value+25);return;}
  if(spell.name==='Mutilate'){hit(spell.name,(stats.weapon+stats.ap*1.7/14+88)*.9*1.2,false);hit(spell.name,(stats.offHand+stats.ap*1.7/14+88)*.9*.5*1.2,false);r.combo=Math.min(5,r.combo+2);return;}
  if(spell.name==='Eviscerate'){hit(spell.name,200+r.combo*(110+stats.ap*.03),false);r.combo=0;return;}
  if(spell.name==='Execute'){hit(spell.name,500+stats.ap*.2+unit.resource.value*10,false);unit.resource.value=0;return;}
  if(spell.name==='Stormstrike'){hit(spell.name,weapon,false);if(stats.dual)hit('Stormstrike · off hand',(stats.offHand+stats.ap*2.4/28)*.5,false);return;}
  if(spell.name==='Consecration'){r.dots[spell.name]={next:now+1,left:8,period:1,amount:60+stats.power*.042,magic:true,crit:false};return;}
  let direct=0;
  for(const e of spell.effects){
   if(e.Type===2)direct+=base(e)+e.SPCoef*stats.power+(e.APCoef??0)*stats.ap;
   if([17,58,121].includes(e.Type))direct+=weapon+base(e);
   if(e.Type===6&&[3,8,53].includes(e.Aura)){const period=(e.PeriodMs||1000)/1000;r.dots[spell.name]={next:now+period,left:Math.max(1,Math.floor((spell.name==='Rupture'?6+2*r.combo:spell.duration)/period)),period,amount:base(e)+e.SPCoef*stats.power+(spell.name==='Rupture'?r.combo*(e.PointsPerResource??0)+stats.ap*.01:0),magic,crit:false,leech:e.Aura===53,bypass:spell.name==='Rupture'};}
  }
  if(spell.name==='Holy Strike'&&direct===0)direct=weapon+150;
  if(direct){const dealt=hit(spell.name,direct,magic);if(unit.spec==='balance'&&dealt){if(spell.name==='Wrath'){r.eclipse=Math.min(4,(r.eclipse??0)+2);r.eclipseUntil=now+15;}}if(spell.name==='Shadow Word: Death'&&state.boss>0&&dealt)onSelfDamage(unit,dealt);if(unit.spec==='elemental'&&['Lightning Bolt','Chain Lightning'].includes(spell.name)&&random()<.2)hit(spell.name+' · Overload',direct*.5,true);}
  if(spell.name==='Starfire')r.eclipse=Math.max(0,(r.eclipse??0)-1);
  if(spell.name==='Rupture')r.combo=0;
 }
 if(r.pending&&now>=r.pending.end){land(r.pending.spell);r.pending=null;}
 for(const[name,dot]of Object.entries(r.dots)){if(dot.left>0&&now>=dot.next){const dealt=hit(name,dot.amount,dot.magic,dot.crit,dot.bypass);if(dot.leech&&unit.hp)unit.hp=Math.min(unit.max,unit.hp+dealt);dot.left--;dot.next+=dot.period;}}
 const melee=stats.melee||unit.spec==='fury'||unit.spec==='mutilate';
 if(melee&&now>=r.nextAuto){r.nextAuto=now+stats.speed/(r.sliceUntil>now?1.3:1);const dealt=hit('Main-hand swing',stats.weapon+stats.ap*stats.speed/14,false);if(stats.resource==='Rage')unit.resource.value=Math.min(100,unit.resource.value+10);if(unit.spec==='enhancement'){if(dealt)r.procs=Math.min(5,r.procs+1);if(dealt&&now>=r.nextWindfury&&random()<.2){r.nextWindfury=now+3;hit('Windfury Attack',stats.weapon+(stats.ap+333)*stats.speed/14,false);hit('Windfury Attack',stats.weapon+(stats.ap+333)*stats.speed/14,false);}}if(dealt&&stats.windfuryTotem&&unit.spec!=='enhancement'&&random()<.2)hit('Windfury Totem',stats.weapon+(stats.ap+246)*stats.speed/14,false);if(unit.spec==='mutilate'&&dealt&&random()<.3)hit('Venom',130,true);if(dealt&&(unit.spec==='retribution'||unit.spec==='protectionPaladin')){hit('Seal of Righteousness',17.86*stats.speed*(unit.spec==='retribution'?1.2:.85-.2*Math.max(0,2-stats.speed))+(unit.spec==='retribution'?.12:.1)*stats.power,true,true,false,true,2);if(unit.spec==='retribution'&&random()<Math.min(1,7*stats.speed/60))hit('Seal of Command',.7*(stats.weapon+stats.ap*stats.speed/14)+.29*stats.power,true,true,false,true,2);}}
 if(stats.dual&&now>=r.nextOff){r.nextOff=now+stats.speed/(r.sliceUntil>now?1.3:1);hit('Off-hand swing',((stats.offHand??80)+stats.ap*stats.speed/14)*.5,false);}
 if(['affliction','destruction'].includes(unit.spec)&&now>=r.nextPet){r.nextPet=now+2;hit('Pet: '+(unit.spec==='affliction'?'Shadow Bite':'Firebolt'),70+.08*stats.power,true);}
 // Finish the current tick, then clip filler when Mind Blast becomes ready.
 if(unit.spec==='shadow'&&r.dots['Mind Flay']?.left>0&&(r.cooldowns['Mind Blast']??0)<=now&&now>=(r.channelStart??0)+1.5&&r.dots['Mind Flay'].next-now>.9){r.dots['Mind Flay'].left=0;r.action=now;}
 if(r.pending||r.action>now||!state.boss)return;
 if(stats.resource==='Mana'&&unit.resource.value<unit.resource.max*.15&&['affliction','destruction'].includes(unit.spec)&&unit.hp>unit.max*.5){unit.hp-=unit.max*.08;unit.resource.value=Math.min(unit.resource.max,unit.resource.value+unit.resource.max*.2);r.action=now+1.5;const m=unit.damage['Life Tap']??={attempts:0,hits:0,crits:0,total:0};m.attempts++;return;}
 for(const name of priorities[unit.spec]){
  const spell=spells[name];if(['Flame Shock','Earth Shock'].includes(name)&&(r.cooldowns.Shock??0)>now)continue;if(!spell||(r.cooldowns[name]??0)>now)continue;
  if(['Execute','Hammer of Wrath','Shadowburn'].includes(name)&&state.boss>state.bossMax*.2)continue;
  if(name==='Slice and Dice'&&(r.combo<2||r.sliceUntil>now+2))continue;
  if(['Rupture','Eviscerate'].includes(name)&&r.combo<5)continue;
  if(r.dots[name]?.left>0)continue;
  if(name==='Starfire'&&(!(r.eclipseUntil>now)||!(r.eclipse>0)))continue;
  if(name==='Holy Shield'&&r.holyShieldUntil>now+1)continue;
  if(name==='Lightning Bolt'&&unit.spec==='enhancement'&&r.procs<5)continue;
  if(name==='Conflagrate'&&!(r.dots.Immolate?.left>0))continue;
  const cost=spell.costPct?unit.resource.max*spell.costPct/100:spell.cost;if(unit.resource.value<cost)continue;
  unit.resource.value-=cost;if(['Flame Shock','Earth Shock'].includes(name))r.cooldowns.Shock=now+6;r.cooldowns[name]=now+Math.max(0,spell.cooldown-(name==='Mind Blast'?2.5:0));
  const cast=unit.spec==='enhancement'&&name==='Lightning Bolt'?0:Math.max(0,spell.cast-(stats.castReduction??0)-(name==='Shadow Bolt'?.5:name==='Corruption'?2:name==='Starfire'&&r.eclipseUntil>now&&r.eclipse>0?.5:0));if(unit.spec==='enhancement'&&name==='Lightning Bolt')r.procs=0;
  const channel=name==='Mind Flay'?spell.duration:0;if(channel)r.channelStart=now;r.action=now+Math.max(spell.gcd||1.5,cast,channel);r.spellLevel=spell.level;
  if(cast)r.pending={spell,end:now+cast};else land(spell);return;
 }
}
