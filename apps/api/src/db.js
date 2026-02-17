import { Pool } from 'pg';

import { config } from './config.js';

const sampleSprings = [
  {
    id: 'demo-spring-1',
    name: 'Spring Hill Spring',
    status: 'active',
    latitude: 36.0,
    longitude: -86.9,
    city: 'Columbia',
    region: 'TN'
  }
];

const sampleMeetups = [
  {
    id: 'demo-meetup-1',
    spring_id: 'demo-spring-1',
    title: 'Saturday Refill Run',
    description: 'Bring 5-gallon containers.',
    start_time: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    max_attendees: 8,
    visibility: 'public',
    status: 'scheduled'
  }
];

const hasDb = Boolean(config.databaseUrl);
const pool = hasDb ? new Pool({ connectionString: config.databaseUrl }) : null;

export const db = {
  hasDb,
  async isReady() {
    if (!pool) return false;
    await pool.query('SELECT 1');
    return true;
  },
  async query(text, params = []) {
    if (!pool) throw new Error('DATABASE_NOT_CONFIGURED');
    return pool.query(text, params);
  },
  sampleSprings,
  sampleMeetups
};
