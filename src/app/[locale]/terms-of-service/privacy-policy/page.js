import { createRoute } from '@/app/components/sections/createRoute';
import LegalPage from '@/app/components/sections/templates/LegalPage';

export const dynamic = 'force-static';

const route = createRoute({
  file: 'privacy-policy.json',
  route: '/privacy-policy', // duplicate of /privacy-policy: canonical points there,
  Template: LegalPage,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
