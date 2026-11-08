# Quy trình biên tập và kiểm chứng

Áp dụng cho mọi mục từ Pha 1. Mục tiêu: **đọc dễ** (người dân bình thường) và **đúng** (truy được về văn bản gốc). Không có chuyên gia duyệt, nên bản thân quy trình phải chặt.

## 1. Vai trò (không được gộp)

| Vai trò | Làm gì | Không được làm |
|---|---|---|
| **Phân loại** | Gán `vn_class`: `universal` (khoa học phổ quát), `adapted` (cần chỉnh theo VN), `vn_native` (chỉ có ở VN), hoặc đề xuất **bỏ** mục nếu chỉ đúng ở Trung Quốc | Sửa nội dung |
| **Soạn lại** | Viết `tldr`, `steps`, tách "Pháp luật Việt Nam" thành các khẳng định ngắn có tham chiếu; điền `legal_refs` | Tự đặt `verification.status` cao hơn `unverified` |
| **Kiểm chứng** | Agent **khác** người soạn. Mở nguồn thật, đối chiếu từng khẳng định | Sửa lời soạn. Chỉ ghi kết quả và đề xuất sửa |
| **Nghiệm thu** (Chief of Staff) | Chạy cổng, đọc mẫu ngẫu nhiên, quyết định nhận/trả | Bỏ qua cổng |

## 2. Định dạng mục sau khi soạn lại (`rewrite_status: rewritten`)

Thứ tự hiển thị, từ trên xuống. Người đọc dừng ở lớp nào cũng đã nhận được giá trị.

1. **`tldr`** (frontmatter): 1-2 câu, nêu *việc cần làm hoặc kết luận*, có con số quan trọng nhất. Không thuật ngữ pháp lý chưa giải nghĩa.
2. **`steps`** (frontmatter): 2-6 bước hành động, mỗi bước một câu mệnh lệnh, có "ai/ở đâu/trong bao lâu" khi luật quy định thời hạn hoặc cơ quan.
3. **Thân**: `## Nói dễ hiểu`, `## Chi phí`, `## Lợi ích`, `## Pháp luật Việt Nam`, `## Ghi chú`, `## Nguồn`.
4. **Pháp luật Việt Nam**: danh sách gạch đầu dòng, **mỗi gạch một khẳng định** + trích dẫn cuối dòng dạng `(Điều 98 khoản 1, BLLĐ 45/2019/QH14)`. Cấm đoạn văn dài hơn ~120 chữ. Mọi con số tiền/ngày/tỷ lệ phải có trong một gạch kèm điều khoản.

Mỗi khẳng định pháp lý trong thân phải khớp một phần tử `legal_refs` (`doc`, `article`, `url`, `effective_from`, `checked_at`).

## 3. Giao thức kiểm chứng

Kiểm chứng viên nhận: mục đã soạn (file) + danh sách URL nguồn. Phải thực hiện:

1. **Mở từng URL nguồn thật** (không dựa vào trí nhớ). Nếu không mở được, ghi `unreachable`, KHÔNG suy diễn.
   - **Nguồn chính = bản trích được chữ.** Nếu bản PDF ở mục Nguồn là ảnh quét hoặc trang Công báo chỉ trả khung, dùng link tải (PDF/DOCX) ngay trong trang Công báo, hoặc vbpl.vn. Bản sao thứ cấp (thuvienphapluat, lawplayer…) chỉ để định vị; khẳng định chỉ dựa vào đó đặt verdict `match-secondary`, không phải `match`.
   - Nguồn quốc tế bị chặn (403): cho phép bản gương cùng tiêu đề/DOI, ghi rõ vào `note`.
   - Trích bản tiếng Anh: giữ nguyên văn gốc trong `quote`, ghi số khuyến nghị/mục, thêm tóm tắt tiếng Việt vào `note`.
2. Với **mỗi khẳng định pháp lý/số liệu** (tối đa 15 khẳng định quan trọng nhất mỗi mục, ưu tiên con số, thời hạn, mức phạt, điều kiện): trích **nguyên văn** câu trong nguồn làm bằng chứng. Verdict:
   `match` (khớp nguyên văn) · `match-secondary` (chỉ khớp qua bản sao thứ cấp) · `partial` (đúng ý nhưng thiếu điều kiện/ngoại lệ có thể gây hiểu sai) · `inference` (diễn giải/suy ra, không phải chữ của nguồn) · `mismatch` (sai) · `not-found` · `unreachable`.
   Chỉ `match` được tính là đạt. `partial`/`inference` buộc sửa lời hoặc gắn nhãn "suy ra từ…".
