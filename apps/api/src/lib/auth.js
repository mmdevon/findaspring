import { config } from '../config.js';
import { db } from '../db.js';
import { verifyAccessToken } from './tokens.js';

export const getBearerToken = (req) => {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : '';
};

export const requireUser = async (req) => {
  if (!db.hasDb) {
    return { error: { status: 503, body: { error: 'Database is required. Configure DATABASE_URL.' } } };
  }

  const token = getBearerToken(req);
  const parsed = verifyAccessToken(token, config.authSecret);
  if (!parsed) return { error: { status: 401, body: { error: 'Unauthorized' } } };

  const found = await db.query(`SELECT id, email, display_name, role FROM users WHERE id = $1 LIMIT 1`, [parsed.sub]);
  if (found.rowCount === 0) return { error: { status: 401, body: { error: 'Unauthorized' } } };

  return { user: found.rows[0] };
};

export const requireRole = async (req, roles) => {
  const auth = await requireUser(req);
  if (auth.error) return auth;

  if (!roles.includes(auth.user.role)) {
    return { error: { status: 403, body: { error: 'Forbidden' } } };
  }

  return auth;
};
