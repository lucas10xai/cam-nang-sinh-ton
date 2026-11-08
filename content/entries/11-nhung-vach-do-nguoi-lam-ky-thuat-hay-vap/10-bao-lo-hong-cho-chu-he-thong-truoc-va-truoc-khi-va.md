---
id: bao-lo-hong-cho-chu-he-thong-truoc-va-truoc-khi-va
legacy: "11-10"
chapter: 11
number: 10
title: Báo lỗ hổng cho chủ hệ thống trước, và trước khi vá thì không đăng chi tiết, không phát hành công cụ khai thác, không đẩy dữ liệu ra nước ngoài
cost:
  money: "0"
  time: low
  will: "0"
benefit: medium
metric: other
evidence: C
contested: false
vn_class: unclassified
rewrite_status: imported
tldr: null
steps: []
legal_refs: []
verification:
  status: unverified
  checked_at: null
  checker: null
  scope: null
  sources: []
origin:
  zh: null
  quangpao: "11-10"
  luonglb: null
related: []
situations: []
tags: []
---

## Nói dễ hiểu

Đăng một công cụ khai thác còn dùng được cho người khác tải về có thể bị tính là tặng cho công cụ tấn công: 20.000.000 đồng đến 100.000.000 đồng hoặc tù 3 tháng đến 2 năm. Báo cho chủ hệ thống trước, đừng đăng chi tiết trước khi họ vá.

## Chi phí

Không mất tiền, mất thời gian chờ. Bạn cần viết một báo cáo đủ để chủ hệ thống tái hiện được lỗi mà không cần bạn thao tác lại, gửi thẳng cho họ, rồi giữ im lặng cho tới khi họ vá. Bạn phải chịu mất phần thưởng về danh tiếng: đăng bài trước, khoe PoC trước, nhận credit trước. PoC là đoạn mã chứng minh lỗ hổng khai thác được.

## Lợi ích

Báo lỗ hổng cho chủ hệ thống qua kênh phù hợp, hạn chế tiết lộ chi tiết có thể bị lạm dụng trước khi khắc phục. Lưu lịch sử thông báo và phạm vi kiểm thử.

## Pháp luật Việt Nam

Việt Nam chưa có văn bản riêng nào quy định trình tự công bố lỗ hổng, nên trách nhiệm phải ghép từ ba chỗ. Thứ nhất là Điều 285 khoản 1 Bộ luật Hình sự: người sản xuất, mua bán, trao đổi hoặc tặng cho công cụ, thiết bị, phần mềm có tính năng tấn công mạng máy tính, mạng viễn thông, phương tiện điện tử để sử dụng vào mục đích trái pháp luật thì bị phạt tiền 20.000.000 đồng đến 100.000.000 đồng, cải tạo không giam giữ đến 2 năm hoặc tù 3 tháng đến 2 năm. Chữ "tặng cho" là chỗ đáng để ý: phát hành công khai một công cụ chạy được nằm trong câu chữ đó, còn mục đích trái pháp luật của người nhận thì cơ quan điều tra xác định theo cách công cụ được dùng. Thứ hai là Điều 289 khoản 1, áp cho người còn giữ đường vào hệ thống để "kiểm tra lại sau khi vá": không còn được phép thì mỗi lần đăng nhập là một lần xâm nhập, khung 50.000.000 đồng đến 300.000.000 đồng hoặc tù 1 năm đến 5 năm. Thứ ba là chỗ dữ liệu đi qua: Điều 20 Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 xếp việc gửi dữ liệu cá nhân cho tổ chức, cá nhân ở nước ngoài, hoặc dùng nền tảng đặt ngoài lãnh thổ để xử lý dữ liệu thu thập tại Việt Nam, vào nhóm chuyển dữ liệu xuyên biên giới, và buộc lập hồ sơ đánh giá tác động gửi cơ quan chuyên trách trong 60 ngày kể từ ngày chuyển đầu tiên. Gửi kèm ảnh chụp có số điện thoại, email hay bảng người dùng cho một nền tảng săn lỗi ở nước ngoài rơi đúng vào nhóm đó, còn gửi mô tả kỹ thuật thì không.

## Ghi chú

Không có điều khoản nào mang tên "công bố lỗ hổng", cũng không có cơ quan nào nhận báo cáo lỗ hổng theo một thủ tục có thời hạn bằng văn bản, nên mọi kết luận ở đây là ghép từ Điều 285 và Điều 289 chứ không đọc thẳng ra được. Ba cái bẫy hay gặp. Một: đăng PoC lên GitHub trước khi vá và gọi đó là công bố có trách nhiệm; ở Việt Nam không có quy định nào miễn trừ cho việc đăng sớm, và thứ bạn đăng là công cụ chạy được chứ không phải bài phân tích. Hai: gửi kèm dữ liệu thật để chứng minh mức độ nghiêm trọng, gồm ảnh chụp có số điện thoại và bảng người dùng, cho một nền tảng thưởng lỗi đặt ở nước ngoài; mô tả kỹ thuật và dữ liệu cá nhân chịu hai chế độ khác nhau, và chế độ thứ hai có điều kiện chuyển ra nước ngoài. Ba: giữ lại một tài khoản hoặc một đường vào để "xác nhận bản vá đã ăn", rồi ba tháng sau vẫn còn dùng được tài khoản đó; quyền truy cập hết cùng lúc với hợp đồng, không cùng lúc với lần vá cuối. Mục này không có nghĩa là cấm công bố lỗ hổng, cấm nhận tiền thưởng, hay cấm viết bài phân tích sau khi nhà cung cấp đã vá: chỗ cần giữ là thời điểm và hình thức công bố, và cả hai đều do bạn chọn.

## Nguồn

Bộ luật Hình sự, bản hợp nhất 135/VBHN-VPQH (Điều 285 khoản 1, Điều 289 khoản 1) — https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/135-vbhn-vpqh.pdf ; Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, Công báo số 971 và 972 ngày 24-7-2025 (Điều 20 khoản 1 và khoản 2, hiệu lực 1-1-2026) — https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2025/6/45578/57730-1-2025971-97291-2025-qh15.pdf . Tra ngày 3/11/2026.
