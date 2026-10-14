import { createRoute } from '@/app/components/sections/createRoute';
import ServiceDetail from '@/app/components/sections/templates/ServiceDetail';

export const dynamic = 'force-static';

const route = createRoute({
  file: 'ai-solutions-consultancy.json',
  route: '/services/ai-solutions-consultancy',
  Template: ServiceDetail,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
