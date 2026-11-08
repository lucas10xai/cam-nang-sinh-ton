# Công cụ kiểm chứng (`tools/verify`)

Áp dụng giao thức `docs/EDITORIAL.md` §3 bằng máy: băm nội dung mục, kiểm báo cáo YAML, rồi áp kết quả lên `verification` của mục. Chỉ dùng Node built-in + `yaml`. Không gọi mạng.

## Quy trình

1. Người kiểm chứng (agent khác người soạn) kiểm mục, rồi lấy hash: `node tools/verify/hash.mjs content/entries/<chương>/<mục>.md`.
2. Viết báo cáo `docs/verification/<chương>/<id>.yml` theo khuôn EDITORIAL §3, **kèm** `content_sha256: <hash>` (ngay dưới `checked_at`).
3. `node tools/verify/lint-report.mjs` để kiểm khuôn.
4. Chief of Staff: `node tools/verify/apply.mjs` (dry-run) đọc bảng, rồi `--write` để ghi.
5. Sửa mục sau khi kiểm → hash đổi → báo cáo cũ bị từ chối ("lạc hậu"); kiểm lại và ghi hash mới.

## `hash.mjs`

```bash
node tools/verify/hash.mjs <file mục.md>          # in đúng hash (64 hex)
node tools/verify/hash.mjs a.md b.md              # "<hash>  <file>" mỗi dòng
```

`content_sha256` = SHA-256 của: JSON của frontmatter **trừ khối `verification`** (khóa sắp xếp, nên đổi thứ tự khóa/định dạng YAML không đổi hash) + `\n---\n` + thân (CRLF chuẩn hóa thành LF, không cắt khoảng trắng). Ghi `verification` không làm đổi hash.

## `lint-report.mjs`

```bash
node tools/verify/lint-report.mjs                       # mọi docs/verification/**/*.yml
node tools/verify/lint-report.mjs docs/verification/19-…/<id>.yml
```

Tùy chọn: `--content DIR` (mặc định `content/`), `--reports DIR`. Exit 1 nếu có lỗi.

| Mức | Nội dung |
|---|---|
| error | YAML hỏng; `id` thiếu hoặc không tồn tại trong content; `checker`, `checked_at` (YYYY-MM-DD), `result` (pass / pass-with-edits / fail); thiếu hoặc sai `content_sha256`; `claims` rỗng; mỗi claim cần `text`, `source_url` http(s), `verdict` hợp lệ, `quote` không rỗng khi `match`/`match-secondary`; `internal_checks` phải là danh sách với `severity` error/warn; `validity.doc` và `validity.in_force` ∈ {true, false, `unconfirmed`}; `potential_harm`/`suggested_edits`/`deliberate_vn_deviation` nếu có phải là danh sách |
| warn | hash ≠ hash hiện tại của mục (lạc hậu); khóa lạ; tên file ≠ `id`; thiếu `validity.basis` hoặc `potential_harm`; `result: pass` mà có claim không phải `match` |

## `apply.mjs`

```bash
node tools/verify/apply.mjs                  # dry-run (mặc định): in bảng thay đổi dự kiến, không ghi gì
node tools/verify/apply.mjs --write          # ghi verification.* vào frontmatter
node tools/verify/apply.mjs --json           # kết quả máy đọc
node tools/verify/apply.mjs --content DIR --reports DIR --allow-imported
```

Một báo cáo chỉ được xét nếu: lint không có error, `content_sha256` khớp hash hiện tại của mục, và mục `rewrite_status: rewritten` (trừ `--allow-imported`). Báo cáo bị loại được liệt kê cùng lý do (thiếu hash, lạc hậu...); công cụ **không** tự thêm hash cho báo cáo cũ.

Với mỗi mục, chỉ báo cáo mới nhất của mỗi `checker` được tính:

| Điều kiện | Kết quả |
|---|---|
| Có báo cáo `result: fail` hoặc `potential_harm` không rỗng | `needs-medical-review` nếu chương ∈ {13, 16, 20, 24, 27, 34} hoặc `validity.doc` nhắc AHA/ERC/WHO/CDC/NHS/Bộ Y tế; ngược lại `needs-legal-review`. Thắng mọi báo cáo `pass` |
| Báo cáo `result: pass`, mọi claim `match`, `in_force: true`, không `internal_checks` mức error, không `potential_harm` | `source-checked` |
| ≥ 2 báo cáo như trên của ≥ 2 `checker` khác nhau, cùng hash | `cross-checked` |
| Còn lại (có `partial`/`inference`/`mismatch`/`not-found`/`unreachable`/`match-secondary`, `in_force` ≠ true, `pass-with-edits`) | giữ nguyên; liệt kê lý do |

- `pass-with-edits` không nâng: nó nghĩa là còn việc sửa, nên sửa mục rồi kiểm lại (hash mới).
- **Không bao giờ** đặt `expert-reviewed`, không đụng mục đã `expert-reviewed`, không hạ `source-checked`/`cross-checked` xuống thấp hơn do báo cáo pass (chỉ báo cáo fail/harm mới đặt `needs-*-review`).
- `cross-checked` hiện không giới hạn theo chương (EDITORIAL §3 khuyến nghị cho chương rủi ro cao: do người điều phối quyết định kiểm hai lượt).
- Ghi `verification.status`, `checked_at` (ngày báo cáo mới nhất), `checker` (nối bằng ` + ` khi cross), `scope`, `sources` (các `source_url` duy nhất). Với `needs-*`, `sources` giữ nguyên.
- Ghi file: chỉ thay phần giá trị của khối `verification` (giữ kiểu flow `{...}` hoặc block của file gốc; `checked_at` có nháy kép). Mọi byte khác giữ nguyên; công cụ tự kiểm lại sau khi dựng và hủy nếu phần ngoài `verification` có thể đã đổi. File dùng CRLF bị từ chối (không ghi). Chạy lại `--write` là idempotent.
- Việc `potential_harm` chưa xử lý chặn công bố là việc của quy trình/trang (EDITORIAL §3); `apply` chỉ đặt `needs-*-review`.

## Test

```bash
node --test tools/gate/test/*.test.mjs tools/verify/test/*.test.mjs
```

Test dùng bản sao mục trong thư mục tạm; không ghi vào `content/` thật.
