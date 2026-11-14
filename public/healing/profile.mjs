import {manaSourceProfile} from './mana-sources.mjs';
import {equipmentSets} from './gear.mjs';

export const naked = {strength: 87, agility: 51, stamina: 98, intellect: 89, spirit: 99, baseMana: 1520};
export const loadouts = equipmentSets;
export const buffs = [
  ['mark', 'Mark of the Wild', '+16 to all attributes', 'spell_nature_regeneration'],
  ['wisdom', 'Blessing of Wisdom', '+40 mana / 5 sec', 'spell_holy_sealofwisdom'],
  ['spirit', 'Divine Spirit', '+40 Spirit', 'spell_holy_divinespirit'],
  ['kings', 'Blessing of Kings', '+10% attributes', 'spell_magic_magearmor'],
  ['intellect', 'Arcane Intellect', '+31 Intellect', 'spell_holy_magicalsentry'],
  ['flask', 'Flask of Distilled Wisdom', '+2,000 mana', 'inv_potion_97'],
  ['mageblood', 'Mageblood Elixir', '+12 mana / 5 sec', 'inv_potion_45'],
  ['potion', 'Major Mana Potion', '1,350–2,250 mana on use', 'inv_potion_76']
];

export const talents = [
  ['thundering', 'Thundering Strikes', 5, '+1 percentage point of spell crit per rank'],
  ['ancestral', 'Ancestral Knowledge', 5, '+2% Intellect per rank'],
  ['wave', 'Improved Healing Wave', 5, '−0.1 sec cast time per rank'],
  ['pushback', 'Healing Focus', 3, '23% / 46% / 70% chance to resist healing cast pushback'],
  ['focus', 'Tidal Focus', 5, '−1% mana cost per rank for direct heals and Riptide'],
  ['mindfulness', 'Mindfulness', 3, '17% / 33% / 50% Spirit regeneration inside the five-second rule'],
  ['totemic', 'Totemic Focus', 5, '−5% mana cost per rank for totems'],
  ['crit', 'Tidal Mastery', 5, '+1 percentage point of healing crit per rank'],
  ['stream', 'Restorative Totems', 5, '+10% Healing Stream healing per rank'],
  ['way', 'Healing Way', 3, '+8% / 17% / 25% Healing Wave healing'],
  ['purification', 'Purification', 5, '+2% healing per rank for direct heals and Riptide']
];

export function applyTalents(spell, points) {
  const direct = ['wave', 'lesser', 'chain', 'riptide'].includes(spell.key);
  const totem = ['stream', 'tide', 'spring'].includes(spell.key);
  const multiplier = (direct ? 1 + .02 * points.purification : 1) *
    (spell.key === 'wave' ? [1, 1.08, 1.17, 1.25][points.way] : 1) *
    (spell.key === 'stream' ? 1 + .10 * points.stream : 1);
  return {...spell,
    cast: spell.key === 'wave' ? Math.round((spell.cast - .1 * points.wave) * 100) / 100 : spell.cast,
    cost: Math.round(spell.cost * (direct ? 1 - .01 * points.focus : totem ? 1 - .05 * points.totemic : 1)),
    multiplier};
}

export function buildProfile(loadout, enabled, bonusHealing, points = {}) {
  const gear = {};
  for (const item of Object.values(loadouts[loadout])) {
    for (const [key, value] of Object.entries(item.stats)) gear[key] = (gear[key] ?? 0) + value;
  }
  const stat = (key, extra = 0, multiplier = 1) => Math.floor((naked[key] + (gear[key] ?? 0) + extra + (enabled.has('mark') ? 16 : 0)) * multiplier * (enabled.has('kings') ? 1.1 : 1));
  const intellect = stat('intellect', enabled.has('intellect') ? 31 : 0, 1 + .02 * (points.ancestral ?? 0));
  const spirit = stat('spirit', enabled.has('spirit') ? 40 : 0);
  const stamina = stat('stamina');
  return {...manaSourceProfile(naked.spirit, gear, enabled, spirit), strength: stat('strength'), agility: stat('agility'), stamina, intellect, spirit,
    spiritPerRawPoint: enabled.has('kings') ? 1.1 : 1,
    baseMana: naked.baseMana, health: 1280 + 10 * stamina,
    mana: naked.baseMana + 15 * intellect - 280 + (enabled.has('flask') ? 2000 : 0),
    crit: (2.3 + intellect * .0169 + (gear.crit ?? 0) + (points.crit ?? 0) + (points.thundering ?? 0)) / 100,
    castingRegen: [0, .17, .33, .50][points.mindfulness ?? 0],
    pushbackResist: [0, .23, .46, .70][points.pushback ?? 0],
    regen: 6.25 + spirit / 8, gearPower: gear.power ?? 0, power: (gear.power ?? 0) + bonusHealing,
    mp5: (gear.mp5 ?? 0) + (enabled.has('wisdom') ? 40 : 0) + (enabled.has('mageblood') ? 12 : 0)};
}
