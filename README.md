# Aman Kumar — Portfolio + Analytics Hall

Live: **https://amankumar-analytics.vercel.app** (Vercel deploys every push to `main`).

| Route | Page |
|---|---|
| `/` | **Home.** Mosaic-portrait hero → About (bio + skill marquee) → Skills (numbered accordion) → Selected work → Contact (+ Extra skills tiles) |
| `/analytics` | **Analytics.** How I work (Question → Data → Insight → Build, shown in the NVIDIA case) and every tool with evidence of where it was used |
| `/hall` | **Analytics Hall.** Horizontal gallery: each company floats on a cloud of cubes under its solid 3D logo |
| `/workspace/:companyId` | **Company dashboard** (live: `nvidia`) |
| `/projects/:projectId` | Project pages: `tedxisme`, `linux-lab`, `portfolio` |

## Run, build, publish

```bash
npm install
npm run dev          # http://localhost:5173 — updates as you save
npm run build        # production build → dist/ (what Vercel runs)
npm run build:file   # one self-contained offline file → OPEN-ME.html (double-click to open)
npm run preview      # serve dist/ locally
```

**Publish:** commit on `main` and push (VS Code → Source Control → Commit → Sync Changes). Vercel builds with
`npm run build`; `vercel.json` sends every path to `index.html`. `OPEN-ME.html` is for offline viewing only and is not
committed.

## What to edit

- **`src/data/profile.js`** — everything personal: contact, education, skills (+ evidence), projects, the home page text
  (`home`), the Analytics steps (`approach`) and the Extra skills (`home.extras`). Values wrapped in `TODO('…')` show as
  dashed **"to add"** placeholders, so nothing unconfirmed is presented as fact.
- **`src/data/companies.js`** — companies in the Hall. `caseStudy: true` highlights the company and opens its dashboard
  (register a loader in `caseStudies`; copy `src/cases/nvidia/` as the template).
- **`src/cases/nvidia/data.js`** — every NVIDIA figure (USD millions, GAAP, FY22–FY26 + quarters) with sources; ratios and
  growth are computed from these raw values.
- **Screenshots** for projects: `public/screenshots/your-file.png`, then `src: '/screenshots/your-file.png'` on the project.

### Logos

- **Company logos (Hall):** `src/assets/company-logos/<id>.svg`, extruded into a solid 3D logo automatically. Colours are in
  `BRAND` / `SHAPE_COLOURS` at the top of `src/three/HallWorld.jsx`. NVIDIA, Apple, Google, Meta and AMD come from
  [Simple Icons](https://simpleicons.org); Microsoft and Amazon from Simple Icons v7. The marks remain trademarks of their
  owners, used only to identify the companies analysed (noted on the Hall page). **TSMC** still needs `tsmc.svg`
  (single colour); until then it shows its ticker in cubes.
- **Skill logos (Extra skills):** `src/assets/logos/<name>.png|svg` with a transparent background, named like the `logo`
  field in `home.extras`. The banner logos were cut with `python3 tools/cut_banner_logos.py <banner.png> src/assets/logos`.

### Portrait

`src/assets/aman-portrait.webp` is the photo with its backdrop removed (alpha mask, smoothed hair line). Rebuild it from
the original with:

```bash
python3 tools/make_portrait_mask.py tools/source/aman-portrait.jpg src/assets/aman-portrait.webp 0.76 12
```

## Motion system & templates

| Library | Used for | Where |
|---|---|---|
| **Anime.js v4** | text splitting, staggers, SVG drawing, count-ups, scroll-linked progress, timelines | `src/motion/anime.js` (`useSplitReveal`, `useReveal`, `useDraw`, `useCountUp`, `useScrub`) |
| **Motion for React** | hover/press, magnetic buttons, accordion, presence | `src/motion/motion.jsx` (`MotionRoot`, `Lift`, `Magnetic`, `Presence`) |

Everything turns off when the visitor's OS asks for reduced motion. Motion's engine loads on demand, only on pages wrapped
in `<MotionRoot>`.

Reusable templates in `src/templates/`: `PageHero` (`*word*` = italic serif accent, `|` = line break), `CardGrid` + `Card`,
`HScrollTrack` (pins and scrolls sideways on desktop, swipe row on phones), `CaseStudyLayout` + `CaseSection` / `Steps` /
`Sources`, and `charts.jsx` (`LineDraw`, `BarRace`, `StatBand`).

Type: Inter Tight (display), Instrument Serif italic (accents), Inter (body), JetBrains Mono (labels), all self-hosted
(WOFF2). Palette tokens: top of `src/styles/base.css`.

## Architecture

- **One persistent WebGL canvas** (`src/three/Stage.jsx`) for every route; worlds are never re-created:
  `HeroWorld` (portrait mosaic: one `THREE.Points` draw call + star field), `HallWorld` (instanced cube clouds, extruded
  logos; each island follows its DOM panel), `WorkspaceWorld` (dashboard backdrop). Hall and Workspace worlds mount on
  first visit.
- **Demand rendering**: full rate only while something moves, ~30 fps idle on the hero and Hall, zero frames on dashboards
  and once the hero has scrolled away; paused in hidden tabs. **Adaptive quality** moves resolution and bloom with frame rate.
- **Code splitting**: three.js, the home sections below the hero, the Hall, Analytics, the dashboard, Recharts and the
  NVIDIA data are separate chunks.
- **State restoration**: Home and Hall scroll positions are restored on return; dashboard view + filters live in the URL.
  The intro plays once per browser session.

## Accessibility

Real DOM text for every section (the canvas is decorative, `aria-hidden`), keyboard-reachable nav, accordion and gallery,
a *Table view* for every dashboard chart, screen-reader list of all extra skills, and `prefers-reduced-motion` respected.
