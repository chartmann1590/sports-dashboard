import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function startStubSidecar() {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/v1/audio/voices') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ object: 'list', data: [] }));
      return;
    }
    if (req.method === 'POST' && req.url === '/v1/audio/speech') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let parsed = {};
        try { parsed = JSON.parse(body); } catch { /* ignore */ }
        if (!parsed.input || !String(parsed.input).trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ detail: 'input must be a non-empty string' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'audio/wav' });
        res.end(Buffer.from('FAKEWAVDATA'));
      });
      return;
    }
    res.writeHead(404).end();
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function startApp(extraEnv = {}, port = 4131) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['server/index.js'], {
      cwd: repoRoot,
      env: { ...process.env, PORT: String(port), ...extraEnv },
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

function request(port, method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: urlPath,
      method,
      headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {},
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
  child.kill('SIGTERM');
  await new Promise(resolve => child.on('exit', resolve));
}

test('tts proxy without sidecar configured', async () => {
  const app = await startApp({ TTS_URL: '' }, 4131);
  try {
    const health = await request(app.port, 'GET', '/api/tts/health');
    assert.equal(health.status, 503);
    assert.equal(JSON.parse(health.body.toString()).available, false);

    const synth = await request(app.port, 'POST', '/api/tts', { text: 'Touchdown!' });
    assert.equal(synth.status, 503);

    const empty = await request(app.port, 'POST', '/api/tts', { text: '   ' });
    assert.equal(empty.status, 400);

    const tooLong = await request(app.port, 'POST', '/api/tts', { text: 'x'.repeat(1001) });
    assert.equal(tooLong.status, 400);
  } finally {
    await stopApp(app);
  }
});

test('tts proxy with stub sidecar', async () => {
  const stub = await startStubSidecar();
  const stubPort = stub.address().port;
  const app = await startApp({ TTS_URL: `http://127.0.0.1:${stubPort}` }, 4132);
  try {
    const health = await request(app.port, 'GET', '/api/tts/health');
    assert.equal(health.status, 200);
    assert.equal(JSON.parse(health.body.toString()).available, true);

    const synth = await request(app.port, 'POST', '/api/tts', { text: 'Touchdown!', speed: 1.05 });
    assert.equal(synth.status, 200);
    assert.match(String(synth.headers['content-type'] || ''), /audio\/wav/);
    assert.deepEqual(synth.body, Buffer.from('FAKEWAVDATA'));

    const empty = await request(app.port, 'POST', '/api/tts', { text: '' });
    assert.equal(empty.status, 400);
  } finally {
    await stopApp(app);
    await new Promise(resolve => stub.close(resolve));
  }
});
