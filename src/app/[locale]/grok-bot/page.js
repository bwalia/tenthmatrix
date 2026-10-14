import { createRoute } from '@/app/components/sections/createRoute';
import AgentsLanding from '@/app/components/sections/templates/AgentsLanding';

export const dynamic = 'force-static';

const route = createRoute({
  file: 'grok-bot.json',
  route: '/grok-bot',
  Template: AgentsLanding,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
