'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronDown, Menu, Search } from 'lucide-react';
import Logo from '@/app/brand-assets/Logo';
import ThemeToggle from './ThemeToggle';
import MobileNav from './MobileNav';
import { NAV_GROUPS } from './navConfig';
import s from './SiteHeader.module.scss';

const HOVER_OPEN_MS = 110;
const HOVER_CLOSE_MS = 220;

/**
 * Sticky header: logo, mega-menu (Agents · Tools · Applications · Products ·
 * Services · Resources), search, theme toggle, contact, and the mobile drawer
 * trigger. Mega-menu = disclosure pattern: each trigger is a button with
 * aria-expanded/aria-controls; its panel follows it in the DOM so Tab moves
 * straight into the open panel. Opens on click, Enter/Space/ArrowDown, or
 * hover (mouse only); Esc / outside click / focus leaving / navigation close it.
 */
export default function SiteHeader({ locale }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null);
  const timer = useRef(null);
  const justHovered = useRef(null); // key opened by hover in the last 400ms
  const triggers = useRef({});
  const menuBtn = useRef(null);

  const href = useCallback((p) => `/${locale}${p}`, [locale]);
  const clearTimer = () => clearTimeout(timer.current);
  const show = useCallback((key) => {
    clearTimeout(timer.current);
    setOpen(key);
  }, []);
  const close = useCallback((focusKey) => {
    clearTimeout(timer.current);
    setOpen(null);
    if (focusKey) triggers.current[focusKey]?.focus();
  }, []);

  // Close menus on navigation. Adjusting state while rendering is the
  // recommended way to reset on a prop change (no effect, no extra paint).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(null);
    setDrawer(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close(open);
    };
    const onDown = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, close]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onTriggerClick = (key) => {
    // A hover-open immediately followed by a click shouldn't slam it shut.
    if (open === key && justHovered.current !== key) close();
    else show(key);
  };

  const onTriggerKey = (e, key) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      show(key);
      requestAnimationFrame(() => document.querySelector(`#tm-mega-${key} a`)?.focus());
    }
  };

  const onPointerEnter = (e, key) => {
    if (e.pointerType !== 'mouse') return;
    clearTimer();
    timer.current = setTimeout(() => {
      if (open !== key) {
        justHovered.current = key;
        setTimeout(() => {
          if (justHovered.current === key) justHovered.current = null;
        }, 400);
      }
      show(key);
    }, open ? 0 : HOVER_OPEN_MS);
  };

  const onNavPointerLeave = (e) => {
    if (e.pointerType !== 'mouse') return;
    clearTimer();
    timer.current = setTimeout(() => setOpen(null), HOVER_CLOSE_MS);
  };

  const onBlur = (e) => {
    if (open && headerRef.current && e.relatedTarget && !headerRef.current.contains(e.relatedTarget)) setOpen(null);
  };

  const isActive = (g) =>
    g.items.some((i) => pathname === href(i.href) || pathname?.startsWith(`${href(i.href)}/`)) ||
    pathname === href(g.overview);

  const panelMotion = reduce
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } } }
    : {
        initial: { opacity: 0, y: -6 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
        exit: { opacity: 0, y: -4, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } },
      };

  return (
    <header ref={headerRef} className={`tm-header ${s.header}`} data-scrolled={scrolled || open ? 'true' : undefined} onBlur={onBlur}>
      <div className={s.inner}>
        <Link href={href('')} className={s.logo} aria-label={t('homeLabel')}>
          <Logo title="" size={26} className={s.logoSvg} />
        </Link>

        <nav className={s.nav} aria-label={t('primary')} onPointerLeave={onNavPointerLeave} onPointerEnter={clearTimer}>
          <ul className={s.navList}>
            {NAV_GROUPS.map((g) => {
              const expanded = open === g.key;
              return (
                <li key={g.key} className={s.navItem}>
                  <button
                    ref={(el) => {
                      triggers.current[g.key] = el;
                    }}
                    type="button"
                    className={s.trigger}
                    aria-expanded={expanded}
                    aria-controls={`tm-mega-${g.key}`}
                    data-active={isActive(g) ? 'true' : undefined}
                    onClick={() => onTriggerClick(g.key)}
                    onKeyDown={(e) => onTriggerKey(e, g.key)}
                    onPointerEnter={(e) => onPointerEnter(e, g.key)}
                  >
                    {t(`groups.${g.key}.label`)}
                    <ChevronDown aria-hidden="true" size={16} strokeWidth={2} className={s.chev} />
                  </button>
                  <AnimatePresence>
                    {expanded ? (
                      <motion.div key={g.key} id={`tm-mega-${g.key}`} className={s.panel} {...panelMotion}>
                        <div className={s.panelInner}>
                          <div className={s.panelIntro}>
                            <p className={s.panelEyebrow}>{t(`groups.${g.key}.label`)}</p>
                            <p className={s.panelTitle}>{t(`groups.${g.key}.title`)}</p>
                            <p className={s.panelText}>{t(`groups.${g.key}.intro`)}</p>
                            <Link href={href(g.overview)} className={s.panelAll} prefetch={false}>
                              {t(`groups.${g.key}.all`)}
                              <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
                            </Link>
                          </div>
                          <ul className={`${s.panelGrid} ${g.items.length > 6 ? s.panelGridWide : ''}`}>
                            {g.items.map((item) => {
                              const Icon = item.icon;
                              const current = pathname === href(item.href);
                              return (
                                <li key={item.key}>
                                  <Link
                                    href={href(item.href)}
                                    className={s.panelLink}
                                    prefetch={false}
                                    aria-current={current ? 'page' : undefined}
                                  >
                                    <span className={s.panelIcon} aria-hidden="true">
                                      <Icon size={18} strokeWidth={1.75} />
                                    </span>
                                    <span className={s.panelCopy}>
                                      <span className={s.panelLabel}>{t(`items.${item.key}.label`)}</span>
                                      <span className={s.panelDesc}>{t(`items.${item.key}.desc`)}</span>
                                    </span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={s.tools}>
          <Link href={href('/search')} className={s.iconBtn} aria-label={t('search')} prefetch={false}>
            <Search aria-hidden="true" size={20} strokeWidth={1.75} />
          </Link>
          <ThemeToggle />
          <Link href={href('/contact-us')} className={s.contact} prefetch={false}>
            {t('cta')}
          </Link>
          <button
            ref={menuBtn}
            type="button"
            className={`${s.iconBtn} ${s.menuBtn}`}
            aria-label={t('openMenu')}
            aria-expanded={drawer}
            aria-controls="tm-mobile-nav"
            onClick={() => setDrawer(true)}
          >
            <Menu aria-hidden="true" size={22} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <MobileNav
        locale={locale}
        open={drawer}
        onClose={() => {
          setDrawer(false);
          requestAnimationFrame(() => menuBtn.current?.focus());
        }}
      />
    </header>
  );
}
