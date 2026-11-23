"""Usage: python3 tools/make_portrait_mask.py tools/source/aman-portrait.jpg src/assets/aman-portrait.webp [threshold=0.84] [close_radius=12] [preview]
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

# smooth the hair silhouette: a large round closing on the head only, so stray
# tufts and the gaps between them read as one continuous curve in the mosaic
head = int(H * 0.44)
yy, xx = np.mgrid[-26:27, -26:27]
disk = (xx * xx + yy * yy) <= 26 * 26
top = np.pad(subject[:head + 40], 30, mode='edge')
top = ndi.binary_closing(top, structure=disk)[30:-30, 30:-30]
subject[:head] = top[:head]

# then make the crown a convex dome (no dips between tufts): above the
# forehead, fill each column down from the upper convex hull of the hair line
crown = int(H * 0.25)
hair = subject.copy()  # before the dome: colours come from real hair only
cols = [x for x in range(W) if subject[:crown, x].any()]
if cols:
    pts = [(x, int(np.argmax(subject[:crown, x]))) for x in cols]
    hull = []  # upper hull (smallest y) with a monotone chain
    for p in pts:
        while len(hull) >= 2 and ((hull[-1][0] - hull[-2][0]) * (p[1] - hull[-2][1]) - (hull[-1][1] - hull[-2][1]) * (p[0] - hull[-2][0])) <= 0:
            hull.pop()
        hull.append(p)
    hx = np.array([h[0] for h in hull]); hy = np.array([h[1] for h in hull])
    for x, y0 in pts:
        ytop = int(round(np.interp(x, hx, hy)))
        subject[ytop:y0, x] = True  # only the gap between the hull and the hair

# no white fringe: pixels near/outside the edge take the colour of the nearest
# interior pixel, so partly-transparent edge cells are not tinted by the backdrop
inner = ndi.binary_erosion(hair, structure=st, iterations=3)
# around the crown, backdrop shows through the strands: only dark hair may donate colour
donor = inner.copy()
donor[:int(H * 0.3)] &= a[:int(H * 0.3)] < 0.35
_, (iy, ix) = ndi.distance_transform_edt(~donor, return_indices=True)
garr = np.asarray(g)
edge_dist = ndi.distance_transform_edt(subject)
crown_band = np.zeros_like(subject); crown_band[:int(H * 0.3)] = True
see_through = crown_band & (a > 0.5) & (edge_dist < 30)  # backdrop between strands
keep = inner & ~see_through
g = Image.fromarray(np.where(keep, garr, garr[iy, ix]))
alpha = Image.fromarray((subject * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
rgba = Image.merge('RGBA', [g, g, g, alpha])
rgba.save(out, 'WEBP', quality=82, method=6, exact=False)
if len(sys.argv) > 5:
    prev = Image.new('RGB', (W, H), (40, 0, 60)); prev.paste(g.convert('RGB'), mask=alpha)
    prev.save(out.replace('.webp', '-preview.png'))
print(W, H, subject.mean())
