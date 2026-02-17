import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { app } from '../src/app.js';

const server = createServer((req, res) => app(req, res));

const listen = () =>
  new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address()));
  });

const close = () =>
  new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) return reject(error);
      return resolve();
    });
  });

const run = async () => {
  const address = await listen();
  assert.ok(address && typeof address === 'object');

  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const health = await fetch(`${baseUrl}/health`);
    const healthPayload = await health.json();
    assert.equal(health.status, 200);
    assert.equal(healthPayload.ok, true);
    assert.equal(healthPayload.service, 'find-a-spring-api');

    const springs = await fetch(`${baseUrl}/v1/springs`);
    const springsPayload = await springs.json();
    assert.equal(springs.status, 200);
    assert.ok(Array.isArray(springsPayload.data));

    console.log('API smoke test passed');
  } finally {
    await close();
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
