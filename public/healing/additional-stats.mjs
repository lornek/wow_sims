export const additionalStatKeys = ['power', 'intellect', 'spirit', 'mp5'];
export function normalizeAdditionalStats(input = {}) {
  if (typeof input === 'number') input = {power:input}; // saved pre-expansion +healing
  return Object.fromEntries(additionalStatKeys.map(key => {
    const value = Number(input?.[key] ?? 0);
    return [key, Number.isFinite(value) ? Math.max(0,Math.min(5000,Math.floor(value))) : 0];
  }));
}
// Adds raw stats to the gear bucket, before attribute multipliers and dependencies.
export function addAdditionalStats(gear, input) {
  for (const [key,value] of Object.entries(normalizeAdditionalStats(input))) gear[key] = (gear[key] ?? 0) + value;
}
// Percentage points per final Intellect at level 60 (Forever PlayerExpectedStat).
export const spellCritPercentPerIntellect = {druid:.0167,paladin:.0167,priest:.0168,shaman:.0169};
