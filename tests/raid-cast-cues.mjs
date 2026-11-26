import test from 'node:test';
import assert from 'node:assert/strict';
import {castCueState} from '../public/healing/raid-cast-cues.mjs';
const action={id:1,key:'renew',start:0,end:1.5,casting:false};
test('instant cue falls during the final 0.2 seconds of the GCD',()=>{
 assert.equal(castCueState({phase:'active',time:1,lastAbility:action}).falling,false);
 assert.equal(castCueState({phase:'active',time:1.31,lastAbility:action}).falling,true);
 assert.equal(castCueState({phase:'active',time:1.5,lastAbility:action}),null);
});
test('cast cue follows pushback and disappears on cancellation or fight end',()=>{
 const state={phase:'active',time:1.4,lastAbility:{...action,casting:true},cast:{spell:{key:'renew'},end:2,duration:2}};
 assert.equal(castCueState(state).end,2);
 assert.equal(castCueState(state).falling,false);
 assert.equal(castCueState({...state,castCancelledAt:1.4,cast:null}),null);
 assert.equal(castCueState({...state,phase:'won'}),null);
});
