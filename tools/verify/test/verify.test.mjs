import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { stringify } from 'yaml';
import { ROOT } from '../../gate/lib/paths.mjs';
import { loadEntries, splitFrontmatter } from '../../gate/lib/load.mjs';
import { entryHash } from '../lib/hash.mjs';
import { loadReports } from '../lib/reports.mjs';
import { lintReport } from '../lint-report.mjs';
import { planApply, replaceVerification } from '../lib/apply.mjs';

const FIXTURE = resolve(ROOT, 'tools/gate/fixtures-rewritten/entries/19-ok/01-rewritten-hop-le.md');
const BASE = await readFile(FIXTURE, 'utf8'); // verification kiểu flow (JSON một dòng)

// Biến thể khối verification kiểu block, kèm chú thích và khóa sau verification.
const BLOCK = BASE.replace(
  /verification: \{.*\}\n/,
  'verification:   # trạng thái\n  status: unverified\n  checked_at: null\n  checker: null\n  scope: null\n  sources: []\norigin_note: giữ nguyên  # chú thích cuối dòng\n',
).replace('tags: []\n', 'tags: [a,   b]\n');

async function setup(raw = BASE, { chapter = '19-ok', name = '01-rewritten-hop-le.md' } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'verify-'));
  await mkdir(join(dir, 'content', 'entries', chapter), { recursive: true });
  await mkdir(join(dir, 'reports'), { recursive: true });
  const file = join(dir, 'content', 'entries', chapter, name);
  await writeFile(file, raw);
  return { dir, file, contentDir: join(dir, 'content'), reportsDir: join(dir, 'reports'), cleanup: () => rm(dir, { recursive: true, force: true }) };
}

const claim = (over = {}) => ({ text: 'Mức 150%', source_url: 'https://vbpl.vn/x', quote: 'ít nhất bằng 150%', verdict: 'match', note: '', ...over });
const report = (raw, over = {}) => ({
  id: 'rewritten-hop-le',
  checker: 'agent-A',
  checked_at: '2026-11-08',
  content_sha256: entryHash(raw),
  result: 'pass',
  claims: [claim(), claim({ text: 'Trần 40 giờ', source_url: 'https://vbpl.vn/y', quote: 'không quá 40 giờ' })],
  internal_checks: [],
  validity: { doc: 'BLLĐ 45/2019/QH14', in_force: true, effective_from: '2021-01-01', amended_by: [], basis: 'Công báo' },
  deliberate_vn_deviation: [],
  potential_harm: [],
  suggested_edits: [],
  ...over,
});
async function writeReport(env, name, rep) {
  await writeFile(join(env.reportsDir, name + '.yml'), stringify(rep));
}
async function plan(env, opts = {}) {
  return planApply({ entries: await loadEntries(env.contentDir), reports: await loadReports(env.reportsDir), ...opts });
}

// ---------- hash ----------
test('hash: không đổi khi sửa verification hoặc đổi thứ tự khóa; đổi khi sửa thân/frontmatter', () => {
  const h = entryHash(BASE);
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(entryHash(BASE.replace('"status":"unverified"', '"status":"source-checked"')), h);
  assert.equal(entryHash(BLOCK), entryHash(BLOCK.replace('tags: [a,   b]', 'tags: [a, b]')));
  assert.notEqual(entryHash(BASE.replace('Không tốn tiền.', 'Tốn tiền.')), h);
  assert.notEqual(entryHash(BASE.replace('tldr: "', 'tldr: "X ')), h);
  assert.equal(entryHash(BASE.replace(/\n/g, '\r\n')), h, 'CRLF được chuẩn hóa');
  // đảo thứ tự hai khóa frontmatter
  const swapped = BASE.replace('legacy: "19-1"\nchapter: 19\n', 'chapter: 19\nlegacy: "19-1"\n');
  assert.notEqual(swapped, BASE);
  assert.equal(entryHash(swapped), h);
});

test('hash.mjs CLI in đúng hash', async () => {
  const out = await run('tools/verify/hash.mjs', [FIXTURE]);
  assert.equal(out.stdout.trim(), entryHash(BASE));
  assert.equal(out.code, 0);
});

// ---------- lint ----------
async function lint(rep, raw = BASE) {
  const env = await setup(raw);
  try {
    const entries = await loadEntries(env.contentDir);
    return lintReport({ file: 'docs/verification/19/rewritten-hop-le.yml', data: rep, parseError: null }, { entriesById: new Map(entries.map((e) => [e.data.id, e])) });
  } finally {
    await env.cleanup();
  }
}
const errs = (issues) => issues.filter((i) => i.level === 'error').map((i) => i.message);

