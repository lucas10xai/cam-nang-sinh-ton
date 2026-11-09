import { getCollection, type CollectionEntry } from 'astro:content';
import { Marked, type Tokens } from 'marked';
import hotlinesJson from '../../data/hotlines.json';
import situationsJson from '../../data/situations.json';
import chapterGroupsJson from '../../data/chapter-groups.json';
import { url as baseUrl } from './url';
import { VERIFICATION_LABELS_VI, BODY_SECTIONS } from '../../schema/entry.mjs';

export type Entry = CollectionEntry<'entries'>;
export type Chapter = CollectionEntry<'chapters'>;

export const SITE_NAME = 'Cẩm nang sinh tồn';
export const SITE_TAGLINE = 'Những việc nên làm để sống lâu hơn, đỡ tốn hơn, ít vướng luật hơn, theo bối cảnh Việt Nam.';
export const DISCLAIMER = 'Chưa có chuyên gia duyệt. Thông tin tham khảo, không thay thế luật sư hoặc bác sĩ.';
/** Dòng ngắn cho thanh thông báo đầu mọi trang; bản đầy đủ là DISCLAIMER (chân trang, trang Phương pháp). */
export const NOTICE_LEAD = 'Chưa có chuyên gia duyệt.';
export const NOTICE_MORE = 'Thông tin chỉ để tham khảo.';
export const REPO_URL = 'https://github.com/lucas10xai/cam-nang-sinh-ton';
export const ISSUES_URL = `${REPO_URL}/issues/new`;

/** SITE_INDEXABLE=true mới cho công cụ tìm kiếm lập chỉ mục (xem astro.config.mjs). */
export const SITE_INDEXABLE = process.env.SITE_INDEXABLE === 'true';

/** Dựng đường dẫn nội bộ theo base; `url.entry`, `url.chapter` là lối tắt. */
export const url = Object.assign(baseUrl, {
  entry: (id: string) => baseUrl(`/muc/${id}/`),
  chapter: (n: number) => baseUrl(`/chuong/${n}/`),
});

export interface Situation { slug: string; title: string; }
export const SITUATIONS: Situation[] = situationsJson.situations;
/** Biểu tượng của từng tình huống (tên trong components/icons/Icon.astro). Slug lạ dùng 'compass'. */
export const SITUATION_ICONS: Record<string, string> = {
  'cap-cuu-ngung-tim': 'heart-pulse',
  'dau-hieu-dot-quy-tim-mach': 'activity',
  'tai-nan-chan-thuong': 'cross',
  'ngo-doc-chay-no': 'flame',
  'bi-cho-nghi-viec': 'briefcase',
  'bi-quyt-luong-lam-them': 'wallet',
  'tai-nan-lao-dong': 'hard-hat',
  'bi-lua-mat-tai-khoan': 'lock',
  'xe-may-giao-thong': 'bike',
  'tien-tiet-kiem-vay-no': 'coins',
};
export const situationIcon = (slug: string): string => SITUATION_ICONS[slug] ?? 'compass';

/* ---------- Nhóm chủ đề của chương (data/chapter-groups.json) ---------- */
export interface ChapterGroup { slug: string; title: string; description: string; icon: string; tone: number; chapters: number[]; }
/** Mỗi chương đúng một nhóm; chương chưa xếp rơi vào nhóm "Khác" để không bao giờ biến mất khỏi trang. */
export function chapterGroups(chapterNumbers: number[]): ChapterGroup[] {
  const known = new Set(chapterNumbers);
  const seen = new Set<number>();
  const groups: ChapterGroup[] = chapterGroupsJson.groups.map((g) => ({
    ...g,
    chapters: g.chapters.filter((n) => {
      if (!known.has(n)) { console.warn(`[nhóm chương] ${g.slug}: chương ${n} không tồn tại`); return false; }
      if (seen.has(n)) { console.warn(`[nhóm chương] chương ${n} xuất hiện ở nhiều nhóm`); return false; }
      seen.add(n);
      return true;
    }),
  }));
  const rest = chapterNumbers.filter((n) => !seen.has(n));
  if (rest.length) {
    console.warn(`[nhóm chương] chưa xếp nhóm: ${rest.join(', ')}`);
    groups.push({ slug: 'khac', title: 'Khác', description: 'Các chương chưa xếp vào nhóm nào.', icon: 'book-open', tone: 6, chapters: rest });
  }
  return groups.filter((g) => g.chapters.length > 0);
}

