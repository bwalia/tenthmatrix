import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Logo from '@/app/brand-assets/Logo';
import LanguageSwitcher from './LanguageSwitcher';
import EmailAddress from '@/app/components/contact/EmailAddress';
import { FOOTER_COLUMNS, LEGAL_LINKS, HARDWARE_URL, hrefFor } from './navConfig';
import s from './SiteFooter.module.scss';

/**
 * Footer: dark in both themes (--tm-night-*). Brand + four columns (Solutions,
 * Our work, Company, Legal), one language dropdown and a one-line Workstation
 * credit. No shop links.
 */
export default async function SiteFooter({ locale }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const year = new Date().getFullYear();
  const label = (key) => (nav.has(`items.${key}.label`) ? nav(`items.${key}.label`) : t(`links.${key}`));

  return (
    <footer className={`tm-footer ${s.footer}`}>
      <div className={s.inner}>
        <div className={s.grid}>
          <div className={s.brand}>
            <Link href={`/${locale}`} className={s.logo} aria-label={nav('homeLabel')}>
              <Logo variant="dark" title="" size={28} />
            </Link>
            <p className={s.tagline}>{t('tagline')}</p>
            <p className={s.blurb}>{t('blurb')}</p>
            <EmailAddress className={s.email} />
          </div>
          <nav className={s.columns} aria-label={t('sitemap')}>
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.key} className={s.col}>
                <h2 className={s.colTitle}>{t(`columns.${col.key}`)}</h2>
                <ul>
                  {col.items.map((key) => (
                    <li key={key}>
                      <Link href={`/${locale}${hrefFor(key)}`} prefetch={false}>
                        {label(key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className={s.col}>
              <h2 className={s.colTitle}>{t('legal')}</h2>
              <ul>
                {LEGAL_LINKS.map((l) => (
                  <li key={l.key}>
                    <Link href={`/${locale}${l.href}`} prefetch={false}>
                      {t(`legalLinks.${l.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <div className={s.bottom}>
          <LanguageSwitcher locale={locale} tone="night" id="tm-lang-footer" />
          <p className={s.copy}>
            © {year} TenthMatrix. {t('entity')}{' '}
            <a href={HARDWARE_URL} className={s.sponsor} target="_blank" rel="noopener noreferrer">
              {t('hardware')}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
