# CKD-R5-R1-04 — RASi và điều kiện bổ sung finerenone

CL-02b, 28/10/2026. Trạng thái: TESTED, chờ review lâm sàng độc lập. [Báo cáo và bằng chứng bản chốt](../../../reports/cl02b-rasi-finerenone-20261028/README.md).

## Lỗi tái hiện

Hai ca đều thất bại trước sửa qua `evaluate`:

1. Losartan 50 mg/ngày, eGFR 45, UACR 50 mg/mmol, SBP 128, K 4,3, có hạ huyết áp tư thế: nhánh RASi không cho tăng liều nhưng finerenone vẫn DEFER với lý do phải tăng losartan tới 100 mg/ngày.
2. Candesartan 16 mg/ngày, Child-Pugh B, SBP 132, cùng dữ kiện thận/kali: nhánh tăng RASi tự tạo trần 16 mg nên không có UPTITRATE, trong khi finerenone yêu cầu tối ưu tới 32 mg/ngày.

Nguyên nhân nằm ở hai phép đánh giá không thống nhất, trước bước gộp. Nhánh finerenone không xét hạ huyết áp tư thế; nhánh candesartan suy diễn trần duy trì từ liều khởi đầu.

## Thay đổi và quyết định lâm sàng

`helpers.rasiOptimization.ts` tính chung tổng liều ngày, đích theo thuốc, giới hạn thận, giới hạn gan telmisartan và chống chỉ định perindopril của profile VN. Cả nhánh tăng RASi và điều kiện bổ sung finerenone dùng chung giới hạn này.

- Hạ huyết áp tư thế tiếp tục chặn tăng RASi. Nếu chưa xác nhận liều tối đa dung nạp, finerenone DEFER không liều, giải thích cần đánh giá triệu chứng/huyết áp tư thế, ổn định huyết động rồi xác nhận mục có sẵn “Đã đạt liều tối đa dung nạp của ACEi/ARB”. Không còn yêu cầu tăng RASi bất chấp triệu chứng.
- Không tự suy cờ hạ huyết áp tư thế thành bằng chứng đạt liều tối đa dung nạp. Đây là lựa chọn thận trọng hơn gợi ý tự động START trong review gốc: KDIGO yêu cầu liều cao nhất dung nạp được và cân nhắc giảm/ngừng khi hạ áp có triệu chứng. Khi đã xác nhận và thỏa các cổng an toàn, finerenone có đường khởi trị dù RASi thấp hơn trần lý thuyết. Dữ kiện liều chưa xác định hoặc liều vượt giới hạn không được checkbox này bỏ qua.
- Bỏ trần duy trì giả tạo 16 mg của candesartan ở Child-Pugh B. Liều 16 mg có đường chuẩn độ thận trọng về tối đa 32 mg/ngày nếu dung nạp; finerenone chờ tối ưu. Đạt 32 mg/ngày hoặc đã xác nhận liều tối đa dung nạp thấp hơn thì không yêu cầu tăng tiếp. Thêm giải thích và nguồn riêng cho giảm liều khởi đầu ở suy gan vừa, theo dõi HA/SCr/K sau 2–4 tuần.
- Tài liệu module nay mô tả đúng: candesartan không có trong danh sách tự chọn khởi trị của rule CKD hiện hành. Thuốc đang dùng vẫn được rà soát/chuẩn độ. Không thêm thuốc khởi trị mới; `round4_RESPONSE.md` được giữ làm lịch sử, các tuyên bố cũ được đính chính trong tài liệu hiện hành và response này.

Các cổng kali, huyết áp, eGFR, AKI, lọc máu, thai kỳ/cho bú, suy thượng thận và suy gan nặng tiếp tục hoạt động. Không đổi ngưỡng/liều finerenone trong task này.

## Nguồn và kiểm thử

Đã đăng ký PDF Atacand có sẵn trong thư viện local: PI sửa 07/2025, medication guide 12/2025, 31 trang; source ID `fda_candesartan_atacand`, SHA-256 trong báo cáo. Hai citation mới tại PDF4 phân biệt dải liều người lớn và liều khởi đầu suy gan trung bình. Đối chiếu thêm KDIGO 2024 PDF44–45 và nhãn Kerendia local PDF3–4/14; không tải thay PDF.

30 ca hành vi mới kiểm hai lỗi, ba profile, CKD+DM2+HTN, xác nhận dung nạp, candesartan 16/32 mg và BID, FDC, telmisartan suy gan, dữ kiện thiếu, vượt giới hạn và các cổng an toàn. Sáu ca nguồn kiểm danh tính/hash PDF, quote đúng trang và ngữ nghĩa liều khởi đầu/dải liều. Log trước sửa, kiểm thử độc lập, full suite/build và snapshot được lưu cùng báo cáo.

Giới hạn: chưa clinical CLOSED; không đóng R5 R2/R3 hoặc finding vòng trước. R5 R1-06 còn các citation gan gắn sai thuốc trong KB, kể cả trường hepatic candesartan; thêm nguồn cho task này không tự sửa toàn bộ chúng. Metadata nguồn Kerendia và một số locator/khoảng biên KDIGO còn cần source audit riêng, ghi rõ trong báo cáo. Không chạy browser/E2E hoặc triển khai host trong task này.
