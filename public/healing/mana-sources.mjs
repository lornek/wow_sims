// Attribute additive stats first, then multiplier increments. Allocate final rounding
// proportionally so the displayed source contributions sum to the actual stat.
export function manaSourceProfile(base, gear, buffs, spirit, {human = 1, talent = 1, talentName = 'Spirit talents'} = {}) {
  const parts = {'Base Spirit': base, 'Gear': gear.spirit ?? 0,
    'Mark of the Wild': buffs.has('mark') ? 16 : 0, 'Divine Spirit': buffs.has('spirit') ? 40 : 0};
  let total = Object.values(parts).reduce((a, b) => a + b, 0);
  for (const [name, multiplier] of [['Human racial', human], [talentName, talent], ['Blessing of Kings', buffs.has('kings') ? 1.1 : 1]]) {
    parts[name] = total * (multiplier - 1);
    total *= multiplier;
  }
  const coefficient = .125;
  const spiritRates = Object.fromEntries(Object.entries(parts).map(([key, value]) => [key, total ? value * spirit / total * coefficient : 0]));
  spiritRates['Base regeneration'] = 6.25;
  return {spiritRates, mp5Sources: {'Gear': gear.mp5 ?? 0, 'Blessing of Wisdom': buffs.has('wisdom') ? 40 : 0,
    'Mageblood Elixir': buffs.has('mageblood') ? 12 : 0}};
}
