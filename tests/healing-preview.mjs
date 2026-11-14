import test from 'node:test';
import assert from 'node:assert/strict';
import {healingRange, swiftmendRange} from '../public/healing/healing-preview.mjs';
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