/* ---------- Nhãn hiển thị ---------- */
export const COST_LABELS = {
  money: { '0': 'Không tốn tiền', low: 'Tốn ít tiền', mid: 'Tốn vừa tiền', high: 'Tốn nhiều tiền' },
  time: { '0': 'Không tốn thời gian', low: 'Ít thời gian', mid: 'Thời gian vừa', high: 'Tốn nhiều thời gian' },
  will: { '0': 'Không cần ý chí', low: 'Cần ít ý chí', mid: 'Cần ý chí', high: 'Cần nhiều ý chí' },
} as const;
export const BENEFIT_LABELS = { large: 'Lợi ích lớn', medium: 'Lợi ích vừa', small: 'Lợi ích nhỏ' } as const;
export const METRIC_LABELS = {
  mortality: 'Sống lâu, giảm tử vong',
  money: 'Tiền',
  time: 'Thời gian và sức lực',
  freedom: 'Tự do thân thể',
  other: 'Khác',
} as const;
export const EVIDENCE_LABELS = {
  A: 'Bằng chứng A: có thử nghiệm ngẫu nhiên hoặc tổng quan hệ thống',
  B: 'Bằng chứng B: nhiều nghiên cứu theo dõi, nhất quán',
  C: 'Bằng chứng C: một nghiên cứu, hoặc mâu thuẫn, hoặc chỉ là khuyến cáo chuyên môn',
} as const;
export const WORTH_LABELS = { 'very-high': 'Rất cao', high: 'Cao', medium: 'Trung bình' } as const;
export const WORTH_NOTE = 'Phán đoán của người biên soạn, không phải bằng chứng.';
export const VERIFICATION_LABELS = VERIFICATION_LABELS_VI as Record<string, string>;
const VERIFICATION_NOTES_BASE: Record<string, string> = {
  unverified: 'Mục này chưa được đối chiếu với nguồn gốc. Hãy kiểm tra lại điều luật, số liệu và thời hạn trước khi làm theo.',
  'consistency-checked': 'Mới kiểm số học và sự khớp nội bộ, chưa đối chiếu nguồn gốc.',
  'source-checked': 'Một lượt kiểm chứng độc lập đã mở nguồn gốc và đối chiếu từng khẳng định. Chưa có chuyên gia duyệt.',
  'cross-checked': 'Hai lượt kiểm chứng độc lập khớp nhau. Chưa có chuyên gia duyệt.',
  'needs-legal-review': 'Có điểm còn chưa chắc về pháp lý. Cần luật sư kiểm tra trước khi dựa vào.',
  'needs-medical-review': 'Có điểm còn chưa chắc về y khoa. Cần bác sĩ kiểm tra trước khi dựa vào.',
  'expert-reviewed': 'Đã có chuyên gia có tên xác nhận.',
};
/** Nhóm màu: dùng cho CSS, không thay cho nhãn chữ. */
/** Mô tả trạng thái dùng ở trang Phương pháp (chưa gắn với một mục cụ thể). */
export const VERIFICATION_NOTES = VERIFICATION_NOTES_BASE;

