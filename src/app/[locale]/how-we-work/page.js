import { createRoute } from '@/app/components/sections/createRoute';
import SectionsLanding from '@/app/components/sections/templates/SectionsLanding';

export const dynamic = 'force-static';

/**
 * How we work (main menu): the merged page for the process, ways to work with
 * us, pricing approach, security and ownership, and FAQs. The longer
 * outsourcing and why-agents pages stay as "More detail".
 */
const route = createRoute({ file: 'how-we-work.json', route: '/how-we-work', Template: SectionsLanding });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
