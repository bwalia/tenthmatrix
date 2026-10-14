// Theme tokens first, so every later sheet can read --tm-*. This is a generated
// copy of design/tm-theme.css — edit the canonical file and `npm run sync:theme`.
import './styles/tm-theme.css';
import './globals.scss';

const SITE_URL = (process.env.SITE_URL || 'https://www.tenthmatrix.com').replace(/\/$/, '');

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

// <html>/<body> live in Document.jsx, rendered by [locale]/layout.js so the
// server sends the right lang/dir for every locale.
export default function RootLayout({ children }) {
  return children;
}
