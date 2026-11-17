import {loadouts} from './druid-gear.mjs';
export {loadouts};
export {buffs} from './profile.mjs';

export const talents = [
  'Genesis', "Nature's Majesty", "Nature's Splendor", "Nature's Grace", "Nature's Focus",
  'Heart of the Wild', 'Naturalist', 'Reflection', 'Gift of Nature', 'Bloom', 'Tranquil Spirit',
  'Improved Rejuvenation', 'Living Spirit', 'Improved Tranquility', 'Improved Regrowth'
].map(name => [name, name]);

export const defaultTalents = {
  Genesis: 5, 'Improved Wrath': 3, "Nature's Majesty": 2, "Nature's Splendor": 1,
  "Nature's Focus": 5, 'Heart of the Wild': 5, Naturalist: 5, Reflection: 3,
  'Gift of Nature': 5, Bloom: 1, 'Tranquil Spirit': 2, 'Improved Rejuvenation': 3,
  Swiftmend: 1, "Nature's Swiftness": 1, 'Living Spirit': 3, 'Improved Regrowth': 5, 'Wild Growth': 1
};

export function buildProfile(loadout, buffs, bonus, talents = {}) {
  const gear = {};
  for (const item of Object.values(loadouts[loadout])) {
    for (const [key, value] of Object.entries(item.stats)) gear[key] = (gear[key] ?? 0) + value;
  }
  const stat = (key, base, multiplier = 1) => Math.floor((base + (gear[key] ?? 0) + (buffs.has('mark') ? 16 : 0)) * multiplier * (buffs.has('kings') ? 1.1 : 1));
  const intellect = stat('intellect', 100 + (buffs.has('intellect') ? 31 : 0), 1 + .02 * (talents['Heart of the Wild'] ?? 0));
  const livingSpirit = 1 + .05 * (talents['Living Spirit'] ?? 0);
  const spirit = stat('spirit', 110 + (buffs.has('spirit') ? 40 : 0), livingSpirit);
  const stamina = stat('stamina', 69);
  const gearPower = gear.power ?? 0;
  return {strength: stat('strength', 62), agility: stat('agility', 65), intellect, spirit, stamina,
    spiritPerRawPoint: livingSpirit * (buffs.has('kings') ? 1.1 : 1),
    health: 1483 + 10 * stamina, baseMana: 1244, mana: 1244 + 15 * intellect - 280 + (buffs.has('flask') ? 2000 : 0),
    crit: (1.8 + intellect * .0167 + (gear.crit ?? 0) + 2 * (talents["Nature's Majesty"] ?? 0)) / 100,
    castingRegen: [0, .17, .33, .50][talents.Reflection ?? 0],
    regen: 6.25 + spirit / 8, gearPower, power: gearPower + bonus,
    pushbackResist: .14 * (talents["Nature's Focus"] ?? 0), grace: !!talents["Nature's Grace"],
    bloom: talents.Bloom ? spirit * (1 + .02 * (talents['Gift of Nature'] ?? 0)) : 0,
    mp5: (gear.mp5 ?? 0) + (buffs.has('wisdom') ? 40 : 0) + (buffs.has('mageblood') ? 12 : 0)};
}

export function applyTalents(spell, talents) {
  const rank = name => talents[name] ?? 0;
  const touchOrWild = ['touch', 'growth'].includes(spell.key);
  const touchOrTranquility = ['touch', 'tranquility'].includes(spell.key);
  const splendor = rank("Nature's Splendor");
  const periodicMultiplier = (1 + .02 * rank('Genesis')) *
    (spell.key === 'rejuvenation' ? 1 + .05 * rank('Improved Rejuvenation') : 1);
  return {...spell,
    cast: touchOrWild ? spell.cast - .1 * rank('Naturalist') : spell.cast,
    cost: touchOrTranquility ? Math.round(spell.cost * (1 - .02 * rank('Tranquil Spirit'))) : spell.cost,
    cooldown: spell.key === 'tranquility' ? spell.cooldown * (1 - .3 * rank('Improved Tranquility')) : spell.cooldown,
    duration: spell.duration + (spell.key === 'rejuvenation' ? 3 * splendor : spell.key === 'regrowth' ? 6 * splendor : 0),
    multiplier: (1 + .02 * rank('Gift of Nature')) * (spell.period ? periodicMultiplier : 1),
    hot: spell.hot && {...spell.hot, multiplier: (1 + .02 * rank('Gift of Nature')) * periodicMultiplier},
    periodicMultiplier,
    bonusCrit: spell.key === 'regrowth' ? .10 * rank('Improved Regrowth') : 0
  };
}
