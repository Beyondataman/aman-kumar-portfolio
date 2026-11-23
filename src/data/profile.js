/**
 * CENTRAL PROFILE DATA
 * --------------------------------------------------------------
 * Everything personal on the site is read from this file.
 * Anything marked TODO is a placeholder that still needs real,
 * verified information from Aman. The UI shows TODO values as
 * clearly-marked "to be added" states, never as facts.
 */

export const TODO = (label) => ({ todo: true, label })
export const isTodo = (v) => v && typeof v === 'object' && v.todo === true

export const profile = {
  name: 'Aman Kumar',
  first: 'AMAN',
  last: 'KUMAR',
  tagline: 'Business Analytics · Mathematics · Technology',
  contact: {
    email: 'b.aman14k2@gmail.com',
    linkedin: 'https://www.linkedin.com/in/aman14k',
    github: 'https://github.com/BeastBeyond',
    resume: TODO('Résumé PDF link'),
  },
}

/* ---------------- Chapter 2 — Foundation ---------------- */
export const education = [
  {
    id: 'pgdm',
    period: '2026 — 2028',
    degree: 'PGDM in Business Analytics',
    institution: 'ISME',
    place: 'Bengaluru',
    status: 'In progress',
    note: 'Post-graduate management programme with a specialisation in business analytics.',
  },
  {
    id: 'bsc',
    period: TODO('Years attended'),
    degree: 'BSc Mathematics',
    institution: 'Meerut College',
    place: 'Chaudhary Charan Singh University (CCSU)',
    status: null,
    note: 'Undergraduate degree in mathematics — the quantitative base under the analytics work.',
  },
]

/* ---------------- Chapter 3 — Exploration ----------------
 * level: 'applied' | 'practicing' | 'learning'
 * TODO(Aman): confirm each level — these are starting assumptions.
 */
export const SKILL_LEVELS = {
  applied: { label: 'Applied', hint: 'Used in real projects or coursework deliverables' },
  practicing: { label: 'Practicing', hint: 'Regular hands-on practice, building fluency' },
  learning: { label: 'Learning', hint: 'Actively studying the fundamentals' },
}

export const skillGroups = [
  {
    id: 'data',
    title: 'Data & Code',
    caption: 'Getting, shaping and querying data',
    skills: [
      { id: 'python', name: 'Python', level: 'practicing', note: 'Data cleaning, analysis scripts and automation.', evidence: TODO('A project, notebook or coursework where you used Python') },
      { id: 'sql', name: 'SQL', level: 'practicing', note: 'Querying, joining and aggregating relational data.', evidence: TODO('A project or coursework where you used SQL') },
      { id: 'linux', name: 'Technology & Linux', level: 'applied', note: 'Command line, system setup and self-hosted experiments.', evidence: [{ label: 'Linux & Technology Lab', to: '/projects/linux-lab' }, { label: 'TEDxISME platform', to: '/projects/tedxisme' }] },
    ],
  },
  {
    id: 'bi',
    title: 'BI & Visualisation',
    caption: 'Turning tables into decisions',
    skills: [
      { id: 'excel', name: 'Advanced Excel', level: 'applied', note: 'Lookups, pivots, modelling and reporting workbooks.', evidence: TODO('A workbook or coursework deliverable built in Excel') },
      { id: 'powerbi', name: 'Power BI', level: 'practicing', note: 'Data models, DAX measures and interactive reports.', evidence: TODO('A Power BI report you built') },
      { id: 'tableau', name: 'Tableau', level: 'learning', note: 'Visual analytics and dashboard storytelling.', evidence: TODO('A Tableau dashboard or course') },
    ],
  },
  {
    id: 'analysis',
    title: 'Analysis & Business',
    caption: 'Asking the right question first',
    skills: [
      { id: 'stats', name: 'Statistical Analysis', level: 'applied', note: 'Descriptive and inferential statistics from a mathematics base.', evidence: [{ label: 'BSc Mathematics — Meerut College' }] },
      { id: 'finance', name: 'Financial Analysis', level: 'learning', note: 'Reading filings, ratios, margins and growth.', evidence: [{ label: 'NVIDIA case study', to: '/hall' }] },
      { id: 'market', name: 'Market Research', level: 'learning', note: 'Framing questions, sizing markets, synthesising sources.', evidence: TODO('A market-research piece you worked on') },
      { id: 'ba', name: 'Business Analytics', level: 'practicing', note: 'Connecting data work to business outcomes.', evidence: [{ label: 'PGDM Business Analytics — ISME' }, { label: 'NVIDIA case study', to: '/hall' }] },
    ],
  },
]

