import { resolveDriverId } from '../utils/driverAuth';
import { AuthRequest } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.error(`  ✗ ${message}`); }
}

console.log('\nDriver ownership');
const driverReq = { user: { id: '1', role: 'driver' as const, driverId: 'drv1', loginId: 'driver1', name: '' } } as AuthRequest;
assert(resolveDriverId(driverReq) === 'drv1', 'driver uses session driverId');

let threw = false;
try {
  resolveDriverId(driverReq, 'other-driver');
} catch {
  threw = true;
}
assert(threw, 'driver cannot impersonate another driverId');

export { passed as driverAuthPassed, failed as driverAuthFailed };
