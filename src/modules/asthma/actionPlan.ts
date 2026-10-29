/**
 * GDMT-VN Kế hoạch Hành động Hen Phế quản Tiếng Việt (Asthma Action Plan Generator)
 * Phân quyền: Agent M
 *
 * Tự động tạo bản kế hoạch hành động 3 vùng màu chuẩn y khoa
 * dựa trên Bộ Y tế QĐ 5850/2021 (Phụ lục 4) và GINA 2026 (Box 4-4 / Box 9-2).
 * Phân định rõ ràng thiết bị hít (DPI không dùng buồng đệm / không khí dung; pMDI dùng buồng đệm,
 * bắt buộc pMDI không chứa lactose khi dị ứng nặng đạm sữa bò) và chuẩn hóa đơn vị lưu lượng đỉnh.
 */

import { thFor } from '../../kb-types';

export interface ActionPlanParams {
  patientName?: string;
  track: 'track1' | 'track2';
  controllerDrug: string;
  relieverDrug: string;
  maintenanceDose: string;
  relieverInstructions: string;
  pefBestLMin?: number;
  pefPersonalBest?: number;
  pefPct?: number;
  pefPctPredicted?: number;
  lactoseFreePmdiOnly?: boolean;
  isRapihaler80?: boolean;
  isAcuteDischargePef?: boolean;
}

