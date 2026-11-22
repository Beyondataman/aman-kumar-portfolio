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
      { id: 'python', name: 'Python', level: 'practicing', note: 'Data cleaning, analysis scripts and automation.' },
      { id: 'sql', name: 'SQL', level: 'practicing', note: 'Querying, joining and aggregating relational data.' },
      { id: 'linux', name: 'Technology & Linux', level: 'applied', note: 'Command line, system setup and self-hosted experiments.' },
    ],
  },
  {
    id: 'bi',
    title: 'BI & Visualisation',
    caption: 'Turning tables into decisions',
    skills: [
      { id: 'excel', name: 'Advanced Excel', level: 'applied', note: 'Lookups, pivots, modelling and reporting workbooks.' },
      { id: 'powerbi', name: 'Power BI', level: 'practicing', note: 'Data models, DAX measures and interactive reports.' },
      { id: 'tableau', name: 'Tableau', level: 'learning', note: 'Visual analytics and dashboard storytelling.' },
    ],
  },
  {
    id: 'analysis',
    title: 'Analysis & Business',
    caption: 'Asking the right question first',
    skills: [
      { id: 'stats', name: 'Statistical Analysis', level: 'applied', note: 'Descriptive and inferential statistics from a mathematics base.' },
      { id: 'finance', name: 'Financial Analysis', level: 'learning', note: 'Reading filings, ratios, margins and growth.' },
      { id: 'market', name: 'Market Research', level: 'learning', note: 'Framing questions, sizing markets, synthesising sources.' },
      { id: 'ba', name: 'Business Analytics', level: 'practicing', note: 'Connecting data work to business outcomes.' },
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
    title: 'This Site — Story + Analytics Hall',
    short: 'This Site',
    cta: 'Explore This Build',
    kicker: 'Web · 3D · Analytics',
    overview:
      'A scroll-driven personal story and a separate spatial Analytics Hall of company case studies, built as one connected web experience.',
    problem:
      'A conventional résumé shows a list. This site is meant to show how I think (the Analytics Hall) and how I build (the Developer Engine) as well as who I am.',
    role: 'Content, analysis and build.',
    technologies: 'React, React Router, Three.js via React Three Fiber, Drei, Postprocessing, Recharts, Zustand, Vite.',
    implementation: [
      { title: 'One persistent 3D stage', text: 'A single WebGL canvas is shared by every route, so the story object and environments are never recreated and only one GPU context exists.' },
      { title: 'Resumable navigation', text: 'The story position, chapter and object state are saved when you leave and restored when you return from the Hall or a project.' },
      { title: 'Lazy analytics', text: 'The Hall, the dashboards and the charting library load only when a visitor goes there.' },
      { title: 'Adaptive quality', text: 'Resolution and post-processing scale with measured frame rate; rendering pauses when nothing moves.' },
    ],
    status: 'Live — first case study (NVIDIA) published.',
    screenshots: [],
    links: { github: TODO('GitHub repository'), live: null },
  },
}

export const projectOrder = ['tedxisme', 'linux-lab', 'portfolio']

/* ---------------- Story chapters (indicator + resume) ---------------- */
export const chapters = [
  { id: 'origin', n: '01', title: 'Origin' },
  { id: 'foundation', n: '02', title: 'Foundation' },
  { id: 'exploration', n: '03', title: 'Exploration' },
  { id: 'building', n: '04', title: 'Building & Experience' },
  { id: 'portal', n: '05', title: 'Analytics Hall' },
  { id: 'continuation', n: '06', title: 'The Story Continues' },
  { id: 'engine', n: '07', title: 'The Developer Engine' },
  { id: 'ending', n: '08', title: 'sudo make me employable' },
]
