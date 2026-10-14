import { setRequestLocale } from 'next-intl/server';
import { loadLocaleData } from '@/utils/loadLocaleData';
import ContactForm from '@/app/components/contact/ContactForm';

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
  const data = await loadLocaleData('contact-us.json', locale);
  return (
    <div className="tm-container tm-contact">
      <header className="tm-listing__head">
        <h1>{data.title}</h1>
        <p className="tm-lede">{data.lede}</p>
        <p>
          <a href={`mailto:${data.email}`}>{data.email}</a>
        </p>
      </header>
      <ContactForm />
    </div>
  );
}