/* ---------------- Chapter 4 — Building & Experience ---------------- */
export const experienceGroups = [
  {
    id: 'leadership',
    title: 'Leadership & Events',
    items: [
      {
        id: 'ecell',
        title: 'E-Cell activities',
        text: 'Involvement with the Entrepreneurship Cell.',
        detail: TODO('Role, institution and what you worked on in E-Cell'),
      },
      {
        id: 'events',
        title: 'Event planning & coordination',
        text: 'Planning and coordinating event responsibilities.',
        detail: TODO('Which events, your responsibilities, scale (attendees, team size)'),
      },
    ],
  },
  {
    id: 'technology',
    title: 'Technology Projects',
    items: [
      {
        id: 'tedx',
        title: 'TEDxISME technology project',
        text: 'Technology behind the TEDxISME event.',
        projectId: 'tedxisme',
      },
      {
        id: 'web',
        title: 'Website & backend development',
        text: 'Building the website and its backend.',
        projectId: 'tedxisme',
      },
      {
        id: 'ticketing',
        title: 'Registration & ticketing workflows',
        text: 'Attendee registration and ticketing flows.',
        projectId: 'tedxisme',
      },
      {
        id: 'linux',
        title: 'Linux & technology experimentation',
        text: 'Hands-on experiments with Linux and systems.',
        projectId: 'linux-lab',
      },
    ],
  },
]

/* ---------------- Project detail destinations ----------------
 * Route: /projects/:projectId
 * Every project follows the same structure required by the spec.
 */
export const projects = {
  tedxisme: {
    id: 'tedxisme',
    title: 'TEDxISME — Technology & Ticketing Platform',
    short: 'TEDxISME Platform',
    cta: 'Explore TEDx Project',
    kicker: 'Event technology',
    overview:
      'The technology project behind TEDxISME: the event website, its backend, and the registration and ticketing workflows attendees use to sign up.',
    problem: TODO('The problem the platform solved (e.g. manual registrations, ticket verification, attendee communication)'),
    role: TODO('Your exact role and responsibilities on the project'),
    technologies: TODO('Frameworks, languages, database, hosting and payment / ticketing services used'),
    implementation: [
      { title: 'Website', text: 'Public event site.', detail: TODO('Pages, content management, design decisions') },
      { title: 'Backend', text: 'Server-side logic and data storage.', detail: TODO('Architecture, data model, APIs') },
      { title: 'Registration & ticketing', text: 'Attendee sign-up and ticket flow.', detail: TODO('Steps from sign-up to entry, e.g. confirmation emails, QR check-in') },
    ],
    status: TODO('Project status (live, completed, archived) and dates'),
    screenshots: [
      { caption: 'Landing page', src: null },
      { caption: 'Registration flow', src: null },
      { caption: 'Ticket / check-in view', src: null },
    ],
    links: { github: TODO('GitHub repository'), live: TODO('Live URL') },
  },
  'linux-lab': {
    id: 'linux-lab',
    title: 'Linux & Technology Lab',
    short: 'Linux Lab',
    cta: 'Explore Linux Lab',
    kicker: 'Systems experimentation',
    overview: 'An ongoing space for hands-on experimentation with Linux and technology.',
    problem: TODO('What you set out to learn or build'),
    role: 'Self-directed — sole builder and operator.',
    technologies: TODO('Distributions, tools and services you have worked with'),
    implementation: [
      { title: 'Environment', text: 'Machines, VMs or containers used.', detail: TODO('Your setup') },
      { title: 'Experiments', text: 'Notable experiments and what each taught you.', detail: TODO('2–4 concrete experiments') },
    ],
    status: 'Ongoing',
    screenshots: [{ caption: 'Terminal / setup', src: null }],
    links: { github: TODO('Dotfiles or notes repository'), live: null },
  },
  portfolio: {
    id: 'portfolio',
    title: 'This Site — Portfolio + Analytics Hall',
    short: 'This Site',
    cta: 'Explore This Build',
    kicker: 'Web · 3D · Analytics',
    overview:
      'A single-page portfolio opened by a particle-mosaic portrait, and a separate Analytics Hall of company case studies, built as one connected web experience.',
    problem:
      'A conventional résumé shows a list. This site is meant to show how I think (the Analytics Hall and its case studies) and how I build, as well as who I am.',
    role: 'Content, analysis and build.',
    technologies: 'React, React Router, Three.js via React Three Fiber, Drei, Postprocessing, Anime.js, Motion, Recharts, Zustand, Vite.',
    implementation: [
      { title: 'Portrait mosaic', text: 'The hero portrait is thousands of GPU-drawn squares that fly in and settle on a grid sampled from a photo, with the studio background keyed out.' },
      { title: 'One persistent 3D stage', text: 'A single WebGL canvas is shared by every route, so worlds are never recreated and only one GPU context exists.' },
      { title: 'Resumable navigation', text: 'Your place on the home page is saved when you open the Hall or a project and restored when you come back.' },
      { title: 'Lazy analytics', text: 'The Hall, the dashboards and the charting library load only when a visitor goes there.' },
      { title: 'Adaptive quality', text: 'Resolution and post-processing scale with measured frame rate; rendering pauses when nothing moves.' },
    ],
    status: 'Live — first case study (NVIDIA) published.',
    screenshots: [],
    links: { github: TODO('GitHub repository'), live: null },
  },
}

