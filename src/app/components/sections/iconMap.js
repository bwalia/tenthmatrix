// Maps the legacy icon names that live in page JSON (Font Awesome "fas fa-x",
// Bootstrap Icons "bi-x", or bare names) to lucide-react components, so the
// copied Workstation data renders with TenthMatrix's one icon set.
// Image-style values (".svg", ".png", URLs) have no lucide equivalent and fall
// back to the default glyph.
import {
  Activity, AlertTriangle, Apple, Archive, ArrowLeftRight, ArrowUpWideNarrow, Award, Baby, Ban, Banknote,
  BarChart3, Bell, BookOpen, BookUser, Bot, Box, Boxes, Brain, Briefcase, Bug, Building, Building2, Calendar,
  CalendarCheck, Car, ChartLine, CheckCheck, CircleCheck, ClipboardCheck, ClipboardList, Clock, Cloud,
  CloudDownload, CloudUpload, Code, Cog, Coins, Compass, ConciergeBell, Contrast, Cookie, Copyright, Cpu,
  CreditCard, Crosshair, Database, Dna, DraftingCompass, EthernetPort, Expand, ExternalLink, Eye, Facebook,
  Factory, Fan, FileCheck, FileCode, FileHeart, FileText, Film, Flag, FlaskConical, Gauge, Gavel, GitBranch,
  Github, Globe, GraduationCap, Handshake, HardDrive, Headset, Heart, HeartPulse, HelpCircle, Hospital, House,
  Image as ImageIcon, Info, Instagram, Key, Keyboard, Landmark, Languages, Laptop, Layers, LayoutGrid,
  Lightbulb, LineChart, Link as LinkIcon, Linkedin, List, ListTodo, Lock, Mail, MapPin, Megaphone,
  MemoryStick, MessagesSquare, Mic, Microscope, Monitor, MousePointer, Move, Network, NotebookPen,
  PackageOpen, Paintbrush, PenSquare, Phone, PieChart, PiggyBank, Pill, PlayCircle, Plug, Presentation,
  Puzzle, RadioTower, Receipt, Redo, RefreshCw, Rocket, Route, Satellite, Scale, ScanLine, Search, Server,
  Settings, Share2, Shield, ShieldCheck, Shrink, Shuffle, Signpost, SlidersHorizontal, Smartphone, Snowflake,
  Sparkles, Sprout, Star, Stethoscope, Store, Table, Target, Terminal, Thermometer, Timer, Trash2, Truck,
  Twitter, University, User, UserCheck, UserCog, UserRound, Users, UserX, Video, Volume2, Waves, Wifi,
  Workflow, Wrench, Zap,
} from 'lucide-react';

