/**
 * Schema đầu vào chuyên biệt cho Module Rung nhĩ (AF)
 * Bám sát khung thực hành AF-CARE (ESC 2024 & ACC/AHA 2023)
 */

import type { ModuleInputSchema } from '../../engine/types';

export const afInputs: ModuleInputSchema = {
  groups: [
    {
      id: 'af_clinical_characteristics',
      titleVi: 'Đặc điểm lâm sàng Rung nhĩ (Phân loại & Triệu chứng)',
      descriptionVi: 'Phân loại theo thời gian tiến triển và thang điểm triệu chứng EHRA',
      fields: [
        {
          id: 'customInputs.afType',
          labelVi: 'Phân loại Rung nhĩ',
          type: 'select',
          defaultValue: 'paroxysmal',
          options: [
            { value: 'first_diagnosed', label: 'Mới chẩn đoán lần đầu (First-diagnosed AF)' },
            { value: 'paroxysmal', label: 'Kịch phát (Paroxysmal AF – tự hết trong 7 ngày)' },
            { value: 'persistent', label: 'Bền bỉ (Persistent AF – kéo dài trên 7 ngày)' },
            { value: 'permanent', label: 'Vĩnh viễn (Permanent AF – chấp nhận sống chung, không chuyển nhịp)' }
          ],
          helpVi: 'Quyết định chiến lược kiểm soát tần số đơn thuần hay phối hợp kiểm soát nhịp.'
        },
        {
          id: 'customInputs.ehraScore',
          labelVi: 'Mức độ triệu chứng EHRA',
          type: 'select',
          defaultValue: '2a',
          options: [
            { value: '1', label: 'EHRA 1 – Không triệu chứng' },
            { value: '2a', label: 'EHRA 2a – Triệu chứng nhẹ (không ảnh hưởng sinh hoạt)' },
            { value: '2b', label: 'EHRA 2b – Triệu chứng vừa (khó chịu nhưng vẫn sinh hoạt bình thường)' },
            { value: '3', label: 'EHRA 3 – Triệu chứng nặng (ảnh hưởng hoạt động hàng ngày)' },
            { value: '4', label: 'EHRA 4 – Triệu chứng tàn phế (ngưng mọi sinh hoạt thường nhật)' }
          ],
          helpVi: 'Đánh giá gánh nặng triệu chứng để chỉ định kiểm soát nhịp hoặc triệt đốt qua ống thông.'
        },
        {
          id: 'customInputs.afOnset',
          labelVi: 'Thời gian khởi phát cơn rung nhĩ cấp (Nội viện / Cấp cứu)',
          type: 'select',
          options: [
            { value: 'lt_24h', label: 'Khởi phát rõ ràng dưới 24 giờ' },
            { value: '24_to_48h', label: 'Từ 24 đến 48 giờ' },
            { value: 'gt_48h_or_unknown', label: 'Trên 48 giờ hoặc không rõ thời điểm khởi phát' }
          ],
          helpVi: 'Theo ESC 2024: Ngưỡng an toàn chuyển nhịp sớm không cần siêu âm thực quản được rút ngắn xuống dưới 24 giờ.'
        },
        {
          id: 'customInputs.hemodynamicStability',
          labelVi: 'Tình trạng huyết động (Nội viện / Cấp cứu)',
          type: 'select',
          defaultValue: 'stable',
          options: [
            { value: 'stable', label: 'Huyết động ổn định' },
            { value: 'unstable', label: 'Mất ổn định huyết động (Tụt HA, phù phổi cấp, đau ngực thiếu máu cơ tim, sốc)' }
          ],
          helpVi: 'Nếu mất ổn định huyết động, chỉ định sốc điện chuyển nhịp đồng bộ khẩn cấp (Class I).'
        }
      ]
    },
    {
      id: 'af_valvular_and_risk',
      titleVi: 'Tình trạng Van tim, Chống chỉ định & Yếu tố nguy cơ chuyên biệt',
      descriptionVi: 'Xác định chống chỉ định tuyệt đối của DOAC, thuốc chẹn nút AV và thuốc chống loạn nhịp',
      fields: [
        {
          id: 'conditions.mechanicalValve',
          labelVi: 'Van tim cơ học (Mechanical Heart Valve)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định tuyệt đối mọi thuốc DOAC (Class III). Bắt buộc dùng kháng Vitamin K (Warfarin/Acenocoumarol).'
        },
        {
          id: 'conditions.mitralStenosis',
          labelVi: 'Hẹp van hai lá mức độ vừa – khít do thấp',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Thử nghiệm INVICTUS: Bắt buộc dùng kháng Vitamin K; không dùng DOAC.'
        },
        {
          id: 'conditions.antiphospholipidSyndrome',
          labelVi: 'Hội chứng kháng phospholipid (APS)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định thuốc DOAC do tăng nguy cơ huyết khối tái phát (TRAPS); bắt buộc dùng kháng Vitamin K.'
        },
        {
          id: 'conditions.activeBleeding',
          labelVi: 'Đang xuất huyết nặng / tiến triển',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định tuyệt đối mọi thuốc chống đông; ưu tiên cầm máu và hóa giải đặc hiệu.'
        },
        {
          id: 'conditions.wpw',
          labelVi: 'Hội chứng WPW / Rung nhĩ tiền kích thích (Pre-excited AF)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định tuyệt đối Chẹn beta, Diltiazem, Verapamil, Digoxin, Amiodarone và Adenosine (nguy cơ rung thất).'
        },
        {
          id: 'conditions.hypertrophicCardiomyopathy',
          labelVi: 'Bệnh cơ tim phì đại (HCM)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'ESC 2024 Class I: Bắt buộc chống đông đường uống bất kể điểm CHA₂DS₂-VA; tránh Flecainide/Propafenone/Dronedarone.'
        },
        {
          id: 'conditions.cardiacAmyloidosis',
          labelVi: 'Bệnh cơ tim thoái hóa dạng bột (Cardiac Amyloidosis)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'ESC 2024 Class I: Bắt buộc chống đông bất kể điểm CHA₂DS₂-VA; chống chỉ định Digoxin và Non-DHP CCB.'
        },
        {
          id: 'conditions.cad',
          labelVi: 'Bệnh động mạch vành (CAD / Nhồi máu cơ tim cũ)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Tính 1 điểm mạch máu (V) trên CHA₂DS₂-VA và chống chỉ định thuốc nhóm IC (Flecainide/Propafenone).'
        },
        {
          id: 'conditions.pad',
          labelVi: 'Bệnh động mạch ngoại biên (PAD / Mảng xơ vữa động mạch chủ)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Tính 1 điểm mạch máu (V) trên CHA₂DS₂-VA.'
        },
        {
          id: 'conditions.breastfeeding',
          labelVi: 'Đang cho con bú (Hậu sản)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Tránh DOAC và Amiodarone/Dronedarone khi cho con bú; ưu tiên Warfarin/Acenocoumarol hoặc Heparin trọng lượng phân tử thấp.'
        },
        {
          id: 'qtc',
          labelVi: 'Khoảng QTc trên điện tâm đồ',
          type: 'number',
          unit: 'ms',
          min: 300,
          max: 700,
          step: 5,
          placeholder: 'Ví dụ: 440',
          helpVi: 'Chống chỉ định Sotalol, Dronedarone và thận trọng tối đa Amiodarone khi QTc kéo dài trên 500 ms.'
        },
        {
          id: 'customInputs.childPugh',
          labelVi: 'Phân độ xơ gan Child-Pugh (nếu có bệnh gan)',
          type: 'select',
          defaultValue: 'none',
          options: [
            { value: 'none', label: 'Không xơ gan / Chưa phân độ' },
            { value: 'A', label: 'Child-Pugh A (Suy gan nhẹ – cho phép dùng DOAC)' },
            { value: 'B', label: 'Child-Pugh B (Suy gan vừa – cấm Rivaroxaban, thận trọng Apixaban/Dabigatran/Edoxaban)' },
            { value: 'C', label: 'Child-Pugh C (Suy gan nặng – chống chỉ định tất cả DOAC)' }
          ],
          helpVi: 'Phân tầng an toàn gan theo nhãn FDA/EMA cho từng thuốc chống đông DOAC.'
        },
        {
          id: 'customInputs.vkaTtr',
          labelVi: 'Tỷ lệ thời gian INR trong khoảng đích – TTR (nếu đang dùng VKA)',
          type: 'number',
          unit: '%',
          min: 0,
          max: 100,
          step: 5,
          placeholder: 'Ví dụ: 55',
          helpVi: 'ESC 2024 Class I: Khuyến cáo chuyển từ VKA sang DOAC nếu TTR dưới 70% (trừ van cơ học/hẹp hai lá).'
        },
        {
          id: 'customInputs.alreadyAnticoagulated3WeeksOrTee',
          labelVi: 'Đã chống đông hiệu quả đủ ≥ 3 tuần hoặc siêu âm thực quản (TEE) âm tính huyết khối',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Cho phép thực hiện chuyển nhịp chủ động an toàn khi rung nhĩ kéo dài trên 24 giờ.'
        },
        {
          id: 'customInputs.plannedProcedureRisk',
          labelVi: 'Nguy cơ chảy máu của phẫu thuật / thủ thuật sắp tới',
          type: 'select',
          defaultValue: 'none',
          options: [
            { value: 'none', label: 'Không có kế hoạch thủ thuật / phẫu thuật' },
            { value: 'minor', label: 'Thủ thuật nguy cơ rất thấp (nhổ 1–3 răng, mổ đục thủy tinh thể, nội soi không sinh thiết)' },
            { value: 'low', label: 'Phẫu thuật nguy cơ chảy máu thấp' },
            { value: 'high', label: 'Phẫu thuật nguy cơ chảy máu cao (phẫu thuật bụng, lồng ngực, thần kinh, gây tê tủy sống)' }
          ],
          helpVi: 'Hướng dẫn thời gian tạm ngưng DOAC/VKA và chỉ định bắc cầu Heparin chu phẫu.'
        }
      ]
    }
  ]
};
