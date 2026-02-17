import { readFile } from 'node:fs/promises';

import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

try {
  const schemaPath = new URL('../../../db/schema.sql', import.meta.url);
  const schemaSql = await readFile(schemaPath, 'utf8');
  await pool.query(schemaSql);
  console.log('Schema migration applied successfully.');
} catch (error) {
  console.error('Schema migration failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await pool.end();
}
