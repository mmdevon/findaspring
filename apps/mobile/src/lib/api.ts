import AsyncStorage from '@react-native-async-storage/async-storage';

declare const process: {
  env: Record<string, string | undefined>;
};

export type User = {
  id: string;
  email: string;
  display_name: string;
  role?: string;
};

export type AuthSession = {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type SpringSummary = {
  id: string;
  name: string;
  status: string;
  city?: string | null;
  region?: string | null;
  latitude?: number;
  longitude?: number;
  access_notes?: string | null;
};

export type SpringDetail = SpringSummary & {
  slug?: string;
  country?: string | null;
  verified_at?: string | null;
  updated_at?: string;
};

export type Meetup = {
  id: string;
  spring_id: string;
  spring_name?: string;
  host_user_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  max_attendees: number;
  visibility: 'public' | 'friends_only';
  status: 'scheduled' | 'cancelled' | 'completed';
  going_count?: number;
};

export type MeetupMember = {
  user_id: string;
  rsvp_status: 'going' | 'maybe' | 'waitlist' | 'left' | 'removed';
  role: 'host' | 'member';
  joined_at: string;
};

export type MeetupDetail = Meetup & {
  members: MeetupMember[];
};

export type MeetupMessage = {
  id: string;
  meetup_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type ModerationUserReport = {
  id: string;
  reporter_user_id: string;
  target_user_id: string;
  target_message_id?: string | null;
  reason: string;
  details?: string | null;
  status: 'open' | 'triaged' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string | null;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const STORAGE_KEY = 'findaspring.auth.session';

let accessToken = process.env.EXPO_PUBLIC_AUTH_BEARER_TOKEN || '';
let refreshToken = '';
let sessionUser: User | null = null;

const request = async (path: string, options?: RequestInit, needsAuth?: boolean) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined)
  };

  if (needsAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(new URL(path, API_BASE_URL).toString(), {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return payload;
};

export const hasAuthToken = () => Boolean(accessToken);
export const getSessionUser = () => sessionUser;

const persistSession = async () => {
  if (!accessToken || !refreshToken || !sessionUser) return;
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: sessionUser
    })
  );
};

const setSession = async (session: AuthSession) => {
  accessToken = session.access_token;
  refreshToken = session.refresh_token;
  sessionUser = session.user;
  await persistSession();
};

export const clearAuthSession = async () => {
  accessToken = '';
  refreshToken = '';
  sessionUser = null;
  await AsyncStorage.removeItem(STORAGE_KEY);
};

export const hydrateAuthSession = async () => {
  if (accessToken && sessionUser) return { user: sessionUser };

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      access_token?: string;
      refresh_token?: string;
      user?: User;
    };

    if (!parsed.access_token || !parsed.refresh_token || !parsed.user) return null;

    accessToken = parsed.access_token;
    refreshToken = parsed.refresh_token;
    sessionUser = parsed.user;
    return { user: sessionUser };
  } catch {
    return null;
  }
};

export const fetchSprings = async (params?: { q?: string }) => {
  const url = new URL('/v1/springs', API_BASE_URL);
  if (params?.q) url.searchParams.set('q', params.q);

  const response = await fetch(url.toString());
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return (payload?.data || []) as SpringSummary[];
};

export const fetchSpringDetail = async (springId: string) => {
  const payload = await request(`/v1/springs/${springId}`);
  return payload.data as SpringDetail;
};

export const setFavorite = async (springId: string, shouldFavorite: boolean) => {
  if (!accessToken) throw new Error('Sign in to use favorites.');

  await request(
    `/v1/springs/${springId}/favorite`,
    {
      method: shouldFavorite ? 'POST' : 'DELETE'
    },
    true
  );
};

