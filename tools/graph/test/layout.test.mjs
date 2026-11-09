// Chạy tay: node --test tools/graph/test/layout.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutGraph } from '../layout.mjs';

const input = () => {
  const groups = [{ slug: 'a', chapters: [1, 2, 3] }, { slug: 'b', chapters: [4, 5] }];
  const chapters = [1, 2, 3, 4, 5].map((n) => ({ n }));
  const entries = [];
  for (const c of chapters) for (let i = 0; i < 8 + c.n * 6; i++) entries.push({ id: `c${c.n}-${i}`, ch: c.n, related: [], sits: i % 5 === 0 ? ['s1'] : i % 7 === 0 ? ['s2'] : [] });
  return { groups, chapters, entries, sits: [{ slug: 's1' }, { slug: 's2' }] };
};

test('bố cục xác định: cùng đầu vào cho cùng tọa độ', () => {
  const a = layoutGraph(input()), b = layoutGraph(input());
  assert.deepEqual([...a.chapterPos], [...b.chapterPos]);
  assert.deepEqual([...a.entryPos], [...b.entryPos]);
  assert.deepEqual([...a.sitPos], [...b.sitPos]);
});

test('các đĩa chương không chồng nhau', () => {
  const { chapterPos } = layoutGraph(input());
  const d = [...chapterPos.values()];
  for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) {
    assert.ok(Math.hypot(d[i].x - d[j].x, d[i].y - d[j].y) >= d[i].r + d[j].r, `đĩa ${i} và ${j} chồng nhau`);
  }
});

test('mọi mục có tọa độ hữu hạn, mọi tình huống nằm ngoài vành mục', () => {
  const lay = layoutGraph(input());
  let maxR = 0;
  for (const p of lay.entryPos.values()) { assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y)); maxR = Math.max(maxR, Math.hypot(p.x, p.y)); }
  for (const p of lay.sitPos.values()) assert.ok(Math.hypot(p.x, p.y) > maxR);
});