/** Mô tả theo từng mục: không nói quá những gì đã kiểm. `lead` (phạm vi) luôn đứng đầu khi có. */
export function verificationNote(v: Entry['data']['verification']): { lead: string | null; text: string } {
  const scope = v.scope?.trim().replace(/[.\s]+$/, '') || null;
  const partial = v.status !== 'unverified' && v.status !== 'expert-reviewed';
  const hasChecker = !!v.checker;
  if (v.status === 'unverified') return { lead: null, text: VERIFICATION_NOTES_BASE.unverified };
  if (!hasChecker && partial) {
    const lead = scope
      ? `Chỉ kiểm một phần: ${scope}. Phần còn lại của mục chưa được kiểm chứng.`
      : 'Không ghi rõ phạm vi đã kiểm. Hãy coi các phần còn lại của mục là chưa được kiểm chứng.';
    const text: Record<string, string> = {
      'consistency-checked': 'Mới kiểm số học và sự khớp nội bộ, chưa đối chiếu nguồn gốc. Không có thông tin về người hoặc cách kiểm.',
      'source-checked': 'Có đối chiếu nguồn cho phần nêu trên. Không có thông tin về người hoặc cách kiểm, nên chưa thể coi là kiểm chứng độc lập. Chưa có chuyên gia duyệt.',
      'cross-checked': 'Được ghi là đã kiểm chéo cho phần nêu trên. Không có thông tin về người hoặc cách kiểm. Chưa có chuyên gia duyệt.',
      'needs-legal-review': 'Có điểm còn chưa chắc về pháp lý. Cần luật sư kiểm tra trước khi dựa vào.',
      'needs-medical-review': 'Có điểm còn chưa chắc về y khoa. Cần bác sĩ kiểm tra trước khi dựa vào.',
    };
    return { lead, text: text[v.status] ?? VERIFICATION_NOTES_BASE[v.status] };
  }
  return { lead: scope ? `Phạm vi đã kiểm: ${scope}.` : null, text: VERIFICATION_NOTES_BASE[v.status] };
}

export const VERIFICATION_TONE: Record<string, 'none' | 'basic' | 'good' | 'review' | 'expert'> = {
  unverified: 'none',
  'consistency-checked': 'basic',
  'source-checked': 'good',
  'cross-checked': 'good',
  'needs-legal-review': 'review',
  'needs-medical-review': 'review',
  'expert-reviewed': 'expert',
};
/** Mục đang bị rà soát: kiểm chứng đã chỉ ra điểm chưa khớp. */
export type ReviewKind = 'medical' | 'legal' | null;
export function reviewKind(status: string): ReviewKind {
  return status === 'needs-medical-review' ? 'medical' : status === 'needs-legal-review' ? 'legal' : null;
}
export const REVIEW_WARNINGS = {
  medical: (emergencyNumber: string | null) =>
    `Mục này có điểm đã được kiểm chứng là thiếu điều kiện an toàn hoặc chưa khớp hướng dẫn gốc. Khi có người cần cấp cứu thật: gọi ${emergencyNumber ?? 'số cấp cứu'} trước, đừng chỉ làm theo mục này.`,
  legal: () =>
    'Mục này có khẳng định pháp lý chưa khớp văn bản gốc hoặc chưa xác nhận hiệu lực. Đối chiếu văn bản hiện hành hoặc hỏi luật sư trước khi làm theo.',
} as const;
/** Số cấp cứu y tế lấy từ data/hotlines.json (không gõ cứng). */
export function emergencyNumber(): string | null {
  return loadHotlines().items.find((h) => /cấp cứu/i.test(h.label))?.number ?? null;
}

export const VN_CLASS_LABELS = {
  unclassified: 'Chưa phân loại',
  universal: 'Dùng chung mọi nơi',
  adapted: 'Đã điều chỉnh cho Việt Nam',
  vn_native: 'Riêng của Việt Nam',
} as const;

export function verificationLabel(v: Entry['data']['verification']): string {
  const base = VERIFICATION_LABELS[v.status] ?? v.status;
  if ((v.status === 'source-checked' || v.status === 'cross-checked') && v.checked_at) return `${base} (${fmtDate(v.checked_at)})`;
  if (v.status === 'expert-reviewed' && v.checker) return `${base} (${v.checker})`;
  return base;
}

/** Số mục đã được đối chiếu nguồn trở lên (cùng cách tính với trang Phương pháp). */
export const verifiedCount = (r: { by_status: Record<string, number> } | undefined): number =>
  (r?.by_status['source-checked'] ?? 0) + (r?.by_status['cross-checked'] ?? 0) + (r?.by_status['expert-reviewed'] ?? 0);
/** Số mục đang bị rà soát (cần chuyên gia kiểm tra y khoa hoặc pháp lý). */
export const reviewCount = (r: { by_status: Record<string, number> } | undefined): number =>
  (r?.by_status['needs-legal-review'] ?? 0) + (r?.by_status['needs-medical-review'] ?? 0);

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/* ---------- Mức đáng làm (tính lúc build) ----------
 * Theo _ref/vi-quangpao/tools/lib/book.mjs (COST_W, ratioOf): cộng trọng số ba chi phí.
 * Khác chữ SPEC §5 ở một chỗ: bản gốc cho "lợi ích lớn + tổng chi phí <= 2" là cao
 * (SPEC nói "chi phí không cao"); SPEC dặn theo bản gốc. Lợi ích "nhỏ" luôn là trung bình. */
