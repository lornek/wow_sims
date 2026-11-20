import {createSoundLayer,readSoundSettings,healingSoundEvent,soundStorageKey} from './sound-library.mjs';
export function createHealingSoundscape({className,enabled,context,storage,events=globalThis,createAudio,onStatus}) {
 let settings=readSoundSettings(storage),cast=null;
 const options={enabled,context,createAudio,onStatus};
 const casting=createSoundLayer(options),healing=createSoundLayer(options);
 function stop(){cast=null;casting.stop();healing.stop();}
 function reload(event){if(event?.key&&event.key!==soundStorageKey)return;settings=readSoundSettings(storage);stop();}
 events.addEventListener('storage',reload);
 function syncCast(value){
  const next=enabled()&&value&&!value.channel?value:null;
  if(next===cast)return;
  if(cast&&enabled())casting.fadeOut(220);else casting.stop();
  cast=next;if(!cast)return;
  let choice=settings.casting;
  if(choice==='auto')choice=className==='shaman'?(cast.spell.key==='chain'?'568440':'568291'):'none';
  casting.play(choice,{loop:true,fallback:null});
 }
 return {syncCast,heal(event){healing.play(settings[healingSoundEvent(event)]);},stop,
 destroy(){stop();events.removeEventListener('storage',reload);}};
}
