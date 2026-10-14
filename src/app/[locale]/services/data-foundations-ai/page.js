import { createRoute } from '@/app/components/sections/createRoute';
import ServiceDetail from '@/app/components/sections/templates/ServiceDetail';

export const dynamic = 'force-static';

const route = createRoute({
  file: 'data-foundations-ai.json',
  route: '/services/data-foundations-ai',
  Template: ServiceDetail,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
