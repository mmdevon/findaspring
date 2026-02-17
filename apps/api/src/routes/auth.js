import crypto from 'node:crypto';

import { config } from '../config.js';
import { db } from '../db.js';
import { json, parseBody } from '../lib/http.js';
import { hashPassword, verifyPassword } from '../lib/passwords.js';
import { issueTokenPair, verifyAccessToken, verifyRefreshToken } from '../lib/tokens.js';

const trim = (value) => (typeof value === 'string' ? value.trim() : '');

const requireDb = (res) => {
  if (!db.hasDb) {
    json(res, 503, { error: 'Database is required for auth endpoints. Configure DATABASE_URL.' });
    return false;
  }
  return true;
};

const persistRefreshToken = async ({ refreshId, userId, expUnix }) => {
  await db.query(
    `INSERT INTO refresh_tokens (id, user_id, expires_at) VALUES ($1, $2, TO_TIMESTAMP($3))`,
    [refreshId, userId, expUnix]
  );
};

const removeRefreshToken = async (refreshId) => {
  await db.query(`DELETE FROM refresh_tokens WHERE id = $1`, [refreshId]);
};

const issueSession = async ({ userId }) => {
  const pair = issueTokenPair({
    userId,
    secret: config.authSecret,
    accessTtlSec: config.accessTokenTtlSec,
    refreshTtlSec: config.refreshTokenTtlSec
  });

  await persistRefreshToken({
    refreshId: pair.refreshId,
    userId,
    expUnix: pair.refreshExpUnix
  });

  return pair;
};

export const handleSignup = async (req, res) => {
  if (!requireDb(res)) return;

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const email = trim(body.email).toLowerCase();
  const displayName = trim(body.display_name);
  const password = trim(body.password);

  if (!email || !password || !displayName || password.length < 8) {
    return json(res, 400, { error: 'email, display_name, and password(min 8 chars) are required' });
  }

  const existing = await db.query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.rowCount > 0) {
    return json(res, 409, { error: 'Email already registered' });
  }

  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);

  await db.query(
    `INSERT INTO users (id, email, display_name, password_hash) VALUES ($1, $2, $3, $4)`,
    [userId, email, displayName, passwordHash]
  );

  const pair = await issueSession({ userId });

  return json(res, 201, {
    user: { id: userId, email, display_name: displayName, role: 'user' },
    access_token: pair.accessToken,
    refresh_token: pair.refreshToken,
    expires_in: config.accessTokenTtlSec
  });
};

export const handleLogin = async (req, res) => {
  if (!requireDb(res)) return;

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const email = trim(body.email).toLowerCase();
  const password = trim(body.password);

  const found = await db.query(
    `SELECT id, email, display_name, role, password_hash FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );

  if (found.rowCount === 0) return json(res, 401, { error: 'Invalid credentials' });

  const user = found.rows[0];
  if (!verifyPassword(password, user.password_hash)) {
    return json(res, 401, { error: 'Invalid credentials' });
  }

  const pair = await issueSession({ userId: user.id });

  return json(res, 200, {
    user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role },
    access_token: pair.accessToken,
    refresh_token: pair.refreshToken,
    expires_in: config.accessTokenTtlSec
  });
};

export const handleRefresh = async (req, res) => {
  if (!requireDb(res)) return;

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const refreshToken = trim(body.refresh_token);
  const parsed = verifyRefreshToken(refreshToken, config.authSecret);
  if (!parsed) return json(res, 401, { error: 'Invalid refresh token' });

  const found = await db.query(
    `SELECT id, user_id, revoked_at, expires_at FROM refresh_tokens WHERE id = $1 LIMIT 1`,
    [parsed.jti]
  );

  if (found.rowCount === 0) return json(res, 401, { error: 'Refresh token not found' });

  const tokenRow = found.rows[0];
  if (tokenRow.revoked_at || new Date(tokenRow.expires_at).getTime() < Date.now()) {
    return json(res, 401, { error: 'Refresh token expired or revoked' });
  }

  await removeRefreshToken(parsed.jti);
  const pair = await issueSession({ userId: parsed.sub });

  return json(res, 200, {
    access_token: pair.accessToken,
    refresh_token: pair.refreshToken,
    expires_in: config.accessTokenTtlSec
  });
};

export const handleLogout = async (req, res) => {
  if (!requireDb(res)) return;

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const refreshToken = trim(body.refresh_token);
  const parsed = verifyRefreshToken(refreshToken, config.authSecret);
  if (!parsed) return json(res, 200, { ok: true });

  await db.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`, [parsed.jti]);
  return json(res, 200, { ok: true });
};

export const handleMe = async (req, res) => {
  if (!requireDb(res)) return;

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const parsed = verifyAccessToken(token, config.authSecret);

  if (!parsed) return json(res, 401, { error: 'Unauthorized' });

  const found = await db.query(`SELECT id, email, display_name, role FROM users WHERE id = $1 LIMIT 1`, [parsed.sub]);
  if (found.rowCount === 0) return json(res, 401, { error: 'Unauthorized' });

  return json(res, 200, { user: found.rows[0] });
};

export const handleBootstrapAdmin = async (req, res) => {
  if (!requireDb(res)) return;

  if (!config.bootstrapAdminKey) {
    return json(res, 403, { error: 'Bootstrap disabled. Set BOOTSTRAP_ADMIN_KEY to enable.' });
  }

  const provided = req.headers['x-bootstrap-key'];
  if (provided !== config.bootstrapAdminKey) {
    return json(res, 403, { error: 'Invalid bootstrap key' });
  }

  const admins = await db.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  if (admins.rowCount > 0) {
    return json(res, 409, { error: 'Admin already exists. Use seed script or DB tools for role changes.' });
  }

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const email = trim(body.email).toLowerCase();
  const displayName = trim(body.display_name);
  const password = trim(body.password);

  if (!email || !password || !displayName || password.length < 8) {
    return json(res, 400, { error: 'email, display_name, and password(min 8 chars) are required' });
  }

  const existing = await db.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [email]);
  if (existing.rowCount > 0) {
    return json(res, 409, { error: 'Email already registered' });
  }

  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);

  await db.query(
    `INSERT INTO users (id, email, display_name, password_hash, role) VALUES ($1, $2, $3, $4, 'admin')`,
    [userId, email, displayName, passwordHash]
  );

  const pair = await issueSession({ userId });

  return json(res, 201, {
    user: { id: userId, email, display_name: displayName, role: 'admin' },
    access_token: pair.accessToken,
    refresh_token: pair.refreshToken,
    expires_in: config.accessTokenTtlSec
  });
};
