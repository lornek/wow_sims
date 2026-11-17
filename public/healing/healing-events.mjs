import {purposeIconPath} from './purpose-icons.mjs';
export const healingEventKinds = [
  {key:'d_hits', label:'Direct hits', icon:purposeIconPath('direct-hits'), periodic:false, crit:false},
  {key:'d_crits', label:'Direct crits', icon:purposeIconPath('crits'), periodic:false, crit:true},
  {key:'p_hits', label:'Periodic hits', icon:purposeIconPath('periodic-hits'), periodic:true, crit:false},
  {key:'p_crits', label:'Periodic crits', icon:purposeIconPath('periodic-crits'), periodic:true, crit:true}
];
export function recordHealingEvent(stats, periodic, crit, effective, overheal) {
  const key = (periodic ? 'p_' : 'd_') + (crit ? 'crits' : 'hits');
  const events = stats.events ??= {};
  const entry = events[key] ??= {count:0,effective:0,overheal:0};
  entry.count++;
  entry.effective += effective;
  entry.overheal += overheal;
}
export function healingEventRows(stats) {
  return healingEventKinds.flatMap(kind => {
    const prefix = kind.periodic ? 'p_' : 'd_';
    const hits = stats.events?.[prefix+'hits']?.count ?? 0;
    const crits = stats.events?.[prefix+'crits']?.count ?? 0;
    if (!hits && !crits) return [];
    return [{...kind, ...(stats.events?.[kind.key] ?? {count:0,effective:0,overheal:0}),
      critPercent:100 * crits / (hits + crits)}];
  }).sort((a, b) => b.effective - a.effective);
}

// Keep aggregate meters canonical; report views never change fight totals or mana.
export function healingMeterEntries(meters, detailedSplit = false) {
  const parts = {regrowth: [['direct', 'direct'], ['hot', 'heal over time']],
    chain: [['0', 'direct'], ['1', 'bounce 1'], ['2', 'bounce 2']]};
  return Object.entries(meters).flatMap(([key, stats]) => {
    if (!detailedSplit || !parts[key] || !stats.components) return [{key, baseKey:key, stats, spellStats:stats}];
    return parts[key].flatMap(([part, label]) => {
      const component = stats.components[part];
      return component ? [{key:key + ':' + part, baseKey:key, label,
        stats:{...component, casts:stats.casts}, spellStats:stats}] : [];
    });
  }).sort((a, b) => b.stats.effective - a.stats.effective);
}
