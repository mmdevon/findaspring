import crypto from 'node:crypto';

import { db } from '../db.js';
import { requireRole, requireUser } from '../lib/auth.js';
import { json, parseBody } from '../lib/http.js';

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const requireDb = (res) => {
  if (!db.hasDb) {
    json(res, 503, { error: 'Database is required for this endpoint. Configure DATABASE_URL.' });
    return false;
  }
  return true;
};

export const handleCreateMeetup = async (req, res) => {
  const auth = await requireUser(req);
  if (auth.error) return json(res, auth.error.status, auth.error.body);

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const springId = typeof body.spring_id === 'string' ? body.spring_id.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : null;
  const startTimeRaw = typeof body.start_time === 'string' ? body.start_time.trim() : '';
  const maxAttendees = Math.min(100, Math.max(2, asNumber(body.max_attendees, 8)));
  const visibility = body.visibility === 'friends_only' ? 'friends_only' : 'public';

  if (!springId || !title || !startTimeRaw) {
    return json(res, 400, { error: 'spring_id, title, and start_time are required' });
  }

  const startTime = new Date(startTimeRaw);
  if (Number.isNaN(startTime.getTime())) {
    return json(res, 400, { error: 'start_time must be a valid ISO datetime' });
  }

  const springFound = await db.query(`SELECT id FROM springs WHERE id = $1 LIMIT 1`, [springId]);
  if (springFound.rowCount === 0) return json(res, 404, { error: 'Spring not found' });

  const meetupId = crypto.randomUUID();

  await db.query(
    `
    INSERT INTO meetups (id, spring_id, host_user_id, title, description, start_time, max_attendees, visibility, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled')
    `,
    [meetupId, springId, auth.user.id, title, description, startTime.toISOString(), maxAttendees, visibility]
  );

  await db.query(
    `
    INSERT INTO meetup_members (meetup_id, user_id, rsvp_status, role)
    VALUES ($1, $2, 'going', 'host')
    ON CONFLICT (meetup_id, user_id) DO UPDATE SET rsvp_status = 'going', role = 'host'
    `,
    [meetupId, auth.user.id]
  );

  return json(res, 201, {
    data: {
      id: meetupId,
      spring_id: springId,
      host_user_id: auth.user.id,
      title,
      description,
      start_time: startTime.toISOString(),
      max_attendees: maxAttendees,
      visibility,
      status: 'scheduled'
    }
  });
};

export const handleListMeetups = async (req, res, url) => {
  if (!db.hasDb) {
    return json(res, 200, { data: db.sampleMeetups, note: 'DATABASE_URL is not configured; returning sample meetups.' });
  }

  const springId = (url.searchParams.get('spring_id') || '').trim();
  const from = (url.searchParams.get('from') || '').trim();

  const where = [`m.status = 'scheduled'`];
  const params = [];

  if (springId) {
    params.push(springId);
    where.push(`m.spring_id = $${params.length}`);
  }

  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) {
      params.push(fromDate.toISOString());
      where.push(`m.start_time >= $${params.length}`);
    }
  }

  const sql = `
    SELECT
      m.id,
      m.spring_id,
      m.host_user_id,
      m.title,
      m.description,
      m.start_time,
      m.max_attendees,
      m.visibility,
      m.status,
      m.created_at,
      s.name AS spring_name,
      COALESCE(att.going_count, 0) AS going_count
    FROM meetups m
    JOIN springs s ON s.id = m.spring_id
    LEFT JOIN (
      SELECT meetup_id, COUNT(*)::int AS going_count
      FROM meetup_members
      WHERE rsvp_status = 'going'
      GROUP BY meetup_id
    ) att ON att.meetup_id = m.id
    WHERE ${where.join(' AND ')}
    ORDER BY m.start_time ASC
    LIMIT 100
  `;

  const result = await db.query(sql, params);
  return json(res, 200, { data: result.rows });
};

export const handleGetMeetup = async (req, res, meetupId) => {
  if (!db.hasDb) {
    const found = db.sampleMeetups.find((m) => m.id === meetupId);
    if (!found) return json(res, 404, { error: 'Meetup not found' });
    return json(res, 200, { data: { ...found, members: [] } });
  }

  const result = await db.query(
    `
    SELECT
      m.id,
      m.spring_id,
      m.host_user_id,
      m.title,
      m.description,
      m.start_time,
      m.max_attendees,
      m.visibility,
      m.status,
      s.name AS spring_name
    FROM meetups m
    JOIN springs s ON s.id = m.spring_id
    WHERE m.id = $1
    LIMIT 1
    `,
    [meetupId]
  );

  if (result.rowCount === 0) return json(res, 404, { error: 'Meetup not found' });

  const members = await db.query(
    `
    SELECT user_id, rsvp_status, role, joined_at
    FROM meetup_members
    WHERE meetup_id = $1
    ORDER BY joined_at ASC
    `,
    [meetupId]
  );

  return json(res, 200, {
    data: {
      ...result.rows[0],
      members: members.rows
    }
  });
};

