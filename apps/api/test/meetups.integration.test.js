import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const testDbUrl = process.env.TEST_DATABASE_URL || '';

const resetTables = async (pool) => {
  await pool.query('TRUNCATE TABLE user_reports, user_blocks, meetup_messages, meetup_members, meetups, favorites, spring_reports, spring_submissions, springs, refresh_tokens, users RESTART IDENTITY CASCADE');
};

test(
  'meetup creation, rsvp, chat, user report, and moderation resolve flow',
  { skip: !testDbUrl },
  async () => {
    const { Pool } = await import('pg');

    process.env.DATABASE_URL = testDbUrl;
    process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret';
    process.env.BOOTSTRAP_ADMIN_KEY = process.env.BOOTSTRAP_ADMIN_KEY || 'bootstrap-test-key';

    const pool = new Pool({ connectionString: testDbUrl });

    const schemaPath = new URL('../../../db/schema.sql', import.meta.url);
    const schemaSql = await readFile(schemaPath, 'utf8');

    await pool.query(schemaSql);
    await resetTables(pool);

    const { app } = await import('../src/app.js');

    const server = createServer((req, res) => {
      app(req, res);
    });

    await new Promise((resolve) => server.listen(0, resolve));
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const base = `http://127.0.0.1:${address.port}`;

    const request = async (path, options) => {
      const response = await fetch(`${base}${path}`, options);
      const payload = await response.json().catch(() => ({}));
      return { status: response.status, payload };
    };

    const springId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO springs (id, name, slug, location, status) VALUES ($1, 'Test Spring', 'test-spring', ST_SetSRID(ST_MakePoint(-86.9, 36.0), 4326)::geography, 'active')`,
      [springId]
    );

    const signupHost = await request('/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'host@example.com',
        display_name: 'Host',
        password: 'host-password-123'
      })
    });
    assert.equal(signupHost.status, 201);
    const hostToken = signupHost.payload.access_token;

    const signupGuest = await request('/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'guest@example.com',
        display_name: 'Guest',
        password: 'guest-password-123'
      })
    });
    assert.equal(signupGuest.status, 201);
    const guestToken = signupGuest.payload.access_token;
    const guestUserId = signupGuest.payload.user.id;

    const bootstrapAdmin = await request('/v1/auth/bootstrap-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bootstrap-key': process.env.BOOTSTRAP_ADMIN_KEY
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        display_name: 'Admin',
        password: 'admin-password-123'
      })
    });
    assert.equal(bootstrapAdmin.status, 201);
    const adminToken = bootstrapAdmin.payload.access_token;

    const createMeetup = await request('/v1/meetups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hostToken}`
      },
      body: JSON.stringify({
        spring_id: springId,
        title: 'Integration Meetup',
        description: 'Bring containers',
        start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        max_attendees: 2
      })
    });
    assert.equal(createMeetup.status, 201);
    const meetupId = createMeetup.payload.data.id;

    const rsvpGuest = await request(`/v1/meetups/${meetupId}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${guestToken}`
      },
      body: JSON.stringify({ status: 'going' })
    });
    assert.equal(rsvpGuest.status, 200);

    const sendMessage = await request(`/v1/meetups/${meetupId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${guestToken}`
      },
      body: JSON.stringify({ body: 'On my way' })
    });
    assert.equal(sendMessage.status, 201);
    const messageId = sendMessage.payload.data.id;

    const reportUser = await request(`/v1/users/${guestUserId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hostToken}`
      },
      body: JSON.stringify({ reason: 'spam', details: 'test report', target_message_id: messageId })
    });
    assert.equal(reportUser.status, 201);
    const userReportId = reportUser.payload.data.id;

    const listUserReports = await request('/v1/moderation/user-reports?status=open', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    assert.equal(listUserReports.status, 200);
    assert.ok(Array.isArray(listUserReports.payload.data));
    assert.ok(listUserReports.payload.data.find((item) => item.id === userReportId));

    const resolveUserReport = await request(`/v1/moderation/user-reports/${userReportId}/resolve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    assert.equal(resolveUserReport.status, 200);
    assert.equal(resolveUserReport.payload.data.status, 'resolved');

    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
);
