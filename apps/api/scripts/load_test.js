import { createServer } from 'node:http';

import { app } from '../src/app.js';

const totalRequests = Number(process.env.LOAD_TEST_TOTAL || 200);
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY || 20);
const externalBaseUrl = process.env.LOAD_TEST_BASE_URL || '';

const scenarios = [
  { name: 'health', path: '/health' },
  { name: 'springs', path: '/v1/springs' },
  { name: 'meetups', path: '/v1/meetups' }
];

const runScenario = async (baseUrl, scenario) => {
  const latencies = [];
  let ok = 0;
  let failed = 0;

  const workerCount = Math.max(1, Math.min(concurrency, totalRequests));
  const requestsPerWorker = Math.ceil(totalRequests / workerCount);

  const workers = Array.from({ length: workerCount }, async (_, workerIndex) => {
    for (let i = 0; i < requestsPerWorker; i += 1) {
      const attempt = workerIndex * requestsPerWorker + i;
      if (attempt >= totalRequests) break;

      const started = performance.now();
      try {
        const response = await fetch(`${baseUrl}${scenario.path}`);
        if (!response.ok) {
          failed += 1;
        } else {
          ok += 1;
        }
      } catch {
        failed += 1;
      } finally {
        latencies.push(performance.now() - started);
      }
    }
  });

  await Promise.all(workers);

  latencies.sort((a, b) => a - b);
  const percentile = (p) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))] || 0;
  const avg = latencies.length ? latencies.reduce((sum, n) => sum + n, 0) / latencies.length : 0;

  return {
    scenario: scenario.name,
    total: totalRequests,
    ok,
    failed,
    avg_ms: Number(avg.toFixed(2)),
    p95_ms: Number(percentile(0.95).toFixed(2)),
    p99_ms: Number(percentile(0.99).toFixed(2))
  };
};

const run = async () => {
  let server = null;
  let baseUrl = externalBaseUrl;

  if (!baseUrl) {
    server = createServer((req, res) => app(req, res));
    const address = await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve(server.address()));
    });
    baseUrl = `http://127.0.0.1:${address.port}`;
  }

  try {
    const results = [];
    for (const scenario of scenarios) {
      const summary = await runScenario(baseUrl, scenario);
      results.push(summary);
      console.log(JSON.stringify(summary));
    }
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
