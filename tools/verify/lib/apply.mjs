import { writeFile } from 'node:fs/promises';
import { Document, parseDocument, parse as parseYaml } from 'yaml';
import { entryHash } from './hash.mjs';
import { lintReport } from '../lint-report.mjs';
import { entryChapter } from '../../gate/lib/load.mjs';

// Thứ hạng để không bao giờ hạ cấp vô cớ. needs-* ngang hàng consistency-checked (đều chưa đạt source-checked).
const RANK = { unverified: 0, 'consistency-checked': 1, 'needs-legal-review': 1, 'needs-medical-review': 1, 'source-checked': 2, 'cross-checked': 3, 'expert-reviewed': 4 };
const MEDICAL_CHAPTERS = new Set([13, 16, 20, 24, 27, 34]); // EDITORIAL §4: cấp cứu, y tế/thuốc, thai sản/trẻ sơ sinh
const MEDICAL_DOC = /\b(?:AHA|ERC|WHO|CDC|NHS|BYT)\b|Bộ Y tế/u;

const arr = (v) => (Array.isArray(v) ? v : []);

export function reviewKind(entry, report) {
  const ch = entryChapter(entry);
  if (MEDICAL_CHAPTERS.has(ch)) return 'needs-medical-review';
  if (MEDICAL_DOC.test(String(report.validity?.doc ?? ''))) return 'needs-medical-review';
  return 'needs-legal-review';
}

/** Phân loại một báo cáo đã lint sạch + hash khớp: 'good' | 'bad' | 'neutral' (+ lý do). */
export function classifyReport(r) {
  const claims = arr(r.claims);
  const nonMatch = claims.filter((c) => c.verdict !== 'match');
  const internalErr = arr(r.internal_checks).filter((c) => c.severity === 'error');
  const harm = arr(r.potential_harm);
  if (r.result === 'fail' || harm.length > 0) {
    const why = [];
    if (r.result === 'fail') why.push('result=fail');
    if (harm.length) why.push(`${harm.length} mục potential_harm`);
    return { kind: 'bad', reasons: why };
  }
  const why = [];
  if (r.result !== 'pass') why.push(`result=${r.result} (sửa mục theo suggested_edits rồi kiểm lại)`);
  if (nonMatch.length) {
    const counts = {};
    for (const c of nonMatch) counts[c.verdict] = (counts[c.verdict] ?? 0) + 1;
    why.push(`khẳng định không phải match: ${Object.entries(counts).map(([k, v]) => `${k}×${v}`).join(', ')}`);
  }
  if (r.validity?.in_force !== true) why.push(`validity.in_force=${r.validity?.in_force}`);
  if (internalErr.length) why.push(`${internalErr.length} internal_checks mức error`);
  return why.length ? { kind: 'neutral', reasons: why } : { kind: 'good', reasons: [] };
}

function uniq(list) {
  return [...new Set(list)];
}

