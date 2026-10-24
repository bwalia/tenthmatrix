import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Mail, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import ContactForm from '@/app/components/contact/ContactForm';
import EmailAddress from '@/app/components/contact/EmailAddress';
import { Eyebrow, LatticeArt } from '@/app/components';
import { loadPage, pageMetadata } from '@/app/components/sections/meta';
import s from '../contact-us/contact.module.scss';

export const dynamic = 'force-static';

const FILE = 'start-a-project.json';
const ROUTE = '/start-a-project';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const data = await loadPage(FILE, locale);
  return data ? pageMetadata({ locale, route: ROUTE, data }) : {};
}

/** Project intake: the contact form with a project-type select. Leads post to OpsAPI (namespace tenthmatrix). */
export default async function StartProjectPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });
  const data = await loadPage(FILE, locale);
  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.intro}>
          <Eyebrow>{data.eyebrow}</Eyebrow>
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
            <h2 className={s.nextTitle}>{data.nextTitle}</h2>
            <ol>
              {data.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div className={s.next}>
            <h2 className={s.nextTitle}>{data.modelsTitle}</h2>
            <p className={s.note}>{data.modelsBody}</p>
            <Link href={`/${locale}/outsource-ai-development#engagement`} className={s.more} prefetch={false}>
              {data.modelsLink}
              <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
            </Link>
          </div>
          <div className={s.art}>
            <LatticeArt cols={10} rows={5} at={[1, 2]} density="sparse" />
          </div>
        </div>
        <div className={s.formCard}>
          <h2 className={s.formTitle}>{data.formTitle}</h2>
          <ContactForm
            source="tenthmatrix_start_project"
            projectTypes={data.projectTypes}
            projectTypeLabel={data.projectTypeLabel}
            messageLabel={data.messageLabel}
            messageHint={data.messageHint}
          />
        </div>
      </div>
    </div>
  );
}
