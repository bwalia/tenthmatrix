// Site information architecture. Paths are unchanged from Workstation where the
// route moved (migration/manifest.json, dest tenthmatrix|both), so the 301 map
// is a straight host swap. Renames live in migration/redirects.json
// (/why-workstation → /why-tenthmatrix). Labels/descriptions come from
// src/messages/en.json → nav.groups.<group> and nav.items.<key>.
//
// No shop links anywhere: hardware goes to Workstation's marketing pages.
import {
  AppWindow,
  BookA,
  Headset,
  ListChecks,
  TrendingUp,
  Bug,
  Network,
  Bot,
  Workflow,
  Cpu,
  Zap,
  Shield,
  KeyRound,
  GitBranch,
  Gauge,
  Briefcase,
  Users,
  Megaphone,
  Building2,
  LayoutGrid,
  Boxes,
  Tag,
  Trophy,
  Database,
  ShieldCheck,
  Server,
  FileText,
  Newspaper,
  BookOpen,
  LineChart,
  HelpCircle,
  Search,
  Handshake,
  BadgeCheck,
  Route,
  Landmark,
} from 'lucide-react';

export const HARDWARE_URL = 'https://www.workstation.co.uk/ai-workstations';

/**
 * Mega-menu groups, in header order. Five menus, each named after the question
 * the visitor is asking (restructure plan, 26 Nov 2026):
 *   Solutions        what can you do for me?
 *   Our work         can you prove it?
 *   How we work      what happens if I sign up?
 *   Products & tech  what's under the hood?
 *   Resources        where can I learn more?
 * plus one primary button, Book a call (BOOK_CALL_HREF). `overview` is the
 * group's landing link.
 */
export const NAV_GROUPS = [
  {
    key: 'solutions',
    overview: '/solutions',
    items: [
      { key: 'solSales', href: '/solutions/sales', icon: TrendingUp },
      { key: 'solMarketing', href: '/solutions/marketing', icon: Megaphone },
      { key: 'solBackOffice', href: '/solutions/back-office', icon: Workflow },
      { key: 'solSupport', href: '/solutions/customer-support', icon: Headset },
      { key: 'solCustomApps', href: '/solutions/custom-apps', icon: AppWindow },
      { key: 'solPlatforms', href: '/solutions/platforms-devops', icon: Server },
      { key: 'agentJourney', href: '/ai-agent-journey', icon: Route },
    ],
  },
  {
    key: 'work',
    overview: '/our-work',
    items: [
      { key: 'ourWork', href: '/our-work', icon: Trophy },
      { key: 'caseWorkstation', href: '/our-work/workstation', icon: BadgeCheck },
      { key: 'aiWork', href: '/our-work#ai-work', icon: Bot },
      { key: 'trackRecord', href: '/our-work#track-record', icon: Database },
      { key: 'inHouse', href: '/our-work#in-house', icon: Boxes },
    ],
  },
  {
    key: 'how',
    overview: '/how-we-work',
    items: [
      { key: 'howWeWork', href: '/how-we-work', icon: Handshake },
      { key: 'process', href: '/how-we-work#process', icon: ListChecks },
      { key: 'engagement', href: '/how-we-work#engagement', icon: Users },
      { key: 'cost', href: '/how-we-work#cost', icon: Tag },
      { key: 'ownership', href: '/how-we-work#security', icon: ShieldCheck },
      { key: 'faqs', href: '/how-we-work#faq', icon: HelpCircle },
    ],
  },
  {
    key: 'tech',
    overview: '/products',
    items: [
      { key: 'jobshout', href: '/jobshout', icon: Briefcase },
      { key: 'ringPromoter', href: '/ring-promoter', icon: GitBranch },
      { key: 'proxy10x', href: '/proxy10x', icon: Shield },
      { key: 'wslVault', href: '/wsl-vault', icon: KeyRound },
      { key: 'fixloop', href: '/fixloop', icon: Bug },
      { key: 'opsapi', href: '/opsapi', icon: Network },
      { key: 'jev', href: '/insights/jev', icon: Gauge },
      { key: 'selfHosted', href: '/agent-building', icon: Cpu },
      { key: 'aiTaxFiling', href: '/ai-tax-filing', icon: Landmark },
      { key: 'allProducts', href: '/products', icon: LayoutGrid },
    ],
  },
  {
    key: 'resources',
    overview: '/docs/blogs',
    items: [
      { key: 'blog', href: '/docs/blogs', icon: Newspaper },
      { key: 'articles', href: '/technical-notes', icon: FileText },
      { key: 'glossary', href: '/glossary', icon: BookA },
      { key: 'insights', href: '/insights', icon: LineChart },
      { key: 'news', href: '/news', icon: Zap },
      { key: 'docs', href: '/docs', icon: BookOpen },
      { key: 'about', href: '/about-us', icon: Building2 },
      { key: 'search', href: '/search', icon: Search },
    ],
  },
];

/** The one primary action, everywhere: header, drawer, homepage, page CTAs. */
export const BOOK_CALL_HREF = '/start-a-project';

/** Footer: four columns (Solutions, Our work, Company, Legal). Labels from nav.items / footer.links / footer.legalLinks. */
export const FOOTER_COLUMNS = [
  { key: 'solutions', items: ['solSales', 'solMarketing', 'solBackOffice', 'solSupport', 'solCustomApps', 'solPlatforms'] },
  { key: 'work', items: ['ourWork', 'caseWorkstation', 'aiWork', 'trackRecord', 'inHouse', 'allProducts'] },
  { key: 'company', items: ['howWeWork', 'about', 'blog', 'articles', 'glossary', 'contact'] },
];

/** Extra hrefs used only by the footer. */
export const EXTRA_LINKS = {
  contact: '/contact-us',
};

export const LEGAL_LINKS = [
  { key: 'privacy', href: '/privacy-policy' },
  { key: 'cookies', href: '/cookie-policy' },
  { key: 'terms', href: '/terms-of-service' },
  { key: 'refunds', href: '/refund-policy' },
  { key: 'security', href: '/security' },
  { key: 'accessibility', href: '/accessibility-statement' },
  { key: 'dataDeletion', href: '/data-deletion' },
  { key: 'sitemap', href: '/sitemap-page' },
];

/** key → href across groups + extras. */
export function hrefFor(key) {
  for (const g of NAV_GROUPS) {
    const hit = g.items.find((i) => i.key === key);
    if (hit) return hit.href;
  }
  return EXTRA_LINKS[key] || null;
}
