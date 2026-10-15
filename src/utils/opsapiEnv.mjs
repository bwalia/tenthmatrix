/**
 * Browser-facing OpsAPI base URL, resolved per environment.
 *
 * Why this is derived from the hostname rather than read from an env var:
 *
 * One Docker image is built once (Dockerfile.prod) and the SAME image is
 * rolled out to int, test, acc and prod (see .github/workflows/deploy-k3s.yaml).
 * Next.js inlines every NEXT_PUBLIC_* value into the client bundle at BUILD
 * time, so a value injected into the pod at runtime (Helm `appConfig`, the
 * Vault-backed ExternalSecret) can never reach code that runs in the browser.
 * It is already frozen in the JS the visitor downloads.
 *
 * The one signal that genuinely differs per environment at runtime is the host
 * the page is served from. TenthMatrix has its own API hostnames, which proxy
 * to the same OpsAPI instances Workstation uses (namespace `tenthmatrix`):
 *
 *   int.tenthmatrix.com   (+ int-www)   ->  https://int-api.tenthmatrix.com
 *   test.tenthmatrix.com  (+ test-www)  ->  https://test-api.tenthmatrix.com
 *   acc.tenthmatrix.com   (+ acc-www)   ->  https://acc-api.tenthmatrix.com
 *   www.tenthmatrix.com   + apex        ->  https://api.tenthmatrix.com
 *   www.tenthmatrix.co.uk + apex        ->  https://api.tenthmatrix.com (alias of prod)
 *
 * Anything that is not a recognised tenthmatrix.com environment host
 * (localhost, a preview build) falls back to NEXT_PUBLIC_OPSAPI_URL and then
 * to production.
 */

export const PROD_OPSAPI_URL = 'https://api.tenthmatrix.com';

export const SITE_DOMAIN = 'tenthmatrix.com';

/* Extra domains that serve the same prod site (apex + www only, no envs). */
export const ALIAS_DOMAINS = ['tenthmatrix.co.uk'];

/* Non-prod environments that have their own API host. `prod` is deliberately
   absent: its host has no prefix, so it is the default below. */
const PREFIXED_ENVS = ['int', 'test', 'acc'];

/** Leads + CMS namespace on OpsAPI. */
export const DEFAULT_NAMESPACE = 'tenthmatrix';

/**
 * Map a browser hostname to the OpsAPI base URL for that environment.
 * Returns null when the host is not a recognised tenthmatrix.com environment,
 * so the caller can fall back to configuration.
 *
 * @param {string} hostname e.g. window.location.hostname
 * @returns {string|null}
 */
export const opsapiUrlForHost = (hostname) => {
    const host = String(hostname || '').toLowerCase().split(':')[0];
    if (!host) return null;

    // The apex serves production, as do the alias domains' apex + www.
    if (host === SITE_DOMAIN) return PROD_OPSAPI_URL;
    if (ALIAS_DOMAINS.some((d) => host === d || host === `www.${d}`)) return PROD_OPSAPI_URL;
    if (!host.endsWith(`.${SITE_DOMAIN}`)) return null;

    /* Each env may publish a `-www` alias next to the bare host
       (int.tenthmatrix.com + int-www.tenthmatrix.com), so strip the alias
       suffix before matching. */
    const label = host.slice(0, -(SITE_DOMAIN.length + 1)).replace(/-www$/, '');

    if (PREFIXED_ENVS.includes(label)) {
        return `https://${label}-api.${SITE_DOMAIN}`;
    }

    // www / prod-www / bare prod -> production API.
    if (label === 'www' || label === 'prod') return PROD_OPSAPI_URL;

    return null;
};

/**
 * Resolve the OpsAPI base URL to call from the browser.
 *
 * Precedence: explicit override -> the environment the page is served from ->
 * NEXT_PUBLIC_OPSAPI_URL -> production. The hostname beats the build-time env
 * var on purpose: in a shared image that env var is a single baked constant,
 * whereas the host is the only thing that actually tells int from acc.
 *
 * @param {object} [options]
 * @param {string} [options.override] explicit base URL (wins outright)
 * @param {string} [options.hostname] defaults to window.location.hostname
 * @returns {string} base URL with no trailing slash
 */
export const resolveOpsapiUrl = ({ override, hostname } = {}) => {
    const host = hostname !== undefined
        ? hostname
        : (typeof window !== 'undefined' ? window.location.hostname : '');

    const base = override
        || opsapiUrlForHost(host)
        || process.env.NEXT_PUBLIC_OPSAPI_URL
        || PROD_OPSAPI_URL;

    return base.replace(/\/+$/, '');
};

/**
 * Full public CRM lead-capture endpoint for the current environment:
 * POST {base}/api/v2/public/leads/{namespace}
 */
export const leadsEndpoint = (options = {}) => {
    const namespace = process.env.NEXT_PUBLIC_LEADS_NAMESPACE || DEFAULT_NAMESPACE;
    return `${resolveOpsapiUrl(options)}/api/v2/public/leads/${namespace}`;
};