const W = {
  money: { '0': 0, low: 1, mid: 2, high: 2 },
  time: { '0': 0, low: 0, mid: 1, high: 2 },
  will: { '0': 0, low: 1, mid: 2, high: 2 },
} as const;
export type Worth = keyof typeof WORTH_LABELS;
export function costScore(c: Entry['data']['cost']): number {
  return W.money[c.money] + W.time[c.time] + W.will[c.will];
}
export function worthOf(d: Entry['data']): Worth {
  const cs = costScore(d.cost);
  if (d.benefit === 'large') return cs === 0 ? 'very-high' : cs <= 2 ? 'high' : 'medium';
  return d.benefit === 'medium' && cs === 0 ? 'high' : 'medium';
}

/* ---------- Dữ liệu ---------- */
export interface Hotline {
  number: string;
  label: string;
  detail: string;
  source: { ref: string; chapter: number };
  verified: boolean;
}
export function loadHotlines(): { items: Hotline[]; showOnChapters: number[] } {
  return { items: hotlinesJson.items as Hotline[], showOnChapters: hotlinesJson.show_on_chapters ?? [] };
}

let cache: { chapters: Chapter[]; entries: Entry[]; byId: Map<string, Entry> } | null = null;
export async function loadAll() {
  if (cache) return cache;
  const chapters = (await getCollection('chapters')).sort((a, b) => a.data.number - b.data.number);
  const entries = (await getCollection('entries')).sort(
    (a, b) => a.data.chapter - b.data.chapter || a.data.number - b.data.number,
  );
  cache = { chapters, entries, byId: new Map(entries.map((e) => [e.data.id, e])) };
  return cache;
}

/** Tóm tắt hiển thị trên danh sách: `tldr` của mục đã soạn lại, ngược lại không có. */
export const entrySummary = (e: Entry): string | null => (e.data.rewrite_status === 'rewritten' && e.data.tldr ? e.data.tldr : null);

export const entryCode = (e: Entry) => `${e.data.chapter}.${e.data.number}`;

/** Bỏ dấu tiếng Việt, hạ chữ thường: dùng cho lọc client-side và so khớp. */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

/* ---------- Markdown ---------- */
export interface Section { title: string; html: string; }