test('lint: báo cáo đúng khuôn → không lỗi', async () => {
  assert.deepEqual(errs(await lint(report(BASE))), []);
});
test('lint: verdict không hợp lệ, quote rỗng khi match, id không tồn tại, hash thiếu', async () => {
  assert.ok(errs(await lint(report(BASE, { claims: [claim({ verdict: 'ok' })] }))).some((m) => /verdict "ok"/.test(m)));
  assert.ok(errs(await lint(report(BASE, { claims: [claim({ quote: '  ' })] }))).some((m) => /quote rỗng/.test(m)));
  assert.ok(errs(await lint(report(BASE, { claims: [claim({ verdict: 'partial', quote: '' })] }))).length === 0);
  assert.ok(errs(await lint(report(BASE, { id: 'khong-ton-tai' }))).some((m) => /không tồn tại/.test(m)));
  assert.ok(errs(await lint(report(BASE, { content_sha256: undefined }))).some((m) => /content_sha256/.test(m)));
  assert.ok(errs(await lint(report(BASE, { content_sha256: 'abc' }))).some((m) => /content_sha256/.test(m)));
});
test('lint: result, in_force, severity, source_url, internal_checks', async () => {
  assert.ok(errs(await lint(report(BASE, { result: 'ok' }))).some((m) => /result/.test(m)));
  assert.ok(errs(await lint(report(BASE, { validity: { doc: 'x', in_force: 'partial' } }))).some((m) => /in_force/.test(m)));
  assert.ok(errs(await lint(report(BASE, { internal_checks: [{ issue: 'x', severity: 'fatal' }] }))).some((m) => /severity/.test(m)));
  assert.ok(errs(await lint(report(BASE, { claims: [claim({ source_url: 'ftp://x' })] }))).some((m) => /source_url/.test(m)));
  assert.ok(errs(await lint(report(BASE, { internal_checks: undefined }))).some((m) => /internal_checks/.test(m)));
  assert.ok(errs(await lint(report(BASE, { claims: [] }))).some((m) => /claims/.test(m)));
});
test('lint: hash lạc hậu và khóa lạ chỉ là cảnh báo', async () => {
  const w = (await lint(report(BASE, { content_sha256: 'a'.repeat(64), claims_internal_check: [] }))).filter((i) => i.level === 'warn').map((i) => i.message);
  assert.ok(w.some((m) => /lạc hậu/.test(m)));
  assert.ok(w.some((m) => /Khóa lạ/.test(m)));
});
test('lint-report.mjs CLI: 3 báo cáo thử có lỗi → exit 1', async () => {
  const r = await run('tools/verify/lint-report.mjs', []);
  assert.equal(r.code, 1);
  assert.match(r.stdout, /content_sha256/);
});

// ---------- apply: kế hoạch ----------
test('apply: pass + hash khớp → source-checked, ghi đúng trường', async () => {
  const env = await setup();
  try {
    await writeReport(env, 'rewritten-hop-le', report(BASE));
    const p = await plan(env);
    assert.equal(p.changes.length, 1);
    const c = p.changes[0];
    assert.equal(c.to, 'source-checked');
    assert.equal(c.verification.checker, 'agent-A');
    assert.equal(c.verification.checked_at, '2026-11-08');
    assert.deepEqual(c.verification.sources, ['https://vbpl.vn/x', 'https://vbpl.vn/y']);
    assert.deepEqual(p.skipped, []);
  } finally {
    await env.cleanup();
  }
});

test('apply: hash sai/lạc hậu → từ chối, không nâng', async () => {
  const env = await setup();
  try {
    await writeReport(env, 'rewritten-hop-le', report(BASE, { content_sha256: 'f'.repeat(64) }));
    const p = await plan(env);
    assert.equal(p.changes.length, 0);
    assert.match(p.skipped[0].reasons[0], /lạc hậu/);
    // mục sửa sau khi kiểm
    const env2 = await setup(BASE.replace('Không tốn tiền.', 'Tốn ít tiền.'));
    try {
      await writeReport(env2, 'rewritten-hop-le', report(BASE));
      assert.match((await plan(env2)).skipped[0].reasons[0], /lạc hậu/);
    } finally {
      await env2.cleanup();
    }
  } finally {
    await env.cleanup();
  }
});

test('apply: thiếu hash → từ chối, nêu rõ', async () => {
  const env = await setup();
  try {
    await writeReport(env, 'rewritten-hop-le', report(BASE, { content_sha256: undefined, claims: [claim({ verdict: 'mismatch', quote: '' })] }));
    const p = await plan(env);
    assert.equal(p.changes.length, 0);
    const text = p.skipped[0].reasons.join('\n');
    assert.match(text, /content_sha256/);
    assert.match(text, /mismatch/);
  } finally {
    await env.cleanup();
  }
});

