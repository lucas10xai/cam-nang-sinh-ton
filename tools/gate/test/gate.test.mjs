import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { GATE_DIR } from '../lib/paths.mjs';
import { runGate } from '../lib/gate.mjs';
import { buildStatus } from '../lib/status.mjs';

const contentDir = resolve(GATE_DIR, 'fixtures');
const res = await runGate({ contentDir });
const by = (file) => res.issues.filter((i) => i.file.endsWith(file));
const checksOf = (file) => [...new Set(by(file).map((i) => i.check))].sort();

test('mục hợp lệ không bị báo oan', () => {
  assert.deepEqual(by('01-hop-le/01-hop-le-mot.md'), []);
  assert.deepEqual(by('01-hop-le/02-hop-le-hai.md'), []);
});

test('định dạng kết quả thống nhất', () => {
  assert.ok(res.issues.length > 0);
  for (const i of res.issues) {
    assert.deepEqual(Object.keys(i).sort(), ['check', 'file', 'id', 'level', 'message']);
    assert.ok(['error', 'warn'].includes(i.level));
  }
});

const cases = [
  ['01-schema-sai.md', 'schema', 'error'],
  ['02-id-trung.md', 'unique', 'error'],
  ['03-so-trung.md', 'unique', 'error'],
  ['04-thieu-h2.md', 'sections', 'error'],
  ['05-related-hong.md', 'related', 'error'],
  ['06-phap-luat-rong.md', 'legal-refs', 'warn'],
  ['07-mien-la.md', 'legal-refs', 'warn'],
  ['08-kiem-chung-thieu.md', 'verification', 'error'],
  ['09-tu-khoa.md', 'keywords', 'error'],
  ['10-so-la.md', 'numbers', 'warn'],
];
for (const [file, check, level] of cases) {
  test(`${file} bị bắt đúng bởi "${check}" (${level}) và không kiểm tra nào khác`, () => {
    assert.deepEqual(checksOf(file), [check]);
    assert.ok(by(file).every((i) => i.level === level));
  });
}

test('--chapter chỉ lọc kết quả nhưng vẫn kiểm liên mục', async () => {
  const r = await runGate({ contentDir, chapter: 2 });
  assert.ok(r.issues.length === res.issues.length);
  const r1 = await runGate({ contentDir, chapter: 1 });
  assert.equal(r1.issues.length, 0);
});

test('links bị bỏ qua khi không có --links', () => {
  assert.deepEqual(res.skipped, ['links']);
});

test('status.json: tổng, theo chương, ma trận và ISO', () => {
  const s = buildStatus(res.entries, new Date('2026-11-08T00:00:00Z'));
  assert.equal(s.generated_at, '2026-11-08T00:00:00.000Z');
  assert.equal(s.total, 12);
  assert.equal(s.chapters['1'].total, 2);
  assert.equal(s.chapters['1'].by_status['source-checked'], 1);
  assert.equal(s.chapters['2'].total, 10);
  assert.equal(s.cells.reduce((a, c) => a + c.count, 0), 12);
  assert.equal(s.totals.by_rewrite_status.imported, 12);
  assert.deepEqual(Object.keys(s.chapters), ['1', '2']);
});