export function generateAsthmaActionPlanVi(params: ActionPlanParams): string {
  const name = params.patientName || 'Bệnh nhân';

  const greenZonePct = thFor('pef', 'asthma.action_plan.green_zone_min');
  const yellowMinPct = thFor('pef', 'asthma.action_plan.yellow_zone_min');
  const yellowMaxPct = thFor('pef', 'asthma.action_plan.yellow_zone_max');
  const stdMaxPuffs = thFor('inhalations_count', 'asthma.formoterol.mart_max_inhalations');
  const rapihaler80MaxPuffs = thFor('inhalations_count', 'asthma.formoterol.rapihaler_80_max_inhalations');
  const predMin = thFor('dose_mg', 'asthma.acute.prednisolone_dose_min');
  const predMax = thFor('dose_mg', 'asthma.acute.prednisolone_dose_max');
  const mpDose = thFor('dose_mg', 'asthma.acute.methylprednisolone_iv_mg');
  const sabaNeb = thFor('dose_mg', 'asthma.acute.salbutamol_neb_dose');

  const bestLMin = params.pefBestLMin ?? params.pefPersonalBest;
  const pctPred = params.pefPct ?? params.pefPctPredicted;

  let pefBestText: string;
  let greenPef: string;
  let yellowPef: string;
  let redPef: string;

  if (bestLMin !== undefined && bestLMin > 0) {
    const greenCutoffLMin = Math.round((bestLMin * greenZonePct) / 100); // qa-allow: unit-conversion - quy đổi tỷ lệ % sang L/phút
    const yellowMinLMin = Math.round((bestLMin * yellowMinPct) / 100); // qa-allow: unit-conversion - quy đổi tỷ lệ % sang L/phút
    const yellowMaxLMin = Math.round((bestLMin * yellowMaxPct) / 100); // qa-allow: unit-conversion - quy đổi tỷ lệ % sang L/phút
    pefBestText = `${bestLMin} L/phút`;
    greenPef = `> ${greenCutoffLMin} L/phút (> ${greenZonePct}% mức tốt nhất)`;
    yellowPef = `${yellowMinLMin} – ${yellowMaxLMin} L/phút (${yellowMinPct}% – ${yellowMaxPct}% mức tốt nhất)`;
    redPef = `< ${yellowMinLMin} L/phút (< ${yellowMinPct}% mức tốt nhất)`;
  } else if (params.isAcuteDischargePef && pctPred !== undefined && pctPred > 0) {
    pefBestText = `Chưa thiết lập PEF nền cá nhân (PEF tại thời điểm xuất viện đạt ${pctPred}% giá trị dự đoán; cần đo lại PEF cá nhân tốt nhất sau 2–4 tuần ổn định)`;
    greenPef = `> ${greenZonePct}% mức cá nhân tốt nhất (thiết lập lại khi tái khám ổn định)`;
    yellowPef = `${yellowMinPct}% – ${yellowMaxPct}% mức cá nhân tốt nhất`;
    redPef = `< ${yellowMinPct}% mức cá nhân tốt nhất`;
  } else if (pctPred !== undefined && pctPred > 0) {
    pefBestText = `${pctPred}% giá trị dự đoán (chưa có PEF cá nhân tốt nhất theo L/phút)`;
    greenPef = `> ${greenZonePct}% giá trị dự đoán / tốt nhất`;
    yellowPef = `${yellowMinPct}% – ${yellowMaxPct}% giá trị dự đoán / tốt nhất`;
    redPef = `< ${yellowMinPct}% giá trị dự đoán / tốt nhất`;
  } else {
    pefBestText = 'Chưa đo (đánh giá theo triệu chứng lâm sàng)';
    greenPef = `> ${greenZonePct}% giá trị cá nhân tốt nhất`;
    yellowPef = `${yellowMinPct}% – ${yellowMaxPct}% giá trị cá nhân tốt nhất`;
    redPef = `< ${yellowMinPct}% giá trị cá nhân tốt nhất`;
  }

  const lactoseAlertBanner = params.lactoseFreePmdiOnly
    ? '\n⚠️ CẢNH BÁO DỊ ỨNG ĐẠM SỮA BÒ NẶNG: TUYỆT ĐỐI KHÔNG DÙNG BÌNH HÍT BỘT KHÔ (DPI) CHỨA LACTOSE. CHỈ DÙNG BÌNH XỊT ĐỊNH LIỀU pMDI KHÔNG CHỨA LACTOSE QUA BUỒNG ĐỆM.'
    : '';

  const trackNotice =
    params.track === 'track1'
      ? 'Đang áp dụng Track 1 (Ưu tiên GINA 2026): Dùng bình phối hợp ICS-formoterol vừa duy trì vừa cắt cơn (AIR/MART).'
      : 'Đang áp dụng Track 2: Dùng thuốc kiểm soát chứa ICS hàng ngày và SABA khi cần cắt cơn.';

  const isAirOnly =
    params.track === 'track1' &&
    params.maintenanceDose.toLowerCase().includes('không dùng');

  const cleanedMaint = params.maintenanceDose.trim();
  const hasLeadingLieu = cleanedMaint.toLowerCase().startsWith('liều ');
  const greenDailyMaintenanceText = isAirOnly
    ? `• Chế độ kháng viêm cắt cơn (AIR Bậc 1–2): ${cleanedMaint} (${params.controllerDrug}).`
    : `• Thuốc duy trì: Dùng ${params.controllerDrug} ${hasLeadingLieu ? cleanedMaint : `liều ${cleanedMaint}`}.`;

  const relieverSingleStepPuffs = params.isRapihaler80 ? '2 nhát' : '1 nhát';
  const activeMaxPuffsText = params.isRapihaler80
    ? `${rapihaler80MaxPuffs} nhát/ngày với bình xịt Rapihaler 80/2.25 mcg`
    : `${stdMaxPuffs} nhát/ngày (với hàm lượng chuẩn 160/4.5 mcg hoặc Foster 100/6 mcg; nếu dùng bình xịt Rapihaler 80/2.25 mcg thì nhân đôi số nhát, tối đa ${rapihaler80MaxPuffs} nhát/ngày)`;

  const yellowAction =
    params.track === 'track1'
      ? `• Hít thêm ${relieverSingleStepPuffs} ${params.relieverDrug} ngay khi có triệu chứng. Nếu chưa đỡ sau vài phút, có thể lặp lại thêm ${relieverSingleStepPuffs} nữa.
• ${isAirOnly ? 'Tiếp tục dùng chế độ hít khi cần (AIR); nếu phải dùng nhiều ngày liên tiếp, liên hệ bác sĩ để nâng lên phác đồ MART duy trì hàng ngày.' : 'Tiếp tục dùng liều duy trì hàng ngày như thường lệ.'}
• CẢNH BÁO TRẦN AN TOÀN: Tổng số nhát trong ngày (cả duy trì và cắt cơn) không được vượt quá ${activeMaxPuffsText}. Nếu vượt trần này, phải đến bệnh viện cấp cứu ngay.`
      : `• Xịt 2–4 nhát ${params.relieverDrug} qua buồng đệm mỗi 20 phút trong vòng 1 giờ đầu nếu cần.
• Tăng cường thuốc kiểm soát theo hướng dẫn đã thống nhất với bác sĩ điều trị.`;

  const redTrack1DeviceNote = params.lactoseFreePmdiOnly
    ? `Xịt ngay ${relieverSingleStepPuffs} ${params.relieverDrug} (bình xịt định liều pMDI không chứa lactose qua buồng đệm; tuyệt đối KHÔNG dùng bình bột khô DPI chứa lactose)`
    : `Hít ngay ${relieverSingleStepPuffs} ${params.relieverDrug} (Bình bột khô Turbuhaler/DPI tuyệt đối KHÔNG dùng qua buồng đệm và KHÔNG đổ vào máy khí dung — phải hít sâu mạnh trực tiếp; nếu dùng bình xịt định liều Rapihaler/Foster pMDI thì xịt hít chậm sâu trực tiếp hoặc qua buồng đệm)`;

  const redAction =
    params.track === 'track1'
      ? `1. DÙNG THUỐC CẮT CƠN KHẨN CẤP (ĐÚNG THIẾT BỊ):
   • ${redTrack1DeviceNote}.
   • Nếu vẫn còn khó thở nhiều sau vài phút: Lặp lại thêm ${relieverSingleStepPuffs} nữa (tuyệt đối không xịt/hít dồn dập quá liều một lúc để tránh ngộ độc Formoterol cấp gây loạn nhịp và hạ kali máu). Nếu có sẵn Salbutamol pMDI và buồng đệm, có thể xịt 4–6 nhát qua buồng đệm trong lúc chờ cấp cứu.
2. UỐNG CORTICOID TOÀN THÂN (nếu đã có sẵn theo đơn bác sĩ):
   • Uống ngay Prednisolone ${predMin}–${predMax} mg (hoặc Methylprednisolone tương đương ${mpDose} mg).
3. ĐẾN BỆNH VIỆN NGAY HOẶC GỌI CẤP CỨU 115 NẾU:
   • Vẫn còn trong Vùng Đỏ sau 15 phút xử trí ban đầu.
   • Khó nói chuyện, chỉ nói được từng từ, thở co kéo hõm ngực, môi tím hoặc ngủ gà lơ mơ.`
      : `1. XỊT THUỐC CẮT CƠN KHẨN CẤP:
   • Xịt ngay 4–6 nhát ${params.relieverDrug} (Salbutamol pMDI không chứa lactose) qua buồng đệm (hoặc phun khí dung Salbutamol ${sabaNeb} mg nếu có sẵn máy khí dung).
2. UỐNG CORTICOID TOÀN THÂN:
   • Uống ngay Prednisolone ${predMin}–${predMax} mg (hoặc Methylprednisolone tương đương ${mpDose} mg).
3. ĐẾN BỆNH VIỆN NGAY HOẶC GỌI CẤP CỨU 115 NẾU:
   • Vẫn còn trong Vùng Đỏ sau 15 phút xử trí ban đầu.
   • Xuất hiện dấu hiệu lơ mơ, tím tái hoặc lồng ngực im lặng không nghe thấy tiếng khò khè nữa.`;

  return `
================================================================================
            BẢN KẾ HOẠCH HÀNH ĐỘNG HEN PHẾ QUẢN (ASTHMA ACTION PLAN)
       Theo Hướng dẫn Bộ Y tế QĐ 5850/2021 & Chiến lược toàn cầu GINA 2026
================================================================================
Họ và tên người bệnh: ${name}
Lưu lượng đỉnh (PEF) cá nhân tốt nhất: ${pefBestText}
Chế độ điều trị: ${trackNotice}${lactoseAlertBanner}

--------------------------------------------------------------------------------
🟢 VÙNG MÀU XANH: KIỂM SOÁT TỐT (AN TOÀN)
--------------------------------------------------------------------------------
DẤU HIỆU:
• Không có biểu hiện ho, khò khè, nặng ngực hoặc khó thở ngày và đêm.
• Có thể làm việc, học tập, vận động thể lực và sinh hoạt hoàn toàn bình thường.
• Lưu lượng đỉnh (PEF): ${greenPef}.

HÀNH ĐỘNG HÀNG NGÀY:
${greenDailyMaintenanceText}
• Trước khi vận động thể lực (nếu thường khó thở khi gắng sức): Dùng ${relieverSingleStepPuffs} thuốc cắt cơn trước khi vận động 15 phút.
• Súc miệng kỹ bằng nước sạch và nhổ đi sau mỗi lần dùng thuốc chứa ICS.
• Tránh các yếu tố kích phát: Khói thuốc lá/thuốc lào, bụi nhà, nấm mốc, lông thú cưng, phấn hoa, không khí lạnh.

--------------------------------------------------------------------------------
🟡 VÙNG MÀU VÀNG: SỨC KHỎE XẤU ĐI (CẦN THẬN TRỌNG & ĐIỀU CHỈNH)
--------------------------------------------------------------------------------
DẤU HIỆU:
• Bắt đầu ho, khò khè, tức ngực, thở nhanh hoặc khó thở khi hoạt động nhẹ.
• Có lần thức giấc ban đêm do triệu chứng hen.
• Phải dùng thuốc cắt cơn thường xuyên hơn bình thường.
• Lưu lượng đỉnh (PEF): ${yellowPef}.

HÀNH ĐỘNG CẦN LÀM NGAY:
${yellowAction}
• Nếu sau 24–48 giờ triệu chứng không cải thiện hoặc nặng hơn: Liên hệ ngay với bác sĩ điều trị.

--------------------------------------------------------------------------------
🔴 VÙNG MÀU ĐỎ: TRIỆU CHỨNG BÁO ĐỘNG NGUY HIỂM (CẤP CỨU KHẨN CẤP)
--------------------------------------------------------------------------------
DẤU HIỆU:
• Khó thở nhiều, thở rất nhanh, co kéo cơ cổ và hõm ngực, ngồi ngả ra trước.
• Khó nói chuyện, chỉ nói được từng từ riêng lẻ hoặc không nói được cả câu.
• Thuốc cắt cơn có rất ít tác dụng hoặc tác dụng chỉ kéo dài dưới 2 giờ.
• Lưu lượng đỉnh (PEF): ${redPef}.

HÀNH ĐỘNG CẤP CỨU NGAY LẬP TỨC:
${redAction}
================================================================================
`.trim();
}
