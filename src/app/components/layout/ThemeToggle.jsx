'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Monitor, Moon, Sun } from 'lucide-react';
import s from './ThemeToggle.module.scss';

// One click always flips what the visitor sees: light ↔ dark. The stored
// preference starts as "system" (the blocking script in src/app/Document.jsx
// follows the OS until then); the first click pins the opposite of the theme
// currently showing. A three-way light → dark → system cycle made one click in
// three look like it did nothing, whenever "system" resolved to the theme
// already on screen.

function subscribe(cb) {
  window.addEventListener('tm-theme-change', cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener('tm-theme-change', cb);
    window.removeEventListener('storage', cb);
  };
}

// The theme actually on screen (data-theme is set before first paint).
const readTheme = () => {
  const t = document.documentElement.getAttribute('data-theme');
  return t === 'dark' || t === 'light' ? t : null;
};

export default function ThemeToggle({ className = '', tone = 'default' }) {
  const t = useTranslations('theme');
  const current = useSyncExternalStore(subscribe, readTheme, () => null);
  const next = current === 'dark' ? 'light' : 'dark';
  const Icon = current === 'dark' ? Moon : current === 'light' ? Sun : Monitor;
  const label = t('toggle', { current: t(current || 'system'), next: t(next) });

  const toggle = () => {
    // Read the live theme at click time so a stale render can never need a second click.
    const live = readTheme() || current;
    window.__tmTheme?.set?.(live === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      className={`tm-theme-toggle ${s.toggle} ${tone === 'night' ? s.night : ''} ${className}`.trim()}
      aria-label={label}
      title={label}
      onClick={toggle}
    >
      <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
    </button>
  );
}
