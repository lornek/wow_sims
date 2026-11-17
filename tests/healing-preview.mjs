import test from 'node:test';
import assert from 'node:assert/strict';
import {healingRange, swiftmendRange, periodicHealingPreview, periodicHealingScaling} from '../public/healing/healing-preview.mjs';
import {applyTalents} from '../public/healing/druid-profile.mjs';

test('final healing includes power and talent multipliers before engine rounding', () => {
  assert.deepEqual(healingRange({low:100, high:150, coefficient:.5, multiplier:1.1}, 200), [220, 275]);
});

test('Swiftmend uses the complete unrounded HoT rather than rounded individual ticks', () => {
  const source = {duration:12, period:3, low:10, coefficient:.125, multiplier:1.1};
  assert.deepEqual(swiftmendRange(source, 13), [51, 51]);
});

test('Swiftmend Regrowth uses only its periodic heal and talent-extended duration', () => {
  const regrowth = applyTalents({key:'regrowth', low:500, high:600, duration:21,
    hot:{low:50, high:50, period:3, coefficient:.1}},
    {"Nature's Splendor":1, 'Gift of Nature':5, Genesis:5});
  assert.equal(regrowth.duration, 27);
  assert.deepEqual(swiftmendRange(regrowth, 200), [762, 762]);
});

test('Swiftmend Rejuvenation includes its own talents and selected rank amounts', () => {
  const rejuv = applyTalents({key:'rejuvenation', low:100, high:100, duration:12, period:3, coefficient:.2},
    {"Nature's Splendor":1, 'Gift of Nature':5, Genesis:5, 'Improved Rejuvenation':3});
  assert.equal(rejuv.duration, 15);
  assert.deepEqual(swiftmendRange(rejuv, 200), [974, 974]);
});


test('HoT tooltip totals and ticks use the requested two-row values',()=>{
  const preview=periodicHealingPreview({low:300,high:300,coefficient:0,multiplier:1,period:3,duration:21},0);
  assert.deepEqual(preview,{duration:21,ticks:7,total:[2100,2100],first:[300,300],last:[300,300]});
});
test('channel preview includes its immediate tick and hybrid preview excludes the direct heal',()=>{
  assert.equal(periodicHealingPreview({low:100,coefficient:0,multiplier:1,period:1,duration:2,immediateTick:true},0).ticks,3);
  const preview=periodicHealingPreview({low:1000,duration:21,hot:{low:40,coefficient:.1,multiplier:1.1,period:3}},100);
  assert.deepEqual(preview.total,[385,385]);
  assert.equal(preview.ticks,7);
});
test('decaying HoT preview displays first and last tick values',()=>{
  const preview=periodicHealingPreview({low:100,coefficient:0,multiplier:1,period:1,duration:7,decay:true},0);
  assert.deepEqual(preview.first,[130,130]);assert.deepEqual(preview.last,[70,70]);assert.deepEqual(preview.total,[700,700]);
});


test('full-duration HoT scaling grows with talent-added ticks independently of healing multipliers',()=>{
  const source={key:'regrowth',duration:21,hot:{low:10,coefficient:1/7,period:3}};
  assert.equal(periodicHealingScaling(source),1);
  const extended=applyTalents(source,{"Nature's Splendor":1,'Gift of Nature':5,Genesis:5});
  assert.equal((periodicHealingScaling(extended)*100).toFixed(2),'128.57');
  assert.equal(extended.hot.multiplier,1.1*1.1);
});
test('channel scaling includes immediate ticks and does not count party targets',()=>{
  assert.equal(periodicHealingScaling({duration:2,period:1,immediateTick:true,coefficient:.2,party:true}).toFixed(2),'0.60');
});
