import { WebSocketServer } from 'ws';

import { db } from './db.js';
import { verifyAccessToken } from './lib/tokens.js';
import { config } from './config.js';

const wsServer = new WebSocketServer({ noServer: true });
const clientsByMeetup = new Map();

const addClient = (meetupId, socket) => {
  const room = clientsByMeetup.get(meetupId) || new Set();
  room.add(socket);
  clientsByMeetup.set(meetupId, room);
};

const removeClient = (meetupId, socket) => {
  const room = clientsByMeetup.get(meetupId);
  if (!room) return;
  room.delete(socket);
  if (room.size === 0) clientsByMeetup.delete(meetupId);
};

const parseMeetupWsPath = (urlPath) => {
  const match = urlPath.match(/^\/v1\/meetups\/([^/]+)\/ws$/);
  return match ? match[1] : '';
};

const parseToken = (urlObj) => {
  const fromQuery = (urlObj.searchParams.get('access_token') || '').trim();
  if (fromQuery) return fromQuery;
  return '';
};

const authorizeWebSocket = async (request, meetupId) => {
  if (!db.hasDb) return null;

  const url = new URL(request.url || '/', 'http://localhost');
  const token = parseToken(url);
  const parsed = verifyAccessToken(token, config.authSecret);
  if (!parsed?.sub) return null;

  const member = await db.query(
    `
    SELECT user_id
    FROM meetup_members
    WHERE meetup_id = $1 AND user_id = $2 AND rsvp_status IN ('going', 'maybe', 'waitlist')
    LIMIT 1
    `,
    [meetupId, parsed.sub]
  );

  if (member.rowCount === 0) return null;
  return { userId: parsed.sub };
};

wsServer.on('connection', (socket, context) => {
  const { meetupId, userId } = context;
  addClient(meetupId, socket);

  socket.send(
    JSON.stringify({
      type: 'connected',
      meetup_id: meetupId,
      user_id: userId
    })
  );

  socket.on('close', () => {
    removeClient(meetupId, socket);
  });
});

export const handleWebSocketUpgrade = async (request, socket, head) => {
  const url = new URL(request.url || '/', 'http://localhost');
  const meetupId = parseMeetupWsPath(url.pathname);
  if (!meetupId) return false;

  const auth = await authorizeWebSocket(request, meetupId);
  if (!auth) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return true;
  }

  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit('connection', ws, { meetupId, userId: auth.userId });
  });

  return true;
};

export const publishMeetupMessage = (meetupId, payload) => {
  const room = clientsByMeetup.get(meetupId);
  if (!room || room.size === 0) return;

  const message = JSON.stringify({
    type: 'meetup_message',
    meetup_id: meetupId,
    data: payload
  });

  for (const ws of room) {
    if (ws.readyState === ws.OPEN) ws.send(message);
  }
};
