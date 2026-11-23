/**
 * CENTRAL COMPANY COLLECTION — Analytics Hall
 * --------------------------------------------------------------
 * Add a company by appending an entry; the Hall gallery reads this list in order.
 *
 *  caseStudy: true   -> highlighted island, opens /workspace/:id (needs a loader in caseStudies below)
 *  caseStudy: false  -> "In progress", does not open
 *  3D logo: src/assets/company-logos/<id>.svg (see README); colour: BRAND in src/three/HallWorld.jsx
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
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    ticker: 'MSFT',
    sector: 'Software · Cloud',
    description: 'Enterprise and consumer software, the Azure cloud platform, productivity services, devices and gaming.',
    caseStudy: false,
  },
  {
    id: 'apple',
    name: 'Apple',
    ticker: 'AAPL',
    sector: 'Consumer hardware · Services',
    description: 'Consumer devices — iPhone, Mac, iPad, wearables — and a growing services business built on its installed base.',
    caseStudy: false,
  },
  {
    id: 'google',
    name: 'Alphabet',
    ticker: 'GOOGL',
    sector: 'Internet · Advertising · Cloud',
    description: 'Parent of Google: search and advertising, YouTube, Android, Google Cloud and longer-term "other bets".',
    caseStudy: false,
  },
  {
    id: 'amazon',
    name: 'Amazon',
    ticker: 'AMZN',
    sector: 'E-commerce · Cloud',
    description: 'Online retail and marketplace, logistics, advertising and Amazon Web Services cloud infrastructure.',
    caseStudy: false,
  },
  {
    id: 'tsmc',
    name: 'TSMC',
    ticker: 'TSM',
    sector: 'Semiconductor foundry',
    description: 'The largest dedicated contract chip manufacturer, producing leading-edge processors for many fabless designers.',
    caseStudy: false,
  },
  {
    id: 'meta',
    name: 'Meta',
    ticker: 'META',
    sector: 'Social platforms · Advertising',
    description: 'Facebook, Instagram, WhatsApp and Messenger, funded by advertising, plus investment in AI and AR/VR.',
    caseStudy: false,
  },
  {
    id: 'amd',
    name: 'AMD',
    ticker: 'AMD',
    sector: 'Semiconductors',
    description: 'CPUs, GPUs, adaptive SoCs and data-center accelerators for PCs, servers, consoles and embedded systems.',
    caseStudy: false,
  },
]

export const companyById = Object.fromEntries(companies.map((c) => [c.id, c]))

/** Code-split loaders: a dashboard's data only downloads when that workspace opens. */
export const caseStudies = {
  nvidia: () => import('../cases/nvidia/index.jsx'),
}
