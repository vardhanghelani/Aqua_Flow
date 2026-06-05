import { sanitizeUserDoc } from '../services/backup.service';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.error(`  ✗ ${message}`); }
}

console.log('\nBackup security');
const sanitized = sanitizeUserDoc({
  _id: '1',
  name: 'Test',
  loginId: 'testowner',
  password: '$2a$10$hash',
  role: 'owner',
});
assert(sanitized.password === undefined, 'password excluded from export');
assert(sanitized.loginId === 'testowner', 'safe fields retained');

export { passed as backupPassed, failed as backupFailed };
