import {exportGearSet} from './gear-export.mjs';
import {setEquipmentImage} from './gear-images.mjs';
import {loadGearCatalog,canEquip,canEnchant,sanitizeEquipment,effectiveEquipment,equipItem,createGearHistory,gearStatText} from './equipment.mjs';
export function mountGearEditor({container,slots,className,loadouts,select,onchange,isActive}) {
  function setsSafe(value){return value && typeof value==='object' && !Array.isArray(value)}
  const key='wow-forever-sims.gear.'+className+'.v1';
  let stored={};try{stored=JSON.parse(localStorage.getItem(key))??{}}catch{}
  if (!setsSafe(stored)) stored={};
  if (!setsSafe(stored.sets)) stored.sets = {};
  let catalog,custom,history=createGearHistory({kit:loadouts[select.value],name:select.value,sets:stored.sets??{}}),sets=Object.assign(Object.create(null),stored.sets??{});
  let enchantPending=false, enchantError=false;
  let destroyed=false, revision=0, restoring=Boolean(stored.kit);
  const toolbar=document.createElement('div');toolbar.className='gear-toolbar';
  const undo=button('Undo',()=>{if(isActive())return;const state=history.undo();custom=state.name==='Custom'?state.kit:undefined;sets=Object.assign(Object.create(null),state.sets??{});renderSets();select.value=state.name;revision++;changed(false)});
  const name=document.createElement('input');name.placeholder='Gear set name';name.maxLength=60;name.setAttribute('aria-label','Gear set name');
  const saved=document.createElement('select');saved.setAttribute('aria-label','Saved gear sets');
  const status=document.createElement('p');status.className='gear-status';status.setAttribute('role','status');
  const save=button('Save set',()=>{const label=name.value.trim();if(!label){status.textContent='Enter a name for this set.';name.focus();return}sets[label]=JSON.parse(JSON.stringify(custom??loadouts[select.value]));history.set({kit:custom??loadouts[select.value],name:select.value,sets});changed();renderSets();saved.value=label;if(storageOkay)status.textContent='Saved '+label+' in this browser.'});
  const load=button('Load set',async()=>{if(!saved.value)return;try{await ready();if(destroyed||isActive())return;commit(sanitizeEquipment(sets[saved.value],className,catalog));status.textContent='Loaded '+saved.value;}catch(e){status.textContent=e.message}});
  const remove=button('Delete set',()=>{if(!saved.value)return;const label=saved.value;delete sets[label];history.set({kit:custom??loadouts[select.value],name:select.value,sets});changed();renderSets();status.replaceChildren(document.createTextNode('Deleted '+label+'. '),button('Undo deletion',()=>{undo.onclick();status.textContent='Restored '+label;}))});
  const exportButton=button('',()=>{
    if(restoring){status.textContent='Equipment is still loading. Try exporting again in a moment.';return}
    const data=exportGearSet({className,name:name.value.trim() || saved.value,preset:select.value,
      equipment:custom??loadouts[select.value]??{},spec:className==='priest'?(new URLSearchParams(location.search).get('spec')==='holy'?'holy':'discipline'):null});
    const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;
    const filename=data.name.replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'') || 'gear-set';
    link.download=className+'-'+filename+'.json';document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Exported '+data.name+'.';
  });
  exportButton.className='gear-icon-button';exportButton.setAttribute('aria-label','Export gear set');exportButton.title='Export current gear set';
  exportButton.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></svg>';
  toolbar.append(undo,name,save,exportButton,saved,load,remove);container.append(toolbar,status);
  const dialog=document.createElement('dialog');dialog.className='gear-dialog';dialog.setAttribute('aria-label','Choose gear and enchants');
  const heading=document.createElement('h2');const close=button('Close',()=>dialog.close());const search=document.createElement('input');search.type='search';search.placeholder='Search item name or ID';search.setAttribute('aria-label','Search items');
  const realm=document.createElement('select');for(const r of ['Forever','Season of Discovery'])realm.add(new Option(r,r));realm.setAttribute('aria-label','Item ruleset');
  const tabs=document.createElement('div');const results=document.createElement('div');results.className='gear-results';const help=document.createElement('p');help.textContent='Static stats apply immediately. Procs, on-use effects, set bonuses and weapon damage are not simulated by this prototype.';
  dialog.append(close,heading,tabs,search,realm,help,results);container.append(dialog);
  let slot,mode='items',limit=50;
  tabs.append(button('Items',()=>{mode='items';draw()}),button('Enchants',()=>{mode='enchants';draw()}),button('Unequip',()=>{commit(equipItem(custom??loadouts[select.value],slot,null));draw()}));
  async function ready(){if(!catalog)catalog=await loadGearCatalog();return catalog}
  function ensureEnchantCatalog(kit){
    if(catalog||enchantPending||enchantError||!Object.values(kit).some(item=>item?.enchantId))return;
    enchantPending=true;status.textContent='Loading enchant stats…';
    ready().then(()=>{if(!destroyed)status.textContent='';}).catch(error=>{enchantError=true;if(!destroyed)status.textContent=error.message+' Reload to retry enchant loading.';})
      .finally(()=>{enchantPending=false;if(!destroyed)onchange()});
  }
  function button(label,click){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=click;return b}
  function renderSets(){saved.replaceChildren(new Option('Choose saved set',''));for(const label of Object.keys(sets))saved.add(new Option(label,label))}
  let storageOkay=true;
  function persist(){try{localStorage.setItem(key,JSON.stringify({kit:custom,preset:select.value,sets}));storageOkay=true;}catch{storageOkay=false;status.textContent='Browser storage is unavailable or full; changes last only for this session.'}}
  function changed(){undo.disabled=!history.canUndo;persist();onchange()}
  function commit(kit){revision++;history.set({kit,name:'Custom',sets});custom=kit;select.value='Custom';changed()}
  function draw(){
    results.replaceChildren();const kit=custom??loadouts[select.value];const current=kit[slot];heading.textContent=slot+' · '+(current?.name??'Empty');
    search.hidden=realm.hidden=mode==='enchants';
    if(mode==='enchants'){
      results.append(button('Remove enchant',()=>{const next=structuredClone(kit);if(next[slot])delete next[slot].enchantId;commit(next);draw()}));
      for(const e of catalog.enchants.filter(e=>canEnchant(e,current,className)))results.append(row(e,()=>{commit({...kit,[slot]:{...current,enchantId:e.id}});draw()},e.id===current?.enchantId));
      if(results.children.length===1)results.append(document.createTextNode('No supported stat enchants for this item.'));
      return;
    }
    const query=search.value.trim().toLowerCase();const matches=catalog.items.filter(i=>i.source===realm.value&&canEquip(i,slot,className)&&(!query||i.name.toLowerCase().includes(query)||String(i.id)===query)).sort((a,b)=>(b.stats.power??0)-(a.stats.power??0)||(b.ilvl??0)-(a.ilvl??0)||a.name.localeCompare(b.name));
    const count=document.createElement('p');count.textContent=matches.length+' compatible items · sorted by +healing';results.append(count);
    for(const i of matches.slice(0,limit))results.append(row(i,()=>{commit(equipItem(kit,slot,i));draw()},i.key===current?.key));
    if(matches.length>limit)results.append(button('Show more',()=>{limit+=50;draw()}));
  }
  function row(item,click,selected){const b=button('',click);b.className='gear-choice';b.setAttribute('aria-pressed',String(selected));const img=document.createElement('img');setEquipmentImage(img,item);img.alt='';img.loading='lazy';const text=document.createElement('span');const title=document.createElement('strong');title.textContent=item.name;title.dataset.quality=item.quality??'';const stats=document.createElement('small');stats.textContent=gearStatText(item.stats);text.append(title,stats);if(item.ilvl){const details=document.createElement('small');details.textContent='Item level '+item.ilvl+' · '+item.source;text.append(details);const current=(custom??loadouts[select.value])[slot];const delta=document.createElement('small');delta.textContent=['power','intellect','spirit','mp5','crit'].filter(key=>item.stats[key]||current?.stats[key]).map(key=>{const value=item.stats[key]??0;return [key,value]}).map(([key,value])=>{const d=value-(current?.stats[key]??0);return (d>=0?'+':'')+Number(d.toFixed(2))+' '+({power:'+healing'}[key]??key)}).join(' · ');if(delta.textContent)text.append(delta);}if(item.effects){const note=document.createElement('small');note.textContent='May have effects not simulated';text.append(note)}b.append(img,text);return b}
  search.oninput=()=>{limit=50;draw()};realm.onchange=()=>{limit=50;draw()};
  for(const [s,{slotButton}]of Object.entries(slots))slotButton.onclick=async()=>{if(isActive()||destroyed)return;slot=s;mode='items';search.value='';limit=50;status.textContent='Loading item catalog…';try{await ready();if(destroyed||isActive())return;status.textContent='';realm.value=(custom??loadouts[select.value])[slot]?.source==='Season of Discovery'?'Season of Discovery':'Forever';draw();dialog.showModal();search.focus()}catch(e){status.textContent=e.message}};
  select.add(new Option('Custom','Custom'));
  select.addEventListener('change',()=>{if(select.value==='Custom'&&!custom){select.value=history.value.name}else{custom=select.value==='Custom'?custom:undefined;history.set({kit:custom??loadouts[select.value],name:select.value,sets});revision++;changed()}});
  renderSets();undo.disabled=true;
  if(stored.kit){status.textContent='Restoring saved equipment…';ready().then(()=>{if(isActive()||destroyed||revision)return;custom=sanitizeEquipment(stored.kit,className,catalog);select.value='Custom';history=createGearHistory({kit:custom,name:'Custom',sets});status.textContent='Saved equipment restored.';}).catch(e=>{status.textContent=e.message}).finally(()=>{restoring=false;if(!destroyed)onchange()})}
  return {get loading(){return restoring||enchantPending||enchantError},destroy(){destroyed=true;dialog.close();dialog.remove()},get kit(){const kit=custom??loadouts[select.value]??{};ensureEnchantCatalog(kit);return effectiveEquipment(kit,catalog)},lock(active){for(const element of toolbar.querySelectorAll('input,select,button'))element.disabled=active;undo.disabled=active||!history.canUndo;for(const {slotButton}of Object.values(slots))slotButton.disabled=active;if(active)dialog.close()}};
}
