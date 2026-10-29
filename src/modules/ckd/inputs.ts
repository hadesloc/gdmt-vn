/**
 * GDMT-VN CKD Module - Input Field Definitions
 * Phân quyền: Agent E
 * Tuân thủ QA-8 & QA-10: Mọi ngưỡng hiển thị trong nhãn đều nội suy qua thFor(quantity, id) từ KB.
 */

import type { ModuleInputSchema } from '../../engine/types';
import { registerValidFields } from '../../engine/require';
import { thFor } from '../../kb-types/access';

registerValidFields([
  'contrastRouteIntraArterial',
  'fiveYearKidneyFailureRiskPct',
  'twoYearKidneyFailureRiskPct',
  'historyMtcOrMen2',
  'historyPancreatitis',
  'adrenalInsufficiency',
  'bilateralRenalArteryStenosis',
  'renalArteryStenosis',
  'renalBruit',
  'bowelObstruction',
  'obstructiveBowelDisease',
  'ileus',
  'postoperativeIleus',
  'hypercalcemia',
  'breastfeeding',
  'dkaSuspected',
  'statin10yCvRiskPct',
  'score2RiskPct',
  'ascvdRisk10y',
  'rasiMaxTolerated',
  'refractoryHyperkalemia',
  'refractoryPulmonaryEdema',
  'volumeOverload',
  'diabetesType',
  'childPugh'
]);

