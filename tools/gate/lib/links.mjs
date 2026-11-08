import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { ROOT } from './paths.mjs';
import { sectionText } from './load.mjs';

export function extractUrls(text) {
  const urls = new Set();
  if (!text) return [];
  for (const m of text.matchAll(/https?:\/\/[^\s<>"')\]]+/g)) {
    urls.add(m[0].replace(/[.,;:!?]+$/, ''));
  }
  return [...urls];
}

export function entryUrls(e) {
  const urls = new Set(extractUrls(sectionText(e, 'Nguồn')));
  for (const r of e.data?.legal_refs ?? []) if (r?.url) extractUrls(r.url).forEach((u) => urls.add(u));
  for (const s of e.data?.verification?.sources ?? []) extractUrls(String(s)).forEach((u) => urls.add(u));
  return [...urls];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Gate {
  constructor(max, intervalMs = 0) {
    this.max = max;
    this.interval = intervalMs;
    this.active = 0;
    this.nextAt = 0;
    this.waiters = [];
    this.timer = null;
  }
  acquire() {
    return new Promise((res) => {
      this.waiters.push(res);
      this.pump();
    });
  }
  release() {
    this.active--;
    this.pump();
  }
  pump() {
    while (this.waiters.length && this.active < this.max) {
      const now = Date.now();
      if (now < this.nextAt) {
        if (!this.timer) {
          this.timer = setTimeout(() => {
            this.timer = null;
            this.pump();
          }, this.nextAt - now);
        }
        return;
      }
      this.active++;
      this.nextAt = now + this.interval;
      this.waiters.shift()();
    }
  }
}

// Kết quả một lần thử: { kind: 'ok'|'dead'|'temp'|'blocked', code, detail }
export function classifyStatus(code) {
  if (code >= 200 && code < 400) return 'ok';
  if (code === 404 || code === 410) return 'dead';
  if (code === 429 || code >= 500 || code === 408) return 'temp';
  if (code === 401 || code === 403 || code === 405 || code === 406 || code === 999) return 'blocked';
  return 'dead';
}

export function classifyError(err) {
  const code = err?.cause?.code ?? err?.code ?? '';
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return { kind: 'temp', code: 'TIMEOUT', detail: 'quá thời gian chờ' };
  if (code === 'ENOTFOUND') return { kind: 'dead', code, detail: 'DNS không phân giải được tên miền' };
  if (/CERT|TLS|SSL/.test(String(code))) return { kind: 'blocked', code, detail: `lỗi chứng chỉ/TLS (${code})` };
  return { kind: 'temp', code: String(code || 'NETWORK'), detail: `lỗi mạng (${code || err?.message || 'không rõ'})` };
}

async function attempt(url, method, opt) {
  const res = await fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(opt.timeoutMs),
    headers: { 'user-agent': opt.userAgent, accept: '*/*' },
  });
  try {
    await res.body?.cancel();
  } catch {}
  return { kind: classifyStatus(res.status), code: res.status, detail: `HTTP ${res.status}`, retryAfter: res.headers.get('retry-after') };
}

async function probe(url, opt) {
  let r;
  try {
    r = await attempt(url, 'HEAD', opt);
  } catch (e) {
    r = classifyError(e);
  }
  if (r.kind === 'ok') return r;
  if (r.kind === 'dead' && r.code === 'ENOTFOUND') return r;
  // HEAD nhiều máy chủ xử lý sai → xác nhận bằng GET
  try {
    return await attempt(url, 'GET', opt);
  } catch (e) {
    return classifyError(e);
  }
}

export async function loadCache(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

export async function saveCache(file, cache) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(cache, null, 1) + '\n');
}

/** Kiểm tra danh sách URL duy nhất. Trả Map<url, {kind, code, detail, cached}> */
export async function checkUrls(urls, options = {}) {
  const opt = { ...options };
  const cacheFile = resolve(ROOT, opt.cacheFile);
  const cache = opt.noCache ? {} : await loadCache(cacheFile);
  const now = Date.now();
  const global = new Gate(opt.globalConcurrency);
  const hosts = new Map();
  const hostGate = (h) => {
    if (!hosts.has(h)) hosts.set(h, new Gate(opt.perHostConcurrency, opt.perHostMinIntervalMs));
    return hosts.get(h);
  };
  const results = new Map();

  async function one(url) {
    const c = cache[url];
    if (c) {
      const ttl = (c.kind === 'ok' ? opt.okTtlHours : opt.deadTtlHours) * 3600e3;
      if (now - Date.parse(c.checkedAt) < ttl) {
        results.set(url, { ...c, cached: true });
        return;
      }
    }
    let host;
    try {
      host = new URL(url).host;
    } catch {
      results.set(url, { kind: 'dead', code: 'BADURL', detail: 'URL không hợp lệ' });
      return;
    }
    let r;
    for (let i = 0; i <= opt.retries; i++) {
      await global.acquire();
      const hg = hostGate(host);
      await hg.acquire();
      try {
        r = await probe(url, opt);
      } finally {
        hg.release();
        global.release();
      }
      if (r.kind !== 'temp' || i === opt.retries) break;
      let wait = opt.backoffBaseMs * 2 ** i;
      const ra = Number(r.retryAfter);
      if (Number.isFinite(ra) && ra > 0) wait = Math.max(wait, ra * 1000);
      await sleep(Math.min(wait, opt.maxRetryAfterMs));
    }
    const res = { kind: r.kind, code: r.code, detail: r.detail, checkedAt: new Date().toISOString() };
    results.set(url, res);
    if (res.kind === 'ok' || res.kind === 'dead') cache[url] = res; // tạm thời/bị chặn: không cache
  }

  await Promise.all([...new Set(urls)].map(one));
  if (!opt.noCache) await saveCache(cacheFile, cache);
  return results;
}
