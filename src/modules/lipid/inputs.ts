/**
 * GDMT-VN Lipid Module - Input Schema
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { ModuleInputSchema } from '../../engine/types';

export const lipidInputs: ModuleInputSchema = {
  groups: [
    {
      id: 'lipid_labs',
      titleVi: 'Xét nghiệm Mỡ máu & An toàn cơ - gan - nội tiết',
      descriptionVi: 'Hồ sơ lipid máu lúc đói hoặc không nhịn đói, chức năng thận, men gan, men cơ và tuyến giáp nền.',
      fields: [
        {
          id: 'ldl',
          labelVi: 'LDL-Cholesterol (LDL-C)',
          type: 'number',
          unit: 'mmol/L',
          unitKey: 'lipid',
          min: 0.2,
          max: 15,
          step: 0.1,
          required: true,
          helpVi: 'Chỉ số mục tiêu chính trong điều trị hạ lipid máu'
        },
        {
          id: 'tc',
          labelVi: 'Cholesterol toàn phần (TC)',
          type: 'number',
          unit: 'mmol/L',
          unitKey: 'lipid',
          min: 1,
          max: 20,
          step: 0.1
        },
        {
          id: 'hdl',
          labelVi: 'HDL-Cholesterol (HDL-C)',
          type: 'number',
          unit: 'mmol/L',
          unitKey: 'lipid',
          min: 0.2,
          max: 5,
          step: 0.1
        },
        {
          id: 'tg',
          labelVi: 'Triglyceride (TG)',
          type: 'number',
          unit: 'mmol/L',
          unitKey: 'lipid',
          min: 0.2,
          max: 50,
          step: 0.1,
          helpVi: 'Đánh giá nguy cơ tồn dư, độ tin cậy công thức Friedewald và nguy cơ viêm tụy cấp'
        },
        {
          id: 'customInputs.nonHdl',
          labelVi: 'Non-HDL-Cholesterol',
          type: 'number',
          unit: 'mmol/L',
          unitKey: 'lipid',
          min: 0.5,
          max: 18,
          step: 0.1,
          helpVi: 'Mục tiêu thứ phát đặc biệt hữu ích ở ĐTĐ, béo phì hoặc tăng TG cao'
        },
        {
          id: 'apob',
          labelVi: 'Apolipoprotein B (ApoB)',
          type: 'number',
          unit: 'mg/dL',
          min: 10,
          max: 300,
          step: 1,
          helpVi: 'Phản ánh tổng số hạt lipoprotein gây xơ vữa'
        },
        {
          id: 'lpa',
          labelVi: 'Lipoprotein(a) - Lp(a) (mg/dL)',
          type: 'number',
          unit: 'mg/dL',
          min: 0,
          max: 400,
          step: 1,
          helpVi: 'Xét nghiệm ít nhất 1 lần trong đời để tầm soát nguy cơ di truyền'
        },
        {
          id: 'customInputs.lpaNmol',
          labelVi: 'Lipoprotein(a) - Lp(a) (nmol/L)',
          type: 'number',
          unit: 'nmol/L',
          min: 0,
          max: 900,
          step: 1,
          helpVi: 'Đơn vị mol ưu tiên theo ESC 2025 và ACC/AHA 2026'
        },
        {
          id: 'altUlnTimes',
          labelVi: 'ALT (số lần giới hạn trên bình thường - x ULN)',
          type: 'number',
          unit: 'x ULN',
          min: 0.1,
          max: 50,
          step: 0.1,
          helpVi: 'Tăng gấp nhiều lần ULN cần tạm ngưng/hoãn thuốc hạ lipid chuyển hóa qua gan'
        },
        {
          id: 'ckUlnTimes',
          labelVi: 'Creatine Kinase - CK (số lần x ULN)',
          type: 'number',
          unit: 'x ULN',
          min: 0.1,
          max: 100,
          step: 0.1,
          helpVi: 'Đánh giá độc tính cơ và nguy cơ tiêu cơ vân cấp'
        },
        {
          id: 'scr',
          labelVi: 'Creatinine huyết thanh',
          type: 'number',
          unit: 'µmol/L',
          unitKey: 'cr',
          min: 20,
          max: 1500,
          step: 1,
          helpVi: 'Dùng tính eGFR chỉnh liều rosuvastatin, pitavastatin, pravastatin và chống chỉ định fenofibrate'
        },
        {
          id: 'uacr',
          labelVi: 'Tỷ số Albumin / Creatinine niệu (UACR)',
          type: 'number',
          unit: 'mg/mmol',
          unitKey: 'uacr',
          min: 0,
          max: 500,
          step: 0.5,
          helpVi: 'Phát hiện tổn thương thận sớm để phân tầng nguy cơ rất cao ở bệnh nhân ĐTĐ hoặc CKD'
        },
        {
          id: 'uricAcid',
          labelVi: 'Acid uric máu',
          type: 'number',
          unit: 'µmol/L',
          unitKey: 'urat',
          min: 50,
          max: 1200,
          step: 5,
          helpVi: 'Lưu ý trước khi kê bempedoic acid (nguy cơ tăng acid uric và bùng phát gút)'
        },
        {
          id: 'customInputs.tsh',
          labelVi: 'Hormon kích thích tuyến giáp (TSH nền)',
          type: 'number',
          unit: 'mIU/L',
          min: 0.01,
          max: 200,
          step: 0.1,
          helpVi: 'Tầm soát suy giáp thứ phát gây tăng LDL-C và tăng nguy cơ tiêu cơ vân khi dùng statin'
        }
      ]
    },
    {
      id: 'lipid_risk_profile',
      titleVi: 'Phân tầng Nguy cơ Tim mạch & Tiền sử ASCVD',
      descriptionVi: 'Xác định tầng nguy cơ theo ESC/EAS 2019–2025, Bộ Y tế VN và ACC/AHA 2026 để chọn đích LDL-C.',
      fields: [
        {
          id: 'conditions.ascvd',
          labelVi: 'Bệnh tim mạch do xơ vữa đã xác định (ASCVD: BMV, NMCT, đột quỵ/TIA, PAD, tái thông mạch)',
          type: 'boolean'
        },
        {
          id: 'conditions.polyvascular',
          labelVi: 'Bệnh động mạch đa giường mạch (≥ 2 hệ mạch: vành, não/cảnh, động mạch ngoại biên/chủ)',
          type: 'boolean',
          helpVi: 'Cân nhắc đích LDL-C hạ sâu theo ESC/EAS 2025 (Class IIb)'
        },
        {
          id: 'conditions.recurrentAcsWithin2Years',
          labelVi: 'Tái phát biến cố mạch máu lần 2 trong vòng 2 năm (khi đang dùng statin liều tối đa dung nạp)',
          type: 'boolean',
          helpVi: 'Cân nhắc đích LDL-C hạ sâu theo ESC Class IIb'
        },
        {
          id: 'conditions.acuteAcsWithin24h',
          labelVi: 'Hội chứng vành cấp (ACS) đang nhập viện cấp tính',
          type: 'boolean'
        },
        {
          id: 'conditions.dm',
          labelVi: 'Đái tháo đường (típ 2 hoặc típ 1)',
          type: 'boolean'
        },
        {
          id: 'conditions.t1dm',
          labelVi: 'Đái tháo đường típ 1 (T1DM)',
          type: 'boolean',
          visibleIf: (p) => Boolean(p.conditions.dm),
          helpVi: 'T1DM từ 35 tuổi trở lên hoặc thời gian mắc kéo dài thuộc nhóm nguy cơ cao/rất cao'
        },
        {
          id: 'conditions.dmTargetOrganDamage',
          labelVi: 'ĐTĐ có tổn thương cơ quan đích (albumin niệu, bệnh võng mạc, thần kinh) hoặc ≥ 3 yếu tố nguy cơ chính',
          type: 'boolean'
        },
        {
          id: 'customInputs.dmDurationYears',
          labelVi: 'Thời gian mắc Đái tháo đường',
          type: 'number',
          unit: 'năm',
          min: 0,
          max: 60,
          step: 1,
          visibleIf: (p) => Boolean(p.conditions.dm)
        },
        {
          id: 'conditions.familialHypercholesterolemia',
          labelVi: 'Tăng cholesterol máu gia đình (FH) đã chẩn đoán',
          type: 'boolean'
        },
        {
          id: 'customInputs.dlcnScore',
          labelVi: 'Điểm Dutch Lipid Clinic Network (DLCN) nghi ngờ FH',
          type: 'number',
          unit: 'điểm',
          min: 0,
          max: 25,
          step: 1,
          helpVi: 'Dùng để khẳng định khả năng FH lâm sàng'
        },
        {
          id: 'customInputs.cacScore',
          labelVi: 'Điểm vôi hóa động mạch vành (CAC — Agatston)',
          type: 'number',
          unit: 'AU',
          min: 0,
          max: 5000,
          step: 10,
          helpVi: 'Hỗ trợ tái phân tầng nguy cơ dự phòng tiên phát khi nguy cơ lâm sàng ở ngưỡng trung gian'
        },
        {
          id: 'conditions.hiv',
          labelVi: 'Nhiễm HIV (từ 40 tuổi trở lên: chỉ định statin dự phòng tiên phát theo REPRIEVE)',
          type: 'boolean'
        },
        {
          id: 'conditions.kidneyTransplant',
          labelVi: 'Người nhận ghép thận (Kidney transplant recipient)',
          type: 'boolean',
          helpVi: 'Cân nhắc statin liều thấp–trung bình dự phòng biến cố mạch vành kèm kiểm soát tương tác ức chế miễn dịch'
        },
        {
          id: 'conditions.hf',
          labelVi: 'Suy tim mạn tính (Heart failure)',
          type: 'boolean',
          helpVi: 'Không khởi trị statin thường quy nếu suy tim đơn thuần không kèm ASCVD hoặc chỉ định hạ lipid khác'
        },
        {
          id: 'conditions.smoker',
          labelVi: 'Đang hút thuốc lá',
          type: 'boolean'
        },
        {
          id: 'conditions.htn',
          labelVi: 'Tăng huyết áp',
          type: 'boolean'
        },
        {
          id: 'customInputs.baselineLdl',
          labelVi: 'LDL-C nền trước khi dùng thuốc hạ mỡ máu (nếu biết)',
          type: 'number',
          unit: 'mmol/L',
          unitKey: 'lipid',
          min: 0.5,
          max: 18,
          step: 0.1,
          helpVi: 'Giúp kiểm tra mục tiêu kép giảm phần trăm LDL-C so với nền'
        }
      ]
    },
    {
      id: 'lipid_safety_flags',
      titleVi: 'Dung nạp Statin & Cảnh báo An toàn Cơ quan',
      fields: [
        {
          id: 'conditions.statinIntolerance',
          labelVi: 'Không dung nạp statin hoàn toàn (đã thử ≥ 2 statin khác nhau kể cả liều thấp nhất)',
          type: 'boolean'
        },
        {
          id: 'conditions.acutePancreatitis',
          labelVi: 'Đang viêm tụy cấp tính (Cấp cứu nội khoa / ICU, tạm hoãn thuốc uống)',
          type: 'boolean'
        },
        {
          id: 'conditions.historyPancreatitis',
          labelVi: 'Tiền sử viêm tụy cấp do tăng triglyceride',
          type: 'boolean'
        },
        {
          id: 'conditions.gallbladderDisease',
          labelVi: 'Bệnh túi mật hoặc sỏi mật đã biết (Chống chỉ định fenofibrate)',
          type: 'boolean'
        },
        {
          id: 'conditions.gout',
          labelVi: 'Bệnh Gút (thận trọng hoặc tạm hoãn bempedoic acid khi đang gút cấp)',
          type: 'boolean'
        },
        {
          id: 'conditions.tendonRuptureHistory',
          labelVi: 'Tiền sử đứt gân hoặc tổn thương gân Achille (ngừng/tránh bempedoic acid)',
          type: 'boolean'
        },
        {
          id: 'conditions.liverDisease',
          labelVi: 'Bệnh gan tiến triển cấp tính / Xơ gan mất bù',
          type: 'boolean'
        },
        {
          id: 'customInputs.childPugh',
          labelVi: 'Phân độ xơ gan Child-Pugh (nếu có xơ gan mạn)',
          type: 'select',
          options: [
            { value: '', label: 'Không xơ gan / Chưa phân độ' },
            { value: 'A', label: 'Child-Pugh A (Xơ gan còn bù nhẹ)' },
            { value: 'B', label: 'Child-Pugh B (Suy gan trung bình)' },
            { value: 'C', label: 'Child-Pugh C (Xơ gan mất bù nặng)' }
          ]
        },
        {
          id: 'conditions.untreatedHypothyroidism',
          labelVi: 'Suy giáp chưa điều trị ổn định (Cần bù hormon giáp trước khi khởi trị statin)',
          type: 'boolean'
        },
        {
          id: 'conditions.myastheniaGravis',
          labelVi: 'Nhược cơ toàn thể hoặc nhược cơ thể mắt (Cảnh báo nặng lên khi dùng statin)',
          type: 'boolean'
        },
        {
          id: 'conditions.onDialysis',
          labelVi: 'Đang lọc máu chu kỳ (chạy thận nhân tạo / lọc màng bụng)',
          type: 'boolean'
        },
        {
          id: 'conditions.pregnant',
          labelVi: 'Đang mang thai (Chống chỉ định statin, ezetimibe, PCSK9i, bempedoic, icosapent)',
          type: 'boolean'
        },
        {
          id: 'conditions.breastfeeding',
          labelVi: 'Đang cho con bú (Chống chỉ định statin, ezetimibe, fibrate, PCSK9i, bempedoic, icosapent)',
          type: 'boolean'
        },
        {
          id: 'customInputs.planningPregnancy',
          labelVi: 'Dự định mang thai trong 1–2 tháng tới (Ngừng trước statin và thuốc hạ lipid đường uống)',
          type: 'boolean'
        }
      ]
    }
  ]
};