export const ckdInputs: ModuleInputSchema = {
  groups: [
    {
      id: 'ckd_staging_electrolytes',
      titleVi: 'Chức năng Thận, Đạm niệu & Điện giải – Toan kiềm',
      descriptionVi: 'Xác định phân tầng KDIGO G1–G5 × A1–A3, nguy cơ suy thận KFRE và cổng an toàn K⁺ / HCO₃⁻',
      fields: [
        {
          id: 'scr',
          labelVi: 'Creatinin huyết thanh',
          type: 'number',
          unitKey: 'cr',
          min: 15, // qa-allow: ui-step - Giới hạn nhập Creatinin
          max: 2500, // qa-allow: ui-step - Giới hạn trần Creatinin
          step: 1, // qa-allow: ui-step - Bước nhảy Creatinin
          required: true,
          helpVi: 'Ước tính mức lọc cầu thận CKD-EPI 2021 và độ thanh thải Cockcroft-Gault'
        },
        {
          id: 'uacr',
          labelVi: 'Tỷ số Albumin/Creatinin niệu (UACR)',
          type: 'number',
          unitKey: 'uacr',
          min: 0,
          max: 5000, // qa-allow: ui-step - Giới hạn trần UACR
          step: 0.1, // qa-allow: ui-step - Bước nhảy UACR
          helpVi: 'Phân độ Albumin niệu KDIGO A1–A3 và chỉ định SGLT2i / RASi / Finerenone / Semaglutide'
        },
        {
          id: 'k',
          labelVi: 'Kali máu (K⁺)',
          type: 'number',
          unit: 'mmol/L',
          min: 1.5, // qa-allow: ui-step - Giới hạn dưới Kali
          max: 10, // qa-allow: ui-step - Giới hạn trên Kali
          step: 0.1, // qa-allow: ui-step - Bước nhảy Kali
          required: true,
          helpVi: `Cổng an toàn trước khi khởi trị/chuẩn độ RASi, Finerenone (yêu cầu ≤ ${thFor('k', 'ckd.rasi.k_initiate_max').toFixed(1)} mmol/L)`
        },
        {
          id: 'hco3',
          labelVi: 'Bicarbonat huyết thanh (HCO₃⁻)',
          type: 'number',
          unit: 'mmol/L',
          min: 3, // qa-allow: ui-step - Giới hạn dưới HCO3
          max: 45, // qa-allow: ui-step - Giới hạn trên HCO3
          step: 0.5, // qa-allow: ui-step - Bước nhảy HCO3
          helpVi: `Bù kiềm uống khi < ${thFor('hco3', 'ckd.acidosis.hco3_min')} mmol/L; chuyển cấp cứu nội viện khi < ${thFor('hco3', 'ckd.acidosis.hco3_outpatient_emergency')} mmol/L`
        },
        {
          id: 'cystatinC',
          labelVi: 'Cystatin C huyết thanh',
          type: 'number',
          unit: 'mg/L',
          min: 0.2, // qa-allow: ui-step - Giới hạn dưới Cystatin C
          max: 10, // qa-allow: ui-step - Giới hạn trên Cystatin C
          step: 0.05, // qa-allow: ui-step - Bước nhảy Cystatin C
          helpVi: 'Tính eGFRcr-cys xác nhận CKD G3aA1 và hiệu chỉnh khi khối cơ bất thường (KDIGO 2024 Rec 1.2.2.1, 1C)'
        }
      ]
    },
    {
      id: 'ckd_etiology_contraindications',
      titleVi: 'Nguyên nhân Thận, Chuẩn độ Thuốc & Tiền sử Chống chỉ định',
      descriptionVi: 'Tối ưu hóa trình tự RASi -> Finerenone và sàng lọc chống chỉ định hẹp động mạch thận, suy thượng thận, GLP-1 RA, NSAID, suy gan',
      fields: [
        {
          id: 'customInputs.ckdEtiology',
          labelVi: 'Nguyên nhân bệnh thận nghi ngờ / xác định',
          type: 'select',
          options: [
            { value: 'diabetic', label: 'Bệnh thận đái tháo đường' },
            { value: 'hypertensive', label: 'Xơ hóa mạch thận do tăng huyết áp' },
            { value: 'glomerular', label: 'Bệnh cầu thận / Hội chứng thận hư' },
            { value: 'adpkd', label: 'Thận đa nang di truyền (ADPKD)' },
            { value: 'tubulointerstitial', label: 'Bệnh ống - mô kẽ thận / Tắc nghẽn' },
            { value: 'unknown', label: 'Chưa rõ nguyên nhân' }
          ],
          defaultValue: 'unknown'
        },
        {
          id: 'customInputs.hematuria',
          labelVi: 'Tiểu máu vi thể cầu thận / Trụ hồng cầu cặn lắng nước tiểu',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Phối hợp Albumin niệu A3 giúp nhận diện hội chứng viêm cầu thận cần chuyển chuyên khoa sinh thiết'
        },
        {
          id: 'customInputs.rasiMaxTolerated',
          labelVi: 'Đã đạt liều tối đa dung nạp của ACEi/ARB (không thể tăng thêm liều RASi)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Xác nhận điều kiện tiên quyết theo KDIGO 2024 Rec 3.8.1 để bổ sung Finerenone khi liều RASi thấp hơn trần lý thuyết'
        },
        {
          id: 'customInputs.adrenalInsufficiency',
          labelVi: 'Suy tuyến thượng thận / Bệnh Addison',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định tuyệt đối Finerenone theo nhãn FDA Kerendia Section 4'
        },
        {
          id: 'customInputs.bilateralRenalArteryStenosis',
          labelVi: 'Hẹp động mạch thận hai bên (hoặc hẹp động mạch trên thận độc nhất)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định nhóm ACEi / ARB / ARNI do nguy cơ suy thận cấp thiếu máu cục bộ'
        },
        {
          id: 'customInputs.historyMtcOrMen2',
          labelVi: 'Tiền sử cá nhân/gia đình K giáp thể tủy (MTC) hoặc hội chứng MEN 2',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Cảnh báo hộp đen FDA: Chống chỉ định tuyệt đối Semaglutide và toàn bộ nhóm GLP-1 RA'
        },
        {
          id: 'customInputs.historyPancreatitis',
          labelVi: 'Tiền sử hoặc đang nghi ngờ viêm tụy cấp',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Tránh khởi trị và ngừng ngay GLP-1 RA trên bệnh nhân có tiền sử viêm tụy cấp'
        },
        {
          id: 'customInputs.takingNsaid',
          labelVi: 'Đang sử dụng thuốc giảm đau kháng viêm NSAID / COX-2',
          type: 'boolean',
          defaultValue: false,
          helpVi: `Chống chỉ định khi eGFR < ${thFor('egfr', 'ckd.nsaid.egfr_contra')} mL/phút/1.73m², AKI hoặc phối hợp bộ ba Triple Whammy`
        },
        {
          id: 'customInputs.childPugh',
          labelVi: 'Phân độ xơ gan / suy gan Child-Pugh (nếu có bệnh gan)',
          type: 'select',
          options: [
            { value: '', label: 'Không suy gan' },
            { value: 'A', label: 'Child-Pugh A (Suy gan nhẹ)' },
            { value: 'B', label: 'Child-Pugh B (Suy gan trung bình)' },
            { value: 'C', label: 'Child-Pugh C (Suy gan nặng / xơ gan mất bù)' }
          ],
          defaultValue: '',
          helpVi: `Tránh Finerenone, Canagliflozin, Candesartan, Telmisartan và Statin ở suy gan nặng Child-Pugh C; trần Telmisartan ≤ ${thFor('dose_mg', 'ckd.rasi.telmisartan_hepatic_max_dose')} mg/ngày ở Child-Pugh A/B`
        }
      ]
    },
    {
      id: 'ckd_aki_inpatient_emergency',
      titleVi: 'Đánh giá Nội viện: Tổn thương Thận cấp (AKI), Tăng Kali Cấp cứu & Cản quang',
      descriptionVi: 'Dành cho phân độ AKI theo KDIGO 2012, cấp cứu tăng kali UKKA 2022 và dự phòng CI-AKI',
      fields: [
        {
          id: 'customInputs.baselineScr',
          labelVi: 'Creatinin huyết thanh nền trước đợt cấp',
          type: 'number',
          unitKey: 'cr',
          min: 15, // qa-allow: ui-step - Giới hạn dưới Creatinin nền
          max: 2000, // qa-allow: ui-step - Giới hạn trên Creatinin nền
          step: 1, // qa-allow: ui-step - Bước nhảy Creatinin nền
          helpVi: `Phát hiện AKI khi SCr tăng ≥ ${thFor('scr', 'ckd.aki.scr_increase_stage1')} µmol/L trong 48h hoặc ≥ ${thFor('ratio', 'ckd.aki.scr_ratio_stage1')} lần nền; tạm ngừng RASi nếu tăng > ${thFor('percentage', 'ckd.rasi.creatinine_rise_max_pct')}%`
        },
        {
          id: 'customInputs.akiSuspected',
          labelVi: 'Đang có đợt tổn thương thận cấp (AKI) hoặc mất nước nặng / nhiễm khuẩn cấp',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Kích hoạt quy tắc ngày ốm (Sick-day rules) tạm ngừng nhóm thuốc SADMAN'
        },
        {
          id: 'customInputs.urineOutputRate',
          labelVi: 'Lưu lượng nước tiểu theo dõi nội viện',
          type: 'select',
          options: [
            { value: 'normal', label: 'Bình thường' },
            { value: 'oliguria_6h', label: 'Thiểu niệu 6–12 giờ (AKI Giai đoạn 1)' },
            { value: 'oliguria_12h', label: 'Thiểu niệu kéo dài ≥ 12 giờ (AKI Giai đoạn 2)' },
            { value: 'anuria_12h', label: 'Vô niệu hoàn toàn ≥ 12 giờ (AKI Giai đoạn 3 / Cấp cứu RRT)' }
          ],
          defaultValue: 'normal'
        },
        {
          id: 'customInputs.ecgHyperkalemia',
          labelVi: 'Biến đổi điện tâm đồ do tăng kali máu (sóng T cao nhọn, mất P, QRS giãn rộng)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chỉ định tiêm Canxi tĩnh mạch bảo vệ màng cơ tim khẩn cấp theo UKKA 2022 khi có tăng K⁺ xác nhận'
        },
        {
          id: 'customInputs.refractoryHyperkalemia',
          labelVi: 'Tăng kali máu kháng trị với điều trị nội khoa ban đầu',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chỉ định lọc máu cấp cứu khẩn cấp (UKKA 2022 Guideline 19.6)'
        },
        {
          id: 'customInputs.refractoryPulmonaryEdema',
          labelVi: 'Phù phổi cấp / Quá tải thể tích kháng thuốc lợi tiểu',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chỉ định siêu lọc / lọc máu cấp cứu khẩn cấp (KDIGO 2012 Rec 5.1.1)'
        },
        {
          id: 'customInputs.contrastPlanned',
          labelVi: 'Dự kiến chụp mạch / CT có tiêm thuốc cản quang chứa iod',
          type: 'boolean',
          defaultValue: false,
          helpVi: `Đánh giá dự phòng CI-AKI và tạm ngừng Metformin khi eGFR < ${thFor('egfr', 'ckd.contrast.egfr_risk_threshold')} mL/phút/1.73m²`
        },
        {
          id: 'customInputs.contrastRouteIntraArterial',
          labelVi: 'Đường dùng thuốc cản quang động mạch (chụp/can thiệp mạch vành, nội mạch)',
          type: 'boolean',
          defaultValue: false,
          helpVi: `Truyền NaCl 0.9% dự phòng bắt buộc khi eGFR < ${thFor('egfr', 'ckd.egfr.g3b_min')} mL/phút/1.73m² hoặc đường động mạch`
        }
      ]
    }
  ]
};
