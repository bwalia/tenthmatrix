import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Mail, Clock, ShieldCheck } from 'lucide-react';
import { loadLocaleData } from '@/utils/loadLocaleData';
import EmailAddress from '@/app/components/contact/EmailAddress';
import ContactForm from '@/app/components/contact/ContactForm';
import { Eyebrow, LatticeArt } from '@/app/components';
import s from './contact.module.scss';

export const dynamic = 'force-static';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const data = await loadLocaleData('contact-us.json', locale);
  return {
    title: { absolute: data.meta.title },
    description: data.meta.description,
    alternates: { canonical: `/${locale}/contact-us` },
  };
}

export default async function ContactPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });
  const data = await loadLocaleData('contact-us.json', locale);
  const steps = t.raw('steps');
  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.intro}>
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h1 className={s.title}>{data.title}</h1>
          <p className="tm-lede">{data.lede}</p>
          <ul className={s.facts}>
            <li>
              <Mail aria-hidden="true" size={18} strokeWidth={1.75} />
              <EmailAddress />
            </li>
            <li>
              <Clock aria-hidden="true" size={18} strokeWidth={1.75} />
              {t('response')}
            </li>
            <li>
              <ShieldCheck aria-hidden="true" size={18} strokeWidth={1.75} />
              {t('nda')}
            </li>
          </ul>
          <div className={s.next}>
            <h2 className={s.nextTitle}>{t('nextTitle')}</h2>
            <ol>
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div className={s.art}>
            <LatticeArt cols={10} rows={5} at={[1, 2]} density="sparse" />
          </div>
        </div>
        <div className={s.formCard}>
          <h2 className={s.formTitle}>{t('formTitle')}</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
