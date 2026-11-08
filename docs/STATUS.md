# Trạng thái dự án (cập nhật 2026-11-08)

Trang: <https://lucas10xai.github.io/cam-nang-sinh-ton/> (noindex). Repo: <https://github.com/lucas10xai/cam-nang-sinh-ton>.
Chưa đặt tên miền `2k.io.vn` (xem `docs/DEPLOY.md`). **Chưa bật lập chỉ mục** (`SITE_INDEXABLE=false`).

## Đã có

- 785 mục / 36 chương (nháp từ quangpao, nhánh `vi`), site Astro tĩnh, tìm kiếm không dấu, lọc, tình huống, đánh dấu đã làm (localStorage).
- Cổng chất lượng (`pnpm gate`), công cụ băm/lint/áp dụng báo cáo kiểm chứng (`tools/verify`), CI + GitHub Pages.
- 141 mục (chương 5, 13, 14, 19, 36) đã **soạn lại** theo `docs/PHASE1.md`, **kiểm chứng độc lập** (`docs/verification/`), **sửa** theo `docs/FIX.md`.

## Số liệu kiểm chứng (đừng làm tròn thành "đã kiểm chứng")

| | Vòng 1 (trước sửa) | Vòng 2 R2 (sau sửa, 24/49 mục chương 13) |
|---|---|---|
| Khẳng định khớp nguyên văn | 603/1178 = 51% | 232/298 = 78% |
| Mục có `potential_harm` | 74 báo cáo (chương 13) | **6/24 mục vẫn còn** |
| Mục đạt `pass` | 0 | 0 |

Kết luận: một vòng sửa giảm mạnh lỗi nhưng **chưa đủ** cho chương cấp cứu. Chưa mục nào đạt `source-checked` sau sửa. Trang hiển thị 50 mục `needs-*-review` kèm cảnh báo đỏ.

## Việc còn lại, theo thứ tự

1. **R2 cho phần còn lại:** chương 13 mục 21-49 (chưa chạy do giới hạn API), chương 14, 19, 36, 5. Dùng `r2Task` mẫu: kiểm chứng viên mới, độc lập, ghi vào `docs/verification/<chương>/r2/`. Mục có `potential_harm` hoặc `internal_checks` error → sửa lần 2 rồi R3. Mục `pass` → `node tools/verify/apply.mjs --write`.
2. Chương 13: số cấp cứu 113/114/115 chưa thống nhất (mục 49 nêu 113 từ 01/11/2026 theo TT 42/2026/TT-BYT). Cần người quyết định cách ghi chung; chưa có nguồn gốc chính thống đọc được cho giai đoạn chuyển tiếp ngoài một bài của UBND TP.HCM.
3. Mâu thuẫn số liệu giữa các mục chương 5 (lãi tiết kiệm 5,2% / 5,4% / 5,9%): mục 06 đã đổi 5,40% (nguồn thứ cấp), mục 07 chưa.
4. Nghị định 145/2020: chưa xác nhận hiệu lực từng điều (nhiều mục chương 19 dẫn). Cần người đọc văn bản gốc.
5. 644 mục còn lại (21 chương khác + chương 1-4, 6-12, 15-18, 20-35) vẫn là bản nháp `unverified`. Đừng bật lập chỉ mục khi chưa xử lý chúng, hoặc phải giữ nhãn "Chưa kiểm chứng" rõ trên từng mục (đã có).
6. Cần chuyên gia thật (luật sư, bác sĩ) cho chương 13, 19, 36 trước khi công bố rộng. Không agent nào được đặt `expert-reviewed`.

## Bài học vận hành

- **Giới hạn tốc độ API:** phát 43 agent cùng lúc làm ~30 agent chết (429, chờ khoảng 2 giờ). Giữ **tối đa 8 agent đồng thời**, phát bổ sung khi có agent xong. Hai lần chạm 429 đều khi ≥ 30 agent chạy cùng lúc.
- Báo cáo kiểm chứng ghi vào đĩa trước khi agent chết nên không mất; chỉ cần phát lại phần thiếu (`/tmp/missing.json` mẫu tính từ danh sách mục và `docs/verification/`).
- Agent sửa mục có xu hướng để "việc còn treo" (`Cần nguồn…`, `theo báo cáo kiểm chứng`) vào thân mục. Quét bằng `grep -rE 'báo cáo kiểm chứng|Cần nguồn|Còn treo|sổ kiểm chứng' content/entries` sau mỗi đợt sửa, và đưa vào `docs/FIX.md` nếu tái diễn.
- Nhiều PDF văn bản ký số trên `datafiles.chinhphu.vn` là ảnh quét (không trích được chữ): dùng DOCX/PDF chữ ngay trên trang `congbao.chinhphu.vn`, hoặc OCR (macOS Vision) và ghi rõ trong `note`.
