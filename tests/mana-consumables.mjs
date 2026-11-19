import test from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
import {manaConsumables} from '../public/healing/consumables.mjs';
import {healingScore} from '../public/healing/healing-score.mjs';
const profile={mana:10000,regen:0,mp5:0,castingRegen:0,power:0,crit:0};
const encounter={party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0})),health:1e9,swing:0,limit:1000};
function pull(roll=.5){const p=createPull(profile,Object.fromEntries(Object.entries(manaConsumables).map(([key,spell])=>[key,{...spell,key}])),encounter,()=>roll);p.start();p.state.nextSwing=p.state.nextPoison=Infinity;p.state.mana=0;return p}
test('both mana items use separate 120-second cooldowns and work in the same instant',()=>{
 const p=pull();p.cast('potion',0);assert.equal(p.state.mana,1800);p.cast('darkRune',0);
 assert.equal(p.state.mana,3000);assert.equal(p.state.party[4].hp,9200);assert.equal(p.state.party[0].hp,10000);
 assert.equal(p.state.cooldowns.potion,120);assert.equal(p.state.cooldowns.darkRune,120);assert.equal(p.state.gcd,0);
 p.cast('potion',4);p.cast('darkRune',4);assert.equal(p.state.mana,3000);
 p.step(119.99);p.cast('darkRune',4);assert.equal(p.state.mana,3000);
 p.step(.01);p.cast('darkRune',4);assert.equal(p.state.mana,4200);p.cast('potion',4);assert.equal(p.state.mana,6000);
});
test('rune mana and self-damage use the documented ranges',()=>{
 for(const [roll,mana,damage] of [[0,900,600],[.5,1200,800],[1,1500,1000]]){
  const p=pull(roll);p.cast('darkRune',4);assert.equal(p.state.mana,mana);assert.equal(p.state.party[4].hp,10000-damage);
 }
});
test('rune self-damage uses nonphysical damage and existing shields can absorb it',()=>{
 const p=pull();p.state.party[4].shield={amount:500,expires:30};p.cast('darkRune',4);
 assert.equal(p.state.party[4].hp,9700);assert.equal(p.state.meters.shield.effective,500);
});
test('a lethal rune immediately ends the fight and freezes the final clock',()=>{
 const p=pull();p.state.party[4].hp=500;p.cast('darkRune',4);
 assert.equal(p.state.party[4].hp,0);assert.equal(p.state.phase,'lost');assert.equal(p.state.survivors,4);
 const final=JSON.stringify(p.state);p.step(20);assert.equal(JSON.stringify(p.state),final);
});
test('usable mana is capped and both consumables are excluded from score mana',()=>{
 const p=pull();p.state.mana=9900;p.cast('potion',4);assert.equal(p.state.manaSources['Major Mana Potion'],100);
 p.state.mana=9950;p.cast('darkRune',4);assert.equal(p.state.manaSources['Dark Rune'],50);
 assert.equal(p.state.mana,10000);assert.equal(healingScore(p.state).manaGained,0);
});
