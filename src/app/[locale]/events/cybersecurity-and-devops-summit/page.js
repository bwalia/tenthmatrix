import { createRoute } from '@/app/components/sections/createRoute';
import EventPage from '@/app/components/sections/templates/EventPage';

export const dynamic = 'force-static';

const route = createRoute({ file: 'cybersecurity-devops-summit.json', route: '/events/cybersecurity-and-devops-summit', Template: EventPage });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
