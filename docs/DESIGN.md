# Thiết kế giao diện

Tinh thần: **tối giản nghiêm ngặt, đọc là chính**. Chuẩn tham chiếu: Linear Docs, Vercel Geist, Stripe Docs, VitePress. Phân cấp bằng khoảng trắng, cỡ chữ, độ đậm (400/500/600) và đường kẻ mảnh 1px; không hộp lồng hộp, không màu trang trí, không bóng đổ dày, không emoji.

Sáng là mặc định; tối theo `prefers-color-scheme` khi người đọc chưa chọn, nút ở thanh trên ghi đè và lưu ở `localStorage` (`cnst:theme`). Mã giao diện: `src/styles/` (`tokens.css` phông + màu, `base.css` nền tảng, thân bài `.prose`, nút, pill, ô nhập; `layout.css` header, sidebar, Spotlight, chân trang; `pages.css` từng loại trang; `print.css`). Mọi màu là custom property trong `tokens.css`; đừng gõ cứng giá trị ở nơi khác.

## Chữ
- **Inter Variable** duy nhất, tự host `public/fonts/inter-vi.woff2` (bản cắt `latin + latin-ext + vietnamese`, trục `wght` 400–700 và `opsz` 14–32, `font-optical-sizing: auto`; OFL ở `OFL-Inter.txt`). Đã kiểm đủ 134 ký tự tiếng Việt có dấu (ắ ặ ể ỗ ự đ Đ…) đều có glyph. Không CDN.
- `--font-mono` (hệ thống) chỉ cho `<kbd>`. Số thứ tự và số liệu dùng `font-variant-numeric: tabular-nums`; không in hoa giãn chữ.
- Thang: thân bài 16px / 1,72 / 400, `max-width: 66ch`; H1 trang 28px (trang chủ 30px) 600, giãn −0,022em, `text-wrap: balance`; H2 mục 19px 600; tiêu đề dòng danh sách 16px 550 (15,5px trên điện thoại); UI, sidebar, siêu dữ liệu 12–13,5px.

## Màu: đơn sắc + một màu nhấn
Nền `--bg` #fff / #0b0b0d, `--bg-subtle` #fafafa / #121215, `--bg-muted` #f4f4f5 / #1c1c21, viền `--border` #e4e4e7 / #26262b (và `--border-subtle`), chữ `--fg` / `--fg-secondary` / `--fg-muted`, nhấn `--accent` #2563eb / #60a5fa. `--fg-muted` đậm hơn so với bản phác (#71717a sáng, #8a8a93 tối) để chữ chú thích đạt tương phản AA.

Màu ngữ nghĩa chỉ khi mang thông tin thật: **lục** (không tốn tiền, bằng chứng A, đã đối chiếu), **hổ phách** (bằng chứng B/C, chưa kiểm chứng), **đỏ** (`--danger`: chỉ cho khẩn cấp, `.review-warn`, mục đang rà soát).

## Khung 3 vùng (mọi trang)
1. **Header 52px** (`border-bottom` 1px, nền mờ + blur): nút menu (dưới 1024px), biểu tượng + "Cẩm nang sinh tồn", nút tìm kiếm (mở Spotlight; chỉ còn biểu tượng trên điện thoại), liên kết Tra cứu · Việc của tôi (kèm số mục đã lưu) · Phương pháp, nút **115** (chấm đỏ; popover 5 số `tel:` lấy từ `data/hotlines.json`), đổi sáng/tối. Không có thanh cảnh báo riêng: câu miễn trừ nằm dưới tiêu đề trang, dưới tiêu đề mục và ở chân trang.
2. **Sidebar 264px** (cố định từ 1024px; dưới đó là drawer có scrim, `Esc` đóng, nút menu đổi thành dấu X): 4 lối chính, 36 chương theo 7 nhóm trong `data/chapter-groups.json` (`<details open>`; số chương rộng cố định để tên xuống dòng thẳng hàng; số mục bên phải), chương đang xem được tô nhẹ và tự cuộn vào giữa. Cuối sidebar: Phương pháp, Giới thiệu.
3. **Spotlight** (`/` hoặc `Ctrl/⌘+K`): `<dialog>` 580px, bo 12px; **Pagefind chỉ nạp lần đầu người dùng mở hộp** (`src/scripts/spotlight.ts`); gõ không dấu vẫn ra kết quả; `↑` `↓` chọn, `Enter` mở, `Esc` đóng; "Xem tất cả kết quả →" sang `/tim-kiem/?q=…`. Trang `/tim-kiem/` vẫn đầy đủ khi mở trực tiếp.

## Trang
- **Trang chủ**: mở đầu 4 dòng (H1, mô tả, dòng tin cậy trung thực kèm số mục đã đối chiếu thật), lưới 10 tình huống kẻ mảnh + dải `tel:`, 6 mục "Bắt đầu nhanh" (đáng làm *rất cao*, ưu tiên đã soạn lại và không đang rà soát), mục lục 36 chương theo 7 nhóm.
- **Chương**: breadcrumb, H1, đoạn mở đầu (phần dài thu trong "Đọc tiếp"), ô lọc + pill (`Tất cả`, `Đáng làm cao`, `Không tốn tiền`), danh sách dòng phân cách (`EntryRow`): số · tiêu đề · tóm tắt 2 dòng · siêu dữ liệu một hàng; thẻ `Đang rà soát` chỉ khi `needs-*-review`.
- **Mục**: cột đọc 66ch + cột phụ 200px từ 1280px (Trên trang này có scroll-spy, đã đọc/đã làm, mục liên quan); dưới 1280px hai nút đánh dấu nằm dưới hàng pill. Một hàng pill duy nhất, pill có mũi tên mở giải thích (`<details data-pop>`, `Esc` đóng). `.review-warn` luôn đứng trước `tldr` và `steps`; mục `needs-*` không có ô tick, chỉ đánh số. Căn cứ pháp luật là `<details class="legal-fold">` (đóng khi đọc, mở khi in). URL trần trong phần Nguồn hiển thị tên miền, `href` giữ nguyên.
- **Tra cứu**: ô lọc + chương, các hàng pill (Tiền, Bằng chứng, Đáng làm; "Lọc thêm": thời gian, ý chí, kiểm chứng, tình huống), bộ đếm "Đang hiện X / N mục", trạng thái lọc nằm trong URL (`?worth=very-high`). Trên điện thoại bộ lọc thu gọn.

## Icon
SVG nét đơn sắc kiểu Lucide, lưới 24, nét 1,6, `currentColor`, 13–16px. Một nguồn: `src/components/icons/paths.ts`; `Icon.astro` phát `<use href="…/icons.svg#tên">`, sprite do `src/pages/icons.svg.ts` sinh từ cùng bảng.

## Thêm hoặc đổi nhóm chương
Sửa `data/chapter-groups.json`: mỗi nhóm có `slug`, `title`, `description`, `icon` (tên trong `paths.ts`) và `chapters`. Mỗi chương 1 đến 36 phải nằm đúng một nhóm; chương chưa xếp rơi vào nhóm "Khác" kèm cảnh báo lúc build. Tình huống lấy từ `data/situations.json` (chỉ hiện tình huống đã có mục); icon theo slug ở `SITUATION_ICONS` (`src/lib/site.ts`).

## In
`print.css`: ẩn header, sidebar, chân trang, nút đánh dấu, điều hướng; mở sẵn căn cứ pháp luật; URL nguồn in kèm đầy đủ.
