import {catalogVersion} from './catalog/version.mjs';
let pending;
export async function loadGearCatalog() {
  if (pending) return pending;
  pending = (async () => {
    const url = new URL('./catalog/items.json?v=' + catalogVersion, import.meta.url).href;
    let cache;
    try { cache = await globalThis.caches?.open('healbot-gear-' + catalogVersion); } catch {}
    let response, catalog;
    const parse = async response => {
      const value = await response.json();
      if (value.version !== 1 || !Array.isArray(value.items) || !Array.isArray(value.enchants)) throw new Error('Invalid item catalog');
      return value;
    };
    try {
      response = await cache?.match(url);
      if (response) catalog = await parse(response);
    } catch { /* Corrupt or unavailable cache falls back to the bundled catalog. */ }
    if (!catalog) {
      response = await fetch(url);
      if (!response.ok) throw new Error('Item catalog could not be loaded. Please try again.');
      const copy = response.clone();
      catalog = await parse(response);
      try { await cache?.put(url, copy); } catch {}
    }
    try { for (const name of await globalThis.caches?.keys() ?? []) if (name.startsWith('healbot-gear-') && name !== 'healbot-gear-' + catalogVersion) await caches.delete(name); } catch {}
    return catalog;
  })();
  try { return await pending; } catch (error) { pending = undefined; throw error; }
}
const ids = {paladin:2,priest:5,shaman:7,druid:11};
const weapons = {paladin:[1,4,5,6,7,9],priest:[2,4,5,8],shaman:[1,2,3,4,5,7,8],druid:[2,3,4,5,6,8]};
const slotTypes = {Head:1,Neck:2,Shoulders:3,Back:4,Chest:5,Wrists:6,Hands:7,Waist:8,Legs:9,Feet:10,'Finger 1':11,'Finger 2':11,'Trinket 1':12,'Trinket 2':12,'Main hand':13,'Off hand':13,Relic:14};
export function canEquip(item, slot, className) {
  if (!item || item.type !== slotTypes[slot] || (item.reqLvl ?? 0) > 60) return false;
  if (item.classAllowlist?.length && !item.classAllowlist.includes(ids[className])) return false;
  if ((item.armorType ?? 0) > ({priest:1,druid:2,shaman:3,paladin:4}[className])) return false;
  if (item.type === 13) {
    if (!weapons[className]?.includes(item.weaponType)) return false;
    if (slot === 'Main hand') return item.handType !== 3 && ![5,7].includes(item.weaponType);
    return item.handType !== 4 && [5,7].includes(item.weaponType);
  }
  if (item.type === 14) return item.rangedWeaponType === ({priest:5,druid:6,paladin:7,shaman:8}[className]);
  return true;
}
export function canEnchant(enchant,item,className) {
  if (!item || enchant.classAllowlist?.length && !enchant.classAllowlist.includes(ids[className])) return false;
  if (![enchant.type,...(enchant.extraTypes ?? [])].includes(item.type)) return false;
  const kind=enchant.enchantType ?? 0;
  return kind === 1 ? item.twoHand : kind === 2 ? item.weaponType === 7 : kind === 4 ? item.weaponType === 8 : kind === 5 ? item.weaponType === 5 : item.type !== 13 || ![5,7].includes(item.weaponType) || kind === 3;
}
export function sanitizeEquipment(kit,className,catalog) {
  const result={}; const unique=new Set();
  for (const [slot,raw] of Object.entries(kit ?? {})) {
    if(!raw || typeof raw !== 'object')continue;
    const item=catalog.items.find(i=>i.key===raw.key) ?? catalog.items.find(i=>i.id===raw.id && i.source===raw.source);
    if (!canEquip(item,slot,className) || item.unique && unique.has(item.id)) continue;
    unique.add(item.id);
    const enchant=catalog.enchants.find(e=>e.id===raw.enchantId);
    result[slot]={...item,...(enchant && canEnchant(enchant,item,className)?{enchantId:enchant.id}:{} )};
  }
  if(result['Main hand']?.twoHand) delete result['Off hand'];
  return result;
}
export function effectiveEquipment(kit,catalog) {
  return Object.fromEntries(Object.entries(kit).map(([slot,item])=>{
    const stats={...item.stats};const enchant=catalog?.enchants.find(e=>e.id===item.enchantId);
    if(enchant)for(const [key,value] of Object.entries(enchant.stats))stats[key]=(stats[key]??0)+value;
    return [slot,{...item,stats}];
  }));
}
export function equipItem(kit,slot,item) {
  const next={...kit}; if(item)next[slot]={...item};else delete next[slot];
  if(slot==='Main hand' && item?.twoHand)delete next['Off hand'];
  if(slot==='Off hand' && item && next['Main hand']?.twoHand)delete next['Main hand'];
  if(item?.unique) for(const other of Object.keys(next))if(other!==slot && next[other].id===item.id)delete next[other];
  return next;
}
export function createGearHistory(initial) {
  let current=structuredClone(initial);const history=[];
  return {get value(){return structuredClone(current)},get canUndo(){return history.length>0},set(next){history.push(current);if(history.length>50)history.shift();current=structuredClone(next)},undo(){if(history.length)current=history.pop();return this.value}};
}
export const gearStatText = stats => Object.entries(stats).map(([k,v])=>`${Number(v.toFixed(2))}${k==='crit'?'%':''} ${({power:'+healing',mp5:'MP5',spellDamage:'spell damage'})[k]??k}`).join(' · ');
export const gearIcon = item => 'https://wow.zamimg.com/images/wow/icons/medium/'+item.icon+'.jpg';
