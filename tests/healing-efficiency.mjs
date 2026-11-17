import test from 'node:test';
import assert from 'node:assert/strict';
import {expectedHealingPerMana} from '../public/healing/healing-preview.mjs';
const close = (actual,expected) => assert.ok(Math.abs(actual-expected)<1e-8, `${actual} ≈ ${expected}`);
const profile={power:100,crit:.2};
const direct={low:900,high:1100,coefficient:.5,multiplier:1,cost:200};
test('direct healing includes average range, power and critical healing',()=>{
 const result=expectedHealingPerMana(direct,profile);
 close(result.healing,1155);assert.equal(result.perMana,5.775);
});
test('Regrowth adds its full HoT with separate multiplier and periodic crit rules',()=>{
 const spell={...direct,bonusCrit:.3,duration:9,periodicCrit:true,hot:{low:100,high:100,period:3,multiplier:2}};
 close(expectedHealingPerMana(spell,profile).healing,2062.5);
 spell.periodicCrit=false;
 close(expectedHealingPerMana(spell,profile).healing,1912.5);
});
test('all chain bounces, party targets and Mending charges contribute',()=>{
 close(expectedHealingPerMana({...direct,chain:3,falloff:.5},profile).healing,2021.2500000000002);
 close(expectedHealingPerMana({...direct,party:true},profile).healing,5775);
 close(expectedHealingPerMana({...direct,mending:true},profile).healing,5775);
});
test('channels include immediate tick and decaying HoTs use the entire linear sequence',()=>{
 const spell={low:100,high:100,cost:100,period:1,duration:2,periodicCrit:true,immediateTick:true};
 assert.ok(Math.abs(expectedHealingPerMana(spell,profile).healing-330)<1e-9);
 close(expectedHealingPerMana({...spell,immediateTick:false,decay:true},profile).healing,220.00000000000003);
});
test('Illumination uses proc chance and half of base cost, not adjusted cost',()=>{
 const result=expectedHealingPerMana({...direct,baseCost:300,illumination:.6},profile);
 assert.equal(result.expectedCost,182);
 assert.equal(result.perMana,1155/182);
 close(expectedHealingPerMana({...direct,baseCost:300,illumination:0},profile).expectedCost,200);
});
test('passive bonus crit clamps at 100%, and zero cost has no finite ratio',()=>{
 const result=expectedHealingPerMana({...direct,boundless:1},profile);
 close(result.healing,1575);
 assert.equal(expectedHealingPerMana({...direct,cost:0},profile).perMana,null);
});
