# SPEC: Cẩm nang sinh tồn

Sản phẩm công ích mã nguồn mở: trang đọc tiếng Việt, biên soạn lại từ *高性价比人生指南* (eternity4719, CC BY 4.0) theo bối cảnh, luật pháp và lịch sử Việt Nam. Domain tạm: `http://2k.io.vn/`.

## 1. Nguyên tắc (bất biến)

1. **Đúng hơn là nhiều.** Không bịa số, không bịa điều luật. Điều chưa kiểm chứng phải được gắn nhãn, không giấu.
2. **Không có chuyên gia duyệt** (hiện tại). Mọi trang phải hiển thị trạng thái kiểm chứng của mục đó và lời cảnh báo "tham khảo, không thay luật sư/bác sĩ".
3. **Dữ liệu tách khỏi giao diện.** Luật đổi thì sửa dữ liệu, không sửa code.
4. **Giai đoạn 1: không gọi LLM lúc chạy.** Site là tĩnh. AI chỉ chạy ở bước soạn/kiểm chứng (offline).
5. **Quyền riêng tư:** không tracker, không font/CDN bên ngoài, không tài khoản. Trạng thái cá nhân (đã đọc, đã làm) chỉ lưu `localStorage`.
6. **Ghi công đầy đủ** (CC BY 4.0): eternity4719 (gốc) → quangpao/HowToLiveBetter nhánh `vi` (bản nháp chính) → luonglb/song-dang-tien (đối chiếu) → dự án này. Nêu rõ là đã sửa. Code theo MIT.
7. UI: icon SVG tối giản (nét đơn sắc, phong cách Lucide/Linear, 14-18px), **không dùng emoji** trong giao diện. Mobile-first, sáng/tối, đọc được ở 360px.

## 2. Cấu trúc repo và quyền sở hữu thư mục

```
_ref/            # 3 bản tham chiếu đã clone (KHÔNG commit, chỉ đọc)
schema/          # zod schema dùng chung (entry, chapter)         -> Importer
content/
  chapters/NN.md # meta chương + lời mở đầu                        -> Importer
  entries/NN-<slug-chuong>/MM-<slug-muc>.md                        -> Importer
data/            # dữ liệu dùng chung (hotlines, status, rules…)   -> xem ghi chú
tools/import/    # nhập bản nháp                                   -> Importer
tools/gate/      # cổng kiểm tra chất lượng                        -> Gate
src/ public/ astro.config.mjs tsconfig.json package.json          -> Site
docs/            # tài liệu                                        -> ai tạo file nấy
GHI-CONG.md LICENSE LICENSE-CODE                                   -> Importer
```
`package.json`: chỉ **Site** được thêm dependency (`pnpm add`). Importer/Gate chỉ dùng Node built-in, `zod`, `yaml` (đã cài sẵn). Mỗi agent chỉ sửa thư mục của mình.

## 3. Schema mục (entry)

File `content/entries/<NN-slug-chuong>/<MM>-<slug>.md` = frontmatter YAML + thân Markdown.

