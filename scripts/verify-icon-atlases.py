"""Verify count, identity, crop bounds, and exact lossless reconstruction of both atlases."""
import json,pathlib
from PIL import Image,ImageChops
root=pathlib.Path(__file__).resolve().parent.parent
public=root/'public/healing/custom-icons'
manifest=json.loads((public/'catalog.json').read_text())
assert len(manifest['icons'])==200
assert len({icon['id']for icon in manifest['icons']})==200
for spec in manifest['sets']:
    original=Image.open(root/'assets/icon-atlases'/spec['sourceFilename']).convert('RGB')
    reconstructed=Image.new('RGB',original.size)
    icons=[icon for icon in manifest['icons']if icon['set']==spec['id']]
    assert len(icons)==100
    for icon in icons:
        path=public/icon['path'];image=Image.open(path).convert('RGB')
        assert image.size==(icon['width'],icon['height'])
        box=tuple(icon['sourceBox'])
        assert ImageChops.difference(image,original.crop(box)).getbbox()is None
        assert icon['number']==(icon['row']-1)*10+icon['column']
        reconstructed.paste(image,box[:2])
    assert ImageChops.difference(reconstructed,original).getbbox()is None
    print(spec['id']+': 100 icons; all source pixels preserved exactly.')
