# Kế hoạch khắc phục và nghiệm thu GDMT-VN

Ngày lập: 28/10/2026. Kế hoạch đang có hiệu lực. Lượt lập kế hoạch chưa sửa sản phẩm; phần thực thi sau đó được cập nhật ở mục7, không mặc định toàn bộ task đã hoàn thành.

Đọc cùng [PROJECT_STATUS](PROJECT_STATUS.md), [audit sản phẩm](../reports/product-audit-20261028/README.md), [audit nguồn](SOURCE_AUDIT_20261028.md). Plan thiết kế gốc trong brain giữ làm lịch sử/đặc tả nền; tài liệu này điều hành phần việc còn lại và giải quyết các mâu thuẫn nghiệm thu của plan cũ.

## 1. Mục tiêu và quyết định

- Đạt trải nghiệm nhập hồ sơ → thuốc đang dùng → hành động ưu tiên → giải thích → nguồn, gọn và dễ sử dụng trên desktop/điện thoại.
- Sửa an toàn và nghĩa của khuyến cáo trước chỉnh mỹ thuật. gdmt.org là đối chiếu UX/hành vi, không phải nguồn phê duyệt liều hoặc đáp án lâm sàng.
- Không hardcode bước liều mới từ ảnh tham chiếu. Bước hiện tại, bước kế tiếp, liều đích và liều tối đa dung nạp là các khái niệm khác nhau; liều/điều kiện phải truy được về KB và tài liệu chính thức đúng thuốc/chỉ định/đường dùng.
- Giữ phạm vi 9 module, 3 profile, 2 bối cảnh. Trẻ em/thai kỳ chuyên sâu ngoài phạm vi 1.0; các cổng chặn an toàn đang tồn tại vẫn phải kiểm thử. Ngoài phạm vi không được bị hiểu thành đủ dữ kiện để kê đơn.
- Review cao nhất trong app là `ai_multi_reviewed`, đúng quyết định sau cùng và schema thực tế; không dùng `physician_reviewed` hoặc tuyên bố bác sĩ ký khi không có. AI review không chứng minh đã được xác nhận sử dụng lâm sàng.
- Một người ghi cho vùng file chồng nhau; main sở hữu engine/schema/tổng hợp. Có thể giao việc đọc nguồn/UI độc lập, sau đó review diff và bằng chứng. Không thêm proxy/đổi provider.

## 2. Baseline đã có và những gì chưa chứng minh

Baseline tại thời điểm lập plan (lịch sử; bản mới xem mục7): 85 file, 2009 PASS, 9 skipped/2018; build/TypeScript/PWA PASS; KB 129 nguồn/1505 citation/949 ngưỡng/179 thuốc/125 interaction/1367 review. Log trong `reports/current-medications-ui-20261028/`. Đây là kết quả lần chạy trước; không chạy lại trong lượt viết plan.

Chưa có bằng chứng nghiệm thu toàn bộ: hai vòng sạch đủ R1/R2/R3 cho cả 9 module; disposition QA-1..10; E2E desktop/mobile/offline/LAN đầy đủ; accessibility/performance. CKD Round5 R1 báo 2 Critical/6 Major; phải tái hiện trên baseline hiện tại, không tự đóng từ báo cáo sửa cũ.

## 3. Hàng đợi chi tiết và thứ tự phụ thuộc

Ước lượng là **phiên làm việc tập trung**, không phải cam kết thời gian thực hay tỷ lệ hoàn thành. Reproduction/review có thể mở thêm task. Task chưa thực thi giữ TODO; DO-00/DO-01 hoàn tất phần tài liệu, SRC-01a/UI-MED-01 có bằng chứng TESTED ở mục 7. Các task cha và cổng review còn mở.

