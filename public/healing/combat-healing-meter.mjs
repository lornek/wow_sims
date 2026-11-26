import {setGameTooltip}from'./game-ui.mjs';
import {setBarNumbers}from'./bar-numbers.mjs';
import {purposeIconPath}from'./purpose-icons.mjs';
export function mountCombatHealingMeter(root,{raid=false,spellInfo}){
 const panel=document.createElement(raid?'aside':'section');panel.className=raid?'combat-damage combat-healing':'combat-healing';panel.setAttribute('aria-label','Healing done');panel.innerHTML='<h3>Healing done</h3><div data-healing-meter></div>';
 if(raid)root.querySelector('.heal-stage').append(panel);else root.querySelector('.combat-damage').append(panel);
 const container=panel.querySelector('[data-healing-meter]'),rows=new Map();let last=-1;
 function render(state,profile,spells){
  if(state.time>=last&&state.time-last<.1)return;last=state.time;
  const actors=state.raidActors??[{unit:state.party.at(-1),profile,spells,pull:{state}}],sorted=[...actors].sort((a,b)=>b.pull.state.healing-a.pull.state.healing),lead=Math.max(1,...sorted.map(a=>a.pull.state.healing));
  sorted.forEach((actor,index)=>{const s=actor.pull.state,name=actor.unit.name;let entry=rows.get(name);
   if(!entry){const row=document.createElement('details');row.className='meter-row';const summary=document.createElement('summary'),label=document.createElement('span'),value=document.createElement('span'),breakdown=document.createElement('div');breakdown.className='damage-breakdown';summary.append(label,value);row.append(summary,breakdown);row.style.setProperty('--damage-class',actor.unit.color);entry={row,label,value,breakdown,lines:new Map()};rows.set(name,entry);container.append(row);}
   entry.label.textContent=name;setBarNumbers(entry.value,Math.round(s.healing).toLocaleString(),Math.round(s.healing/((state.endedAt??state.time)||1))+' HPS');entry.row.style.setProperty('--share',s.healing/lead*100+'%');
   entry.row.title=(actor.kit?actor.kit.name+' · '+actor.focus+' · ':'')+'Mana '+Math.round(s.mana)+' · Overhealing '+Math.round(s.overheal);
   if(entry.row.open){const meters=Object.entries(s.meters).filter(([,m])=>m.casts||m.hits||m.effective).sort((a,b)=>b[1].effective-a[1].effective),maximum=Math.max(1,...meters.map(([,m])=>m.effective));
    for(const[key,meter]of meters){let line=entry.lines.get(key);if(!line){const element=document.createElement('div'),image=document.createElement('img'),numbers=document.createElement('span');element.append(image,numbers);line={element,image,numbers};entry.lines.set(key,line);}
     const info=spellInfo(key,actor)??{};line.image.src=new URL('./'+(info.path??purposeIconPath('healing')),import.meta.url);line.image.alt=info.name??key;
     const casts=meter.casts??0,hits=meter.hits??0,crits=meter.crits??0;const description=casts+' casts · '+hits+' hits · '+crits+' crits · '+Math.round(meter.overheal??0)+' overhealing';setGameTooltip(line.element,info.name??key,[description]);line.element.tabIndex=0;line.element.setAttribute('aria-label',(info.name??key)+' · '+description);line.element.style.setProperty('--ability-share',meter.effective/maximum*100+'%');line.element.style.setProperty('--damage-hue','0deg');line.element.style.setProperty('--damage-tint','34%');setBarNumbers(line.numbers,Math.round(meter.effective).toLocaleString(),Math.round(meter.effective/((state.endedAt??state.time)||1))+' HPS');entry.breakdown.append(line.element);
    }
    for(const[key,line]of entry.lines)if(!meters.some(([k])=>k===key)){line.element.remove();entry.lines.delete(key);}
   }
   if(container.children[index]!==entry.row)container.insertBefore(entry.row,container.children[index]??null);
  });
  for(const[name,entry]of rows)if(!actors.some(a=>a.unit.name===name)){entry.row.remove();rows.delete(name);}
 }
 return{render,destroy(){panel.remove();}};
}
