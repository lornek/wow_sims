"""Extract the user-supplied role emblems; requires Pillow, not part of the site build."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
root = Path(__file__).resolve().parents[1]
source = Image.open(root / 'reference/ui/healbot_ui_ref_001.png').convert('RGBA')
assert source.size == (1008, 949), 'The crop coordinates require the original reference image.'
for role, x, y in [('tank', 527, 462), ('healer', 689, 462), ('dps', 850, 462)]:
    icon = source.crop((x - 22, y - 22, x + 22, y + 22))
    mask = Image.new('L', (44, 44))
    ImageDraw.Draw(mask).ellipse((1, 1, 42, 42), fill=255)
    icon.putalpha(mask.filter(ImageFilter.GaussianBlur(.35)))
    icon.save(root / f'public/healing/report-icons/role-{role}.png')
