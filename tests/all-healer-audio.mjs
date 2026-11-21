import test from 'node:test';
import assert from 'node:assert/strict';
import {spellSounds,spellCastingSound} from '../public/healing/spell-sounds.mjs';
import {clientSoundUrl,defaultSoundSettings} from '../public/healing/sound-library.mjs';
import {createSpellAudio} from '../public/healing/spell-audio.mjs';
import {createHealingSoundscape} from '../public/healing/healing-soundscape.mjs';
function fixture(){const clips=[];return {clips,createAudio:url=>{const c={url,play:()=>Promise.resolve(),pause(){this.paused=true;},removeAttribute(){},load(){}};clips.push(c);return c;}};}
test('every playable healer spell and consumable has a resolvable client sound plan',async()=>{
 for(const cls of ['shaman','druid','paladin','priest']){
  const {default:config}=await import('../public/healing/'+cls+'.mjs');
  for(const[,name]of config.slots){assert.ok(spellSounds[name],cls+': '+name);}
 }
 for(const [name,plan]of Object.entries(spellSounds)){
  for(const id of [...plan.landing,plan.casting,plan.channel,plan.after,plan.pulse].filter(Boolean))assert.ok(clientSoundUrl(id),name+': '+id);
 }
 for(const name of ["Light's Vigil",'Oath of Light','Bloom'])assert.equal(spellSounds[name].custom,true);
});
test('Druid and Paladin casts select nature and holy, while channel loops use their channel kit',()=>{
 assert.equal(spellCastingSound({name:'Regrowth'}),568291);
 assert.equal(spellCastingSound({name:'Holy Light'}),568440);
 assert.equal(spellCastingSound({name:'Penance'},true),568915);
 assert.equal(spellCastingSound({name:'Tranquility'},true),568291);
});
test('channel pulses and Mending procs play their native impacts without replaying other spell completions',()=>{
 const f=fixture(),audio=createSpellAudio({...f,enabled:()=>true,fallback:()=>{}});
 audio.play('Penance');assert.equal(f.clips.length,0);audio.heal('Penance');assert.match(f.clips[0].url,/flashheal_low_base/);
 audio.heal('Prayer of Mending');assert.match(f.clips[1].url,/prayerofmending_impact_head/);
 audio.heal('Regrowth');assert.equal(f.clips.length,2);audio.stop();
});
test('automatic sound covers every class; explicit casting overrides and silence remain intact',()=>{
 for(const [cls,name,file]of [['druid','Regrowth','precastnaturemagichigh'],['priest','Greater Heal','precastholymagichigh'],['paladin','Holy Light','precastholymagichigh']]){
  const f=fixture(),scene=createHealingSoundscape({...f,className:cls,enabled:()=>true,context:()=>null,storage:{getItem:()=>null},events:new EventTarget()});
  scene.syncCast({spell:{name}});assert.match(f.clips[0].url,new RegExp(file));scene.destroy();
 }
 const f=fixture(),scene=createHealingSoundscape({...f,className:'priest',enabled:()=>true,context:()=>null,storage:{getItem:()=>JSON.stringify({...defaultSoundSettings,casting:'none'})},events:new EventTarget()});
 scene.syncCast({spell:{name:'Penance'},channel:true});assert.equal(f.clips.length,0);scene.destroy();
});
