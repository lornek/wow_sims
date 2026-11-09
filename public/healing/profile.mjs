export const naked = {strength: 87, agility: 51, stamina: 98, intellect: 89, spirit: 99, baseMana: 1520};

// Aggregate scenario inputs, independent of individual items and set bonuses.
export const loadouts = {
  'Ungeared': {},
  'Fresh 60': {stamina: 45, intellect: 60, spirit: 35, power: 150, mp5: 8, crit: .01},
  'Level 60 dungeon': {stamina: 70, intellect: 95, spirit: 50, power: 300, mp5: 20, crit: .02},
  'Tier 1 raid': {stamina: 95, intellect: 120, spirit: 65, power: 440, mp5: 34, crit: .03},
  'Tier 2 raid': {stamina: 125, intellect: 150, spirit: 80, power: 600, mp5: 48, crit: .04}
};
export const buffs = [
  ['wisdom', 'Blessing of Wisdom', '+40 mana / 5 sec'],
  ['spirit', 'Divine Spirit', '+40 Spirit'],
  ['kings', 'Blessing of Kings', '+10% attributes'],
  ['intellect', 'Arcane Intellect', '+31 Intellect'],
  ['flask', 'Flask of Distilled Wisdom', '+2,000 mana'],
  ['mageblood', 'Mageblood Elixir', '+12 mana / 5 sec'],
  ['potion', 'Major Mana Potion', '1,350–2,250 mana on use']
];

export function buildProfile(loadout, enabled, bonusHealing) {
  const gear = loadouts[loadout];
  const stat = (key, extra = 0) => Math.floor((naked[key] + (gear[key] ?? 0) + extra) * (enabled.has('kings') ? 1.1 : 1));
  const intellect = stat('intellect', enabled.has('intellect') ? 31 : 0);
  const spirit = stat('spirit', enabled.has('spirit') ? 40 : 0);
  const stamina = stat('stamina');
  return {strength: stat('strength'), agility: stat('agility'), stamina, intellect, spirit,
    baseMana: naked.baseMana, health: 1280 + 10 * stamina,
    mana: naked.baseMana + 15 * intellect - 280 + (enabled.has('flask') ? 2000 : 0),
    crit: (2.3 + intellect * .0169) / 100 + (gear.crit ?? 0),
    regen: 6.25 + spirit / 8, power: (gear.power ?? 0) + bonusHealing,
    mp5: (gear.mp5 ?? 0) + (enabled.has('wisdom') ? 40 : 0) + (enabled.has('mageblood') ? 12 : 0)};
}
