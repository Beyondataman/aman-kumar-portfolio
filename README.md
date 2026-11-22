# Aman Kumar — Personal Story + Analytics Hall

One connected site with two distinct experiences:

| Route | Experience |
|---|---|
| `/` | **Experience A — Personal Story.** Scroll-driven, 8 chapters: Origin → Foundation → Exploration → Building & Experience → Analytics Hall portal → The Story Continues → The Developer Engine → `sudo make me employable` |
| `/hall` | **Experience B — The Analytics Hall.** Spatial gallery of company monoliths |
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

## Architecture notes (performance spec)

- **One persistent WebGL canvas** (`src/three/Stage.jsx`) for every route → exactly one GPU context; the story
  object and environments are never re-created. Story, Hall and Workspace are separate "worlds" in the same scene;
  inactive worlds are hidden, and the Hall/Workspace worlds are lazy-mounted on first visit then kept.
- **Shared light rig**: lights are never added/removed on route change (avoids shader recompiles); worlds only retarget them.
- **Instancing**: environment slabs, the 144-shard core, the instrument arc — all `InstancedMesh`.
- **Demand-based rendering**: `frameloop="demand"`; full rate only while scrolling / pointer moves / transitions,
  a 30 fps ambient rate in Story and Hall, and **zero** frames while reading a dashboard. Paused in hidden tabs.
- **Adaptive quality**: device-based starting tier + `PerformanceMonitor` → DPR, bloom, depth-of-field (Hall only), reflective floor.
- **Code splitting**: three.js, the Hall, the Workspace, Recharts and the NVIDIA dataset are separate chunks; the Hall chunk is
  prefetched while the visitor reads chapter 4; the dashboard chunk is prefetched during the camera flight into a pillar.
- **GPU disposal**: geometries, materials and canvas textures are disposed on unmount.
- **State restoration**:
  - Story saves `{chapter, fraction}` continuously; returning from the Hall, a workspace or a project restores the exact
    position. Because the 3D object is a pure function of scroll position, its animation state is restored too.
  - Hall saves its scroll track position and selected company.
  - Workspace keeps view + filters in the URL (`?view=&from=&to=&unit=&hide=`) and session storage; view changes use
    `replace`, so browser **Back** goes to the Hall, not through every tab.
  - "Return" buttons use `history.back()` when the destination is the previous entry, otherwise a fresh navigation that still restores.
- Tested: forward/back navigation, repeated Hall ↔ Workspace ↔ Story loops (canvas count stays 1), mobile layouts, reduced-motion.

## 3D assets (made in Blender)

`blender/make_assets.py` builds every asset in `src/assets/` with Blender's Python API:

| File | What it is |
|---|---|
| `env-pieces.glb` | 4 bevelled architectural pieces (clean, chipped, stepped, split) — boolean cuts, 4-segment bevels, weighted normals |
| `core-shard.glb` | crystalline shard used for the story core's fragments |
| `surface.jpg` | 2048² **seamless** surface map baked in Cycles (R height · G roughness · B tone): layered 4D noise + Voronoi fracture seams |

The surface is applied with **triplanar mapping** (`src/three/assets.js → applySurface`) using each piece's real scaled size,
so detail never stretches on scaled pieces. It drives bump, roughness and tone on the story environment, the core's shards and the Hall pillars.

Regenerate (Blender 4.2+ or `pip install bpy`):

```bash
blender -b -P blender/make_assets.py -- src/assets      # with the Blender app
python3 blender/make_assets.py src/assets               # with the bpy module
```

## Accessibility

Real DOM text for every chapter (the canvas is decorative, `aria-hidden`), keyboard-reachable skill nodes and company index,
skill levels encoded by shape + label (not colour alone), every chart has a *Table view*, and `prefers-reduced-motion` is respected.