test('apply: các điều kiện chặn nâng → giữ nguyên', async () => {
  const cases = {
    'có mismatch': { claims: [claim(), claim({ verdict: 'mismatch' })] },
    'có partial': { claims: [claim({ verdict: 'partial' })] },
    'match-secondary': { claims: [claim({ verdict: 'match-secondary' })] },
    'in_force unconfirmed': { validity: { doc: 'x', in_force: 'unconfirmed' } },
    'in_force false': { validity: { doc: 'x', in_force: false } },
    'internal error': { internal_checks: [{ issue: 'lệch số', severity: 'error' }] },
    'pass-with-edits': { result: 'pass-with-edits' },
  };
  for (const [name, over] of Object.entries(cases)) {
    const env = await setup();
    try {
      await writeReport(env, 'rewritten-hop-le', report(BASE, over));
      const p = await plan(env);
      assert.equal(p.changes.length, 0, name);
      assert.equal(p.kept.length, 1, name);
    } finally {
      await env.cleanup();
    }
  }
  // internal_checks chỉ warn → vẫn nâng
  const env = await setup();
  try {
    await writeReport(env, 'rewritten-hop-le', report(BASE, { internal_checks: [{ issue: 'nhỏ', severity: 'warn' }] }));
    assert.equal((await plan(env)).changes[0].to, 'source-checked');
  } finally {
    await env.cleanup();
  }
});

test('apply: cross-checked cần hai checker khác nhau cùng hash', async () => {
  const env = await setup();
  try {
    await writeReport(env, 'a', report(BASE));
    await writeReport(env, 'b-cung-nguoi', report(BASE, { checked_at: '2026-11-09' }));
    assert.equal((await plan(env)).changes[0].to, 'source-checked', 'cùng checker chỉ tính một');
    await writeReport(env, 'c', report(BASE, { checker: 'agent-B', checked_at: '2026-11-10' }));
    const c = (await plan(env)).changes[0];
    assert.equal(c.to, 'cross-checked');
    assert.equal(c.verification.checker, 'agent-A + agent-B');
    assert.equal(c.verification.checked_at, '2026-11-10');
    // báo cáo thứ hai lạc hậu → không cross
    await writeReport(env, 'c', report(BASE, { checker: 'agent-B', content_sha256: '0'.repeat(64) }));
    const p = await plan(env);
    assert.equal(p.changes[0].to, 'source-checked');
    assert.equal(p.skipped.length, 1);
  } finally {
    await env.cleanup();
  }
});

test('apply: fail/potential_harm → needs-*-review theo chương/văn bản; chương 13 = medical', async () => {
  const env = await setup();
  try {
    await writeReport(env, 'a', report(BASE, { result: 'fail' }));
    const c = (await plan(env)).changes[0];
    assert.equal(c.to, 'needs-legal-review');
    assert.equal(c.verification.status, 'needs-legal-review');
    await writeReport(env, 'a', report(BASE, { potential_harm: ['bước 2 làm chậm ép tim'], validity: { doc: 'AHA 2025', in_force: true } }));
    assert.equal((await plan(env)).changes[0].to, 'needs-medical-review');
  } finally {
    await env.cleanup();
  }
  const raw13 = BASE.replace('chapter: 19', 'chapter: 13');
  const env13 = await setup(raw13, { chapter: '13-cap-cuu' });
  try {
    await writeReport(env13, 'a', report(raw13, { result: 'fail' }));
    assert.equal((await plan(env13)).changes[0].to, 'needs-medical-review');
  } finally {
    await env13.cleanup();
  }
});

test('apply: fail thắng pass; expert-reviewed không bị đụng; không hạ cấp vô cớ; imported bị bỏ qua', async () => {
  const env = await setup();
  try {
    await writeReport(env, 'a', report(BASE));
    await writeReport(env, 'b', report(BASE, { checker: 'agent-B', result: 'fail' }));
    assert.equal((await plan(env)).changes[0].to, 'needs-legal-review');
  } finally {
    await env.cleanup();
  }
  const expert = BASE.replace('"status":"unverified","checked_at":null,"checker":null', '"status":"expert-reviewed","checked_at":"2026-01-01","checker":"BS Nguyễn Văn A"');
  const e2 = await setup(expert);
  try {
    await writeReport(e2, 'a', report(expert, { result: 'fail' }));
    const p = await plan(e2);
    assert.equal(p.changes.length, 0);
    assert.match(p.kept[0].reason, /expert-reviewed/);
  } finally {
    await e2.cleanup();
  }
  const cross = BASE.replace('"status":"unverified"', '"status":"cross-checked"');
  const e3 = await setup(cross);
  try {
    await writeReport(e3, 'a', report(cross));
    const p = await plan(e3);
    assert.equal(p.changes.length, 0);
    assert.match(p.kept[0].reason, /≥ source-checked/);
  } finally {
    await e3.cleanup();
  }
  const imported = BASE.replace('rewrite_status: "rewritten"', 'rewrite_status: "imported"');
  const e4 = await setup(imported);
  try {
    await writeReport(e4, 'a', report(imported));
    assert.match((await plan(e4)).skipped[0].reasons[0], /chưa rewritten/);
    assert.equal((await plan(e4, { allowImported: true })).changes[0].to, 'source-checked');
  } finally {
    await e4.cleanup();
  }
});

