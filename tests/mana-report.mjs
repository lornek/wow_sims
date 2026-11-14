import test from 'node:test';
import assert from 'node:assert/strict';
import {manaReportSources, spiritContribution} from '../public/healing/mana-report.mjs';

test('Innervate joins Spirit without changing total mana or sorting the two segments', () => {
  const sources = {'Mana / 5': 300, Innervate: 800, 'Spirit regeneration': 200};
  assert.deepEqual(manaReportSources(sources), [['Spirit regeneration', 1000], ['Mana / 5', 300]]);
  assert.deepEqual(sources, {'Mana / 5': 300, Innervate: 800, 'Spirit regeneration': 200});
  const split = spiritContribution(200, 800, 50, 100, 1000);
  assert.deepEqual(split, {normalMana: 100, innervateMana: 400, normalShare: 10, totalShare: 50});
});

test('contributions reconcile separately for normal and incremental Innervate mana', () => {
  const rows = [20, 30, 50].map(weight => spiritContribution(250, 750, weight, 100, 2000));
  assert.equal(rows.reduce((n, row) => n + row.normalMana, 0), 250);
  assert.equal(rows.reduce((n, row) => n + row.innervateMana, 0), 750);
  assert.equal(rows.reduce((n, row) => n + row.totalShare, 0), 50);
});

test('normal-only and Innervate-only reports retain the group and handle empty totals', () => {
  assert.deepEqual(manaReportSources({Innervate: 80}), [['Spirit regeneration', 80]]);
  assert.deepEqual(manaReportSources({'Spirit regeneration': 20}), [['Spirit regeneration', 20]]);
  assert.deepEqual(manaReportSources({}), []);
  assert.deepEqual(spiritContribution(0, 0, 0, 0, 0), {normalMana: 0, innervateMana: 0, normalShare: 0, totalShare: 0});
});
