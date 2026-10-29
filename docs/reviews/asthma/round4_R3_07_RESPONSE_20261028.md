# ASTHMA-R4-R3-07 — Kế hoạch hành động và thuốc không phù hợp

Ngày: 2026-10-28. Phạm vi: đường sinh tài liệu `rec_asthma_action_plan_doc`.

## Sửa đổi

Trước sửa, kế hoạch hành động có thể in tiếp tục Trelegy dù thuốc này bị tránh do ritonavir hoặc dị ứng fluticasone. Nhánh ngoại trú cũng tự tạo phác đồ/liều khi chưa có đánh giá GINA.

Trong `src/modules/asthma/rules.track2.support.ts`:

- Không sinh kế hoạch ngoại trú khi `evaluateGinaControl(ctx).level === 'missing'`.
- Bộ chọn bình ba thuốc loại trường hợp có tương tác CYP3A4 hoặc dị ứng thuốc, đồng bộ với nhánh controller/xuất viện hiện có.
- Theo dõi ID controller thực sự chọn ở mọi nhánh; trước khi sinh tài liệu kiểm tra lại dị ứng, tương tác CYP3A4 và giới hạn tuổi. Nếu lựa chọn không hợp lệ, không xuất tài liệu có liều tự suy diễn.
- Nhánh nội trú tiếp tục yêu cầu `isDischargeReady`, không bắt buộc câu hỏi kiểm soát mạn tính thay cho tiêu chí xuất viện.

Không thêm liều/ngưỡng/thuốc mới. Không thay đổi các rule kê controller hoặc nâng trạng thái kiểm duyệt KB.

## Kiểm chứng

`tests/modules/asthma/r4_action_plan_consistency.test.ts`: trước sửa **5/6 test thất bại**; sau sửa và mở rộng ca biên **9/9 PASS**, bao gồm:

- Thiếu câu hỏi GINA không xuất tài liệu; bệnh nhân đã đủ đánh giá vẫn xuất.
- Không in Trelegy với ritonavir hoặc dị ứng fluticasone.
- Không xuất tài liệu khi controller Track 2 còn vướng tương tác, hoặc MART không phù hợp ở tuổi 14 dùng ritonavir.
- Không xuất tài liệu khi cả hai lựa chọn MART bị dị ứng.
- Không bỏ Trelegy khi không có yếu tố chống chỉ định.
- Xuất viện sau cơn cấp với ritonavir: không đưa Trelegy trở lại tài liệu, giữ lựa chọn thay thế hợp lệ theo nhánh hiện có.

Hai golden cases `asthma_22_action_plan_generated.json` và `asthma_27_action_plan_absolute_pef_units.json` được bổ sung bốn câu trả lời GINA âm tính để mô tả bệnh nhân đã đánh giá. Giữ nguyên toàn bộ kỳ vọng đầu ra. Bộ golden + hồi quy mới đạt **153/153 test** sau sửa fixture.

Main đã chạy `typecheck` đạt và `verify:kb` đạt **0 lỗi / 0 cảnh báo** (`reports/kb/verify_2026-10-28T04-01-27-227Z.json`). Verifier độc lập không phát hiện lỗi material trong phạm vi này; việc chạy test do main/worker thực hiện. Kết quả full suite và build cuối ca ghi trong progress chung.

## Đối chiếu nguồn và giới hạn

Mục review R3-07 và nguồn hiện có trong KB là yêu cầu đầu vào của bản sửa. [MHRA: cobicistat/ritonavir và corticosteroid](https://www.gov.uk/drug-safety-update/cobicistat-ritonavir-and-coadminsitration-with-a-steroid-risk-of-systemic-corticosteroid-adverse-effects) cũng cảnh báo tác dụng toàn thân khi phối hợp và xem beclometasone là lựa chọn có nguy cơ thấp hơn, vẫn cần theo dõi.

Sửa này ngăn tài liệu tái đưa controller không phù hợp vào hướng dẫn bệnh nhân. **Chưa đóng ASTHMA-R4-R2-02 / R3-02** về lựa chọn phác đồ controller CYP3A4, danh mục thuốc ức chế hoặc mọi gate liên module. Trong tình huống chưa có controller phù hợp, việc không xuất kế hoạch là chủ ý fail-closed; các cảnh báo/đề nghị đánh giá trong đơn vẫn hiện.

Bản sao trước sửa mã và hai fixture: `reports/asthma-r4-action-plan-20261028/`.
