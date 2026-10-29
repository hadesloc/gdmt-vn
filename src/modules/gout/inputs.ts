import type { ModuleInputSchema, Patient } from '../../engine/types';
import { thFor } from '../../kb-types';

const tophiTargetUmol = thFor('urate', 'gout.target.urate_tophi_umol');
const vnTophiTargetUmol = thFor('urate', 'gout.target.urate_vn_tophi_umol');
const frequentFlaresCutoff = thFor('gout_flares', 'gout.indication.flares_per_year_frequent');
const vnUrineUrateMax = thFor('dose_mg', 'gout.uricosuric.vn_urine_urate_max');
const earlyColchHours = thFor('duration_hours', 'gout.flare.colchicine_early_hours');

export const goutInputs: ModuleInputSchema = {
  groups: [
    {
      id: 'gout_clinical_group',
      titleVi: 'Đặc điểm lâm sàng & Hoạt tính bệnh Gút',
      descriptionVi: 'Phân loại mức độ nặng, thời gian khởi phát cơn cấp, tổn thương khớp và tần suất đợt cấp theo ACR 2020 & EULAR 2016',
      fields: [
        {
          id: 'customInputs.asymptomaticHyperuricemia',
          labelVi: 'Tăng acid uric máu KHÔNG triệu chứng (chưa từng có cơn viêm khớp gút)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'ACR 2020 và KDIGO 2024 khuyến cáo KHÔNG khởi trị thuốc hạ urat máu cho tăng acid uric máu đơn thuần không triệu chứng'
        },
        {
          id: 'tophi',
          labelVi: 'Có hạt tophi dưới da (thăm khám thấy)',
          type: 'boolean',
          defaultValue: false,
          helpVi: `Chỉ định mạnh khởi trị thuốc hạ urat máu (ULT) và đặt đích urat tích cực < ${tophiTargetUmol} µmol/L theo EULAR (< ${vnTophiTargetUmol} µmol/L theo BYT 361/2014)`
        },
        {
          id: 'customInputs.xrayDamage',
          labelVi: 'Tổn thương khuyết xương / bào mòn khớp (erosions) trên X-quang, siêu âm hoặc DECT do gút',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Bằng chứng tổn thương cấu trúc khớp mạn tính do tinh thể urat (ACR 2020)'
        },
        {
          id: 'goutFlaresYear',
          labelVi: 'Số đợt cấp gút trong 12 tháng qua',
          type: 'number',
          min: 0,
          max: 24,
          step: 1,
          placeholder: 'vd: 2',
          helpVi: `≥ ${frequentFlaresCutoff} đợt cấp/năm là chỉ định mạnh khởi trị thuốc hạ urat máu`
        },
        {
          id: 'customInputs.priorFlaresLifetime',
          labelVi: 'Tổng số đợt cấp gút từng bị trong đời',
          type: 'number',
          min: 0,
          max: 50,
          step: 1,
          placeholder: 'vd: 1 hoặc >1',
          helpVi: 'Phân biệt chưa từng bị cơn cấp (0), cơn đầu tiên (1) hay tái phát nhiều cơn (>1)'
        },
        {
          id: 'customInputs.urolithiasis',
          labelVi: 'Tiền sử sỏi thận tiết niệu (sỏi urat / sỏi cản quang)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định thuốc tăng thải acid uric (probenecid, benzbromarone); chỉ định sớm ULT'
        },
        {
          id: 'customInputs.acuteFlare',
          labelVi: 'Bệnh nhân ĐANG CÓ CƠN GÚT CẤP (sưng, nóng, đỏ, đau dữ dội)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Kích hoạt phác đồ chống viêm cấp (colchicine liều thấp, NSAID hoặc corticoid) và nguyên tắc vàng KHÔNG ngừng ULT an toàn đang dùng'
        },
        {
          id: 'customInputs.flareHoursSinceOnset',
          labelVi: 'Thời gian từ khi khởi phát cơn gút cấp (giờ)',
          type: 'number',
          min: 0,
          max: 336,
          step: 1,
          placeholder: `vd: 6 (tối ưu ≤ ${earlyColchHours} giờ đầu)`,
          visibleIf: (p: Patient) => p.customInputs?.acuteFlare === true,
          helpVi: `Colchicine đạt hiệu quả tối ưu trong ${earlyColchHours} giờ đầu (EULAR 2016); nếu đến muộn > 36 giờ ưu tiên NSAID hoặc Corticosteroid`
        },
        {
          id: 'customInputs.severePolyarticularFlare',
          labelVi: 'Cơn gút cấp nặng đau dữ dội hoặc viêm đa khớp (≥ 4 khớp / nhiều khớp lớn)',
          type: 'boolean',
          defaultValue: false,
          visibleIf: (p: Patient) => p.customInputs?.acuteFlare === true,
          helpVi: 'EULAR 2016 Rec 2 khuyến cáo cân nhắc phối hợp thuốc cắt cơn an toàn (Colchicine + NSAID hoặc Colchicine + Corticosteroid; tuyệt đối KHÔNG phối hợp NSAID + Corticosteroid)'
        },
        {
          id: 'customInputs.monoarthritisLargeJoint',
          labelVi: 'Viêm đơn khớp hoặc 1–2 khớp lớn (khớp gối, cổ chân) có thể tiêm nội khớp',
          type: 'boolean',
          defaultValue: false,
          visibleIf: (p: Patient) => p.customInputs?.acuteFlare === true,
          helpVi: 'Xem xét chỉ định chọc hút dịch khớp và tiêm corticoid nội khớp khi đã loại trừ viêm khớp nhiễm khuẩn'
        },
        {
          id: 'customInputs.septicArthritisSuspected',
          labelVi: 'Nghi ngờ viêm khớp nhiễm khuẩn hoặc sốt cao chưa rõ nguyên nhân trên khớp sưng nóng đỏ',
          type: 'boolean',
          defaultValue: false,
          visibleIf: (p: Patient) => p.customInputs?.acuteFlare === true,
          helpVi: 'Bắt buộc chọc hút dịch khớp khẩn cấp (soi tế bào, nhuộm Gram, cấy vi khuẩn); TUYỆT ĐỐI cấm tiêm corticoid nội khớp hoặc dùng corticoid toàn thân trước khi loại trừ nhiễm mủ khớp'
        }
      ]
    },
    {
      id: 'gout_safety_group',
      titleVi: 'Xét nghiệm gen, Dị ứng, Chức năng gan & Cổng an toàn thuốc',
      descriptionVi: 'Sàng lọc biến chứng dị ứng nặng, thời kỳ cho con bú, phân độ xơ gan và tương tác thuốc trọng yếu',
      fields: [
        {
          id: 'customInputs.hlab5801',
          labelVi: 'Kết quả xét nghiệm gen HLA-B*58:01',
          type: 'select',
          options: [
            { value: 'not_done', label: 'Chưa làm xét nghiệm' },
            { value: 'negative', label: 'Âm tính (HLA-B*58:01 Âm tính)' },
            { value: 'positive', label: 'DƯƠNG TÍNH (Chống chỉ định tuyệt đối Allopurinol)' }
          ],
          defaultValue: 'not_done',
          helpVi: 'ACR 2020 khuyến cáo sàng lọc ở người gốc Đông Nam Á (Việt Nam, Hoa, Hàn, Thái) và người Mỹ gốc Phi trước khi khởi trị allopurinol'
        },
        {
          id: 'customInputs.highRiskHlaB5801Ancestry',
          labelVi: 'Chủng tộc nguy cơ cao mang gen HLA-B*58:01 (gốc Đông Nam Á / Hoa / Hàn / Thái hoặc người Mỹ gốc Phi)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Kích hoạt khuyến cáo sàng lọc HLA-B*58:01 trước khi dùng Allopurinol trên hồ sơ US / INTL (mặc định bật cho hồ sơ VN)'
        },
        {
          id: 'customInputs.breastfeeding',
          labelVi: 'Phụ nữ đang cho con bú (không mang thai)',
          type: 'boolean',
          defaultValue: false,
          visibleIf: (p: Patient) => p.sex === 'female',
          helpVi: 'Chống chỉ định Etoricoxib, Benzbromarone và tránh Febuxostat khi đang cho con bú; phân biệt rõ với thai kỳ'
        },
        {
          id: 'customInputs.childPugh',
          labelVi: 'Phân độ suy gan / xơ gan Child-Pugh (nếu có bệnh gan)',
          type: 'select',
          options: [
            { value: '', label: 'Không có xơ gan / Chức năng gan bình thường' },
            { value: 'A', label: 'Child-Pugh A (5–6 điểm: suy gan nhẹ)' },
            { value: 'B', label: 'Child-Pugh B (7–9 điểm: suy gan vừa)' },
            { value: 'C', label: 'Child-Pugh C (≥ 10 điểm: suy gan nặng / xơ gan mất bù)' }
          ],
          defaultValue: '',
          helpVi: 'Giới hạn liều Etoricoxib (≤ 60 mg ở Child-Pugh A, ≤ 30 mg ở Child-Pugh B, chống chỉ định Child-Pugh C), giảm 50% Celecoxib ở Child-Pugh B, chống chỉ định Benzbromarone và tránh Colchicine ở Child-Pugh C'
        },
        {
          id: 'customInputs.allopurinolIntolerant',
          labelVi: 'Tiền sử dị ứng hoặc không dung nạp Allopurinol',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định dùng lại allopurinol; chuyển sang febuxostat (theo dõi sát ban da) hoặc thuốc tăng thải urat phù hợp'
        },
        {
          id: 'customInputs.febuxostatIntolerant',
          labelVi: 'Tiền sử dị ứng hoặc không dung nạp Febuxostat',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Không dùng febuxostat; nếu đồng thời chống chỉ định allopurinol thì chuyển sang nhóm tăng thải acid uric hoặc hội chẩn chuyên khoa'
        },
        {
          id: 'customInputs.colchicineIntolerant',
          labelVi: 'Tiền sử dị ứng hoặc không dung nạp nặng Colchicine',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định Colchicine; chuyển cắt cơn và dự phòng sang Corticosteroid hoặc NSAID phù hợp'
        },
        {
          id: 'customInputs.nsaidAllergyOrAerd',
          labelVi: 'Tiền sử dị ứng/phản vệ NSAID hoặc hen phế quản / mày đay khởi phát do Aspirin (AERD / Samter)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định tuyệt đối toàn bộ nhóm NSAID và COX-2i'
        },
        {
          id: 'customInputs.sulfonamideAllergy',
          labelVi: 'Tiền sử dị ứng nhóm Sulfonamide (Sulfa / Cotrimoxazole)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định tuyệt đối Celecoxib (FDA Celebrex Mục 4)'
        },
        {
          id: 'customInputs.hasCvd',
          labelVi: 'Có tiền sử bệnh tim mạch (nhồi máu cơ tim, đột quỵ, bệnh mạch vành) hoặc suy tim',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Cảnh báo hộp đen FDA (CARES): Cân nhắc chuyển febuxostat sang allopurinol nếu không có chống chỉ định dị ứng/gen'
        },
        {
          id: 'customInputs.pepticUlcer',
          labelVi: 'Tiền sử loét dạ dày tá tràng hoặc tiền sử xuất huyết tiêu hóa',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định dùng NSAID điều trị hoặc dự phòng cơn cấp gút'
        },
        {
          id: 'customInputs.onAnticoagulant',
          labelVi: 'Đang điều trị thuốc chống đông máu (Warfarin, Acenocoumarol, DOAC, Heparin)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định dùng NSAID và chống chỉ định phối hợp Benzbromarone với kháng Vitamin K'
        },
        {
          id: 'customInputs.cyp3a4PgpInhibitor',
          labelVi: 'Đang dùng thuốc ức chế mạnh CYP3A4 hoặc P-gp (Paxlovid/ritonavir, clarithromycin, ketoconazole, cyclosporine...)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định dùng đồng thời Colchicine do nguy cơ ngộ độc suy đa tạng gây tử vong'
        },
        {
          id: 'customInputs.moderateCyp3a4Inhibitor',
          labelVi: 'Đang dùng thuốc ức chế vừa CYP3A4 / P-gp (verapamil, diltiazem, fluconazole, erythromycin, amiodarone, dronedarone)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định Colchicine nếu kèm suy thận/suy gan hoặc đang uống Colchicine dự phòng; bắt buộc giảm liều nếu thận-gan bình thường'
        },
        {
          id: 'customInputs.takingAzathioprine',
          labelVi: 'Đang dùng thuốc ức chế miễn dịch Azathioprine hoặc 6-Mercaptopurine',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định phối hợp với Allopurinol và Febuxostat do ức chế xanthine oxidase gây suy tủy xương đe dọa tính mạng'
        },
        {
          id: 'customInputs.takingThiazide',
          labelVi: 'Đang dùng thuốc lợi tiểu Thiazide (hydrochlorothiazide, indapamide, chlorthalidone — kể cả viên phối hợp FDC)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Thiazide làm giảm thải acid uric; cân nhắc đổi sang Losartan hoặc CCB khi khả thi (KHÔNG tự ý ngừng lợi tiểu quai ở bệnh nhân suy tim)'
        },
        {
          id: 'customInputs.unableToTakeOral',
          labelVi: 'Không thể uống thuốc đường tiêu hóa (NPO / nôn ói / hậu phẫu)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'ACR 2020 khuyến cáo mạnh dùng Glucocorticoid đường tiêm (IV/IM) hoặc tiêm nội khớp thay cho đường uống'
        },
        {
          id: 'customInputs.activeInfection',
          labelVi: 'Đang có nhiễm trùng toàn thân / nấm xâm lấn tiến triển',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định Corticoid toàn thân / nội khớp và thuốc ức chế IL-1 khi chưa kiểm soát nhiễm trùng hoạt động'
        },
        {
          id: 'customInputs.steroidContraindicated',
          labelVi: 'Chống chỉ định hoặc thất bại với Corticoid',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Khi đồng thời không dùng được Colchicine và NSAID: cân nhắc thuốc ức chế IL-1 (anakinra / canakinumab) nếu đã loại trừ nhiễm trùng'
        },
        {
          id: 'customInputs.takingLowDoseAspirin',
          labelVi: 'Đang dùng Aspirin liều thấp dự phòng biến cố tim mạch',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'ACR 2020 khuyến cáo KHÔNG ngừng aspirin liều thấp đang dùng vì chỉ định tim mạch phù hợp (chỉ ngừng khi đang xuất huyết nặng cấp tính)'
        },
        {
          id: 'customInputs.preferProbenecid',
          labelVi: 'Cân nhắc dùng thuốc tăng thải urat Probenecid (thay thế hoặc phối hợp XOI)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chỉ khởi trị khi đã có chỉ định ULT, ngoài cơn cấp, eGFR ≥ 60 mL/phút và không có sỏi thận / tăng sản xuất urat'
        },
        {
          id: 'customInputs.preferBenzbromarone',
          labelVi: 'Cân nhắc dùng thuốc tăng thải urat Benzbromarone (hồ sơ INTL/VN)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định ở suy thận nặng, sỏi thận, bệnh gan, cho con bú hoặc dùng VKA; không được FDA Hoa Kỳ phê duyệt'
        },
        {
          id: 'customInputs.uricAcidOverproduction',
          labelVi: `Tăng sản xuất acid uric nội sinh đã xác định (acid uric niệu > ${vnUrineUrateMax} mg/24 giờ)`,
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định tuyệt đối nhóm thuốc tăng thải acid uric (Probenecid, Benzbromarone) trên mọi hồ sơ do nguy cơ kết tủa tinh thể urat ống thận'
        },
        {
          id: 'customInputs.secondaryHematologicMalignancyOrTls',
          labelVi: 'Tăng acid uric máu thứ phát do bệnh máu ác tính / hóa trị / nguy cơ Hội chứng tiêu khối u (TLS)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định tuyệt đối nhóm Uricosuric, không khuyến cáo Febuxostat cho TLS theo FDA; cần chuyển phác đồ chuyên khoa Huyết học – Ung bướu (bù dịch + Allopurinol / Rasburicase)'
        }
      ]
    }
  ]
};
