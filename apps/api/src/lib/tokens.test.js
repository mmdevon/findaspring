import test from 'node:test';
import assert from 'node:assert/strict';

import { issueTokenPair, verifyAccessToken, verifyRefreshToken } from './tokens.js';

test('issue and verify token pair', () => {
  const pair = issueTokenPair({
    userId: 'user-1',
    secret: 'test-secret',
    accessTtlSec: 60,
    refreshTtlSec: 120
  });

  const access = verifyAccessToken(pair.accessToken, 'test-secret');
  const refresh = verifyRefreshToken(pair.refreshToken, 'test-secret');

  assert.equal(access?.sub, 'user-1');
  assert.equal(refresh?.sub, 'user-1');
  assert.equal(refresh?.jti, pair.refreshId);
});
