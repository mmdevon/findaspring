import test from 'node:test';
import assert from 'node:assert/strict';

import { hashPassword, verifyPassword } from './passwords.js';

test('hash and verify password', () => {
  const hashed = hashPassword('super-secret-password');
  assert.equal(verifyPassword('super-secret-password', hashed), true);
  assert.equal(verifyPassword('wrong-password', hashed), false);
});
