import { Calendar, MapPin, MonitorSmartphone, Timer } from 'lucide-react';
import { Hero, Section, CTA } from '@/app/components';
import s from './Templates.module.scss';
import FeatureGrid from '../FeatureGrid';
import CheckList from '../CheckList';
import { heroActions } from '../ActionLink';
import { localeHref } from '../links';
import { useUiStrings } from '../ui';

/** events/*: { hero, content{ eventDetails, topics[], highlights[], cta } } */
export default function EventPage({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const c = data.content || {};
  const d = c.eventDetails || {};
  const cta = c.cta;
  const facts = [
    { key: 'date', label: ui.date, Icon: Calendar },
    { key: 'location', label: ui.location, Icon: MapPin },
    { key: 'format', label: ui.format, Icon: MonitorSmartphone },
    { key: 'duration', label: ui.duration, Icon: Timer },
  ].filter((f) => d[f.key]);
  return (
    <>
      <Hero
        eyebrow={d.date ? `${d.date} · ${d.location || ''}`.replace(/ · $/, '') : undefined}
        title={data.hero?.title}
        lede={data.hero?.description}
        actions={heroActions(cta?.buttonText ? [{ label: cta.buttonText, href: cta.buttonLink }] : [], locale)}
        art
      />
      {facts.length > 0 && (
        <Section id="details" title={ui.eventDetails} spacing="compact">
          <dl className={s.details}>
            {facts.map(({ key, label, Icon }) => (
              <div key={key}>
                <dt>
                  <Icon size={16} strokeWidth={2} aria-hidden="true" />
                  {label}
                </dt>
                <dd>{d[key]}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
      {c.topics?.length > 0 && (
        <Section id="topics" title={ui.topics} tone="sunken">
          <FeatureGrid items={c.topics} locale={locale} columns={3} />
        </Section>
      )}
      {c.highlights?.length > 0 && (
        <Section id="highlights" title={ui.highlights} width="narrow">
          <CheckList items={c.highlights} columns={2} />
        </Section>
      )}
      {cta?.title && (
        <CTA
          id="cta"
          title={cta.title}
          body={cta.description}
          primary={cta.buttonText ? { label: cta.buttonText, href: localeHref(cta.buttonLink || '/contact-us', locale) } : undefined}
        />
      )}
    </>
  );
}
