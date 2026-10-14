'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Monitor, Moon, Sun } from 'lucide-react';
import s from './ThemeToggle.module.scss';

// Cycles light → dark → system (THEME.prompt.md §3) through window.__tmTheme,
// which the blocking script in src/app/layout.js installs before first paint.
const ORDER = ['light', 'dark', 'system'];
const ICONS = { system: Monitor, light: Sun, dark: Moon };

function subscribe(cb) {
  window.addEventListener('tm-theme-change', cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener('tm-theme-change', cb);
    window.removeEventListener('storage', cb);
  };
}
const read = () => window.__tmTheme?.get?.() || 'system';

export default function ThemeToggle({ className = '', tone = 'default' }) {
  const t = useTranslations('theme');
  const pref = useSyncExternalStore(subscribe, read, () => 'system');
  const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
  const Icon = ICONS[pref] || Monitor;
  const label = t('toggle', { current: t(pref), next: t(next) });

  return (
    <button
      type="button"
      className={`tm-theme-toggle ${s.toggle} ${tone === 'night' ? s.night : ''} ${className}`.trim()}
      aria-label={label}
      title={label}
      onClick={() => window.__tmTheme?.set?.(next)}
    >
      <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
    </button>
  );
}
