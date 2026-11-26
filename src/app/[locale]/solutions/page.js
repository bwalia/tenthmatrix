import { Hero, Section, CTA, Button } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import { localeHref } from '@/app/components/sections/links';
import SolutionCards, { solutionCardItems } from '@/app/components/solutions/SolutionCards';
import s from '@/app/components/solutions/solutions.module.scss';

export const dynamic = 'force-static';

/** Solutions hub: one card per problem area, plus the AI Agent Journey as the secondary action. */
function Solutions({ data, locale }) {
  const h = data.header;
  return (
    <>
      <Hero
        eyebrow={h.eyebrow}
        title={h.title}
        lede={h.subtitle}
        actions={[
          { label: data.cta.button, href: localeHref(data.cta.link, locale), arrow: true },
          { label: data.journey.button, href: localeHref(data.journey.link, locale) },
        ]}
        art
      />
      <Section id="solutions">
        <SolutionCards items={solutionCardItems(data)} locale={locale} linkLabel={data.ui.see} />
        <div className={s.journey}>
          <div>
            <h3>{data.journey.title}</h3>
            <p>{data.journey.body}</p>
          </div>
          <Button href={localeHref(data.journey.link, locale)} variant="secondary" arrow>
            {data.journey.button}
          </Button>
        </div>
      </Section>
      <CTA
        id="cta"
        title={data.cta.title}
        body={data.cta.description}
        primary={{ label: data.cta.button, href: localeHref(data.cta.link, locale) }}
        secondary={{ label: data.cta.secondary.label, href: localeHref(data.cta.secondary.link, locale) }}
      />
    </>
  );
}

const route = createRoute({ file: 'solutions.json', route: '/solutions', Template: Solutions });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