```yaml
id: lam-them-gio-ba-muc-150-200-300-va-ba-cai-tran   # slug ổn định của quangpao, KHÔNG đổi về sau
legacy: "19-1"            # nhãn chương-mục của bản nháp, để đối chiếu
chapter: 19               # số nguyên 1..36
number: 1                 # số thứ tự trong chương
title: "…"
cost: { money: "0", time: "mid", will: "low" }   # enum: "0" | "low" | "mid" | "high" (importer map từ nhãn nguồn, lỗi to nếu gặp nhãn lạ)
benefit: large            # large | medium
metric: other             # mortality | money | time | freedom | other   (từ "thước-đo")
evidence: B               # A | B | C
contested: false          # có "tranh luận" trong ghi chú
vn_class: unclassified    # unclassified | universal | adapted | vn_native   (phân loại là việc của Pha 1)
rewrite_status: imported  # imported | rewritten  (rewritten = đã soạn theo format phân lớp)
tldr: null                # chuỗi 1-2 câu kết luận (điền ở bước soạn lại)
steps: []                 # danh sách bước làm (điền ở bước soạn lại)
legal_refs:               # tham chiếu luật có cấu trúc
  - { doc: "Bộ luật Lao động 45/2019/QH14", article: "Điều 98", url: "https://…", effective_from: "2021-01-01", checked_at: "2026-11-03", quote: null }
verification:
  status: unverified      # xem §4
  checked_at: null        # YYYY-MM-DD
  checker: null           # tên/agent/người
  scope: null             # phạm vi đã kiểm
  sources: []             # URL đã đối chiếu
origin: { zh: null, quangpao: "19-1", luonglb: null }   # chỉ điền khi ánh xạ CHẮC CHẮN, ngược lại null
related: [id, id]         # id mục liên quan (phân giải từ các tham chiếu "xem mục N" trong bản nháp)
situations: []            # slug tình huống (điền ở Pha 1)
tags: []
```

**Thân Markdown** giữ nguyên văn bản nháp, chia bằng H2 cố định, theo thứ tự: `## Nói dễ hiểu`, `## Chi phí`, `## Lợi ích`, `## Pháp luật Việt Nam` (nếu có), `## Ghi chú`, `## Nguồn`. Dòng "Mức bằng chứng" đi vào frontmatter (`evidence`), không lặp ở thân. Nhập bản nháp là **chuyển cấu trúc, không viết lại chữ**.

**Meta chương** `content/chapters/NN.md`: frontmatter `{ number, title, slug, entry_count }`, thân = lời mở đầu chương nguyên văn.

## 4. Trạng thái kiểm chứng

| `verification.status` | Nhãn hiển thị cho người đọc | Ý nghĩa |
|---|---|---|
| `unverified` | Chưa kiểm chứng | Mặc định khi nhập |
| `consistency-checked` | Đã kiểm tính nhất quán | Chỉ kiểm số học/khớp nội bộ |
| `source-checked` | Đã đối chiếu nguồn (ngày) | Agent độc lập đã mở văn bản/nguồn gốc và đối chiếu từng khẳng định |
| `cross-checked` | Đã kiểm chéo (ngày) | Hai lượt kiểm chứng độc lập khớp nhau |
| `needs-legal-review` / `needs-medical-review` | Cần chuyên gia kiểm tra | Có điểm chưa chắc |
| `expert-reviewed` | Chuyên gia xác nhận (tên) | Luật sư/bác sĩ có tên đã duyệt |

Nguồn dữ liệu ban đầu: `_ref/vi-quangpao/data/review-status.json` (7 mục) và `legal-references.json`; còn lại `unverified`. **Không được tự nâng trạng thái khi nhập.**

## 5. Site (Astro, tĩnh) - yêu cầu Pha 0

