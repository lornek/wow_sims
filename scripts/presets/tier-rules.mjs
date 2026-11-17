export const raidTier = {2159:1,2717:1,2677:2,1977:3,3428:3,3429:3,3456:3,16074:4,16236:4};
export const dungeonZones = new Set([209,491,717,718,719,721,722,796,1176,1337,1477,1581,1583,1584,2017,2057,2100,2437,2557,15475]);
const crafts = new Map([
 ['Hide of the Wild',[1,'Pattern from Knot Thimblejack, Dire Maul']],
 ['Corehound Belt',[1,'Thorium Brotherhood pattern; Molten Core materials']],
 ['Mooncloth Circlet',[1,'Tailoring; Dire Maul-era pattern']],
 ['Mooncloth Gloves',[1,'Tailoring; Dire Maul-era pattern']],
 ['Living Shoulders',[1,'Leatherworking; classic world recipe']],
 ['Living Leggings',[1,'Leatherworking; classic world recipe']],
 ['Living Breastplate',[1,'Leatherworking; Scholomance pattern']],
 ['Red Dragonscale Breastplate',[1,'Leatherworking; Upper Blackrock Spire pattern']],
 ['Corehound Boots',[3,"Cenarion Circle pattern; Ahn'Qiraj-era"]]
]);
const reputations={59:1,529:1,576:1,749:1,270:3,609:3,910:3};
export function acquisition(item, raw, db) {
 if(!raw || raw.name!==item.name)return null;
 const zones=new Map(db.zones.map(z=>[z.id,z.name]));const npcs=new Map(db.npcs.map(n=>[n.id,n]));
 const factions=new Map(db.factions.map(f=>[f.id,f.name]));
 const proofs=[];
 for(const source of raw.sources??[]) {
  if(source.drop){const d=source.drop,z=d.zoneId??npcs.get(d.npcId)?.zoneId;let tier;
   if(raidTier[z])tier=raidTier[z];else if(dungeonZones.has(z))tier=1;
   else if(z===1377||[14887,14888,14889,14890].includes(d.npcId))tier=3;
   else if(z&&z<2000&&d.npcId&&d.npcId<14500)tier=1;
   else if(d.otherName==='World Drop'&&(item.phase??1)<=1)tier=1;
   if(tier)proofs.push({kind:'drop',tier,zoneId:z??0,npcId:d.npcId??0,label:[zones.get(z),npcs.get(d.npcId)?.name??d.otherName].filter(Boolean).join(' · ')||'Classic world drop'});
  }
  if(source.crafted){const reviewed=crafts.get(item.name);if(reviewed)proofs.push({kind:'crafted',tier:reviewed[0],spellId:source.crafted.spellId,label:reviewed[1]});}
  if(source.rep){const r=source.rep,tier=reputations[r.repFactionId];if(tier)proofs.push({kind:'reputation',tier,factionId:r.repFactionId,label:(factions.get(r.repFactionId)??r.repFactionId)+' reputation'});}
  if(source.quest&&/^Atiesh, Greatstaff of the Guardian$/.test(item.name))proofs.push({kind:'quest',tier:3,questId:source.quest.id,label:'Atiesh quest · Naxxramas and AQ40 bosses'});
  if(source.soldBy&&source.soldBy.zoneId===139&&(raw.phase??0)===7&&/Earthshatter|Dreamwalker|Redemption/.test(raw.setName??''))proofs.push({kind:'vendor',tier:3,zoneId:3456,vendorZoneId:139,label:'Naxxramas tier-token turn-in · Eastern Plaguelands'});
  if(source.soldBy&&raidTier[source.soldBy.zoneId])proofs.push({kind:'vendor',tier:raidTier[source.soldBy.zoneId],zoneId:source.soldBy.zoneId,label:zones.get(source.soldBy.zoneId)+' vendor'});
  // Current SoD phase-8 has no later raid than Scarlet Enclave. Non-drop sources
  // not reviewed above may be used in T4 only, never leak down to earlier tiers.
  if(item.source==='Season of Discovery' && (raw.phase??1)<=8 && !source.pvp && (source.quest||source.soldBy||source.crafted||source.rep)){const kind=Object.keys(source)[0];const value=source[kind];const label=kind==='quest'?'Quest · '+value.name:kind==='soldBy'?(zones.get(value.zoneId)??'SoD')+' vendor · phase '+raw.phase:kind==='crafted'?'Crafted · SoD phase '+raw.phase:(factions.get(value.repFactionId)??'SoD')+' reputation';proofs.push({kind,tier:4,label,details:source});}
 }
 return proofs.sort((a,b)=>a.tier-b.tier)[0]??null;
}
// Only source-reviewed enchants are eligible; unknown/new formulas wait until T4.
export function enchantAcquisition(enchant) {
 const name=enchant.name;
 if(/Zandalar|Syncretist|Vodouisant|Presence of Sight|Hoodoo|Prophetic Aura|Animist/.test(name))return {tier:3,label:"Zul'Gurub reputation/class enchant"};
 if(/of the Scourge/.test(name))return {tier:3,label:'Naxxramas · Sapphiron enchant'};
 if(name==='Enchant Gloves - Healing Power')return {tier:3,label:"Formula: Enchant Gloves - Healing Power · Ahn'Qiraj"};
 if(/Law of Nature|Spellblasting|Off-Hand|Mighty Healing|Mighty Spell|Living Stats|Mystic.*Armor Kit/.test(name))return {tier:4,label:'Later/custom formula; conservatively T4 only'};
 if(/Enchant Bracer - Healing Power|Mighty Spirit|Mighty Intellect/.test(name))return {tier:1,label:'Timbermaw Hold reputation formula'};
 if(/Arcanum of Focus/.test(name))return {tier:1,label:'Dire Maul · Libram of Focus'};
 if(/Lesser Arcane Amalgamation/.test(name))return {tier:1,label:'Burning Steppes · classic Libram enchant'};
 if(/Enchant Weapon - Healing Power|Enchant Weapon - Spell Power/.test(name))return {tier:1,label:'Molten Core formula'};
 if(/^(Enchant (Chest|Boots|Bracer|Cloak|Shield|2H Weapon|Gloves) - |Light Armor Kit|Medium Armor Kit|Heavy Armor Kit|Thick Armor Kit|Rugged Armor Kit)/.test(name))return {tier:1,label:'Classic trainer/world/dungeon enchant'};
 return null;
}
