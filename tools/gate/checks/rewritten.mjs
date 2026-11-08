import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { issue } from '../lib/result.mjs';
import { extractNumbers } from '../lib/numbers.mjs';
import { ROOT } from '../lib/paths.mjs';

export const name = 'rewritten';
export const description = 'Mục rewritten: tldr/steps, độ dài đoạn, "Pháp luật Việt Nam" dạng gạch + trích dẫn, legal_refs, vn_class, situations, số trong tldr/steps có trong thân';

const LEGAL_H2 = 'Pháp luật Việt Nam';
const SOURCE_H2 = 'Nguồn';
const URL_RE = /https?:\/\/\S+/giu;
const URL_ONLY_LINE = /^\s*(?:(?:[-*+]|\d+[.)])\s+)?<?https?:\/\/\S+>?\s*$/iu;
const LIST_ITEM = /^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/u;
// Trích dẫn cuối dòng: "(…)" có thể chứa một cấp ngoặc lồng, cho phép dấu câu sau ngoặc.
const TRAILING_CITE = /\(((?:[^()]|\([^()]*\))*)\)\s*[.;:,]?\s*$/u;
const DOC_NAME = /Điều|\d+\/\d{4}\/|\d+\/[\p{Lu}Đ][\p{L}\d-]*|Bộ luật|Luật|Nghị định|Thông tư|Nghị quyết|Quyết định|Pháp lệnh|Hiến pháp|BLLĐ|BLHS|BLDS|BLTTHS|BLTTDS|\bNĐ\b|\bTT\b|\bQĐ\b/u;

let situationCache = null;
function loadSituations(ctx) {
  if (ctx.situations) return new Set(ctx.situations);
  if (!situationCache) {
    const raw = JSON.parse(readFileSync(join(ROOT, 'data/situations.json'), 'utf8'));
    situationCache = new Set(raw.situations.map((s) => s.slug));
  }
  return situationCache;
}

