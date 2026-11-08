import { entryChapter } from './load.mjs';

const inc = (obj, k) => {
  obj[k] = (obj[k] ?? 0) + 1;
};
const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

/**
 * Định dạng data/status.json (ổn định, Site đọc):
 * {
 *   generated_at: ISO,
 *   total: number,
 *   totals: { by_status, by_vn_class, by_rewrite_status },        // { giá_trị: số mục }
 *   chapters: { "<số chương>": { total, by_status, by_vn_class, by_rewrite_status } },
 *   cells: [ { chapter, status, vn_class, rewrite_status, count } ] // ma trận đầy đủ, sắp xếp ổn định
 * }
 * Mục có frontmatter hỏng được tính vào giá trị "unknown".
 */
export function buildStatus(entries, now = new Date()) {
  const mk = () => ({ by_status: {}, by_vn_class: {}, by_rewrite_status: {} });
  const totals = mk();
  const chapters = {};
  const cellMap = new Map();
  for (const e of entries) {
    const d = e.data ?? {};
    const ch = entryChapter(e) ?? 'unknown';
    const status = d.verification?.status ?? 'unknown';
    const cls = d.vn_class ?? 'unknown';
    const rw = d.rewrite_status ?? 'unknown';
    chapters[ch] ??= { total: 0, ...mk() };
    chapters[ch].total++;
    for (const t of [totals, chapters[ch]]) {
      inc(t.by_status, status);
      inc(t.by_vn_class, cls);
      inc(t.by_rewrite_status, rw);
    }
    const k = JSON.stringify([ch, status, cls, rw]);
    cellMap.set(k, (cellMap.get(k) ?? 0) + 1);
  }
  const chapterKeys = Object.keys(chapters).sort((a, b) => (Number(a) || 1e9) - (Number(b) || 1e9));
  return {
    generated_at: now.toISOString(),
    total: entries.length,
    totals: { by_status: sortObj(totals.by_status), by_vn_class: sortObj(totals.by_vn_class), by_rewrite_status: sortObj(totals.by_rewrite_status) },
    chapters: Object.fromEntries(
      chapterKeys.map((k) => [k, { total: chapters[k].total, by_status: sortObj(chapters[k].by_status), by_vn_class: sortObj(chapters[k].by_vn_class), by_rewrite_status: sortObj(chapters[k].by_rewrite_status) }]),
    ),
    cells: [...cellMap.entries()]
      .map(([k, count]) => {
        const [chapter, status, vn_class, rewrite_status] = JSON.parse(k);
        return { chapter, status, vn_class, rewrite_status, count };
      })
      .sort((a, b) => (Number(a.chapter) || 1e9) - (Number(b.chapter) || 1e9) || a.status.localeCompare(b.status) || a.vn_class.localeCompare(b.vn_class) || a.rewrite_status.localeCompare(b.rewrite_status)),
  };
}
