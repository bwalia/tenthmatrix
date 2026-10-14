// Theme tokens first, so every later sheet can read --tm-*. This is a generated
// copy of design/tm-theme.css — edit the canonical file and `npm run sync:theme`.
import './styles/tm-theme.css';
import './globals.scss';
import { Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from 'next/font/google';

// BRAND.md §7. next/font self-hosts the files and sets --font-tm-* on <html>;
// tm-theme.css maps them to --tm-font-display / -body / -mono. `adjustFontFallback`
// (on by default) sizes the fallback to the web font's metrics, so `swap`
// causes no layout shift.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-tm-display',
  display: 'swap',
  axes: ['opsz'],
});
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-tm-body', display: 'swap' });
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-tm-mono',
  display: 'swap',
});

const SITE_URL = (process.env.SITE_URL || 'https://www.tenthmatrix.com').replace(/\/$/, '');

// Runs before first paint: resolve localStorage["tm-theme"] (light | dark |
// system, default system) and set data-theme (+ data-theme-mode) on <html>.
// In "system" mode it follows OS changes live. ThemeToggle calls
// window.__tmTheme.set(). Storage access is guarded: private windows and
// blocked storage fall back to the system preference. It also sets lang/dir
// from the URL's locale segment so the document language is right from the
// first byte the browser parses (the root layout cannot read the segment).
const THEME_SCRIPT = `(function(){var d=document.documentElement,K='tm-theme',m=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;d.classList.add('js');function g(){try{var v=localStorage.getItem(K);return v==='light'||v==='dark'||v==='system'?v:'system'}catch(e){return'system'}}function r(p){return p==='system'?(m&&m.matches?'dark':'light'):p}function a(p){var t=r(p);d.setAttribute('data-theme',t);d.setAttribute('data-theme-mode',p);return t}a(g());try{var s=location.pathname.split('/')[1];if(/^(en|es|fr|nl|hi|th|zh|ar|bn|pt|ru|ur|pa)$/.test(s)){d.lang=s;d.dir=(s==='ar'||s==='ur')?'rtl':'ltr'}}catch(e){}if(m){var h=function(){if(g()==='system'){a('system');window.dispatchEvent(new CustomEvent('tm-theme-change',{detail:{pref:'system'}}))}};m.addEventListener?m.addEventListener('change',h):m.addListener&&m.addListener(h)}window.__tmTheme={get:g,resolve:r,set:function(p){try{localStorage.setItem(K,p)}catch(e){}var t=a(p);window.dispatchEvent(new CustomEvent('tm-theme-change',{detail:{pref:p,theme:t}}));return t}}})();`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TenthMatrix — software that puts AI agents to work',
    template: '%s | TenthMatrix',
  },
  description:
    'TenthMatrix builds AI agents, AI tools, AI applications and software products, and writes about the engineering behind them.',
  applicationName: 'TenthMatrix',
  icons: {
    icon: [
      { url: '/brand/favicon.ico', sizes: '48x48' },
      { url: '/brand/icon.svg', type: 'image/svg+xml' },
      { url: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/brand/apple-icon.png',
  },
  openGraph: { siteName: 'TenthMatrix', type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // --tm-bg in each theme (brand paper / graphite).
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f2' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1113' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <head>
        {/* Blocking on purpose: must run before the first paint to avoid a theme flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* Without JS, scroll reveals (Reveal.jsx) never fire: show their server-rendered hidden state. */}
        <noscript>
          <style>{'[style*="opacity:0"]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
