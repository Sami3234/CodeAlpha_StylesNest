/**
 * Smoke-test API routes — run with dev server: npm run dev
 * Usage: node scripts/test-apis.mjs [baseUrl]
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const BASE = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

/** @type {{ method: string; path: string; expect: number[]; body?: object; label?: string }[]} */
const CASES = [
  { method: 'GET', path: '/api/products', expect: [200] },
  { method: 'GET', path: '/api/contact-settings', expect: [200] },
  { method: 'GET', path: '/api/payment-methods', expect: [200] },
  { method: 'GET', path: '/api/landing-images', expect: [200] },
  { method: 'GET', path: '/api/trending-products', expect: [200] },
  { method: 'GET', path: '/api/admin/auth', expect: [200] },
  { method: 'GET', path: '/api/orders', expect: [401, 403] },
  {
    method: 'POST',
    path: '/api/orders',
    expect: [401, 403],
    body: {
      customer: 'Test',
      phone: '03001234567',
      city: 'Lahore',
      address: 'Test address',
      products: [{ productId: 1, quantity: 1 }],
      total: 100,
    },
    label: 'orders POST (no session)',
  },
  {
    method: 'POST',
    path: '/api/reviews',
    expect: [401, 400, 403],
    body: { productId: 1, rating: 5, comment: 'test' },
    label: 'reviews POST (no session)',
  },
  { method: 'GET', path: '/api/account/orders', expect: [401, 403] },
  { method: 'GET', path: '/api/account/reviewable', expect: [401, 403] },
  { method: 'GET', path: '/api/abandoned', expect: [401, 403] },
  {
    method: 'POST',
    path: '/api/auth/register',
    expect: [400, 409],
    body: { email: 'not-an-email', password: '1', name: '' },
    label: 'register validation',
  },
  { method: 'GET', path: '/api/admin/orders/list', expect: [401, 403] },
  { method: 'GET', path: '/api/admin/reviews', expect: [401, 403] },
  { method: 'GET', path: '/api/products/1/reviews', expect: [200, 404] },
  { method: 'GET', path: '/robots.txt', expect: [200] },
  { method: 'GET', path: '/sitemap.xml', expect: [200] },
  { method: 'GET', path: '/llms.txt', expect: [200] },
  { method: 'GET', path: '/manifest.webmanifest', expect: [200] },
];

async function runOne(test) {
  const url = `${BASE}${test.path}`;
  const init = {
    method: test.method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  };
  if (test.body) {
    init.body = JSON.stringify(test.body);
  }

  try {
    const res = await fetch(url, init);
    const ok = test.expect.includes(res.status);
    let snippet = '';
    try {
      const text = await res.text();
      snippet = text.slice(0, 120).replace(/\s+/g, ' ');
    } catch {
      snippet = '';
    }
    return {
      ok,
      status: res.status,
      path: test.path,
      method: test.method,
      label: test.label,
      snippet,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      path: test.path,
      method: test.method,
      label: test.label,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  console.log(`API smoke test → ${BASE}\n`);

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of CASES) {
    const result = await runOne(test);
    const name = test.label || `${test.method} ${test.path}`;
    if (result.ok) {
      passed++;
      console.log(`✓ ${name} → ${result.status}`);
    } else {
      failed++;
      const detail = result.error
        ? `NETWORK ${result.error}`
        : `got ${result.status}, expected [${test.expect.join('|')}] ${result.snippet ? `— ${result.snippet}` : ''}`;
      console.log(`✗ ${name} → ${detail}`);
      failures.push({ name, ...result, expected: test.expect });
    }
  }

  console.log(`\n${passed} passed, ${failed} failed, ${CASES.length} total`);

  if (failed > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  - ${f.name}`);
    }
    process.exit(1);
  }
}

main();
