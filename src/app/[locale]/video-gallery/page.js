import { Hero, Section, CTA } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import VideoGrid from '@/app/components/sections/VideoGrid';
import { localeHref } from '@/app/components/sections/links';
import { useUiStrings } from '@/app/components/sections/ui';

export const dynamic = 'force-static';

const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function VideoGallery({ data, locale }) {
  const ui = useUiStrings(data.ui);
  const c = data.content || {};
  return (
    <>
      <Hero title={data.hero?.title} lede={data.hero?.description} art={false} />
      {(c.categories || []).map((cat, i) => (
        <Section key={cat.name} id={slug(cat.name)} title={cat.name} tone={i % 2 ? 'sunken' : 'default'}>
          <VideoGrid videos={cat.videos} columns={3} playLabel={ui.playVideo} watchLabel={ui.watchOnYouTube} />
        </Section>
      ))}
      {c.cta?.title && (
        <CTA
          id="cta"
          title={c.cta.title}
          body={c.cta.description}
          primary={c.cta.buttonText ? { label: c.cta.buttonText, href: localeHref(c.cta.buttonLink || '/contact-us', locale) } : undefined}
        />
      )}
    </>
  );
}

const route = createRoute({ file: 'video-gallery.json', route: '/video-gallery', Template: VideoGallery });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
