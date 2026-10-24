import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import Logo from '@/app/brand-assets/Logo';
import LanguageSwitcher from './LanguageSwitcher';
import EmailAddress from '@/app/components/contact/EmailAddress';
import { FOOTER_COLUMNS, LEGAL_LINKS, HARDWARE_URL, hrefFor } from './navConfig';
import s from './SiteFooter.module.scss';

/** Footer: dark in both themes (--tm-night-*). Sitemap, legal, language, hardware cross-link. No shop links. */
export default async function SiteFooter({ locale }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const year = new Date().getFullYear();
  const label = (key) => (nav.has(`items.${key}.label`) ? nav(`items.${key}.label`) : t(`links.${key}`));

  return (
    <footer className={`tm-footer ${s.footer}`}>
      <div className={s.inner}>
        <a href={HARDWARE_URL} className={s.hardware} target="_blank" rel="noopener noreferrer">
          <span className={s.hwEyebrow}>{t('hardwareEyebrow')}</span>
          <span className={s.hwTitle}>{t('hardwareTitle')}</span>
          <span className={s.hwBody}>{t('hardwareBody')}</span>
          <span className={s.hwLink}>
            {t('hardwareLink')}
            <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.75} />
          </span>
        </a>

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
          </nav>
        </div>

        <div className={s.bottom}>
          <nav aria-label={t('legal')}>
            <ul className={s.legal}>
              {LEGAL_LINKS.map((l) => (
                <li key={l.key}>
                  <Link href={`/${locale}${l.href}`} prefetch={false}>
                    {t(`legalLinks.${l.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className={s.meta}>
            <LanguageSwitcher locale={locale} tone="night" id="tm-lang-footer" />
            <p className={s.copy}>
              © {year} TenthMatrix. {t('rights')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
