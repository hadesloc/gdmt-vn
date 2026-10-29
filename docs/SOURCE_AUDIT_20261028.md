> **Sau CL-02d,29/10/2026:** 136/136 nguồn local,53storedhash khớp,106URL;83thiếuhash/30thiếuURL. ThêmEMA MicardisPI17/04/2026 và UKViatris candesartantext06/2026 (emc31/07/2026); bốn citation đúng thuốc/gan, ba reviewstate draft. [Nguồn/phạm vi](../reports/cl02d-rasi-hepatic-20261029/source-check.md), [inventory](../reports/cl02d-rasi-hepatic-20261029/source-validation.json). KB-HASH-01 đã tái hiện, cần sửa trước reuse review; task dùng SHA256 toàn file. Source audit rộng và manifest/CSV còn mở.

> **Sau CL-02c, 29/10/2026:** 134/134 nguồn local,51storedhash khớp,104URL;83thiếuhash/30thiếuURL. Thêm snapshot Byetta09/2025, BydureonBCise05/2025, AdlyxinPI09/2023/record01/2024 và hash ADA9/11. [Nguồn/phạm vi](../reports/cl02c-glp1-agents-20261029/source-check.md), [inventory](../reports/cl02c-glp1-agents-20261029/source-validation.json). Đây là kiểm định danh/trang trong task; source audit rộng vẫn mở.

> **Sau SRC-01b (28/10/2026):** đã chuyển5citation metformin sang nhãn đơn chất IR07/2026 và bổ sung contraindication đúng nghĩa; nguồn cũ sửa tên thành pioglitazone/metformin, giữ PDF. Inventory130/130file;45hashkhớp;85chưa hash/30chưaURL. [Báo cáo](../reports/src01b-metformin-20261028/README.md). Các số liệu trước đó bên dưới là lịch sử; chưa nghiệm thu toàn bộ nguồn/clinical review.

> **Sau CL-01 (28/10/2026):** Invokana local đã là06/2026, registry được sửa metadata/hash/URL; KDIGO bổ sung hash. Inventory hiện tại129/129 file,43 hash khớp,86 chưa hash/30 chưa URL. Phát hiện thêm file `FDA_label_metformin.pdf` thực tế là pioglitazone/metformin; SRC-METFORMIN-FORM-01/SRC-01b còn mở. Nhánh giảm/ngừng thuộc CL-01 dùng nguồn KDIGO đúng nghĩa. Các số liệu cũ bên dưới là lịch sử. [Báo cáo](../reports/cl01-ckd-r5-critical-20261028/README.md).

> **Cập nhật sau audit:** SRC-01a đã sửa nguồn Ozempic SC, sáu citation và bổ sung hash/URL cho hai nguồn semaglutide; xem [kết quả](../reports/src01-semaglutide-20261028/README.md). Các số liệu 39 hash và lệch định danh bên dưới là snapshot trước sửa, giữ để truy vết.

# Audit tài liệu và phiên bản nguồn — 28/10/2026

**Kết luận: thư viện local rất đầy đủ về mặt file, nhưng chưa thể gọi là bộ nguồn tốt nhất/mới nhất đã được nghiệm thu.** Có bản cũ, metadata lệch nội dung và nguồn bổ sung mới chưa được lập hồ sơ. Không cần đi tìm lại tài liệu đã có; cần sửa nguồn có mục tiêu và đánh giá ảnh hưởng lên KB/rule.

## 1. Đã kiểm tra trực tiếp

[Inventory local](../reports/source-audit-20261028/local-inventory.md), [JSON](../reports/source-audit-20261028/local-inventory.json), [script tái lập](../reports/source-audit-20261028/local_inventory.py).

- 129/129 nguồn trong registry có file local; 0 thiếu path/file; 0 lỗi đọc cấu trúc PDF.
- 39/129 entry có SHA-256 đầy đủ và cả 39 khớp; **90 entry chưa có hash trong registry**, không gọi toàn bộ là đã kiểm chứng hash.
- 98 entry có URL, trong đó18 là DOI URL; 31 chưa có URL. URL có sẵn chưa đồng nghĩa DOI đúng phiên bản hoặc còn truy cập được.
- Không trùng đường dẫn. Một cặp file giống byte: nguồn Ozempic/Rybelsus. Main đã mở trang đầu: cả hai là nhãn **viên uống** kết hợp Ozempic/Rybelsus; registry Ozempic lại ghi **injection**. Citation từ sourceId này có trong `dm2.json` và `interactions_lipid.json`. Đây là lệch định danh/dạng thuốc đã xác nhận; mức ảnh hưởng từng rule chưa rà hết, chưa kết luận mọi liều semaglutide sai.
- Metadata Kerendia là ví dụ ngược lại: registry ghi2024 nhưng PDF local trang đầu là revision9/2026, khớp revision trên PI hiện hành của hãng. Không tải lại chỉ vì tên/năm registry cũ.

