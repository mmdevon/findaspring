import crypto from 'node:crypto';

import { db } from '../db.js';
import { requireUser } from '../lib/auth.js';
import { json, parseBody } from '../lib/http.js';

const asNumber = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const handleGetSprings = async (req, res, url) => {
  const page = Math.max(1, asNumber(url.searchParams.get('page'), 1));
  const pageSize = Math.min(50, Math.max(1, asNumber(url.searchParams.get('page_size'), 20)));
  const q = (url.searchParams.get('q') || '').trim();
  const lat = asNumber(url.searchParams.get('lat'), null);
  const lng = asNumber(url.searchParams.get('lng'), null);
  const radiusKm = Math.min(250, Math.max(1, asNumber(url.searchParams.get('radius_km'), 50)));

  if (!db.hasDb) {
    return json(res, 200, {
      data: db.sampleSprings,
      page,
      pageSize,
      note: 'DATABASE_URL is not configured; returning sample data.'
    });
  }

  const offset = (page - 1) * pageSize;
  const where = ['1=1'];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    where.push(`(name ILIKE $${params.length} OR city ILIKE $${params.length} OR region ILIKE $${params.length})`);
  }

  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  let distanceExpr = 'NULL';

  if (hasCoords) {
    params.push(lng, lat);
    const lngIdx = params.length - 1;
    const latIdx = params.length;

    params.push(radiusKm * 1000);
    const radiusIdx = params.length;

    distanceExpr = `ST_Distance(location, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)::geography)`;
    where.push(`ST_DWithin(location, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)::geography, $${radiusIdx})`);
  }

  params.push(pageSize, offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const sql = `
    SELECT
      id,
      name,
      status,
      city,
      region,
      access_notes,
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude,
      ${distanceExpr} AS distance_meters,
      updated_at
    FROM springs
    WHERE ${where.join(' AND ')}
    ORDER BY ${hasCoords ? 'distance_meters ASC NULLS LAST' : 'updated_at DESC'}
    LIMIT $${limitIdx}
    OFFSET $${offsetIdx}
  `;

  const result = await db.query(sql, params);
  return json(res, 200, { data: result.rows, page, pageSize });
};

export const handleGetSpringById = async (req, res, springId) => {
  if (!db.hasDb) {
    const found = db.sampleSprings.find((item) => item.id === springId);
    if (!found) return json(res, 404, { error: 'Spring not found' });
    return json(res, 200, { data: found });
  }

  const result = await db.query(
    `
    SELECT
      id,
      name,
      slug,
      status,
      country,
      region,
      city,
      access_notes,
      verified_at,
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude,
      updated_at
    FROM springs
    WHERE id = $1
    LIMIT 1
    `,
    [springId]
  );

  if (result.rowCount === 0) return json(res, 404, { error: 'Spring not found' });
  return json(res, 200, { data: result.rows[0] });
};

export const handleCreateSubmission = async (req, res) => {
  const auth = await requireUser(req);
  if (auth.error) return json(res, auth.error.status, auth.error.body);

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const latitude = asNumber(body.latitude, null);
  const longitude = asNumber(body.longitude, null);
  const accessNotes = typeof body.access_notes === 'string' ? body.access_notes.trim() : '';

  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return json(res, 400, { error: 'name, latitude, and longitude are required' });
  }

  const submissionId = crypto.randomUUID();
  const payload = {
    name,
    slug: slugify(name),
    latitude,
    longitude,
    country: body.country || null,
    region: body.region || null,
    city: body.city || null,
    access_notes: accessNotes || null,
    photos: Array.isArray(body.photos) ? body.photos : []
  };

  await db.query(
    `INSERT INTO spring_submissions (id, spring_id, submitted_by, payload_json, status) VALUES ($1, NULL, $2, $3::jsonb, 'pending')`,
    [submissionId, auth.user.id, JSON.stringify(payload)]
  );

  return json(res, 201, {
    data: {
      id: submissionId,
      status: 'pending',
      message: 'Submission received and queued for moderation.'
    }
  });
};

export const handleCreateSpringReport = async (req, res, springId) => {
  const auth = await requireUser(req);
  if (auth.error) return json(res, auth.error.status, auth.error.body);

  const body = await parseBody(req);
  if (!body) return json(res, 400, { error: 'Invalid JSON payload' });

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const details = typeof body.details === 'string' ? body.details.trim() : null;

  if (!reason) return json(res, 400, { error: 'reason is required' });

  const springExists = await db.query(`SELECT id FROM springs WHERE id = $1 LIMIT 1`, [springId]);
  if (springExists.rowCount === 0) return json(res, 404, { error: 'Spring not found' });

  const reportId = crypto.randomUUID();

  await db.query(
    `INSERT INTO spring_reports (id, spring_id, reported_by, reason, details, status) VALUES ($1, $2, $3, $4, $5, 'open')`,
    [reportId, springId, auth.user.id, reason, details]
  );

  return json(res, 201, {
    data: {
      id: reportId,
      status: 'open'
    }
  });
};

export const handleAddFavorite = async (req, res, springId) => {
  const auth = await requireUser(req);
  if (auth.error) return json(res, auth.error.status, auth.error.body);

  const springExists = await db.query(`SELECT id FROM springs WHERE id = $1 LIMIT 1`, [springId]);
  if (springExists.rowCount === 0) return json(res, 404, { error: 'Spring not found' });

  await db.query(
    `
    INSERT INTO favorites (user_id, spring_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, spring_id) DO NOTHING
    `,
    [auth.user.id, springId]
  );

  return json(res, 200, { ok: true });
};

export const handleRemoveFavorite = async (req, res, springId) => {
  const auth = await requireUser(req);
  if (auth.error) return json(res, auth.error.status, auth.error.body);

  await db.query(`DELETE FROM favorites WHERE user_id = $1 AND spring_id = $2`, [auth.user.id, springId]);
  return json(res, 200, { ok: true });
};
