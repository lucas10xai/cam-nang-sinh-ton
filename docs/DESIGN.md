# Thiết kế giao diện

Tinh thần: **một cuốn sổ tay tử tế, ấm áp, đáng tin**. Không phải app công nghệ lạnh, cũng không phải báo cáo pháp lý khô. Sáng là mặc định (nền giấy ấm, chữ than đậm); tối theo `prefers-color-scheme` khi người đọc chưa chọn, nút trên đầu trang ghi đè và lưu ở `localStorage` (`cnst:theme`).

Mã nằm ở `src/styles/` (`tokens.css` token + phông, `base.css` nền tảng và chip/nút/thẻ, `layout.css` đầu/chân trang, `pages.css` từng loại trang, `print.css`). Mọi màu, cỡ chữ, khoảng cách, bo góc, bóng đều là custom property trong `tokens.css`; đừng gõ cứng giá trị trong CSS khác.

## Chữ
- **Be Vietnam Pro** (400, 700) cho thân bài và giao diện; **Noto Serif** (biến thiên 500 đến 700, đã cắt còn Latin và tiếng Việt, 40 KB) chỉ cho tiêu đề lớn và đoạn dẫn. Cả hai tự host trong `public/fonts`, giấy phép OFL (`OFL.txt`, `NotoSerif-OFL.txt`). Không CDN.
- Thang: `--fs-xs` 13px, `--fs-sm` 15px, `--fs-base` 17px (thân bài), `--fs-md` 19px, `--fs-lg` 22px, `--fs-xl` 28px, `--fs-2xl` (tiêu đề trang) và `--fs-3xl` (trang chủ) co giãn theo màn hình. Giãn dòng 1,75; độ rộng dòng `--measure` = 68ch.

## Màu (sáng / tối)
| Token | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `--bg` / `--surface` / `--surface-2` | #f6f1e6 / #fffcf5 / #eee7d6 | #1a1812 / #232019 / #2c2920 | nền, thẻ, nền phụ |
| `--text` / `--muted` | #231f18 / #5a5446 | #eee8da / #bab3a2 | chữ thân, chữ phụ |
| `--accent` (+ `-hover`, `-soft`, `-soft-fg`, `-fg`) | #1d5c49 | #6dcbac | màu nhấn chủ đạo: xanh lá đậm / xanh ngọc |
| `--warm` (+ `-soft`, `-fg`) | #a35a24 | #e0a06b | màu ấm phụ: gạch chân, thanh nhấn tiêu đề phần |
| `--warn-*` | hổ phách | hổ phách tối | **chỉ** cho "chưa kiểm chứng" |
| `--danger-*` | đỏ #b3261e | đỏ nhạt | **chỉ** cho khẩn cấp và cảnh báo an toàn thật (mục đang rà soát, số 115/113/…) |

Đã đo tương phản (WCAG 2.x) trên token: chữ thân trên `bg`/`surface` ≥ 13:1, chữ phụ ≥ 5,9:1, mọi cặp chữ/nền của chip, huy hiệu, nút ≥ 5,5:1 ở cả hai theme; viền ô nhập ≥ 3:1.

## Khoảng cách, bo góc, bóng
`--s1` 4px đến `--s8` 72px (bội của 4 và 8); `--radius-sm` 8, `--radius` 12, `--radius-lg` 20, `--radius-pill`; `--shadow` (thẻ) và `--shadow-lg` (nổi, popover).

## Icon
SVG nét đơn sắc kiểu Lucide, lưới 24, nét 1,6, màu `currentColor`; **không emoji**. Một nguồn: `src/components/icons/paths.ts`. `Icon.astro` chỉ phát `<use href="…/icons.svg#tên">`; sprite `icons.svg` do `src/pages/icons.svg.ts` sinh từ cùng bảng này (giữ HTML mỗi trang nhẹ). Thêm icon: thêm một dòng vào `iconPaths`.

## Nguyên tắc về độ tin cậy (không đánh đổi vì giao diện)
- Thanh thông báo mảnh, trung tính ở đầu mọi trang (`NOTICE_LEAD`/`NOTICE_MORE` trong `site.ts`) và đoạn đầy đủ ở chân trang.
- Trang mục có **một hàng trạng thái** dưới tiêu đề (chi phí, bằng chứng, đáng làm, huy hiệu kiểm chứng). Chip có giải thích là `<details class="pop">` (không cần JS; `pop.ts` chỉ thêm Esc/bấm ra ngoài).
- Mục `needs-medical-review` / `needs-legal-review`: khối `.review-warn` đỏ nổi bật đứng **trước** `tldr` và `steps`, không có ô tick, số cấp cứu lấy từ `data/hotlines.json`. Mục `unverified` chỉ có huy hiệu hổ phách và giải thích gập lại.
- Trong danh sách, trạng thái nhẹ là chấm màu + chữ; chỉ "đang rà soát" là huy hiệu đặc. Tiến độ kiểm chứng của chương luôn hiện, kể cả 0.

## Thêm hoặc đổi nhóm chương
Sửa `data/chapter-groups.json` (dữ liệu, không sửa .astro): mỗi nhóm có `slug`, `title`, `description` một dòng, `icon` (tên trong `paths.ts`) và `chapters` (số chương, theo thứ tự hiển thị). Mỗi chương 1 đến 36 phải nằm đúng một nhóm; chương chưa xếp rơi vào nhóm tự động "Khác" kèm cảnh báo lúc build. Số mục và "đã kiểm chứng" (đã đối chiếu nguồn trở lên, cùng cách tính với trang Phương pháp) lấy từ `data/status.json`.
Tình huống ở trang chủ lấy từ `data/situations.json` (chỉ hiện tình huống đã có mục); biểu tượng theo slug ở `SITUATION_ICONS` trong `src/lib/site.ts`.

## Bố cục chính
- Trang chủ: hero (tiêu đề serif, ô tìm lớn, gợi ý, khối khẩn cấp gọn bên phải), "Bạn đang gặp chuyện gì?" (lưới tình huống), chương theo nhóm, ghi chú trung thực, chân trang đầy đủ.
- Trang mục: tiêu đề + hàng trạng thái trải rộng; dưới đó 2 cột từ 64rem (cột đọc 68ch + cột phụ dính: mục lục, thông tin nhanh, đánh dấu, mục liên quan), 1 cột trên điện thoại.
- Menu: một hàng từ 60rem; dưới đó là nút mở bảng điều hướng (nút → `aria-expanded`, Esc đóng và trả focus, rời đầu trang cũng đóng). Không JS: danh sách liên kết hiện sẵn dưới thanh đầu.
- Chuyển động: chỉ hover, mở accordion/popover, đổi theme; tắt hết khi `prefers-reduced-motion`.
- In (`print.css`): ẩn menu, thanh bên, thanh thông báo, chân trang; mở sẵn accordion căn cứ pháp luật; liên kết ngoài in kèm địa chỉ.
