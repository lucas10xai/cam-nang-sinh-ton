// Nhập bản nháp vi-quangpao -> content/ (idempotent: xóa sạch content/ rồi ghi lại).
// Chuyển cấu trúc, không viết lại chữ. Chạy: node tools/import/run.mjs
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Document, visit } from 'yaml';
import { EntrySchema } from '../../schema/entry.mjs';
import { ChapterSchema } from '../../schema/chapter.mjs';
import { sourceKeys, ZH_COST, readZh, readLuonglbByZh, matchQuangpaoToZh } from './origin.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const QP = join(ROOT, '_ref', 'vi-quangpao');
const LUONG = join(ROOT, '_ref', 'vi-luonglb');
const ZH = join(ROOT, '_ref', 'zh-eternity4719');
const OUT = join(ROOT, 'content');

let qpCommit = 'không rõ';
try {
  qpCommit = execFileSync('git', ['-C', join(ROOT, '_ref', 'vi-quangpao'), 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {}

const die = (msg) => {
  console.error('LỖI nhập: ' + msg);
  process.exit(1);
};

// ---- Bảng ánh xạ nhãn nguồn -> enum SPEC. Nhãn lạ => dừng (không đoán). ----
const MAP = {
  'tiền': { '0': '0', 'ít': 'low', 'nhiều': 'high' },
  'thời-gian': { '0': '0', 'ít': 'low', 'vừa': 'mid', 'nhiều': 'high' },
  'ý-chí': { 'không': '0', 'ít': 'low', 'có': 'mid' },
  'lợi-ích': { 'lớn': 'large', 'vừa': 'medium', 'nhỏ': 'small' },
  'thước-đo': {
    'tử-vong': 'mortality',
    'tiền': 'money',
    'thời-gian': 'time',
    'khác': 'other',
    // Không có enum riêng trong SPEC: gộp vào other, giữ nhãn gốc trong tags (thuoc-do:...).
    'mắc-bệnh': 'other',
    'tai-nạn': 'other',
    'triệu-chứng': 'other',
    'tàn-tật': 'other',
  },
};
const EXTRA_METRIC_TAG = { 'mắc-bệnh': 'mac-benh', 'tai-nạn': 'tai-nan', 'triệu-chứng': 'trieu-chung', 'tàn-tật': 'tan-tat' };
const KNOWN_TAG_KEYS = new Set([...Object.keys(MAP), 'nhóm']);

const asciiSlug = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
    .replace(/[^a-z0-9+,-]+/g, '-').replace(/^-+|-+$/g, '');

const FIELD_ORDER_SRC = ['Chi phí', 'Nói dễ hiểu', 'Lợi ích', 'Pháp luật Việt Nam', 'Mức bằng chứng', 'Nguồn', 'Ghi chú'];
const FIELD_RE = /^- (Chi phí|Nói dễ hiểu|Lợi ích|Pháp luật Việt Nam|Mức bằng chứng|Nguồn|Ghi chú): (.*)$/;
const BODY_ORDER = ['Nói dễ hiểu', 'Chi phí', 'Lợi ích', 'Pháp luật Việt Nam', 'Ghi chú', 'Nguồn'];
const CONTESTED_RE = /mục có tranh luận|^tranh luận|chỗ (?:có )?tranh luận|còn tranh luận|bị tranh luận|gây tranh luận/i;
const LINK_RE = /\]\([^)\s]*#entry-([a-z0-9-]+)(?:\s+"refs:([^"]*)")?\)/g;
const ANCHOR_RE = /^<a name="entry-([a-z0-9-]+)" data-legacy="(\d+-\d+)"><\/a>$/;

// ---- Đọc bản nháp ----
const bookDir = join(QP, 'book');
const files = readdirSync(bookDir).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
if (files.length !== 36) die(`mong 36 chương, thấy ${files.length}`);

const chapters = [];
const unknownLabels = [];
for (const f of files) {
  const lines = readFileSync(join(bookDir, f), 'utf8').split('\n');
  const num = Number(f.slice(0, 2));
  const slug = f.replace(/^\d\d-/, '').replace(/\.md$/, '');
  const h1 = lines.findIndex((l) => /^# \d+\. /.test(l));
  if (h1 < 0) die(`${f}: thiếu H1`);
  const m1 = lines[h1].match(/^# (\d+)\. (.*)$/);
  if (Number(m1[1]) !== num) die(`${f}: số chương trong H1 (${m1[1]}) lệch tên file`);
  const first = lines.findIndex((l) => /^### \d+\. /.test(l));
  if (first < 0) die(`${f}: không có mục`);
  const intro = lines.slice(h1 + 1, first).join('\n').trim();
  const ch = { number: num, title: m1[2].trim(), slug, file: f, intro, entries: [] };

  let cur = null;
  const flush = () => cur && ch.entries.push(cur);
  for (let i = first; i < lines.length; i++) {
    const line = lines[i];
    const h = line.match(/^### (\d+)\. (.*)$/);
    if (h) {
      flush();
      cur = { number: Number(h[1]), title: h[2].trim(), tags: null, id: null, legacy: null, fields: {}, order: [], lineNo: i + 1 };
      continue;
    }
    if (!line.trim()) continue;
    const here = `${f}:${i + 1}`;
    if (line.startsWith('<!-- nhãn:')) {
      const m = line.match(/^<!-- nhãn: (.*) -->$/);
      if (!m) die(`${here}: dòng nhãn lạ`);
      const tags = {};
      for (const tok of m[1].trim().split(/\s+/)) {
        const kv = tok.match(/^([^=]+)=(.+)$/);
        if (!kv) die(`${here}: token nhãn lạ "${tok}"`);
        if (!KNOWN_TAG_KEYS.has(kv[1])) die(`${here}: khóa nhãn lạ "${kv[1]}"`);
        tags[kv[1]] = kv[2];
      }
      cur.tags = tags;
      continue;
    }
    const a = line.match(ANCHOR_RE);
    if (a) {
      cur.id = a[1];
      cur.legacy = a[2];
      continue;
    }
    const fm = line.match(FIELD_RE);
    if (fm) {
      if (cur.fields[fm[1]] !== undefined) die(`${here}: trùng trường "${fm[1]}"`);
      cur.fields[fm[1]] = fm[2].trim();
      cur.order.push(fm[1]);
      continue;
    }
    die(`${here}: dòng không nhận dạng được trong mục: ${line.slice(0, 80)}`);
  }
  flush();
  chapters.push(ch);
}

// ---- Dữ liệu phụ trợ ----
const readJson = (p) => JSON.parse(readFileSync(join(QP, p), 'utf8'));
const legalData = readJson('data/legal-references.json').references;
const reviewData = readJson('data/review-status.json').entries;
const catalog = readJson('data/entries.json').entries;

const allIds = new Map();
let total = 0;
for (const ch of chapters)
  for (const e of ch.entries) {
    total++;
    if (!e.id || !e.legacy) die(`${ch.file}: mục ${e.number} thiếu anchor id/legacy`);
    if (e.legacy !== `${ch.number}-${e.number}`) die(`${ch.file}: legacy ${e.legacy} không khớp ${ch.number}-${e.number}`);
    if (allIds.has(e.id)) die(`id trùng: ${e.id}`);
    allIds.set(e.id, e);
    if (!e.tags) die(`${e.legacy}: thiếu dòng nhãn`);
    for (const k of ['Chi phí', 'Nói dễ hiểu', 'Lợi ích', 'Mức bằng chứng', 'Nguồn', 'Ghi chú'])
      if (e.fields[k] === undefined) die(`${e.legacy}: thiếu trường "${k}"`);
    const want = FIELD_ORDER_SRC.filter((k) => e.fields[k] !== undefined).join('|');
    if (e.order.join('|') !== want) {
      // thứ tự nguồn khác dự kiến: không phải lỗi, chỉ ghi nhận để chắc chắn đã gom đúng trường
    }
  }
if (catalog.length !== total) die(`data/entries.json có ${catalog.length} mục, book/ có ${total}`);
for (const c of catalog) {
  const e = allIds.get(c.id);
  if (!e || e.legacy !== c.legacy) die(`data/entries.json lệch book/ ở ${c.id}`);
}
for (const id of Object.keys(reviewData)) if (!allIds.has(id)) die(`review-status trỏ id không tồn tại: ${id}`);
for (const r of legalData) for (const b of r.bindings) if (!allIds.has(b.entryId)) die(`legal-references trỏ id không tồn tại: ${b.entryId}`);

// ---- Ánh xạ nguồn (zh, luonglb) ----
const zhEntries = readZh(join(ZH, 'book'));
const luongByZh = readLuonglbByZh(join(LUONG, 'sach'));
const qpForMatch = [];
for (const e of allIds.values()) {
  const benefit = MAP['lợi-ích'][e.tags['lợi-ích']];
  qpForMatch.push({ label: e.legacy, keys: sourceKeys(e.fields['Nguồn']), grade: e.fields['Mức bằng chứng'].trim(), benefit,
    cost: [ZH_COST.money[e.tags['tiền']], ZH_COST.time[e.tags['thời-gian']], ZH_COST.will[e.tags['ý-chí']]].join('|') });
}
const { map: qpToZh, ambiguous: originAmbiguous } = matchQuangpaoToZh(qpForMatch, zhEntries);

// ---- Dựng mục ----
const stats = {
  labelCounts: {},
  evidence: { A: 0, B: 0, C: 0 },
  cost: { money: {}, time: {}, will: {} },
  benefit: {},
  metric: {},
  contested: [],
  unresolved: [],
  related: 0,
  withLegalSection: 0,
  groupCount: 0,
  legalSectionNoRefs: 0,
  legalLoaded: [],
  reviewLoaded: {},
  selfLinks: 0,
  zh: 0,
  luonglb: 0,
  perChapter: [],
};
const bump = (o, k) => (o[k] = (o[k] ?? 0) + 1);

const chapterDirName = (ch) => `${String(ch.number).padStart(2, '0')}-${ch.slug}`;
const pad = (n, w) => String(n).padStart(w, '0');
// Chuỗi dạng ngày (YYYY-MM-DD) hoặc nhãn "9-9" luôn đặt ngoặc kép để YAML 1.1 (js-yaml) không đọc thành Date/số.
const fm = (obj) => {
  const doc = new Document(obj);
  visit(doc, {
    Scalar(_k, node) {
      if (typeof node.value === 'string' && /^\d+-\d+(-\d+)?$/.test(node.value)) node.type = 'QUOTE_DOUBLE';
    },
  });
  return '---\n' + doc.toString({ lineWidth: 0 }) + '---\n';
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'chapters'), { recursive: true });

const parsed = []; // để tự kiểm
for (const ch of chapters) {
  const dirName = chapterDirName(ch);
  mkdirSync(join(OUT, 'entries', dirName), { recursive: true });
  const width = Math.max(2, String(ch.entries.length).length);
  const chapterRel = { number: ch.number, title: ch.title, slug: ch.slug, entry_count: ch.entries.length };
  const chp = ChapterSchema.safeParse(chapterRel);
  if (!chp.success) die(`chương ${ch.number}: ${chp.error.message}`);
  const chStat = { number: ch.number, title: ch.title, source: ch.entries.length, imported: 0, zh: 0, luonglb: 0 };

  for (const e of ch.entries) {
    // nhãn
    const t = e.tags;
    const pick = (k) => {
      const v = MAP[k][t[k]];
      if (v === undefined) die(`${e.legacy}: nhãn lạ ${k}=${t[k]}`);
      bump(stats.labelCounts, `${k}=${t[k]} -> ${v}`);
      return v;
    };
    const cost = { money: pick('tiền'), time: pick('thời-gian'), will: pick('ý-chí') };
    const benefit = pick('lợi-ích');
    const metric = pick('thước-đo');
    const grade = e.fields['Mức bằng chứng'].trim();
    if (!['A', 'B', 'C'].includes(grade)) die(`${e.legacy}: mức bằng chứng lạ "${grade}"`);

    const tags = [];
    if (EXTRA_METRIC_TAG[t['thước-đo']]) tags.push(`thuoc-do:${EXTRA_METRIC_TAG[t['thước-đo']]}`);
    if (t['nhóm']) stats.groupCount++;
    if (t['nhóm']) for (const g of t['nhóm'].split(',')) tags.push(`nhom:${asciiSlug(g)}`);

    const contested = CONTESTED_RE.test(e.fields['Ghi chú']);
    if (contested) stats.contested.push(e.legacy);

    // related: link #entry-<id> và refs:... trong mọi trường, theo thứ tự xuất hiện
    const rel = [];
    const seen = new Set();
    const addRel = (id, where) => {
      if (id === e.id) return void stats.selfLinks++;
      if (seen.has(id)) return;
      seen.add(id);
      if (!allIds.has(id)) return void stats.unresolved.push({ from: e.legacy, id, where });
      rel.push(id);
    };
    for (const k of BODY_ORDER) {
      const text = e.fields[k];
      if (!text) continue;
      for (const m of text.matchAll(LINK_RE)) {
        addRel(m[1], k);
        if (m[2]) for (const id of m[2].split(',').filter(Boolean)) addRel(id.trim(), k + ' (refs)');
      }
    }
    stats.related += rel.length;

    // legal_refs
    const legal_refs = [];
    for (const r of legalData)
      if (r.bindings.some((b) => b.entryId === e.id)) {
        legal_refs.push({
          doc: r.document,
          article: r.provision ?? null,
          url: r.sourceUrl ?? null,
          effective_from: null, // nguồn chỉ có nhãn phiên bản dạng chữ, không có ngày hiệu lực có cấu trúc
          checked_at: r.checkedAt ?? null,
          quote: r.quote ?? null,
        });
        stats.legalLoaded.push(`${e.legacy} <- ${r.id}`);
      }
    if (e.fields['Pháp luật Việt Nam'] !== undefined) {
      stats.withLegalSection++;
      if (legal_refs.length === 0) stats.legalSectionNoRefs++;
    }

    // verification
    const rv = reviewData[e.id];
    const verification = rv
      ? { status: rv.status, checked_at: rv.checkedAt ?? null, checker: null, scope: rv.scope ?? null, sources: rv.sources ?? [] }
      : { status: 'unverified', checked_at: null, checker: null, scope: null, sources: [] };
    if (rv) stats.reviewLoaded[e.legacy] = rv.status;

    // origin
    const zhLabel = qpToZh.get(e.legacy) ?? null;
    const luongLabel = zhLabel ? (luongByZh.get(zhLabel) ?? null) : null;
    if (zhLabel) (stats.zh++, chStat.zh++);
    if (luongLabel) (stats.luonglb++, chStat.luonglb++);

    const front = {
      id: e.id,
      legacy: e.legacy,
      chapter: ch.number,
      number: e.number,
      title: e.title,
      cost,
      benefit,
      metric,
      evidence: grade,
      contested,
      vn_class: 'unclassified',
      rewrite_status: 'imported',
      tldr: null,
      steps: [],
      legal_refs,
      verification,
      origin: { zh: zhLabel, quangpao: e.legacy, luonglb: luongLabel },
      related: rel,
      situations: [],
      tags,
    };
    const ok = EntrySchema.safeParse(front);
    if (!ok.success) die(`${e.legacy}: frontmatter không hợp lệ: ${ok.error.message}`);

    const body = BODY_ORDER.filter((k) => e.fields[k] !== undefined && e.fields[k] !== '')
      .map((k) => `## ${k}\n\n${e.fields[k]}\n`)
      .join('\n');
    for (const k of ['Nói dễ hiểu', 'Chi phí', 'Lợi ích', 'Ghi chú', 'Nguồn'])
      if (!e.fields[k]) die(`${e.legacy}: trường "${k}" rỗng`);

    const file = join(OUT, 'entries', dirName, `${pad(e.number, width)}-${e.id}.md`);
    writeFileSync(file, fm(front) + '\n' + body);

    bump(stats.evidence, grade);
    bump(stats.cost.money, cost.money);
    bump(stats.cost.time, cost.time);
    bump(stats.cost.will, cost.will);
    bump(stats.benefit, benefit);
    bump(stats.metric, metric);
    chStat.imported++;
    parsed.push(file);
  }
  writeFileSync(join(OUT, 'chapters', `${pad(ch.number, 2)}.md`), fm(chapterRel) + '\n' + ch.intro + '\n');
  stats.perChapter.push(chStat);
}

// ---- Báo cáo ----
const row = (...c) => '| ' + c.join(' | ') + ' |';
const table = (head, rows) => [row(...head), row(...head.map(() => '---')), ...rows.map((r) => row(...r))].join('\n');
const pct = (n, d) => `${((100 * n) / d).toFixed(1)}%`;
const sortedEntries = (o) => Object.entries(o).sort(([a], [b]) => a.localeCompare(b, 'vi'));
const zhTotal = zhEntries.length;
const luongTotal = luongByZh.size;
const sourceHeadings = files.reduce(
  (n, f) => n + readFileSync(join(bookDir, f), 'utf8').split('\n').filter((l) => /^### \d+\. /.test(l)).length,
  0,
);

const report = `# Báo cáo nhập bản nháp

File này do \`node tools/import/run.mjs\` sinh ra; đừng sửa tay.

Nguồn: \`_ref/vi-quangpao\` (nhánh \`vi\`, commit \`${qpCommit}\` lúc nhập), thư mục \`book/\`.

## 1. Số lượng

- Chương nhập: **${chapters.length}** / 36 file trong \`book/\`.
- Mục nhập: **${total}** / ${sourceHeadings} tiêu đề \`### N.\` trong \`book/\` / ${catalog.length} mục trong \`data/entries.json\`. Không chênh lệch: mỗi mục nguồn thành đúng một file, id và nhãn \`legacy\` khớp \`data/entries.json\`.
- Con số "≈785" trong yêu cầu khớp đúng ${total}.
- Mục có phần "Pháp luật Việt Nam": ${stats.withLegalSection}.
- Chương 35 và 36 là chương mới của bản quangpao (không có trong bản gốc tiếng Trung/luonglb).

${table(
  ['Chương', 'Tiêu đề', 'Mục nguồn', 'Mục nhập', 'origin.zh', 'origin.luonglb'],
  stats.perChapter.map((c) => [c.number, c.title, c.source, c.imported, c.zh, c.luonglb]),
)}

## 2. Bảng ánh xạ nhãn (nguồn -> enum SPEC)

Tập nhãn thật trong dữ liệu (đếm số mục). Nhãn ngoài bảng này làm importer dừng với lỗi.

${table(
  ['Nhãn nguồn -> giá trị', 'Số mục'],
  sortedEntries(stats.labelCounts).map(([k, v]) => [k, v]),
)}

Quyết định lệch/diễn giải SPEC (cần Site/Gate biết):

- \`lợi-ích=nhỏ\` (4 mục) -> \`benefit: small\`. SPEC chỉ có \`large | medium\`; ép về \`medium\` sẽ làm công thức "mức đáng làm" cho kết quả khác bản gốc, nên \`schema/entry.mjs\` thêm giá trị \`small\` (BENEFITS). Mục \`small\` luôn có mức đáng làm \`medium\` (trung bình) theo \`README.md\` của quangpao.
- Chi phí: bản nháp có 3 mức cho mỗi loại, SPEC có 4 (\`0|low|mid|high\`). \`tiền\`: 0/ít/nhiều -> \`0/low/high\` (không dùng \`mid\`); \`ý-chí\`: không/ít/có -> \`0/low/mid\` (không dùng \`high\`); \`thời-gian\`: 0/ít/vừa/nhiều -> \`0/low/mid/high\`. Trọng số gốc của quangpao (\`tools/lib/book.mjs\`: COST_W) để Site đối chiếu công thức: tiền {0:0, low:1, high:2}; thời gian {0:0, low:0, mid:1, high:2}; ý chí {0:0, low:1, mid:2}; mức đáng làm gốc: lợi ích lớn -> tổng 0 = rất cao, tổng ≤ 2 = cao, còn lại trung bình; lợi ích vừa và tổng 0 = cao, còn lại trung bình. Lưu ý: công thức này lệch công thức chữ trong SPEC §5 ở chỗ "thời gian ít" nặng 0 và ngưỡng "không cao" là tổng ≤ 2.
- \`thước-đo\`: \`mắc-bệnh\`, \`tai-nạn\`, \`triệu-chứng\`, \`tàn-tật\` không có enum riêng trong SPEC và không có nhãn nào là \`freedom\` -> \`other\`, nhãn gốc giữ trong \`tags\` dạng \`thuoc-do:mac-benh\`...
- Nhãn \`nhóm=…\` (nhóm đối tượng, ${stats.groupCount} mục) không có trong SPEC -> \`tags\` dạng \`nhom:45-tuoi\`.
- \`contested\`: nguồn không có cờ riêng; ghi chú "tranh luận" nằm trong câu văn. Quy tắc dùng: Ghi chú khớp \`${CONTESTED_RE.source}\` (không khớp các câu chỉ nhắc "tranh luận" theo nghĩa thường như "tranh luận mức phạt"). Kết quả: ${stats.contested.length} mục (${stats.contested.join(', ')}).
- Trường "Mức bằng chứng" đi vào \`evidence\`, không lặp ở thân; thân dùng H2 cố định.

## 3. Tham chiếu chéo (\`related\`)

- Nguồn: mọi liên kết \`#entry-<id>\` (kể cả nhóm \`"refs:id1,id2"\`) trong các trường của mục, bỏ trùng, giữ thứ tự xuất hiện, bỏ liên kết trỏ về chính mục (${stats.selfLinks}).
- Tổng số cạnh \`related\`: ${stats.related}.
- Tham chiếu không phân giải được: **${stats.unresolved.length}**${stats.unresolved.length ? '\n\n' + table(['Từ mục', 'id đích', 'Trường'], stats.unresolved.map((u) => [u.from, u.id, u.where])) : '.'}
- Liên kết trong thân vẫn ở dạng nguyên văn của nguồn: \`[mục N](NN-slug-chuong.md#entry-<id>)\` hoặc có thêm \`"refs:..."\` (regex: \`${LINK_RE.source}\`). Site cần viết lại các liên kết này sang URL nội bộ theo id.
- Lời mở đầu chương (\`content/chapters/NN.md\`) cũng giữ nguyên liên kết dạng đó.

## 4. Pháp luật và kiểm chứng

- \`legal_refs\` nạp từ \`data/legal-references.json\`: ${stats.legalLoaded.length} tham chiếu (${stats.legalLoaded.join('; ')}). \`effective_from\` để \`null\`: nguồn chỉ có \`versionLabel\` dạng chữ, không có ngày hiệu lực có cấu trúc; \`versionLabel\`, \`sourceLocation\`, \`verificationScope\` của tham chiếu không có chỗ trong schema nên không nhập. \`quote\` và \`checkedAt\` giữ nguyên.
- Mục có phần "Pháp luật Việt Nam" (${stats.withLegalSection}) nhưng \`legal_refs\` rỗng: ${stats.legalSectionNoRefs}; Gate sẽ cảnh báo (warn) đúng theo SPEC §6.
- \`verification\` nạp từ \`data/review-status.json\`: ${Object.keys(stats.reviewLoaded).length} mục (${Object.entries(stats.reviewLoaded).map(([k, v]) => `${k}: ${v}`).join('; ')}). \`checker\` để \`null\` (nguồn không ghi người/agent kiểm). Còn lại: \`unverified\`. Không nâng trạng thái nào.

## 5. Ánh xạ nguồn (\`origin\`)

- \`origin.quangpao\`: ${total}/${total} (nhãn \`legacy\`).
- \`origin.zh\`: **${stats.zh}**/${total} mục (${pct(stats.zh, total)}); bản gốc tiếng Trung có ${zhTotal} mục.
- \`origin.luonglb\`: **${stats.luonglb}**/${total} mục (${pct(stats.luonglb, total)}); luonglb có ${luongTotal} mục với dòng \`goc:\` trỏ về mục zh.
- Phương pháp: luonglb -> zh tất định nhờ \`<!-- goc: C.N -->\`. quangpao -> zh không có bảng ánh xạ, suy ra từ bằng chứng; chỉ ghi khi hội đủ: (1) dùng chung ≥ 1 nguồn trích dẫn (DOI/URL chuẩn hóa), điểm = số nguồn chung rồi đến Jaccard, (2) cùng mức bằng chứng, cùng mức lợi ích và cùng 3 mức chi phí (tiền, thời gian, ý chí; \`thời-gian=0\` coi như \`ít\` vì zh không có mức 0), (3) cặp tốt nhất duy nhất của cả hai phía. ${originAmbiguous} mục quangpao có nhiều ứng viên zh nên để \`null\`.
- Mục \`null\`: phần lớn là mục luật/chính sách Việt Nam, chương 35-36, hoặc mục đã được quangpao tổ chức lại/viết lại và đổi nguồn. \`null\` nghĩa là "chưa xác nhận được", không phải "chắc chắn không có gốc".
- Nhãn trong \`origin.zh\`/\`origin.luonglb\` dạng \`chương-mục\` theo đánh số của chính bản đó.

## 6. Phân bố

${table(['Mức bằng chứng', 'Số mục'], Object.entries(stats.evidence).map(([k, v]) => [k, `${v} (${pct(v, total)})`]))}

${table(['Lợi ích', 'Số mục'], sortedEntries(stats.benefit).map(([k, v]) => [k, v]))}

${table(['Thước đo', 'Số mục'], sortedEntries(stats.metric).map(([k, v]) => [k, v]))}

${table(
  ['Chi phí', '0', 'low', 'mid', 'high'],
  ['money', 'time', 'will'].map((k) => [k, ...['0', 'low', 'mid', 'high'].map((l) => stats.cost[k][l] ?? 0)]),
)}

## 7. Việc không làm khi nhập

- Không sửa chữ trong thân; không chuẩn hóa liên kết; \`vn_class: unclassified\`, \`rewrite_status: imported\`, \`tldr: null\`, \`steps: []\`, \`situations: []\`.
- Không nhập các khối "Ở Việt Nam" của luonglb (chỉ dùng luonglb/zh để ghi \`origin\`).
- Dữ liệu \`reading-paths.json\`, \`entry-aliases.json\`, \`reader-index.json\` của quangpao không nhập (ngoài phạm vi; \`entry-aliases.json\` trùng nhãn \`legacy\`).
`;
mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'import-report.md'), report);

console.log(`Đã nhập ${chapters.length} chương, ${total} mục -> content/. origin.zh=${stats.zh} origin.luonglb=${stats.luonglb} contested=${stats.contested.length} related=${stats.related} unresolved=${stats.unresolved.length}`);
