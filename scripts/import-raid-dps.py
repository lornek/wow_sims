import json,subprocess,hashlib,pathlib,gzip,argparse
parser=argparse.ArgumentParser(description="Import the reduced raid DPS spell snapshot from a WoWSims Forever checkout")
parser.add_argument("--source",required=True);parser.add_argument("--ref",default="FETCH_HEAD");args=parser.parse_args()
git=["git","-C",args.source]
raw=gzip.decompress(subprocess.check_output(git+["show",args.ref+":assets/db_inputs/spell_store_inputs.json"]))
j=json.loads(raw);names={'warrior':['Bloodthirst','Whirlwind','Execute','Heroic Strike'],'rogue':['Shank','Mutilate','Rupture','Eviscerate','Slice and Dice'],'shaman':['Stormstrike','Flame Shock','Earth Shock','Lightning Bolt','Chain Lightning'],'druid':['Moonfire','Insect Swarm','Starfire','Wrath'],'priest':['Shadow Word: Pain','Devouring Plague','Mind Blast','Mind Flay','Shadow Word: Death'],'warlock':['Corruption','Bane of Agony','Siphon Life','Shadow Bolt','Immolate','Conflagrate','Incinerate','Shadowburn','Soul Fire'],'paladin':['Holy Strike','Consecration','Judgement','Holy Shield','Exorcism','Hammer of Wrath','Hammer of the Righteous']}
result={}
for cls,spells in names.items():
 roots=set(map(str,j['SpellDataGroupRoots'][cls]))
 for name in spells:
  ids=[id for id,n in j['Names'].items()if n==name and id in roots and j['Levels'].get(id,{}).get('SpellLevel',0)<=60 and j['Misc'].get(id) and (j['Powers'].get(id) or j['Cooldowns'].get(id,{}).get('GCDMs',0)>0)]
  if not ids: print('MISSING',name);continue
  id=max(ids,key=lambda id:(j['Levels'].get(id,{}).get('SpellLevel',0),int(id)));m=j['Misc'][id];p=j['Powers'].get(id,[{}])[0];cd=j['Cooldowns'].get(id,{})
  def effects(id,depth=0):
   out=[]
   for e in j['Effects'].get(id,[]):
    if e['Type']==64 and e.get('TriggerID') and depth<2:out+=effects(str(e['TriggerID']),depth+1)
    else:out.append({k:e.get(k,0)for k in ['Type','Aura','BasePoints','SPCoef','APCoef','PPL','PeriodMs','PointsPerResource']})
   return out
  result[name]={'id':int(id),'name':name,'className':cls,'level':j['Levels'].get(id,{}).get('SpellLevel',0),'cost':p.get('Cost',0)/(10 if p.get('Type')==1 else 1),'costPct':p.get('CostPct',0),'cast':m['CastTimeMs']/1000,'duration':m['DurationMs']/1000,'cooldown':max(cd.get('CooldownMs',0),cd.get('CategoryCooldownMs',0))/1000,'gcd':cd.get('GCDMs',1500)/1000,'school':m['School'],'effects':effects(id)}
root=pathlib.Path(__file__).resolve().parents[1];(root/'public/healing/raid-dps-data.mjs').write_text('// Extracted from the pinned Forever spell store; see docs/raid-dps-sources.json.\nexport const raidDpsSpells = '+json.dumps(result,separators=(',',':'))+';\n')
sha=subprocess.check_output(git+['rev-parse',args.ref],text=True).strip()
paths=['ui/specs/warrior/dps/apls/fury.apl.json','ui/specs/rogue/dps/apls/default.apl.json','ui/specs/shaman/elemental/builds/default.build.json','ui/specs/shaman/enhancement/builds/default.build.json','ui/specs/druid/balance/defaults.siml','ui/specs/priest/dps/apls/default.apl.siml','ui/specs/warlock/dps/builds/aff_wrack.build.json','ui/specs/warlock/dps/builds/destro.build.json','ui/specs/paladin/retribution/apls/default.apl.siml','ui/specs/paladin/protection/apls/default.apl.siml']
meta={'repository':'https://github.com/wowsims/forever','revision':sha,'spellInput':'assets/db_inputs/spell_store_inputs.json (gzip JSON)','spellInputSha256':hashlib.sha256(raw).hexdigest(),'clientBuilds':j['Builds'],'spells':{n:s['id']for n,s in result.items()},'priorityReferences':paths,'scope':'Reduced single-target training rotations, not an execution of the upstream APL. Gear, weapon statistics, talent reductions and proc simplifications are documented in healbot-raid-v2.md.'}
(root/'docs/raid-dps-sources.json').write_text(json.dumps(meta,indent=2)+'\n');print('Imported',len(result),'spells')
