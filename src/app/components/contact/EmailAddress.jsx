'use client';

import { useTranslations } from 'next-intl';
import s from './EmailAddress.module.scss';

// The address never appears as text: not in the HTML, not in an href, not in
// this bundle. It is drawn from outlined glyphs (public/brand/email-hello.svg,
// made by scripts/brand/make-email-svg.py) and the mailto: link is assembled
// only when someone clicks. Stored reversed so a plain search of the JS finds
// nothing either.
const PARTS = ['olleh', 'xirtamhtnet', 'moc'];
const address = () => {
  const [user, name, tld] = PARTS.map((p) => p.split('').reverse().join(''));
  return `${user}@${name}.${tld}`;
};

export default function EmailAddress({ className = '' }) {
  const t = useTranslations('form');
  return (
    <a
      href="#email"
      className={`${s.link} ${className}`.trim()}
      onClick={(e) => {
        e.preventDefault();
        window.location.href = `mailto:${address()}`;
      }}
    >
      <span className={s.image} role="img" aria-label={t('email')} />
    </a>
  );
}
