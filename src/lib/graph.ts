// Dữ liệu bản đồ tri thức (graph.json) dựng lúc build từ nội dung thật; dùng chung cho trang chủ (số liệu) và endpoint.
import { layoutGraph } from '../../tools/graph/layout.mjs';
import {
  loadAll, loadStatus, chapterGroups, SITUATIONS, STATUS_ORDER, COST_LABELS, EVIDENCE_LABELS, WORTH_LABELS, VERIFICATION_LABELS,
  worthOf, verifiedCount, reviewCount,
} from './site';

const LEVELS = ['0', 'low', 'mid', 'high'] as const;
const WORTH = ['medium', 'high', 'very-high'] as const;

/** Bỏ đánh dấu markdown, lấy đoạn đầu của lời mở chương làm mô tả ngắn. */
function plainLead(md: string, max = 170): string {
  const first = md.trim().split(/\n\s*\n/)[0] ?? '';
  const t = first.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`>#]/g, '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\s]+$/, '') + '…';
}

let cache: ReturnType<typeof build> | null = null;
export async function graphData() {
  return (cache ??= await build());
}

async function build() {
  const { chapters, entries } = await loadAll();
  const groups = chapterGroups(chapters.map((c) => c.data.number));
  const sits = SITUATIONS.filter((s) => entries.some((e) => e.data.situations.includes(s.slug)));
  const status = loadStatus(entries);
  const groupIdx = new Map<number, number>();
  groups.forEach((g, gi) => g.chapters.forEach((n) => groupIdx.set(n, gi)));

  const lay = layoutGraph({
    groups: groups.map((g) => ({ slug: g.slug, chapters: g.chapters })),
    chapters: chapters.map((c) => ({ n: c.data.number })),
    entries: entries.map((e) => ({ id: e.data.id, ch: e.data.chapter, related: e.data.related, sits: e.data.situations })),
    sits,
  });

  const idx = new Map(entries.map((e, i) => [e.data.id, i]));
  const chIdx = new Map(chapters.map((c, i) => [c.data.number, i]));
  const sitIdx = new Map(sits.map((s, i) => [s.slug, i]));

  const e = entries.map((x) => {
    const d = x.data;
    const p = lay.entryPos.get(d.id)!;
    const flags = STATUS_ORDER.indexOf(d.verification.status) | (d.rewrite_status === 'rewritten' ? 8 : 0) | (WORTH.indexOf(worthOf(d)) << 4);
    const cost = LEVELS.indexOf(d.cost.money) * 16 + LEVELS.indexOf(d.cost.time) * 4 + LEVELS.indexOf(d.cost.will) + (['A', 'B', 'C'].indexOf(d.evidence) << 6);
    return [d.id, d.title, chIdx.get(d.chapter)!, d.number, p.x, p.y, flags, cost];
  });

  const relSet = new Set<string>();
  const r: [number, number][] = [];
  for (const x of entries) {
    for (const rid of x.data.related) {
      const a = idx.get(x.data.id)!, b = idx.get(rid);
      if (b === undefined || a === b) continue;
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      if (!relSet.has(key)) { relSet.add(key); r.push(a < b ? [a, b] : [b, a]); }
    }
  }

  const s = sits.map((x) => {
    const p = lay.sitPos.get(x.slug)!;
    return { s: x.slug, t: x.title, x: p.x, y: p.y, e: entries.flatMap((en, i) => (en.data.situations.includes(x.slug) ? [i] : [])) };
  });
  const sitLinks = s.reduce((n, x) => n + x.e.length, 0);

  const c = chapters.map((ch) => {
    const p = lay.chapterPos.get(ch.data.number)!;
    return { n: ch.data.number, t: ch.data.title, d: plainLead(ch.body ?? ''), g: groupIdx.get(ch.data.number) ?? 0, x: p.x, y: p.y, r: p.r };
  });

  const stats = {
    entries: entries.length,
    chapters: chapters.length,
    groups: groups.length,
    situations: s.length,
    verified: verifiedCount(status.totals),
    review: reviewCount(status.totals),
    expert: status.totals.by_status['expert-reviewed'] ?? 0,
    links: r.length + sitLinks,
    quick: entries.filter((x) => worthOf(x.data) === 'very-high').length,
  };

  const json = {
    v: 1,
    g: groups.map((g) => ({ s: g.slug, t: g.title, d: g.description, i: g.icon, k: g.tone, c: g.chapters.map((n) => chIdx.get(n)!) })),
    c, s, e, r,
    // Nhãn dùng để vẽ bảng thông tin trên trình duyệt (cùng nguồn với trang tĩnh).
    L: {
      money: LEVELS.map((l) => COST_LABELS.money[l]),
      time: LEVELS.map((l) => COST_LABELS.time[l]),
      will: LEVELS.map((l) => COST_LABELS.will[l]),
      status: STATUS_ORDER.map((k) => VERIFICATION_LABELS[k]),
      ev: (['A', 'B', 'C'] as const).map((k) => EVIDENCE_LABELS[k]),
      worth: WORTH.map((k) => WORTH_LABELS[k]),
    },
    st: stats,
    b: lay.bounds,
  };
  return { json, stats, groups, sits: s.map((x) => ({ slug: x.s, title: x.t, n: x.e.length })) };
}
