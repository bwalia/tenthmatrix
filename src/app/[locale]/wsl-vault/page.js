import { createRoute } from '@/app/components/sections/createRoute';
import ProductLanding from '@/app/components/sections/templates/ProductLanding';

export const dynamic = 'force-static';

const route = createRoute({
  file: 'wsl-vault.json',
  route: '/wsl-vault',
  Template: ProductLanding,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
