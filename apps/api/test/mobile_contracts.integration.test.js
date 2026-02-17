import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { setupIntegrationApp } from './helpers/integration.js';

const testDbUrl = process.env.TEST_DATABASE_URL || '';

test(
  'mobile contracts: auth, springs, and meetups payload shapes remain compatible',
  { skip: !testDbUrl },
  async () => {
    const { pool, request, close } = await setupIntegrationApp(testDbUrl);

    try {
      const signup = await request('/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'contract-user@example.com',
          display_name: 'Contract User',
          password: 'password-123'
        })
      });
      assert.equal(signup.status, 201);
      assert.equal(typeof signup.payload.access_token, 'string');
      assert.equal(typeof signup.payload.refresh_token, 'string');
      assert.equal(typeof signup.payload.user.id, 'string');
      assert.equal(signup.payload.user.email, 'contract-user@example.com');

      const userToken = signup.payload.access_token;
      const userId = signup.payload.user.id;

      const springId = crypto.randomUUID();
      await pool.query(
        `
        INSERT INTO springs (id, name, slug, location, country, region, city, status, created_by)
        VALUES (
          $1,
          'Contract Spring',
          'contract-spring',
          ST_SetSRID(ST_MakePoint(-86.9, 36.0), 4326)::geography,
          'US',
          'TN',
          'Columbia',
          'active',
          $2
        )
        `,
        [springId, userId]
      );

      const springs = await request('/v1/springs?q=spring', { method: 'GET' });
      assert.equal(springs.status, 200);
      assert.ok(Array.isArray(springs.payload.data));
      const spring = springs.payload.data[0];
      assert.ok(spring);
      assert.equal(typeof spring.name, 'string');
      assert.equal(typeof spring.status, 'string');
      assert.equal(typeof spring.latitude, 'number');
      assert.equal(typeof spring.longitude, 'number');

      const createMeetup = await request('/v1/meetups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          spring_id: springId,
          title: 'Contract Meetup',
          description: 'Used by contract test',
          start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          max_attendees: 5
        })
      });
      assert.equal(createMeetup.status, 201);
      const meetupId = createMeetup.payload.data.id;

      const meetups = await request('/v1/meetups', { method: 'GET' });
      assert.equal(meetups.status, 200);
      assert.ok(Array.isArray(meetups.payload.data));
      const listedMeetup = meetups.payload.data.find((item) => item.id === meetupId);
      assert.ok(listedMeetup);
      assert.equal(typeof listedMeetup.title, 'string');
      assert.equal(typeof listedMeetup.start_time, 'string');
      assert.equal(typeof listedMeetup.max_attendees, 'number');

      const meetupDetail = await request(`/v1/meetups/${meetupId}`, { method: 'GET' });
      assert.equal(meetupDetail.status, 200);
      assert.equal(meetupDetail.payload.data.id, meetupId);
      assert.ok(Array.isArray(meetupDetail.payload.data.members));

      const sendMessage = await request(`/v1/meetups/${meetupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ body: 'Contract message' })
      });
      assert.equal(sendMessage.status, 201);
      assert.equal(sendMessage.payload.data.body, 'Contract message');
      assert.equal(typeof sendMessage.payload.data.created_at, 'string');

      const messages = await request(`/v1/meetups/${meetupId}/messages`, { method: 'GET' });
      assert.equal(messages.status, 200);
      assert.ok(Array.isArray(messages.payload.data));
      assert.ok(
        messages.payload.next_cursor === null || typeof messages.payload.next_cursor === 'string'
      );
    } finally {
      await close();
    }
  }
);
