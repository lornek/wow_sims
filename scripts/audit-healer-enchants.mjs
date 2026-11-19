import fs from 'node:fs';
import crypto from 'node:crypto';
import {enchantEffectDefinitions} from '../public/healing/enchant-effects.mjs';
const [database,revision]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(database));
const file='public/healing/catalog/items.json',catalog=JSON.parse(fs.readFileSync(file));
const additions=new Set([931,7664,...Object.keys(enchantEffectDefinitions).map(Number)]);
const report={repository:'https://github.com/wowsims/forever',revision,reviewed:raw.enchants.length,additions:[],entries:[]};
for(const entry of raw.enchants){
 const id=entry.effectId+':'+entry.spellId,found=catalog.enchants.find(e=>e.id===id);
 let decision=found?'Already in stat catalog':'Outside the healer picker (melee, leveling, gathering, resistance, or unmodeled effect)';
 if(additions.has(entry.effectId)){
  const effect=enchantEffectDefinitions[entry.effectId];
  const normalized={...Object.fromEntries(['name','icon','type','extraTypes','enchantType','classAllowlist','quality'].filter(k=>k in entry).map(k=>[k,entry[k]])),id,
   stats:entry.effectId===931?{haste:1}:entry.effectId===7664?{crit:1}:{},
   ...(effect?{effect:{...effect,id,name:entry.name,icon:entry.icon},description:effect.description}:{}),
   verification:{repository:report.repository,revision,spellId:entry.spellId,effectId:entry.effectId}};
  if(found)Object.assign(found,normalized);else catalog.enchants.push(normalized);
  if(!found)report.additions.push({id,name:entry.name});decision='Modeled and available to healer picker';
 }
 report.entries.push({id,name:entry.name,level:entry.lvl??null,procKind:entry.procKind??null,decision});
}
const encoded=JSON.stringify(catalog);fs.writeFileSync(file,encoded);
fs.writeFileSync('public/healing/catalog/version.mjs','export const catalogVersion = '+JSON.stringify(crypto.createHash('sha256').update(encoded).digest('hex').slice(0,12))+';\n');
fs.writeFileSync('docs/healer-enchant-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('Audited',report.reviewed,'enchants; added',report.additions.length);
