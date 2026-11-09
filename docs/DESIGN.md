# Thiết kế giao diện

Tinh thần: **bản đồ tri thức** (nút-cạnh, thanh kính nổi, bảng trượt từ phải) trên nền **giấy xanh xám** và chữ serif; vẫn là một cuốn sổ tay đáng tin, không phải app lạnh. Học phong cách của https://secondbrainos-vn.pages.dev (bố cục, nhịp, kiểu chữ, bảng màu), toàn bộ mã, chữ, hình là tự viết.

Sáng là mặc định; tối theo `prefers-color-scheme` khi người đọc chưa chọn, nút trên thanh trên ghi đè và lưu ở `localStorage` (`cnst:theme`). Mã giao diện: `src/styles/` (`tokens.css` token và phông, `base.css` nút/chip/thẻ, `layout.css` thanh trên, ngăn kéo Mục lục, chân trang, `pages.css` từng loại trang, `map.css` trang chủ + bảng trượt, `print.css`). Mọi màu, cỡ chữ, khoảng cách, bo góc, bóng là custom property trong `tokens.css`; đừng gõ cứng giá trị ở nơi khác.

## Chữ
- **Source Serif 4** (400 đến 700, thêm nghiêng 400) cho thân bài và tiêu đề; **JetBrains Mono** (400 đến 700) cho nhãn, số, logo `[[ cẩm nang sinh tồn ]]`, phím tắt, chip. Tự host trong `public/fonts` (OFL: `OFL-SourceSerif4.txt`, `OFL-JetBrainsMono.txt`), bản cắt còn Latin, Latin mở rộng và toàn bộ dấu tiếng Việt, tổng 96 KB. Đã kiểm 146 tổ hợp chữ có dấu (ắ ằ ẳ ẵ ặ ấ ầ ẩ ẫ ậ ế ề ể ễ ệ ố ồ ổ ỗ ộ ớ ờ ở ỡ ợ ứ ừ ử ữ ự ỳ ý ỷ ỹ ỵ đ Đ và hoa) đều có glyph ở cả ba file. Không CDN.
- Thân bài 17px/1,62, độ rộng dòng 68ch; tiêu đề 600, giãn chữ −0,025em; nhãn mono 11px in hoa giãn 0,14em. Thang: `--fs-2xs` 11, `--fs-xs` 13, `--fs-sm` 15, `--fs-base` 17, `--fs-md` 19, `--fs-lg` 22, `--fs-xl` 28, `--fs-2xl`/`--fs-3xl` co giãn.

## Màu
| Token | Sáng | Tối |
|---|---|---|
| `--bg` giấy / `--surface` thẻ / `--text` mực | #eaeee9 / #f7f9f6 / #15201b | #101814 / #18221d / #e3eae5 |
| `--muted` chữ phụ / `--border` | #4b5a52 / #d2dacf | #a9b8af / #2c3a33 |
| `--accent` xanh rừng | #1f6b52 | #62c7a2 |
| `--num` số liệu vàng nâu | #7f6120 | #d3ac55 |
| `--tone-1..7` màu nhóm chương | rừng #1f6b52, vàng nâu #8a6b23, lam #3f5f86, đất nung #a24e36, tím #6b4c80, nâu xám #7d6b5d, ngọc #1f7a8c | bản sáng hơn của từng màu |

**Đỏ (`--danger`) chỉ dành cho khẩn cấp và cảnh báo an toàn thật** (viên "Khẩn cấp", `.review-warn`, vòng đỏ quanh mục đang rà soát). Hổ phách (`--warn-*`) chỉ cho "chưa kiểm chứng". Đo tương phản WCAG 2.x trên token: chữ thân ≥ 14:1, chữ phụ ≥ 5,6:1, chữ trên tone ≥ 4,7:1 (trên thẻ), mọi cặp chip/huy hiệu ≥ 5,5:1, ở cả hai theme; viền ô nhập ≥ 3,6:1.

