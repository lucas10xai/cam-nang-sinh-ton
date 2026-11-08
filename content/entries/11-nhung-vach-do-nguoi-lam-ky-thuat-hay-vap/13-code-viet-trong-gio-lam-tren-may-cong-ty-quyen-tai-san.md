---
id: code-viet-trong-gio-lam-tren-may-cong-ty-quyen-tai-san
legacy: "11-13"
chapter: 11
number: 13
title: "Code viết trong giờ làm trên máy công ty: quyền tài sản thường thuộc công ty, quyền đứng tên vẫn của bạn; dự án riêng phải làm bằng máy và thời gian của bạn"
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
  quangpao: "11-13"
  luonglb: null
related: []
situations: []
tags: []
---

## Nói dễ hiểu

Công ty giao việc thì quyền tài sản và quyền công bố thuộc công ty, trừ khi hợp đồng ghi khác; quyền đứng tên và quyền bảo vệ toàn vẹn vẫn của bạn. Cái quyết định là bạn có được giao việc hay không, không phải đồng hồ.

## Chi phí

Không mất tiền, mất một buổi đọc hợp đồng và một buổi dọn máy. Bạn cần đọc điều khoản sở hữu trí tuệ trong hợp đồng lao động, rồi tách hẳn hai môi trường: một máy, một tài khoản, một kho mã cho việc công ty; một máy, một tài khoản, một kho mã cho việc riêng. Nếu bạn để lẫn, cả dự án cá nhân bị coi là sản phẩm của công ty, và bạn không giữ được gì.

## Lợi ích

Mã nguồn tạo ra khi làm việc có thể chịu điều khoản sở hữu của hợp đồng lao động và quy định quyền tác giả. Muốn sử dụng lại trong dự án riêng, kiểm tra thỏa thuận trước.

## Pháp luật Việt Nam

Điều 39 khoản 1 Luật Sở hữu trí tuệ quy định tổ chức giao nhiệm vụ sáng tạo tác phẩm cho tác giả là chủ sở hữu các quyền tại Điều 20 và khoản 3 Điều 19, trừ trường hợp có thỏa thuận khác. Điều 20 là nhóm quyền tài sản, khoản 3 Điều 19 là quyền công bố. Ba quyền nhân thân còn lại vẫn thuộc tác giả: quyền đặt tên, quyền đứng tên thật hoặc bút danh, quyền bảo vệ sự toàn vẹn tác phẩm. Điều 22 khoản 1 xác nhận chương trình máy tính được bảo hộ như tác phẩm văn học, dù thể hiện bằng mã nguồn hay mã máy, nên toàn bộ các quy định về quyền tác giả áp thẳng vào code. Điều 121 khoản 3 xử lý phần khó nhất: bí mật kinh doanh mà bên làm thuê có được trong khi thực hiện công việc được thuê thuộc quyền sở hữu của bên thuê, trừ trường hợp có thỏa thuận khác, nên kiến trúc, thuật toán, cấu hình triển khai đi theo công ty ngay cả khi bạn viết lại từ đầu. Khi có tranh chấp, Điều 205 khoản 1 điểm d cho tòa ấn định mức bồi thường vật chất không quá 500.000.000 đồng nếu không tính được thiệt hại, khoản 2 cho 5.000.000 đồng đến 50.000.000 đồng với thiệt hại tinh thần. Bán code đó cho người khác thì Điều 225 Bộ luật Hình sự vào cuộc, ngưỡng thu lợi bất chính 50.000.000 đồng. Khi tranh chấp quay về phía thiệt hại trong nội bộ công ty, Điều 129 khoản 1 Bộ luật Lao động chặn mức bồi thường: gây thiệt hại không nghiêm trọng do sơ suất với giá trị không quá 10 tháng lương tối thiểu vùng thì người lao động bồi thường nhiều nhất 3 tháng tiền lương.

## Ghi chú

Điều 39 khoản 1 đọc được nguyên văn và có câu "trừ trường hợp có thỏa thuận khác", nên kết quả phụ thuộc vào hợp đồng của từng người; phần tiền thì Điều 205 và Điều 225 có mức rõ, nhưng không có bản án công bố nào ở Việt Nam về đúng câu hỏi "code viết ngoài giờ trên máy công ty thuộc về ai", nên không lên được hạng A. Ba cái bẫy hay gặp. Một: viết dự án riêng trên laptop công ty trong giờ nghỉ trưa rồi push lên kho mã của công ty; máy là của công ty, tài khoản là của công ty, và lịch sử đăng nhập là bằng chứng cho thấy công việc được làm bằng phương tiện của công ty. Hai: dùng schema, API key, bộ dữ liệu khách hàng của công ty để dựng bản demo cho dự án riêng, vì nghĩ rằng mình chỉ dùng để học; đó là bí mật kinh doanh, và Điều 121 khoản 3 xếp nó thuộc bên thuê. Ba: tin rằng hợp đồng không nhắc gì thì code là của mình; luật mặc định ngược lại khi có giao nhiệm vụ, và cái mặc định đó chỉ bị đảo khi hợp đồng ghi rõ. Mục này không có nghĩa là cấm bạn làm dự án riêng, không có nghĩa là kinh nghiệm nghề bị khóa lại trong công ty, và không đòi bạn xin phép trước khi mở một kho mã cá nhân: ranh giới nằm ở thiết bị bạn dùng, dữ liệu bạn lấy và nhiệm vụ công ty giao.

## Nguồn

Luật Sở hữu trí tuệ, bản hợp nhất 155/VBHN-VPQH ngày 9-9-2025 (Điều 19, 20, 22 khoản 1, 39 khoản 1, 121 khoản 3, 205) — https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/155-vbhn-vpqh.pdf ; Bộ luật Hình sự, bản hợp nhất 135/VBHN-VPQH (Điều 225 khoản 1) — https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/135-vbhn-vpqh.pdf ; Bộ luật Lao động 2019, bản hợp nhất 18/VBHN-VPQH (Điều 129 khoản 1) — https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/02/18-vbhn-vpqh.pdf . Tra ngày 3/11/2026.