| ID / ưu tiên | Việc và vùng sở hữu | Kiểm thử / tiêu chí đóng | Phụ thuộc / ước lượng |
|---|---|---|---|
| DO-00 / DONE | Lập plan này, source audit, status hiện hành; gắn chỉ dẫn đầu plan/progress cũ; giữ bản sao | Các link trỏ được; trạng thái triển khai, kiểm thử, review tách riêng; không xóa lịch sử | Hoàn tất lượt này |
| DO-01 / DONE (tài liệu) | Lập `docs/FINDINGS_LEDGER.md` cho QA-1..10, toàn bộ finding chưa đóng từng module và audit UX; mỗi dòng có ID, severity, reproduction, source, file, test, owner, reviewer, snapshot/hash, trạng thái | Không còn mục “đã xong” chỉ dựa vào narrative; bản chưa tái hiện ghi `needs_reproduction`, không xóa | DO-00; 1 phiên |
| SRC-01 / P0 cho nguồn ảnh hưởng an toàn | Hòa giải KB/manifest/SOURCES_STATUS/local inventory; rà GOLD version, UKKA archived, Kerendia revision; đối chiếu từng citation/route với cặp file semaglutide OZEMPIC injection và Rybelsus oral; kiểm exact DOI/edition/phụ lục/đính chính | Không đổi đè PDF; bản mới ID/version/hash riêng, citation đang dùng vẫn tái tạo được; danh sách rule/test bị ảnh hưởng | DO-00; 1–2 phiên |
| SRC-01b / TESTED (chờ review) | Hòa giải nguồn metformin bị gắn nhầm pioglitazone/metformin; rà toàn bộ citation/rule/review bị ảnh hưởng, tìm nhãn đơn chất local trước | Đúng thuốc/dạng/version/hash/trang; giữ PDF cũ; có source-form regression và impact review; không chỉ đổi tiêu đề | Phát hiện trong CL-01; làm trước clinical edit/review phụ thuộc nguồn này |
| CL-01 / TESTED (chờ review) | Tái hiện CKD-R5-R1-01/02: canagliflozin theo thận và Synjardy REDUCE tự mâu thuẫn; sửa đủ title/dose/rationale/note sau safety pipeline | Regression fail trước/pass sau; không khuyến cáo liều vượt trần nguồn; không REDUCE nhưng text vẫn bảo tiếp tục liều cũ | DO-01 + nguồn thuốc SRC-01; 1–2 phiên |
| CL-02 / P1 | CKD-R5-R1-03..10 + R2/R3: cầu nối FDC→đơn chất, finerenone/RASi không deadlock, GLP-1 theo từng hoạt chất, citation gan/cho bú/dị ứng đúng nghĩa | Ca tái hiện từng ID + boundary + đa bệnh; nguồn chứa đúng khẳng định, không chỉ trùng câu/số | CL-01; 2–3 phiên; chia nhỏ theo finding |
| CL-03 / P1 | Hoàn thành HTN Part B: mọi thuốc gây hại đều có STOP/HOLD; mg/ngày và tần suất; nội viện cạnh tranh HMOD; ngoại trú/HBPM/ABPM/renal/hepatic | Từng finding trong `round2_RESPONSE.md` Part B có regression riêng; golden htn_54..65 chỉ dùng nếu ID chưa tồn tại; không đóng bằng số lượng ca | DO-01; 2–3 phiên |
| CL-04 / P1 | Hen R4 còn mở: hợp nhất trạng thái CYP3A4/tuổi/action-plan/MgSO4 đã triển khai với finding gốc; xử lý citation DPI còn lại và các finding chưa sửa | Bảo toàn các regression mới; chuyên khoa review từng phần; không đóng R1-06 chỉ vì MgSO4 đã sửa | DO-01 + SRC-01; 1–2 phiên rồi review |
| HF-01 / P1 | Sửa/đặc tả tối ưu FMT: `hasBackgroundFmt` hiện chỉ cần một trụ cột; phân biệt đang dùng nền, đã tối ưu, không dung nạp, chưa rõ; review Digoxin/ivabradine/vericiguat/thiết bị theo chỉ định | Ma trận nền chưa đủ/đủ nhưng chưa tối ưu/tối đa dung nạp/không rõ/ngoại lệ AF; không áp blanket rule làm mất chỉ định độc lập | DO-01 + ESC/AHA/nhãn; 1–2 phiên |
| HF-02 / P1 | Chuỗi bước liều ở `rules.hfref.bb.ts` và helper/KB: hiện tại → bước kế tiếp có căn cứ → đích; giữ “chưa rõ liều” khi thiếu/không parse được; thể hiện dung nạp | Nếu nguồn hỗ trợ 3.75 → 5 thì hiện 5, không dùng 10 như bước kế tiếp; target/maxTol/HR/SBP/đợt cấp chặn phù hợp; không tự nội suy hoặc tự tăng khi chỉ chọn thuốc | HF-01 + SRC-01; 1 phiên |
| ENG-01 / P1 | Tách provenance tương tác ở `safety/interactions.ts`, `SafetyAlert`, `PlanList`: đang dùng – đang dùng / đang dùng – đề xuất / đề xuất – đề xuất; giữ FDC, thay thuốc, washout, HOLD/STOP | Đúng cặp, nguồn từng thuốc, câu “nếu phối hợp”; không bỏ mất cảnh báo hiện hữu khi thuốc bị đề xuất ngừng; không tạo cảnh báo giữa hai lựa chọn loại trừ nhau | DO-01; 1–2 phiên, main ghi engine |
| DATA-01 / P1 | Hợp nhất một nguồn state cho ECG, pregnancy/lactation, phù mạch/AKI…; canonical field + alias migration; rà `PatientForm`, input schema, normalize/URL | Sửa trường chung cập nhật mọi module; URL/preset cũ giữ ngữ nghĩa; conflict cũ yêu cầu xác nhận, không silently overwrite; không stale customInput thắng trường mới | DO-01; 1–2 phiên |
| A11Y-01 / P1 | Label/ID cho mọi input/select, group legend, aria-expanded/pressed, focus/error; thuốc nhanh không chỉ dựa màu; nhãn review giải thích phạm vi máy kiểm | RTL `getByRole(name)` tìm được từng trường; keyboard đầy đủ; focus không mất sau reset/preset; đọc trạng thái lỗi/thay đổi rõ | DATA-01; 1 phiên |
| UX-01 / P2 | Form chia Nhập chính / Thuốc / Sinh hiệu-thận / Chi tiết bệnh / An toàn; thu gọn phần nâng cao, đếm trường thiếu, chỉ hiện phần đúng bệnh/bối cảnh; giữ cảnh báo khẩn luôn thấy | Ít cuộn hơn baseline; tất cả trường vẫn truy cập được; nội viện không rò lệnh TM sang ngoại trú; đóng nhóm không xóa dữ liệu | DATA-01 + A11Y-01; 1–2 phiên |
| UX-02 / P2 | PlanRow gọn, hành động + thuốc + liều + lý do cá thể hóa; banner ưu tiên xử trí/tối ưu; tóm tắt phenotype/eGFR/thiếu dữ liệu; chi tiết nguồn mở tầng 2 | Không truncate mất liều/cảnh báo; không nhảy cuộn khi cập nhật; ảnh chuẩn desktop/mobile; độc lập cỡ chữ/tương phản | HF-01/02 + ENG-01; 1–2 phiên |
| SRC-02 / P1 trước review | Rà nguồn 9 module + nhãn 179 thuốc theo rủi ro; GINA executive summary/Severe guide, ACC CKM/resistant-HTN và version mới; lập impact diff thực chất | Mỗi rule có guideline chính thức, nhãn đúng thuốc/dạng/chỉ định, bằng chứng thuộc cùng số liệu/đơn vị; draft không vào production | SRC-01; 2–3 phiên; nguồn mới có thể tạo thêm task |
| QA-01 / P1 | Rà QA-1..10 xuyên 9 module, toàn pipeline/merge/note/matrix/pathway; mapping yêu cầu→ca kiểm thử; lý do 9 skipped | Không còn Critical/Major chưa xử lý hoặc chưa disposition; orphan number/literal quantity mismatch không bị qa-allow che | CL-01..04, HF, ENG, DATA; 1–2 phiên |
| KB-HASH-01 / CLOSED kỹ thuật | Đã sửa serializer/hash v2 browser/CLI, UI stale guard và versioned migration; 1373 state draft, giữ1621report | 46 ca mới;104file/2309PASS,9skip; history/raw backup và độc lập0mismatch; không reapprove | [Báo cáo](../reports/kb-hash-01-20261029/README.md); REVIEW-01 vẫn mở |
| REVIEW-01 / cổng | R1 guideline+source; R2 dược/liều/interaction; R3 adversarial/missing data đa bệnh; hai vòng liên tiếp 0C/0M trên mỗi module và shared engine liên quan | Bảng 9×3×2 có artifact/hash rõ; sửa material code/KB làm mất hiệu lực review phần bị ảnh hưởng; không tính output writer là kiểm tra độc lập | QA-01 + SRC-02; ít nhất 2 vòng, không ước lượng số phiên trước kết quả |
| E2E-01 / cổng | Bộ tự động browser production build và kiểm tra thực tế điện thoại/LAN; offline/update/service worker; notes/link/in; a11y/performance | Theo matrix mục 4/5; không xem devserver test là nghiệm thu PWA; không bỏ các ca lỗi để lấy màu xanh | UI/engine đã ổn; 2–3 phiên |
| REL-01 / cổng | Đóng ledger, status, nguồn và release evidence cùng snapshot; review diff; xác minh phạm vi còn loại trừ | Tất cả cổng mục 5 đạt; disclaimer/status không vượt chứng cứ; quyết định bàn giao có log và giới hạn | REVIEW-01 + E2E-01; 1 phiên |

