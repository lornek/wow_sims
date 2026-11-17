import {bundledIconFiles} from './bundled-icon-files.mjs';
// Restored from the pre-normalization curated presets (fb3a9f8^). The upstream
// catalog omits these icon fields; preserve their verified project metadata.
export const equipmentIconOverrides = {
  252561:'inv_helmet_19',
  250600:'inv_pants_plate_03',
  275609:'inv_boots_cloth_05'
};
export function equipmentIconName(item) {
  const name=item?.icon || equipmentIconOverrides[item?.id];
  if(typeof name!=='string')return null;
  const normalized=name.toLowerCase().replace(/\.(jpg|png|webp)$/,'');
  return /^[a-z0-9_]+$/.test(normalized)?normalized:null;
}
const placeholder='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="4" fill="#21180f"/><path d="M14 10h20v9l5 7-8 14H17L9 26l5-7z" fill="#64583e" stroke="#b49a57" stroke-width="2"/></svg>');
export function equipmentImageSources(item,slot='empty') {
  const name=equipmentIconName(item),sources=[];
  if(name&&bundledIconFiles[name])sources.push(new URL('./'+bundledIconFiles[name],import.meta.url).href);
  if(name)sources.push('https://wow.zamimg.com/images/wow/icons/medium/'+name+'.jpg');
  const file=/^[a-z]+$/.test(slot)?slot:'empty';
  sources.push(new URL('./slots/'+file+'.jpg',import.meta.url).href,placeholder);
  return [...new Set(sources)];
}
export const gearIcon=item=>equipmentImageSources(item)[0];
const requests=new WeakMap();
export function setEquipmentImage(image,item,slot='empty') {
  const sources=equipmentImageSources(item,slot),request={};let index=0;
  requests.set(image,request);
  const show=()=>{
    image.dataset.iconFallback=String(index>=(sources.length-2));
    image.src=sources[index];
  };
  image.onerror=()=>{
    if(requests.get(image)!==request)return;
    if(index<sources.length-1){index++;show()}
    if(index===sources.length-1)image.onerror=null;
  };
  show();
}
