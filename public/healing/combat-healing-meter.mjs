import {setGameTooltip}from'./game-ui.mjs';
import {combatNumbers,classShades,specIcon}from'./combat-appearance.mjs';
import {purposeIconPath}from'./purpose-icons.mjs';
export function mountCombatHealingMeter(root,{raid=false,spellInfo,onSetup,className,spec}){
 const panel=document.createElement(raid?'aside':'section');panel.className=raid?'combat-damage combat-healing':'combat-healing';panel.setAttribute('aria-label','Healing done');panel.innerHTML='<h3>Healing done</h3><div data-healing-meter></div>';
 if(raid)root.querySelector('.heal-stage').append(panel);else root.querySelector('.combat-damage').append(panel);
 const container=panel.querySelector('[data-healing-meter]'),rows=new Map();let last=-1,latest;
 if(raid&&onSetup){const button=document.createElement('button');button.type='button';button.className='co-healer-button';button.textContent='Co-healer Setup';button.onclick=onSetup;panel.append(button);}
 function render(state,profile,spells,force=false){
  latest=[state,profile,spells];
  if(!force&&state.time>=last&&state.time-last<.1)return;last=state.time;
  const actors=state.raidActors??[{unit:{...state.party.at(-1),className,spec},profile,spells,pull:{state}}],sorted=[...actors].sort((a,b)=>b.pull.state.healing-a.pull.state.healing),lead=Math.max(1,...sorted.map(a=>a.pull.state.healing));
  sorted.forEach((actor,index)=>{const s=actor.pull.state,name=actor.unit.name;let entry=rows.get(name);
   if(!entry){const row=document.createElement('details');row.className='meter-row';row.name='healbot-healing-breakdown';const summary=document.createElement('summary'),label=document.createElement('span'),value=document.createElement('span'),breakdown=document.createElement('div');breakdown.className='damage-breakdown';summary.append(label,value);row.append(summary,breakdown);row.style.setProperty('--damage-class',actor.unit.color);classShades(row,actor.unit.color);const icon=document.createElement('img');icon.className='meter-spec-icon';icon.src=specIcon(actor.unit);icon.alt='';label.append(icon,document.createTextNode(name));row.addEventListener('toggle',()=>{if(row.open&&latest)render(...latest,true);});entry={row,label,value,breakdown,lines:new Map()};rows.set(name,entry);container.append(row);}
   combatNumbers(entry.value,s.healing,s.healing/((state.endedAt??state.time)||1),100*s.healing/Math.max(1,sorted.reduce((n,a)=>n+a.pull.state.healing,0)));entry.row.style.setProperty('--share',s.healing/lead*100+'%');
   entry.row.title=(actor.kit?actor.kit.name+' · '+actor.focus+' · ':'')+'Mana '+Math.round(s.mana)+' · Overhealing '+Math.round(s.overheal);
   if(entry.row.open){const meters=Object.entries(s.meters).filter(([,m])=>m.casts||m.hits||m.effective).sort((a,b)=>b[1].effective-a[1].effective),maximum=Math.max(1,...meters.map(([,m])=>m.effective));
    for(const[key,meter]of meters){let line=entry.lines.get(key);if(!line){const element=document.createElement('div'),image=document.createElement('img'),numbers=document.createElement('span');element.append(image,numbers);line={element,image,numbers};entry.lines.set(key,line);}
     const info=spellInfo(key,actor)??{};line.image.src=new URL('./'+(info.path??purposeIconPath('healing')),import.meta.url);line.image.alt=info.name??key;
     const casts=meter.casts??0,hits=meter.hits??0,crits=meter.crits??0;const description=casts+' casts · '+hits+' hits · '+crits+' crits · '+Math.round(meter.overheal??0)+' overhealing';setGameTooltip(line.element,info.name??key,[description]);line.element.tabIndex=0;line.element.setAttribute('aria-label',(info.name??key)+' · '+description);line.element.style.setProperty('--ability-share',meter.effective/maximum*100+'%');line.element.style.setProperty('--damage-hue','0deg');line.element.style.setProperty('--damage-tint','34%');combatNumbers(line.numbers,meter.effective,meter.effective/((state.endedAt??state.time)||1),100*meter.effective/Math.max(1,s.healing));entry.breakdown.append(line.element);
    }
    for(const[key,line]of entry.lines)if(!meters.some(([k])=>k===key)){line.element.remove();entry.lines.delete(key);}
   }
   if(container.children[index]!==entry.row)container.insertBefore(entry.row,container.children[index]??null);
  });
  for(const[name,entry]of rows)if(!actors.some(a=>a.unit.name===name)){entry.row.remove();rows.delete(name);}
 }
 return{render,destroy(){panel.remove();}};
}
