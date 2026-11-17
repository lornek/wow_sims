import {buffs} from './profile.mjs';
export {buffs};

const base = {
  paladin: {strength:105, agility:65, intellect:70, spirit:75, stamina:100, health:1381, mana:1512, crit:3.5, critPerInt:.0167},
  priest: {strength:35, agility:40, intellect:120, spirit:125, stamina:50, health:1397, mana:1376, crit:.8, critPerInt:.0168}
};

export function humanProfile(className, loadouts) {
  const naked = base[className];
  return (loadout, buffs, customHealing, talents = {}) => {
    const rank = name => talents[name] ?? 0;
    const gear = {};
    for (const item of Object.values(loadouts[loadout])) {
      for (const [stat, value] of Object.entries(item.stats)) gear[stat] = (gear[stat] ?? 0) + value;
    }
    const kings = buffs.has('kings') ? 1.1 : 1;
    const stat = (key, extra = 0, multiplier = 1) => Math.floor((naked[key] + (gear[key] ?? 0) + extra + (buffs.has('mark') ? 16 : 0)) * multiplier * kings);
    const intellect = stat('intellect', buffs.has('intellect') ? 31 : 0, 1 + .02 * (rank('Mental Strength') + rank('Divine Intellect')));
    const spirit = stat('spirit', buffs.has('spirit') ? 40 : 0, 1.1);
    const stamina = stat('stamina');
    const gearPower = gear.power ?? 0;
    const talentPower = spirit * .05 * rank('Spiritual Guidance');
    const spiritRegenCoefficient = .125;
    return {strength: stat('strength', 0, 1 + .02 * rank('Divine Strength')), agility: stat('agility'), intellect, spirit, stamina,
      health: naked.health + 10 * (stamina - 20), baseMana: naked.mana,
      mana: naked.mana + 15 * intellect - 280 + (buffs.has('flask') ? 2000 : 0),
      crit: (naked.crit + 1 + intellect * naked.critPerInt + (gear.crit ?? 0) + rank('Holy Specialization') + 2 * rank('Conviction')) / 100,
      critHealingBonus: .05 * rank('Holy Power'),
      spiritPerRawPoint: 1.1 * kings, spiritRegenCoefficient,
      regen: 6.25 + spirit * spiritRegenCoefficient,
      castingRegen: className === 'priest' ? [0, .17, .33, .50][rank('Meditation')] : .15 * rank('Reverence'),
      pushbackResist: className === 'priest' ? [0, .23, .46, .70][rank('Twilight Focus')] : .14 * rank('Spiritual Focus'),
      aegis: .05 * rank('Divine Aegis'),
      inspiration: [0,.08,.16,.25][rank('Inspiration')],
      gearPower, talentPower, power: gearPower + talentPower + customHealing,
      mp5: (gear.mp5 ?? 0) + (buffs.has('wisdom') ? 40 : 0) + (buffs.has('mageblood') ? 12 : 0)};
  };
}

export function describeTalentSpells(catalog, trees, schools) {
  const groups = {};
  for (const tree of trees) {
    for (const node of tree.nodes) {
      groups[node.name] = [tree.slug];
      if (!catalog[node.name]) catalog[node.name] = {icon: node.icon + '.jpg', ranks: [{
        rank:'', level: 10 + (node.row - 1) * 5, details: tree.name + ' talent', description: node.description[0] ?? node.name
      }]};
    }
  }
  for (const [school, names] of Object.entries(schools)) {
    for (const name of names) groups[name] = [school];
  }
  for (const name of Object.keys(catalog)) groups[name] ??= [Object.keys(schools)[0]];
  return groups;
}
