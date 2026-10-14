import { createRoute } from '@/app/components/sections/createRoute';
import ServiceDetail from '@/app/components/sections/templates/ServiceDetail';

export const dynamic = 'force-static';

const route = createRoute({
  file: 'software-development.json',
  route: '/services/software-development',
  Template: ServiceDetail,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
