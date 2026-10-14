import { createRoute } from '@/app/components/sections/createRoute';
import LegalPage from '@/app/components/sections/templates/LegalPage';

export const dynamic = 'force-static';

const route = createRoute({
  file: 'data-deletion.json',
  route: '/data-deletion',
  Template: LegalPage,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
