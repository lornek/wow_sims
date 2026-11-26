import {purposeIconPath} from './purpose-icons.mjs';
export const enchantIconPurposes = {
  7941:'enchant-grand-arcanist',7942:'enchant-grand-sorcerer',8216:'enchant-insight',
  8217:'enchant-revelation',8220:'enchant-absorption',7664:'enchant-critical-strike',
  931:'enchant-casting-haste',8737:'enchant-speed',2621:'enchant-subtlety'
};
export function enchantIconPath(enchant) {
  if (typeof enchant?.id !== 'string' || !enchant.id.includes(':')) return null;
  const purpose = enchantIconPurposes[enchant.id.split(':')[0]];
  return purpose ? purposeIconPath(purpose) : null;
}
