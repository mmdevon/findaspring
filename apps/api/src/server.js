import http from 'node:http';

import { app } from './app.js';
import { config } from './config.js';
import { handleWebSocketUpgrade } from './realtime.js';

const server = http.createServer((req, res) => {
  app(req, res);
});

server.on('upgrade', async (req, socket, head) => {
  try {
    const handled = await handleWebSocketUpgrade(req, socket, head);
    if (!handled) socket.destroy();
  } catch {
    socket.destroy();
  }
});

server.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
