'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Search, X, ArrowUpRight } from 'lucide-react';
import Logo from '@/app/brand-assets/Logo';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { NAV_GROUPS, HARDWARE_URL } from './navConfig';
import s from './MobileNav.module.scss';

const FOCUSABLE = 'a[href], button:not([disabled]), select, input, textarea, [tabindex]:not([tabindex="-1"])';
const noopSubscribe = () => () => {};

/**
 * Mobile navigation drawer: modal dialog (role="dialog", aria-modal), focus
 * trapped inside, Esc or the overlay closes it, page scroll locked while open,
 * focus returns to the trigger (handled by the caller's onClose). Rendered
 * into <body> through a portal so the header's backdrop-filter can't become
 * its containing block.
 */
export default function MobileNav({ locale, open, onClose }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [expanded, setExpanded] = useState(null);
  const href = (p) => `/${locale}${p}`;

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('tm-scroll-locked');
    const id = requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || !panelRef.current.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // Switching to the desktop layout with the drawer open: close it.
    const mq = window.matchMedia('(min-width: 1080px)');
    const onMq = (e) => e.matches && onClose();
    document.addEventListener('keydown', onKey);
    mq.addEventListener?.('change', onMq);
    return () => {
      cancelAnimationFrame(id);
      document.body.classList.remove('tm-scroll-locked');
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener?.('change', onMq);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const fade = reduce ? { duration: 0 } : { duration: 0.22, ease: [0.2, 0, 0, 1] };
  const slide = reduce ? { duration: 0 } : { duration: 0.32, ease: [0.16, 1, 0.3, 1] };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className={s.root} key="drawer">
          <motion.div
            className={s.overlay}
            aria-hidden="true"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
          />
          <motion.div
            ref={panelRef}
            id="tm-mobile-nav"
            className={s.panel}
            role="dialog"
            aria-modal="true"
            aria-label={t('menu')}
            initial={reduce ? { opacity: 0 } : { x: '100%' }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            transition={slide}
          >
            <div className={s.top}>
              <Link href={href('')} className={s.logo} aria-label={t('homeLabel')} onClick={onClose}>
                <Logo title="" size={22} />
              </Link>
              <button ref={closeRef} type="button" className={s.close} aria-label={t('closeMenu')} onClick={onClose}>
                <X aria-hidden="true" size={22} strokeWidth={1.75} />
              </button>
            </div>

            <div className={s.scroll}>
              <Link href={href('/search')} className={s.search} onClick={onClose}>
                <Search aria-hidden="true" size={18} strokeWidth={1.75} />
                <span>{t('searchPlaceholder')}</span>
              </Link>

              <nav aria-label={t('primary')}>
                <ul className={s.groups}>
                  {NAV_GROUPS.map((g) => {
                    const isOpen = expanded === g.key;
                    return (
                      <li key={g.key} className={s.group}>
                        <button
                          type="button"
                          className={s.groupBtn}
                          aria-expanded={isOpen}
                          aria-controls={`tm-mnav-${g.key}`}
                          onClick={() => setExpanded(isOpen ? null : g.key)}
                        >
                          <span>{t(`groups.${g.key}.label`)}</span>
                          <ChevronDown aria-hidden="true" size={18} strokeWidth={2} className={s.chev} />
                        </button>
                        <ul id={`tm-mnav-${g.key}`} className={s.items} hidden={!isOpen}>
                          {g.items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <li key={item.key}>
                                <Link
                                  href={href(item.href)}
                                  className={s.item}
                                  prefetch={false}
                                  aria-current={pathname === href(item.href) ? 'page' : undefined}
                                  onClick={onClose}
                                >
                                  <Icon aria-hidden="true" size={18} strokeWidth={1.75} className={s.itemIcon} />
                                  <span>{t(`items.${item.key}.label`)}</span>
                                </Link>
                              </li>
                            );
                          })}
                          <li>
                            <Link href={href(g.overview)} className={s.all} prefetch={false} onClick={onClose}>
                              {t(`groups.${g.key}.all`)} →
                            </Link>
                          </li>
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <a href={HARDWARE_URL} className={s.hardware} rel="noopener">
                <span>{t('hardware')}</span>
                <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.75} />
              </a>
            </div>

            <div className={s.bottom}>
              <Link href={href('/start-a-project')} className={s.cta} onClick={onClose}>
                {t('cta')}
              </Link>
              <div className={s.prefs}>
                <LanguageSwitcher locale={locale} id="tm-lang-mobile" />
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
