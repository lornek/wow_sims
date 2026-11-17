import fs from 'node:fs';import {execFileSync} from 'node:child_process';import crypto from 'node:crypto';
import {canEquip,canEnchant,equipItem,effectiveEquipment} from '../public/healing/equipment.mjs';
import {expectedHealingPerMana} from '../public/healing/healing-preview.mjs';
import {acquisition,enchantAcquisition} from './presets/tier-rules.mjs';
const files=process.argv.slice(2);if(files.length!==2)throw Error('Usage: node scripts/rebuild-tier-presets.mjs FOREVER_DB_JSON SOD_DB_JSON');
const catalog=JSON.parse(fs.readFileSync('public/healing/catalog/items.json'));
const databases=Object.fromEntries(['Forever','Season of Discovery'].map((realm,i)=>{const bytes=fs.readFileSync(files[i]);return [realm,{...JSON.parse(bytes),sha256:crypto.createHash('sha256').update(bytes).digest('hex')}]}));
const byId=Object.fromEntries(Object.entries(databases).map(([realm,db])=>[realm,new Map(db.items.map(i=>[i.id,i]))]));
const facts=new Map(catalog.items.map(item=>[item.key,acquisition(item,byId[item.source].get(item.id),databases[item.source])]));
const slots=['Head','Neck','Shoulders','Back','Chest','Wrists','Hands','Waist','Legs','Feet','Finger 1','Finger 2','Trinket 1','Trinket 2','Relic'];
const knownRevisions={'6ee80e9cceb4bbf6b128219bc6db647536427c302b12af4382c73d9f500780dc':'a3c1c57df7fb712133593a1bf6c6898ab76f12ea','71395a1d280d139d4bb9bce445851f7afdcb0382729eeabdca5c6bea18a5e225':'0e3f6eff5fa3ad356664a1c2abbd02903d4cc97e'};
const report={method:'Mean normalized 60/90/120-second full-cast healing potential using default talents, no external buffs, and the class direct heal(s). Mana budget includes starting mana, casting Spirit regen, MP5 and average Illumination. No overheal, procs, set bonuses or cooldowns credited. Coordinate search; not a universal BiS proof.',sources:Object.fromEntries(Object.entries(databases).map(([r,d])=>[r,{sha256:d.sha256,revision:knownRevisions[d.sha256]??null,file:'assets/database/db.json'}])),presets:[]};
for(const [cls,file,exported,names]of [['shaman','gear','equipmentSets',['Healing Wave','Chain Heal']],['druid','druid-gear','loadouts',['Healing Touch']],['paladin','paladin-gear','loadouts',['Holy Light','Flash of Light']]]){
 const adapter=(await import('../public/healing/'+cls+'.mjs')).default;
 const sets=(await import('../public/healing/'+file+'.mjs'))[exported];
 const prior=(await import('data:text/javascript;base64,'+execFileSync('git',['show','HEAD:public/healing/'+file+'.mjs']).toString('base64')))[exported];
 const points=Object.fromEntries(adapter.talents.map(([key,name])=>[key,adapter.defaultTalents[name]??0]));
 function spells(profile){return names.map(name=>{const [key]=adapter.slots.find(s=>s[1]===name);const row=adapter.ranks.filter(r=>r.name===name&&r.level<=60).sort((a,b)=>a.level-b.level||a.id-b.id).at(-1);const effect=row.effects.find(e=>e.type==='E_HEAL');const entry=adapter.catalog[name].ranks.find(e=>e.rank===row.rank)??adapter.catalog[name].ranks.at(-1);const range=entry.description.match(/for (\d[\d,]*) to (\d[\d,]*)/);const pct=entry.details?.match(/(\d+)% of base mana/);return adapter.applyTalents({...row,key,name,cost:pct?Math.floor(profile.baseMana*Number(pct[1])/100):row.cost,low:range?Number(range[1].replaceAll(',','')):effect.base,high:range?Number(range[2].replaceAll(',','')):effect.base,coefficient:effect.coefficient,chain:effect.chain,falloff:effect.falloff},points);});}
 function potential(kit){const profile=adapter.buildProfile(effectiveEquipment(kit,catalog),new Set(),{},points);return spells(profile).flatMap(spell=>{const h=expectedHealingPerMana(spell,profile);const cadence=Math.max(1.5,spell.cast/(1+profile.haste));return [60,90,120].map(seconds=>Math.min(seconds/cadence,(profile.mana+seconds*(profile.regen*profile.castingRegen+profile.mp5/5))/(h.expectedCost||1))*h.healing);});}
 const naked=potential({});
 function score(kit){const p=potential(kit);return p.reduce((n,value,i)=>n+value/naked[i],0)/p.length;}
 for(let tier=1;tier<=4;tier++){
  const realm=tier===1?'Forever':'Season of Discovery',phase=tier===1?1:tier===2?5:tier===3?7:8;
  const pool=catalog.items.filter(item=>(item.source===realm||(tier===1&&item.source==='Season of Discovery'&&(item.phase??1)<=4))&&(tier===1||(item.phase??1)<=phase)&&facts.get(item.key)?.tier<=tier);
  const enchantPool=catalog.enchants.filter(e=>enchantAcquisition(e)?.tier<=tier);
  const enchantCache=new Map();
  function enchanted(item,slot){if(!item)return null;const cacheKey=item.key+':'+slot;if(enchantCache.has(cacheKey))return enchantCache.get(cacheKey);let best={...item},value=score({[slot]:best});for(const e of enchantPool){if(!canEnchant(e,item,cls))continue;const candidate={...item,enchantId:e.id};const next=score({[slot]:candidate});const armor=e.stats.armor??0,stamina=e.stats.stamina??0;const old=catalog.enchants.find(x=>x.id===best.enchantId&&canEnchant(x,item,cls));if(next>value+1e-10||(Math.abs(next-value)<1e-10&&(stamina*10+armor)>((old?.stats.stamina??0)*10+(old?.stats.armor??0)))){best=candidate;value=next;}}
    enchantCache.set(cacheKey,best);return best;}
  const candidates=Object.fromEntries([...slots,'Main hand','Off hand'].map(slot=>[slot,pool.filter(i=>canEquip(i,slot,cls)).map(i=>enchanted(i,slot))]));
  // If a ruleset has no relic at this tier, use only source-verified earlier
  // Forever relics. Never substitute an unknown later-raid drop.
  if(tier>=1)candidates.Relic.push(...catalog.items.filter(i=>i.source==='Forever'&&facts.get(i.key)?.tier<=tier&&canEquip(i,'Relic',cls)).map(i=>enchanted(i,'Relic')));
  const relicPreference = /Idol of (Rejuvenation|Health|Longevity)|Libram of (Divinity|Light|Hope)|Totem of (Life|Sustaining|Flowing Water)/;
  candidates.Relic.sort((a,b)=>Number(relicPreference.test(b.name))-Number(relicPreference.test(a.name))||(b.ilvl??0)-(a.ilvl??0));
  let kit={};
  for(let iteration=0;iteration<4;iteration++){
   let improvements=0;
   for(const slot of slots){let best=kit,bestValue=score(kit);for(const item of candidates[slot]){const candidate=equipItem(kit,slot,item);const value=score(candidate);if(value>bestValue+1e-9||(!kit[slot]&&Math.abs(value-bestValue)<1e-9&&best===kit)){best=candidate;bestValue=value;}}if(best!==kit){kit=best;improvements++;}}
   const one=candidates['Main hand'].filter(i=>!i.twoHand).sort((a,b)=>score({'Main hand':b})-score({'Main hand':a})).slice(0,40);
   const off=candidates['Off hand'].sort((a,b)=>score({'Off hand':b})-score({'Off hand':a})).slice(0,40);
   const options=candidates['Main hand'].filter(i=>i.twoHand).map(i=>({'Main hand':i}));for(const m of one)for(const o of [null,...off])if(!o||!m.unique||m.id!==o.id)options.push({'Main hand':m,...(o?{'Off hand':o}:{})});
   let best=kit,value=score(kit);for(const pair of options){const next={...kit};delete next['Main hand'];delete next['Off hand'];Object.assign(next,pair);const v=score(next);if(v>value+1e-9){value=v;best=next;}}if(best!==kit){kit=best;improvements++;}if(!improvements)break;
  }
  // Re-evaluate enchants against the completed character, not just naked stat weights.
  for(let pass=0;pass<3;pass++)for(const [slot,item]of Object.entries(kit)){
    let best=item,value=score(kit);
    for(const enchant of enchantPool){if(!canEnchant(enchant,item,cls))continue;const candidate={...item,enchantId:enchant.id};const v=score({...kit,[slot]:candidate});if(v>value+1e-10){best=candidate;value=v;}}
    kit[slot]=best;
  }
  const name=tier===4?'Tier 4 raid · SoD':`Tier ${tier} raid`;
  if(slots.some(s=>!kit[s])||!kit['Main hand'])throw Error(`Incomplete ${cls} ${name}: ${slots.filter(s=>!kit[s]).map(s=>s+" ("+candidates[s].length+")").join(", ")}`);
  const before=prior[name];
  for(const [slot,item]of Object.entries(kit)){const proof=facts.get(item.key);kit[slot]={...item,acquisition:proof.label,acquisitionTier:proof.tier};}
  sets[name]=kit;
  const profile=adapter.buildProfile(effectiveEquipment(kit,catalog),new Set(),{},points);
  const summary={gearHealing:profile.gearPower,healing:profile.power,mana:profile.mana,mp5:profile.mp5,crit:profile.crit*100,haste:profile.haste*100};
  report.presets.push({summary,className:cls,name,tier,realm:tier===1?'Forever with source-verified SoD Molten Core supplement':realm,relativePotential:score(kit),previousPotential:score(before),items:Object.entries(kit).map(([slot,item])=>({slot,key:item.key,name:item.name,stats:item.stats,source:facts.get(item.key),enchant:item.enchantId?{id:item.enchantId,name:catalog.enchants.find(e=>e.id===item.enchantId&&canEnchant(e,item,cls)).name,...enchantAcquisition(catalog.enchants.find(e=>e.id===item.enchantId&&canEnchant(e,item,cls)))}:null}))});
  console.log(cls,name,score(before).toFixed(3),'->',score(kit).toFixed(3),kit['Main hand'].name);
 }
 fs.writeFileSync('public/healing/'+file+'.mjs','export const '+exported+' = '+JSON.stringify(sets,null,2)+';\n');
}
fs.writeFileSync('docs/tier-preset-review.json',JSON.stringify(report,null,2)+'\n');
