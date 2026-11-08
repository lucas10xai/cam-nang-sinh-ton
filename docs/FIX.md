# Bước SỬA MỤC theo báo cáo kiểm chứng

Mỗi mục đã có 1-2 báo cáo kiểm chứng độc lập (`docs/verification/<chương>/<id>.yml` = nhóm A, `.../b/<id>.yml` = nhóm B, chỉ chương 13 và 19). Bước này sửa **nội dung mục** để các lỗi đó biến mất. Sau đó mục phải được kiểm chứng lại (do agent khác), nên không tự nâng `verification.status`.

## Nguyên tắc (vi phạm = trả lại)

1. **Chỉ sửa theo bằng chứng trong báo cáo.** Mọi chữ mới liên quan khẳng định thực tế (con số, điều khoản, điều kiện, bước hành động) PHẢI lấy từ một `quote` hoặc `suggested_edits` có trích dẫn nguyên văn trong báo cáo. Không dùng trí nhớ, không mở web, không đọc `_ref/`. Nếu báo cáo chỉ nêu "thiếu điều kiện X" mà không có quote cho X: KHÔNG tự điền X. Thay bằng cách **bỏ khẳng định quá tay** hoặc **thu hẹp về đúng điều nguồn đã xác nhận**, và ghi vào báo cáo cuối "cần nguồn cho X".
2. **Ưu tiên thu hẹp hơn bổ sung.** Khẳng định bị `mismatch`/`not-found`/`inference`/`partial`: (a) sửa cho khớp quote; (b) nếu là suy luận hợp lý của người soạn: giữ nhưng gắn nhãn rõ "(suy ra từ <điều khoản>, không phải chữ của luật)"; (c) nếu không có cơ sở: bỏ. Không bao giờ giữ nguyên một khẳng định đã bị báo `mismatch`.
3. **`potential_harm` (y tế/cấp cứu): xử lý TRƯỚC.** Mỗi mục `potential_harm` phải được khử bằng một trong: thêm điều kiện an toàn có quote; đổi lời khuyên tuyệt đối thành lời khuyên có điều kiện; bỏ bước nguy hiểm; hoặc thêm câu rõ ràng "**Nếu có người cần cấp cứu thật: gọi cấp cứu trước.**" cùng số điện thoại đã có trong mục. Bước gọi cấp cứu (nếu có) phải đứng đầu `steps`, trừ khi nguồn xác nhận thứ tự khác.
4. **Hai nhóm A và B bất đồng:** lấy nhận định thận trọng hơn; nếu một bên `match` và bên kia `mismatch` cùng khẳng định thì khẳng định đó coi như chưa đạt (áp dụng nguyên tắc 2).
5. **Số liệu mâu thuẫn trong chương** (ví dụ cùng thứ nhưng hai mục ghi khác nhau, 113 vs 115): sửa cho khớp quote; nếu quote không phân xử được thì ghi cả hai kèm điều kiện nguồn nêu, không tự chọn.
6. Xóa mọi **chữ rò rỉ nội bộ** khỏi thân mục và `steps`/`tldr`: "theo báo cáo kiểm chứng", "bản nháp", "[INFERENCE]" (đổi thành nhãn "suy ra từ …"), "Còn treo", "sổ kiểm chứng", chữ gạch lỗi như `n==ắm`. Giữ nguyên đoạn nào thuộc phần lập luận về hạng bằng chứng ("chưa lên A vì …") ở Ghi chú nếu nó vẫn đúng.
7. **Không đổi:** `id`, `legacy`, `chapter`, `number`, `evidence`, `cost`, `benefit`, `metric`, `contested`, khối `verification`, `origin`, `related`. `title` chỉ sửa khi báo cáo chỉ ra tiêu đề tự mâu thuẫn hoặc sai pháp lý; khi đó giữ `id`.
8. Giữ định dạng PHASE1: đoạn ≤ 110 chữ, "Pháp luật Việt Nam" là gạch ≤ 70 chữ kèm trích dẫn, `tldr` ≤ 280 ký tự, `steps` 0 hoặc 2-6 bước ≤ 200 ký tự, mọi con số trong `tldr`/`steps` phải có trong thân. `legal_refs`: sửa `doc`/`article`/`url` theo `internal_checks` (URL của văn bản khác → `null`), không đoán URL.
9. Không chạy build. Được chạy `node tools/gate/run.mjs --chapter N` để tự kiểm định dạng. Không commit.

## Báo cáo cuối (≤ 20 dòng)
Mỗi mục: `id: N lỗi đã sửa / N lỗi chưa sửa được (lý do)`; liệt kê mọi chỗ **cần nguồn mới** (khẳng định đã bị bỏ/thu hẹp vì thiếu quote); chỗ nào bạn phải diễn giải; chỗ hai nhóm A/B bất đồng. Trung thực hơn là gọn.
