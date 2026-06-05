import { checkCreditStatus, getEffectiveCreditLimit } from '../services/credit.service';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.error(`  ✗ ${message}`); }
}

console.log('\nCredit service');
assert(getEffectiveCreditLimit({ creditLimit: 10000, creditOverride: 15000 }) === 15000, 'override precedence');
assert(checkCreditStatus({ creditLimit: 0, ledgerBalance: 50000 }).status === 'no_limit', 'zero limit = unlimited');

export { passed as creditPassed, failed as creditFailed };