export function countWords(text) {
  return text
    .replace(URL_RE, ' ')
    .split(/\s+/u)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

// Tách một đoạn văn bản thành các "đoạn": mỗi gạch đầu dòng là một đoạn riêng; dòng tiếp nối gộp vào đoạn trước.
export function splitParagraphs(text) {
  const out = [];
  let cur = null;
  let fenced = false;
  const flush = () => {
    if (cur) out.push(cur);
    cur = null;
  };
  text.split('\n').forEach((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      flush();
      return;
    }
    if (fenced) return;
    if (line.trim() === '' || /^\s*#{1,6}\s/.test(line) || URL_ONLY_LINE.test(line)) return flush();
    const li = line.match(LIST_ITEM);
    if (li) {
      flush();
      cur = { text: li[2], list: true };
    } else if (cur) {
      cur.text += ' ' + line.trim();
    } else {
      cur = { text: line.trim(), list: false };
    }
  });
  flush();
  return out;
}

function bodyWithoutSource(e) {
  return e.sections
    .filter((s) => s.title !== SOURCE_H2)
    .map((s) => s.text)
    .join('\n\n');
}

function checkFrontmatter(e, cfg, ctx, out) {
  const d = e.data;
  const err = (m) => out.push(issue('error', name, e, m));
  const chars = (s) => [...s].length;

  if (typeof d.tldr !== 'string' || d.tldr.trim() === '') err('tldr rỗng (mục rewritten bắt buộc có tldr)');
  else if (chars(d.tldr) > cfg.tldrMaxChars) err(`tldr dài ${chars(d.tldr)} ký tự (tối đa ${cfg.tldrMaxChars})`);

  const steps = Array.isArray(d.steps) ? d.steps : [];
  if (steps.length !== 0 && (steps.length < cfg.stepsMin || steps.length > cfg.stepsMax)) {
    err(`steps có ${steps.length} phần tử (phải là 0 hoặc ${cfg.stepsMin}-${cfg.stepsMax})`);
  }
  steps.forEach((s, i) => {
    if (typeof s !== 'string' || s.trim() === '') err(`steps[${i + 1}] rỗng`);
    else if (chars(s) > cfg.stepMaxChars) err(`steps[${i + 1}] dài ${chars(s)} ký tự (tối đa ${cfg.stepMaxChars})`);
  });

  if (d.vn_class === 'unclassified') err('vn_class còn "unclassified" (mục rewritten phải chọn universal/adapted/vn_native)');

  const slugs = loadSituations(ctx);
  for (const s of Array.isArray(d.situations) ? d.situations : []) {
    if (!slugs.has(s)) err(`situations: "${s}" không có trong data/situations.json`);
  }
}

function checkNumbers(e, out) {
  const d = e.data;
  const bodyVals = new Set();
  for (const n of extractNumbers(e.body)) n.values.forEach((v) => bodyVals.add(v));
  const texts = [];
  if (typeof d.tldr === 'string') texts.push(['tldr', d.tldr]);
  (Array.isArray(d.steps) ? d.steps : []).forEach((s, i) => typeof s === 'string' && texts.push([`steps[${i + 1}]`, s]));
  const reported = new Set();
  for (const [where, text] of texts) {
    for (const n of extractNumbers(text)) {
      if (n.plainInt && n.tok.length > 1 && n.tok.startsWith('0')) continue; // mã/điện thoại
      if (n.values.some((v) => bodyVals.has(v))) continue;
      const key = where + '|' + n.raw;
      if (reported.has(key)) continue;
      reported.add(key);
      out.push(issue('error', name, e, `Số "${n.raw}" trong ${where} không xuất hiện trong thân`));
    }
  }
}

function checkParagraphs(e, cfg, out) {
  for (const p of splitParagraphs(bodyWithoutSource(e))) {
    const w = countWords(p.text);
    const preview = p.text.slice(0, 50).replace(/\s+/g, ' ');
    if (w > cfg.paragraphErrorWords) out.push(issue('error', name, e, `Đoạn dài ${w} chữ (> ${cfg.paragraphErrorWords}): "${preview}…"`));
    else if (w > cfg.paragraphWarnWords) out.push(issue('warn', name, e, `Đoạn dài ${w} chữ (> ${cfg.paragraphWarnWords}): "${preview}…"`));
  }
}

function checkLegal(e, cfg, out) {
  const d = e.data;
  const sec = e.sections.find((s) => s.title === LEGAL_H2);
  const refs = Array.isArray(d.legal_refs) ? d.legal_refs : [];
  if (sec && refs.length === 0) out.push(issue('error', name, e, `Có H2 "${LEGAL_H2}" nhưng legal_refs rỗng`));
  if (!sec && refs.length > 0) out.push(issue('warn', name, e, `legal_refs không rỗng nhưng không có H2 "${LEGAL_H2}"`));
  refs.forEach((r, i) => {
    if (r?.url == null) {
      out.push(issue('warn', name, e, `legal_refs[${i + 1}] chưa có URL nguồn (url null)`));
      return;
    }
    let ok = false;
    try {
      const u = new URL(r?.url);
      ok = u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      /* không hợp lệ */
    }
    if (!ok) out.push(issue('error', name, e, `legal_refs[${i + 1}].url không phải URL http(s) hợp lệ: ${r?.url}`));
  });
  if (!sec) return;

  const lines = sec.text.split('\n');
  let fenced = false;
  let cur = null;
  let np = null; // đoạn không phải gạch đang gom
  const items = [];
  const paras = [];
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (line.trim() === '') {
      cur = null;
      np = null;
      continue;
    }
    const li = !fenced && line.match(LIST_ITEM);
    if (li) {
      np = null;
      cur = { text: li[2] };
      items.push(cur);
    } else if (cur) {
      cur.text += ' ' + line.trim(); // dòng tiếp nối của gạch
    } else if (/^\s*#{3,6}\s/.test(line)) {
      np = null;
    } else if (np) {
      np.text += ' ' + line.trim();
    } else {
      np = { text: line.trim() };
      paras.push(np);
    }
  }
  // Đoạn không phải gạch: nhóm in đậm ngắn và câu dẫn/kết ngắn được phép.
  for (const p of paras) {
    const w = countWords(p.text);
    const preview = p.text.slice(0, 50);
    if (p.text.startsWith('**') && w <= cfg.legalGroupMaxWords) continue;
    if (w <= cfg.legalLeadMaxWords) continue;
    if (w > cfg.legalParaErrorWords) out.push(issue('error', name, e, `"${LEGAL_H2}" phải là danh sách gạch đầu dòng; đoạn văn dài ${w} chữ (> ${cfg.legalParaErrorWords}): "${preview}…"`));
    else out.push(issue('warn', name, e, `"${LEGAL_H2}": đoạn văn không phải gạch dài ${w} chữ (> ${cfg.legalLeadMaxWords}), nên tách thành gạch: "${preview}…"`));
  }
  for (const it of items) {
    const w = countWords(it.text);
    const preview = it.text.slice(0, 50);
    if (w > cfg.legalBulletErrorWords) out.push(issue('error', name, e, `Gạch pháp luật dài ${w} chữ (> ${cfg.legalBulletErrorWords}): "${preview}…"`));
    else if (w > cfg.legalBulletWarnWords) out.push(issue('warn', name, e, `Gạch pháp luật dài ${w} chữ (> ${cfg.legalBulletWarnWords}): "${preview}…"`));
    const m = it.text.match(TRAILING_CITE);
    if (!m || !DOC_NAME.test(m[1])) {
      out.push(issue('warn', name, e, `Gạch pháp luật thiếu trích dẫn cuối dòng "(Điều …, tên văn bản)": "${preview}…"`));
    }
  }
}

export function run(ctx) {
  const out = [];
  const cfg = ctx.config.rewritten;
  for (const e of ctx.entries) {
    if (!e.data || e.data.rewrite_status !== 'rewritten') continue;
    checkFrontmatter(e, cfg, ctx, out);
    checkNumbers(e, out);
    checkParagraphs(e, cfg, out);
    checkLegal(e, cfg, out);
  }
  return out;
}