Chạy theo thứ tự: **DO-01/SRC-01 → CL-01 → CL-02/03/04 và HF/ENG/DATA → A11Y/UX → SRC-02/QA → REVIEW/E2E → REL**. Kiểm tra nguồn trước từng sửa lâm sàng; SRC-02 là audit rộng bổ sung, không cho phép sửa bằng nguồn chưa xác minh. Không giao hai writer cùng engine/KB dùng chung.

## 4. Bộ kiểm thử cần bổ sung

Các file dưới đây là dự kiến, chưa tuyên bố đã tồn tại. Viết ca tái hiện lỗi trước, kiểm tra hành vi/đầu ra cuối, không sao chép điều kiện implementation vào expectation. Dùng seed và lưu input tối thiểu khi invariant fail.

| Nhóm / file dự kiến | Ca bắt buộc | Assertion chính |
|---|---|---|
| `tests/modules/hf/fmt_optimization.test.ts` | Không thuốc; chỉ BB 3.75; đủ 4 trụ nhưng liều thấp; max-tolerated xác nhận; không dung nạp có lý do; không rõ dung nạp; AF nhanh có chỉ định độc lập | Trạng thái FMT chính xác; không thêm thuốc dựa trên “đã tối ưu” giả; ngoại lệ có nguồn vẫn hoạt động |
| `tests/modules/hf/titration_steps.test.ts` | Liều nhỏ/giữa/đích/vượt đích; số/string/mg/mcg/BID; không biết liều; dạng tablet không biết strength; carvedilol theo cân nặng | Liều hiện tại/bước kế/đích khác nhau; không lùi về start; không nhảy/đoán; title/dose/note nhất quán |
| `tests/engine/interaction_provenance.test.ts` | Spiro+Dig đang dùng; một thuốc mới; cả hai là đề xuất; thuốc mutually exclusive; SWITCH; STOP/HOLD; ACEi washout; alias/FDC | Scope và involved medication provenance đúng; không ẩn cảnh báo thật; không biến CONSIDER thành đã dùng |
| `tests/engine/patient_fields.test.ts` | Nhịp chung/module đồng nhất; URL/preset cũ; alias xung đột; bỏ chọn/rồi chọn module; reset | Canonical value duy nhất; conflict không fail-open; dữ liệu không mất/không áp sai |
| UI RTL | Tìm mọi trường bằng role + name; chọn thuốc chưa liều; sửa/đổi thuốc; alias trùng; keyboard; mở chi tiết; badge auto/AI; thiếu input | Tên truy cập đúng; hiện rõ thiếu dữ liệu và cấp duyệt; note/URL round-trip đúng |
| CKD regression | Mỗi CKD-R5-R1-01..10; thêm R2/R3 khi có; eGFR/CrCl quanh ngưỡng, FDC và đơn chất, gan/lactation/allergy | Đúng hoạt chất/liều/ngày/đơn vị; final plan không tự mâu thuẫn sau gate/merge; citation đúng nghĩa |
| HTN regression | ≥2 thuốc gây hại cùng lớp; mg/mcg/BID/TID; phối hợp không parse được; nhiều HMOD; HBPM/ABPM | Không bỏ sót STOP/HOLD; không tính liều sai; ưu tiên cấp cứu và profile đúng |
| Hen regression | DPI/pMDI + milk allergy; 12/17/18 tuổi; CYP3A4 theo hoạt chất/đường; MgSO4 thiếu input/thận/MG/OB; action-plan trùng controller | Giữ test đã có, thêm ca còn thiếu theo finding; không đóng toàn finding từ một phần |
| KB/source validation | Missing PDF/hash mismatch/source archived/draft/edition change; quote đúng nhưng sai thuốc/chỉ định; quantity/unit; stale review hash | Kỹ thuật bắt hỏng artifact/draft/stale; semantic case do reviewer đối chiếu nguồn, không ngộ nhận string match = đúng y khoa |
| Cross-module | HF+CKD+DM2; HF+hen/COPD; AF+HF; gout+CKD; tất cả profile/bối cảnh; missing field mutation | Không START và STOP cùng thuốc trừ chuyển đổi có định nghĩa; không từ thuốc được đề xuất suy ra bệnh đã có; liều/note/matrix nhất quán |

