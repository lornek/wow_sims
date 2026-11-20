import {clientSounds} from './sound-catalog.mjs';
export const soundEvents = Object.freeze({casting:'Casting',hit:'Healing hit',crit:'Critical heal',tick:'Healing tick',critTick:'Critical tick'});
export const soundStorageKey='wow-forever-sims.healing-sounds.v1';
export const synthSounds=[
 {id:'tone-hit',name:'Healing chime',group:'Synthesized',frequency:465,end:700,duration:.22,volume:.045},
 {id:'tone-crit',name:'Critical sparkle',group:'Synthesized',frequency:740,end:1250,duration:.24,volume:.045},
 {id:'tone-tick',name:'Gentle pulse',group:'Synthesized',frequency:540,end:660,duration:.12,volume:.025},
 {id:'tone-critTick',name:'Bright pulse',group:'Synthesized',frequency:880,end:1100,duration:.15,volume:.03},
 {id:'tone-soft',name:'Soft bell',group:'Synthesized',frequency:660,end:990,duration:.3,volume:.025},
 {id:'tone-low',name:'Warm bloom',group:'Synthesized',frequency:330,end:495,duration:.25,volume:.035},
];
export const soundCatalog=[...synthSounds,...clientSounds];
export const defaultSoundSettings=Object.freeze({casting:'auto',hit:'tone-hit',crit:'tone-crit',tick:'tone-tick',critTick:'tone-critTick'});
export function normalizeSoundSettings(value={}) {
 const valid=new Set(['none',...soundCatalog.map(s=>s.id)]);
 return Object.fromEntries(Object.keys(soundEvents).map(key=>[key, valid.has(value?.[key]) || key==='casting'&&value?.[key]==='auto' ? value[key] : defaultSoundSettings[key]]));
}
export function readSoundSettings(storage) {try{return normalizeSoundSettings(JSON.parse(storage.getItem(soundStorageKey)));}catch{return {...defaultSoundSettings};}}
export function healingSoundEvent(event) {return event.periodic ? event.crit?'critTick':'tick' : event.crit?'crit':'hit';}
export function clientSoundUrl(id) {
 const clip=clientSounds.find(s=>s.id===String(id));
 return clip ? `https://wow.zamimg.com/sound-ids/live/enus/${Number(id)%256}/${id}/${clip.file}` : null;
}
// A bounded, independently stoppable layer. No random numbers or simulation work.
export function createSoundLayer({enabled=()=>true,context=()=>null,createAudio=url=>new Audio(url),onStatus=()=>{}}={}) {
 const active=new Set();let generation=0;
 function stop(){generation++;for(const voice of [...active])voice();active.clear();}
 function play(id,{loop=false,fallback='tone-hit'}={}) {
  if(id==='none'||!enabled())return;
  const sound=soundCatalog.find(s=>s.id===String(id));if(!sound)return;
  if(active.size>=12)active.values().next().value();
  const version=generation;
  if(sound.frequency){
   const audio=context();if(audio?.state!=='running')return;
   const tone=audio.createOscillator(),volume=audio.createGain(),start=audio.currentTime;
   tone.type='sine';tone.frequency.setValueAtTime(sound.frequency,start);tone.frequency.exponentialRampToValueAtTime(sound.end,start+sound.duration*.6);
   volume.gain.setValueAtTime(sound.volume,start);volume.gain.exponentialRampToValueAtTime(.001,start+sound.duration);
   tone.connect(volume).connect(audio.destination);
   const cancel=()=>{active.delete(cancel);try{tone.stop();}catch{}tone.disconnect();volume.disconnect();};
   active.add(cancel);tone.onended=cancel;tone.start();tone.stop(start+sound.duration+.01);return;
  }
  const clip=createAudio(clientSoundUrl(id));clip.volume=loop ? .2 : .3;clip.loop=loop;
  let done=false,retiring=false,fadeTimer;
  const cancel=()=>{if(done)return;done=true;clearInterval(fadeTimer);active.delete(cancel);clip.onended=clip.onerror=clip.onplaying=null;clip.pause();clip.removeAttribute('src');clip.load();};
  cancel.fade = milliseconds => {
   if(done||retiring)return;retiring=true;
   const steps=Math.max(1,Math.ceil(milliseconds/16)),initial=clip.volume;let step=0;
   fadeTimer=setInterval(()=>{if(++step>=steps){cancel();return;}clip.volume=initial*(1-step/steps);},16);
  };
  active.add(cancel);clip.onended=cancel;
  clip.onplaying=()=>{if(version===generation)onStatus('playing');};
  const fail=()=>{if(done)return;cancel();if(!retiring&&version===generation&&enabled()){onStatus('fallback');if(fallback&&fallback!==id)play(fallback,{fallback:null});}};
  clip.onerror=fail;try{Promise.resolve(clip.play()).catch(fail);}catch{fail();}
 }
 return {play,stop,fadeOut(milliseconds=220){for(const voice of [...active]){if(voice.fade)voice.fade(milliseconds);else voice();}}};
}
