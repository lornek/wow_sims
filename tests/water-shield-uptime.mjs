import test from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
const profile={mana:10000,regen:0,mp5:0,castingRegen:0,power:0,crit:1};
const heal={key:'heal',name:'Heal',low:100,high:100,cost:0,cast:0,gcd:0,cooldown:0,coefficient:0,multiplier:1};
const shield={key:'waterShield',name:'Water Shield',waterShield:true,duration:600,cost:0,cast:0,gcd:0,cooldown:0};
const encounter={party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0})),health:1e9,swing:0,limit:100,startWaterShield:true};
function pull(extra={},spells={waterShield:shield,heal}) {
  const p=createPull(profile,spells,{...encounter,...extra},()=>.5);p.start();return p;
}
test('prebuff counts from combat start, including internal proc cooldown, until final charge is consumed',()=>{
  const p=pull();
  p.cast('heal',0); p.step(3.5); p.cast('heal',0); p.step(3.5);p.cast('heal',0);p.step(3);
  assert.equal(p.state.waterShield.charges,0);
  assert.equal(p.state.waterShieldUptime,7);
  assert.equal(p.state.time,10);
  p.cast('waterShield',4);p.step(2);
  assert.equal(p.state.waterShieldUptime,9);
});
test('expiry clips uptime precisely even when a time step crosses it',()=>{
  const p=pull({}, {waterShield:{...shield,duration:1.25}});
  p.step(2);assert.equal(p.state.waterShieldUptime,1.25);
  p.step(2);assert.equal(p.state.waterShieldUptime,1.25);
});
test('uptime freezes when fight ends and is fresh on every pull',()=>{
  const p=pull({limit:2});p.step(2);assert.equal(p.state.phase,'lost');
  const uptime=p.state.waterShieldUptime;p.step(10);
  assert.equal(p.state.waterShieldUptime,uptime);assert.equal(p.state.endedAt,2);
  assert.equal(pull().state.waterShieldUptime,0);
  const absent=pull({startWaterShield:false});absent.step(3);
  assert.equal(absent.state.waterShieldUptime,0);
});
test('shield applied mid-cast counts only after application and before depletion',()=>{
  const p=pull({startWaterShield:false},{waterShield:{...shield,cast:1}});
  p.cast('waterShield',4);p.step(2);
  assert.equal(p.state.waterShieldUptime,1);
});
