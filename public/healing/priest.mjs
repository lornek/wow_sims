import {mountHealing} from './healing-ui.mjs';
import {catalog, ranks} from './priest-data.mjs';
import {trees} from './priest-talents.mjs';
import {loadouts} from './priest-gear.mjs';
import {buffs, humanProfile, describeTalentSpells} from './human-healer.mjs';

const slots = [
  ['flash','Flash Heal','Left click'],['greater','Greater Heal','Right click'],
  ['renew','Renew','Shift + Left'],['poison','Abolish Disease','Shift + Right'],
  ['shield','Power Word: Shield','Ctrl + Left'],
  ['prayer','Prayer of Healing','Alt + Left'],['penance','Penance','Ctrl + Right'],
  ['mending','Prayer of Mending','Ctrl + Right'],['heal','Heal','Select target'],
  ['nova','Holy Nova','Activate'],['desperate','Desperate Prayer','Activate'],
  ['focus','Inner Focus','Activate'],['pi','Power Infusion','Activate'],['potion','Major Mana Potion','Activate']
];
const common = {'Twin Disciplines':5,'Mental Strength':5,'Mental Agility':3,'Inner Focus':1,'Improved Power Word: Shield':3,Meditation:3};
const presets = {
  Discipline:{...common,'Soul Warding':1,Penance:1,'Renewed Hope':5,'Divine Aegis':3,'Power Infusion':1,
    'Twilight Focus':3,'Improved Renew':3,'Holy Specialization':5,'Divine Fury':5,'Improved Healing':3,'Holy Nova':1},
  Holy:{...common,'Twilight Focus':3,'Improved Renew':3,'Holy Specialization':5,'Divine Fury':5,'Improved Healing':2,'Holy Nova':1,
    'Holy Binding':1,'Litany of Light':2,'Spirit of Redemption':1,'Spiritual Guidance':4,'Spiritual Healing':3,'Prayer of Mending':1}
};
const utility = {prayer:{self:true},nova:{self:true},desperate:{self:true},focus:{offGcd:true,activateBuff:'innerFocus'},pi:{offGcd:true,activateBuff:'powerInfusion'},
  potion:{offGcd:true,manaRange:[1350,2250]}};
const spellGroups = describeTalentSpells(catalog,trees,{holy:slots.map(([,name]) => name),
  discipline:['Power Word: Shield','Power Word: Fortitude','Penance','Power Infusion','Inner Focus','Divine Spirit'],
  shadow:['Shadow Word: Pain','Shadow Word: Death','Mind Blast','Devouring Plague']});
catalog['Weakened Soul'] = {icon:'spell_holy_powerwordshield.jpg', ranks:[]};
const castRanks = ranks.filter(row => !['Penance','Prayer of Mending','Holy Nova'].includes(row.name) || row.gcd > 0);
function configureSpell(spell,row) {
  if (spell.key === 'shield') {
    const absorb = row.effects.find(effect => effect.aura === 'A_SCHOOL_ABSORB');
    return {...spell, shield:absorb.base, coefficient:absorb.coefficient};
  }
  if (spell.key === 'penance') return {...spell, period:1,duration:2,channel:true,immediateTick:true,periodicCrit:true};
  if (spell.key === 'renew') return {...spell,periodicCrit:true};
  if (spell.key === 'prayer' || spell.key === 'nova') return {...spell,party:true};
  if (spell.key === 'mending') {
    const effect = row.effects[0];
    return {...spell,mending:true,low:effect.base,high:effect.base,coefficient:effect.coefficient};
  }
  return spell;
}
function applyTalents(spell, points) {
  const rank = name => points[name] ?? 0;
  const normalHeal = ['flash','greater','heal','renew','prayer','penance','mending','nova','desperate'].includes(spell.key);
  const direct = ['flash','greater','heal','penance'].includes(spell.key);
  const instant = !spell.cast && !spell.channel;
  const costMod = (instant ? 1 - [0,.04,.07,.10][rank('Mental Agility')] : 1) *
    (['heal','greater','penance','mending'].includes(spell.key) ? 1 - .05 * rank('Improved Healing') : 1) *
    (spell.shield && rank('Soul Warding') ? .85 : 1);
  return {...spell,baseCost:spell.cost,cost:Math.round(spell.cost * costMod),
    cooldown:Math.max(0,spell.cooldown - (spell.shield && rank('Soul Warding') ? 4 : 0)),
    cast:['heal','greater'].includes(spell.key) ? spell.cast - .1 * rank('Divine Fury') : spell.cast,
    multiplier:spell.shield ? 1 + [0,.07,.14,.20][rank('Improved Power Word: Shield')] : normalHeal ?
      (1 + [0,.03,.06,.10][rank('Spiritual Healing')]) * (instant ? 1 + .01 * rank('Twin Disciplines') : 1) *
      (spell.key === 'renew' ? 1 + .05 * rank('Improved Renew') : 1) : 1,
    litany:normalHeal ? .05 * rank('Litany of Light') : 0, renewedHope:direct ? rank('Renewed Hope') : 0,
    selfCopy:spell.key === 'flash' && rank('Holy Binding') ? .5 : 0};
}
mountHealing({className:'priest',healer:'Anduin',healerColor:'#d2d7e8',catalog,ranks:castRanks,spellGroups,loadouts,buffs,
  talents:trees.flatMap(t => t.nodes.map(n => [n.name,n.name])),defaultTalents:presets.Discipline,presets,applyTalents,configureSpell,
  buildProfile:humanProfile('priest',loadouts),trees,slots,utility,schools:['Holy','Discipline','Shadow'],
  schoolIcons:['Renew','Power Word: Shield','Shadow Word: Pain'],unlocks:['penance','mending','focus','nova','pi'],
  auras:[['renew','Renew'],['shield','Power Word: Shield'],['weakened','Weakened Soul'],['aegis','Divine Aegis'],
    ['mending','Prayer of Mending'],['powerInfusion','Power Infusion'],['innerFocus','Inner Focus'],['inspiration','Inspiration']],
  healingKeys:['flash','greater','heal','renew','prayer','penance','mending','nova','desperate'],
  extraMeters:[['aegis','Divine Aegis']],hazard:'disease'});
