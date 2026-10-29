# CKD-R5-R1-03 — tiếp tục SGLT2i sau khi ngừng viên phối hợp metformin

Task CL-02a, 28/10/2026. Trạng thái và số liệu bản chốt nằm trong [báo cáo](../../../reports/cl02-ckd-fdc-continuation-20261028/README.md). Đây là triển khai và kiểm thử kỹ thuật, chờ review lâm sàng độc lập; không đóng toàn CL-02 hoặc các finding vòng trước.

## Tái hiện và nguyên nhân

Synjardy 12.5/1000 mg BID, eGFR 18 hoặc 19,9, chưa lọc máu: đầu ra `evaluate` có STOP viên phối hợp, không có empagliflozin đơn chất, dù giải thích hứa chuyển tiếp. Hai ca đều thất bại trước sửa. Nhánh khởi trị yêu cầu eGFR ≥20; nhánh duy trì loại FDC có metformin dưới 30 nên không có nhánh tạo đơn chất thay thế.

Kiểm tra đa bệnh phát hiện DM2 tạo START cho cùng hoạt chất đang dùng. Cổng thận đổi START thành AVOID và lệnh này thắng SWITCH khi merge. Log chẩn đoán được giữ trong báo cáo.

## Thay đổi

- Thêm rule CKD riêng cho eGFR >0 và <20: giữ đúng hoạt chất trong FDC, SWITCH có `switchFrom` trỏ viên cũ; ngừng viên cũ, không dùng đồng thời. Liều chuẩn lấy từ KB chỉ khi xác định được tổng liều đã dùng và không tăng tổng liều đó.
- Thiếu hàm lượng/tần suất, liều cũ thấp hơn liều đề xuất, nhiều thuốc SGLT2i hoặc dị ứng FDC chưa rõ thành phần: DEFER, không có liều. Có đơn chất an toàn đang dùng thì giữ nhánh duy trì hiện có; nếu đơn chất khác bị dị ứng thì yêu cầu xác minh thay vì tự chọn hoạt chất khác.
- Canagliflozin sau ngừng Invokamet: có thẻ xác minh đơn chất, chưa tự cấp 100 mg. Cần đối chiếu điều kiện albumin niệu theo ngày và ngoại lệ UGT trên nhãn; UACR không chứng minh albumin niệu theo ngày.
- Chỉ đổi START thành SWITCH trong nhánh DM2 giữ cùng hoạt chất dưới ngưỡng khởi trị. Từ eGFR 20 trở lên giữ hành vi cũ. Bộ kiểm liều dùng chung xác minh các SWITCH dưới 20 từ DM2/HF, tránh ghi đè DEFER của CKD.
- Cổng chu phẫu áp dụng cả SWITCH SGLT2i. SWITCH bị chặn không giữ metadata `switchFrom`. Thêm alias Synjardy XR/Invokamet XR về FDC chuẩn. Lời giải thích STOP FDC chuyển thành hướng dẫn có điều kiện, không hứa duy trì khi có cổng an toàn chặn.

Không nới cổng START SGLT2i dưới eGFR 20. Chặn thai kỳ/cho con bú/lọc máu/AKI/cấp cứu/dị ứng và các cổng toàn cục tiếp tục hoạt động.

## Kiểm thử và nguồn

44 ca mới kiểm đầu ra cuối: eGFR 18/19,9 và các biên 0/20/24/30; ba profile; CKD+DM2+HF; alias; thiếu liều/tần suất; tăng liều ngoài ý muốn; canagliflozin; thai kỳ/cho con bú/lọc máu/AKI/DKA/chu phẫu/hạ áp/toan chuyển hóa/tăng kali; trùng thuốc/dị ứng; note và metadata thay thuốc. Kiểm cả các ca DM2/HF đơn module có liên quan. Bản chốt full suite/build được ghi bằng log và snapshot SHA-256 trong báo cáo.

KDIGO 2024 PP3.7.1 (PDF44) hỗ trợ duy trì SGLT2i đã dùng dưới 20 khi dung nạp và chưa KRT; PP3.7.2 liền kề hướng dẫn tạm ngưng lúc nhịn ăn kéo dài/phẫu thuật/bệnh nặng. Nhãn Jardiance PDF4 hỗ trợ liều 10 mg, PDF14 ghi bối cảnh tiếp tục trong thử nghiệm; Farxiga PDF4–5 hỗ trợ liều 10 mg và duy trì dưới 25. Invokana PDF5 nêu điều kiện albumin >300 mg/ngày và ngoại lệ UGT. Không suy từ việc thử nghiệm giữ bệnh nhân lọc máu thành khuyến nghị dùng khi lọc máu.

Đã đối chiếu PDF local/hash và nguồn chính thức. Metadata năm empagliflozin/dapagliflozin trong registry còn cũ dù PDF local là 08/2026 và 06/2026; cần xử lý trong SRC-01. Citation liều hiện có không thay citation điều kiện tiếp tục: rule dùng PP3.7.1 làm căn cứ duy trì. Báo cáo ghi rõ trang cần bổ sung citation nhãn, không tuyên bố đã hoàn tất audit mọi nguồn.
