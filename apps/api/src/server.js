import http from 'node:http';

import { app } from './app.js';
import { config } from './config.js';

const server = http.createServer((req, res) => {
  app(req, res);
});

server.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
