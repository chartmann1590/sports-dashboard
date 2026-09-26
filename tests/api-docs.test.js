import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function startApp(port = 4135) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['server/index.js'], {
      cwd: repoRoot,
      env: { ...process.env, PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    const onData = chunk => {
      out += String(chunk);
      const m = out.match(/Listening on: http:\/\/localhost:(\d+)/);
      if (m) {
        child.stdout.off('data', onData);
        child.stderr.off('data', onData);
        resolve({ child, port: Number(m[1]) });
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', reject);
    setTimeout(() => reject(new Error(`app did not start in time. output: ${out}`)), 30000);
  });
}

function request(port, method, urlPath, headers = {}, body = undefined) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: urlPath,
      method,
      headers: {
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers
      },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function stopApp({ child }) {
  try {
    child.stdout.destroy();
    child.stderr.destroy();
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/f', '/t']);
    } else {
      child.kill('SIGKILL');
    }
  } catch {
    // Ignore cleanup error
  }
  await new Promise(resolve => setTimeout(resolve, 300));
}

test('API Documentation & OpenAPI routes', async () => {
  const app = await startApp(4135);
  try {
    // 1. /api/docs returns Swagger UI HTML
    const docs = await request(app.port, 'GET', '/api/docs');
    assert.equal(docs.status, 200);
    assert.match(docs.headers['content-type'], /text\/html/);
    const docsHtml = docs.body.toString();
    assert.ok(docsHtml.includes('SwaggerUIBundle'), 'Should contain SwaggerUIBundle initialization');
    assert.ok(docsHtml.includes('/api/openapi.json'), 'Should reference openapi.json');
    assert.ok(docsHtml.includes('ArenaPulse REST API'), 'Should have ArenaPulse title');

    // 2. /api/openapi.json returns valid OpenAPI 3.0.3 spec
    const openapi = await request(app.port, 'GET', '/api/openapi.json');
    assert.equal(openapi.status, 200);
    assert.match(openapi.headers['content-type'], /application\/json/);
    assert.equal(openapi.headers['access-control-allow-origin'], '*');
    const spec = JSON.parse(openapi.body.toString());
    assert.equal(spec.openapi, '3.0.3');
    assert.ok(spec.paths['/api/scores/all'], 'Should include /api/scores/all path');
    assert.ok(spec.paths['/api/scores'], 'Should include /api/scores path');
    assert.ok(spec.paths['/api/game/{sport}/{league}/{id}'], 'Should include deep game path');
    assert.ok(spec.paths['/api/tts'], 'Should include tts path');

    // 3. /api/swagger.json alias works
    const swagger = await request(app.port, 'GET', '/api/swagger.json');
    assert.equal(swagger.status, 200);

    // 4. Static assets for Swagger UI are served
    const bundleJs = await request(app.port, 'GET', '/api/docs/swagger-ui/swagger-ui-bundle.js');
    assert.equal(bundleJs.status, 200);
    assert.match(bundleJs.headers['content-type'], /javascript/);

    const bundleCss = await request(app.port, 'GET', '/api/docs/swagger-ui/swagger-ui.css');
    assert.equal(bundleCss.status, 200);
    assert.match(bundleCss.headers['content-type'], /text\/css/);

    // 5. /api directory JSON response for API clients
    const apiDir = await request(app.port, 'GET', '/api', { 'Accept': 'application/json' });
    assert.equal(apiDir.status, 200);
    const dirData = JSON.parse(apiDir.body.toString());
    assert.equal(dirData.name, 'ArenaPulse Sports Dashboard API');
    assert.equal(dirData.documentation.interactive, '/api/docs');
    assert.ok(dirData.endpoints.allScores);

    // 6. /api redirect to /api/docs for browsers requesting HTML
    const apiHtml = await request(app.port, 'GET', '/api', { 'Accept': 'text/html,application/xhtml+xml' });
    assert.equal(apiHtml.status, 302);
    assert.equal(apiHtml.headers['location'], '/api/docs');

    // 7. /docs convenience redirect to /api/docs
    const docsRedirect = await request(app.port, 'GET', '/docs');
    assert.equal(docsRedirect.status, 301);
    assert.equal(docsRedirect.headers['location'], '/api/docs');

    // 8. Undefined API route returns JSON 404
    const notFound = await request(app.port, 'GET', '/api/non-existent-endpoint');
    assert.equal(notFound.status, 404);
    assert.match(notFound.headers['content-type'], /application\/json/);
    const errData = JSON.parse(notFound.body.toString());
    assert.equal(errData.error, 'API endpoint not found');
    assert.equal(errData.documentation, '/api/docs');

    // 9. Health and Leagues endpoints work
    const health = await request(app.port, 'GET', '/api/health');
    assert.equal(health.status, 200);
    const healthData = JSON.parse(health.body.toString());
    assert.equal(healthData.status, 'healthy');

    const leagues = await request(app.port, 'GET', '/api/leagues');
    assert.equal(leagues.status, 200);
    const leaguesData = JSON.parse(leagues.body.toString());
    assert.equal(leaguesData.leagues.length, 14);

  } finally {
    await stopApp(app);
  }
});
