/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Định nghĩa đầu vào động
 * Phân quyền: Agent F4
 * Tuân thủ QA-8 & QA-10: Mọi ngưỡng hiển thị trong nhãn đều nội suy qua thFor(quantity, id) từ KB.
 */

import type { ModuleInputSchema } from '../../engine/types';
import { registerValidFields } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import { getMaxBasalDosePerKg } from './helpers.drugs';

registerValidFields([
  'historyMtcOrMen2',
  'historyPancreatitis',
  'activeFootUlcer',
  'activeFootUlcerOrAmputationRisk',
  'iodinatedContrast',
  'breastfeeding',
  'lactation',
  'activeBladderCancer',
  'bladderCancer',
  'severeGastroparesis',
  'gastroparesis',
  'diabeticRetinopathy',
  'retinopathy',
  'oralContraceptive',
  'childPugh',
  'childPughClass'
]);

export const dm2Inputs: ModuleInputSchema = {
  groups: [
    {
      id: 'dm2_glycemic_profile',
      titleVi: 'Hồ sơ Kiểm soát Đường huyết & Chống chỉ định Đặc thù',
      descriptionVi: 'Xác định mục tiêu HbA1c, đánh giá nguy cơ hạ đường huyết, dị hóa và tiền sử chống chỉ định thuốc',
      fields: [
        {
          id: 'customInputs.dmDurationYears',
          labelVi: 'Thời gian mắc đái tháo đường (năm)',
          type: 'number',
          min: 0,
          max: 60, // qa-allow: ui-step - Giới hạn trần năm mắc ĐTĐ
          step: 1, // qa-allow: ui-step - Bước nhảy nhập số năm
          placeholder: 'vd: 5',
          helpVi: 'Thời gian mắc bệnh giúp cá thể hóa mục tiêu HbA1c theo ADA/BYT'
        },
        {
          id: 'customInputs.elderlyHealthStatus',
          labelVi: `Phân tầng sức khỏe người cao tuổi (≥ ${thFor('age', 'dm2.elderly.age_threshold')} tuổi)`,
          type: 'select',
          options: [
            { value: 'not_elderly', label: `Dưới ${thFor('age', 'dm2.elderly.age_threshold')} tuổi / Trưởng thành chung` },
            { value: 'healthy', label: `Khỏe mạnh (ít bệnh mạn tính kèm theo, nhận thức nguyên vẹn) -> HbA1c < ${thFor('hba1c', 'dm2.hba1c.target_standard').toFixed(1)}–${thFor('hba1c', 'dm2.hba1c.target_older_healthy').toFixed(1)}%` },
            { value: 'complex', label: `Phức tạp / trung bình (nhiều bệnh mạn tính hoặc suy giảm nhẹ ADL/nhận thức) -> HbA1c < ${thFor('hba1c', 'dm2.hba1c.target_older_complex').toFixed(1)}%` },
            { value: 'very_complex', label: `Rất phức tạp / sức khỏe kém / giai đoạn cuối -> Tránh dựa vào HbA1c (< ${thFor('hba1c', 'dm2.hba1c.target_older_very_complex').toFixed(1)}%)` }
          ],
          defaultValue: 'not_elderly',
          helpVi: 'Theo khuyến cáo ADA 2026 Ch. 13 & BYT 5481 Bảng 5'
        },
        {
          id: 'customInputs.recentHypo',
          labelVi: 'Có biến cố hạ đường huyết trong vòng 3 tháng gần đây',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Nếu có: Cần giảm thang điều trị, không được tăng liều insulin/SU'
        },
        {
          id: 'customInputs.catabolicSymptoms',
          labelVi: 'Dấu hiệu dị hóa cấp (sụt cân nhanh, gầy sút, khát nhiều, tiểu nhiều)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chỉ định khởi trị insulin sớm và tạm hoãn SGLT2i cho tới khi hết dị hóa'
        },
        {
          id: 'customInputs.breastfeeding',
          labelVi: 'Đang cho con bú (thời kỳ hậu sản / nuôi con bằng sữa mẹ)',
          type: 'boolean',
          defaultValue: false,
          visibleIf: (p) => p.sex !== 'male',
          helpVi: 'Ưu tiên Insulin và/hoặc Metformin; ngừng SGLT2i, GLP-1/GIP-GLP-1 RA, SU, TZD, DPP-4i và Acarbose khi cho con bú'
        },
        {
          id: 'customInputs.historyMtcOrMen2',
          labelVi: 'Tiền sử bản thân/gia đình Ung thư tuyến giáp thể tủy (MTC) hoặc Hội chứng MEN 2',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Cảnh báo hộp đen FDA: Chống chỉ định tuyệt đối toàn bộ nhóm đồng vận GLP-1 và GIP/GLP-1 RA'
        },
        {
          id: 'customInputs.historyPancreatitis',
          labelVi: 'Tiền sử hoặc đang nghi ngờ Viêm tụy cấp',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Tránh khởi trị và ngừng ngay nhóm thuốc Incretin (GLP-1 RA, GIP/GLP-1 RA, DPP-4i) khi có viêm tụy cấp'
        },
        {
          id: 'customInputs.severeGastroparesis',
          labelVi: 'Liệt dạ dày nặng do đái tháo đường (Severe gastroparesis)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Tránh khởi trị nhóm GLP-1 RA / GIP-GLP-1 RA do làm chậm làm rỗng dạ dày nặng hơn'
        },
        {
          id: 'customInputs.diabeticRetinopathy',
          labelVi: 'Bệnh võng mạc đái tháo đường (Diabetic retinopathy)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Cần khám và theo dõi sát đáy mắt khi khởi trị/tăng bậc Semaglutide hoặc hạ nhanh HbA1c (SUSTAIN-6 / ADA 2026)'
        },
        {
          id: 'customInputs.activeBladderCancer',
          labelVi: 'Ung thư bàng quang đang hoạt động',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định sử dụng Pioglitazone theo nhãn FDA'
        },
        {
          id: 'customInputs.oralContraceptive',
          labelVi: 'Đang dùng thuốc tránh thai đường uống (OCP)',
          type: 'boolean',
          defaultValue: false,
          visibleIf: (p) => p.sex !== 'male',
          helpVi: `Khi khởi trị hoặc tăng mỗi bậc liều Tirzepatide, cần tránh thai rào chắn/không uống trong ${thFor('interval_weeks', 'dm2.tirzepatide.contraception_barrier_weeks')} tuần`
        },
        {
          id: 'customInputs.activeFootUlcer',
          labelVi: 'Đang có loét bàn chân ĐTĐ tiến triển, hoại thư, viêm xương hoặc tiền sử đoạn chi',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Ngừng ngay Canagliflozin (CANVAS) và tạm hoãn khởi trị SGLT2i cho tới khi ổ loét bàn chân lành ổn định'
        },
        {
          id: 'customInputs.contrastPlanned',
          labelVi: 'Dự kiến chụp thuốc cản quang iod đường tĩnh mạch / động mạch',
          type: 'boolean',
          defaultValue: false,
          helpVi: `Tạm ngừng Metformin trước/tại thời điểm tiêm cản quang iod và đánh giá lại eGFR sau ${thFor('duration_hours', 'dm2.contrast.recheck_hours')} giờ`
        },
        {
          id: 'customInputs.altUlnTimes',
          labelVi: 'Men gan ALT hoặc AST gấp mấy lần giới hạn trên bình thường (× ULN)',
          type: 'number',
          min: 0,
          max: 50, // qa-allow: ui-step - Giới hạn trần bội số ULN men gan
          step: 0.1, // qa-allow: ui-step - Bước nhảy bội số ULN men gan
          placeholder: 'vd: 1.2',
          helpVi: `> ${thFor('alt_uln', 'dm2.pioglitazone.alt_uln_max')}× ULN chống chỉ định Pioglitazone (FDA); > ${thFor('alt_uln', 'dm2.vildagliptin.alt_uln_max')}× ULN chống chỉ định Vildagliptin (EMA SmPC)`
        }
      ]
    },
    {
      id: 'dm2_insulin_assessment',
      titleVi: 'Đánh giá Liều Insulin & Quá liều nền (Overbasalization)',
      descriptionVi: 'Theo dõi dấu hiệu quá liều insulin nền ngoại trú',
      fields: [
        {
          id: 'customInputs.currentBasalDoseUnits',
          labelVi: 'Tổng liều insulin nền hiện tại (đơn vị/ngày)',
          type: 'number',
          min: 0,
          max: 150, // qa-allow: ui-step - Giới hạn trần tổng liều insulin nền
          step: 1, // qa-allow: ui-step - Bước nhảy liều đơn vị
          placeholder: 'vd: 24',
          helpVi: `Dùng để đánh giá ngưỡng overbasalization (> ${getMaxBasalDosePerKg()} đơn vị/kg/ngày — tương ứng > ${thFor('percentage', 'dm2.insulin.basal_share_of_tdd_pct')}% TDD ${thFor('insulin_u_per_kg', 'dm2.insulin.t2d_typical_tdd_per_kg')} U/kg)`
        },
        {
          id: 'customInputs.bedtimeToMorningDiff',
          labelVi: 'Chênh lệch glucose trước ngủ và sáng sớm (BeAM)',
          type: 'number',
          unitKey: 'glucose',
          min: 0,
          max: 360, // qa-allow: ui-step - Trần nhập hỗ trợ cả mmol/L và mg/dL theo unitKey glucose
          step: 0.1, // qa-allow: ui-step - Bước nhảy số thập phân
          placeholder: 'vd: 3.2 (mmol/L) hoặc 58 (mg/dL)',
          helpVi: `Chênh lệch ≥ ${thFor('glucose', 'dm2.overbasal.bedtime_morning_diff_mmol')} mmol/L (${thFor('glucose', 'dm2.overbasal.bedtime_morning_diff_mgdl')} mg/dL) là dấu hiệu cảnh báo overbasalization`
        }
      ]
    },
    {
      id: 'dm2_inpatient_group',
      titleVi: 'Thông số Nội viện, Tiền phẫu & Cấp cứu Tăng đường huyết',
      descriptionVi: 'Đánh giá Toan ceton (DKA), Hội chứng tăng áp lực thẩm thấu (HHS), chu phẫu và corticoid',
      fields: [
        {
          id: 'customInputs.inpatientUnit',
          labelVi: 'Khoa điều trị nội viện',
          type: 'select',
          options: [
            { value: 'ward', label: `Khoa Nội / Ngoại thông thường (Đích ${thFor('glucose', 'dm2.glucose.inpatient_target_min_mmol').toFixed(1)}–${thFor('glucose', 'dm2.glucose.inpatient_target_max_mmol').toFixed(1)} mmol/L / ${thFor('glucose', 'dm2.glucose.inpatient_target_min')}–${thFor('glucose', 'dm2.glucose.inpatient_target_max')} mg/dL)` },
            { value: 'icu', label: `Khoa Hồi sức tích cực - ICU (Đích ${thFor('glucose', 'dm2.glucose.icu_target_min_mmol').toFixed(1)}–${thFor('glucose', 'dm2.glucose.icu_target_max_mmol').toFixed(1)} mmol/L / ${thFor('glucose', 'dm2.glucose.icu_target_min')}–${thFor('glucose', 'dm2.glucose.inpatient_target_max')} mg/dL)` }
          ],
          defaultValue: 'ward'
        },
        {
          id: 'customInputs.inpatientEating',
          labelVi: 'Tình trạng dinh dưỡng nội viện',
          type: 'select',
          options: [
            { value: 'normal', label: 'Ăn uống đầy đủ qua đường miệng' },
            { value: 'poor', label: 'Ăn kém / thất thường (giảm liều bolus bữa ăn)' },
            { value: 'npo', label: 'Nhịn ăn hoàn toàn (NPO) / chuẩn bị mổ (giảm 20–25% insulin nền)' },
            { value: 'tube_feeding', label: 'Nuôi dưỡng liên tục qua ống thông dạ dày (Enteral feeding)' }
          ],
          defaultValue: 'normal'
        },
        {
          id: 'customInputs.onSteroidTherapy',
          labelVi: 'Đang dùng Corticoid toàn thân (Prednisone / Prednisolone / Methylprednisolone)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chỉ định phác đồ insulin NPH buổi sáng để kiểm soát đỉnh tăng đường huyết do steroid (ngoại trú & nội viện)'
        },
        {
          id: 'customInputs.plannedSurgery',
          labelVi: 'Có phẫu thuật chương trình sắp tới (trong vòng 3–4 ngày)',
          type: 'boolean',
          defaultValue: false,
          helpVi: `Yêu cầu tạm ngừng Dapagliflozin/Empagliflozin/Canagliflozin ít nhất ${thFor('duration_days', 'dm2.sglt2i.surgery_withhold_days')} ngày và Ertugliflozin ít nhất ${thFor('duration_days', 'dm2.ertugliflozin.surgery_withhold_days')} ngày trước phẫu thuật để phòng euglycemic DKA`
        },
        {
          id: 'customInputs.dkaSuspected',
          labelVi: 'Lâm sàng nghi ngờ Toan ceton ĐTĐ (DKA) / HHS cấp (nôn nhiều, thở Kussmaul, lơ mơ, mất nước)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Bật cảnh báo tầm soát khí máu tĩnh mạch, ceton máu (β-hydroxybutyrate), điện giải đồ và áp lực thẩm thấu'
        },
        {
          id: 'customInputs.bloodKetones',
          labelVi: 'Beta-hydroxybutyrate máu (mmol/L)',
          type: 'number',
          min: 0,
          max: 15, // qa-allow: ui-step - Giới hạn trần ceton máu
          step: 0.1, // qa-allow: ui-step - Bước nhảy số thập phân
          placeholder: 'vd: 3.5',
          helpVi: `≥ ${thFor('blood_ketones', 'dm2.dka.bhb_threshold').toFixed(1)} mmol/L kèm toan chuyển hóa là tiêu chuẩn vàng chẩn đoán DKA (Đồng thuận 2024)`
        },
        {
          id: 'customInputs.venousPh',
          labelVi: 'pH khí máu tĩnh mạch/động mạch',
          type: 'number',
          min: 6.5, // qa-allow: ui-step - Giới hạn sàn pH máu
          max: 7.6, // qa-allow: ui-step - Giới hạn trần pH máu
          step: 0.01, // qa-allow: ui-step - Bước nhảy pH
          placeholder: 'vd: 7.18',
          helpVi: `< ${thFor('venous_ph', 'dm2.dka.ph_threshold')} trong tiêu chuẩn toan chuyển hóa của DKA`
        },
        {
          id: 'customInputs.serumBicarb',
          labelVi: 'Bicarbonate huyết thanh (HCO₃⁻, mmol/L)',
          type: 'number',
          min: 1, // qa-allow: ui-step - Giới hạn sàn HCO3
          max: 40, // qa-allow: ui-step - Giới hạn trần HCO3
          step: 0.5, // qa-allow: ui-step - Bước nhảy bicarbonate
          placeholder: 'vd: 12',
          helpVi: `< ${thFor('serum_bicarb', 'dm2.dka.bicarb_threshold')} mmol/L trong tiêu chuẩn toan chuyển hóa của DKA consensus 2024`
        },
        {
          id: 'customInputs.effectiveOsmolality',
          labelVi: 'Áp lực thẩm thấu huyết thanh hiệu dụng (mOsm/kg)',
          type: 'number',
          min: 250, // qa-allow: ui-step - Giới hạn sàn ALTT
          max: 420, // qa-allow: ui-step - Giới hạn trần ALTT
          step: 1, // qa-allow: ui-step - Bước nhảy áp lực thẩm thấu
          placeholder: 'vd: 315',
          helpVi: `> ${thFor('effective_osmolality', 'dm2.hhs.effective_osmolality_threshold')} mOsm/kg (hoặc tổng ALTT > ${thFor('effective_osmolality', 'dm2.hhs.osmolality_threshold')} mOsm/kg) là tiêu chuẩn chẩn đoán HHS theo Đồng thuận 2024`
        }
      ]
    }
  ]
};
