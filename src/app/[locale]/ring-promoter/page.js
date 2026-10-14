import { createRoute } from '@/app/components/sections/createRoute';
import ProductLanding from '@/app/components/sections/templates/ProductLanding';

export const dynamic = 'force-static';

const route = createRoute({
  file: 'ring-promoter.json',
  route: '/ring-promoter',
  Template: ProductLanding,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