Boundary tests lấy ngưỡng từ KB nhưng expected outcome phải được reviewer xác nhận độc lập; kiểm ngay dưới/bằng/trên theo đơn vị và độ chính xác thích hợp, không gán epsilon tùy tiện cho trường rời rạc. Random tối thiểu 10000 ca/module theo plan gốc, có seed; phân bố nhắm biên/thiếu input/phối hợp nguy cơ. Không cộng số random thành số test case độc lập để làm đẹp tiến độ.

### Browser E2E dự kiến

Thiết lập config/suite riêng bằng Playwright đang có trong devDependencies; hiện chưa có suite browser nghiệm thu có thể suy ra từ các Vitest log. Hành động tương tác khi thực thi tuân thủ browser preference/quy định công cụ của phiên, không tự dùng CLI trái quyền.

1. Ca HF giả lập nhập hoàn toàn qua UI → chọn Bisoprolol → liều 3.75 → khuyến cáo → nguồn → note → link → reload, đối chiếu trường/đơn vị.
2. Thuốc đang dùng so với đề xuất: ba scope tương tác; sửa thuốc/STOP/SWITCH làm cảnh báo đổi đúng, không stale.
3. Missing/invalid inputs: xóa K/eGFR/LVEF/HR, số âm/không hợp lệ; chỉ rõ trường thiếu, không phát START sai.
4. Cặp đa bệnh nguy cơ cao, chuyển 3 profile và 2 bối cảnh; thay dữ kiện ở một chỗ cập nhật toàn kế hoạch/note.
5. Viewport 360×780, 390×844, 768×1024, 1440×900; chữ thường/lớn, sáng/tối/tương phản, zoom 200%; không tràn ngang/mất liều/che control, focus thấy được.
6. Bàn phím từ đầu đến cuối; enter/space/escape; label+error+expanded state đọc được bằng trình đọc màn hình trong kiểm tra thủ công.
7. Production build: online warm→offline reload, tab mới với asset đã cache, chưa từng cache phải có empty/offline message; link/evidence metadata vẫn xem được, URL ngoài không giả vờ tải PDF thành công.
8. Upgrade SW: bản cũ→bản mới, refresh và rollback; không stale JS/CSS hoặc mất hồ sơ; URL migration đúng.
9. Note/copy link/in: nội dung phản ánh hành động cuối, liều và nguồn; không lộ dữ liệu thật (chỉ dùng synthetic); print không cắt dose/cảnh báo.
10. LAN desktop + điện thoại thật: mạng cùng LAN, nhập được và reload; ghi rõ HTTP LAN không phải secure context để SW hoạt động, kiểm offline trên localhost/HTTPS phù hợp. Không mở public hosting khi chỉ cần nghiệm thu LAN.

