export const damageTextLanes = {Cairne:'top-left',Illidan:'bottom-left',Sylvanas:'top-right',Jaina:'bottom-right'};
export function mountDamageText(crest, abilityIcons) {
  const layer=document.createElement('div');layer.className='party-damage-text';layer.setAttribute('aria-hidden','true');crest.append(layer);
  const lanes=new Map(),slots=new Map(),timers=new Set();
  for(const [name,position]of Object.entries(damageTextLanes)){
    const lane=document.createElement('div');lane.className='damage-text-lane '+position;lane.dataset.source=name;layer.append(lane);lanes.set(name,lane);
  }
  function clear(){for(const timer of timers)clearTimeout(timer);timers.clear();for(const lane of lanes.values())lane.replaceChildren();slots.clear();}
  return {
    show(event){
      const lane=lanes.get(event.source);if(!lane||event.amount<=0)return;
      if (!slots.has(event.source)) slots.set(event.source,new Set());
      const occupied=slots.get(event.source);let slot=0;while(occupied.has(slot))slot++;occupied.add(slot);
      const float=document.createElement('span');float.className='party-damage-float'+(event.crit?' is-crit':'');float.dataset.ability=event.spell;float.dataset.damageSlot=String(slot);
      float.style.color=event.color;float.style.setProperty('--hit-y',(damageTextLanes[event.source].startsWith('top')?-1:1)*slot*32+'px');
      const content=document.createElement('span');content.className='damage-hit';
      const image=document.createElement('img');image.src=new URL('./icons/'+(abilityIcons[event.spell]??'ability_meleedamage')+'.jpg',import.meta.url);image.alt='';
      const amount=document.createElement('strong');amount.textContent=event.amount.toLocaleString('en-US')+(event.crit?'!':'');content.append(image,amount);float.append(content);lane.append(float);
      const timer=setTimeout(()=>{float.remove();occupied.delete(slot);timers.delete(timer)},1450);timers.add(timer);
    },clear,destroy(){clear();layer.remove();}
  };
}
