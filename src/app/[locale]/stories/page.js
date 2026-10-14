import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import Testimonials from '@/app/components/sections/Testimonials';
import { localeHref } from '@/app/components/sections/links';
import { useUiStrings } from '@/app/components/sections/ui';

export const dynamic = 'force-static';

function Stories({ data, locale }) {
  const ui = useUiStrings(data.ui);
  return (
    <>
      <Hero eyebrow={ui.ourCustomers} title={data.header?.title} lede={ui.storiesLede} art />
      <Section id="stories">
        <Testimonials items={data.content} columns={3} />
      </Section>
      <CTA
        id="cta"
        title={ui.storiesCtaTitle}
        primary={{ label: ui.contactSales, href: localeHref('/contact-us', locale) }}
      />
    </>
  );
}

const route = createRoute({
  file: 'stories.json',
  route: '/stories',
  Template: Stories,
  meta: (d) => ({ title: d.header?.title, description: 'How engineering and operations teams run TenthMatrix software and services in production.' }),
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
