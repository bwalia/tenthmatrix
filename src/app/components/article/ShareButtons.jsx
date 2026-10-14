'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Link2, Linkedin, Mail, Twitter } from 'lucide-react';
import s from './ShareButtons.module.scss';

/** Share row: copy link, LinkedIn, X, email. props: url (absolute), title */
export default function ShareButtons({ url, title }) {
  const t = useTranslations('article');
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const ti = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className={`tm-share ${s.share}`}>
      <p className={s.label}>{t('share')}</p>
      <ul className={s.list}>
        <li>
          <button type="button" className={s.btn} onClick={copy} aria-label={t('copyLink')}>
            {copied ? <Check aria-hidden="true" size={18} /> : <Link2 aria-hidden="true" size={18} />}
          </button>
        </li>
        <li>
          <a className={s.btn} href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} rel="noopener noreferrer" target="_blank" aria-label={t('shareOn', { network: 'LinkedIn' })}>
            <Linkedin aria-hidden="true" size={18} />
          </a>
        </li>
        <li>
          <a className={s.btn} href={`https://x.com/intent/post?url=${u}&text=${ti}`} rel="noopener noreferrer" target="_blank" aria-label={t('shareOn', { network: 'X' })}>
            <Twitter aria-hidden="true" size={18} />
          </a>
        </li>
        <li>
          <a className={s.btn} href={`mailto:?subject=${ti}&body=${u}`} aria-label={t('shareByEmail')}>
            <Mail aria-hidden="true" size={18} />
          </a>
        </li>
      </ul>
      <span className="tm-visually-hidden" role="status" aria-live="polite">
        {copied ? t('linkCopied') : ''}
      </span>
    </div>
  );
}
