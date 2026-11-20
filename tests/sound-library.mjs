import test from 'node:test';
import assert from 'node:assert/strict';
import {soundCatalog,normalizeSoundSettings,healingSoundEvent,createSoundLayer,defaultSoundSettings} from '../public/healing/sound-library.mjs';
import {createHealingSoundscape} from '../public/healing/healing-soundscape.mjs';
test('sound assignments validate persisted data and preserve silence',()=>{
 assert.deepEqual(normalizeSoundSettings(null),defaultSoundSettings);
 assert.equal(normalizeSoundSettings({hit:'bogus'}).hit,'tone-hit');
 assert.equal(normalizeSoundSettings({casting:'none',tick:'569376'}).casting,'none');
 assert.equal(normalizeSoundSettings({casting:'none',tick:'569376'}).tick,'569376');
 assert.equal(new Set(soundCatalog.map(s=>s.id)).size,soundCatalog.length);
});
test('hit and periodic crit cues are independent',()=>{
 assert.deepEqual([{},{crit:true},{periodic:true},{periodic:true,crit:true}].map(healingSoundEvent),['hit','crit','tick','critTick']);
});
function audioFixture(){const clips=[];return {clips,createAudio:url=>{const c={url,paused:false,play:()=>Promise.resolve(),pause(){this.paused=true;},removeAttribute(){},load(){}};clips.push(c);return c;}};}
test('casting sound continues across renders and stops on completion, interruption, mute and reset',()=>{
 const f=audioFixture();let enabled=true;
 const events=new EventTarget(),scene=createHealingSoundscape({className:'shaman',enabled:()=>enabled,context:()=>null,storage:{getItem:()=>null},events,createAudio:f.createAudio});
 const cast={spell:{key:'wave'}};scene.syncCast(cast);scene.syncCast(cast);
 assert.equal(f.clips.length,1);assert.equal(f.clips[0].loop,true);assert.match(f.clips[0].url,/precastnaturemagichigh.ogg$/);
 scene.syncCast(null);assert.equal(f.clips[0].paused,true);
 scene.syncCast({spell:{key:'chain'}});assert.match(f.clips[1].url,/precastholymagichigh.ogg$/);
 enabled=false;scene.syncCast(cast);assert.equal(f.clips[1].paused,true);assert.equal(f.clips.length,2);
 enabled=true;scene.syncCast(cast);scene.stop();assert.equal(f.clips[2].paused,true);scene.destroy();
});
test('audio layers cap voices and ignore cancelled late errors',async()=>{
 const f=audioFixture(),status=[];const layer=createSoundLayer({...f,onStatus:s=>status.push(s)});
 for(let i=0;i<20;i++)layer.play('569207');
 assert.equal(f.clips.filter(c=>!c.paused).length,12);
 const callback=f.clips.at(-1).onerror;layer.stop();callback();await Promise.resolve();assert.deepEqual(status,[]);
});
test('live assignments update open games without touching simulation state',()=>{
 const f=audioFixture(),events=new EventTarget();let value={hit:'569207'};
 const scene=createHealingSoundscape({className:'priest',enabled:()=>true,context:()=>null,storage:{getItem:()=>JSON.stringify(value)},events,createAudio:f.createAudio});
 scene.heal({});assert.match(f.clips[0].url,/watershield_impact_base/);
 value={hit:'none'};events.dispatchEvent(new Event('storage'));scene.heal({});assert.equal(f.clips.length,1);scene.destroy();
});
test('engine marks direct and periodic audio events without changing heal or crit amounts',async()=>{
 const {createPull}=await import('../public/healing/engine.mjs');const events=[];
 const heal={key:'heal',name:'Test HoT',low:100,high:100,coefficient:0,multiplier:1,cost:0,cast:0,gcd:0,cooldown:0,duration:6,periodicCrit:true,hot:{low:50,high:50,coefficient:0,multiplier:1,period:3}};
 const p=createPull({mana:1000,regen:0,mp5:0,power:0,crit:1},{heal},{party:Array.from({length:5},(_,i)=>({name:String(i),max:10000,dps:0})),health:1e9,swing:0,limit:100},()=>.5,event=>events.push(event));
 p.start();p.cast('heal',0);p.step(3);
 assert.deepEqual(events.map(e=>[e.periodic,e.crit,e.amount]),[[false,true,150],[true,true,75]]);
});
