import test from 'node:test';
import assert from 'node:assert/strict';
import {greaterMageblood} from '../public/healing/consumable-buffs.mjs';
import {buffs} from '../public/healing/profile.mjs';
for(const className of ['shaman','druid','priest','paladin']){
 test(`${className}: saved mageblood toggle enables Greater Mageblood's 20 MP5 and report attribution`,async()=>{
  const {default:adapter}=await import('../public/healing/'+className+'.mjs');
  const set=Object.keys(adapter.loadouts)[0];
  const plain=adapter.buildProfile(set,new Set(),0,{}),buffed=adapter.buildProfile(set,new Set(['mageblood']),0,{});
  assert.equal(buffed.mp5-plain.mp5,20);
  assert.equal(buffed.mp5Sources['Greater Mageblood Elixir'],20);
  assert.equal(Object.values(buffed.mp5Sources).reduce((a,b)=>a+b,0),buffed.mp5);
 });
}
test('Mageblood retains its saved key and uses the Greater elixir icon and tooltip',()=>{
 assert.deepEqual(buffs.find(([key])=>key==='mageblood'),['mageblood',greaterMageblood.name,'+20 mana / 5 sec','inv_potion_168']);
});
