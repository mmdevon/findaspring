import { parseUrl, json } from './lib/http.js';
import { db } from './db.js';
import {
  handleCreateMeetup,
  handleCreateMeetupMessage,
  handleGetMeetup,
  handleGetMeetupMessages,
  handleListMeetups,
  handleRemoveMeetupMember,
  handleReportUser,
  handleRsvpMeetup,
  handleBlockUser
} from './routes/meetups.js';
import {
  handleGetModerationReports,
  handleGetModerationUserReports,
  handleGetModerationSubmissions,
  handleApproveSubmission,
  handleRejectSubmission,
  handleResolveReport,
  handleResolveUserReport
} from './routes/moderation.js';
import {
  handleAddFavorite,
  handleCreateSpringReport,
  handleCreateSubmission,
  handleGetSpringById,
  handleGetSprings,
  handleRemoveFavorite
} from './routes/springs.js';
import {
  handleBootstrapAdmin,
  handleLogin,
  handleLogout,
  handleMe,
  handleRefresh,
  handleSignup
} from './routes/auth.js';

export const app = async (req, res) => {
  try {
    const url = parseUrl(req);

    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, { ok: true, service: 'find-a-spring-api' });
    }

    if (req.method === 'GET' && url.pathname === '/ready') {
      const ready = await db.isReady();
      if (ready) return json(res, 200, { ok: true, service: 'find-a-spring-api', database: 'ready' });
      return json(res, 503, { ok: false, service: 'find-a-spring-api', database: 'not-ready' });
    }

    if (req.method === 'GET' && url.pathname === '/v1/springs') {
      return handleGetSprings(req, res, url);
    }

    const springDetailMatch = url.pathname.match(/^\/v1\/springs\/([^/]+)$/);
    if (req.method === 'GET' && springDetailMatch) {
      return handleGetSpringById(req, res, springDetailMatch[1]);
    }

    if (req.method === 'POST' && url.pathname === '/v1/springs/submissions') {
      return handleCreateSubmission(req, res);
    }

    const springReportMatch = url.pathname.match(/^\/v1\/springs\/([^/]+)\/reports$/);
    if (req.method === 'POST' && springReportMatch) {
      return handleCreateSpringReport(req, res, springReportMatch[1]);
    }

    const favoriteMatch = url.pathname.match(/^\/v1\/springs\/([^/]+)\/favorite$/);
    if (req.method === 'POST' && favoriteMatch) {
      return handleAddFavorite(req, res, favoriteMatch[1]);
    }

    if (req.method === 'DELETE' && favoriteMatch) {
      return handleRemoveFavorite(req, res, favoriteMatch[1]);
    }

    if (req.method === 'POST' && url.pathname === '/v1/meetups') {
      return handleCreateMeetup(req, res);
    }

    if (req.method === 'GET' && url.pathname === '/v1/meetups') {
      return handleListMeetups(req, res, url);
    }

    const meetupDetailMatch = url.pathname.match(/^\/v1\/meetups\/([^/]+)$/);
    if (req.method === 'GET' && meetupDetailMatch) {
      return handleGetMeetup(req, res, meetupDetailMatch[1]);
    }

    const meetupRsvpMatch = url.pathname.match(/^\/v1\/meetups\/([^/]+)\/rsvp$/);
    if (req.method === 'POST' && meetupRsvpMatch) {
      return handleRsvpMeetup(req, res, meetupRsvpMatch[1]);
    }

    const meetupMessagesMatch = url.pathname.match(/^\/v1\/meetups\/([^/]+)\/messages$/);
    if (req.method === 'GET' && meetupMessagesMatch) {
      return handleGetMeetupMessages(req, res, meetupMessagesMatch[1], url);
    }

    if (req.method === 'POST' && meetupMessagesMatch) {
      return handleCreateMeetupMessage(req, res, meetupMessagesMatch[1]);
    }

    const removeMemberMatch = url.pathname.match(/^\/v1\/meetups\/([^/]+)\/remove-member$/);
    if (req.method === 'POST' && removeMemberMatch) {
      return handleRemoveMeetupMember(req, res, removeMemberMatch[1]);
    }

    const blockUserMatch = url.pathname.match(/^\/v1\/users\/([^/]+)\/block$/);
    if (req.method === 'POST' && blockUserMatch) {
      return handleBlockUser(req, res, blockUserMatch[1]);
    }

    const reportUserMatch = url.pathname.match(/^\/v1\/users\/([^/]+)\/report$/);
    if (req.method === 'POST' && reportUserMatch) {
      return handleReportUser(req, res, reportUserMatch[1]);
    }

    if (req.method === 'GET' && url.pathname === '/v1/moderation/submissions') {
      return handleGetModerationSubmissions(req, res, url);
    }

    const submissionApproveMatch = url.pathname.match(/^\/v1\/moderation\/submissions\/([^/]+)\/approve$/);
    if (req.method === 'POST' && submissionApproveMatch) {
      return handleApproveSubmission(req, res, submissionApproveMatch[1]);
    }

    const submissionRejectMatch = url.pathname.match(/^\/v1\/moderation\/submissions\/([^/]+)\/reject$/);
    if (req.method === 'POST' && submissionRejectMatch) {
      return handleRejectSubmission(req, res, submissionRejectMatch[1]);
    }

    if (req.method === 'GET' && url.pathname === '/v1/moderation/reports') {
      return handleGetModerationReports(req, res, url);
    }

    const reportResolveMatch = url.pathname.match(/^\/v1\/moderation\/reports\/([^/]+)\/(resolve|dismiss)$/);
    if (req.method === 'POST' && reportResolveMatch) {
      return handleResolveReport(req, res, reportResolveMatch[1], reportResolveMatch[2]);
    }

    if (req.method === 'GET' && url.pathname === '/v1/moderation/user-reports') {
      return handleGetModerationUserReports(req, res, url);
    }

    const userReportResolveMatch = url.pathname.match(/^\/v1\/moderation\/user-reports\/([^/]+)\/(resolve|dismiss)$/);
    if (req.method === 'POST' && userReportResolveMatch) {
      return handleResolveUserReport(req, res, userReportResolveMatch[1], userReportResolveMatch[2]);
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/bootstrap-admin') {
      return handleBootstrapAdmin(req, res);
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/signup') {
      return handleSignup(req, res);
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/login') {
      return handleLogin(req, res);
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/refresh') {
      return handleRefresh(req, res);
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/logout') {
      return handleLogout(req, res);
    }

    if (req.method === 'GET' && url.pathname === '/v1/auth/me') {
      return handleMe(req, res);
    }

    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    return json(res, 500, {
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