export const handleRsvpMeetup = async (req, res, meetupId) => {
  const auth = await requireUser(req);
  if (auth.error) return json(res, auth.error.status, auth.error.body);

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const requested = body.status === 'maybe' ? 'maybe' : body.status === 'left' ? 'left' : 'going';

  const meetupResult = await db.query(
    `SELECT id, max_attendees, status FROM meetups WHERE id = $1 LIMIT 1`,
    [meetupId]
  );
  if (meetupResult.rowCount === 0) return json(res, 404, { error: 'Meetup not found' });
  if (meetupResult.rows[0].status !== 'scheduled') return json(res, 409, { error: 'Meetup is not open for RSVP' });

  let finalStatus = requested;

  if (requested === 'going') {
    const goingCountResult = await db.query(
      `SELECT COUNT(*)::int AS count FROM meetup_members WHERE meetup_id = $1 AND rsvp_status = 'going'`,
      [meetupId]
    );

    const goingCount = Number(goingCountResult.rows[0]?.count || 0);
    if (goingCount >= Number(meetupResult.rows[0].max_attendees || 0)) {
      finalStatus = 'waitlist';
    }
  }

  await db.query(
    `
    INSERT INTO meetup_members (meetup_id, user_id, rsvp_status, role)
    VALUES ($1, $2, $3, 'member')
    ON CONFLICT (meetup_id, user_id)
    DO UPDATE SET rsvp_status = EXCLUDED.rsvp_status
    `,
    [meetupId, auth.user.id, finalStatus]
  );

  return json(res, 200, { data: { meetup_id: meetupId, user_id: auth.user.id, status: finalStatus } });
};

export const handleGetMeetupMessages = async (req, res, meetupId, url) => {
  if (!db.hasDb) {
    return json(res, 200, { data: [], next_cursor: null });
  }

  const cursor = (url.searchParams.get('cursor') || '').trim();
  const where = [`meetup_id = $1`, `is_deleted = false`];
  const params = [meetupId];

  if (cursor) {
    const cursorDate = new Date(cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      params.push(cursorDate.toISOString());
      where.push(`created_at < $${params.length}`);
    }
  }

  const sql = `
    SELECT id, meetup_id, user_id, body, created_at
    FROM meetup_messages
    WHERE ${where.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const result = await db.query(sql, params);
  const rows = result.rows;

  return json(res, 200, {
    data: rows,
    next_cursor: rows.length > 0 ? rows[rows.length - 1].created_at : null
  });
};

export const handleCreateMeetupMessage = async (req, res, meetupId) => {
  const auth = await requireUser(req);
  if (auth.error) return json(res, auth.error.status, auth.error.body);

  if (!requireDb(res)) return;

  const member = await db.query(
    `
    SELECT user_id
    FROM meetup_members
    WHERE meetup_id = $1 AND user_id = $2 AND rsvp_status IN ('going', 'maybe', 'waitlist')
    LIMIT 1
    `,
    [meetupId, auth.user.id]
  );

  if (member.rowCount === 0) return json(res, 403, { error: 'Join the meetup before chatting' });

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const messageBody = typeof body.body === 'string' ? body.body.trim() : '';
  if (!messageBody) return json(res, 400, { error: 'body is required' });
  if (messageBody.length > 2000) return json(res, 400, { error: 'body exceeds max length (2000)' });

  const messageId = crypto.randomUUID();

  const inserted = await db.query(
    `
    INSERT INTO meetup_messages (id, meetup_id, user_id, body)
    VALUES ($1, $2, $3, $4)
    RETURNING id, meetup_id, user_id, body, created_at
    `,
    [messageId, meetupId, auth.user.id, messageBody]
  );

  return json(res, 201, { data: inserted.rows[0] });
};

export const handleRemoveMeetupMember = async (req, res, meetupId) => {
  const auth = await requireUser(req);
  if (auth.error) return json(res, auth.error.status, auth.error.body);

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const targetUserId = typeof body.user_id === 'string' ? body.user_id.trim() : '';
  if (!targetUserId) return json(res, 400, { error: 'user_id is required' });

  const meetupResult = await db.query(`SELECT host_user_id FROM meetups WHERE id = $1 LIMIT 1`, [meetupId]);
  if (meetupResult.rowCount === 0) return json(res, 404, { error: 'Meetup not found' });

  const isHost = meetupResult.rows[0].host_user_id === auth.user.id;
  const privileged = await requireRole(req, ['moderator', 'admin']);
  const isModerator = !privileged.error;

  if (!isHost && !isModerator) return json(res, 403, { error: 'Only host/moderator/admin can remove members' });

  await db.query(
    `
    UPDATE meetup_members
    SET rsvp_status = 'removed'
    WHERE meetup_id = $1 AND user_id = $2
    `,
    [meetupId, targetUserId]
  );

  return json(res, 200, { ok: true });
};

export const handleBlockUser = async (req, res, targetUserId) => {
  const auth = await requireUser(req);
  if (auth.error) return json(res, auth.error.status, auth.error.body);

  if (!requireDb(res)) return;

  if (targetUserId === auth.user.id) return json(res, 400, { error: 'Cannot block yourself' });

  await db.query(
    `
    INSERT INTO user_blocks (blocker_user_id, blocked_user_id)
    VALUES ($1, $2)
    ON CONFLICT (blocker_user_id, blocked_user_id) DO NOTHING
    `,
    [auth.user.id, targetUserId]
  );

  return json(res, 200, { ok: true });
};

export const handleReportUser = async (req, res, targetUserId) => {
  const auth = await requireUser(req);
  if (auth.error) return json(res, auth.error.status, auth.error.body);

  if (!requireDb(res)) return;

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const details = typeof body.details === 'string' ? body.details.trim() : null;
  const targetMessageId = typeof body.target_message_id === 'string' ? body.target_message_id.trim() : null;

  if (!reason) return json(res, 400, { error: 'reason is required' });

  const reportId = crypto.randomUUID();

  await db.query(
    `
    INSERT INTO user_reports (id, reporter_user_id, target_user_id, target_message_id, reason, details, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'open')
    `,
    [reportId, auth.user.id, targetUserId, targetMessageId, reason, details]
  );

  return json(res, 201, { data: { id: reportId, status: 'open' } });
};