const MAP = {
  // Font Awesome (solid + brands)
  'shield-alt': ShieldCheck, shield: Shield, robot: Bot, 'chart-line': ChartLine, rocket: Rocket,
  envelope: Mail, database: Database, cogs: Settings, cog: Cog, server: Server, users: Users,
  'project-diagram': Workflow, lock: Lock, flask: FlaskConical, brain: Brain, 'user-shield': ShieldCheck,
  'network-wired': Network, heartbeat: HeartPulse, code: Code, clock: Clock, 'sync-alt': RefreshCw,
  building: Building2, 'laptop-code': Laptop, 'balance-scale': Scale, plug: Plug, microchip: Cpu,
  industry: Factory, desktop: Monitor, comments: MessagesSquare, 'code-branch': GitBranch,
  'chart-bar': BarChart3, briefcase: Briefcase, bolt: Zap, phone: Phone, 'mobile-alt': Smartphone,
  'layer-group': Layers, gavel: Gavel, eye: Eye, 'clipboard-check': ClipboardCheck, 'users-cog': UserCog,
  terminal: Terminal, 'tachometer-alt': Gauge, stream: Waves, sitemap: Network, search: Search,
  'map-marker-alt': MapPin, magic: Sparkles, lightbulb: Lightbulb, handshake: Handshake,
  'dollar-sign': Coins, cloud: Cloud, certificate: Award, 'x-ray': ScanLine, seedling: Sprout, link: LinkIcon,
  landmark: Landmark, headset: Headset, 'file-invoice-dollar': Receipt, 'file-alt': FileText, edit: PenSquare,
  dna: Dna, bullhorn: Megaphone, bug: Bug, 'box-open': PackageOpen, book: BookOpen, apple: Apple, wifi: Wifi,
  'volume-up': Volume2, 'user-graduate': GraduationCap, 'user-friends': Users, 'user-check': UserCheck,
  university: University, tools: Wrench, store: Store, 'shopping-cart': Store, 'satellite-dish': Satellite,
  'play-circle': PlayCircle, pills: Pill, 'list-ul': List, key: Key, heart: Heart, hdd: HardDrive,
  'graduation-cap': GraduationCap, globe: Globe, film: Film, 'expand-arrows-alt': Expand,
  'exclamation-triangle': AlertTriangle, 'drafting-compass': DraftingCompass, cubes: Boxes,
  'credit-card': CreditCard, 'clipboard-list': ClipboardList, 'check-double': CheckCheck,
  'check-circle': CircleCheck, 'chart-pie': PieChart, 'chart-area': LineChart,
  'chalkboard-teacher': Presentation, 'calendar-check': CalendarCheck, 'calendar-alt': Calendar,
  'broadcast-tower': RadioTower, bell: Bell, archive: Archive, 'address-book': BookUser, wrench: Wrench,
  video: Video, vial: FlaskConical, 'users-slash': UserX, user: User, 'user-tie': UserRound,
  'user-secret': UserRound, 'user-md': Stethoscope, 'user-lock': Lock, 'user-circle': UserRound, truck: Truck,
  'trash-alt': Trash2, 'thermometer-half': Thermometer, tasks: ListTodo, table: Table, stopwatch: Timer,
  stethoscope: Stethoscope, star: Star, 'sort-amount-up': ArrowUpWideNarrow, snowflake: Snowflake,
  'share-alt': Share2, route: Route, redo: Redo, receipt: Receipt, 'question-circle': HelpCircle,
  'puzzle-piece': Puzzle, 'paint-brush': Paintbrush, pager: Bell, 'notes-medical': NotebookPen,
  'mouse-pointer': MousePointer, 'money-bill-wave': Banknote, microscope: Microscope, microphone: Mic,
  memory: MemoryStick, 'map-signs': Signpost, language: Languages, keyboard: Keyboard, 'info-circle': Info,
  image: ImageIcon, hospital: Hospital, home: House, 'globe-europe': Globe, 'funnel-dollar': Coins,
  'flag-usa': Flag, 'file-medical-alt': FileHeart, 'file-code': FileCode, fan: Fan,
  'external-link-alt': ExternalLink, 'exchange-alt': ArrowLeftRight, ethernet: EthernetPort,
  dharmachakra: Settings, cube: Box, crosshairs: Crosshair, copyright: Copyright, 'cookie-bite': Cookie,
  'concierge-bell': ConciergeBell, 'compress-arrows-alt': Shrink, compass: Compass, coins: Coins,
  'cloud-upload-alt': CloudUpload, 'cloud-download-alt': CloudDownload, city: Building, child: Baby,
  car: Car, bullseye: Target, boxes: Boxes, box: Box, ban: Ban, award: Award, 'arrows-alt': Move,
  adjust: Contrast, github: Github, linkedin: Linkedin, twitter: Twitter, facebook: Facebook,
  instagram: Instagram, slack: MessagesSquare, microsoft: LayoutGrid, google: Globe, android: Smartphone,
  // Bootstrap Icons
  'shield-lock': Lock, 'heart-pulse': HeartPulse, 'window-sidebar': LayoutGrid, sliders: SlidersHorizontal,
  'signpost-split': Signpost, shuffle: Shuffle, 'shield-check': ShieldCheck, lightning: Zap,
  'hdd-network': Server, 'graph-up': ChartLine, globe2: Globe, gear: Settings, 'filetype-yml': FileCode,
  'file-earmark-check': FileCheck, 'diagram-3': Workflow, bank: Landmark, 'box-seam': Box,
  'piggy-bank': PiggyBank, 'arrow-counterclockwise': RefreshCw, activity: Activity,
};

export const DEFAULT_ICON = Sparkles;

/** Normalise "fas fa-shield-alt" / "bi-robot" / "Robot" to a lookup key. */
function keyFor(name) {
  if (!name || typeof name !== 'string') return '';
  const token = name
    .trim()
    .split(/\s+/)
    .find((p) => /^(fa|bi)-/.test(p)) || name.trim();
  return token.replace(/^(fa|bi)-/, '').toLowerCase();
}

/** Returns a lucide component for a legacy icon name (never null). */
export function getIcon(name) {
  return MAP[keyFor(name)] || DEFAULT_ICON;
}

/** True when the JSON value names a glyph we can map (not an image path). */
export function isMappedIcon(name) {
  return Boolean(MAP[keyFor(name)]);
}
