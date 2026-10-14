import { createRoute } from '@/app/components/sections/createRoute';
import ServiceDetail from '@/app/components/sections/templates/ServiceDetail';

export const dynamic = 'force-static';

const route = createRoute({
  file: 'autonomous-operations.json',
  route: '/services/autonomous-operations',
  Template: ServiceDetail,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
