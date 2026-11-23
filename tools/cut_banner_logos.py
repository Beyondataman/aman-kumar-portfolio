"""Cut the skill logos out of the LinkedIn banner and key out its paper/watercolour
background, so each can be drawn as a mosaic tile (src/pages/home/MosaicLogo.jsx).
Usage: python3 tools/cut_banner_logos.py banner.png src/assets/logos
Boxes are for the 1078x380 banner screenshot."""
import sys, colorsys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

BOXES = {
    'videoediting': (132, 22, 272, 140), 'linux': (305, 25, 415, 140), 'debian': (440, 30, 555, 140),
    'kali': (560, 30, 690, 135), 'arch': (718, 30, 835, 140), 'gnu': (888, 20, 985, 135),
    'overleaf': (55, 195, 145, 300), 'ai': (185, 195, 300, 300), 'c': (365, 190, 480, 300),
    'html': (500, 185, 615, 300), 'css': (628, 185, 745, 300), 'python': (800, 190, 920, 300),
    'sql': (950, 190, 1055, 300),
}

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
for name, box in BOXES.items():
    c = np.asarray(im.crop(box).resize(((box[2] - box[0]) * 2, (box[3] - box[1]) * 2), Image.LANCZOS), dtype=np.float32) / 255
    L = 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]
    mx, mn = c.max(-1), c.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    ink = (L < 0.5) | ((sat > 0.42) & (L < 0.9))
    ink = ndi.binary_opening(ink, iterations=1)
    lab, n = ndi.label(ink)
    if n:
        sizes = ndi.sum(ink, lab, range(1, n + 1))
        keep = [i + 1 for i, s in enumerate(sizes) if s >= max(30, 0.04 * sizes.max())]
        if name in ('overleaf',):  # a banner leaf sits next to the page icon
            keep = [int(np.argmax(sizes)) + 1]
        ink = np.isin(lab, keep)
    ink = ndi.binary_fill_holes(ink) if name in ('sql', 'c') else ink
    alpha = ndi.gaussian_filter(ink.astype(np.float32), 0.8)
    rgba = np.dstack([c, alpha])
    ys, xs = np.where(alpha > 0.1)
    if len(xs):
        pad = 4
        rgba = rgba[max(0, ys.min() - pad):ys.max() + pad, max(0, xs.min() - pad):xs.max() + pad]
    img = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')
    img.thumbnail((64, 64), Image.LANCZOS)  # tiles are drawn as a 16x16 mosaic: small is plenty
    img.save(f'{out}/{name}.png', optimize=True)
    print(name, rgba.shape)
