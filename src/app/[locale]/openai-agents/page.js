import { createRoute } from '@/app/components/sections/createRoute';
import AgentsLanding from '@/app/components/sections/templates/AgentsLanding';

export const dynamic = 'force-static';

const route = createRoute({
  file: 'openai-agents.json',
  route: '/openai-agents',
  Template: AgentsLanding,
  meta: (d) => ({ title: d.header?.title, description: d.hero?.description }),
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
