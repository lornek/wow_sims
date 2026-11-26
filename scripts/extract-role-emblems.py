"""Extract the user-supplied role emblems; requires Pillow, not part of the site build."""
from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parents[1]
source = Image.open(root / 'reference/ui/healbot_ui_ref_001.png').convert('RGBA')
assert source.size == (1008, 949), 'The crop coordinates require the original reference image.'
for role, x, y in [('tank', 527, 462), ('healer', 689, 462), ('dps', 850, 462)]:
    icon = source.crop((x - 20, y - 20, x + 20, y + 20))
    mask = Image.new('L', (320, 320))
    ImageDraw.Draw(mask).ellipse((8, 8, 311, 311), fill=255)
    icon.putalpha(mask.resize((40, 40), Image.Resampling.LANCZOS))
    icon.save(root / f'public/healing/report-icons/role-{role}.png')
