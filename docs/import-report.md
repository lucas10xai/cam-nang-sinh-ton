# Báo cáo nhập bản nháp

File này do `node tools/import/run.mjs` sinh ra; đừng sửa tay.

Nguồn: `_ref/vi-quangpao` (nhánh `vi`, commit `e25fd89` lúc nhập), thư mục `book/`.

## 1. Số lượng

- Chương nhập: **36** / 36 file trong `book/`.
- Mục nhập: **785** / 785 tiêu đề `### N.` trong `book/` / 785 mục trong `data/entries.json`. Không chênh lệch: mỗi mục nguồn thành đúng một file, id và nhãn `legacy` khớp `data/entries.json`.
- Con số "≈785" trong yêu cầu khớp đúng 785.
- Mục có phần "Pháp luật Việt Nam": 464.
- Chương 35 và 36 là chương mới của bản quangpao (không có trong bản gốc tiếng Trung/luonglb).

| Chương | Tiêu đề | Mục nguồn | Mục nhập | origin.zh | origin.luonglb |
| --- | --- | --- | --- | --- | --- |
| 1 | Đừng chết sớm | 49 | 49 | 24 | 24 |
| 2 | Đừng để bản thân chết mòn | 47 | 47 | 2 | 2 |
| 3 | Đừng lãng phí sức lực | 27 | 27 | 2 | 2 |
| 4 | Đừng lãng phí thời gian | 18 | 18 | 3 | 3 |
| 5 | Đừng lãng phí tiền | 50 | 50 | 0 | 0 |
| 6 | Danh sách những thứ trông rẻ mà không có tác dụng | 35 | 35 | 3 | 3 |
| 7 | Không có tiền thì sống thế nào | 23 | 23 | 1 | 1 |
| 8 | Đừng tự chuốc họa vào thân: pháp luật và tài sản | 46 | 46 | 0 | 0 |
| 9 | Ranh giới pháp luật người thường dễ vấp | 29 | 29 | 0 | 0 |
| 10 | Yêu và kết hôn có đáng không | 23 | 23 | 3 | 3 |
| 11 | Những lằn ranh đỏ mà người làm kỹ thuật hay vấp | 21 | 21 | 0 | 0 |
| 12 | Kinh doanh nhỏ: mở, vận hành, đóng cho đúng luật | 28 | 28 | 0 | 0 |
| 13 | Cấp cứu: những phút quyết định | 49 | 49 | 0 | 0 |
| 14 | Những tài khoản và dữ liệu của bạn | 12 | 12 | 0 | 0 |
| 15 | Thuê và mua nhà | 18 | 18 | 0 | 0 |
| 16 | Bệnh mạn tính: sống tiếp thế nào | 14 | 14 | 0 | 0 |
| 17 | Trong nhà có người cao tuổi | 12 | 12 | 0 | 0 |
| 18 | Nuôi con: tiền bạc và thời gian | 7 | 7 | 0 | 0 |
| 19 | Đang làm, nghỉ việc, và tai nạn lao động | 25 | 25 | 0 | 0 |
| 20 | Chăm trẻ sơ sinh: mười bảy việc có mốc kiểm được | 17 | 17 | 0 | 0 |
| 21 | Ra nước ngoài: giấy tờ, tiền, và chỗ dựa khi có chuyện | 13 | 13 | 0 | 0 |
| 22 | Nghỉ ngơi và giải trí: chỗ nào an toàn, cách nào hạ được căng thẳng | 13 | 13 | 5 | 5 |
| 23 | Học gì thì đáng: trường nghề, chứng chỉ, và cách học | 25 | 25 | 2 | 2 |
| 24 | Đi khám: đúng cấp, đúng giấy, và không phải đưa phong bì | 15 | 15 | 0 | 0 |
| 25 | Người mất rồi thì phải làm gì | 12 | 12 | 0 | 0 |
| 26 | Dựng một website hay nền tảng | 13 | 13 | 0 | 0 |
| 27 | Mang thai và sinh đẻ | 20 | 20 | 0 | 0 |
| 28 | Đừng vì ngoại hình mà phá sức khỏe | 10 | 10 | 5 | 5 |
| 29 | Ứng phó sau cú sốc lớn | 14 | 14 | 5 | 5 |
| 30 | Con đi học rồi | 21 | 21 | 2 | 2 |
| 31 | Sau 18 tuổi có mấy đường | 17 | 17 | 0 | 0 |
| 32 | Đi du học | 12 | 12 | 1 | 1 |
| 33 | Sau khi khuyết tật | 21 | 21 | 4 | 4 |
| 34 | Thuốc trong nhà: đừng để phản tác dụng | 14 | 14 | 6 | 5 |
| 35 | Bão, lũ và muỗi: việc cần làm trước, trong và sau | 10 | 10 | 0 | 0 |
| 36 | Xe máy và đường phố: những quy định hay bị hiểu sai | 5 | 5 | 0 | 0 |

