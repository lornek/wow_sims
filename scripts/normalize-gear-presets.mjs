import fs from 'node:fs';
import {canEquip,canEnchant} from '../public/healing/equipment.mjs';
const catalog=JSON.parse(fs.readFileSync('public/healing/catalog/items.json'));
for(const [cls,file]of Object.entries({paladin:'paladin-gear',priest:'priest-gear',druid:'druid-gear',shaman:'gear'})){
 const m=await import('../public/healing/'+file+'.mjs');const exported=m.loadouts?'loadouts':'equipmentSets';const sets=m[exported];
 for(const [name,kit]of Object.entries(sets)){
  for(const [slot,item]of Object.entries(kit)){
   const found=catalog.items.find(i=>i.id===item.id&&i.source===item.source)??catalog.items.find(i=>i.id===item.id);
   if(found&&canEquip(found,slot,cls)){
     const enchant=catalog.enchants.find(e=>e.id===item.enchantId&&canEnchant(e,found,cls));
     kit[slot]={...found,acquisition:item.acquisition,...(enchant&&canEnchant(enchant,found,cls)?{enchantId:enchant.id}:{})};
   }else delete kit[slot];
  }

 }
 fs.writeFileSync('public/healing/'+file+'.mjs','export const '+exported+' = '+JSON.stringify(sets,null,2)+';\n');
}
