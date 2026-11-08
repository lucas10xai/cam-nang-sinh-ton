import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { checkUrls, extractUrls, classifyStatus } from '../lib/links.mjs';
import { ROOT } from '../lib/paths.mjs';

let server, base, tmp;
const hits = {};
before(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'gate-links-'));
  server = http.createServer((req, res) => {
    const k = `${req.method} ${req.url}`;
    hits[k] = (hits[k] ?? 0) + 1;
    const u = req.url;
    if (u === '/ok') return res.writeHead(200).end('ok');
    if (u === '/redirect') return res.writeHead(302, { location: '/ok' }).end();
    if (u === '/gone') return res.writeHead(410).end();
    if (u === '/missing') return res.writeHead(404).end();
    if (u === '/head-405') return req.method === 'HEAD' ? res.writeHead(405).end() : res.writeHead(200).end('ok');
    if (u === '/flaky') return hits['GET /flaky'] || hits['HEAD /flaky'] > 2 ? res.writeHead(200).end('ok') : res.writeHead(503).end();
    if (u === '/always-503') return res.writeHead(503).end();
    if (u === '/slow') return setTimeout(() => res.writeHead(200).end(), 2000);
    res.writeHead(404).end();
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  server.close();
  await rm(tmp, { recursive: true, force: true });
});

const opt = (over = {}) => ({
  timeoutMs: 500, retries: 2, backoffBaseMs: 10, maxRetryAfterMs: 50, globalConcurrency: 4, perHostConcurrency: 2,
  perHostMinIntervalMs: 0, okTtlHours: 1, deadTtlHours: 1, userAgent: 'test',
  cacheFile: relative(ROOT, join(tmp, 'cache.json')), ...over,
});

test('phân loại mã HTTP', () => {
  assert.equal(classifyStatus(200), 'ok');
  assert.equal(classifyStatus(404), 'dead');
  assert.equal(classifyStatus(410), 'dead');
  assert.equal(classifyStatus(429), 'temp');
  assert.equal(classifyStatus(503), 'temp');
  assert.equal(classifyStatus(403), 'blocked');
});

test('trích URL, bỏ dấu câu cuối', () => {
  assert.deepEqual(extractUrls('xem [a](https://a.vn/x) và https://b.vn/y.'), ['https://a.vn/x', 'https://b.vn/y']);
});

test('sống / chết thật / HEAD→GET / chuyển hướng', async () => {
  const r = await checkUrls([`${base}/ok`, `${base}/redirect`, `${base}/gone`, `${base}/missing`, `${base}/head-405`], opt({ cacheFile: relative(ROOT, join(tmp, 'c1.json')) }));
  assert.equal(r.get(`${base}/ok`).kind, 'ok');
  assert.equal(r.get(`${base}/redirect`).kind, 'ok');
  assert.equal(r.get(`${base}/gone`).kind, 'dead');
  assert.equal(r.get(`${base}/missing`).kind, 'dead');
  assert.equal(r.get(`${base}/head-405`).kind, 'ok');
  assert.ok(hits['GET /head-405'] >= 1);
});

test('DNS lỗi là chết thật', async () => {
  const u = 'http://khong-ton-tai.invalid/';
  const r = await checkUrls([u], opt({ cacheFile: relative(ROOT, join(tmp, 'c2.json')) }));
  assert.equal(r.get(u).kind, 'dead');
});

test('5xx thử lại rồi vẫn tạm thời; timeout là tạm thời; không cache kết quả tạm', async () => {
  const cacheFile = relative(ROOT, join(tmp, 'c3.json'));
  const r = await checkUrls([`${base}/always-503`, `${base}/slow`], opt({ cacheFile, retries: 1 }));
  assert.equal(r.get(`${base}/always-503`).kind, 'temp');
  assert.equal(r.get(`${base}/slow`).kind, 'temp');
  assert.ok(hits['HEAD /always-503'] >= 2, 'phải thử lại');
  const cache = JSON.parse(await readFile(join(tmp, 'c3.json'), 'utf8'));
  assert.deepEqual(cache, {});
});

test('cache trên đĩa: lần 2 không gọi mạng', async () => {
  const cacheFile = relative(ROOT, join(tmp, 'c4.json'));
  const u = `${base}/ok?cache=1`;
  await checkUrls([u], opt({ cacheFile }));
  const before = Object.values(hits).reduce((a, b) => a + b, 0);
  const r = await checkUrls([u], opt({ cacheFile }));
  assert.equal(Object.values(hits).reduce((a, b) => a + b, 0), before);
  assert.equal(r.get(u).cached, true);
});

test('giới hạn song song theo host', async () => {
  let cur = 0, max = 0;
  const s = http.createServer((req, res) => {
    cur++; max = Math.max(max, cur);
    setTimeout(() => { cur--; res.writeHead(200).end(); }, 60);
  });
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  const b = `http://127.0.0.1:${s.address().port}`;
  const urls = Array.from({ length: 8 }, (_, i) => `${b}/p${i}`);
  await checkUrls(urls, opt({ perHostConcurrency: 2, cacheFile: relative(ROOT, join(tmp, 'c5.json')) }));
  s.close();
  assert.ok(max <= 2, `max=${max}`);
});

test('tốc độ tối thiểu giữa các request cùng host', async () => {
  const times = [];
  const s = http.createServer((req, res) => { times.push(Date.now()); res.writeHead(200).end(); });
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  const b = `http://127.0.0.1:${s.address().port}`;
  await checkUrls([`${b}/a`, `${b}/b`, `${b}/c`], opt({ perHostMinIntervalMs: 150, cacheFile: relative(ROOT, join(tmp, 'c6.json')) }));
  s.close();
  times.sort((x, y) => x - y);
  assert.ok(times[1] - times[0] >= 130 && times[2] - times[1] >= 130, JSON.stringify(times));
});
