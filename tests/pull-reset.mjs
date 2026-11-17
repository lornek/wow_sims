import test from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
const profile = {mana:10000,regen:100,mp5:50,castingRegen:1,power:0,crit:0};
const party = Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0}));
const encounter = {id:'sapphiron',party,health:1e9,swing:0,frost:100,limit:100};
const spells = {heal:{key:'heal',name:'Heal',low:100,high:100,cost:100,cast:0,gcd:0,cooldown:0,multiplier:1,coefficient:0},
  potion:{key:'potion',name:'Major Mana Potion',manaRange:[1000,1000],cost:0,cast:0,gcd:0,cooldown:120}};

test('new pulls discard all prior combat meters across reset, boss, difficulty, and healer configurations', () => {
  const previous=createPull(profile,spells,encounter,()=>.5);
  previous.start(); previous.state.mana=5000; previous.state.party[0].hp=9000;
  previous.cast('heal',0); previous.cast('potion',4); previous.step(2);
  assert.ok(previous.state.healing > 0);
  assert.ok(previous.state.manaGained > 0);
  assert.equal(previous.state.manaSources['Major Mana Potion'],1000);
  for(const config of [encounter,{...encounter,id:'patchwerk',strike:0},{...encounter,frost:500},{...encounter,party:party.map(u=>({...u,max:12000}))}]) {
    const fresh=createPull(profile,{heal:spells.heal},config,()=>.5);
    assert.equal(fresh.state.healing,0);
    assert.equal(fresh.state.overheal,0);
    assert.equal(fresh.state.manaGained,0);
    assert.equal(fresh.state.manaSpent,0);
    assert.equal(fresh.state.manaPerSpirit,0);
    assert.equal(fresh.state.manaPerMp5,0);
    assert.deepEqual(fresh.state.meters,{});
    assert.deepEqual(fresh.state.manaSources,{});
    assert.deepEqual(fresh.state.effects,[]);
    assert.deepEqual(fresh.state.cooldowns,{});
    fresh.start();fresh.step(2);
    assert.equal(fresh.state.manaSources['Major Mana Potion'],undefined);
  }
});
