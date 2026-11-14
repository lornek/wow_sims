import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
import {manaSourceProfile} from '../public/healing/mana-sources.mjs';
import {healingScore} from '../public/healing/healing-score.mjs';
const profile = {mana:10000, regen:100, mp5:50, castingRegen:.5, power:0, crit:0};
const encounter = {party:Array.from({length:5}, (_, i) => ({name:String(i), max:10000, dps:0})), health:1e9, swing:0, flurry:0, poisonTick:0, limit:1000};
const spell = (key, extra = {}) => ({key, name:key, cost:0, cast:0, gcd:0, cooldown:0, ...extra});
function pull(spells = {}, extra = {}) {
  const result = createPull({...profile, ...extra}, spells, encounter, () => .99);
  result.start();
  result.state.mana = 0;
  return result;
}
function close(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`); }
test('Spirit and MP5 share capped gains and freeze after combat', () => {
  const p = pull(); p.state.mana = 9990; p.step(1);
  close(p.state.manaGained, 10);
  close(p.state.manaSources['Spirit regeneration'], 100 / 11);
  close(p.state.manaSources['Mana / 5'], 10 / 11);
  p.state.phase = 'lost'; p.state.mana = 0; p.step(1);
  close(p.state.manaGained, 10);
});
test('Innervate credits only the increase above ordinary Spirit regen', () => {
  const p = pull({innervate:spell('innervate', {innervate:true, duration:20})});
  p.state.lastSpend = 0; p.cast('innervate', 4); p.step(2);
  close(p.state.manaSources['Spirit regeneration'], 100);
  close(p.state.manaSources.Innervate, 900);
  close(p.state.manaSources['Mana / 5'], 20);
  close(p.state.manaGained, p.state.mana);
});
test('Inner Focus separates saved cost and the full 6.5-second regeneration window', () => {
  const p = pull({focus:spell('focus', {activateBuff:'innerFocus'}), prayer:spell('prayer', {cost:1000}), greater:spell('greater', {cost:100, cast:2.5})});
  p.cast('focus', 4); p.cast('prayer', 0); p.step(4); p.cast('greater', 0); p.step(2.5);
  close(p.state.manaSources['Inner Focus · spell cost'], 1000);
  close(p.state.manaSources['Inner Focus · Spirit regeneration'], 325);
  p.step(1);
  close(p.state.manaSources['Inner Focus · Spirit regeneration'], 325);
});
test('Inner Focus does not claim regeneration already supplied by Innervate', () => {
  const p = pull({focus:spell('focus', {activateBuff:'innerFocus'}), prayer:spell('prayer', {cost:1000})});
  p.cast('focus', 4); p.cast('prayer', 0); p.state.innervateUntil = 20; p.step(2);
  assert.equal(p.state.manaSources['Inner Focus · Spirit regeneration'], undefined);
  close(p.state.manaGained - 1000, p.state.mana);
});
test('all mana returns have named sources', () => {
  const p = pull({spring:spell('spring', {party:true, waterTotem:true, period:2, duration:300, manaTick:10}), potion:spell('potion', {manaRange:[100,100]})}, {regen:0, mp5:0});
  p.cast('spring', 4); p.step(2); p.cast('potion', 4);
  close(p.state.manaSources.spring, 10); close(p.state.manaSources.potion, 100);
  close(p.state.manaGained, 110);
});
test('Spirit and MP5 drilldowns reconcile with profile totals including multipliers and rounding', () => {
  const result = manaSourceProfile(125, {spirit:100,mp5:30}, new Set(['mark','spirit','kings','wisdom','mageblood']), 340, {human:1.1});
  close(Object.values(result.spiritRates).reduce((a,b)=>a+b), 6.25 + 340 / 8);
  close(Object.values(result.mp5Sources).reduce((a,b)=>a+b), 82);
  assert.ok(result.spiritRates['Human racial'] > 0);
});
test('score is uncapped and rewards healing, efficiency and mana recovery', () => {
  const state = {party:[{}], time:10, survivalSeconds:10, survivors:1, healing:10000, overheal:0, manaGained:1000, phase:'won'};
  close(healingScore(state).total, 100000);
  assert.ok(healingScore({...state,manaGained:2000}).total > healingScore(state).total);
  assert.ok(healingScore({...state,overheal:1000}).total < healingScore(state).total);
});
test('Water Shield and Illumination returns are tracked independently', () => {
  // Water Shield uses its adapter key to set the charge duration.
  const q = pull({waterShield:spell('waterShield', {waterShield:true,duration:600}), heal:spell('heal', {cost:100,low:100,high:100,coefficient:0,multiplier:1,illumination:1,baseCost:100})}, {crit:1,regen:0,mp5:0});
  q.state.mana=1000; q.state.party[0].hp=9000;
  q.cast('waterShield', 4); q.cast('heal', 0);
  close(q.state.manaSources['Water Shield'], 200);
  close(q.state.manaSources.Illumination, 50);
  close(q.state.manaGained, 250);
});


test('score uses final survivors and excludes potion mana without changing restoration accounting', () => {
  const state={party:Array.from({length:5},()=>({hp:100})),survivors:3,healing:10000,overheal:2500,
    manaGained:3000,manaSources:{'Spirit regeneration':2000,'Major Mana Potion':1000},phase:'won'};
  const score=healingScore(state);
  close(score.manaGained,2000);close(score.efficiency,.8);close(score.survivalMultiplier,.6);
  close(score.total,96000);
  assert.equal(state.manaGained,3000);
  assert.equal(healingScore({...state,manaGained:4000,manaSources:{...state.manaSources,'Major Mana Potion':2000}}).total,score.total);
  assert.equal(healingScore({...state,survivors:5}).total,160000);
});
test('failed and unfinished runs do not receive a score',()=>{
  const state={party:[{hp:100}],healing:10000,overheal:0,manaGained:1000,manaSources:{}};
  for(const phase of ['ready','active','lost'])assert.equal(healingScore({...state,phase}).total,null);
});