export const signup = async (payload: { email: string; display_name: string; password: string }) => {
  const session = (await request('/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  })) as AuthSession;

  await setSession(session);
  return session;
};

export const login = async (payload: { email: string; password: string }) => {
  const session = (await request('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  })) as AuthSession;

  await setSession(session);
  return session;
};

export const fetchMe = async () => {
  if (!accessToken) throw new Error('No auth session');
  const payload = await request('/v1/auth/me', undefined, true);
  sessionUser = payload.user as User;
  await persistSession();
  return sessionUser;
};

export const logout = async () => {
  if (refreshToken) {
    await request(
      '/v1/auth/logout',
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken })
      },
      false
    ).catch(() => null);
  }

  await clearAuthSession();
};

export const listMeetups = async (params?: { spring_id?: string; from?: string }) => {
  const url = new URL('/v1/meetups', API_BASE_URL);
  if (params?.spring_id) url.searchParams.set('spring_id', params.spring_id);
  if (params?.from) url.searchParams.set('from', params.from);

  const response = await fetch(url.toString());
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status})`);
  return (payload?.data || []) as Meetup[];
};

export const getMeetup = async (meetupId: string) => {
  const payload = await request(`/v1/meetups/${meetupId}`);
  return payload.data as MeetupDetail;
};

export const createMeetup = async (payload: {
  spring_id: string;
  title: string;
  description?: string;
  start_time: string;
  max_attendees?: number;
  visibility?: 'public' | 'friends_only';
}) => {
  if (!accessToken) throw new Error('Sign in to create meetups.');
  const response = await request('/v1/meetups', { method: 'POST', body: JSON.stringify(payload) }, true);
  return response.data as Meetup;
};

export const rsvpMeetup = async (meetupId: string, status: 'going' | 'maybe' | 'left') => {
  if (!accessToken) throw new Error('Sign in to RSVP.');
  const payload = await request(
    `/v1/meetups/${meetupId}/rsvp`,
    { method: 'POST', body: JSON.stringify({ status }) },
    true
  );
  return payload.data as { meetup_id: string; user_id: string; status: string };
};

export const listMeetupMessages = async (meetupId: string, cursor?: string) => {
  const url = new URL(`/v1/meetups/${meetupId}/messages`, API_BASE_URL);
  if (cursor) url.searchParams.set('cursor', cursor);

  const response = await fetch(url.toString());
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status})`);

  return {
    data: (payload?.data || []) as MeetupMessage[],
    next_cursor: (payload?.next_cursor || null) as string | null
  };
};

export const sendMeetupMessage = async (meetupId: string, body: string) => {
  if (!accessToken) throw new Error('Sign in to send messages.');
  const payload = await request(
    `/v1/meetups/${meetupId}/messages`,
    { method: 'POST', body: JSON.stringify({ body }) },
    true
  );
  return payload.data as MeetupMessage;
};

export const removeMeetupMember = async (meetupId: string, userId: string) => {
  if (!accessToken) throw new Error('Sign in to manage meetup members.');
  await request(
    `/v1/meetups/${meetupId}/remove-member`,
    { method: 'POST', body: JSON.stringify({ user_id: userId }) },
    true
  );
};

export const blockUser = async (targetUserId: string) => {
  if (!accessToken) throw new Error('Sign in to block users.');
  await request(`/v1/users/${targetUserId}/block`, { method: 'POST' }, true);
};

export const reportUser = async (targetUserId: string, payload: { reason: string; details?: string; target_message_id?: string }) => {
  if (!accessToken) throw new Error('Sign in to report users.');
  await request(`/v1/users/${targetUserId}/report`, { method: 'POST', body: JSON.stringify(payload) }, true);
};

export const openMeetupMessageSocket = (meetupId: string) => {
  if (!accessToken) throw new Error('Sign in to open realtime chat.');
  const origin = new URL(API_BASE_URL);
  const protocol = origin.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${origin.host}/v1/meetups/${meetupId}/ws?access_token=${encodeURIComponent(accessToken)}`;
  return new WebSocket(url);
};

export const listModerationUserReports = async (status: 'open' | 'triaged' | 'resolved' | 'dismissed' = 'open') => {
  if (!accessToken) throw new Error('Sign in as moderator/admin.');
  const payload = await request(`/v1/moderation/user-reports?status=${encodeURIComponent(status)}`, undefined, true);
  return (payload?.data || []) as ModerationUserReport[];
};

export const resolveModerationUserReport = async (reportId: string, action: 'resolve' | 'dismiss') => {
  if (!accessToken) throw new Error('Sign in as moderator/admin.');
  const payload = await request(`/v1/moderation/user-reports/${reportId}/${action}`, { method: 'POST' }, true);
  return payload?.data as { id: string; status: 'resolved' | 'dismissed' };
};
