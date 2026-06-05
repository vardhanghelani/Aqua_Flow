import 'dotenv/config';
import { creditPassed, creditFailed } from './credit.test';
import { ledgerPassed, ledgerFailed } from './ledger.test';
import { jwtPassed, jwtFailed } from './jwt.test';
import { backupPassed, backupFailed } from './backup.test';
import { driverAuthPassed, driverAuthFailed } from './driverAuth.test';
import { invoicePassed, invoiceFailed } from './invoice.test';

const passed = creditPassed + ledgerPassed + jwtPassed + backupPassed + driverAuthPassed + invoicePassed;
const failed = creditFailed + ledgerFailed + jwtFailed + backupFailed + driverAuthFailed + invoiceFailed;

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
