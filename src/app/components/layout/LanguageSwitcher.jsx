'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import s from './LanguageSwitcher.module.scss';

const LOCALES = ['en', 'es', 'fr', 'nl', 'hi', 'th', 'zh', 'ar', 'bn', 'pt', 'ru', 'ur', 'pa'];

/** Native <select> (accessible everywhere); swaps the locale segment, keeps the rest of the URL. */
export default function LanguageSwitcher({ locale, tone = 'default', id = 'tm-lang' }) {
  const t = useTranslations('language');
  const pathname = usePathname() || `/${locale}`;
  const router = useRouter();

  const onChange = (e) => {
    const next = e.target.value;
    const parts = pathname.split('/');
    if (LOCALES.includes(parts[1])) parts[1] = next;
    else parts.splice(1, 0, next);
    const hash = typeof window !== 'undefined' ? window.location.search + window.location.hash : '';
    router.push((parts.join('/') || `/${next}`) + hash);
  };

  return (
    <div className={`tm-lang ${s.wrap} ${tone === 'night' ? s.night : ''}`}>
      <label htmlFor={id} className={s.label}>
        <Globe aria-hidden="true" size={16} strokeWidth={2} />
        <span>{t('label')}</span>
      </label>
      <select id={id} className={s.select} value={locale} onChange={onChange}>
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>
            {t(l)}
          </option>
        ))}
      </select>
    </div>
  );
}