function makeRenderer(byId: Map<string, Entry>, where: { v: string }) {
  return {
    link(this: any, { href, title, tokens }: Tokens.Link) {
      const text = this.parser.parseInline(tokens);
      const m = /#entry-([a-z0-9-]+)\s*$/.exec(href);
      if (m) {
        if (!byId.has(m[1])) {
          console.warn(`[liên kết chết] ${where.v}: #entry-${m[1]}`);
          return text;
        }
        let html = `<a href="${url.entry(m[1])}">${text}</a>`;
        // Link dạng "mục 1 đến 7" mang danh sách id đầy đủ trong title "refs:a,b,c": liệt kê phần còn lại.
        const refs = title?.startsWith('refs:') ? title.slice(5).split(',').filter((id) => id && id !== m[1]) : [];
        const extra = refs.filter((id) => byId.has(id));
        if (extra.length) {
          html += `<span class="xrefs" aria-label="Các mục khác trong nhóm">[${extra
            .map((id) => `<a href="${url.entry(id)}" title="${byId.get(id)!.data.title.replace(/"/g, '&quot;')}">${byId.get(id)!.data.number}</a>`)
            .join(' ')}]</span>`;
        }
        return html;
      }
      const ch = /(?:^|\/)(\d{2})-[a-z0-9-]+\.md(?:#.*)?$/.exec(href);
      if (ch) return `<a href="${url.chapter(Number(ch[1]))}">${text}</a>`;
      if (/^https?:\/\//.test(href)) {
        const t = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';
        return `<a href="${href}"${t} rel="noopener noreferrer nofollow">${text}</a>`;
      }
      return text;
    },
  };
}

// Một renderer cho mỗi bảng id; "where" đổi theo lần gọi để cảnh báo liên kết chết chỉ đúng chỗ.
const parsers = new WeakMap<Map<string, Entry>, { md: Marked; where: { v: string } }>();
function renderMd(md: string, byId: Map<string, Entry>, where: string): string {
  let p = parsers.get(byId);
  if (!p) {
    const w = { v: where };
    const inst = new Marked({ gfm: true, breaks: false });
    inst.use({ renderer: makeRenderer(byId, w) });
    p = { md: inst, where: w };
    parsers.set(byId, p);
  }
  p.where.v = where;
  return p.md.parse(md, { async: false }) as string;
}

/** Markdown tĩnh (không có id mục): link ngoài giữ, link tương đối thành chữ thường. */
export function renderPlainMd(md: string): string {
  return renderMd(md, new Map(), 'trang tĩnh');
}

export function renderChapterIntro(ch: Chapter, byId: Map<string, Entry>): string {
  return renderMd(ch.body ?? '', byId, `chương ${ch.data.number}`);
}

/** Tách thân mục theo H2 cố định, mỗi phần render riêng để bố cục xếp lớp. */
export function renderSections(e: Entry, byId: Map<string, Entry>): Section[] {
  const body = e.body ?? '';
  const parts = body.split(/^## +(.+?)\s*$/m);
  const out: Section[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i].trim();
    let md = (parts[i + 1] ?? '').trim();
    if (title === 'Nguồn' && !/^\s*(?:[-*]|\d+\.)\s/m.test(md) && / ; /.test(md)) {
      md = md.split(/\s+;\s+/).map((s) => `- ${s.trim()}`).join('\n');
    }
    if (title === 'Pháp luật Việt Nam' && !/^\s*(?:[-*]|\d+\.)\s/m.test(md)) {
      // Mục chưa soạn lại: mỗi đoạn thành một gạch đầu dòng cho dễ đọc.
      md = md.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `- ${p.replace(/\n+/g, ' ')}`).join('\n');
    }
    out.push({ title, html: renderMd(md, byId, `mục ${e.data.id} / ${title}`) });
  }
  return out;
}
export const KNOWN_SECTIONS: string[] = BODY_SECTIONS;

/* ---------- Thống kê cho trang Phương pháp ---------- */
export const STATUS_ORDER = [
  'unverified', 'consistency-checked', 'source-checked', 'cross-checked',
  'needs-legal-review', 'needs-medical-review', 'expert-reviewed',
];
export interface StatusRow { total: number; by_status: Record<string, number>; by_vn_class: Record<string, number>; by_rewrite_status: Record<string, number>; }
export interface StatusData { source: 'data/status.json' | 'tính lúc build'; generated_at: string | null; total: number; totals: StatusRow; chapters: Map<number, StatusRow>; }

const blank = (): StatusRow => ({ total: 0, by_status: {}, by_vn_class: {}, by_rewrite_status: {} });
const bump = (m: Record<string, number>, k: string) => { m[k] = (m[k] ?? 0) + 1; };

/** Dùng data/status.json (do cổng chất lượng sinh) nếu khớp số mục đang build; ngược lại tự tính từ content. */
export function loadStatus(entries: Entry[]): StatusData {
  const found = Object.values(import.meta.glob('../../data/status.json', { eager: true, import: 'default' }))[0] as any;
  {
    const j = found;
    if (j && j.total === entries.length) {
      const chapters = new Map<number, StatusRow>(Object.entries(j.chapters).map(([k, v]) => [Number(k), v as StatusRow]));
      return { source: 'data/status.json', generated_at: j.generated_at ?? null, total: j.total, totals: { total: j.total, ...j.totals }, chapters };
    }
  }
  const chapters = new Map<number, StatusRow>();
  const totals = blank();
  for (const e of entries) {
    const r = chapters.get(e.data.chapter) ?? blank();
    for (const t of [r, totals]) {
      t.total++;
      bump(t.by_status, e.data.verification.status);
      bump(t.by_vn_class, e.data.vn_class);
      bump(t.by_rewrite_status, e.data.rewrite_status);
    }
    chapters.set(e.data.chapter, r);
  }
  return { source: 'tính lúc build', generated_at: null, total: entries.length, totals, chapters };
}