Việc kiểm file/hash không chứng minh tài liệu thật, mới nhất hoặc citation được áp đúng chỉ định. Inventory tìm tài liệu thiếu bằng tên/manifest; chưa phải tìm full-text mọi file trong thư viện.

## 2. Đối chiếu nguồn chính thức ngày 28/10/2026

| Mảng | Local / registry hiện có | Kiểm tra chính thức và đánh giá | Việc cần làm |
|---|---|---|---|
| CKD | KDIGO 2024, BP2021, Diabetes2022, AKI2012, ESC CVD-CKD 2026, BYT 2024 | [KDIGO CKD](https://kdigo.org/guidelines/ckd-evaluation-and-management/) đang mở public review bản focused update2027 đến4/11/2026. [Diabetes](https://kdigo.org/guidelines/diabetes-ckd/) nói2022 vẫn là bản published; bản2026 là draft. [AKI/AKD](https://kdigo.org/guidelines/acute-kidney-injury/) nói bản2026 đang chuẩn bị xuất bản sau public review. Không tự thay bằng draft. | Giữ nguồn published trong production; theo dõi draft riêng, kiểm đính chính và ảnh hưởng khi final. |
| Tăng kali/CKD nội viện | `ukka_2022_hyperkalaemia`; PDF local trang đầu final June2020/review2025; metadata title2019 | [Trang UKKA cũ](https://www.ukkidney.org/health-professionals/guidelines/treatment-acute-hyperkalaemia-adults) ghi Archived. Có [PDF chính thức October2023](https://www.ukkidney.org/sites/renal.org/files/FINAL%20VERSION%20-%20UKKA%20CLINICAL%20PRACTICE%20GUIDELINE%20-%20MANAGEMENT%20OF%20HYPERKALAEMIA%20IN%20ADULTS%20-%20191223_0.pdf). Đã chứng minh bản2022 không phải nền mới nhất; chưa khẳng định2023 không có sửa đổi về sau. | Lấy nguồn current từ publisher, diff các mục liều/monitoring/thuốc gắn citation hiện dùng; kiểm ngày review/đính chính. Không chỉ đổi năm source. |
| ĐTĐ2 | ADA 2026 các chương chính, consensusDKA/HHS2024, KDIGO 2022, BYT5481/2020+1353/2021 | [ADA chính thức](https://professional.diabetes.org/standards-of-care) đang cung cấp2026 và nói có thể cập nhật online thường xuyên hơn hàng năm. Đã đúng annual edition; chưa kiểm hết living updates/errata từng chương. | Chốt DOI/chapter/revision cho6/9/10/11/13/16; rà sự khác nhau guideline/nhãn theo hoạt chất. |
| THA | ESC2024, AHA/ACC2025, VSH/VNHA2022, BYT3192/2010 | [ACC index](https://www.acc.org/guidelines) vẫn liệt kê guidelineBP2025, đồng thời có **ECDP resistant hypertension2026**. Chưa tìm thấy file tương ứng bằng tên/manifest local. | Rà ECDP mới tác động HTN PartB; giữ phân biệt guideline và consensus. Chưa xác nhận văn bản VN nào thay thế toàn bộ2022/2010. |
| COPD | GOLD 2026 Report **v1.2**, Pocketv1.1, keychanges, BYT2131/2026 và2767/2023 | [Trang GOLD chính thức](https://goldcopd.org/2026-gold-report-and-pocket-guide/) đang trỏ Report **v1.3**, Pocketv1.1. URLreport: `https://goldcopd.org/wp-content/uploads/2026/01/GOLD-REPORT-2026-v1.3-8Dec2025_WMV2.pdf`. Chưa cóv1.3 local. | Tải bản versioned, diff trang đang trích; không nâng citation tự động. Với BYT2131 local cần lấy URL quyết định chính thức cụ thể; tìm web giới hạn trong lượt này chưa xác minh được trang gốc Bộ. |
| Hen | GINA 2026 strategy298 trang, summary47 trang; BYT 2020/2021 | [GINA](https://ginasthma.org/2026-gina-strategy-report-executive-summary-published/) công bố Executive Summary and Key Changes ngày23/10/2026; [reports](https://ginasthma.org/reports/) có SevereAsthmaGuide. Chưa tìm thấy hai tài liệu bổ sung bằng tên/manifest local. Executive summary không tự thay thế report chính. | Kiểm bổ sung/đính chính có nội dung mới thật hay chỉ tóm tắt; ưu tiên severe-asthma/biologic và finding R4. |
| Gút | ACR 2020, EULAR 2016, BYT361/2014 | [ACR gout](https://rheumatology.org/Portals/0/Files/Gout-Guideline-Final-2020.pdf) vẫn liệt kê2020; [EULAR management](https://www.eular.org/recommendations-management) có bản management2016, diagnosis2018 là phạm vi khác. Không thấy bản management thay thế qua kiểm tra chỉ mục này. | Không coi năm cũ tự động là lỗi. Xác minh thêm nhãn colchicine/allopurinol/febuxostat và drug interactions hiện hành; chưa xác nhận “không có bản mới ở mọi hội”. |
| Suy tim | ESC2026+phụlục, AHA/ACC/HFSA2022, ACC HFpEF 2026, BYT1857/2022 | [ESC](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure/) xác nhận publication28/8/2026; [ACC](https://www.acc.org/guidelines) liệt kêHFpEF 2026 và CKM2026. Local chưa tìm thấy CKM bằng tên. | Đúng bộ nền mới; đối chiếu official title/DOI/supplement/corrigenda và logic FMT/AMT. CKM là nguồn ứng viên cần đánh giá phạm vi, không tự nhập mọi khuyến cáo. |
| Lipid | ESC/EAS2019+focused2025, ACC/AHA2026; VNHA2024 còn thiếu | [AHA](https://newsroom.heart.org/news/accaha-issue-updated-guideline-for-managing-lipids-cholesterol) xác nhận guideline2026. Thư viện đã có bản này; chưa xác minh toàn bộ errata. VNHA2024 chưa tìm thấy bằng inventory local. | Rà metadata/DOI, bổ sung nguồn VN chính thống khi có quyền truy cập; không ghi profileVN đã đủ nguồn thay vìfallbackINTL. |
| AF | ESC2024, ACC/AHA2023; VNHA/VNHRS2022 còn thiếu | [ESC AF](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/atrial-fibrillation) xác nhận2024. ACC liệt kêAF2026 ở **performance/quality measures**, chưa phải guideline điều trị thay2023. | Không đổi guideline chỉ vì thấy số2026. Hoàn thiện nguồn VN; kiểm nhãn DOAC theo thuốc/CrCl/chỉ định và version. |
| Nhãn thuốc | 179DrugEntry; nhiều nhãn có local nhưng không đủ metadata trong registry | [Kerendia PI chính hãng](https://labeling.bayerhealthcare.com/html/products/pi/Kerendia_PI.pdf) revision9/2026; local cùng revision nhưng registryyear2024. Ozempic registry injection trỏ PDF oral như trên. | SRC-01 ưu tiên định danh/route và metadata; SRC-02 rà toàn bộ179 theo nhóm rủi ro. Chưa kiểm latest từng nhãn179 nên không tuyên bố toàn bộ mới nhất. |

## 3. “Tốt nhất” được đo thế nào

Không có một PDF tốt nhất cho mọi loại quyết định. Mỗi rule phải dùng bộ nguồn phù hợp:

1. Guideline chính thức đã phát hành, đúng profile và population; bản nền đi cùng focused update/corrigendum.
2. Nhãn chính thức đúng hoạt chất, dạng bào chế, đường dùng, chỉ định và khu vực cho chống chỉ định/liều/chỉnh liều. Không lấy nhãn viên uống chứng minh liều tiêm.
3. Đồng thuận/RCT khi guideline chưa bao phủ; nêu rõ mức chứng cứ và ngoại suy. Draft là watchlist, không dùng như guideline final.
4. Bảng nguồn–rule: claim, sourceId/version/hash/page, route/population/quantity/unit, vùng áp dụng và lý do khi có khác biệt giữa guideline/label/profile.
5. Máy kiểm khớp chữ và reviewer kiểm nghĩa là hai việc riêng. Báo cáo CKD R5 cho thấy quote có thể khớp100% nhưng vẫn dẫn nhầm nội dung.

## 4. Quy trình cập nhật cần đưa vào SRC-01/SRC-02

- Bổ sung registry kiểm soát nguồn (có thể sidecar để không đổi schema vội): `publicationStatus`, `publishedAt`, `revisionDate`, `checkedAt`, `publisherUrl`, `doi`, `sha256`, `supersedes`, `errataUrl`, `route/form`, `affectedRules`, người kiểm.
- Giữ immutable snapshot file cũ; bản mới có ID/path riêng. Diff claim/trang trước khi remap citation; thay nguồn làm stale review phần liên quan, chạy regression tương ứng.
- Ưu tiên nhãn nguy cơ cao: FDC metformin/SGLT2i, canagliflozin, finerenone, semaglutide theoform, DOAC, digoxin, MgSO4, insulin, biologic/inhaler age/device/CYP.
- Kiểm source current/errata trước mỗi clinical task và trước release; rà chỉ mục hàng tháng, hoặc ngay khi publisher thông báo thay đổi. Theo dõi KDIGO draft riêng, không dựa lịch để tự chuyển thànhfinal.
- Không đổi clinical status/đóng finding trong lượt audit này. Nguồn xác minh còn thiếu (VNHA, official BYT URL, nhãn179/errata) được giữ thành task với điều kiện đóng rõ, không ghi “đã mới nhất”.
