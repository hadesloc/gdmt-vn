/**
 * GDMT-VN Gout Module - Clinical Pathway (Lộ trình Điều trị Chuẩn Bệnh Gút)
 * 5 bước tiếp cận toàn diện theo ACR 2020, EULAR 2016, KDIGO 2024 & BYT 361/2014
 */

import type { PathwayDefinition } from '../../engine/types';
import { thFor } from '../../kb-types';

const flareHour = thFor('duration_hours', 'gout.colchicine.flare_hour_interval');
const earlyColchHours = thFor('duration_hours', 'gout.flare.colchicine_early_hours');
const frequentFlares = thFor('gout_flares', 'gout.indication.flares_per_year_frequent');
const titWeeksMin = thFor('interval_weeks', 'gout.allopurinol.titration_weeks_min');
const titWeeksMax = thFor('interval_weeks', 'gout.allopurinol.titration_weeks_max');
const prophMin = thFor('duration_months', 'gout.prophylaxis.duration_months_min');
const prophMax = thFor('duration_months', 'gout.prophylaxis.duration_months_max');
const stdTargetUmol = thFor('urate', 'gout.target.urate_standard_umol');
const tophiTargetUmol = thFor('urate', 'gout.target.urate_tophi_umol');
const vnTophiTargetUmol = thFor('urate', 'gout.target.urate_vn_tophi_umol');
const urateFloorMgdl = thFor('urate', 'gout.target.urate_floor_mgdl');
const eularAgeMax = thFor('age', 'gout.indication.eular_young_age_max');
const eularHighSuaUmol = thFor('urate', 'gout.indication.eular_high_sua_umol');
const ckdTitStep = thFor('dose_mg', 'gout.allopurinol.titration_step_ckd');
const maxRosuFeb = thFor('dose_mg', 'gout.rosuvastatin.febuxostat_max_dose');
const pegDose = thFor('dose_mg', 'gout.pegloticase.dose_mg');
const pegWeeks = thFor('interval_weeks', 'gout.pegloticase.interval_weeks');