export const projectOrder = ['tedxisme', 'linux-lab', 'portfolio']

/* ---------------- Analytics page (v2) ----------------
 * The loop from the v1 story ("Question → Data → Insight → Build"), each step
 * shown in the NVIDIA case. Skill evidence lives on each skill above.
 */
export const approach = [
  { id: 'question', title: 'Question', text: 'Start from the decision someone actually has to make.' },
  { id: 'data', title: 'Data', text: 'Find the sources, clean them, and question them.' },
  { id: 'insight', title: 'Insight', text: 'Model, visualise, and test what the numbers really say.' },
  { id: 'build', title: 'Build', text: 'Ship it as something people can use — a dashboard, a tool, a site.' },
]

/* ---------------- Home page (v2) ----------------
 * Text for the single-page home. **double asterisks** = bold in the bio,
 * *single* = italic accent in titles. Work titles keep their case as written. Keep everything factual — anything
 * not yet confirmed belongs in a TODO above, not here.
 */
export const home = {
  heroWord: 'PORTFOLIO', // the giant word across the hero
  role: { strong: 'Business Analytics', em: 'Student' },
  nav: [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    { id: 'work', label: 'Work' },
    { id: 'contact', label: 'Contact' },
  ],
  bio:
    "Hey, I'm **Aman**. I'm doing a **PGDM in Business Analytics** at **ISME, Bengaluru** (2026–2028), on top of a **BSc in Mathematics** from Meerut College. " +
    'I like starting from the decision someone has to make and working back to the data — my first full case study rebuilds **NVIDIA\'s FY22–FY26** story straight from its filings. ' +
    'Away from spreadsheets I worked on the technology behind **TEDxISME** — the website, backend and ticketing — and I keep a running **Linux** lab for systems experiments.',
  // rows of the skill marquee (alternate directions)
  stack: [
    ['Python', 'SQL', 'Advanced Excel', 'Power BI', 'DAX', 'Tableau', 'Pivot tables', 'Data cleaning'],
    ['Statistical Analysis', 'Financial Analysis', 'Market Research', 'Business Analytics', 'Reading filings', 'Ratios & margins', 'Growth analysis'],
    ['Linux', 'Command line', 'React', 'Three.js', 'Vite', 'Recharts', 'Git', 'GitHub'],
  ],
  servicesTitle: 'What I|*can do*',
  // numbered accordion; bullets come from skills where possible
  services: [
    {
      id: 'data', title: 'Data & Code',
      bullets: ['Python for cleaning, analysis & automation', 'SQL — joins, aggregations, querying', 'Repeatable scripts instead of manual steps'],
      text: 'Getting, shaping and querying data so the analysis starts from something trustworthy.',
    },
    {
      id: 'bi', title: 'BI & Visualisation',
      bullets: ['Advanced Excel — lookups, pivots, models', 'Power BI — data models & DAX measures', 'Tableau — visual analytics (learning)', 'Interactive reports & dashboards'],
      text: 'Turning tables into decisions: reports and dashboards someone can actually use.',
    },
    {
      id: 'analysis', title: 'Business & Financial Analysis',
      bullets: ['Statistical analysis from a maths base', 'Reading filings, ratios, margins & growth', 'Market research and sizing', 'Question → data → insight → decision'],
      text: 'Asking the right question first, then testing what the numbers really say.',
    },
    {
      id: 'cases', title: 'Company Case Studies',
      bullets: ['Figures sourced from 10-Ks & results releases', 'Interactive dashboards per company', 'Methodology and sources shown with every view'],
      text: 'The Analytics Hall: one company at a time, built from primary sources. NVIDIA is live; more are in progress.',
      cta: { label: 'Open the Analytics Hall', to: '/hall' },
    },
    {
      id: 'web', title: 'Web & Event Technology',
      bullets: ['Event website & backend (TEDxISME)', 'Registration & ticketing workflows', 'This site — React, Three.js, Vite'],
      text: 'Building the tools around the analysis, from an event platform to this portfolio.',
      cta: { label: 'View the TEDxISME project', to: '/projects/tedxisme' },
    },
    {
      id: 'systems', title: 'Linux & Systems',
      bullets: ['Command line & system setup', 'Self-hosted experiments', 'Hands-on experiments with tools & distributions'],
      text: 'An ongoing lab for hands-on experimentation with Linux and technology.',
      cta: { label: 'View the Linux lab', to: '/projects/linux-lab' },
    },
  ],
  workIntro: 'Analysis built from primary sources, and the technology projects around it.',
  // "BOLD *italic*" title + second line, per work row
  work: [
    { id: 'nvidia', to: '/hall', title: 'NVIDIA *case*', sub: 'From graphics to AI', media: 'chart',
      text: "An interactive case study of NVIDIA's FY22–FY26 growth — revenue mix, margins, geography and customer concentration — with every figure sourced from the company's filings.",
      links: [{ label: 'Analytics Hall', to: '/hall' }] },
    { id: 'tedxisme', to: '/projects/tedxisme', title: 'TEDxISME', sub: 'Event platform', media: 'ticket',
      text: 'The technology behind TEDxISME: the event website, its backend, and the registration and ticketing workflows attendees use to sign up.',
      links: [{ label: 'Project details', to: '/projects/tedxisme' }] },
    { id: 'linux-lab', to: '/projects/linux-lab', title: 'LINUX *lab*', sub: 'Systems experiments', media: 'terminal',
      text: 'An ongoing space for hands-on experimentation with Linux and technology.',
      links: [{ label: 'Project details', to: '/projects/linux-lab' }] },
    { id: 'portfolio', to: '/projects/portfolio', title: 'THIS *site*', sub: 'Web · 3D · Analytics', media: 'mosaic',
      text: 'A single-page portfolio with a particle-mosaic portrait, plus a separate Analytics Hall of company case studies — React, Three.js and Vite.',
      links: [{ label: 'How it is built', to: '/projects/portfolio' }] },
  ],
  contactTitle: 'Get in *touch*',
  contactText: 'For case studies, projects or opportunities — email is the fastest way to reach me.',
  // Extras panel (beside "Get in touch"): the skills from the LinkedIn banner + extras.
  // Each tile = mosaic logo + name (+ optional italic note).
  // Logo files: src/assets/logos/<logo>.png|svg|webp with a transparent background
  // (tools/cut_banner_logos.py cut them from the banner). Without a file the tile
  // shows a generic mosaic pictogram (`icon`). No brand logos are drawn by hand.
  extrasTitle: 'Extra *skills*',
  extras: [
    {
      id: 'technology', label: 'Technology', em: '& systems',
      items: [
        { id: 'linux', name: 'Linux', logo: 'linux' },
        { id: 'gnu', name: 'GNU/Linux', logo: 'gnu' },
        { id: 'arch', name: 'Arch Linux', logo: 'arch' },
        { id: 'debian', name: 'Debian', logo: 'debian' },
        { id: 'kali', name: 'Kali Linux', logo: 'kali' },
        { id: 'ubuntu', name: 'Ubuntu', logo: 'ubuntu', icon: 'terminal' },
        { id: 'os', name: 'macOS & Windows', logo: 'macos-windows', icon: 'laptop' },
        { id: 'git', name: 'Git & GitHub', note: 'Basic', logo: 'git', icon: 'branch' },
        { id: 'troubleshooting', name: 'Computer Troubleshooting', logo: 'troubleshooting', icon: 'wrench' },
      ],
    },
    {
      id: 'code', label: 'Code', em: '& tools',
      items: [
        { id: 'python', name: 'Python', logo: 'python' },
        { id: 'sql', name: 'SQL', logo: 'sql' },
        { id: 'c', name: 'C', note: 'Programming Language', logo: 'c' },
        { id: 'html', name: 'HTML', logo: 'html' },
        { id: 'css', name: 'CSS', logo: 'css' },
        { id: 'ai', name: 'Artificial Intelligence', logo: 'ai' },
        { id: 'overleaf', name: 'Overleaf', logo: 'overleaf' },
      ],
    },
    {
      id: 'creative', label: 'Creative', em: '& visual',
      items: [
        { id: 'video', name: 'Video Editing', note: 'DaVinci Resolve', logo: 'videoediting' },
        { id: 'photography', name: 'Photography', logo: 'photography', icon: 'camera' },
        { id: 'design', name: 'Graphic & Poster Design', logo: 'design', icon: 'pen' },
      ],
    },
  ],
}
