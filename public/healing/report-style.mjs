// Stable semantic identities: never assign report visuals by rank or render order.
export const manaVisuals = {
  'Spirit regeneration': ['report-icons/spirit.jpg', '#168f91'],
  'Mana / 5': ['report-icons/mp5.jpg', '#225c9a'],
  'Innervate': ['icons/spell_nature_lightning.jpg', '#3375b2'],
  'Inner Focus · spell cost': ['icons/spell_frost_windwalkon.jpg', '#51458f'],
  'Inner Focus · Spirit regeneration': ['icons/spell_frost_windwalkon.jpg', '#4265a4'],
  'Water Shield': ['icons/ability_shaman_watershield.jpg', '#258dba'],
  'Illumination': ['icons/spell_holy_greaterheal.jpg', '#4b58a3'],
  'Litany': ['icons/inv_scroll_07.jpg', '#397caf'],
  'Lay on Hands': ['icons/spell_holy_layonhands.jpg', '#3d4695'],
  'Mana Spring Totem': ['icons/spell_nature_manaregentotem.jpg', '#197c99'],
  'Mana Tide Totem': ['icons/spell_frost_summonwaterelemental.jpg', '#3155a0'],
  'Major Mana Potion': ['icons/inv_potion_76.jpg', '#59479b']
};
export const contributionIcons = {
  'Base Spirit': 'report-icons/spirit.jpg',
  'Base regeneration': 'report-icons/gained.jpg',
  'Gear': 'report-icons/efficiency.jpg',
  'Human racial': 'report-icons/survived.jpg',
  'Spirit talents': 'report-icons/spirit.jpg',
  'Living Spirit': 'icons/spell_nature_giftofthewaterspirit.jpg',
  'Mark of the Wild': 'icons/spell_nature_regeneration.jpg',
  'Divine Spirit': 'icons/spell_holy_divinespirit.jpg',
  'Blessing of Kings': 'icons/spell_magic_magearmor.jpg',
  'Blessing of Wisdom': 'icons/spell_holy_sealofwisdom.jpg',
  'Mageblood Elixir': 'icons/inv_potion_45.jpg'
};
const contributionOffsets = {
  'Base Spirit': [0, 0, 0], 'Base regeneration': [-4, -8, -5], Gear: [4, -6, 3],
  'Human racial': [-6, 3, -3], 'Spirit talents': [5, -4, -2], 'Living Spirit': [5, 3, -3],
  'Mark of the Wild': [-5, -3, 4], 'Divine Spirit': [3, 5, -1],
  'Blessing of Kings': [-3, 2, 2], 'Blessing of Wisdom': [4, 3, 2], 'Mageblood Elixir': [-5, -4, 4]
};
export function contributionColor(parent, name) {
  const [h, s, l] = parent === 'Spirit regeneration' ? [181, 73, 33] : [211, 64, 37];
  const [dh, ds, dl] = contributionOffsets[name] ?? [0, 0, 0];
  return `hsl(${h + dh} ${s + ds}% ${l + dl}%)`;
}
export const healingColors = {
  wave: '#648c27', lesser: '#4d962d', chain: '#258451', riptide: '#187b60', stream: '#285c42',
  touch: '#718b26', regrowth: '#488837', rejuvenation: '#268353', growth: '#286446', swiftmend: '#57912d', tranquility: '#1f6c4d',
  holyLight: '#728b25', flash: '#4f9135', shock: '#26864e', beacon: '#196750',
  shield: '#758c25', renew: '#458f38', penance: '#28824f', prayer: '#1d7054',
  greater: '#648c27', heal: '#5b9130', nova: '#3d8b47', desperate: '#287552', hands: '#326543', aegis: '#225e46',
  mending: '#285c42', bloom: '#3b7948', vigil: '#316c4c'
};
export function reportManaVisual(name) {
  return manaVisuals[name] ?? ['report-icons/gained.jpg', '#3d669e'];
}
