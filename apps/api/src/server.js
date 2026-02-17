import http from 'node:http';
import { randomUUID } from 'node:crypto';

import { app } from './app.js';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { handleWebSocketUpgrade } from './realtime.js';

const server = http.createServer((req, res) => {
  const requestId = randomUUID();
  const startedAt = Date.now();

  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    logger.info('request.complete', {
      request_id: requestId,
      method: req.method,
      path: req.url,
      status_code: res.statusCode,
      duration_ms: Date.now() - startedAt
    });
  });

  app(req, res, { requestId }).catch((error) => {
    logger.error('request.unhandled', {
      request_id: requestId,
      method: req.method,
      path: req.url,
      detail: error instanceof Error ? error.message : String(error)
    });

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Internal server error', request_id: requestId }));
      return;
    }

    res.destroy();
  });
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
  logger.info('server.started', {
    port: config.port,
    node_env: config.nodeEnv,
    log_level: config.logLevel
  });
});
