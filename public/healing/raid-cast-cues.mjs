export function castCueState(state){
 const action=state.lastAbility;
 if(!action||state.phase!=='active')return null;
 const casting=state.cast?.spell.key===action.key?state.cast:null;
 const cancelled=state.castCancelledAt!=null&&state.castCancelledAt>=action.start;
 const end=cancelled?state.castCancelledAt:casting?.end??action.end;
 if(state.time>=end)return null;
 const duration=casting?.duration??Math.max(.001,action.end-action.start);
 return {...action,end,falling:state.time>=end-.2,progress:Math.max(0,Math.min(1,1-(end-state.time)/duration))};
}
export function mountRaidCastCues(root,adapters={}){
 const entries=new Map();
 return{render(state){
  for(const actor of state.raidActors??[]){
   const frame=root.querySelector('[data-party-index="'+state.party.indexOf(actor.unit)+'"]');if(!frame)continue;
   let entry=entries.get(frame);
   const cue=actor.unit.hp?castCueState(actor.pull.state):null;
   if(!cue){if(entry){entry.element.hidden=true;entry.animation?.cancel();entry.end=null;}continue;}
   if(!entry){const element=document.createElement('span');element.className='raid-cast-cue';element.setAttribute('aria-hidden','true');const bar=document.createElement('span');bar.className='raid-cast-progress';const fill=document.createElement('span');fill.className='raid-cast-fill';bar.append(fill);const image=document.createElement('img');image.alt='';element.append(bar,image);frame.append(element);entry={element,image,fill};entries.set(frame,entry);}
   if(entry.id!==cue.id){
    const spell=actor.spells[cue.key],catalog=adapters?.[actor.unit.className]?.catalog;
    const icon=catalog?.[cue.name]?.icon??spell?.icon;
    if(!icon){entry.element.hidden=true;continue;}
    entry.end=null;entry.id=cue.id;entry.image.src=new URL('./icons/'+icon,import.meta.url);entry.element.classList.remove('cue-pop','cue-fall');void entry.element.offsetWidth;entry.element.classList.add('cue-pop');
   }
   entry.element.hidden=false;entry.element.classList.toggle('cue-casting',cue.casting);entry.element.classList.toggle('cue-fall',cue.falling);if(cue.casting&&entry.end!==cue.end){entry.animation?.cancel();entry.end=cue.end;entry.animation=entry.fill.animate([{transform:'scaleX('+cue.progress+')'},{transform:'scaleX(1)'}],{duration:Math.max(1,(cue.end-actor.pull.state.time)*1000),easing:'linear',fill:'forwards'});}
  }
 },destroy(){for(const {element,animation}of entries.values()){animation?.cancel();element.remove();}entries.clear();}};
}
