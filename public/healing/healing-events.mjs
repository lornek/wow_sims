export const healingEventKinds = [
  {key:'d_hits', label:'Direct hits', icon:'healing', periodic:false, crit:false},
  {key:'d_crits', label:'Direct crits', icon:'crit', periodic:false, crit:true},
  {key:'p_hits', label:'Periodic hits', icon:'hps', periodic:true, crit:false},
  {key:'p_crits', label:'Periodic crits', icon:'crit', badge:'hps', periodic:true, crit:true}
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
  });
}
