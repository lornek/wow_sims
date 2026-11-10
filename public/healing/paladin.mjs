import {mountHealing} from './healing-ui.mjs';
import {catalog, ranks} from './paladin-data.mjs';
import {trees} from './paladin-talents.mjs';
import {loadouts} from './paladin-gear.mjs';
import {buffs, humanProfile, describeTalentSpells} from './human-healer.mjs';

const slots = [
  ['flash', 'Flash of Light', 'Left click'], ['holyLight', 'Holy Light', 'Right click'],
  ['shock', 'Holy Shock', 'Shift + Left'], ['poison', 'Cleanse', 'Shift + Right'],
  ['vigil', "Light's Vigil", 'Ctrl + Left'],
  ['oath', 'Oath of Light', 'Alt + Left'], ['hands', 'Lay on Hands', 'Select target'],
  ['favor', 'Divine Favor', 'Activate'], ['potion', 'Major Mana Potion', 'Activate']
];
const utility = {favor: {offGcd:true, activateBuff:'divineFavor'}, potion:{offGcd:true,manaRange:[1350,2250]}};
const defaultTalents = {'Spiritual Focus':5,'Healing Light':3,Reverence:2,'Purifying Power':1,'Divine Favor':1,
  Illumination:5,'Divine Precision':2,'Infusion of Light':2,'Oath of Light':1,'Holy Shock':1,
  'Boundless Light':2,'Holy Power':5,"Light's Vigil":1,
  'Divine Intellect':5,'Sacred Duty':2,"Guardian's Favor":1,
  Deflection:2,Benediction:5,'Improved Judgement':2,Conviction:3};

const spellGroups = describeTalentSpells(catalog, trees, {holy:slots.map(([, name]) => name),
  protection:['Devotion Aura','Divine Shield','Blessing of Protection'],retribution:['Seal of Command','Retribution Aura','Holy Strike']});
const castRanks = ranks.filter(row => !['Holy Shock',"Light's Vigil"].includes(row.name) || row.gcd > 0);
function configureSpell(spell, row, tip) {
  if (spell.key === 'shock') {
    const range = tip.description.match(/or (\d+) to (\d+) healing/);
    return {...spell, low:Number(range?.[1] ?? spell.low), high:Number(range?.[2] ?? spell.high), coefficient:.429};
  }
  if (spell.key === 'vigil') return {...spell, mark:'vigil', duration:30, coefficient:.143, party:true};
  if (spell.key === 'oath') return {...spell, mark:'oath'};
  if (spell.key === 'hands') return {...spell, layOnHands:row.effects.find(effect => effect.type === 'E_ENERGIZE')?.base};
  return spell;
}
function applyTalents(spell, points) {
  const rank = name => points[name] ?? 0;
  const oathBonus = {holyLight:400, flash:115, shock:230}[spell.key];
  return {...spell, multiplier:oathBonus ? 1 + .04 * rank('Healing Light') : 1,
    baseCost:spell.cost, cost:spell.key === 'poison' ? Math.round(spell.cost * (1 - .10 * rank('Purifying Power'))) : spell.cost,
    oathBonus, favor:!!oathBonus, boundless:spell.key === 'shock' ? .15 * rank('Boundless Light') : 0,
    illumination:oathBonus ? .2 * rank('Illumination') : 0,
    infusion:rank('Infusion of Light') && ['shock','flash'].includes(spell.key),
    infusionReduction:.5 * rank('Infusion of Light')};
}
mountHealing({className:'paladin',healer:'Uther',healerColor:'#d86da3',catalog,ranks:castRanks,spellGroups,loadouts,buffs,
  talents:trees.flatMap(t => t.nodes.map(n => [n.name,n.name])), defaultTalents, applyTalents, configureSpell,
  buildProfile:humanProfile('paladin',loadouts), trees, slots, utility, schools:['Holy','Protection','Retribution'],
  schoolIcons:['Holy Light','Devotion Aura','Seal of Command'],unlocks:['shock','vigil','oath','favor'],
  auras:[['oath','Oath of Light'],['vigil',"Light's Vigil"],['divineFavor','Divine Favor']],
  healingKeys:['flash','holyLight','shock','vigil']});