function buildVerification(kind, reports, entry, current) {
  const checkedAt = reports.map((x) => x.data.checked_at).sort().at(-1);
  const checker = uniq(reports.map((x) => x.data.checker)).join(' + ');
  const files = reports.map((x) => x.file).join('; ');
  if (kind === 'source-checked' || kind === 'cross-checked') {
    const n = reports[0].data.claims.length;
    return {
      status: kind,
      checked_at: checkedAt,
      checker,
      scope: kind === 'cross-checked' ? `Kiểm chéo bởi ${reports.length} người kiểm độc lập: mọi khẳng định khớp nguyên văn nguồn, văn bản còn hiệu lực (${files})` : `Đối chiếu nguồn: ${n}/${n} khẳng định khớp nguyên văn, văn bản còn hiệu lực (${files})`,
      sources: uniq(reports.flatMap((x) => x.data.claims.map((c) => c.source_url))),
    };
  }
  const r = reports[0];
  const cls = classifyReport(r.data);
  return {
    status: kind,
    checked_at: r.data.checked_at,
    checker: r.data.checker,
    scope: `Chặn nâng trạng thái: ${cls.reasons.join(', ')} (${r.file})`,
    sources: current.sources ?? [],
  };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const FIELDS = ['status', 'checked_at', 'checker', 'scope', 'sources'];

/**
 * Lập kế hoạch (không ghi). Trả { changes, skipped, kept }:
 *  changes: [{ id, file, from, to, verification, reports, reason }]
 *  skipped: [{ file, id, reasons[] }]  báo cáo bị từ chối/không có tác dụng
 *  kept:    [{ id, file, status, reason }] mục có báo cáo hợp lệ nhưng giữ nguyên trạng thái
 */
export function planApply({ entries, reports, allowImported = false }) {
  const entriesById = new Map(entries.filter((e) => e.data?.id).map((e) => [e.data.id, e]));
  const skipped = [];
  const valid = new Map(); // id → [{file, data, cls}]
  for (const rep of reports) {
    const issues = lintReport(rep, { entriesById });
    const errors = issues.filter((i) => i.level === 'error').map((i) => i.message);
    const data = rep.data;
    const id = data?.id ?? null;
    const entry = id ? entriesById.get(id) : null;
    if (errors.length) {
      const reasons = [...errors];
      if (data && Array.isArray(data.claims)) {
        const cls = classifyReport(data);
        if (cls.kind !== 'good') reasons.push(...cls.reasons.map((r) => `(tham khảo) ${r}`));
      }
      skipped.push({ file: rep.file, id, reasons: ['không nâng: báo cáo không hợp lệ', ...reasons] });
      continue;
    }
    let hash;
    try {
      hash = entryHash(entry.raw);
    } catch (e) {
      skipped.push({ file: rep.file, id, reasons: [`không băm được mục: ${e.message}`] });
      continue;
    }
    if (hash !== data.content_sha256) {
      skipped.push({ file: rep.file, id, reasons: [`báo cáo lạc hậu: content_sha256 ${data.content_sha256.slice(0, 12)}… ≠ hash hiện tại ${hash.slice(0, 12)}… (mục đã sửa sau khi kiểm); kiểm lại và ghi hash mới`] });
      continue;
    }
    if (entry.data.rewrite_status !== 'rewritten' && !allowImported) {
      skipped.push({ file: rep.file, id, reasons: [`mục chưa rewritten (rewrite_status=${entry.data.rewrite_status}); dùng --allow-imported nếu cố ý`] });
      continue;
    }
    if (!valid.has(id)) valid.set(id, []);
    valid.get(id).push({ file: rep.file, data, cls: classifyReport(data) });
  }

  const changes = [];
  const kept = [];
  for (const [id, list] of valid) {
    const entry = entriesById.get(id);
    const cur = entry.data.verification ?? {};
    // Mỗi người kiểm chỉ tính báo cáo mới nhất.
    const latest = new Map();
    for (const r of list) {
      const prev = latest.get(r.data.checker);
      if (!prev || r.data.checked_at >= prev.data.checked_at) latest.set(r.data.checker, r);
    }
    const use = [...latest.values()];
    const bad = use.filter((r) => r.cls.kind === 'bad');
    const good = use.filter((r) => r.cls.kind === 'good');
    let target = null;
    let chosen = [];
    let reason = '';
    if (bad.length) {
      target = reviewKind(entry, bad[0].data);
      chosen = [bad[0]];
      reason = bad[0].cls.reasons.join(', ');
    } else if (good.length >= 2) {
      target = 'cross-checked';
      chosen = good;
      reason = `${good.length} báo cáo pass của ${good.length} người kiểm khác nhau, cùng hash`;
    } else if (good.length === 1) {
      target = 'source-checked';
      chosen = good;
      reason = '1 báo cáo pass: mọi khẳng định match, in_force=true, không internal error, không potential_harm';
    } else {
      kept.push({ id, file: entry.file, status: cur.status, reason: use.flatMap((r) => r.cls.reasons.map((x) => `${r.file}: ${x}`)).join(' | ') });
      continue;
    }
    if (cur.status === 'expert-reviewed') {
      kept.push({ id, file: entry.file, status: cur.status, reason: 'expert-reviewed do người thật xác nhận, không đụng' });
      continue;
    }
    const goingUp = target === 'source-checked' || target === 'cross-checked';
    if (goingUp && (RANK[cur.status] ?? 0) >= RANK[target]) {
      kept.push({ id, file: entry.file, status: cur.status, reason: `đã ở ${cur.status} ≥ ${target}` });
      continue;
    }
    const verification = buildVerification(target, chosen, entry, cur);
    if (FIELDS.every((k) => same(verification[k], cur[k] ?? null))) {
      kept.push({ id, file: entry.file, status: cur.status, reason: 'đã áp dụng (không thay đổi)' });
      continue;
    }
    changes.push({ id, file: entry.file, abs: entry.abs, from: cur.status ?? 'unknown', to: target, verification, reports: chosen.map((r) => r.file), reason });
  }
  return { changes, skipped, kept };
}

/**
 * Thay riêng khối `verification` trong frontmatter, giữ nguyên mọi byte khác.
 * Trả chuỗi mới; ném lỗi (không ghi) nếu không bảo toàn được phần còn lại.
 */
export function replaceVerification(raw, verification) {
  if (raw.includes('\r')) throw new Error('File dùng CRLF/CR: không ghi tự động để tránh đổi byte');
  const m = raw.match(/^(---\n)([\s\S]*?)(\n---[ \t]*(?:\n|$))/);
  if (!m) throw new Error('Không thấy frontmatter ở đầu file (BOM hoặc thiếu ---)');
  const fmText = m[2];
  const doc = parseDocument(fmText);
  if (doc.errors.length) throw new Error(`YAML lỗi: ${doc.errors[0].message}`);
  const pair = doc.contents.items.find((p) => p.key?.value === 'verification');
  if (!pair || !pair.value) throw new Error('Không thấy khối verification');
  const oldVal = pair.value.toJSON();
  const merged = {};
  for (const k of FIELDS) merged[k] = verification[k];
  for (const k of Object.keys(oldVal ?? {})) if (!(k in merged)) merged[k] = oldVal[k];
  // Chỉ thay phần GIÁ TRỊ (giữ nguyên khóa `verification:` và chú thích cùng dòng với khóa).
  const start = pair.value.range[0];
  let end = pair.value.range[1];
  while (end > start && fmText[end - 1] === '\n') end--;
  const flow = Boolean(pair.value.flow);
  let text;
  if (flow) text = JSON.stringify(merged);
  else {
    const indent = ' '.repeat(start - (fmText.lastIndexOf('\n', start - 1) + 1));
    const vdoc = new Document(merged);
    const ca = vdoc.get('checked_at', true); // ngày luôn có nháy: parser khác có thể đọc 2026-11-08 thành Date
    if (ca && typeof ca.value === 'string') ca.type = 'QUOTE_DOUBLE';
    text = vdoc.toString({ indent: 2, lineWidth: 0 }).replace(/\n$/, '').split('\n').map((l, i) => (i === 0 ? l : indent + l)).join('\n');
  }
  const newFm = fmText.slice(0, start) + text + fmText.slice(end);
  const out = m[1] + newFm + raw.slice(m[1].length + fmText.length);
  // Kiểm: mọi thứ ngoài verification giữ nguyên, verification đúng như dự định.
  const before = parseYaml(fmText);
  const after = parseYaml(newFm);
  const { verification: _a, ...restBefore } = before;
  const { verification: vAfter, ...restAfter } = after;
  if (!same(restBefore, restAfter) || !same(vAfter, merged) || Object.keys(before).join() !== Object.keys(after).join()) {
    throw new Error('Kiểm tra sau ghi thất bại (phần ngoài verification bị đổi): hủy');
  }
  if (!out.startsWith(m[1] + fmText.slice(0, start)) || !out.endsWith(fmText.slice(end) + raw.slice(m[1].length + fmText.length))) {
    throw new Error('Kiểm tra bảo toàn byte thất bại: hủy');
  }
  return out;
}

export async function writeChanges(changes, readRaw) {
  const written = [];
  for (const c of changes) {
    const raw = await readRaw(c.abs);
    await writeFile(c.abs, replaceVerification(raw, c.verification));
    written.push(c.file);
  }
  return written;
}