## 2. Bảng ánh xạ nhãn (nguồn -> enum SPEC)

Tập nhãn thật trong dữ liệu (đếm số mục). Nhãn ngoài bảng này làm importer dừng với lỗi.

| Nhãn nguồn -> giá trị | Số mục |
| --- | --- |
| lợi-ích=lớn -> large | 431 |
| lợi-ích=nhỏ -> small | 4 |
| lợi-ích=vừa -> medium | 350 |
| thời-gian=0 -> 0 | 16 |
| thời-gian=ít -> low | 510 |
| thời-gian=nhiều -> high | 78 |
| thời-gian=vừa -> mid | 181 |
| thước-đo=khác -> other | 78 |
| thước-đo=mắc-bệnh -> other | 47 |
| thước-đo=tai-nạn -> other | 11 |
| thước-đo=tàn-tật -> other | 5 |
| thước-đo=thời-gian -> time | 125 |
| thước-đo=tiền -> money | 316 |
| thước-đo=triệu-chứng -> other | 38 |
| thước-đo=tử-vong -> mortality | 165 |
| tiền=0 -> 0 | 448 |
| tiền=ít -> low | 257 |
| tiền=nhiều -> high | 80 |
| ý-chí=có -> mid | 407 |
| ý-chí=ít -> low | 221 |
| ý-chí=không -> 0 | 157 |

Quyết định lệch/diễn giải SPEC (cần Site/Gate biết):

- `lợi-ích=nhỏ` (4 mục) -> `benefit: small`. SPEC chỉ có `large | medium`; ép về `medium` sẽ làm công thức "mức đáng làm" cho kết quả khác bản gốc, nên `schema/entry.mjs` thêm giá trị `small` (BENEFITS). Mục `small` luôn có mức đáng làm `medium` (trung bình) theo `README.md` của quangpao.
- Chi phí: bản nháp có 3 mức cho mỗi loại, SPEC có 4 (`0|low|mid|high`). `tiền`: 0/ít/nhiều -> `0/low/high` (không dùng `mid`); `ý-chí`: không/ít/có -> `0/low/mid` (không dùng `high`); `thời-gian`: 0/ít/vừa/nhiều -> `0/low/mid/high`. Trọng số gốc của quangpao (`tools/lib/book.mjs`: COST_W) để Site đối chiếu công thức: tiền {0:0, low:1, high:2}; thời gian {0:0, low:0, mid:1, high:2}; ý chí {0:0, low:1, mid:2}; mức đáng làm gốc: lợi ích lớn -> tổng 0 = rất cao, tổng ≤ 2 = cao, còn lại trung bình; lợi ích vừa và tổng 0 = cao, còn lại trung bình. Lưu ý: công thức này lệch công thức chữ trong SPEC §5 ở chỗ "thời gian ít" nặng 0 và ngưỡng "không cao" là tổng ≤ 2.
- `thước-đo`: `mắc-bệnh`, `tai-nạn`, `triệu-chứng`, `tàn-tật` không có enum riêng trong SPEC và không có nhãn nào là `freedom` -> `other`, nhãn gốc giữ trong `tags` dạng `thuoc-do:mac-benh`...
- Nhãn `nhóm=…` (nhóm đối tượng, 18 mục) không có trong SPEC -> `tags` dạng `nhom:45-tuoi`.
- `contested`: nguồn không có cờ riêng; ghi chú "tranh luận" nằm trong câu văn. Quy tắc dùng: Ghi chú khớp `mục có tranh luận|^tranh luận|chỗ (?:có )?tranh luận|còn tranh luận|bị tranh luận|gây tranh luận` (không khớp các câu chỉ nhắc "tranh luận" theo nghĩa thường như "tranh luận mức phạt"). Kết quả: 13 mục (1-19, 1-20, 1-35, 1-39, 1-40, 1-44, 1-45, 1-47, 4-10, 6-3, 10-20, 22-13, 34-14).
- Trường "Mức bằng chứng" đi vào `evidence`, không lặp ở thân; thân dùng H2 cố định.

## 3. Tham chiếu chéo (`related`)

