import { createRoute } from '@/app/components/sections/createRoute';
import SectionsLanding from '@/app/components/sections/templates/SectionsLanding';

export const dynamic = 'force-static';

const route = createRoute({
  file: 'why-tenthmatrix-agents.json',
  route: '/why-tenthmatrix-agents',
  Template: SectionsLanding,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
