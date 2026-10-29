/**
 * GDMT-VN Module Tăng huyết áp (htn) - Khai báo Đầu vào động
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { ModuleInputSchema } from '../../engine/types';

export const htnInputs: ModuleInputSchema = {
  groups: [
    {
      id: 'htn_outpatient_monitoring',
      titleVi: 'Theo dõi Huyết áp Ngoại trú & Phân tầng Nguy cơ (HBPM / ABPM / SCORE2 / PREVENT)',
      descriptionVi: 'Đo huyết áp ngoài phòng khám và thang điểm nguy cơ tim mạch mười năm để cá thể hóa ngưỡng khởi trị thuốc',
      fields: [
        {
          id: 'customInputs.homeSbp',
          labelVi: 'Huyết áp tâm thu tại nhà (HBPM, mmHg)',
          type: 'number',
          placeholder: 'vd: 132'
        },
        {
          id: 'customInputs.homeDbp',
          labelVi: 'Huyết áp tâm trương tại nhà (HBPM, mmHg)',
          type: 'number',
          placeholder: 'vd: 82'
        },
        {
          id: 'customInputs.abpm24hSbp',
          labelVi: 'HA tâm thu trung bình 24 giờ (Holter ABPM, mmHg)',
          type: 'number',
          placeholder: 'vd: 128'
        },
        {
          id: 'customInputs.abpm24hDbp',
          labelVi: 'HA tâm trương trung bình 24 giờ (Holter ABPM, mmHg)',
          type: 'number',
          placeholder: 'vd: 78'
        },
        {
          id: 'customInputs.score2RiskPercent',
          labelVi: 'Nguy cơ tim mạch 10 năm SCORE2 / SCORE2-OP (%)',
          type: 'number',
          placeholder: 'vd: 12'
        },
        {
          id: 'customInputs.preventRiskPct',
          labelVi: 'Nguy cơ tim mạch 10 năm AHA PREVENT (%)',
          type: 'number',
          placeholder: 'vd: 8.5'
        },
        {
          id: 'conditions.orthostaticHypotension',
          labelVi: 'Hạ huyết áp tư thế đứng có triệu chứng (chóng mặt, choáng váng khi đứng dậy)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.frailty',
          labelVi: 'Người bệnh suy yếu lâm sàng mức độ vừa đến nặng',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.limitedLifespan',
          labelVi: 'Kỳ vọng sống giới hạn (dưới ba năm)',
          type: 'boolean',
          defaultValue: false
        }
      ]
    },
    {
      id: 'htn_secondary_screening',
      titleVi: 'Tầm soát Tăng huyết áp Thứ phát & Cổng An toàn Đặc hiệu',
      descriptionVi: 'Dấu hiệu chỉ điểm nguyên nhân thứ phát và chống chỉ định tim mạch / sản khoa đặc hiệu',
      fields: [
        {
          id: 'conditions.unprovokedHypokalemia',
          labelVi: 'Hạ kali máu tự phát hoặc do lợi tiểu liều thấp (nghi ngờ Cường Aldosteron nguyên phát)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.renalBruit',
          labelVi: 'Tiếng thổi động mạch thận hoặc suy giảm chức năng thận sau RASi (nghi ngờ Hẹp ĐM thận)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'customInputs.bilateralRenalArteryStenosis',
          labelVi: 'Hẹp động mạch thận hai bên hoặc hẹp động mạch thận trên thận độc nhất',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.priorAngioedema',
          labelVi: 'Tiền sử phù mạch (Angioedema) liên quan thuốc ức chế men chuyển ACEi / ARNI',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.snoringOsa',
          labelVi: 'Hội chứng ngưng thở khi ngủ do tắc nghẽn (ngáy to, buồn ngủ ban ngày)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.suspectedSecondaryHtn',
          labelVi: 'Nghi ngờ THA thứ phát (khởi phát trước 40 tuổi theo ESC 2024 hoặc THA kháng trị)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'customInputs.postpartum',
          labelVi: 'Phụ nữ giai đoạn hậu sản / sau sinh (cần tránh trầm cảm hậu sản do Methyldopa)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'customInputs.severeAorticStenosis',
          labelVi: 'Hẹp khít van động mạch chủ nặng (chống chỉ định thuốc giãn mạch mạnh Nicardipine)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'customInputs.avBlock2or3',
          labelVi: 'Block nhĩ thất độ 2–3 hoặc hội chứng suy nút xoang chưa đặt máy tạo nhịp',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'customInputs.pacemaker',
          labelVi: 'Đã đặt máy tạo nhịp tim vĩnh viễn hoạt động tốt',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.myastheniaGravis',
          labelVi: 'Bệnh nhược cơ (Myasthenia gravis — chống chỉ định Magnesium sulfate)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.breastfeeding',
          labelVi: 'Đang cho con bú (cá thể hóa thuốc hạ áp an toàn thời kỳ hậu sản)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.aceiIntolerance',
          labelVi: 'Ho khan hoặc không dung nạp thuốc ức chế men chuyển (ACEi)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.allergyAceiArb',
          labelVi: 'Dị ứng / phản vệ với nhóm ACEi hoặc ARB',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.sulfonamideAllergy',
          labelVi: 'Dị ứng dẫn xuất Sulfonamide nặng (thận trọng lợi tiểu Thiazide/Quai)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'customInputs.baselineScr',
          labelVi: 'Creatinin huyết thanh nền trước điều trị RASi (µmol/L hoặc mg/dL)',
          type: 'number',
          placeholder: 'vd: 88'
        },
        {
          id: 'customInputs.childPugh',
          labelVi: 'Phân độ suy gan Child-Pugh (A / B / C)',
          type: 'select',
          options: [
            { value: '', label: 'Không suy gan' },
            { value: 'A', label: 'Child-Pugh A (nhẹ)' },
            { value: 'B', label: 'Child-Pugh B (vừa)' },
            { value: 'C', label: 'Child-Pugh C (nặng)' }
          ]
        },
        {
          id: 'customInputs.aorticCoarctation',
          labelVi: 'Hẹp eo động mạch chủ (nguyên nhân THA thứ phát người trẻ)',
          type: 'boolean',
          defaultValue: false
        }
      ]
    },
    {
      id: 'htn_inpatient_emergency_hmod',
      titleVi: 'Bối cảnh Nội viện: Tổn thương Cơ quan Đích Cấp (HMOD)',
      descriptionVi: 'Phân định Cấp cứu tăng huyết áp (Hypertensive Emergency) cần hạ áp đường tĩnh mạch chuẩn độ',
      fields: [
        {
          id: 'conditions.aorticDissection',
          labelVi: 'Bóc tách / Hội chứng động mạch chủ cấp',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.acuteAcsWithin24h',
          labelVi: 'Hội chứng mạch vành cấp trong 24 giờ (nhồi máu cơ tim cấp / đau thắt ngực không ổn định)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.acutePulmonaryEdema',
          labelVi: 'Phù phổi cấp huyết động do tim (khó thở dữ dội, ran ẩm dâng nhanh)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.acuteIschemicStroke',
          labelVi: 'Đột quỵ nhồi máu não cấp (AIS)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.thrombolysisEligible',
          labelVi: 'Nhồi máu não có chỉ định tiêu sợi huyết tĩnh mạch (rtPA / Tenecteplase)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'customInputs.postReperfusionEvt',
          labelVi: 'Đột quỵ tắc mạch lớn đã lấy huyết khối cơ học (EVT) tái thông thành công',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.acuteIntracerebralHemorrhage',
          labelVi: 'Đột quỵ xuất huyết não cấp (ICH)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.severePreeclampsiaEclampsia',
          labelVi: 'Tiền sản giật nặng / Sản giật / Hội chứng HELLP',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.hypertensiveEncephalopathy',
          labelVi: 'Bệnh não do tăng huyết áp (đau đầu dữ dội, nhìn mờ, lú lẫn, co giật)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.malignantHypertension',
          labelVi: 'Tăng huyết áp ác tính (xuất huyết/xuất tiết võng mạc, phù gai thị, vi mạch huyết khối)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'conditions.perioperativeHypertension',
          labelVi: 'Tăng huyết áp chu phẫu / quanh phẫu thuật',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'customInputs.pde5InhibitorUse',
          labelVi: 'Đã dùng thuốc ức chế PDE-5 gần đây (Sildenafil/Vardenafil trong 24h hoặc Tadalafil trong 48h)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'customInputs.oliguria',
          labelVi: 'Thiểu niệu / vô niệu (< 25–30 mL/giờ — nguy cơ ngộ độc Magnesium sulfate)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'customInputs.catecholamineExcess',
          labelVi: 'Cơn tăng catecholamine cấp (u tủy thượng thận / ngộ độc giao cảm / cocaine)',
          type: 'boolean',
          defaultValue: false
        },
        {
          id: 'customInputs.soyEggAllergy',
          labelVi: 'Dị ứng nặng với đậu nành hoặc trứng (chống chỉ định nhũ tương Clevidipine)',
          type: 'boolean',
          defaultValue: false
        }
      ]
    }
  ]
};
