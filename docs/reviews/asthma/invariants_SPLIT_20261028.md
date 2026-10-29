# Tách bộ invariant Hen — 2026-10-28

Hoàn tất mục Step A: tệp `tests/modules/asthma/invariants.test.ts` trước đây có 40.274 bytes được tách theo trách nhiệm. Không đổi luật điều trị, cách sinh dữ liệu, số ca hoặc tiêu chí đạt.

| Tệp trong `tests/modules/asthma/` | Trách nhiệm | Bytes |
|---|---|---:|
| `invariants.test.ts` | Kiểm tra kích thước mã nguồn module | 761 |
| `invariants.fixtures.ts` | Settings, generator và tiện ích duyệt tệp | 6.790 |
| `invariants.random.test.ts` | 12.000 ca ngẫu nhiên, kiểm tra ngoại trú | 16.925 |
| `invariants.random-inpatient.ts` | Kiểm tra nội trú trên cùng bệnh nhân mỗi vòng lặp | 4.632 |
| `invariants.failclosed.test.ts` | 5.000 ca thiếu dữ liệu, gồm nhánh xóa tuổi ở 1.000 ca đầu | 5.959 |
| `invariants.standards.test.ts` | Ba test parser liều, Rapihaler và dị ứng | 5.349 |

Tất cả tệp nhỏ hơn 20.480 bytes. Helper nội trú trả số vi phạm và log; vòng lặp chính cộng cả hai trước assertion tổng. Mỗi tệp test gọi engine vẫn mock registry riêng, giữ cách cô lập module như trước.

## Bằng chứng bảo toàn

Đối chiếu bằng TypeScript AST với bản trước sửa:

- 6/6 tên test giữ nguyên.
- 82/82 điều kiện `if` giữ nguyên.
- 24/24 chuỗi assertion giữ nguyên.
- 2/2 thân hàm generator và 2/2 hằng số số ca giữ nguyên.
- Giữ toàn bộ 32 vị trí ghi log vi phạm cũ; thêm một lệnh gộp log helper, không thêm/bỏ tiêu chí.
- Giữ timeout 120.000 ms cho hai vòng lặp lớn.

Script kiểm tra và kết quả: `reports/asthma-invariants-split-20261028/compare-structure.ts`, `structure-comparison.json`. Bản trước sửa: `invariants.before.ts`. Đây là đối chiếu cấu trúc kết hợp rà soát helper/caller, không phải chứng minh tương đương hình thức. Generator tiếp tục dùng `Math.random()` như bản gốc; tham số `seed` chưa làm RNG có thể tái lập, và không được thay đổi trong task này.

## Kiểm chứng

- Worker: bốn suite đã tách đạt **6/6 test**, gồm đủ 12.000 + 5.000 ca; `typecheck` đạt.
- Main chạy lại toàn bộ `tests/modules/asthma`: các suite invariant đạt; đối chiếu AST và đọc trực tiếp đường truyền count/log.
- Verifier độc lập đọc bản gốc, tệp mới và kết quả AST: không thấy mất assertion, sai sample count hoặc mất mock isolation. Verifier không tự chạy test.

Kết quả full suite và build cuối ca được ghi trong progress chung. Việc tách phục vụ khả năng đọc và giới hạn kích thước tệp, không tuyên bố cải thiện tốc độ hoặc sửa lỗi lâm sàng.
