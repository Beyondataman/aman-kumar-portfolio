/**
 * CENTRAL COMPANY COLLECTION — Analytics Hall
 * --------------------------------------------------------------
 * Add a company by appending an entry. Layout, pillars, index and
 * routing all read from this list.
 *
 *  caseStudy: true   -> pillar opens /workspace/:id (needs a loader in caseStudies below)
 *  caseStudy: false  -> pillar shows "Case study in progress" and does not open
 *  logo: optional path to an SVG/PNG you own the right to use, e.g. '/logos/nvidia.svg'.
 *        Without it the pillar shows a typographic name plate.
 *  slot: [x, z] position in the hall (x grows to the right, z is depth; more negative = farther)
 *  height: pillar height in world units
 */
export const companies = [
  {
    id: 'nvidia',
    name: 'NVIDIA',
    ticker: 'NVDA',
    sector: 'Semiconductors · Accelerated computing',
    description:
      'Designs GPUs, networking and full-stack accelerated-computing platforms used for AI data centers, gaming, professional visualisation and automotive.',
    caseStudy: true,
    featured: true,
    logo: null,
    slot: [-1.2, -3.2],
    height: 6.4,
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    ticker: 'MSFT',
    sector: 'Software · Cloud',
    description: 'Enterprise and consumer software, the Azure cloud platform, productivity services, devices and gaming.',
    caseStudy: false,
    logo: null,
    slot: [3.0, -6.4],
    height: 5.2,
  },
  {
    id: 'apple',
    name: 'Apple',
    ticker: 'AAPL',
    sector: 'Consumer hardware · Services',
    description: 'Consumer devices — iPhone, Mac, iPad, wearables — and a growing services business built on its installed base.',
    caseStudy: false,
    logo: null,
    slot: [-5.6, -6.8],
    height: 4.6,
  },
  {
    id: 'google',
    name: 'Alphabet',
    ticker: 'GOOGL',
    sector: 'Internet · Advertising · Cloud',
    description: 'Parent of Google: search and advertising, YouTube, Android, Google Cloud and longer-term "other bets".',
    caseStudy: false,
    logo: null,
    slot: [7.4, -3.8],
    height: 5.8,
  },
  {
    id: 'amazon',
    name: 'Amazon',
    ticker: 'AMZN',
    sector: 'E-commerce · Cloud',
    description: 'Online retail and marketplace, logistics, advertising and Amazon Web Services cloud infrastructure.',
    caseStudy: false,
    logo: null,
    slot: [11.6, -7.2],
    height: 4.2,
  },
  {
    id: 'tsmc',
    name: 'TSMC',
    ticker: 'TSM',
    sector: 'Semiconductor foundry',
    description: 'The largest dedicated contract chip manufacturer, producing leading-edge processors for many fabless designers.',
    caseStudy: false,
    logo: null,
    slot: [15.2, -4.0],
    height: 5.0,
  },
  {
    id: 'meta',
    name: 'Meta',
    ticker: 'META',
    sector: 'Social platforms · Advertising',
    description: 'Facebook, Instagram, WhatsApp and Messenger, funded by advertising, plus investment in AI and AR/VR.',
    caseStudy: false,
    logo: null,
    slot: [19.6, -6.6],
    height: 4.8,
  },
  {
    id: 'amd',
    name: 'AMD',
    ticker: 'AMD',
    sector: 'Semiconductors',
    description: 'CPUs, GPUs, adaptive SoCs and data-center accelerators for PCs, servers, consoles and embedded systems.',
    caseStudy: false,
    logo: null,
    slot: [23.0, -3.4],
    height: 3.8,
  },
]

export const companyById = Object.fromEntries(companies.map((c) => [c.id, c]))

/** Code-split loaders: a dashboard's data only downloads when that workspace opens. */
export const caseStudies = {
  nvidia: () => import('../cases/nvidia/index.jsx'),
}

export const HALL_EXTENT = {
  minX: Math.min(...companies.map((c) => c.slot[0])),
  maxX: Math.max(...companies.map((c) => c.slot[0])),
}
