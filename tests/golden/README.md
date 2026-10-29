# GDMT-VN Golden Cases (Bộ Ca Chuẩn Lâm Sàng)

Thư mục chứa bộ ca bệnh chuẩn (`tests/golden/<module>/<id>.json`) dùng để kiểm thử tự động toàn diện và hồi quy cho engine điều trị nội khoa GDMT-VN.

---

## 1. Cấu Trúc File Golden Case

Mỗi ca chuẩn được định nghĩa dưới dạng một file JSON duy nhất:

```json
{
  "id": "ckd_sglt2i_indication_01",
  "titleVi": "Bệnh nhân ĐTĐ2 kèm CKD giai đoạn 3a, UACR 250 mg/g - Chỉ định SGLT2i",
  "source": "KDIGO 2024 CKD Rec 1.3.1 / kdigo.ckd.2024.sglt2i_initiate",
  "settings": {
    "setting": "outpatient",
    "profile": "INTL",
    "units": {
      "cr": "umol_L",
      "glucose": "mmol_L",
      "lipid": "mmol_L",
      "urat": "umol_L",
      "uacr": "mg_mmol",
      "hba1c": "pct"
    },
    "score2Region": "high",
    "fontScale": "normal",
    "theme": "light",
    "onlyReviewed": false
  },
  "patient": {
    "age": 62,
    "sex": "male",
    "weight": 70,
    "height": 168,
    "sbp": 134,
    "dbp": 82,
    "hr": 74,
    "scr": 125,
    "k": 4.6,
    "uacr": 25,
    "conditions": {
      "dm": true,
      "ckd": true
    },
    "currentMeds": [
      { "drugId": "metformin", "name": "Metformin", "dose": 1000, "unit": "mg" }
    ],
    "selectedModules": ["ckd", "dm2"]
  },
  "expect": {
    "mustInclude": [
      {
        "drugId": "dapagliflozin",
        "action": "START",
        "doseContains": "10 mg"
      }
    ],
    "mustNotInclude": [
      {
        "drugId": "dapagliflozin",
        "action": "STOP"
      }
    ],
    "alertsInclude": []
  },
  "descriptionVi": "Bệnh nhân có eGFR ~52 mL/min/1.73m2 và albumin niệu vi thể, đủ tiêu chuẩn khuyến cáo khởi trị SGLT2i theo KDIGO 2024 mức chứng cứ 1A."
}
```

---

## 2. Tiêu Chí So Khớp của Runner (`_runner.test.ts`)

1. **Khớp theo hành động và định danh (`action` + `drugId` hoặc `ruleId`)**:
   - Runner không so sánh chuỗi văn bản tự do nhằm tránh đứt gãy kiểm thử khi tinh chỉnh câu từ tiếng Việt.
   - `action`: Bắt buộc khớp chính xác (`START`, `UPTITRATE`, `CONTINUE`, `HOLD`, `STOP`, `AVOID`, `CONSIDER`, v.v.).
   - `drugId`: Định danh thuốc chuẩn INN (vd: `dapagliflozin`, `empagliflozin`).
   - `doseContains` (tùy chọn): Kiểm tra chuỗi liều hoặc tiêu đề có chứa lượng liều mong đợi (vd: `"10 mg"`, `"25 mg"`).
2. **`mustNotInclude`**:
   - Đảm bảo engine KHÔNG bao giờ sinh ra các chỉ định nguy hiểm hoặc sai quy tắc (vd: không được `START` khi có chống chỉ định, không được kích hoạt cùng lúc 2 thuốc cùng nhóm).
3. **`alertsInclude`** (tùy chọn):
   - Đảm bảo hệ thống phát hiện và hiển thị các cảnh báo an toàn mong đợi.

---

## 3. Thư Mục Ca Nháp Chuyển Từ ON CALL (`_from_oncall/`)

Thư mục `tests/golden/_from_oncall/` chứa 13 ca lâm sàng nội viện được chuyển đổi trực tiếp từ dự án ON CALL.
Các ca này đã có đầy đủ hồ sơ bệnh nhân (`patient`) và bối cảnh nội viện (`settings.setting = 'inpatient'`), nhưng phần `expect.mustInclude` được để trống để các Agent chuyên trách từng module (E, F, G...) rà soát và bổ sung kỳ vọng điều trị cụ thể.

Khi một ca nháp được hoàn thiện `expect`, hãy di chuyển file vào thư mục module tương ứng (ví dụ: `tests/golden/ckd/` hoặc `tests/golden/hf/`).

---

## 4. Chạy Kiểm Thử Golden Cases

Chạy kiểm thử toàn bộ ca chuẩn bằng Vitest:
```bash
npx vitest run tests/golden/_runner.test.ts
```
