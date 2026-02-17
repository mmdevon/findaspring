import crypto from 'node:crypto';

import { db } from '../db.js';
import { requireRole } from '../lib/auth.js';
import { json, parseBody } from '../lib/http.js';

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const uniqueSlug = (base) => `${base}-${Math.random().toString(36).slice(2, 8)}`;

const requireModerator = async (req, res) => {
  const auth = await requireRole(req, ['moderator', 'admin']);
  if (auth.error) {
    json(res, auth.error.status, auth.error.body);
    return null;
  }
  return auth.user;
};

export const handleGetModerationSubmissions = async (req, res, url) => {
  const user = await requireModerator(req, res);
  if (!user) return;

  const status = (url.searchParams.get('status') || 'pending').trim();
  const allowed = new Set(['pending', 'approved', 'rejected']);
  const safeStatus = allowed.has(status) ? status : 'pending';

  const result = await db.query(
    `
    SELECT id, spring_id, submitted_by, payload_json, status, moderator_id, decision_reason, created_at, reviewed_at
    FROM spring_submissions
    WHERE status = $1
    ORDER BY created_at ASC
    LIMIT 200
    `,
    [safeStatus]
  );

  return json(res, 200, { data: result.rows });
};

export const handleApproveSubmission = async (req, res, submissionId) => {
  const user = await requireModerator(req, res);
  if (!user) return;

  const found = await db.query(
    `SELECT id, spring_id, payload_json, status FROM spring_submissions WHERE id = $1 LIMIT 1`,
    [submissionId]
  );

  if (found.rowCount === 0) return json(res, 404, { error: 'Submission not found' });

  const submission = found.rows[0];
  if (submission.status !== 'pending') {
    return json(res, 409, { error: `Submission already ${submission.status}` });
  }

  const payload = submission.payload_json || {};
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return json(res, 422, { error: 'Submission payload is missing required fields (name/latitude/longitude)' });
  }

  let springId = submission.spring_id;

  if (springId) {
    await db.query(
      `
      UPDATE springs
      SET
        name = $2,
        access_notes = COALESCE($3, access_notes),
        country = COALESCE($4, country),
        region = COALESCE($5, region),
        city = COALESCE($6, city),
        location = ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography,
        updated_at = NOW()
      WHERE id = $1
      `,
      [
        springId,
        name,
        payload.access_notes || null,
        payload.country || null,
        payload.region || null,
        payload.city || null,
        longitude,
        latitude
      ]
    );
  } else {
    springId = crypto.randomUUID();
    const baseSlug = slugify(name) || `spring-${springId.slice(0, 6)}`;

    const exists = await db.query(`SELECT id FROM springs WHERE slug = $1 LIMIT 1`, [baseSlug]);
    const slug = exists.rowCount > 0 ? uniqueSlug(baseSlug) : baseSlug;

    await db.query(
      `
      INSERT INTO springs (
        id, name, slug, location, country, region, city, access_notes, status, created_by
      ) VALUES (
        $1,
        $2,
        $3,
        ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
        $6,
        $7,
        $8,
        $9,
        'active',
        $10
      )
      `,
      [
        springId,
        name,
        slug,
        longitude,
        latitude,
        payload.country || null,
        payload.region || null,
        payload.city || null,
        payload.access_notes || null,
        user.id
      ]
    );
  }

  await db.query(
    `
    UPDATE spring_submissions
    SET status = 'approved', spring_id = $2, moderator_id = $3, reviewed_at = NOW(), decision_reason = NULL
    WHERE id = $1
    `,
    [submissionId, springId, user.id]
  );

  return json(res, 200, { data: { id: submissionId, status: 'approved', spring_id: springId } });
};

export const handleRejectSubmission = async (req, res, submissionId) => {
  const user = await requireModerator(req, res);
  if (!user) return;

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!reason) return json(res, 400, { error: 'reason is required' });

  const result = await db.query(
    `
    UPDATE spring_submissions
    SET status = 'rejected', moderator_id = $2, reviewed_at = NOW(), decision_reason = $3
    WHERE id = $1 AND status = 'pending'
    RETURNING id
    `,
    [submissionId, user.id, reason]
  );

  if (result.rowCount === 0) return json(res, 404, { error: 'Pending submission not found' });
  return json(res, 200, { data: { id: submissionId, status: 'rejected' } });
};

export const handleGetModerationReports = async (req, res, url) => {
  const user = await requireModerator(req, res);
  if (!user) return;

  const status = (url.searchParams.get('status') || 'open').trim();
  const allowed = new Set(['open', 'triaged', 'resolved', 'dismissed']);
  const safeStatus = allowed.has(status) ? status : 'open';

  const result = await db.query(
    `
    SELECT id, spring_id, reported_by, reason, details, status, created_at, resolved_at
    FROM spring_reports
    WHERE status = $1
    ORDER BY created_at ASC
    LIMIT 200
    `,
    [safeStatus]
  );

  return json(res, 200, { data: result.rows });
};

export const handleResolveReport = async (req, res, reportId, nextStatus) => {
  const user = await requireModerator(req, res);
  if (!user) return;

  const validStatus = nextStatus === 'dismissed' ? 'dismissed' : 'resolved';

  const result = await db.query(
    `
    UPDATE spring_reports
    SET status = $2, resolved_at = NOW()
    WHERE id = $1 AND status IN ('open', 'triaged')
    RETURNING id
    `,
    [reportId, validStatus]
  );

  if (result.rowCount === 0) return json(res, 404, { error: 'Open report not found' });
  return json(res, 200, { data: { id: reportId, status: validStatus } });
};

export const handleGetModerationUserReports = async (req, res, url) => {
  const user = await requireModerator(req, res);
  if (!user) return;

  const status = (url.searchParams.get('status') || 'open').trim();
  const allowed = new Set(['open', 'triaged', 'resolved', 'dismissed']);
  const safeStatus = allowed.has(status) ? status : 'open';

  const result = await db.query(
    `
    SELECT
      id,
      reporter_user_id,
      target_user_id,
      target_message_id,
      reason,
      details,
      status,
      created_at,
      resolved_at
    FROM user_reports
    WHERE status = $1
    ORDER BY created_at ASC
    LIMIT 200
    `,
    [safeStatus]
  );

  return json(res, 200, { data: result.rows });
};

export const handleResolveUserReport = async (req, res, reportId, nextStatus) => {
  const user = await requireModerator(req, res);
  if (!user) return;

  const validStatus = nextStatus === 'dismissed' ? 'dismissed' : 'resolved';

  const result = await db.query(
    `
    UPDATE user_reports
    SET status = $2, resolved_at = NOW()
    WHERE id = $1 AND status IN ('open', 'triaged')
    RETURNING id
    `,
    [reportId, validStatus]
  );

  if (result.rowCount === 0) return json(res, 404, { error: 'Open user report not found' });
  return json(res, 200, { data: { id: reportId, status: validStatus } });
};
