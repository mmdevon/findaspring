import test from 'node:test';
import assert from 'node:assert/strict';

import { setupIntegrationApp } from './helpers/integration.js';

const testDbUrl = process.env.TEST_DATABASE_URL || '';

test(
  'auth, springs, and moderation routes handle success and failure paths',
  { skip: !testDbUrl },
  async () => {
    const { pool, request, close } = await setupIntegrationApp(testDbUrl);

    try {
      const invalidSignup = await request('/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          display_name: '',
          password: 'short'
        })
      });
      assert.equal(invalidSignup.status, 400);

      const signup = await request('/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          display_name: 'User One',
          password: 'password-123'
        })
      });
      assert.equal(signup.status, 201);
      const userToken = signup.payload.access_token;

      const duplicateSignup = await request('/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          display_name: 'User One',
          password: 'password-123'
        })
      });
      assert.equal(duplicateSignup.status, 409);

      const badLogin = await request('/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'wrong-password'
        })
      });
      assert.equal(badLogin.status, 401);

      const unauthenticatedSubmission = await request('/v1/springs/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Spring',
          latitude: 36.0,
          longitude: -86.9
        })
      });
      assert.equal(unauthenticatedSubmission.status, 401);

      const badSubmission = await request('/v1/springs/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          name: 'Missing Coordinates'
        })
      });
      assert.equal(badSubmission.status, 400);

      const createSubmission = await request('/v1/springs/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          name: 'Approved Spring Candidate',
          latitude: 36.001,
          longitude: -86.901,
          city: 'Columbia',
          region: 'TN'
        })
      });
      assert.equal(createSubmission.status, 201);
      const submissionId = createSubmission.payload.data.id;

      const forbiddenModerationList = await request('/v1/moderation/submissions?status=pending', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      assert.equal(forbiddenModerationList.status, 403);

      const badBootstrap = await request('/v1/auth/bootstrap-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bootstrap-key': 'bad-key'
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          display_name: 'Admin',
          password: 'admin-password-123'
        })
      });
      assert.equal(badBootstrap.status, 403);

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

      const pendingSubmissions = await request('/v1/moderation/submissions?status=pending', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      assert.equal(pendingSubmissions.status, 200);
      assert.ok(Array.isArray(pendingSubmissions.payload.data));
      assert.ok(pendingSubmissions.payload.data.find((item) => item.id === submissionId));

      const rejectWithoutReason = await request(`/v1/moderation/submissions/${submissionId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      assert.equal(rejectWithoutReason.status, 400);

      const approveSubmission = await request(`/v1/moderation/submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      assert.equal(approveSubmission.status, 200);
      assert.equal(approveSubmission.payload.data.status, 'approved');
      const approvedSpringId = approveSubmission.payload.data.spring_id;

      const duplicateApprove = await request(`/v1/moderation/submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      assert.equal(duplicateApprove.status, 409);

      const emptyReasonReport = await request(`/v1/springs/${approvedSpringId}/reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      assert.equal(emptyReasonReport.status, 400);

      const createReport = await request(`/v1/springs/${approvedSpringId}/reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'quality',
          details: 'Water flow looked low'
        })
      });
      assert.equal(createReport.status, 201);
      const reportId = createReport.payload.data.id;

      const moderationReports = await request('/v1/moderation/reports?status=open', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      assert.equal(moderationReports.status, 200);
      assert.ok(moderationReports.payload.data.find((item) => item.id === reportId));

      const resolveReport = await request(`/v1/moderation/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      assert.equal(resolveReport.status, 200);
      assert.equal(resolveReport.payload.data.status, 'resolved');

      const refreshInvalid = await request('/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: 'bad-token' })
      });
      assert.equal(refreshInvalid.status, 401);

      const dbReport = await pool.query(`SELECT status FROM spring_reports WHERE id = $1 LIMIT 1`, [reportId]);
      assert.equal(dbReport.rowCount, 1);
      assert.equal(dbReport.rows[0].status, 'resolved');
    } finally {
      await close();
    }
  }
);
