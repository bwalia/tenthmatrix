import Link from 'next/link';
import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import { localeHref } from '@/app/components/sections/links';
import LogoStrip from '@/app/components/work/LogoStrip';
import ProofStats from '@/app/components/work/ProofStats';
import WorkExplorer from '@/app/components/work/WorkExplorer';
import w from '@/app/components/work/work.module.scss';

export const dynamic = 'force-static';

/**
 * Our work (main menu): headline results, client logos, the work filtered by
 * industry and problem (AI & automation first, then the track record), and the
 * software we run in-house. Replaces /stories, which redirects here.
 */
function OurWork({ data, locale }) {
  const h = data.header || {};
  const cta = data.cta || {};
  return (
    <>
      <Hero
        eyebrow={h.eyebrow}
        title={h.title}
        lede={h.subtitle}
        actions={[{ label: cta.button, href: localeHref(cta.link, locale), arrow: true }]}
        art
      />
      <Section id="results" tone="sunken" width="wide">
        <ProofStats items={data.stats} />
        <div className={w.logoRow}>
          <LogoStrip items={[...data.cases, ...data.track].slice(0, 12)} label={h.eyebrow} />
        </div>
      </Section>
      <Section id="work">
        <WorkExplorer cases={data.cases} track={data.track} groups={data.groups} filters={data.filters} ui={data.ui} locale={locale} />
      </Section>
      <Section id="in-house" tone="sunken" eyebrow={data.groups.inHouse.eyebrow} title={data.groups.inHouse.title} lede={data.groups.inHouse.intro}>
        <ul className={w.inHouse}>
          {data.inHouse.map((p) => (
            <li key={p.name}>
              <Link href={localeHref(p.href, locale)} prefetch={false}>
                <strong>{p.name}</strong>
                <span>{p.line}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      <CTA
        id="cta"
        title={cta.title}
        body={cta.description}
        primary={{ label: cta.button, href: localeHref(cta.link, locale) }}
        secondary={cta.secondary ? { label: cta.secondary.label, href: localeHref(cta.secondary.link, locale) } : undefined}
      />
    </>
  );
}

const route = createRoute({ file: 'our-work.json', route: '/our-work', Template: OurWork });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
