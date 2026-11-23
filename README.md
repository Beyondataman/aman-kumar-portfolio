# Aman Kumar — Portfolio + Analytics Hall

One connected site with two distinct experiences:

| Route | Experience |
|---|---|
| `/` | **Home.** Single page: particle-mosaic portrait hero → About (Intro + skill marquee) → Skills (numbered accordion) → Selected work → Contact. Text lives in `home` in `src/data/profile.js` |
| `/analytics` | **Analytics.** How I work (Question → Data → Insight → Build, shown in the NVIDIA case) and every tool with evidence of where it was used |
| `/hall` | **The Analytics Hall.** Horizontal gallery: each company floats on a cloud of cubes with its 3D mark and orbiting cubes |
| `/workspace/:companyId` | **Company analytical workspace** (3D instrument sidebar + interactive dashboard). Live: `nvidia` |
| `/projects/:projectId` | Project detail destinations: `tedxisme`, `linux-lab`, `portfolio` |

## Run it

> **Don't double-click `index.html`** in this folder — it is the *source* entry point and only works through
> the dev server (opening it directly shows a blank page). To just look at the site, double-click
> **`OPEN-ME.html`** instead: a self-contained build that works straight from Finder.

```bash
npm install
npm run dev          # then open http://localhost:5173 in your browser
npm run build        # production build (BrowserRouter) → dist/
npm run build:hash   # HashRouter + relative paths → works on any static host
npm run build:file   # one self-contained HTML file → dist-file/index.html (opens from Finder)
npm run preview
```

Deploying `dist/` from `npm run build` needs an SPA fallback so `/hall` etc. resolve.
`vercel.json` (Vercel) and `public/_redirects` (Netlify) are included. For GitHub Pages
or any host without rewrites, use `npm run build:hash`.

## What to fill in (all in one place)

Everything personal lives in **`src/data/profile.js`**. Values wrapped in `TODO('…')`
render as dashed **"to add"** placeholders on the site, so nothing invented is shown as fact.

- **Contact**: email, LinkedIn, GitHub, résumé link
- **BSc years** (Meerut College)
- **E-Cell** and **event planning** details
- **TEDxISME project**: problem, your role, technologies, implementation details, status, GitHub / live links
- **Linux lab**: goals, tools, experiments
- **Skill levels** (`applied` / `practicing` / `learning`) — these are starting assumptions; please confirm each one
- **Screenshots**: put images in `public/screenshots/` and set `src: '/screenshots/your-file.png'` on the project

### Company logos
Pillars show a typographic name plate by default. To use a real logo you have the right to use,
add the file to `public/logos/` and set `logo: '/logos/nvidia.svg'` on the company in
`src/data/companies.js`.

### Adding a company / case study
1. Append an entry to `companies` in `src/data/companies.js` (`slot` = position, `height` = pillar height).
2. Leave `caseStudy: false` until the analysis exists — the pillar then shows *Case study in progress* and does not open.
3. For a dashboard: create `src/cases/<id>/index.jsx` exporting `meta`, `years`, `bars`, `SECTIONS`, `VIEWS`, `FILTERS_FOR`, `PLATFORMS` (copy the NVIDIA case as a template), register it in `caseStudies`, and set `caseStudy: true`.

## NVIDIA case study — data

`src/cases/nvidia/data.js` holds every figure (USD millions, GAAP, FY22–FY26, plus Q1 FY25–Q4 FY26),
with sources listed in the file and on the *Dataset & Sources* view (which also offers a CSV download).
All ratios, growth rates and CAGRs are computed in the browser from those raw values. Last reviewed: November 2026.

## v2 motion system & templates

Two animation libraries, each with one job:

| Library | Used for | Where |
|---|---|---|
| **Anime.js v4** (`animejs`) | text splitting, staggers, SVG line drawing, count-ups, scroll-linked progress | `src/motion/anime.js` (hooks: `useSplitReveal`, `useReveal`, `useDraw`, `useCountUp`, `useScrub`) |
| **Motion for React** (`motion`) | hover/press, magnetic buttons, mount/unmount presence | `src/motion/motion.jsx` (`MotionRoot`, `Lift`, `Magnetic`, `Presence`) |

All motion turns off when the visitor's OS asks for reduced motion. Motion's engine is loaded on demand and only on pages wrapped in `<MotionRoot>`, so the home page's first bundle stays small.

Reusable templates live in `src/templates/` — preview them all at **`/templates`** (not linked from the site):

- `PageHero`: kicker, split-text headline (`*word*` = italic serif accent, `|` = line break), lede and actions.
- `CardGrid` + `Card`: staggered grid with hover lift.
- `HScrollTrack`: horizontal shelf. It pins and scrolls sideways on desktop and becomes a swipe row on phones.
- `CaseStudyLayout` + `CaseSection`, `Steps`, `Sources`: Problem → Approach → Evidence → Outcome with a sticky section rail. Project pages use it.
- `charts.jsx`: `LineDraw`, `BarRace` and `StatBand`, small SVG charts that animate as they appear.

