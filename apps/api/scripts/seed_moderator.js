import crypto from 'node:crypto';

import pg from 'pg';

import { hashPassword } from '../src/lib/passwords.js';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || '';
const email = (process.env.MODERATOR_EMAIL || '').trim().toLowerCase();
const displayName = (process.env.MODERATOR_DISPLAY_NAME || '').trim();
const password = (process.env.MODERATOR_PASSWORD || '').trim();
const role = (process.env.MODERATOR_ROLE || 'moderator').trim();

if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

if (!email || !displayName || !password || password.length < 8) {
  console.error('MODERATOR_EMAIL, MODERATOR_DISPLAY_NAME, and MODERATOR_PASSWORD(min 8 chars) are required');
  process.exit(1);
}

if (!['moderator', 'admin'].includes(role)) {
  console.error("MODERATOR_ROLE must be 'moderator' or 'admin'");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

const run = async () => {
  const found = await pool.query(`SELECT id, role FROM users WHERE email = $1 LIMIT 1`, [email]);

  if (found.rowCount > 0) {
    const existing = found.rows[0];
    if (existing.role !== role) {
      await pool.query(`UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1`, [existing.id, role]);
      console.log(`Updated role for ${email} to ${role}`);
    } else {
      console.log(`User already exists with role ${role}: ${email}`);
    }
    return;
  }

  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);

  await pool.query(
    `INSERT INTO users (id, email, display_name, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
    [userId, email, displayName, passwordHash, role]
  );

  console.log(`Created ${role} user: ${email}`);
};

run()
  .catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
