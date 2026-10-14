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
const body = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-tm-body',
  display: 'swap',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-tm-mono',
  display: 'swap',
});

// Runs before first paint: resolve localStorage["tm-theme"] (light | dark |
// system, default system) and set data-theme (+ data-theme-mode) on <html>.
// In "system" mode it follows OS changes live. ThemeToggle calls
// window.__tmTheme.set(). Storage access is guarded: private windows and
// blocked storage fall back to the system preference.
const THEME_SCRIPT = `(function(){var d=document.documentElement,K='tm-theme',m=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;d.classList.add('js');function g(){try{var v=localStorage.getItem(K);return v==='light'||v==='dark'||v==='system'?v:'system'}catch(e){return'system'}}function r(p){return p==='system'?(m&&m.matches?'dark':'light'):p}function a(p){var t=r(p);d.setAttribute('data-theme',t);d.setAttribute('data-theme-mode',p);return t}a(g());if(m){var h=function(){if(g()==='system'){a('system');window.dispatchEvent(new CustomEvent('tm-theme-change',{detail:{pref:'system'}}))}};m.addEventListener?m.addEventListener('change',h):m.addListener&&m.addListener(h)}window.__tmTheme={get:g,resolve:r,set:function(p){try{localStorage.setItem(K,p)}catch(e){}var t=a(p);window.dispatchEvent(new CustomEvent('tm-theme-change',{detail:{pref:p,theme:t}}));return t}}})();`;

const RTL = new Set(['ar', 'ur']);

/**
 * The <html> document, rendered by src/app/[locale]/layout.js (so lang/dir come
 * from the route on the server, for crawlers and no-JS readers) and by the
 * root not-found page. The root layout itself only passes children through.
 */
export default function Document({ lang = 'en', children }) {
  return (
    <html
      lang={lang}
      dir={RTL.has(lang) ? 'rtl' : 'ltr'}
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
