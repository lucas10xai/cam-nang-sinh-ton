import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractNumbers, candidates } from '../lib/numbers.mjs';
import { run } from '../checks/numbers.mjs';
import { loadConfig } from '../lib/gate.mjs';
import { splitSections } from '../lib/load.mjs';

const config = await loadConfig();
const mk = (easy, ref) => ({
  file: 'x.md',
  data: { id: 'x' },
  sections: splitSections(`## Nói dễ hiểu\n${easy}\n## Chi phí\n\n## Lợi ích\n${ref}\n`),
});
const warns = (easy, ref) => run({ entries: [mk(easy, ref)], config }).map((i) => i.message);

test('chuẩn hóa số kiểu Việt Nam', () => {
  assert.deepEqual(candidates('1.500.000'), [1500000]);
  assert.ok(candidates('2,5').includes(2.5));
  assert.ok(candidates('1.500').includes(1500));
  const [n] = extractNumbers('khoảng 1,5 triệu đồng');
  assert.deepEqual(n.values, [1500000]);
  assert.deepEqual(extractNumbers('thêm 3 tỷ')[0].values, [3e9]);
  assert.deepEqual(extractNumbers('300 nghìn')[0].values, [300000]);
});

test('khớp giữa các cách viết khác nhau', () => {
  assert.deepEqual(warns('Được 1,5 triệu đồng.', 'Tức 1.500.000 đồng.'), []);
  assert.deepEqual(warns('Được 1.500.000 đồng.', 'Tức 1,5 triệu.'), []);
  assert.deepEqual(warns('Trả 150%.', 'Mức 150% lương.'), []);
  assert.deepEqual(warns('Trả 300 nghìn.', 'Phạt 300.000 đồng.'), []);
});

test('báo số không có ở nguồn', () => {
  assert.equal(warns('Tăng 45%.', 'Không có số.').length, 1);
  assert.equal(warns('Mất 2,5 triệu.', 'Chỉ 1,5 triệu.').length, 1);
});

test('bỏ qua: số điều khoản, số hiệu văn bản, năm, số nhỏ, hotline, ngày', () => {
  const easy = 'Theo Điều 98, khoản 2, Nghị định 145/2020/NĐ-CP và Luật 45/2019/QH14, từ năm 2021 hoặc 01/01/2021, có 3 bước, gọi 113 hoặc 0912345678 hay 1900 1234, mục 15.';
  assert.deepEqual(warns(easy, ''), []);
});

test('không bỏ qua số nhỏ có đơn vị', () => {
  assert.equal(warns('Tiết kiệm 5%.', '').length, 1);
});

test('đơn vị phải là từ trọn vẹn: "227 ngành" không phải "227 ngàn"', () => {
  assert.equal(extractNumbers('có 227 ngành nghề')[0].unit, null);
  assert.deepEqual(warns('Có 227 ngành nghề.', 'Phụ lục có 227 mục.'), []);
});
