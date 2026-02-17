import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const truncateSql =
  'TRUNCATE TABLE user_reports, user_blocks, meetup_messages, meetup_members, meetups, favorites, spring_reports, spring_submissions, springs, refresh_tokens, users RESTART IDENTITY CASCADE';

export const setupIntegrationApp = async (testDbUrl) => {
  const { Pool } = await import('pg');

  process.env.DATABASE_URL = testDbUrl;
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret';
  process.env.BOOTSTRAP_ADMIN_KEY = process.env.BOOTSTRAP_ADMIN_KEY || 'bootstrap-test-key';

  const pool = new Pool({ connectionString: testDbUrl });

  const schemaPath = new URL('../../../../db/schema.sql', import.meta.url);
  const schemaSql = await readFile(schemaPath, 'utf8');
  await pool.query(schemaSql);
  await pool.query(truncateSql);

  const { app } = await import('../../src/app.js');
  const server = createServer((req, res) => app(req, res));

  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  const request = async (path, options) => {
    const response = await fetch(`${base}${path}`, options);
    const payload = await response.json().catch(() => ({}));
    return { status: response.status, payload };
  };

  const close = async () => {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  };

  return { pool, request, close };
};