## Trang chủ = bản đồ
- **Dữ liệu**: `src/pages/graph.json.ts` sinh `graph.json` lúc build từ nội dung thật; bố cục tính sẵn bằng `tools/graph/layout.mjs` (hàm thuần, xác định; test: `node --test tools/graph/test/layout.test.mjs`). Mỗi chương là một đĩa: nút chương ở tâm, các mục xếp xoắn ốc hướng dương quanh nó; 36 đĩa gom quanh tâm nhóm rồi đẩy nhau ra; 10 tình huống (lục giác) ở vành ngoài theo hướng trọng tâm các mục nó nối tới. Cạnh: chương→mục (màu nhóm), mục↔mục (`related`), tình huống→mục (`situations`). ~180 KB (gzip ~68 KB), tải trễ sau khi trang đã hiện.
- **Vẽ**: canvas 2D trong `src/scripts/map/view.ts`: kéo, lăn chuột phóng thu, chụm hai ngón, phím `+` `-` `0` và mũi tên khi canvas có focus; tìm nút gần con trỏ bằng lưới băm; nhãn chỉ cho chương (tránh chồng) và nút đang chọn/rê; nút "thở" nhẹ, tắt hẳn khi `prefers-reduced-motion`. Vòng đỏ = mục `needs-*-review`; mục đã đọc/đã làm (`cnst:state:v1`) mờ đi kèm chấm nhỏ. Chú giải dưới trái bấm được để làm mờ các nhóm khác.
- **Bảng trượt từ phải** (`src/scripts/home.ts`): bấm chương/tình huống/thẻ bộ sưu tập → bảng thông tin 400px (mô tả, số liệu thật, "Bắt đầu từ đầu", danh sách mục kèm chip chi phí và trạng thái); bấm mục → bảng đọc ~58vw (tối đa 760px) nạp `<article>` từ trang tĩnh `/muc/<id>/` bằng `fetch`, nên có đúng huy hiệu kiểm chứng, khối đỏ `.review-warn` đứng trước `tldr`/`steps`, không ô tick ở mục `needs-*`, ô tick ở mục đã soạn lại, nút đánh dấu. `history.pushState` tới URL thật (`/muc/<id>/`, `/chuong/<n>/`, `/tinh-huong/#slug`, `/chuong/#nhom-slug`, `/#tinh-huong`…); Back/Forward đúng, Esc đóng và trả focus, F5 mở đúng trang tĩnh.
- **Không cần JS, không cần bản đồ**: mọi trang tĩnh giữ nguyên đường dẫn. Trang chủ tắt JS vẫn có tiêu đề, số liệu, thẻ bộ sưu tập (liên kết neo), tình huống, nhóm chương, việc làm ngay, khẩn cấp. Nút **Mục lục** (ngăn kéo Nhóm → Chương → Mục, dựng từ `graph.json`, bàn phím đầy đủ) là đường vào thay thế; không JS nó là liên kết tới `/chuong/`. Canvas có `aria-label` mô tả và liên kết "Bỏ qua bản đồ, mở Mục lục".
- **Điện thoại (≤ 760px)**: trang chủ là danh sách (tiêu đề, ô tìm, số liệu, thẻ, tình huống, nhóm, khẩn cấp); bản đồ là một màn hình riêng mở bằng "Mở bản đồ" (`#ban-do` trong lịch sử); bảng thông tin là ngăn kéo từ dưới lên, bảng đọc toàn màn hình.
- **Khẩn cấp luôn thấy**: viên đỏ "Khẩn cấp 115 · 113 · 114" ở thanh trên mọi trang, bấm mở danh sách `tel:` từ `data/hotlines.json`.

## Thanh trên và chân trang
Các viên kính (`rgba` 88% + blur): logo `[[ cẩm nang sinh tồn ]]` (mono, chữ cuối màu nhấn), "Mục lục", ô tìm với phím tắt `/`, liên kết, viên khẩn cấp, đổi theme. Từ 64rem một hàng; dưới đó nút menu mở bảng thả xuống (`aria-expanded`, Esc đóng, rời thanh thì đóng). Thanh thông báo mảnh "Chưa có chuyên gia duyệt" vẫn ở đầu mọi trang; chân trang nhắc lại đầy đủ.

## Trang mục và các trang khác
Một hàng trạng thái dưới tiêu đề (chip chi phí, bằng chứng, đáng làm, huy hiệu kiểm chứng; chip có giải thích là `<details data-pop>`); 2 cột từ 64rem (cột đọc 68ch + cột phụ dính), 1 cột trên điện thoại; tiêu đề phần có đường kẻ mảnh phía trên; `steps` có số lớn và ô tick lớn; căn cứ pháp luật là accordion; in sạch (`print.css`). Nút "Mở bản đồ" (`/?n=<id>`) đưa về bản đồ và phóng tới nút đó.

## Thêm hoặc đổi nhóm chương
Sửa `data/chapter-groups.json`: mỗi nhóm có `slug`, `title`, `description` một dòng, `icon` (tên trong `src/components/icons/paths.ts`), `tone` (1 đến 7, màu `--tone-N`) và `chapters`. Mỗi chương 1 đến 36 phải nằm đúng một nhóm; chương chưa xếp rơi vào nhóm "Khác" kèm cảnh báo lúc build. Nhóm thứ 8 trở lên cần thêm `--tone-8` vào `tokens.css` và `view.ts` (đọc `--tone-1..7`). Tình huống lấy từ `data/situations.json` (chỉ hiện tình huống đã có mục); icon theo slug ở `SITUATION_ICONS` (`src/lib/site.ts`).

## Icon
SVG nét đơn sắc kiểu Lucide, lưới 24, nét 1,6, `currentColor`, không emoji. Một nguồn: `src/components/icons/paths.ts`; `Icon.astro` chỉ phát `<use href="…/icons.svg#tên">`, sprite do `src/pages/icons.svg.ts` sinh từ cùng bảng.
