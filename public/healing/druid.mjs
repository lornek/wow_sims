import {mountHealing} from './healing-ui.mjs';
import {catalog, ranks} from './druid-data.mjs';
import {trees} from './druid-talents.mjs';
import {spellGroups} from './druid-book-groups.mjs';
import {loadouts, buffs, talents, defaultTalents, buildProfile, applyTalents} from './druid-profile.mjs';

for (const name of ['Swiftmend', 'Bloom', "Nature's Swiftness"]) {
  const talent = trees.flatMap(tree => tree.nodes).find(node => node.name === name);
  catalog[name] = {icon: talent.icon + '.jpg', ranks: [{rank: '', level: (talent.row - 1) * 5 + 10,
    details: 'Restoration talent', description: name === 'Swiftmend'
      ? 'Heals for the full duration value of your active Rejuvenation or Regrowth. The effect remains active.'
      : talent.description.join(' ')}]};
  spellGroups[name] = ['restoration'];
}

const slots = [
  ['regrowth', 'Regrowth', 'Left click'],
  ['touch', 'Healing Touch', 'Right click'],
  ['rejuvenation', 'Rejuvenation', 'Shift + Left'],
  ['poison', 'Abolish Poison', 'Shift + Right'],
  ['swiftmend', 'Swiftmend', 'Ctrl + Left'],
  ['rez', 'Rebirth', 'Ctrl + Right'],
  ['growth', 'Wild Growth', 'Alt + Left'],
  ['tranquility', 'Tranquility', 'Activate'],
  ['swiftness', "Nature's Swiftness", 'Activate'],
  ['innervate', 'Innervate', 'Activate'],
  ['potion', 'Major Mana Potion', 'Activate']
];
const utility = {
  tranquility: {party: true, channel: true},
  swiftness: {offGcd: true, swiftness: true},
  innervate: {innervate: true},
  potion: {offGcd: true, manaRange: [1350, 2250]}
};
function configureSpell(spell, row, tooltip, profile) {
  if (spell.key === 'swiftmend') return {...spell, cost: Math.floor(.2 * profile.baseMana), swiftmend: true, low: 0};
  if (spell.key === 'rez') return {...spell, combatRez: true, rez: row.effects[0]?.base ?? 0};
  if (spell.key === 'poison') return {...spell, abolishPoison: true};
  if (spell.key === 'growth') return {...spell, party: true, decay: true, periodicCrit: true};
  if (spell.key === 'rejuvenation') return {...spell, swiftmendable: true, periodicCrit: true};
  if (spell.key === 'regrowth') {
    const tick = row.effects.find(effect => effect.aura === 'A_PERIODIC_HEAL');
    if (tick) return {...spell, swiftmendable: true, periodicCrit: true,
      hot: {low: tick.base, high: tick.base, coefficient: tick.coefficient, period: tick.period}};
  }
  return spell;
}

mountHealing({
  className: 'druid', healer: 'Malfurion', healerColor: '#bd6520', catalog, ranks, spellGroups,
  loadouts, buffs, talents, applyTalents, buildProfile, trees, slots, utility, defaultTalents, configureSpell,
  schools: ['Restoration', 'Balance', 'Feral Combat'],
  schoolIcons: ['Rejuvenation', 'Wrath', 'Claw'],
  unlocks: ['swiftmend', 'growth', 'swiftness'],
  auras: [['regrowth', 'Regrowth'], ['rejuvenation', 'Rejuvenation'], ['growth', 'Wild Growth'],
    ['tranquility', 'Tranquility'], ['innervate', 'Innervate'], ['abolish', 'Abolish Poison']],
  healingKeys: ['touch', 'regrowth', 'rejuvenation', 'growth', 'tranquility'],
  extraMeters: [['bloom', 'Bloom']]
});
