import {canEnchant} from './equipment.mjs';
// Reviewed endgame healer choices in the bundled Classic / Forever / SoD catalog.
// This only filters the picker: saved equipment still uses the full catalog.
const choices = new Set([
  'Enchant Shield - Critical Strike', 'Enchant Gloves - Minor Haste',
  'Enchant 2H Weapon - Grand Arcanist', 'Enchant Weapon - Grand Sorcerer',
  'Enchant Weapon - Insight', 'Enchant Weapon - Revelation', 'Enchant Chest - Absorption',
  'Enchant Boots - Speed', 'Enchant Cloak - Subtlety',
  "Syncretist's Sigil", "Vodouisant's Vigilant Embrace", 'Prophetic Aura', "Animist's Caress",
  'Zandalar Signet of Serenity', 'Resilience of the Scourge',
  'Enchant Necklace - Healing Power',
  'Enchant Cloak - Superior Defense',
  'Enchant Chest - Major Intellect', 'Enchant Chest - Major Stamina', 'Enchant Chest - Greater Stats',
  'Enchant Bracer - Healing Power', 'Enchant Bracer - Mana Regeneration',
  'Enchant Bracer - Superior Intellect', 'Enchant Bracer - Superior Spirit', 'Enchant Bracer - Superior Stamina',
  'Enchant Gloves - Healing Power', 'Enchant Boots - Spirit', 'Enchant Boots - Greater Stamina',
  'Mystic Rugged Armor Kit', 'Wild Leather Armor Kit',
  'Enchant Weapon - Healing Power', 'Enchant Weapon - Mighty Intellect', 'Enchant Weapon - Mighty Spirit',
  'Enchant 2H Weapon - Mighty Healing Power',
  'Enchant Shield - Law of Nature', 'Enchant Shield - Superior Spirit', 'Enchant Shield - Excellent Stamina',
  'Enchant Off-Hand - Superior Intellect', 'Enchant Off-Hand - Excellent Spirit', 'Enchant Off-Hand - Wisdom'
]);
const healerStats = ['power','intellect','spirit','mp5','mana','stamina','health','armor','crit','haste'];
export function healerEnchantChoices(enchants, item, className) {
  const compatible = enchants.filter(enchant => choices.has(enchant.name) && canEnchant(enchant,item,className));
  // Hide weaker variants when another compatible choice improves every relevant stat.
  return compatible.filter(enchant => !compatible.some(other => !enchant.effect && !other.effect && other !== enchant &&
    healerStats.every(stat => (other.stats[stat] ?? 0) >= (enchant.stats[stat] ?? 0)) &&
    healerStats.some(stat => (other.stats[stat] ?? 0) > (enchant.stats[stat] ?? 0))))
    .sort((a,b) => (b.stats.power ?? 0)-(a.stats.power ?? 0) || a.name.localeCompare(b.name));
}
