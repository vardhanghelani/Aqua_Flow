let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.error(`  ✗ ${message}`); }
}

console.log('\nJWT security');
const secret = process.env.JWT_SECRET?.trim();
const INSECURE = new Set(['', 'dev-secret', 'secret', 'changeme']);
assert(!!secret && !INSECURE.has(secret), 'JWT_SECRET set and not insecure default');

export { passed as jwtPassed, failed as jwtFailed };
