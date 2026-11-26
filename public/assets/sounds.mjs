import {soundCatalog,soundEvents,soundStorageKey,readSoundSettings,defaultSoundSettings,createSoundLayer} from '../healing/sound-library.mjs';
const find=s=>document.querySelector(s),status=find('#sound-status');
let settings=readSoundSettings(localStorage),audio;
const player=createSoundLayer({context:()=>audio,onStatus:value=>{status.textContent=value==='fallback'?'This clip could not load. Check the audio host or choose a synthesized cue.':'Playing preview…';}});
async function preview(id){player.stop();audio??=new (window.AudioContext||window.webkitAudioContext)();await audio.resume();status.textContent='Playing preview…';player.play(id,{fallback:null});}
const option=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;return o;};
const selects=new Map();
function save(){try{localStorage.setItem(soundStorageKey,JSON.stringify(settings));status.textContent='Sound assignments saved.';}catch{status.textContent='Browser storage is unavailable. These choices apply only until you leave this page.';}}
for(const [key,label] of Object.entries(soundEvents)){
 const wrap=document.createElement('label');wrap.textContent=label;
 const select=document.createElement('select');select.setAttribute('aria-label',label+' sound');
 select.append(option('none','Silent'));if(key==='casting')select.append(option('auto','Automatic spell casting'));
 for(const sound of soundCatalog)select.append(option(sound.id,sound.name));
 select.value=settings[key];select.onchange=()=>{settings[key]=select.value;save();};selects.set(key,select);wrap.append(select);find('#sound-assignments').append(wrap);
}
find('#sound-defaults').onclick=()=>{settings={...defaultSoundSettings};for(const[key,select]of selects)select.value=settings[key];save();player.stop();};
find('#sound-stop').onclick=()=>{player.stop();status.textContent='Preview stopped.';};
const cards=[];
for(const sound of soundCatalog){
 const card=document.createElement('article');card.className='sound-card';
 const title=document.createElement('h3');title.textContent=sound.name;
 const source=document.createElement('small');source.textContent=sound.group+(sound.file?' · Client #'+sound.id:' · Local tone');
 const actions=document.createElement('div');actions.className='sound-actions';
 const button=document.createElement('button');button.type='button';button.textContent='▶ Preview';button.setAttribute('aria-label','Preview '+sound.name);button.onclick=()=>preview(sound.id).catch(()=>{status.textContent='Playback is unavailable. Try another sound.';});
 const wrap=document.createElement('label');wrap.textContent='Assign to';const assign=document.createElement('select');assign.setAttribute('aria-label','Assign '+sound.name);assign.append(option('','Choose event…'));
 for(const[key,label]of Object.entries(soundEvents))assign.append(option(key,label));
 assign.onchange=()=>{if(!assign.value)return;settings[assign.value]=sound.id;selects.get(assign.value).value=sound.id;save();assign.value='';};
 wrap.append(assign);actions.append(button,wrap);card.append(title,source,actions);find('#sound-cards').append(card);cards.push({card,sound});
}
for(const group of new Set(soundCatalog.map(s=>s.group)))find('#sound-group').append(option(group,group));
function filter(){const query=find('#sound-search').value.toLowerCase().trim(),group=find('#sound-group').value;let count=0;for(const{card,sound}of cards){card.hidden=!!(group&&sound.group!==group)||![sound.name,sound.id,sound.file,sound.group].join(' ').toLowerCase().includes(query);if(!card.hidden)count++;}find('#sound-count').textContent=count?count+' sounds':'No matching sounds.';}
find('#sound-search').oninput=filter;find('#sound-group').onchange=filter;filter();
window.addEventListener('pagehide',()=>{player.stop();audio?.close();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)player.stop();});
