// Ánh xạ nguồn: quangpao -> zh (gốc) -> luonglb. Chỉ ghi khi CHẮC CHẮN; còn lại null.
//
// luonglb -> zh: tất định, nhờ dòng `<!-- goc: C.N -->` trong từng mục luonglb.
// quangpao -> zh: không có bảng ánh xạ trong repo nên suy ra từ bằng chứng, cần đủ TẤT CẢ:
//   1. hai mục dùng chung >= 1 nguồn trích dẫn (DOI / URL đã chuẩn hóa); điểm = số nguồn chung, hòa thì xét Jaccard;
//   2. cùng mức bằng chứng (A/B/C), cùng mức lợi ích và cùng 3 mức chi phí (tiền/thời gian/ý chí);
//   3. cặp đó là "tốt nhất duy nhất" của cả hai phía (không hòa điểm, không mục nào có 2 ứng viên).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const URL_RE = /https?:\/\/[^\s)>\];,"“”]+/g;
const DOI_RE = /\b10\.\d{4,9}\/[^\s)>\];,"“”]+/g;

export function normalizeKey(raw) {
  let s = raw.trim().replace(/[.,;:)\]>]+$/, '').toLowerCase();
  const doi = s.match(/10\.\d{4,9}\/.+/);
  if (doi) return 'doi:' + doi[0];
  s = s.replace(/^https?:\/\/(www\.)?/, '').replace(/#.*$/, '').replace(/\/+$/, '');
  return s;
}

export function sourceKeys(text) {
  const keys = new Set();
  for (const m of text.matchAll(URL_RE)) keys.add(normalizeKey(m[0]));
  for (const m of text.matchAll(DOI_RE)) keys.add(normalizeKey(m[0]));
  return keys;
}

const ZH_GRADE_LINE = /^- 证据等级[：:]\s*(.*)$/;
const ZH_SRC_LINE = /^- 来源[：:]\s*(.*)$/;
// nhãn chi phí tiếng Việt của quangpao -> nhãn tiếng Trung của zh (cùng thang 3 mức)
export const ZH_COST = {
  money: { '0': '0', 'ít': '少', 'nhiều': '多' },
  time: { 'ít': '少', 'vừa': '中', 'nhiều': '多', '0': '少' },
  will: { 'không': '否', 'ít': '些', 'có': '是' },
};
const ZH_BENEFIT = { 大: 'large', 中: 'medium', 小: 'small' };

export function readZh(dir) {
  const out = [];
  for (const f of readdirSync(dir).filter((x) => /^\d\d-.*\.md$/.test(x)).sort()) {
    const ch = Number(f.slice(0, 2));
    let cur = null;
    for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
      const h = line.match(/^### (\d+)\. /);
      if (h) {
        cur = { label: `${ch}-${h[1]}`, grade: null, benefit: null, cost: null, src: '' };
        out.push(cur);
      } else if (cur) {
        if (line.startsWith('<!--')) {
          const tag = line.match(/收益=(\S+)/);
          if (tag) cur.benefit = ZH_BENEFIT[tag[1]] ?? `?${tag[1]}`;
          const c = [line.match(/钱=(\S+)/), line.match(/时间=(\S+)/), line.match(/毅力=(\S+)/)];
          cur.cost = c.map((m) => (m ? m[1] : '?')).join('|');
        }
        const g = line.match(ZH_GRADE_LINE);
        if (g) cur.grade = g[1].trim();
        const s = line.match(ZH_SRC_LINE);
        if (s) cur.src = s[1];
      }
    }
  }
  for (const e of out) e.keys = sourceKeys(e.src);
  return out;
}

// luonglb: trả về Map zhLabel -> luonglbLabel
export function readLuonglbByZh(dir) {
  const map = new Map();
  for (const f of readdirSync(dir).filter((x) => /^\d\d-.*\.md$/.test(x)).sort()) {
    const ch = Number(f.slice(0, 2));
    let n = null;
    for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
      const h = line.match(/^### (\d+)\. /);
      if (h) n = Number(h[1]);
      const g = line.match(/^<!-- goc: (\d+)\.(\d+)\b/);
      if (g && n !== null) {
        const zh = `${g[1]}-${g[2]}`;
        if (map.has(zh)) throw new Error(`luonglb: hai mục cùng goc ${zh}`);
        map.set(zh, `${ch}-${n}`);
      }
    }
  }
  return map;
}

// qp: [{label, keys:Set, grade, benefit, cost}] (cost = 'money|time|will' đã dịch sang nhãn zh); zh: như readZh. Trả về Map qpLabel -> zhLabel
export function matchQuangpaoToZh(qp, zh) {
  // điểm = số nguồn chung (chính), Jaccard (phụ) -> số thực: chung + Jaccard (< 1)
  const jac = (a, b) => {
    let i = 0;
    for (const k of a) if (b.has(k)) i++;
    return i === 0 ? 0 : i + i / (a.size + b.size - i) / 2;
  };
  const MIN = 1;
  const top = (list) => {
    // ứng viên tốt nhất, chỉ khi duy nhất (điểm cao nhất không hòa)
    const s = list.filter((x) => x.score >= MIN).sort((a, b) => b.score - a.score);
    if (s.length === 0) return null;
    if (s.length > 1 && s[1].score === s[0].score) return { ambiguous: true };
    return s[0];
  };
  const byQ = new Map();
  const byZ = new Map();
  for (const q of qp) {
    if (q.keys.size === 0) continue;
    for (const z of zh) {
      const score = jac(q.keys, z.keys);
      if (score === 0) continue;
      if (!byQ.has(q.label)) byQ.set(q.label, []);
      byQ.get(q.label).push({ id: z.label, score, z });
      if (!byZ.has(z.label)) byZ.set(z.label, []);
      byZ.get(z.label).push({ id: q.label, score, q });
    }
  }
  const result = new Map();
  let ambiguous = 0;
  for (const q of qp) {
    const b = top(byQ.get(q.label) ?? []);
    if (!b) continue;
    if (b.ambiguous) {
      ambiguous++;
      continue;
    }
    const back = top(byZ.get(b.id) ?? []);
    if (!back || back.ambiguous || back.id !== q.label) continue; // phải là tốt nhất của cả hai phía
    if (b.z.grade !== q.grade || b.z.benefit !== q.benefit || b.z.cost !== q.cost) continue; // bằng chứng, lợi ích, 3 mức chi phí phải khớp
    result.set(q.label, b.id);
  }
  return { map: result, ambiguous };
}
