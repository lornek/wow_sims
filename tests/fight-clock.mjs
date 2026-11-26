import test from 'node:test';
import assert from 'node:assert/strict';
import {createPull} from '../public/healing/engine.mjs';
const profile={mana:1000,regen:10,mp5:0,castingRegen:.5,power:0,crit:0};
const encounter={party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:1})),health:1e9,swing:0,limit:2};
for(const outcome of ['won','lost'])test(outcome+' freezes clock and all combat state after fight ends',()=>{
 const pull=createPull(profile,{},outcome==='won'?{...encounter,health:1}:encounter,()=>.5);
 pull.start();pull.state.mana=500;pull.step(2);
 assert.equal(pull.state.phase,outcome);
 const final=JSON.stringify(pull.state);
 pull.step(1);pull.step(60);
 assert.equal(JSON.stringify(pull.state),final);
 assert.equal(pull.state.time,pull.state.endedAt);
});
