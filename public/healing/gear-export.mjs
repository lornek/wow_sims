// A portable snapshot of the equipped items, including source IDs and enchants.
export function exportGearSet({className, name, preset, equipment, spec = null}) {
  return {format:'wow-forever-sims.gear-set', version:1, className, spec,
    name:name?.trim() || preset || 'Gear set', preset,
    equipment:JSON.parse(JSON.stringify(equipment ?? {}))};
}