3. Kiểm **hiệu lực**: văn bản còn hiệu lực chưa, có bị sửa/thay thế sau không (Công báo, vbpl.vn). Trang để trống ô hiệu lực: ghi `in_force: unconfirmed` và nêu dấu hiệu thấy được. **Không** tự kết luận "còn hiệu lực" chỉ vì không thấy văn bản thay thế. Hướng dẫn y tế (AHA/ERC/Bộ Y tế) không có "ngày hiệu lực": ghi năm ban hành và có hướng dẫn mới hơn không; nếu nguồn VN lệch nguồn quốc tế, ghi vào `deliberate_vn_deviation`.
4. Kiểm **nội bộ**: con số trong `tldr`/`steps` có trong "Pháp luật Việt Nam"/"Lợi ích"; các con số trong cùng mục có mâu thuẫn nhau không (ghi vào `internal_checks`, không lẫn với `claims`).
5. Với **y tế**: nguồn phải là hướng dẫn của Bộ Y tế, WHO, CDC, AHA/ERC, NHS hoặc nghiên cứu có DOI; không chấp nhận báo/blog. Lời khuyên hành động phải kiểm cả **điều kiện đi kèm** (ví dụ "nền chắc nếu không làm chậm ép tim"), không chỉ con số. Ghi riêng bước nào có thể gây hại nếu làm theo nguyên văn bản nháp.
6. Xuất báo cáo YAML theo khuôn dưới, đặt ở `docs/verification/<chapter>/<id>.yml`.

```yaml
id: lam-them-gio-…
checker: agent-<tên>
checked_at: 2026-11-08
result: pass | pass-with-edits | fail
claims:
  - text: "Làm thêm ngày thường ít nhất 150%"
    source_url: https://…
    quote: "…nguyên văn…"
    verdict: match | match-secondary | partial | inference | mismatch | not-found | unreachable
    note: ""
internal_checks:            # mâu thuẫn số liệu/độ nhất quán trong chính mục
  - issue: "…"
    severity: error | warn
validity:
  doc: "BLLĐ 45/2019/QH14"
  in_force: true | false | unconfirmed
  effective_from: "2021-01-01"
  amended_by: []
  basis: "bằng chứng cho in_force (trang nào, dấu hiệu gì)"
deliberate_vn_deviation: []  # chỉ y tế: nguồn VN lệch nguồn quốc tế
potential_harm: []           # bước có thể gây hại nếu làm theo nguyên văn
suggested_edits: []
```

**Quy tắc nâng trạng thái** (chỉ do Chief of Staff áp dụng, dựa trên báo cáo):
- Mọi khẳng định `match` + `in_force: true` + `internal_checks` không còn `error` → `source-checked`.
- Có `mismatch`/`not-found`/`unreachable`/`partial`/`inference`/`match-secondary`, hoặc `in_force: unconfirmed` → giữ nguyên trạng thái, sửa mục rồi kiểm lại, hoặc đặt `needs-legal-review` / `needs-medical-review`.
- Có `potential_harm` chưa xử lý → không được công bố mục đó, bất kể trạng thái.
- `cross-checked` cần hai báo cáo độc lập cùng `pass`. Chỉ dùng cho chương rủi ro cao (13 cấp cứu, 8, 9, 19).
- `expert-reviewed` chỉ khi có người thật có tên đồng ý. Tuyệt đối không do agent đặt.

**Bằng chứng từ đợt thử (2026-11-08, 3 mục):** 35/40 khẳng định khớp nguyên văn (mục 19-01: 12/15, mục 19-02: 13/13, mục 13-01: 10/12). Vẫn tìm ra lỗi thật ở cả 3 mục: thiếu bậc phạt; câu không có trong luật; mâu thuẫn số liệu nội bộ; câu cấp cứu viết vô điều kiện có thể làm chậm ép tim; nguồn Bộ Y tế dẫn đã lệch hướng dẫn quốc tế. Mục tiêu của bước này chính là bắt các lỗi đó trước khi công bố. Khoảng 10 phút/mục/agent.

## 4. Chương rủi ro cao

Sai thì gây hại thật, nên bắt buộc cross-check hai lượt và đọc mẫu thủ công trước khi công bố: **13** (cấp cứu), **16/24/34** (y tế, thuốc), **20/27** (thai sản, trẻ sơ sinh), **8/9/11** (pháp luật hình sự và tài sản), **19** (lao động/BHXH), **36** (giao thông). Với 13: mọi bước sơ cứu phải khớp AHA/ERC và hướng dẫn Bộ Y tế, đối chiếu từng bước.

## 5. Cập nhật

`legal_refs[].checked_at` cũ hơn 180 ngày thì cổng báo `stale`. Mỗi quý chạy lại kiểm hiệu lực cho toàn bộ văn bản được dẫn. Khi văn bản đổi: sửa `data`/mục, đặt lại `verification.status` về `unverified` cho mục bị ảnh hưởng, ghi lý do vào lịch sử thay đổi.
