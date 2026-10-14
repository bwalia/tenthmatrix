/**
 * Asserts the lead form resolves the right OpsAPI host per environment.
 *
 * One Docker image serves int/test/acc/prod, so this mapping — not a runtime
 * env var — is what keeps a lead submitted on acc out of the production CRM.
 * A regression here is silent in the browser, hence the build-time check.
 *
 * Pure logic, no network. Run via `npm run verify` (and therefore prebuild/CI).
 */
import assert from "assert";
import { opsapiUrlForHost, leadsEndpoint, resolveOpsapiUrl } from "../src/utils/opsapiEnv.mjs";

const LEADS_PATH = "/api/v2/public/leads/tenthmatrix";

/* Site hosts come from devops/helm-charts/tm-chart/values-*.yaml, plus the
   `-www` alias each env may publish. */
const cases = [
  ["int.tenthmatrix.com", "https://int-api.tenthmatrix.com"],
  ["int-www.tenthmatrix.com", "https://int-api.tenthmatrix.com"],
  ["test.tenthmatrix.com", "https://test-api.tenthmatrix.com"],
  ["test-www.tenthmatrix.com", "https://test-api.tenthmatrix.com"],
  ["acc.tenthmatrix.com", "https://acc-api.tenthmatrix.com"],
  ["acc-www.tenthmatrix.com", "https://acc-api.tenthmatrix.com"],
  ["www.tenthmatrix.com", "https://api.tenthmatrix.com"],
  ["prod-www.tenthmatrix.com", "https://api.tenthmatrix.com"],
  ["tenthmatrix.com", "https://api.tenthmatrix.com"],
  ["WWW.TenthMatrix.com", "https://api.tenthmatrix.com"],
  ["www.tenthmatrix.com:443", "https://api.tenthmatrix.com"],
  // Workstation's hosts are NOT ours — they must not resolve here.
  ["www.workstation.co.uk", null],
  ["int.workstation.co.uk", null],
  // Look-alike domains must not match.
  ["eviltenthmatrix.com", null],
  ["tenthmatrix.com.evil.io", null],
  // Not an environment host -> caller falls back to config.
  ["localhost", null],
  ["example.com", null],
  ["", null],
];

const errors = [];

for (const [host, expected] of cases) {
  const actual = opsapiUrlForHost(host);
  if (actual !== expected) {
    errors.push(`${host || "<empty>"}: expected ${expected} but got ${actual}`);
  }
}

/* An environment host must never fall through to production, and the endpoint
   path is fixed by the OpsAPI contract. */
for (const env of ["int", "test", "acc"]) {
  const host = `${env}.tenthmatrix.com`;
  const endpoint = leadsEndpoint({ hostname: host });
  const want = `https://${env}-api.tenthmatrix.com${LEADS_PATH}`;
  if (endpoint !== want) {
    errors.push(`${host}: endpoint ${endpoint} !== ${want}`);
  }
}

// Prod endpoint.
assert.strictEqual(
  leadsEndpoint({ hostname: "www.tenthmatrix.com" }),
  `https://api.tenthmatrix.com${LEADS_PATH}`,
  "www must post to the production API",
);

// An explicit override still wins (local dev against another environment).
assert.strictEqual(
  leadsEndpoint({ override: "https://int-api.tenthmatrix.com/", hostname: "www.tenthmatrix.com" }),
  `https://int-api.tenthmatrix.com${LEADS_PATH}`,
  "explicit override should win and trailing slash should be trimmed",
);

// Unknown host with no NEXT_PUBLIC_OPSAPI_URL falls back to production.
const savedEnv = process.env.NEXT_PUBLIC_OPSAPI_URL;
delete process.env.NEXT_PUBLIC_OPSAPI_URL;
assert.strictEqual(resolveOpsapiUrl({ hostname: "localhost" }), "https://api.tenthmatrix.com");
process.env.NEXT_PUBLIC_OPSAPI_URL = "https://test-api.tenthmatrix.com/";
assert.strictEqual(resolveOpsapiUrl({ hostname: "localhost" }), "https://test-api.tenthmatrix.com");
if (savedEnv === undefined) delete process.env.NEXT_PUBLIC_OPSAPI_URL;
else process.env.NEXT_PUBLIC_OPSAPI_URL = savedEnv;

if (errors.length) {
  console.error("OpsAPI environment mapping is wrong:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`OpsAPI env mapping OK (${cases.length} hosts, path ${LEADS_PATH}).`);
