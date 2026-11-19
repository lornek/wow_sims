import test from 'node:test';
import assert from 'node:assert/strict';
import {createShamanAudio,shamanSoundIds} from '../public/healing/shaman-audio.mjs';
function fixture(reject=false) {
 let enabled=true, fallback=0;const clips=[];
 const player=createShamanAudio({enabled:()=>enabled,fallback:()=>fallback++,createAudio:url=>{
  const clip={url,paused:false,play:()=>reject?Promise.reject(Error('offline')):Promise.resolve(),pause(){this.paused=true;},removeAttribute(){},load(){}};
  clips.push(clip);return clip;
 }});
 return {player,clips,get fallback(){return fallback;},mute(){enabled=false;player.stop();}};
}
test('Shaman audio chooses traced sounds and ignores unmapped consumables',()=>{
 const f=fixture();assert.equal(f.player.play('Chain Heal'),true);
 assert.match(f.clips[0].url,new RegExp('/'+shamanSoundIds['Chain Heal']+'$'));
 assert.equal(f.player.play('Mana Potion'),false);assert.equal(f.clips.length,1);
});
test('unavailable audio falls back once and avoids repeated failing requests',async()=>{
 const f=fixture(true);f.player.play('Healing Wave');await Promise.resolve();
 f.clips[0].onerror();assert.equal(f.fallback,1);
 f.player.play('Lesser Healing Wave');assert.equal(f.fallback,2);assert.equal(f.clips.length,1);
});
test('reset and mute cancel late failures and stop playback',async()=>{
 const f=fixture(true);f.player.play('Water Shield');f.mute();await Promise.resolve();
 assert.equal(f.fallback,0);assert.equal(f.clips[0].paused,true);
 f.player.play('Water Shield');assert.equal(f.clips.length,1);
});
test('audio voice count stays bounded',()=>{
 const f=fixture();for(let i=0;i<9;i++)f.player.play('Riptide');
 assert.equal(f.clips.filter(c=>!c.paused).length,6);
 f.player.stop();assert.ok(f.clips.every(c=>c.paused));
});

test('spell audio notification happens on completion, never on rejected casts',async()=>{
 const {createPull}=await import('../public/healing/engine.mjs');
 const events=[];
 const spell={key:'wave',name:'Healing Wave',cast:2,cost:10,gcd:1.5,cooldown:0,low:100,high:100,coefficient:0,multiplier:1};
 const p=createPull({mana:1000,regen:0,mp5:0,power:0,crit:0},{wave:spell},{party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0})),health:1e9,swing:0,limit:100},()=>.5,()=>{},()=>{},event=>events.push(event));
 p.start();p.cast('wave',0);p.cast('wave',0);assert.equal(events.length,0);
 p.step(2);assert.deepEqual(events,[{key:'wave',name:'Healing Wave'}]);
 p.state.mana=0;p.cast('wave',0);p.step(3);assert.equal(events.length,1);
});