test('apply: không bao giờ đặt expert-reviewed', async () => {
  const env = await setup();
  try {
    for (const over of [{}, { result: 'fail' }, { potential_harm: ['x'] }]) {
      await writeReport(env, 'a', report(BASE, over));
      await writeReport(env, 'b', report(BASE, { ...over, checker: 'agent-B' }));
      for (const c of (await plan(env)).changes) assert.notEqual(c.to, 'expert-reviewed');
    }
  } finally {
    await env.cleanup();
  }
});

// ---------- apply: ghi ----------
for (const [label, raw] of [['flow', BASE], ['block + chú thích', BLOCK]]) {
  test(`replaceVerification (${label}): chỉ đổi khối verification, giữ nguyên byte còn lại`, async () => {
    const env = await setup(raw);
    try {
      await writeReport(env, 'a', report(raw));
      const c = (await plan(env)).changes[0];
      const out = replaceVerification(raw, c.verification);
      const beforeLines = raw.split('\n');
      const afterLines = out.split('\n');
      // Mọi dòng không thuộc khối verification giữ nguyên theo thứ tự
      const strip = (ls) => ls.filter((l) => !/^  (status|checked_at|checker|scope|sources):|^ {4}- |^verification: \{/.test(l)).map((l) => l.replace(/^(verification:\s*)\{.*$/, '$1'));
      assert.deepEqual(strip(afterLines), strip(beforeLines));
      assert.notEqual(out, raw);
      const fm = splitFrontmatter(out);
      assert.equal(fm.data.verification.status, 'source-checked');
      assert.equal(fm.data.verification.checker, 'agent-A');
      assert.equal(fm.data.verification.checked_at, '2026-11-08');
      assert.deepEqual(fm.data.verification.sources, ['https://vbpl.vn/x', 'https://vbpl.vn/y']);
      assert.equal(fm.body, splitFrontmatter(raw).body);
      const { verification: _v, ...a } = fm.data;
      const { verification: _w, ...b } = splitFrontmatter(raw).data;
      assert.deepEqual(a, b);
      assert.deepEqual(Object.keys(fm.data), Object.keys(splitFrontmatter(raw).data));
      // hash không đổi sau khi ghi verification (chống lạc hậu không tự phá)
      assert.equal(entryHash(out), entryHash(raw));
      if (label !== 'flow') {
        assert.ok(out.includes('origin_note: giữ nguyên  # chú thích cuối dòng\n'));
        assert.ok(out.includes('tags: [a,   b]\n'));
      }
    } finally {
      await env.cleanup();
    }
  });
}

test('apply: --write qua CLI ghi file tạm, idempotent; dry-run mặc định không ghi', async () => {
  const env = await setup();
  try {
    await writeReport(env, 'rewritten-hop-le', report(BASE));
    const args = ['--content', env.contentDir, '--reports', env.reportsDir];
    const dry = await run('tools/verify/apply.mjs', args);
    assert.equal(dry.code, 0);
    assert.match(dry.stdout, /unverified → source-checked/);
    assert.equal(await readFile(env.file, 'utf8'), BASE, 'dry-run không ghi');
    const w = await run('tools/verify/apply.mjs', [...args, '--write']);
    assert.match(w.stdout, /Đã ghi 1 mục/);
    const after = await readFile(env.file, 'utf8');
    assert.equal(splitFrontmatter(after).data.verification.status, 'source-checked');
    assert.equal(after.split('\n').length, BASE.split('\n').length);
    const again = await run('tools/verify/apply.mjs', [...args, '--write']);
    assert.match(again.stdout, /0 thay đổi/);
    assert.equal(await readFile(env.file, 'utf8'), after);
    // sau khi ghi, gate vẫn sạch với mục này
    const { runGate } = await import('../../gate/lib/gate.mjs');
    assert.deepEqual((await runGate({ contentDir: env.contentDir })).issues, []);
  } finally {
    await env.cleanup();
  }
});

function run(script, args) {
  return new Promise((res) => {
    const p = spawn('node', [script, ...args], { cwd: ROOT });
    const out = [];
    const err = [];
    p.stdout.on('data', (d) => out.push(d));
    p.stderr.on('data', (d) => err.push(d));
    p.on('close', (code) => res({ code, stdout: Buffer.concat(out).toString('utf8'), stderr: Buffer.concat(err).toString('utf8') }));
  });
}