Type: Inter Tight (display), Instrument Serif italic (accents), Inter (body), JetBrains Mono (labels). Palette tokens are at the top of `src/styles/base.css`.

## Company logos in the Hall

Each company floats on a cloud of cubes with its logo extruded into a solid 3D mark. The logo files are in
`src/assets/company-logos/<id>.svg` (ids from `src/data/companies.js`). NVIDIA, Apple, Google, Meta and AMD come
from [Simple Icons](https://simpleicons.org) (CC0 icon data; the marks remain trademarks of their owners, used here
only to identify the companies analysed). Microsoft, Amazon and TSMC are not in that set, so they show their ticker in
solid cubes; drop a single-colour SVG named `microsoft.svg`, `amazon.svg` or `tsmc.svg` in that folder to replace it.
Each mark uses the brand colour (`BRAND` in `src/three/HallWorld.jsx`; Google is painted in its four colours). Analysed companies (`caseStudy: true`) get full colour, a polished finish, a glow and a halo; the rest are matte and dimmed.

## Architecture notes (performance spec)

- **One persistent WebGL canvas** (`src/three/Stage.jsx`) for every route → exactly one GPU context; worlds are never
  re-created. Home (the portrait mosaic, `HeroWorld.jsx` + `mosaic.js`), Hall and Workspace are separate "worlds" in the same scene;
  inactive worlds are hidden, and the Hall/Workspace worlds are lazy-mounted on first visit then kept.
- **Shared light rig**: lights are never added/removed on route change (avoids shader recompiles); worlds only retarget them.
- **Portrait mosaic**: one `THREE.Points` draw call (one square per grid cell, sampled from `src/assets/aman-portrait.webp`; the white backdrop is removed by the image's alpha mask). Fewer, larger squares on phones; the canvas stops rendering once the hero is scrolled away.
- **Instancing**: Hall pillars and the instrument arc use `InstancedMesh`.
- **Demand-based rendering**: `frameloop="demand"`; full rate only while scrolling / pointer moves / transitions,
  a 30 fps ambient rate on the home hero and in the Hall, and **zero** frames while reading a dashboard. Paused in hidden tabs.
- **Adaptive quality**: device-based starting tier + `PerformanceMonitor` → DPR, bloom, depth-of-field (Hall only), reflective floor.
- **Code splitting**: three.js, the home sections below the hero, the Hall, the Workspace, Recharts and the NVIDIA dataset are
  separate chunks; the Hall chunk is prefetched a few seconds after the home page loads; the dashboard chunk is prefetched during
  the camera flight into a pillar.
- **GPU disposal**: geometries, materials and canvas textures are disposed on unmount.
- **State restoration**:
  - Home saves its scroll position; returning from the Hall, a workspace or a project restores it and skips the intro
    (the intro plays once per browser session).
  - Hall saves its scroll track position and selected company.
  - Workspace keeps view + filters in the URL (`?view=&from=&to=&unit=&hide=`) and session storage; view changes use
    `replace`, so browser **Back** goes to the Hall, not through every tab.
  - "Return" buttons use `history.back()` when the destination is the previous entry, otherwise a fresh navigation that still restores.
- Tested: forward/back navigation, repeated Hall ↔ Workspace ↔ Home loops (canvas count stays 1), mobile layouts, reduced-motion.

## 3D assets (made in Blender)

`blender/make_assets.py` builds every asset in `src/assets/` with Blender's Python API:

| File | What it is |
|---|---|
| `env-pieces.glb` | 4 bevelled architectural pieces (clean, chipped, stepped, split) — boolean cuts, 4-segment bevels, weighted normals |
| `core-shard.glb` | crystalline shard (used by the v1 story; kept for reuse) |
| `surface.webp` | **seamless** surface map baked in Cycles (R height · G roughness · B tone): layered 4D noise + Voronoi fracture seams. Baked at 2048², shipped as a 1024² WebP (~190 KB) |
| `logos/*.png` | skill logos for the Extras panel, cut from the LinkedIn banner with `python3 tools/cut_banner_logos.py <banner.png> src/assets/logos` (background keyed out). Add more by dropping a transparent PNG/SVG named like the `logo` field in `home.extras` (`src/data/profile.js`); tiles without a file show a generic icon |
| `aman-portrait.webp` | the hero portrait with an alpha mask (backdrop removed, collar/neck kept) — rebuild with `python3 tools/make_portrait_mask.py public/images/aman-portrait.jpg src/assets/aman-portrait.webp 0.76 12` |

The surface is applied with **triplanar mapping** (`src/three/assets.js → applySurface`) using each piece's real scaled size,
so detail never stretches on scaled pieces. It drives bump, roughness and tone on the Hall pillars.

Regenerate (Blender 4.2+ or `pip install bpy`):

```bash
blender -b -P blender/make_assets.py -- src/assets      # with the Blender app
python3 blender/make_assets.py src/assets               # with the bpy module
```

## Accessibility

Real DOM text for every section (the canvas is decorative, `aria-hidden`), a keyboard-reachable accordion, nav and company index, every chart has a *Table view*, and `prefers-reduced-motion` is respected.
