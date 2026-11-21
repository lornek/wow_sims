import test from 'node:test';
import assert from 'node:assert/strict';
import {createHealingSoundscape} from '../public/healing/healing-soundscape.mjs';
function fixture(className){let enabled=true;const clips=[];const scene=createHealingSoundscape({className,enabled:()=>enabled,context:()=>null,storage:{getItem:()=>null},events:new EventTarget(),createAudio:url=>{const clip={url,paused:false,play:()=>Promise.resolve(),pause(){this.paused=true;},removeAttribute(){},load(){}};clips.push(clip);return clip;}});return {scene,clips,mute(){enabled=false;scene.stop();},unmute(){enabled=true;}};}
test('Clearcasting plays once per actual Omen proc, including a refreshed aura',()=>{
 const f=fixture('druid'),state={phase:'active',time:0,omenProcs:0};f.scene.syncBuffs(state);assert.equal(f.clips.length,0);
 state.omenProcs++;f.scene.syncBuffs(state);f.scene.syncBuffs(state);assert.equal(f.clips.length,1);assert.match(f.clips[0].url,/clearcasting_impact_chest.ogg$/);
 state.omenProcs++;f.scene.syncBuffs(state);assert.equal(f.clips.length,2);f.scene.destroy();
});
test('muting never queues an old proc to replay on unmute',()=>{
 const f=fixture('druid'),state={phase:'active',time:0,omenProcs:0};f.scene.syncBuffs(state);f.mute();state.omenProcs=1;f.scene.syncBuffs(state);f.unmute();f.scene.syncBuffs(state);assert.equal(f.clips.length,0);
 state.omenProcs=2;f.scene.syncBuffs(state);assert.equal(f.clips.length,1);f.scene.destroy();
});
test('Inner Focus loop tracks activation and consumption without restarting each frame',()=>{
 const f=fixture('priest'),state={phase:'active',time:0,innerFocus:Infinity};f.scene.syncBuffs(state);f.scene.syncBuffs(state);assert.equal(f.clips.length,1);assert.equal(f.clips[0].loop,true);assert.match(f.clips[0].url,/precastmagelow.ogg$/);
 state.innerFocus=0;f.scene.syncBuffs(state);assert.equal(f.clips[0].paused,true);state.innerFocus=Infinity;f.scene.syncBuffs(state);assert.equal(f.clips.length,2);
 state.phase='won';f.scene.syncBuffs(state);assert.equal(f.clips[1].paused,true);f.scene.destroy();
});
test('reset, mute and class cleanup cancel persistent sounds immediately',()=>{
 const f=fixture('priest'),state={phase:'active',time:0,innerFocus:Infinity};f.scene.syncBuffs(state);f.mute();assert.equal(f.clips[0].paused,true);f.unmute();f.scene.syncBuffs(state);assert.equal(f.clips.length,2);
 f.scene.stop();f.scene.syncBuffs({phase:'ready',time:0});assert.ok(f.clips.every(c=>c.paused));f.scene.destroy();
});
test('Divine Favor has no invented persistent loop',()=>{
 const f=fixture('paladin');f.scene.syncBuffs({phase:'active',time:0,divineFavor:Infinity});assert.equal(f.clips.length,0);f.scene.destroy();
});
