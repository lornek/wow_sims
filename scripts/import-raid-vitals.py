import json,re,pathlib,argparse,hashlib
parser=argparse.ArgumentParser(description='Import approximate level-60 health from pinned WoWSims gear presets')
parser.add_argument('--source',required=True,help='Snapshot root containing ui/specs')
parser.add_argument('--database',required=True)
args=parser.parse_args()
r=pathlib.Path(__file__).resolve().parents[1];src=pathlib.Path(args.source)/'ui/specs';db=json.load(open(args.database));by={i['id']:i for i in db['items']}
def slug(s):return re.sub('[^a-z0-9]+','_',s.lower().replace("'","").replace('’','')).strip('_')
def resolve(token):
 token=token.split('+')[0].strip();m=re.search(r'_(\d{4,})$',token)
 if m and int(m[1]) in by:return by[int(m[1])]
 name=re.sub(r'_ilvl\d+$','',token);candidates=[i for i in db['items'] if slug(i['name'])==name];
 if not candidates:return {'id':0,'name':token,'unresolved':True}
 return max(candidates,key=lambda i:i['id'])
def items(path):
 s=(src/path).read_text()
 if path.endswith('json'):
  j=json.loads(s);return [by[x['id']] for x in j.get('player',j).get('equipment',j).get('items',[]) if x.get('id') in by]
 lines=s.split('gear:',1)[-1].split('\n\n',1)[0].splitlines() if 'gear:'in s else s.splitlines()
 return [resolve(line.strip().split()[1]) for line in lines if re.match(r'\s*(head|neck|shoulder|back|chest|wrist|hands|waist|legs|feet|finger\d|trinket\d|main_hand|off_hand|ranged)\s+',line)]
paths={'Cairne':('warrior',1689,110,'warrior/protection/gear_sets/prebis_balanced.gear.json'),'fury':('warrior',1689,110,'warrior/dps/gear_sets/prebis_fury.gear.json'),'protectionPaladin':('paladin',1381,100,'paladin/protection/gear_sets/default.gear.siml'),'retribution':('paladin',1381,100,'paladin/retribution/gear_sets/default.gear.siml'),'Sylvanas':('hunter',1467,90,'hunter/dps/gear_sets/prebis_turret.gear.siml'),'Jaina':('mage',1370,45,'mage/dps/gear_sets/preraidFire.gear.json'),'Illidan':('rogue',1523,75,'rogue/dps/gear_sets/sinister.gear.json'),'mutilate':('rogue',1523,75,'rogue/dps/gear_sets/muti.gear.json'),'enhancement':('shaman',1280,98,'shaman/enhancement/builds/default.build.json'),'elemental':('shaman',1280,95,'shaman/elemental/builds/default.build.json'),'shadow':('priest',1397,50,'priest/dps/gear_sets/default.gear.siml'),'balance':('druid',1483,70,'druid/balance/defaults.siml'),'affliction':('warlock',1414,65,'warlock/dps/gear_sets/aff_wrack.gear.json'),'destruction':('warlock',1414,65,'warlock/dps/gear_sets/destro.gear.json')}
out={}
for spec,(cls,hp,sta,path)in paths.items():
 it=items(path);gear=sum(i.get('scalingOptions',{}).get('0',{}).get('stats',{}).get('2',0)for i in it);health=sum(i.get('scalingOptions',{}).get('0',{}).get('stats',{}).get('29',0)for i in it)
 enchantStamina=38 if spec in ['Cairne','protectionPaladin'] else 0
 enchantHealth=200 if enchantStamina else 0
 racialStamina=2 if spec=='Cairne' else 0
 healthMultiplier=1.05 if spec=='Cairne' else 1
 health+=enchantHealth
 out[spec]={'healthMultiplier':healthMultiplier,'enchantEffects':[1503,1503,1892,1886,929,7663] if enchantStamina else [],'enchantStamina':enchantStamina,'enchantHealth':enchantHealth,'racialStamina':racialStamina,'className':cls,'baseHealth':hp,'stamina':sta+gear+enchantStamina+racialStamina,'gearHealth':health,'source':'ui/specs/'+path,'items':[i['id'] for i in it if i['id']],'unresolved':[i['name'] for i in it if i.get('unresolved')]}
 print(spec,len(it),'sta',sta+gear,'hp',hp+max(0,sta+gear-20)*10+health,'unresolved',[i['name'] for i in it if i.get('unresolved')])
(r/'public/healing/raid-vitals.json').write_text(json.dumps({'revision':'6fdf2180b86b67b2589b43294308e90194240f5c','databaseSha256':hashlib.sha256(pathlib.Path(args.database).read_bytes()).hexdigest(),'profiles':out},indent=2)+'\n')
(r/'public/healing/raid-vitals.mjs').write_text('// Item Stamina from WoWSims preset equipment; provenance in raid-vitals.json.\nexport const raidVitals='+json.dumps(out,separators=(',',':'))+';\nexport function combatantVitals(spec){const p=raidVitals[spec];return p?{stamina:p.stamina,healthMultiplier:p.healthMultiplier??1,max:Math.round((p.baseHealth+Math.max(0,p.stamina-20)*10+p.gearHealth)*(p.healthMultiplier??1))}:{};}\n')