## 5. Cổng nghiệm thu

| Cổng | Bằng chứng và điều kiện |
|---|---|
| Kỹ thuật | `npm run typecheck`, `npm run verify:kb`, targeted regressions, full `npx vitest run --maxWorkers=4`, `npm run build` PASS cùng snapshot. 9 skipped hiện có phải có lý do + owner + phạm vi; không skip safety gate để release. Không mở rộng timeout để che lỗi logic. |
| Nguồn | Citation đúng PDF/version/page/hash và đúng nghĩa thuốc/chỉ định/route; cập nhật đã được impact review; không draft/archived được gắn nhãn current mà không lý do. Quote 100% matching và semantic review là hai bằng chứng riêng. |
| Lâm sàng | Hai vòng liên tiếp 0 Critical/0 Major đủ R1/R2/R3 cho từng 9 module và shared safety; reviewer không tự duyệt phần mình viết. Mọi thay đổi material sau review phải revalidate phạm vi ảnh hưởng. Chưa có bác sĩ duyệt thì không dùng badge bác sĩ hoặc tuyên bố clinical validation. |
| UX/accessibility | E2E mục4 đạt; accessible-name đầy đủ; thao tác keyboard/reader screen được ghi nhận; đạt mục tiêu WCAG 2.2 AA trong phạm vi đã kiểm (không gắn compliance toàn app khi chưa đủ audit). |
| Hiệu năng | Production trên cùng máy/profile/cache/network được ghi rõ; Lighthouse mobile mục tiêu ≥90 cho Performance/Accessibility/Best Practices của luồng chính, 3 lần lấy median. LCP ≤ 2.5s/CLS ≤ 0.1 trong lab, theo dõi tương tác; không gọi lab = field CWV. Điều tra chunk > 500KB; không chỉ nâng ngưỡng warning. |
| Tái lập | Report có ngày, lệnh/exit code, môi trường, seed, source/code hash, ảnh, failure/skip và giới hạn; ledger đóng bởi reviewer; notes/link/print đồng nhất. |