- `astro.config.mjs`: `site: 'http://2k.io.vn'`, output static, sitemap. Content đọc từ `process.env.CONTENT_DIR ?? 'content'` (để chạy fixtures).
- Trang: Trang chủ (giới thiệu 1 màn hình, ô tìm kiếm, lối vào theo chương, khối "Khẩn cấp" với số điện thoại lấy từ `data/hotlines.json`), Danh sách chương, Trang chương, Trang mục, **Tra cứu/lọc** (client-side: chương, mức bằng chứng, chi phí tiền/thời gian/ý chí, mức đáng làm, trạng thái kiểm chứng, loại lợi ích), Giới thiệu & Ghi công, Phương pháp & Trạng thái kiểm chứng (bảng tiến độ theo chương, đọc `data/status.json`), 404.
- **Trang mục xếp lớp:** tiêu đề → hàng chip (chi phí tiền/thời gian/ý chí, bằng chứng A/B/C, mức đáng làm) → huy hiệu **trạng thái kiểm chứng** + cảnh báo → khối "Nói dễ hiểu" nổi bật (hoặc `tldr` nếu có) → `steps` nếu có → Chi phí, Lợi ích → **Căn cứ pháp luật gập lại** (`<details>`, mở mặc định chỉ khi in) → Ghi chú → Nguồn (link) → mục liên quan. Đoạn dài phải ngắt dòng dễ đọc; cỡ chữ ≥ 17px, độ rộng dòng ≤ 70ch.
- **Mức đáng làm** (tính lúc build, không lưu): `very-high` = benefit large và cả ba chi phí ở mức thấp nhất (money=0, time=low, will=0); `high` = benefit large và chi phí không cao, hoặc benefit medium và cả ba chi phí thấp nhất; còn lại `medium`. Đối chiếu công thức gốc trong `_ref/vi-quangpao/README.md` mục "Mức đáng làm" (nếu khác, theo bản đó và ghi chú lại). Luôn kèm nhãn "phán đoán của người biên soạn, không phải bằng chứng".
- **Tìm kiếm:** Pagefind. **Gõ không dấu phải ra kết quả có dấu** ("lam them gio" -> "làm thêm giờ"); phải kiểm thử bằng truy vấn thật sau build.
- Liên kết "mục liên quan" và mọi "xem mục N" trong thân phải thành link nội bộ hoạt động (dựa `related`).
- Tối ưu: không JS bắt buộc để đọc mục; JS chỉ cho lọc, tìm kiếm, theme, lưu trạng thái cá nhân. Font tự host (có thể dùng Be Vietnam Pro OFL từ `_ref/vi-luonglb/pdf/fonts`, kiểm tra giấy phép OFL đi kèm).
- Nút "đã đọc/đã làm" lưu `localStorage`, trang "Việc của tôi" liệt kê các mục đã đánh dấu (không máy chủ).
- Không làm trong Pha 0: PWA/offline, máy tính, tình huống, AI.

## 6. Cổng chất lượng (`tools/gate`)

`node tools/gate/run.mjs [--links] [--chapter N] [--json]`, exit code ≠ 0 nếu có lỗi mức `error`.

| Kiểm tra | Mức |
|---|---|
| Frontmatter hợp lệ theo `schema/entry.mjs`; id duy nhất; (chapter, number) duy nhất; thân có đủ H2 bắt buộc | error |
| `related` trỏ tới id tồn tại | error |
| Mục có H2 `Pháp luật Việt Nam` nhưng `legal_refs` rỗng | warn |
| `legal_refs[].url` không phải miền chính thống (chinhphu.vn, vbpl.vn, quochoi.vn, moh.gov.vn, … danh sách cấu hình được) | warn |
| `verification.status` ∈ {source-checked, cross-checked, expert-reviewed} mà thiếu `checked_at`/`sources` | error |
| Số xuất hiện trong "Nói dễ hiểu" không có trong "Lợi ích"/"Pháp luật Việt Nam"/"Chi phí" | warn |
| Từ khóa nghi bịa: `[chưa kiểm chứng]`, `TODO`, `XXX`, `lorem` | error |
| `--links`: URL trong Nguồn/legal_refs còn sống (HEAD→GET, cache, tốc độ lịch sự, thử lại) | warn |

Sinh `data/status.json`: số mục theo chương × trạng thái kiểm chứng × loại, để trang Phương pháp hiển thị.

## 7. Lộ trình sau Pha 0 (tham khảo, KHÔNG làm bây giờ)

Pha 1: soạn lại + kiểm chứng 5 chương (13, 19, 14, 36, 5) theo quy trình phân loại → soạn → kiểm chứng độc lập → cổng; máy tính (tiền tăng ca, phép năm, trợ cấp thôi việc/mất việc, BHTN) với tham số JSON có ngày hiệu lực; 5-6 tình huống. Pha 2: các chương còn lại + nhóm nội dung mới (hụi/họ, đa cấp, tín dụng đen, giả danh công an…) + "Hồ sơ vụ việc". Pha 3: PWA, flashcard/Anki, thẻ chia sẻ, audio, bản in. Pha 4: hỏi đáp AI trực tiếp.
