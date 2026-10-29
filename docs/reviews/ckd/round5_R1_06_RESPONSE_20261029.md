# CKD-R5-R1-06 — CL-02d, 29/10/2026

**TESTED / awaiting_independent_review**; chưa clinical CLOSED. CL-02 tổng và CKD R5 R2/R3 còn mở.

Tái hiện4/4 ca sai nguồn trước sửa: ngưỡng gan telmisartan chỉ có bảng chỉnh liều thận; candesartan hepatic metadata dùng nhãn thuốc khác; hai đầu ra evaluate dẫn Entresto/Cozaar/bảng thận cho hành động gan. Đã sửa nguồn theo đúng hoạt chất, chỉ định, mức độ suy gan và hệ nhãn; không chỉ đổi tên citation.

- EMA Micardis PI cập nhật17/04/2026: PDF3 §4.2 cho giới hạn40mg khi suy gan nhẹ–vừa; PDF4 §4.4 cho ứ mật/tắc mật/suy gan nặng. Không gán các điều kiện này cho FDA.
- SmPC Anh/Viatris candesartan text06/2026, emc31/07/2026: §4.3 cho suy gan nặng/ứ mật. FDA Atacand PDF4 cho liều khởi đầu8mg ở THA+suy gan trung bình và không đưa khuyến cáo liều khi suy gan nặng. Không dùng FDA để chứng minh chống chỉ định ứ mật.
- Hai metadata thuốc, một threshold, module safety/titration và cổng gan chung đã được sửa. Giữ nguồn đúng cho Entresto/losartan và bảng THẬN; bỏ fallback mượn bảng thận cho generic hepatic contra không có nguồn.
- Không sinh chuẩn độ hai ARB bị cổng gan yêu cầu STOP; hai ca cholestasis fail trước/pass sau. Không tạo trần candesartan16mg hoặc giảm nửa mọi liều duy trì. Bệnh gan chưa rõ mức độ được giải thích là giới hạn tạm thời cần phân độ, không tự xác nhận A/B.
- Giữ cổng thận trọng theo SmPC ở cả ba profile và nêu rõ provenance; đây là chính sách ứng dụng chưa nghiệm thu lâm sàng. Ba review state đã hạ draft; lịch sử lưu backup.

Thêm39ca (25hành vi +14nguồn); targeted4file77PASS; verifier độc lập3file69PASS. Bản chốt: **98/98 file PASS; 2,263 test PASS, 9 skipped (2,272 tổng), 202.76 giây**; build/TypeScript/KB/PWA đạt,0lỗi/0cảnhbáoKB. [Nguồn](../../../reports/cl02d-rasi-hepatic-20261029/source-check.md), [báo cáo](../../../reports/cl02d-rasi-hepatic-20261029/README.md), [review độc lập](../../../reports/cl02d-rasi-hepatic-20261029/independent-review.md).

Phát hiện riêng KB-HASH-01: item hash bỏ qua trường lồng, tái hiện độc lập; chưa đổi serializer/migrate trong CL-02d. Phải xử lý trước tái sử dụng review state. Evidence của task dùng SHA256 toàn bộ 2618file, không dựa riêng item hash. Không đóng finding khác hoặc tăng badge/tỷ lệ nghiệm thu.