## 6. Quản lý tiến độ sau mỗi task

Trạng thái chuẩn: `TODO → REPRODUCED → IMPLEMENTED → TESTED → REVIEWED → CLOSED`; `BLOCKED` chỉ khi cần quyết định/nguồn ngoài và ghi cụ thể. Review finding có thể `NOT_REPRODUCED` nhưng phải ghi input/phiên bản/lệnh, không tự tính đã sửa. Scope phụ tách task con; partial không được đóng cả finding.

Mỗi task ghi: owner, phạm vi, nguồn, artifact, command/exit, reviewer, ngày/hash, phụ thuộc, rủi ro còn mở, next action. `PROJECT_STATUS.md` là tóm tắt hiện hành; progress brain là nhật ký, phần đầu cũ được đánh dấu lịch sử. Không suy % từ test/filename; ~70% trước đây là ước lượng quản lý không phải nghiệm thu và không tự tăng vì viết thêm plan.

Ưu tiên làm tiếp (sau KB-HASH-01): CL-02e / CKD-R5-R1-07 (claim/citation cho bú, dị ứng/phù mạch), review các phần CL-01/CL-02/SRC-01b đã TESTED; SRC-01 còn GOLD/UKKA/Kerendia theo [ledger](FINDINGS_LEDGER.md). DO-01 chỉ hoàn tất việc lập sổ; chưa hoàn tất disposition/sửa mọi finding.


## 7. Thực thi sau khi lập kế hoạch

