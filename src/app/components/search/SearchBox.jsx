'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import s from './Search.module.scss';

/**
 * Search input. Standalone (no onQuery): submits to /{locale}/search?q=.
 * Controlled by a parent: pass value/onChange/onSubmit.
 * props: locale, value, onChange(value), onSubmit(value), autoFocus, id, size ('md' | 'lg')
 */
export default function SearchBox({ locale, value, onChange, onSubmit, autoFocus = false, id = 'tm-search-box', size = 'md' }) {
  const t = useTranslations('searchPage');
  const router = useRouter();
  const [local, setLocal] = useState('');
  const v = value ?? local;

  const submit = (e) => {
    e.preventDefault();
    const q = v.trim();
    if (onSubmit) onSubmit(q);
    else router.push(q ? `/${locale}/search?q=${encodeURIComponent(q)}` : `/${locale}/search`);
  };

  return (
    <form role="search" className={`tm-search-box ${s.box} ${size === 'lg' ? s.lg : ''}`} onSubmit={submit}>
      <label htmlFor={id} className="tm-visually-hidden">
        {t('label')}
      </label>
      <Search aria-hidden="true" size={20} strokeWidth={1.75} className={s.icon} />
      <input
        id={id}
        type="search"
        name="q"
        className={s.input}
        placeholder={t('placeholder')}
        autoComplete="off"
        autoFocus={autoFocus}
        value={v}
        onChange={(e) => (onChange ? onChange(e.target.value) : setLocal(e.target.value))}
      />
      <button type="submit" className={s.submit}>
        {t('submit')}
      </button>
    </form>
  );
}
