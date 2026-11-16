"""Crop the reviewed atlas seams; generate lossless tiles and a shared visual catalog.
Requires Pillow. Run from repository root: python scripts/split-icon-atlases.py
"""
import csv, hashlib, json, pathlib, re, zipfile
from PIL import Image, ImageDraw, ImageFont, ImageOps
ROOT=pathlib.Path(__file__).resolve().parent.parent
source=ROOT/'assets/icon-atlases'
output=ROOT/'public/healing/custom-icons'
config=json.loads((source/'catalog.json').read_text())
try:
    font=ImageFont.truetype('DejaVuSans.ttf',12)
except OSError:
    font=ImageFont.load_default()
all_icons=[]; sets=[]
for spec in config['sets']:
    original=source/spec['source']; image=Image.open(original).convert('RGB')
    xs,ys=spec['x'],spec['y']
    assert len(xs)==len(ys)==11 and xs[0]==ys[0]==0
    assert xs[-1]==image.width and ys[-1]==image.height
    assert all(a<b for edges in (xs,ys) for a,b in zip(edges,edges[1:]))
    assert len(spec['rows'])==10 and all(len(row)==10 for row in spec['rows'])
    directory=output/spec['id'];directory.mkdir(parents=True,exist_ok=True)
    contact=Image.new('RGB',(1300,1550),'#17120d'); draw=ImageDraw.Draw(contact)
    draw.text((12,8),spec['title']+' — rows 1–10, columns 1–10',fill='#ead6a4',font=font)
    icons=[]
    for r,row in enumerate(spec['rows']):
        for c,title in enumerate(row):
            number=r*10+c+1
            slug=re.sub(r'[^a-z0-9]+','-',title.lower()).strip('-')
            filename=f'{number:03d}-{slug}.png'
            box=(xs[c],ys[r],xs[c+1],ys[r+1]); tile=image.crop(box)
            tile.save(directory/filename,optimize=True)
            record={'id':f"{spec['id']}-{number:03d}",'set':spec['id'],'number':number,'row':r+1,'column':c+1,'name':title,'path':spec['id']+'/'+filename,'width':tile.width,'height':tile.height,'sourceBox':list(box),'tags':sorted(set(re.findall(r'[a-z]+',title.lower())))}
            legacy=spec.get('legacyReportIcons',{}).get(str(number))
            if legacy:
                record['legacyReportPath']='../report-icons/'+legacy
                record['tags'].append(pathlib.Path(legacy).stem)
            icons.append(record);all_icons.append(record)
            thumb=ImageOps.contain(tile,(118,118),Image.Resampling.LANCZOS)
            x,y=c*130+6,r*150+32
            contact.paste(thumb,(x+(118-thumb.width)//2,y+(118-thumb.height)//2))
            draw.text((x,y+121),f'{number:03d} · r{r+1:02d} c{c+1:02d}',fill='#ead6a4',font=font)
    contact.save(directory/'contact-sheet.jpg',quality=90,optimize=True)
    manifest={'id':spec['id'],'title':spec['title'],'sourceFilename':original.name,'sourceSha256':hashlib.sha256(original.read_bytes()).hexdigest(),'sourceSize':list(image.size),'xBoundaries':xs,'yBoundaries':ys,'icons':icons}
    (directory/'catalog.json').write_text(json.dumps(manifest,indent=2)+'\n')
    sets.append({k:v for k,v in manifest.items() if k!='icons'})
(output/'catalog.json').write_text(json.dumps({'version':1,'sets':sets,'icons':all_icons},indent=2)+'\n')
with (output/'catalog.csv').open('w',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=['id','set','number','row','column','name','path','width','height'],lineterminator='\n');writer.writeheader()
    writer.writerows({k:r[k] for k in writer.fieldnames}for r in all_icons)
with zipfile.ZipFile(output/'healing-and-mana-icons.zip','w',zipfile.ZIP_DEFLATED)as archive:
    for file in sorted(output.rglob('*')):
        if file.is_file()and file.suffix in ['.png','.jpg','.json','.csv']:
            archive.write(file,file.relative_to(output))
print(f'Exported {len(all_icons)} lossless icons across {len(sets)} sets.')
