// Dữ liệu bản đồ (graph.json do src/pages/graph.json.ts sinh lúc build) và các hàm đọc gọn.
import { url } from '../../lib/url';

export interface Group { s: string; t: string; d: string; i: string; k: number; c: number[]; }
export interface Chapter { n: number; t: string; d: string; g: number; x: number; y: number; r: number; }
export interface Situation { s: string; t: string; x: number; y: number; e: number[]; }
/** [id, title, chapterIndex, number, x, y, flags, cost] */
export type EntryRow = [string, string, number, number, number, number, number, number];
export interface GraphData {
  v: number; g: Group[]; c: Chapter[]; s: Situation[]; e: EntryRow[]; r: [number, number][];
  L: { money: string[]; time: string[]; will: string[]; status: string[]; ev: string[]; worth: string[] };
  st: { entries: number; chapters: number; groups: number; situations: number; verified: number; review: number; expert: number; links: number; quick: number };
  b: { minX: number; minY: number; maxX: number; maxY: number };
}

let pending: Promise<GraphData> | null = null;
/** Tải một lần, tải trễ: không chặn nội dung. */
export function loadGraph(): Promise<GraphData> {
  return (pending ??= fetch(url('/graph.json')).then((r) => {
    if (!r.ok) throw new Error(`graph.json ${r.status}`);
    return r.json();
  }));
}

export const statusOf = (flags: number) => flags & 7; // chỉ số trong STATUS_ORDER
export const isReview = (flags: number) => (flags & 7) === 4 || (flags & 7) === 5;
export const isVerified = (flags: number) => [2, 3, 6].includes(flags & 7);
export const worthOf = (flags: number) => (flags >> 4) & 3; // 0 trung bình, 1 cao, 2 rất cao
export const costOf = (cost: number) => ({ money: (cost >> 4) & 3, time: (cost >> 2) & 3, will: cost & 3, ev: (cost >> 6) & 3 });

export const entryUrl = (id: string) => url(`/muc/${id}/`);
export const chapterUrl = (n: number) => url(`/chuong/${n}/`);
export const sitUrl = (slug: string) => url(`/tinh-huong/#${slug}`);
export const groupUrl = (slug: string) => url(`/chuong/#nhom-${slug}`);

export const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Cầu nối giữa ngăn kéo Mục lục (mọi trang) và bản đồ (chỉ trang chủ): trả true nếu bản đồ đã tự mở liên kết. */
export interface MapBridge { open(href: string): boolean; }
declare global { interface Window { cnstMap?: MapBridge; } }