| Task con | Kết quả trong phạm vi | Bằng chứng / phần còn lại |
|---|---|---|
| SRC-01a — nguồn semaglutide | Đã sửa nguồn tiêm/uống, 6 citation SC, hash/URL hai nguồn; giữ snapshot cũ và reset hai hồ sơ thuốc về draft; luật tương tác được máy kiểm lại ở auto_checked. Không đổi rule/liều. | [Báo cáo](../reports/src01-semaglutide-20261028/README.md), 5 test nguồn và kiểm tra độc lập. SRC-01 tổng vẫn mở cho GOLD/UKKA/Kerendia và nguồn khác. |
| UI-MED-01 — phân nhóm thuốc | Đã triển khai nhóm theo loại thuốc cho 8 module ngoài HF, lọc bệnh khi đa bệnh, hiện đầy đủ nhóm ngoài HF; test nhóm/UI và browser desktop/mobile. | [Báo cáo](../reports/medication-groups-20261028/README.md). Không đóng các task UX/A11Y/DATA khác từ thay đổi này. |
| DO-01 — sổ finding | Hoàn tất nhập review/QA/audit; per-ID source/index/hash, state/owner/reviewer/test/reproduction và next action. | [Ledger](FINDINGS_LEDGER.md), [báo cáo kiểm tra](../reports/do01-ledger-20261028/README.md). Các finding cần reproduction/disposition/review vẫn mở. |
| CL-01 — CKD Critical | Đã tái hiện và sửa hai finding R5 R1-01/02; tổng liều, FDC, UGT và nội dung cuối đồng nhất; test nguồn đúng trang. | [Giải trình](reviews/ckd/round5_R1_01_02_RESPONSE_20261028.md), [báo cáo](../reports/cl01-ckd-r5-critical-20261028/README.md). TESTED, chưa clinical CLOSED; nguồn metformin đã xử lý ở SRC-01b. |
| SRC-01b — nguồn metformin | Đã hòa giải nhãn phối hợp/đơn chất,5citation+1contraindication,3file citation routing; review phụ thuộc đã reset. | [Báo cáo](../reports/src01b-metformin-20261028/README.md). TESTED; không đóng toàn CKD-R5-R1-08 hoặc nghiệm thu clinical review. |

Log nghiệm thu SRC-01a/UI-MED-01 (lịch sử): `reports/medication-groups-20261028/vitest-accepted.log` và `build-accepted.log`. Đã đạt 87/87 file, 2.019 PASS, 9 skipped/2.028 (179,03 giây); build/KB/TypeScript/PWA đạt. Không nâng clinical review. DO-01 không thay sản phẩm nên không chạy lại bộ này.

Log nghiệm thu CL-01 (lịch sử trước SRC-01b): **89/89 file PASS; 2,069 test PASS, 9 skipped (2,078 tổng), 129.47 giây**; TypeScript/KB/build/PWA PASS. `reports/cl01-ckd-r5-critical-20261028/vitest-release.log`, `build-release.log`. SRC-01b sau đó đã hòa giải nguồn; các review lâm sàng liên quan vẫn mở.

SRC-01b bản chốt: **91/91 file PASS; 2.082 test PASS, 9 skipped (2.091 tổng), 130,62 giây**; TypeScript/KB/build/PWA PASS. [Checklist online](ONLINE_RELEASE_CHECKLIST.md) ghi các cổng nguồn/an toàn/UI/review/E2E/hiệu năng/hosting còn mở.

CL-02a bản chốt: CKD-R5-R1-03 **TESTED/chờ review**, 44ca mới; **92/92 file PASS; 2.126 test PASS. 9 skipped (2.135 tổng). 132.92 giây**; build/TypeScript/KB/PWA đạt. [Giải trình](reviews/ckd/round5_R1_03_RESPONSE_20261028.md), [báo cáo](../reports/cl02-ckd-fdc-continuation-20261028/README.md). CL-02 tổng vẫn mở cho R1-04..10 và R2/R3. SRC-01 thêm đối chiếu metadata empag/dapa (PDF local đã2026) và citation riêng p14/p5; chưa đổi/cấp duyệt KB trong CL-02a.

