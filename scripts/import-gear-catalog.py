"""Normalize pinned WoWSims snapshots. Usage: python scripts/import-gear-catalog.py /tmp/healbot-catalog"""
import json,sys,pathlib,hashlib,re
root=pathlib.Path(sys.argv[1]); out=pathlib.Path('public/healing/catalog')
modern={0:'strength',1:'agility',2:'stamina',3:'intellect',4:'power',5:'spellDamage',13:'spirit',18:'crit',27:'armor',28:'armor',29:'health',30:'mana',31:'mp5'}
old={0:'strength',1:'agility',2:'stamina',3:'intellect',4:'spirit',5:'power',12:'mp5',14:'crit',23:'mana',26:'armor',34:'health',41:'power',42:'spellDamage'}
def stats(raw,mapping,modern=False):
 result={}
 for n,v in (raw.items() if isinstance(raw,dict) else enumerate(raw)):
  key=mapping.get(int(n))
  if key and v:result[key]=result.get(key,0)+(v/14 if key=='crit' and modern else v)
 return result
overrides=json.loads((pathlib.Path(__file__).with_name('gear-catalog-overrides.json')).read_text())
items=[];enchants=[];sources=[]
for filename,realm,mapping in [('db.json','Forever',modern),('sod.json','Season of Discovery',old)]:
 raw=(root/filename).read_bytes();d=json.loads(raw);sources.append({'repository':'https://github.com/wowsims/'+('forever' if realm=='Forever' else 'sod'),'sha256':hashlib.sha256(raw).hexdigest(),'file':'assets/database/db.json'})
 for i in d['items']:
  scale=i.get('scalingOptions',{}).get('0',{});s=stats(scale.get('stats',i.get('stats',{})),mapping,realm=='Forever')
  
  if realm!='Forever':
   i={**i,'classAllowlist':[{1:11,2:3,3:8,4:2,5:5,6:4,7:7,8:9,9:1}.get(c,c) for c in i.get('classAllowlist',[])],'rangedWeaponType':{4:6,5:7,6:4,7:8,8:5}.get(i.get('rangedWeaponType'),i.get('rangedWeaponType',0)),'reqLvl':i.get('requiresLevel',0)}
  items.append({**{k:i[k] for k in ['id','name','icon','type','armorType','weaponType','handType','rangedWeaponType','classAllowlist','unique','reqLvl','quality','phase'] if k in i},'key':realm+':'+str(i['id']),'source':realm,'ilvl':scale.get('ilvl',i.get('ilvl',0)),'twoHand':i.get('handType')==4,'stats':s,'effects':bool(i.get('itemEffects') or i.get('setName') or i.get('setId'))})
  override=overrides.get(items[-1]['key'])
  if override:
   items[-1]['stats'].update(override.get('stats',{}))
   items[-1].update({k:v for k,v in override.items() if k!='stats'})
 if realm=='Forever':
  for e in d['enchants']:
   s=stats(e.get('stats',[]),mapping,True)
   if not s:continue
   enchants.append({**{k:e[k] for k in ['name','icon','type','extraTypes','enchantType','classAllowlist'] if k in e},'id':str(e['effectId'])+':'+str(e.get('spellId',0)),'stats':s})
payload={'version':1,'sources':sources,'items':items,'enchants':enchants}
encoded=json.dumps(payload,separators=(',',':'));version=hashlib.sha256(encoded.encode()).hexdigest()[:12]
(out/'items.json').write_text(encoded);(out/'version.mjs').write_text('export const catalogVersion = '+json.dumps(version)+';\n')
(out/'LICENSE.txt').write_text((root/'license.txt').read_text())
print(len(items),'items;',len(enchants),'enchants;',len(encoded),'bytes; version',version)
