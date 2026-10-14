'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Cookie } from 'lucide-react';
import s from './CookieConsent.module.scss';

// Choice is kept in localStorage "tm-cookie-consent" (accepted | essential)
// and mirrored to a first-party cookie of the same name so server code (and
// the visual audit) can read it. The site sets no tracking cookies today;
// "essential" is the honest default and analytics must check for "accepted".
export const CONSENT_KEY = 'tm-cookie-consent';

function readConsent() {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v) return v;
  } catch {
    /* storage blocked */
  }
  const m = document.cookie.match(/(?:^|;\s*)tm-cookie-consent=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}
const subscribe = (cb) => {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
};

export default function CookieConsent({ locale }) {
  const t = useTranslations('cookies');
  const reduce = useReducedMotion();
  const stored = useSyncExternalStore(subscribe, readConsent, () => 'unknown');
  const [choice, setChoice] = useState(null);
  const visible = !choice && stored === '';

  const decide = (value) => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* storage blocked: the cookie still records it */
    }
    document.cookie = `${CONSENT_KEY}=${value}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`;
    setChoice(value);
    window.dispatchEvent(new CustomEvent('tm-consent-change', { detail: value }));
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.section
          className={s.banner}
          role="region"
          aria-label={t('label')}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 12, transition: { duration: 0.18 } }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1], delay: reduce ? 0 : 0.6 }}
        >
          <Cookie aria-hidden="true" size={20} strokeWidth={1.75} className={s.icon} />
          <p className={s.text}>
            {t('body')}{' '}
            <Link href={`/${locale}/cookie-policy`} prefetch={false}>
              {t('policy')}
            </Link>
          </p>
          <div className={s.actions}>
            <button type="button" className={s.secondary} onClick={() => decide('essential')}>
              {t('essential')}
            </button>
            <button type="button" className={s.primary} onClick={() => decide('accepted')}>
              {t('accept')}
            </button>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
