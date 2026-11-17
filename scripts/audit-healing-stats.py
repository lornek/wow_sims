"""Recover passive SoD healing/damage from a pinned WoWSims Wowhead tooltip cache.
Usage: python scripts/audit-healing-stats.py TOOLTIP_CSV UPSTREAM_COMMIT
Only flat, unconditional Equip bonuses are recognized. Uses/procs/set bonuses are excluded.
"""
import hashlib, html, json, pathlib, re, sys
root=pathlib.Path(__file__).resolve().parent.parent
patterns=[
 (re.compile(r'^Increases healing done by up to (\d+) and damage done by up to (\d+) for all magical spells and effects'), 'separate'),
 (re.compile(r'^Increases healing done by spells and effects by up to (\d+)\.'),'healing'),
 (re.compile(r'^Increases damage and healing done by magical spells and effects by up to (\d+)\.'),'shared'),
]
def passive_bonuses(raw):
 text=html.unescape(re.sub(r'<[^>]*>',' ',raw)); text=re.sub(r'\s+',' ',text)
 healing=damage=0; quotes=[]; haste=0
 for segment in re.split(r'Equip:\s*',text)[1:]:
  for pattern,kind in patterns:
   m=pattern.match(segment)
   if m:
    first=int(m[1]); healing+=first
    damage+=int(m[2]) if kind=='separate' else first if kind=='shared' else 0
    quotes.append(segment.split(' Equip:')[0].split(' Use:')[0].split(' Sell Price:')[0][:350]);break
  m=re.match(r'^Increases your casting speed by (\d+)%\.',segment)
  if m:haste+=int(m[1])
 return ({'power':healing,'spellDamage':damage} if quotes else {}),quotes,haste
if __name__=='__main__':
 cache=pathlib.Path(sys.argv[1]); revision=sys.argv[2]
 catalog_file=root/'public/healing/catalog/items.json';catalog=json.loads(catalog_file.read_text())
 overrides_file=root/'scripts/gear-catalog-overrides.json';overrides=json.loads(overrides_file.read_text())
 records={}
 for line in cache.open():
  key,raw=line.split(',',1);records[int(key)]=json.loads(raw)
 changed=[]
 for item in catalog['items']:
  if item['source']!='Season of Discovery':continue
  tooltip=records.get(item['id']);
  if not tooltip or tooltip.get('name')!=item['name']:continue
  stats,quotes,haste=passive_bonuses(tooltip.get('tooltip',''))
  if haste:stats['haste']=haste
  differences={key:value for key,value in stats.items() if value!=item['stats'].get(key,0)}
  if not any(key in differences for key in ['power','haste']):continue
  before=dict(item['stats']);item['stats'].update(stats)
  verification={'url':f"https://www.wowhead.com/classic/item={item['id']}",
    'repository':'https://github.com/wowsims/sod','revision':revision,'file':'assets/db_inputs/wowhead_item_tooltips.csv',
    'note':'Passive Equip bonuses from cached tooltip; no Use, proc or set bonuses. Atiesh includes its always-on owner party aura once.',
    'passiveBonuses':quotes}
  entry=overrides.setdefault(item['key'],{});entry.setdefault('stats',{}).update(stats);entry['verification']=verification
  item['verification']=verification
  if 'Use:' in html.unescape(re.sub(r'<[^>]*>',' ',tooltip.get('tooltip',''))):item['effects']=True;entry['effects']=True
  changed.append({'key':item['key'],'name':item['name'],'before':before,'after':item['stats']})
 source={'repository':'https://github.com/wowsims/sod','revision':revision,'file':'assets/db_inputs/wowhead_item_tooltips.csv','sha256':hashlib.sha256(cache.read_bytes()).hexdigest(),'purpose':'Passive healing/damage stat audit'}
 catalog['sources']=[s for s in catalog['sources'] if s.get('purpose')!=source['purpose']]+[source]
 encoded=json.dumps(catalog,separators=(',',':'));catalog_file.write_text(encoded)
 (root/'public/healing/catalog/version.mjs').write_text('export const catalogVersion = '+json.dumps(hashlib.sha256(encoded.encode()).hexdigest()[:12])+';\n')
 overrides_file.write_text(json.dumps(overrides,indent=2)+'\n')
 report=root/'docs/healing-stat-audit.json';
 if changed or not report.exists():report.write_text(json.dumps({'source':source,'changedItems':changed},indent=2)+'\n')
 print(f'{len(changed)} items corrected; audit saved to {report}')