- Nguồn: mọi liên kết `#entry-<id>` (kể cả nhóm `"refs:id1,id2"`) trong các trường của mục, bỏ trùng, giữ thứ tự xuất hiện, bỏ liên kết trỏ về chính mục (0).
- Tổng số cạnh `related`: 211.
- Tham chiếu không phân giải được: **0**.
- Liên kết trong thân vẫn ở dạng nguyên văn của nguồn: `[mục N](NN-slug-chuong.md#entry-<id>)` hoặc có thêm `"refs:..."` (regex: `\]\([^)\s]*#entry-([a-z0-9-]+)(?:\s+"refs:([^"]*)")?\)`). Site cần viết lại các liên kết này sang URL nội bộ theo id.
- Lời mở đầu chương (`content/chapters/NN.md`) cũng giữ nguyên liên kết dạng đó.

## 4. Pháp luật và kiểm chứng

- `legal_refs` nạp từ `data/legal-references.json`: 2 tham chiếu (2-2 <- luat-09-2012-d11; 2-2 <- nd-90-2026-d24-k1). `effective_from` để `null`: nguồn chỉ có `versionLabel` dạng chữ, không có ngày hiệu lực có cấu trúc; `versionLabel`, `sourceLocation`, `verificationScope` của tham chiếu không có chỗ trong schema nên không nhập. `quote` và `checkedAt` giữ nguyên.
- Mục có phần "Pháp luật Việt Nam" (464) nhưng `legal_refs` rỗng: 463; Gate sẽ cảnh báo (warn) đúng theo SPEC §6.
- `verification` nạp từ `data/review-status.json`: 7 mục (1-3: source-checked; 2-8: source-checked; 7-2: needs-legal-review; 13-1: needs-medical-review; 13-15: needs-medical-review; 31-6: consistency-checked; 36-1: source-checked). `checker` để `null` (nguồn không ghi người/agent kiểm). Còn lại: `unverified`. Không nâng trạng thái nào.

## 5. Ánh xạ nguồn (`origin`)

- `origin.quangpao`: 785/785 (nhãn `legacy`).
- `origin.zh`: **68**/785 mục (8.7%); bản gốc tiếng Trung có 772 mục.
- `origin.luonglb`: **67**/785 mục (8.5%); luonglb có 767 mục với dòng `goc:` trỏ về mục zh.
- Phương pháp: luonglb -> zh tất định nhờ `<!-- goc: C.N -->`. quangpao -> zh không có bảng ánh xạ, suy ra từ bằng chứng; chỉ ghi khi hội đủ: (1) dùng chung ≥ 1 nguồn trích dẫn (DOI/URL chuẩn hóa), điểm = số nguồn chung rồi đến Jaccard, (2) cùng mức bằng chứng, cùng mức lợi ích và cùng 3 mức chi phí (tiền, thời gian, ý chí; `thời-gian=0` coi như `ít` vì zh không có mức 0), (3) cặp tốt nhất duy nhất của cả hai phía. 4 mục quangpao có nhiều ứng viên zh nên để `null`.
- Mục `null`: phần lớn là mục luật/chính sách Việt Nam, chương 35-36, hoặc mục đã được quangpao tổ chức lại/viết lại và đổi nguồn. `null` nghĩa là "chưa xác nhận được", không phải "chắc chắn không có gốc".
- Nhãn trong `origin.zh`/`origin.luonglb` dạng `chương-mục` theo đánh số của chính bản đó.

## 6. Phân bố

| Mức bằng chứng | Số mục |
| --- | --- |
| A | 129 (16.4%) |
| B | 545 (69.4%) |
| C | 111 (14.1%) |

| Lợi ích | Số mục |
| --- | --- |
| large | 431 |
| medium | 350 |
| small | 4 |

| Thước đo | Số mục |
| --- | --- |
| money | 316 |
| mortality | 165 |
| other | 179 |
| time | 125 |

| Chi phí | 0 | low | mid | high |
| --- | --- | --- | --- | --- |
| money | 448 | 257 | 0 | 80 |
| time | 16 | 510 | 181 | 78 |
| will | 157 | 221 | 407 | 0 |

## 7. Việc không làm khi nhập

- Không sửa chữ trong thân; không chuẩn hóa liên kết; `vn_class: unclassified`, `rewrite_status: imported`, `tldr: null`, `steps: []`, `situations: []`.
- Không nhập các khối "Ở Việt Nam" của luonglb (chỉ dùng luonglb/zh để ghi `origin`).
- Dữ liệu `reading-paths.json`, `entry-aliases.json`, `reader-index.json` của quangpao không nhập (ngoài phạm vi; `entry-aliases.json` trùng nhãn `legacy`).
