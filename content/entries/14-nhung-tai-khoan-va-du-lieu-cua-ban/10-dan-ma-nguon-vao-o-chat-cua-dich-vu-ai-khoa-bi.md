---
id: dan-ma-nguon-vao-o-chat-cua-dich-vu-ai-khoa-bi
legacy: "14-10"
chapter: 14
number: 10
title: "Dán mã nguồn vào ô chat của dịch vụ AI: khóa bí mật và dữ liệu khách hàng coi như đã ra nước ngoài"
cost:
  money: "0"
  time: low
  will: mid
benefit: medium
metric: money
evidence: B
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
  quangpao: "14-10"
  luonglb: null
related: []
situations: []
tags: []
---

## Nói dễ hiểu

Đừng dán mã nguồn có khóa bí mật vào ô chat của dịch vụ AI. Che khóa, tách tệp cấu hình, cấp khóa riêng chỉ có những quyền cần dùng rồi thu hồi khi xong. Lỡ dán khóa thật thì đổi ngay, xem lại log và hóa đơn. Dữ liệu khách hàng trong mã cũng phải che trước khi dán.

## Chi phí

Không tốn tiền, chỉ tốn một buổi để tách khóa ra khỏi mã và đổi lại những khóa đã lộ. Nếu để lộ khóa, bạn tốn nhiều thời gian khắc phục hơn: một khóa bị lạm dụng có thể phát sinh phí dịch vụ trong vài giờ, và bạn phải rà lại log, hủy khóa, cấp lại rồi cập nhật ở mọi nơi đang dùng. Nếu mã có dữ liệu khách hàng thật thì còn phải xử lý theo quy định bảo vệ dữ liệu, nặng hơn nhiều so với việc đổi một chuỗi ký tự.

## Lợi ích

Không đưa khóa API, mật khẩu hay dữ liệu khách hàng vào ô chat AI của bên ngoài khi chưa xác định quyền sử dụng và nơi dữ liệu được xử lý. Thông tin bí mật đã gửi đi rất khó thu hồi.

## Pháp luật Việt Nam

Điều 20 khoản 1 điểm c Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 xếp việc dùng nền tảng đặt ngoài lãnh thổ Việt Nam để xử lý dữ liệu cá nhân thu thập tại Việt Nam vào nhóm chuyển dữ liệu cá nhân xuyên biên giới, và khoản 2 buộc lập hồ sơ đánh giá tác động, gửi một bản chính cho cơ quan chuyên trách. Điều 30 khoản 3 buộc hệ thống dùng trí tuệ nhân tạo phải tích hợp biện pháp bảo mật dữ liệu cá nhân, dùng phương thức xác thực, định danh phù hợp và phân quyền truy cập; khoản 4 buộc việc xử lý dữ liệu cá nhân bằng trí tuệ nhân tạo phải phân loại theo mức độ rủi ro. Phía nhà cung cấp, Điều 9 Luật Trí tuệ nhân tạo 134/2025/QH15 chia ba mức rủi ro, Điều 10 khoản 1 buộc nhà cung cấp tự phân loại trước khi đưa vào sử dụng, khoản 3 buộc thông báo kết quả cho Bộ Khoa học và Công nghệ qua Cổng thông tin điện tử một cửa. Nghĩa là một dịch vụ AI tử tế phải nói được nó thuộc mức rủi ro nào và đã thông báo chưa; còn bạn, khi dán mã có dữ liệu người khác vào đó, đang tự mình thực hiện một lần chuyển dữ liệu ra ngoài.

## Ghi chú

Cả hai luật đều có số hiệu, có điều khoản rõ ràng và đọc được nguyên văn, nhưng không văn bản nào nói thẳng vào hành vi "dán mã vào ô chat": Luật 91/2025 nói về nền tảng ngoài lãnh thổ và về xử lý dữ liệu bằng trí tuệ nhân tạo, Luật 134/2025 nói với nhà cung cấp hệ thống, còn nghĩa vụ của người dùng chỉ suy ra được. Chưa có mức phạt cụ thể cho cá nhân dán mã, chưa có vụ nào bị xử lý, nên mức B phản ánh đúng độ mạnh của chứng cứ. Ba cái bẫy. Một: chỉ nghĩ tới khóa API mà quên dữ liệu trong mã - tệp sao lưu, ảnh chụp màn hình, tệp mẫu có tên, số điện thoại, số tài khoản khách hàng - những thứ đó cũng là dữ liệu cá nhân và cũng đi ra nước ngoài trong cùng một lần dán. Hai: dùng khóa của công ty trên tài khoản AI cá nhân vì "cho nhanh", trong khi khóa đó mở được cả kho mã nội bộ, và người quản trị không thấy được là ai đã dán. Ba: sau khi dán vẫn để nguyên khóa cũ hoạt động vì ngại sửa, trong khi một khóa đã nằm trong lịch sử chat thì phải coi là đã công khai, kể cả khi bạn đã xóa hội thoại. Đổi khóa bí mật không có nghĩa là dữ liệu đã dán quay lại được: thứ đã gửi đi thì nằm ở phía dịch vụ, nên che dữ liệu trước khi dán mới là phần quan trọng, còn đổi khóa chỉ là dọn hậu quả.

## Nguồn

Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 ngày 26/6/2025, hiệu lực 01/01/2026 (Điều 20 khoản 1 điểm c và khoản 2, Điều 30 khoản 3 và khoản 4) https://vbpl.vn/van-ban/chi-tiet/luat-bao-ve-du-lieu-ca-nhan-so-91-2025-qh15--179252 ; Luật Trí tuệ nhân tạo số 134/2025/QH15 ngày 10/12/2025, hiệu lực 01/3/2026 (Điều 9, Điều 10 khoản 1 và khoản 3) https://congbao.chinhphu.vn/van-ban/luat-so-134-2025-qh15-468694.htm . Tra ngày 3/11/2026.
