// Site information architecture. Paths are unchanged from Workstation where the
// route moved (migration/manifest.json, dest tenthmatrix|both), so the 301 map
// is a straight host swap. Renames live in migration/redirects.json
// (/why-workstation → /why-tenthmatrix). Labels/descriptions come from
// src/messages/en.json → nav.groups.<group> and nav.items.<key>.
//
// No shop links anywhere: hardware goes to Workstation's marketing pages.
import {
  Bot,
  Workflow,
  Sparkles,
  Cpu,
  MessageSquare,
  Zap,
  Shield,
  KeyRound,
  GitBranch,
  Activity,
  Gauge,
  Code2,
  Briefcase,
  Users,
  Megaphone,
  PenTool,
  Lightbulb,
  Building2,
  LayoutGrid,
  Boxes,
  Factory,
  Tag,
  Trophy,
  Layers,
  Wrench,
  Database,
  Radar,
  Lock,
  ShieldCheck,
  Server,
  Laptop,
  GraduationCap,
  FileText,
  Newspaper,
  BookOpen,
  LineChart,
  HelpCircle,
  Video,
  Search,
  Rocket,
  Handshake,
  BadgeCheck,
  Send,
} from 'lucide-react';

export const HARDWARE_URL = 'https://www.workstation.co.uk/ai-workstations';

/** Mega-menu groups, in header order. `overview` is the group's landing link. */
export const NAV_GROUPS = [
  {
    key: 'work',
    overview: '/outsource-ai-development',
    items: [
      { key: 'outsource', href: '/outsource-ai-development', icon: Handshake },
      { key: 'aiAgentDev', href: '/ai-agent-development', icon: Bot },
      { key: 'genAiDev', href: '/generative-ai-development', icon: Sparkles },
      { key: 'whyAgents', href: '/why-tenthmatrix-agents', icon: BadgeCheck },
      { key: 'startProject', href: '/start-a-project', icon: Send },
    ],
  },
  {
    key: 'agents',
    overview: '/ai-agents',
    items: [
      { key: 'aiAgents', href: '/ai-agents', icon: Bot },
      { key: 'agentBuilding', href: '/agent-building', icon: Wrench },
      { key: 'claudeAgents', href: '/claude-agents', icon: Sparkles },
      { key: 'openaiAgents', href: '/openai-agents', icon: Cpu },
      { key: 'grokBot', href: '/grok-bot', icon: MessageSquare },
      { key: 'aiAutomation', href: '/ai-automation', icon: Workflow },
    ],
  },
  {
    key: 'tools',
    overview: '/products',
    items: [
      { key: 'wslProxy', href: '/wsl-proxy', icon: Shield },
      { key: 'wslVault', href: '/wsl-vault', icon: KeyRound },
      { key: 'ringPromoter', href: '/ring-promoter', icon: GitBranch },
      { key: 'sysops', href: '/sysops247', icon: Activity },
      { key: 'jev', href: '/insights/jev', icon: Gauge },
      { key: 'apis', href: '/docs/apis', icon: Code2 },
    ],
  },
  {
    key: 'applications',
    overview: '/workstation-ai-solutions',
    items: [
      { key: 'jobshout', href: '/jobshout', icon: Briefcase },
      { key: 'crm', href: '/crm', icon: Users },
      { key: 'marketing', href: '/marketing', icon: Megaphone },
      { key: 'generativeAi', href: '/generative-ai', icon: PenTool },
      { key: 'appliedAi', href: '/applied-ai', icon: Lightbulb },
      { key: 'enterpriseAi', href: '/enterprise-ai', icon: Building2 },
    ],
  },
  {
    key: 'products',
    overview: '/products',
    items: [
      { key: 'allProducts', href: '/products', icon: LayoutGrid },
      { key: 'solutions', href: '/workstation-ai-solutions', icon: Boxes },
      { key: 'aiSolutions', href: '/ai-solutions', icon: Rocket },
      { key: 'industries', href: '/industries', icon: Factory },
      { key: 'pricing', href: '/pricing', icon: Tag },
      { key: 'stories', href: '/stories', icon: Trophy },
    ],
  },
  {
    key: 'services',
    overview: '/services',
    items: [
      { key: 'modernisation', href: '/services/enterprise-platform-modernisation', icon: Layers },
      { key: 'aiNative', href: '/services/ai-native-digital-engineering', icon: Code2 },
      { key: 'dataFoundations', href: '/services/data-foundations-ai', icon: Database },
      { key: 'autonomousOps', href: '/services/autonomous-operations', icon: Radar },
      { key: 'consultancy', href: '/services/ai-solutions-consultancy', icon: Lightbulb },
      { key: 'devops', href: '/services/devops-automation', icon: Server },
      { key: 'cyberSecurity', href: '/services/cyber-security', icon: Lock },
      { key: 'securityFundamentals', href: '/services/cybersecurity-fundamentals', icon: ShieldCheck },
      { key: 'softwareDevelopment', href: '/services/software-development', icon: Laptop },
      { key: 'upskilling', href: '/ai-upskilling', icon: GraduationCap },
    ],
  },
  {
    key: 'resources',
    overview: '/articles',
    items: [
      { key: 'articles', href: '/articles', icon: FileText },
      { key: 'blog', href: '/docs/blogs', icon: Newspaper },
      { key: 'insights', href: '/insights', icon: LineChart },
      { key: 'docs', href: '/docs', icon: BookOpen },
      { key: 'faqs', href: '/docs/faqs', icon: HelpCircle },
      { key: 'news', href: '/news', icon: Zap },
      { key: 'videos', href: '/video-gallery', icon: Video },
      { key: 'search', href: '/search', icon: Search },
    ],
  },
];

/** Footer columns: group key → item keys/hrefs (labels from nav.items / footer.links). */
export const FOOTER_COLUMNS = [
  { key: 'work', items: ['outsource', 'aiAgentDev', 'genAiDev', 'whyAgents', 'startProject'] },
  { key: 'agents', items: ['aiAgents', 'agentBuilding', 'claudeAgents', 'openaiAgents', 'aiAutomation'] },
  { key: 'products', items: ['ringPromoter', 'wslProxy', 'wslVault', 'jobshout', 'jev', 'allProducts'] },
  { key: 'services', items: ['modernisation', 'aiNative', 'devops', 'cyberSecurity', 'softwareDevelopment', 'servicesAll'] },
  { key: 'resources', items: ['articles', 'blog', 'insights', 'docs', 'faqs', 'news'] },
  { key: 'company', items: ['about', 'whyTenthmatrix', 'partners', 'stories', 'bookOnline', 'contact'] },
];

/** Extra hrefs used only by the footer. */
export const EXTRA_LINKS = {
  servicesAll: '/services',
  about: '/about-us',
  whyTenthmatrix: '/why-tenthmatrix',
  partners: '/partners',
  bookOnline: '/book-online',
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
