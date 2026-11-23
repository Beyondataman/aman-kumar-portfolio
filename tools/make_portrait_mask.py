"""Usage: python3 tools/make_portrait_mask.py public/images/aman-portrait.jpg src/assets/aman-portrait.webp [threshold=0.84] [close_radius=12] [preview]
(the committed asset was made with threshold 0.76, radius 12)

Build aman-portrait.webp with an alpha mask: white studio backdrop -> transparent.
flood-fill near-white from the image border, close narrow gaps (shirt collar), fill holes, feather."""
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

src, out = sys.argv[1], sys.argv[2]
g = Image.open(src).convert('L')
a = np.asarray(g, dtype=np.float32) / 255.0
H, W = a.shape

bright = a > float(sys.argv[3]) if len(sys.argv) > 3 else a > 0.84
lab, n = ndi.label(bright)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(border))
subject = ~bg
r = int(sys.argv[4]) if len(sys.argv) > 4 else 12
st = ndi.generate_binary_structure(2, 1)
pad = r + 4
padded = np.pad(subject, pad, mode='edge')  # replicate edges: no border artefacts
padded = ndi.binary_closing(padded, structure=st, iterations=r)
subject = padded[pad:-pad, pad:-pad]
# fill only small enclosed pockets (real backdrop gaps, e.g. under the chin, stay open)
holes = ndi.binary_fill_holes(subject) & ~subject
hl, hn = ndi.label(holes)
if hn:
    sizes = ndi.sum(holes, hl, range(1, hn + 1))
    small = np.isin(hl, [i + 1 for i, sz in enumerate(sizes) if sz < 400])
    subject = subject | small
subject = ndi.binary_opening(subject, structure=st, iterations=2)  # drop specks
alpha = Image.fromarray((subject * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
rgba = Image.merge('RGBA', [g, g, g, alpha])
rgba.save(out, 'WEBP', quality=82, method=6, exact=False)
if len(sys.argv) > 5:
    prev = Image.new('RGB', (W, H), (40, 0, 60)); prev.paste(g.convert('RGB'), mask=alpha)
    prev.save(out.replace('.webp', '-preview.png'))
print(W, H, subject.mean())