export const goutPathway: PathwayDefinition = {
  title: 'Lộ trình tối ưu hóa phác đồ điều trị Gút theo ACR 2020, EULAR 2016, KDIGO 2024 & BYT 361/2014',
  steps: [
    {
      id: 'step_1_diagnosis',
      stepNumber: 1, // qa-allow: ui-step - thứ tự bước lộ trình
      title: 'Chẩn đoán xác định, Loại trừ nhiễm khuẩn khớp & Sàng lọc gen HLA-B*58:01',
      description:
        'Xác định chẩn đoán dựa vào tìm thấy tinh thể natri urat trong dịch khớp hoặc hạt tophi (tiêu chuẩn vàng), hoặc tiêu chuẩn lâm sàng Bennet & Wood / ACR-EULAR; bắt buộc chọc hút dịch khớp nhuộm Gram và cấy vi khuẩn khẩn nếu có sốt cao hoặc nghi ngờ viêm khớp nhiễm khuẩn. ' +
        'Định lượng nồng độ acid uric huyết thanh, mức lọc cầu thận eGFR, men gan và rà soát thuốc đang dùng (azathioprine, nirmatrelvir/ritonavir, clarithromycin, cyclosporine, statin/fibrate, chống đông VKA/DOAC, lợi tiểu). ' +
        'ACR 2020 khuyến cáo sàng lọc alen HLA-B*58:01 trước khi bắt đầu Allopurinol ở người gốc Đông Nam Á (Việt Nam, Hoa, Hàn, Thái) và người Mỹ gốc Phi để phòng ngừa hội chứng quá mẫn nặng đe dọa tính mạng (SCAR/SJS/TEN/DRESS).',
      status: 'completed',
      citationIds: [
        'byt.gout.2014.diagnostic_bennet_wood',
        'byt.gout.2014.septic_arthritis_exclude_p93',
        'acr.gout.2020.hlab5801_screening',
        'acr.gout.2020.hlab5801_against_others',
        'fda.allopurinol.skin_rash_scar'
      ]
    },
    {
      id: 'step_2_acute_flare',
      stepNumber: 2, // qa-allow: ui-step - thứ tự bước lộ trình
      title: 'Kiểm soát chống viêm cơn cấp (“Pill-in-the-pocket”) & Nguyên tắc vàng duy trì ULT an toàn',
      description:
        `Xử trí giảm đau kháng viêm sớm nhất có thể ngay từ dấu hiệu báo trước đầu tiên (“pill-in-the-pocket” / “medication-in-pocket”):\n` +
        `1. Lựa chọn đầu tay cá thể hóa: Colchicine phác đồ liều thấp (hiệu quả nhất trong ${earlyColchHours} giờ đầu: uống liều ban đầu, sau đó liều thứ hai sau ${flareHour} giờ — TUYỆT ĐỐI KHÔNG dùng liều cao kiểu cũ; nếu đang uống sẵn dự phòng thì nghỉ 12 giờ mới nối lại liều dự phòng), NSAID ngắn ngày (kèm PPI ở người cao tuổi hoặc dùng Aspirin liều thấp), hoặc Corticoid uống / tiêm nội khớp. Ở cơn viêm đa khớp nặng, có thể phối hợp Colchicine + NSAID hoặc Colchicine + Corticoid (TUYỆT ĐỐI KHÔNG phối hợp NSAID + Corticoid đường toàn thân). Nếu NPO ưu tiên Corticoid tiêm; nếu chống chỉ định cả ba nhóm và đã loại trừ nhiễm trùng, cân nhắc ức chế IL-1.\n` +
        `2. Chống chỉ định tuyệt đối Colchicine khi đang dùng thuốc ức chế mạnh CYP3A4 / P-gp (nirmatrelvir/ritonavir, clarithromycin, cyclosporine, azole), xơ gan mất bù Child-Pugh C hoặc khi phối hợp thuốc ức chế CYP3A4 vừa / statin / fibrate trên nền suy thận - bệnh gan; chống chỉ định NSAID khi có CKD nặng, suy tim, bệnh tim mạch, loét/xuất huyết tiêu hóa, chống đông hoặc AERD.\n` +
        `3. NGUYÊN TẮC VÀNG: Không tự ý ngừng thuốc hạ urat máu đang dung nạp ở liều an toàn khi xảy ra cơn gút cấp (nhưng bắt buộc giảm liều nếu phát hiện vượt trần thận/gan và ngừng ngay nếu có chống chỉ định như HLA-B*58:01+, SCAR, Azathioprine hoặc VKA + Benzbromarone).`,
      status: 'active',
      citationIds: [
        'acr.gout.2020.flare_first_line',
        'acr.gout.2020.colchicine_low_dose',
        'acr.gout.2020.medication_in_pocket',
        'acr.gout.2020.npo_parenteral_steroid',
        'acr.gout.2020.il1_inhibitor_flare',
        'eular.gout.2016.flare_options',
        'eular.gout.2016.pill_in_pocket',
        'eular.gout.2016.flare_combination_severe',
        'eular.gout.2016.colchicine_nsaid_contra',
        'byt.gout.2014.nsaid_ppi_gastroprotection_p199',
        'acr.gout.2020.start_ult_during_flare'
      ]
    },
    {
      id: 'step_3_ult_indication',
      stepNumber: 3, // qa-allow: ui-step - thứ tự bước lộ trình
      title: 'Đánh giá chỉ định điều trị hạ acid uric máu dài hạn (ULT)',
      description:
        `Phân tầng chỉ định theo ACR 2020, EULAR 2016 & KDIGO 2024:\n` +
        `1. Chỉ định mạnh: Có hạt tophi dưới da, có tổn thương khuyết xương trên X-quang do gút, hoặc tái phát thường xuyên từ ${frequentFlares} đợt cấp/năm trở lên.\n` +
        `2. Chỉ định có điều kiện: Từng bị hơn 1 đợt cấp trong đời nhưng cơn thưa; hoặc ngay từ cơn gút đầu tiên nếu kèm theo CKD giai đoạn ≥ 3, acid uric máu tăng rất cao, hoặc có sỏi thận tiết niệu (hồ sơ Châu Âu EULAR 2016 mở rộng thêm cho người khởi phát trẻ < ${eularAgeMax} tuổi hoặc acid uric > ${eularHighSuaUmol} µmol/L kèm bệnh đồng mắc tim mạch - chuyển hóa).\n` +
        `3. Cơn gút đầu tiên không biến chứng hoặc tăng acid uric máu không triệu chứng: Khuyến cáo KHÔNG khởi trị thuốc hạ urat ngoại trú (lưu ý nếu tăng urat thứ phát do bệnh máu ác tính / nguy cơ hội chứng ly giải khối u TLS phải chuyển phác đồ cấp cứu Ung bướu – Huyết học, tuyệt đối chống chỉ định nhóm uricosuric).`,
      status: 'upcoming',
      citationIds: [
        'acr.gout.2020.indication_strong',
        'acr.gout.2020.indication_conditional_infrequent',
        'acr.gout.2020.indication_conditional_first_flare',
        'acr.gout.2020.indication_against_first_flare',
        'acr.gout.2020.indication_against_asymptomatic',
        'eular.gout.2016.early_ult_young_high_sua',
        'kdigo.gout.2024.ckd_first_flare',
        'kdigo.gout.2024.rec_3_14_2_asymptomatic',
        'ema.desuric.contra_lithiase_hemopathy'
      ]
    },
    {
      id: 'step_4_treat_to_target',
      stepNumber: 4, // qa-allow: ui-step - thứ tự bước lộ trình
      title: 'Khởi trị liều thấp, Chuẩn độ Treat-to-Target & Dự phòng cơn bùng phát',
      description:
        `Triển khai chiến lược Treat-to-Target (ACR 2020 & EULAR 2016):\n` +
        `1. Lựa chọn ưu tiên đầu tay: Allopurinol khởi đầu liều thấp (ở bệnh nhân CKD giai đoạn ≥ 3 khởi đầu và tăng bậc mỗi lần ≤ ${ckdTitStep} mg/ngày), chuẩn độ tăng dần mỗi ${titWeeksMin}–${titWeeksMax} tuần cho tới khi đạt đích urat.\n` +
        `2. Nếu dị ứng Allopurinol hoặc mang gen HLA-B*58:01 dương tính: Chọn Febuxostat (lưu ý cảnh báo tim mạch FDA CARES, tránh dùng khi cho con bú và giới hạn liều Rosuvastatin ≤ ${maxRosuFeb} mg/ngày nếu phối hợp; tuyệt đối tránh phối hợp XOI với Azathioprine / 6-MP). Ở gút mạn tophi nặng thất bại đường uống, xét Pegloticase ${pegDose} mg truyền tĩnh mạch mỗi ${pegWeeks} tuần sau khi sàng lọc G6PD và ngừng toàn bộ ULT uống.\n` +
        `3. BẮT BUỘC phối hợp thuốc chống viêm dự phòng cơn bùng phát (Colchicine liều thấp điều chỉnh theo thận/gan/tương tác thuốc, hoặc NSAID/Prednisolone liều thấp) trong ít nhất ${prophMin}–${prophMax} tháng đầu khi bắt đầu hoặc tăng liều ULT.`,
      status: 'upcoming',
      citationIds: [
        'acr.gout.2020.allopurinol_first_line',
        'acr.gout.2020.allopurinol_low_dose_start',
        'acr.gout.2020.allopurinol_start_dose_ckd_50',
        'acr.gout.2020.treat_to_target',
        'acr.gout.2020.titration_weeks',
        'acr.gout.2020.pegloticase_refractory',
        'eular.gout.2016.pegloticase_8mg_q2w',
        'fda.rosuvastatin.febuxostat_max_20mg',
        'acr.gout.2020.prophylaxis_duration',
        'fda.febuxostat.azathioprine_contra'
      ]
    },
    {
      id: 'step_5_maintenance',
      stepNumber: 5, // qa-allow: ui-step - thứ tự bước lộ trình
      title: 'Duy trì mục tiêu suốt đời, Tối ưu thuốc đồng mắc & Lối sống',
      description:
        `Quản lý bệnh gút mạn tính dài hạn:\n` +
        `1. Đích điều trị acid uric máu: Duy trì < ${stdTargetUmol} µmol/L suốt đời (theo ACR 2020 cho mọi bệnh nhân gút); < ${tophiTargetUmol} µmol/L khi có tophi hoặc hủy khớp theo EULAR 2016 (< ${vnTophiTargetUmol} µmol/L khi có tophi theo BYT 361/2014), đồng thời EULAR 2016 lưu ý không duy trì acid uric máu < ${urateFloorMgdl} mg/dL kéo dài nhiều năm.\n` +
        `2. Tối ưu thuốc đồng mắc: Tách bỏ thành phần lợi tiểu Thiazide (kể cả trong viên phối hợp FDC) sang Losartan hoặc CCB trong tăng huyết áp; rà soát lợi tiểu quai nếu không có suy tim/quá tải dịch; ghi nhận lợi ích hạ urat phụ trợ của SGLT2i ở ĐTĐ típ 2/CKD/suy tim; KHÔNG tự ý đổi sang Fenofibrate chỉ vì mục đích hạ urat; KHÔNG ngừng Aspirin liều thấp dự phòng tim mạch (phối hợp PPI nếu có tiền sử loét tiêu hóa; chỉ ngừng khi đang xuất huyết cấp hoạt động).\n` +
        `3. Tư vấn dinh dưỡng: Giảm thực phẩm giàu purin (nội tạng, thịt đỏ, hải sản), hạn chế rượu bia, tránh đồ uống chứa siro ngô giàu fructose và giảm cân nếu thừa cân/béo phì.`,
      status: 'upcoming',
      citationIds: [
        'acr.gout.2020.target_urate_under_6',
        'eular.gout.2016.target_urate_tophi',
        'byt.gout.2014.target_urate',
        'acr.gout.2020.switch_thiazide_losartan',
        'acr.gout.2020.prefer_losartan',
        'eular.gout.2016.comorbid_meds_losartan_ccb',
        'acr.gout.2020.against_fenofibrate_switch',
        'kdigo.gout.2024.sglt2i_urate_benefit',
        'acr.gout.2020.do_not_stop_aspirin',
        'acr.gout.2020.lifestyle_alcohol'
      ]
    }
  ]
};
