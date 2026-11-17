import test from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
import shaman from '../public/healing/shaman.mjs';
import druid from '../public/healing/druid.mjs';
import priest from '../public/healing/priest.mjs';
import paladin from '../public/healing/paladin.mjs';

const encounter = {id:'sapphiron', party:Array.from({length:5}, (_, i) => ({name:String(i),max:10000,dps:0})),
  health:1e9, swing:0, frost:105, limit:100};
const spell = {key:'heal',name:'Heal',cast:10,cost:0,gcd:0,cooldown:0,low:100,high:100,coefficient:0,multiplier:1};
function begin(profile, roll = .5) {
  const pull = createPull({...profile,mana:10000,regen:0,mp5:0,power:0,crit:0}, {heal:spell}, encounter, () => roll);
  pull.start();
  pull.state.nextSwing = Infinity;
  pull.cast('heal', 0);
  return pull;
}
for (const [adapter, talent, rank] of [[shaman,'pushback',3],[druid,"Nature's Focus",5],[priest,'Twilight Focus',3],[paladin,'Spiritual Focus',5]]) {
  test(`${adapter.className} pushback talent resists real Sapphiron Frost Aura ticks`, () => {
    const loadout = Object.keys(adapter.loadouts)[0];
    const plain = adapter.buildProfile(loadout,new Set(),0,{});
    const talented = adapter.buildProfile(loadout,new Set(),0,{[talent]:rank});
    assert.equal(plain.pushbackResist,0);
    assert.ok(Math.abs(talented.pushbackResist - .7) < 1e-10);
    const a = begin(plain), b = begin(talented);
    a.step(2); b.step(2);
    assert.equal(a.state.party.at(-1).hp,9895);
    assert.equal(b.state.party.at(-1).hp,9895);
    assert.equal(a.state.cast.end,10.5);
    assert.equal(a.state.cast.pushbacks,1);
    assert.equal(b.state.cast.end,10);
    assert.equal(b.state.cast.pushbacks,0);
    const failedResist = begin(talented,.9);
    failedResist.step(2);
    assert.equal(failedResist.state.cast.end,10.5);
  });
}
test('Frost Aura adds at most two half-second delays per cast', () => {
  const p = begin({});
  p.step(2); p.step(2); p.step(2);
  assert.equal(p.state.cast.end,11);
  assert.equal(p.state.cast.pushbacks,2);
});
test('fully absorbed Frost Aura does not cause cast pushback', () => {
  const p = begin({pushbackResist:0});
  p.state.party.at(-1).shield = {amount:1000,expires:100};
  p.step(2);
  assert.equal(p.state.cast.end,10);
});
