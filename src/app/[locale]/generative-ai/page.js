import { createRoute } from '@/app/components/sections/createRoute';
import MarketingLanding from '@/app/components/sections/templates/MarketingLanding';

export const dynamic = 'force-static';

const route = createRoute({
  file: 'generative-ai.json',
  route: '/generative-ai',
  Template: MarketingLanding,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
