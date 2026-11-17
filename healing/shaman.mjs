import {spellGroups} from './book-groups.mjs';
import {catalog, ranks} from './shaman-data.mjs';
import {loadouts, buffs, talents, applyTalents, buildProfile} from './profile.mjs';
import {trees} from './talent-data.mjs';

catalog['Water Shield'] = {icon:'ability_shaman_watershield.jpg', ranks:[{rank:'', level:20, details:'Instant',
  description:'Three charges. A hit or critical heal restores 2% maximum mana, at most once every 3.5 seconds.'}]};
spellGroups['Water Shield'] = ['restoration'];

const slots = [
  ['lesser', 'Lesser Healing Wave', 'Left click'],
  ['wave', 'Healing Wave', 'Right click'],
  ['riptide', 'Riptide', 'Shift + Left'],
  ['poison', 'Cure Poison', 'Shift + Right'],
  ['chain', 'Chain Heal', 'Ctrl + Left'],
  ['stream', 'Healing Stream Totem', 'Alt + Left'],
  ['swiftness', "Nature's Swiftness", 'Activate'],
  ['tide', 'Mana Tide Totem', 'Activate'],
  ['waterShield', 'Water Shield', 'Activate'],
  ['potion', 'Major Mana Potion', 'Activate']
];
const utility = {
  stream: {self:true},
  waterShield: {waterShield:true},
  swiftness: {offGcd: true, swiftness: true},
  tide: {party: true, waterTotem: true, period: 3, duration: 12, manaTick: 290},
  potion: {offGcd: true, manaRange: [1350, 2250]}
};

const defaultTalents = {
  'Thundering Strikes': 5, 'Ancestral Knowledge': 5,
  'Improved Healing Wave': 5, 'Tidal Focus': 5, Mindfulness: 3, 'Natural Grace': 3,
  'Healing Focus': 3, 'Water Shield': 1, 'Tidal Mastery': 5, 'Restorative Totems': 5,
  'Mana Tide Totem': 1, 'Healing Way': 3, "Nature's Swiftness": 1, Purification: 5, Riptide: 1
};

export default {
  className: 'shaman', healer: 'Thrall', healerColor: '#2868cc', catalog, ranks: ranks.filter(row => row.name !== 'Water Shield' || row.id === 408510), spellGroups,
  loadouts, buffs, talents, applyTalents, buildProfile, trees, slots, utility, defaultTalents,
  schools: ['Enhancement', 'Restoration', 'Elemental Combat'],
  schoolIcons: ['Lightning Shield', 'Healing Wave', 'Lightning Bolt'],
  unlocks: ['riptide', 'swiftness', 'tide', 'waterShield'],
  configureSpell: spell => spell.key === 'riptide' ? {...spell, periodicCrit: true} : spell,
  auras: [['riptide', 'Riptide'], ['stream', 'Healing Stream Totem'], ['tide', 'Mana Tide Totem']],
  healingKeys: ['wave', 'lesser', 'chain', 'riptide', 'stream']
};
