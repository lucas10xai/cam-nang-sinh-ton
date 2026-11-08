import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { GATE_DIR } from '../lib/paths.mjs';
import { runGate } from '../lib/gate.mjs';
import { countWords, splitParagraphs } from '../checks/rewritten.mjs';

const BASE = await readFile(resolve(GATE_DIR, 'fixtures-rewritten/entries/19-ok/01-rewritten-hop-le.md'), 'utf8');

// Tạo mục từ fixture gốc bằng cách thay chuỗi; trả về các issue của check `rewritten` (và của mọi check khi all=true).
async function gateOn(edit, { all = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'gate-rw-'));
  try {
    await mkdir(join(dir, 'entries', '19-ok'), { recursive: true });
    const text = edit(BASE);
    assert.notEqual(text, BASE, 'chỉnh sửa phải làm thay đổi fixture');
    await writeFile(join(dir, 'entries', '19-ok', '01-rewritten-hop-le.md'), text);
    const { issues } = await runGate({ contentDir: dir });
    return all ? issues : issues.filter((i) => i.check === 'rewritten');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
const msgs = (issues, level) => issues.filter((i) => !level || i.level === level).map((i) => i.message);
const words = (n) => Array.from({ length: n }, (_, i) => `chữ${i}`).join(' ');

test('fixture gốc: sạch với mọi check', async () => {
  const dir = resolve(GATE_DIR, 'fixtures-rewritten');
  const { issues } = await runGate({ contentDir: dir });
  assert.deepEqual(issues, []);
});

test('mục imported không bị check rewritten đụng tới', async () => {
  const issues = await gateOn(
    (t) => t.replace('rewrite_status: "rewritten"', 'rewrite_status: "imported"').replace('vn_class: "vn_native"', 'vn_class: "unclassified"').replace(/tldr: ".*"/, 'tldr: null'),
    { all: true },
  );
  assert.deepEqual(issues.filter((i) => i.check === 'rewritten'), []);
});

test('tldr rỗng / null', async () => {
  assert.match(msgs(await gateOn((t) => t.replace(/tldr: ".*"/, 'tldr: null')))[0], /tldr rỗng/);
  assert.match(msgs(await gateOn((t) => t.replace(/tldr: ".*"/, 'tldr: "  "')))[0], /tldr rỗng/);
});

test('tldr > 280 ký tự', async () => {
  const i = await gateOn((t) => t.replace(/tldr: ".*"/, `tldr: "${'a'.repeat(281)}"`));
  assert.ok(msgs(i, 'error').some((m) => /tldr dài 281/.test(m)));
  const ok = await gateOn((t) => t.replace(/tldr: ".*"/, `tldr: "150% ${'a'.repeat(275)}"`));
  assert.ok(!msgs(ok).some((m) => /tldr dài/.test(m)));
});

test('steps: 1 phần tử và 7 phần tử bị lỗi, 0 hợp lệ', async () => {
  const one = await gateOn((t) => t.replace('  - "Đối chiếu bảng lương với mức 150%."\n', ''));
  assert.ok(msgs(one, 'error').some((m) => /steps có 1 phần tử/.test(m)));
  const seven = await gateOn((t) => t.replace('situations:', Array.from({ length: 5 }, () => '  - "Bước thêm."').join('\n') + '\nsituations:'));
  assert.ok(msgs(seven, 'error').some((m) => /steps có 7 phần tử/.test(m)));
  const zero = await gateOn((t) => t.replace(/steps:\n(  - .*\n)+/, 'steps: []\n'));
  assert.ok(!msgs(zero).some((m) => /steps/.test(m)));
});

test('step > 200 ký tự', async () => {
  const i = await gateOn((t) => t.replace('Ghi lại số giờ làm thêm mỗi ngày.', 'b'.repeat(201)));
  assert.ok(msgs(i, 'error').some((m) => /steps\[1\] dài 201/.test(m)));
});

test('đoạn dài: warn 111-150, error > 150, bỏ qua Nguồn và dòng URL', async () => {
  const warn = await gateOn((t) => t.replace('Thu thêm tiền công mỗi tháng.', words(111)));
  assert.deepEqual(msgs(warn, 'warn').length, 1);
  assert.match(msgs(warn)[0], /111 chữ/);
  assert.equal(msgs(warn, 'error').length, 0);
  const edge = await gateOn((t) => t.replace('Thu thêm tiền công mỗi tháng.', words(110)));
  assert.deepEqual(msgs(edge), []);
  const err = await gateOn((t) => t.replace('Thu thêm tiền công mỗi tháng.', words(151)));
  assert.ok(msgs(err, 'error').some((m) => /151 chữ/.test(m)));
  const mid = await gateOn((t) => t.replace('Thu thêm tiền công mỗi tháng.', words(150)));
  assert.equal(msgs(mid, 'error').length, 0);
  assert.equal(msgs(mid, 'warn').length, 1);
  const src = await gateOn((t) => t.replace('- Bộ luật Lao động 45/2019/QH14, Điều 98, 107.', `- ${words(200)}`));
  assert.deepEqual(msgs(src), []);
  const url = await gateOn((t) => t.replace('Thu thêm tiền công mỗi tháng.', 'https://example.com/' + 'x'.repeat(2000)));
  assert.deepEqual(msgs(url), []);
});

test('splitParagraphs: mỗi gạch là một đoạn, dòng tiếp nối gộp vào gạch', () => {
  const ps = splitParagraphs('- một hai\n  ba bốn\n- năm\n\nđoạn sáu\nbảy');
  assert.deepEqual(ps.map((p) => p.text), ['một hai ba bốn', 'năm', 'đoạn sáu bảy']);
  assert.equal(countWords('a b — https://x.y/z c'), 3);
});

const LEGAL_LIST = /- Làm thêm ngày thường được trả[^\n]*\n- Số giờ[^\n]*\n/;

test('Pháp luật VN: đoạn văn dài (> 60 chữ) thay gạch → error; 41-60 → warn; ≤ 40 → ổn', async () => {
  const mk = (n) => (t) => t.replace(LEGAL_LIST, `${words(n)}\n`);
  const e70 = await gateOn(mk(70));
  assert.ok(msgs(e70, 'error').some((m) => /phải là danh sách gạch đầu dòng.*70 chữ/.test(m)));
  const e61 = await gateOn(mk(61));
  assert.equal(msgs(e61, 'error').length, 1);
  const w60 = await gateOn(mk(60));
  assert.equal(msgs(w60, 'error').length, 0);
  assert.ok(msgs(w60, 'warn').some((m) => /60 chữ/.test(m)));
  const w41 = await gateOn(mk(41));
  assert.equal(msgs(w41, 'warn').length, 1);
  assert.deepEqual(msgs(await gateOn(mk(40))), []);
});

test('Pháp luật VN: dòng nhóm in đậm ngắn (≤ 30 chữ) và câu dẫn ngắn không lỗi', async () => {
  const bold = await gateOn((t) => t.replace('**Mức trả**', '**Mức phạt** (Nghị định 283/2026/NĐ-CP): áp dụng với người sử dụng lao động.'));
  assert.deepEqual(msgs(bold), []);
  const lead = await gateOn((t) => t.replace('**Mức trả**', `Câu dẫn ngắn ${words(20)}.`));
  assert.deepEqual(msgs(lead), []);
  // nhóm in đậm > 30 chữ bị xử như đoạn thường: 31-40 chữ vẫn ổn, 41-60 warn
  const longBold = await gateOn((t) => t.replace('**Mức trả**', `**Nhóm** ${words(44)}`));
  assert.equal(msgs(longBold, 'error').length, 0);
  assert.equal(msgs(longBold, 'warn').length, 1);
});

test('gạch pháp luật: warn 71-100 chữ, error > 100', async () => {
  const mk = (n) => (t) => t.replace('Làm thêm ngày thường được trả ít nhất 150% tiền lương giờ bình thường.', `Số 150% ${words(n - 8)}.`);
  // Hiệu chỉnh theo phép đếm thực tế: câu thay thế + trích dẫn cuối dòng cho đúng n chữ.
  const w71 = await gateOn(mk(71));
  assert.ok(msgs(w71, 'warn').some((m) => /71 chữ/.test(m)), msgs(w71).join('|'));
  const w70 = await gateOn(mk(70));
  assert.deepEqual(msgs(w70), []);
  const w101 = await gateOn(mk(101));
  assert.ok(msgs(w101, 'error').some((m) => /Gạch pháp luật dài 101/.test(m)));
  const w100 = await gateOn(mk(100));
  assert.equal(msgs(w100, 'error').length, 0);
  assert.ok(msgs(w100, 'warn').some((m) => /100 chữ/.test(m)));
});

test('gạch pháp luật thiếu trích dẫn → warn', async () => {
  const i = await gateOn((t) => t.replace(' (Điều 107 khoản 2, Bộ luật Lao động 45/2019/QH14)', ''));
  assert.equal(msgs(i, 'error').length, 0);
  assert.ok(msgs(i, 'warn').some((m) => /thiếu trích dẫn/.test(m)));
  const bad = await gateOn((t) => t.replace('(Điều 107 khoản 2, Bộ luật Lao động 45/2019/QH14)', '(xem thêm ở trên)'));
  assert.ok(msgs(bad, 'warn').some((m) => /thiếu trích dẫn/.test(m)));
  const nameOnly = await gateOn((t) => t.replace('(Điều 107 khoản 2, Bộ luật Lao động 45/2019/QH14)', '(Bộ luật Lao động 45/2019/QH14)'));
  assert.deepEqual(msgs(nameOnly), []);
});

test('H2 Pháp luật VN mà legal_refs rỗng → error', async () => {
  const i = await gateOn((t) => t.replace(/legal_refs: \[.*\]/, 'legal_refs: []'));
  assert.ok(msgs(i, 'error').some((m) => /legal_refs rỗng/.test(m)));
  const all = await gateOn((t) => t.replace(/legal_refs: \[.*\]/, 'legal_refs: []'), { all: true });
  assert.equal(all.filter((x) => x.check === 'legal-refs').length, 0); // không báo lặp
});

test('legal_refs không rỗng mà không có H2 → warn', async () => {
  const i = await gateOn((t) => t.replace(/## Pháp luật Việt Nam[\s\S]*?(?=## Ghi chú)/, ''));
  assert.equal(msgs(i, 'error').length, 0);
  assert.ok(msgs(i, 'warn').some((m) => /không có H2/.test(m)));
});

test('legal_refs[].url không hợp lệ hoặc không phải http(s) → error; null → warn', async () => {
  for (const bad of ['not a url', 'ftp://vbpl.vn/x']) {
    const i = await gateOn((t) => t.replace(/"url":(?:"[^"]*"|null)/, `"url":"${bad}"`));
    assert.ok(msgs(i, 'error').some((m) => /url không phải URL http\(s\)/.test(m)), bad);
  }
  const n = await gateOn((t) => t.replace(/"url":"[^"]*"/, '"url":null'));
  assert.equal(msgs(n, 'error').length, 0);
  assert.ok(msgs(n, 'warn').some((m) => /chưa có URL nguồn/.test(m)));
});

test('vn_class unclassified → error', async () => {
  const i = await gateOn((t) => t.replace('vn_class: "vn_native"', 'vn_class: "unclassified"'));
  assert.ok(msgs(i, 'error').some((m) => /vn_class/.test(m)));
});

test('situations ngoài danh mục → error', async () => {
  const i = await gateOn((t) => t.replace('["bi-quyt-luong-lam-them"]', '["bi-quyt-luong-lam-them", "khong-co-slug-nay"]'));
  assert.ok(msgs(i, 'error').some((m) => /khong-co-slug-nay/.test(m)));
});

test('số trong tldr/steps phải có trong thân', async () => {
  const t1 = await gateOn((t) => t.replace('Trần 40 giờ mỗi tháng.', 'Trần 999 giờ mỗi tháng.'));
  assert.ok(msgs(t1, 'error').some((m) => /"999".*tldr/.test(m)));
  const s1 = await gateOn((t) => t.replace('mức 150%.', 'mức 210%.'));
  assert.ok(msgs(s1, 'error').some((m) => /"210%".*steps\[2\]/.test(m)));
  // chuẩn hóa: 1,5 triệu trong tldr khớp 1.500.000 đồng trong thân
  const norm = await gateOn((t) => t.replace('Trần 40 giờ mỗi tháng.', 'Thêm 1,5 triệu đồng.').replace('Không tốn tiền.', 'Tốn 1.500.000 đồng.'));
  assert.ok(!msgs(norm).some((m) => /triệu/.test(m)), msgs(norm).join('|'));
  // số nhỏ cũng phải có trong thân
  const small = await gateOn((t) => t.replace('Trần 40 giờ mỗi tháng.', 'Trần 7 giờ.'));
  assert.ok(msgs(small, 'error').some((m) => /"7"/.test(m)));
});

test('trạng thái xác minh cao mà thiếu checked_at/sources → error (check verification)', async () => {
  const i = await gateOn((t) => t.replace('"status":"unverified"', '"status":"source-checked"'), { all: true });
  assert.ok(i.some((x) => x.check === 'verification' && x.level === 'error'));
});
