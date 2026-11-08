// Schema mục (entry) dùng chung: Importer, Site, Gate. Theo docs/SPEC.md §3, §4.
import { z } from 'zod';

export const COST_LEVELS = ['0', 'low', 'mid', 'high'];
// "small" ngoài SPEC: bản nháp có 4 mục "lợi-ích=nhỏ"; không ép về "medium" để khỏi đổi mức đáng làm.
export const BENEFITS = ['large', 'medium', 'small'];
export const METRICS = ['mortality', 'money', 'time', 'freedom', 'other'];
export const EVIDENCE = ['A', 'B', 'C'];
export const VN_CLASSES = ['unclassified', 'universal', 'adapted', 'vn_native'];
export const REWRITE_STATUSES = ['imported', 'rewritten'];
export const VERIFICATION_STATUSES = [
  'unverified',
  'consistency-checked',
  'source-checked',
  'cross-checked',
  'needs-legal-review',
  'needs-medical-review',
  'expert-reviewed',
];
export const VERIFICATION_LABELS_VI = {
  unverified: 'Chưa kiểm chứng',
  'consistency-checked': 'Đã kiểm tính nhất quán',
  'source-checked': 'Đã đối chiếu nguồn',
  'cross-checked': 'Đã kiểm chéo',
  'needs-legal-review': 'Cần chuyên gia kiểm tra (pháp lý)',
  'needs-medical-review': 'Cần chuyên gia kiểm tra (y khoa)',
  'expert-reviewed': 'Chuyên gia xác nhận',
};
// Trạng thái có kèm ngày/tên khi hiển thị; Gate bắt buộc checked_at + sources.
export const STATUSES_REQUIRING_PROOF = ['source-checked', 'cross-checked', 'expert-reviewed'];
// H2 cố định của thân, theo thứ tự (SPEC §3). "Pháp luật Việt Nam" chỉ có khi mục có.
export const BODY_SECTIONS = ['Nói dễ hiểu', 'Chi phí', 'Lợi ích', 'Pháp luật Việt Nam', 'Ghi chú', 'Nguồn'];
export const REQUIRED_BODY_SECTIONS = BODY_SECTIONS.filter((s) => s !== 'Pháp luật Việt Nam');

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
const label = z.string().regex(/^\d{1,2}-\d{1,3}$/, 'dạng "chương-mục", ví dụ "19-1"');

export const LegalRefSchema = z.object({
  doc: z.string().min(1),
  article: z.string().nullable(),
  url: z.string().url().nullable(),
  effective_from: dateStr.nullable(),
  checked_at: dateStr.nullable(),
  quote: z.string().nullable(),
});

export const VerificationSchema = z.object({
  status: z.enum(VERIFICATION_STATUSES),
  checked_at: dateStr.nullable(),
  checker: z.string().nullable(),
  scope: z.string().nullable(),
  sources: z.array(z.string()),
});

export const EntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  legacy: label,
  chapter: z.number().int().min(1).max(36),
  number: z.number().int().min(1),
  title: z.string().min(1),
  cost: z.object({
    money: z.enum(COST_LEVELS),
    time: z.enum(COST_LEVELS),
    will: z.enum(COST_LEVELS),
  }),
  benefit: z.enum(BENEFITS),
  metric: z.enum(METRICS),
  evidence: z.enum(EVIDENCE),
  contested: z.boolean(),
  vn_class: z.enum(VN_CLASSES),
  rewrite_status: z.enum(REWRITE_STATUSES),
  tldr: z.string().nullable(),
  steps: z.array(z.string()),
  legal_refs: z.array(LegalRefSchema),
  verification: VerificationSchema,
  origin: z.object({
    zh: label.nullable(),
    quangpao: label.nullable(),
    luonglb: label.nullable(),
  }),
  related: z.array(z.string()),
  situations: z.array(z.string()),
  tags: z.array(z.string()),
});
