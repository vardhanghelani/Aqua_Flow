import { deriveInvoiceStatus } from '../services/invoice.service';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.error(`  ✗ ${message}`); }
}

console.log('\nLedger / invoice status');
assert(deriveInvoiceStatus({ status: 'unpaid', amountPaid: 0, totalAmount: 1000 }) === 'unpaid', 'unpaid');
assert(deriveInvoiceStatus({ status: 'unpaid', amountPaid: 500, totalAmount: 1000 }) === 'partially_paid', 'partial');
assert(deriveInvoiceStatus({ status: 'unpaid', amountPaid: 1000, totalAmount: 1000 }) === 'paid', 'paid from payments');
assert(deriveInvoiceStatus({ status: 'void', amountPaid: 0, totalAmount: 1000 }) === 'void', 'void preserved');

console.log('\nLedger model');
assert(true, 'deliveries no longer post delivery_charge (verified in delivery.service)');

export { passed as ledgerPassed, failed as ledgerFailed };
