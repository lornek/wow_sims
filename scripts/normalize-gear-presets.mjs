import fs from 'node:fs';
import {canEquip,canEnchant} from '../public/healing/equipment.mjs';
const catalog=JSON.parse(fs.readFileSync('public/healing/catalog/items.json'));
for(const [cls,file]of Object.entries({paladin:'paladin-gear',priest:'priest-gear',druid:'druid-gear',shaman:'gear'})){
 const m=await import('../public/healing/'+file+'.mjs');const exported=m.loadouts?'loadouts':'equipmentSets';const sets=m[exported];
 for(const [name,kit]of Object.entries(sets)){
  for(const [slot,item]of Object.entries(kit)){
   const found=catalog.items.find(i=>i.id===item.id&&i.source===item.source)??catalog.items.find(i=>i.id===item.id);
   if(found&&canEquip(found,slot,cls)){
     const enchant=catalog.enchants.find(e=>e.id===item.enchantId);
     kit[slot]={...found,acquisition:item.acquisition,...(enchant&&canEnchant(enchant,found,cls)?{enchantId:enchant.id}:{})};
   }else delete kit[slot];
  }
  if(cls==='paladin'&&name!=='Ungeared'){
   const sod=name.includes('Tier 2')||name.includes('Tier 3')||name.includes('Tier 4');
   const phase=name.includes('Tier 4')?8:name.includes('Tier 3')?7:name.includes('Tier 2')?5:1;
   const cap=name.includes('Tier 4')?100:name.includes('Tier 3')?92:name.includes('Tier 2')?83:name.includes('Tier 1')?76:65;
   const pool=catalog.items.filter(i=>i.source===(sod?'Season of Discovery':'Forever')&&(i.phase??1)<=phase && (i.ilvl??0)<=cap);
   // Prefer healer stats and a shield; never fill this class with a staff.
   for(const slot of ['Main hand','Off hand']){
    if(name==='Tier 1 raid' && kit[slot])continue;
    if(name==='Tier 4 raid · SoD' && slot==='Main hand'){
     // Reviewed healer weapon: the DPS catalog's generic power is not a reliable healer ranking.
     const spire=pool.find(i=>i.id===241006);
     if(!spire || !canEquip(spire,slot,cls) || spire.stats.power!==317 || spire.stats.spellDamage!==106)
      throw new Error('T4 healer preset requires the verified Spire of Sacrifice healing stats');
     kit[slot]=spire;
     continue;
    }
    const candidates=pool.filter(i=>canEquip(i,slot,cls)&&!i.twoHand&&(name!=='Tier 3 raid'||slot!=='Main hand'||i.weaponType===4)&&(slot!=='Off hand'||i.weaponType===7)&&(name!=='Fresh 60'||i.quality<=3)&& (name!=='Level 60 dungeon'||i.quality<=3));
    candidates.sort((a,b)=>(b.stats.power??0)-(a.stats.power??0)||(b.stats.intellect??0)-(a.stats.intellect??0));
    if(candidates[0])kit[slot]=candidates[0];
   }
  }
 }
 fs.writeFileSync('public/healing/'+file+'.mjs','export const '+exported+' = '+JSON.stringify(sets,null,2)+';\n');
}