CL-02b bản chốt: R5 R1-04 **TESTED/chờ review**; 30 ca hành vi + 6 ca nguồn mới, **94/94 file PASS; 2,162 test PASS, 9 skipped (2,171 tổng), 154.79 giây**; build/TypeScript/KB/PWA đạt. [Giải trình](reviews/ckd/round5_R1_04_RESPONSE_20261028.md), [báo cáo](../reports/cl02b-rasi-finerenone-20261028/README.md). Thêm source Atacand và hai citation, không đổi PDF/KB thuốc. CL-02 tổng còn R1-05..10, R2/R3. SRC-01 tiếp metadata Kerendia, locator/các biên finerenone và citation gan theo source-check; chưa thay hướng dẫn bằng bản KDIGO2027 public-review draft.

CL-02c (29/10/2026): CKD-R5-R1-05 **TESTED/chờ review**, **96/96 file PASS; 2,224 test PASS, 9 skipped (2,233 tổng), 196.41 giây**; build/KB/PWA đạt. [Giải trình](reviews/ckd/round5_R1_05_RESPONSE_20261029.md), [báo cáo](../reports/cl02c-glp1-agents-20261029/README.md). Thuốc/thận/đại lượng/bằng chứng kết cục đã tách; nguồn nhãn đúng dạng với hash/trang thật, threshold draft. Tiếp CL-02d/R1-06. Bổ sung follow-up CL-DM2-GLP1-RENAL trước release: thay logic DM2-only dùng eGFR như CrCl và phân biệt exenatide ER; liên kết trong record R1-05, chưa đóng từ test toàn bộ xanh. CL-02 tổng/R2/R3/SRC/QA/E2E vẫn mở.

CL-02d (29/10/2026): CKD-R5-R1-06 **TESTED/chờ review**;39ca mới, **98/98 file PASS; 2,263 test PASS, 9 skipped (2,272 tổng), 202.76 giây**; build/KB/TypeScript/PWA đạt. [Giải trình](reviews/ckd/round5_R1_06_RESPONSE_20261029.md), [báo cáo](../reports/cl02d-rasi-hepatic-20261029/README.md). Hai nguồn versioned/four citation đúng hoạt chất/claim và reset3reviewdraft. Phân biệt EMA/UK policy với FDA; source audit rộng còn mở.

**Điều chỉnh thứ tự có bằng chứng:** KB-HASH-01 đã tái hiện khi đổi trường lồng mà review hash không đổi; [probe](../reports/cl02d-rasi-hepatic-20261029/hash-followup.md). Ưu tiên sửa serializer/migration trước tiếp tục review hoặc tái sử dụng state. Tiếp CL-02e/R1-07 sau task này; không đổi serializer toàn KB trong CL-02d. Các cổng nghiệm thu vẫn giữ yêu cầu full artifact/hash và review sạch, không lấy test xanh làm clinical closure.

KB-HASH-01 (29/10/2026) **CLOSED kỹ thuật / verified_fixed**, reviewer độc lập `/root/kb_hash_verify`; **104/104 file PASS; 2309 PASS,9skip/2318,204.24s**, build/TypeScript/KB/PWA đạt, snapshot3016file không đổi. Serializer phủ trường lồng; UI kiểm ID/version/hash và không tin explicitStatus; bộ lọc giữ STOP/AVOID/HOLD/REFER; báo cáo cũ không cộng sang nội dung mới; dry-run không cấp duyệt/ghi state. Migration reset1373state, giữ1621report với raw backup/hash, chạy lại0thay đổi. [Báo cáo](../reports/kb-hash-01-20261029/README.md). Không đóng clinical finding hoặc cấp ai_multi_reviewed. CLI review sample-only/citation coverage chưa toàn bộ được ghi giới hạn; source duplicate chưa reviewed chuyển SRC-02/CL-04 hòa giải. **Tiếp CL-02e/R1-07**, xác minh tài liệu local trước sửa; các cổng online vẫn mở.
