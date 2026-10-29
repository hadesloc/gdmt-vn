/**
 * GDMT-VN Gout Module - Special & High-Risk Acute Flare Branches
 * (Septic Arthritis Red Flag, Pregnancy, IL-1 Inhibitor, DKA/Active Bleed Hold, NPO Parenteral & Intra-articular Steroid)
 * Phân quyền: Agent K
 */

import type { RuleContext, Recommendation } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  goutRec,
  goutMissing,
  isPregnant,
  isSeverePolyarticularFlare,
  isMonoarthritisLargeJoint,
  isUnableToTakeOral,
  isSepticArthritisOrFeverRedFlag,
  hasActiveInfection,
  hasSevereUncontrolledHyperglycemia,
  hasActiveMajorBleeding,
  isSteroidContraindicated,
  isDkaSuspected,
  isOnDialysis,
  isNsaidAvoidedInGout,
  checkColchicineSafety
} from './helpers';
import { getSteroidClinicalWarnings } from './rules.safety.antiinflam';

const TIER_FLARE = 'Xử trí cơn gút cấp';

export function resolveSpecialFlareBranch(ctx: RuleContext): Recommendation | null {
  if (isSepticArthritisOrFeverRedFlag(ctx)) {
    return goutRec({
      id: 'rec_gout_septic_arthritis_urgent_refer',
      tier: TIER_FLARE,
      tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
      priority: 100, // qa-allow: index - độ ưu tiên cấp cứu
      action: 'REFER',
      title: 'CẤP CỨU LOẠI TRỪ VIÊM KHỚP NHIỄM KHUẨN: Chọc hút dịch khớp khẩn (soi tươi nhuộm Gram, cấy dịch khớp & cấy máu)',
      rationale:
        'Bệnh nhân có dấu hiệu nghi ngờ viêm khớp nhiễm khuẩn hoặc sốt cao ≥ 38.5°C trên khớp sưng nóng đỏ cấp (có thể đồng mắc tinh thể urat + nhiễm khuẩn mủ). Theo Bộ Y tế QĐ 361/QĐ-BYT (tr. 93 & 96) và EULAR 2016, BẮT BUỘC chọc hút dịch khớp cấp cứu đếm tế bào, nhuộm Gram, cấy dịch khớp và cấy máu trước khi cho kháng sinh; TUYỆT ĐỐI CẤM tiêm Corticosteroid nội khớp hoặc dùng Corticosteroid / ức chế IL-1 toàn thân khi chưa loại trừ nhiễm khuẩn khớp.',
      citationIds: [
        'byt.gout.2014.septic_arthritis_exclude_p93',
        'byt.gout.2014.septic_arthritis_urgent_workup_p96',
        'eular.gout.2016.il1_blockers_flare'
      ]
    });
  }

  const predMin = thFor('dose_mg', 'gout.prednisolone.flare_dose_min');
  const predMax = thFor('dose_mg', 'gout.prednisolone.flare_dose_max');
  const predDaysMin = thFor('duration_days', 'gout.prednisolone.flare_duration_days_min');
  const predDaysMax = thFor('duration_days', 'gout.prednisolone.flare_duration_days_max');

  if (isPregnant(ctx)) {
    if (isSteroidContraindicated(ctx) || isDkaSuspected(ctx) || hasSevereUncontrolledHyperglycemia(ctx)) {
      return goutRec({
        id: 'rec_gout_pregnancy_flare_contra_refer',
        tier: TIER_FLARE,
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 95, // qa-allow: index - độ ưu tiên thai kỳ
        action: 'REFER',
        title: 'Hội chẩn Sản khoa – Cơ xương khớp khẩn: Cơn gút cấp trong thai kỳ kèm chống chỉ định Corticosteroid toàn thân',
        rationale:
          'Thai phụ đang có chống chỉ định dùng Corticosteroid toàn thân (nhiễm trùng tiến triển, dị ứng steroid hoặc mất bù đường huyết nặng/DKA), trong khi NSAID và Colchicine đều cần tránh trong thai kỳ. Ưu tiên nhập viện ổn định nội khoa, chườm đá lạnh tại chỗ và chọc hút dịch khớp giảm áp.',
        citationIds: ['acr.gout.2020.topical_ice_flare', 'fda.celecoxib.fetal_toxicity_pregnancy', 'fda.colchicine.pregnancy']
      });
    }
    return goutRec({
      id: 'rec_gout_pregnancy_steroid_flare',
      tier: TIER_FLARE,
      tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
      priority: 90, // qa-allow: index - độ ưu tiên cắt cơn
      action: 'START',
      drugId: 'prednisolone',
      dose: `${predMin}–${predMax} mg/ngày đường uống trong ${predDaysMin}–${predDaysMax} ngày (hoặc tiêm nội khớp nếu viêm đơn khớp lớn)`,
      title: 'Xử trí cơn gút cấp trong thai kỳ: Ưu tiên Prednisolone ngắn ngày hoặc tiêm nội khớp',
      rationale:
        'Trong thai kỳ, tránh dùng NSAID (nguy cơ thiểu ối và đóng sớm ống động mạch thai nhi) và tránh dùng Colchicine. Corticosteroid ngắn ngày hoặc tiêm nội khớp (sau khi loại trừ nhiễm khuẩn khớp) là lựa chọn an toàn nhất.',
      warnings: getSteroidClinicalWarnings(ctx),
      citationIds: ['eular.gout.2016.flare_options', 'fda.celecoxib.fetal_toxicity_pregnancy', 'fda.colchicine.pregnancy']
    });
  }

  const egfr = need(ctx, 'egfr');
  if (egfr === undefined && !isOnDialysis(ctx)) {
    return goutMissing(
      'egfr',
      'Cần xét nghiệm Creatinin/eGFR trước khi chọn thuốc cắt cơn gút cấp để tránh kê nhầm NSAID hoặc Colchicine liều thường trên nền suy thận.',
      ['eular.gout.2016.colchicine_nsaid_contra', 'kdigo.gout.2024.acute_flare_ckd']
    );
  }

  const colchSafety = checkColchicineSafety(ctx);
  const nsaidCheck = isNsaidAvoidedInGout(ctx);
  const steroidContra = isSteroidContraindicated(ctx);
  const severeHyperglycemiaOrDka = isDkaSuspected(ctx) || hasSevereUncontrolledHyperglycemia(ctx);
  const activeMajorBleed = hasActiveMajorBleeding(ctx);

  if (colchSafety.avoidFlare && nsaidCheck.avoid && steroidContra) {
    if (hasActiveInfection(ctx)) {
      return goutRec({
        id: 'rec_gout_flare_infection_contra',
        tier: TIER_FLARE,
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 90, // qa-allow: index - độ ưu tiên cắt cơn
        action: 'REFER',
        title: 'Hội chẩn chuyên khoa khẩn: Chống chỉ định cả 3 nhóm kháng viêm đầu tay & đang có nhiễm trùng tiến triển',
        rationale:
          'Bệnh nhân chống chỉ định với cả Colchicine, NSAID và Corticosteroid toàn thân, đồng thời đang có nhiễm trùng tiến triển (chống chỉ định tuyệt đối thuốc ức chế IL-1 theo EULAR 2016). Cần điều trị kiểm soát nhiễm trùng, chườm đá lạnh tại chỗ và giảm đau hỗ trợ nội viện.',
        citationIds: ['eular.gout.2016.il1_blockers_flare', 'acr.gout.2020.topical_ice_flare']
      });
    }
    return goutRec({
      id: 'rec_gout_il1_inhibitor_flare',
      tier: TIER_FLARE,
      tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
      priority: 90, // qa-allow: index - độ ưu tiên cắt cơn
      action: 'CONSIDER',
      title: 'Cân nhắc thuốc ức chế IL-1 (Anakinra / Canakinumab) do chống chỉ định cả 3 nhóm đầu tay',
      rationale:
        'Khi cả Colchicine, NSAID và Glucocorticoid đều chống chỉ định hoặc không dung nạp (và đã loại trừ nhiễm trùng hiện mắc), ACR 2020 và EULAR 2016 khuyến cáo cân nhắc thuốc ức chế IL-1 kết hợp chườm đá lạnh bổ trợ.',
      profileDiff: {
        US: 'ACR 2020 PICO 33: Khuyến cáo có điều kiện dùng thuốc ức chế IL-1 khi không dùng được Colchicine, NSAID và Corticoid.',
        INTL: 'EULAR 2016 Rec 3: Cân nhắc ức chế IL-1 khi chống chỉ định cả 3 nhóm đầu tay; chống chỉ định nếu có nhiễm trùng.',
        VN: 'BYT 2024 CKD Bảng 22 ghi nhận nhóm ức chế IL-1; lưu ý thuốc sinh học hạn chế sẵn có tại Việt Nam nên cần hội chẩn chuyên khoa Cơ xương khớp.'
      },
      citationIds: ['acr.gout.2020.il1_inhibitor_flare', 'eular.gout.2016.il1_blockers_flare', 'byt.ckd.2024.gout_flare_table22']
    });
  }

  if ((severeHyperglycemiaOrDka || activeMajorBleed) && colchSafety.avoidFlare && nsaidCheck.avoid) {
    const severeGlu = thFor('glucose', 'gout.steroid.severe_hyperglycemia_mmol');
    return goutRec({
      id: 'rec_gout_flare_dka_stabilize',
      tier: TIER_FLARE,
      tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
      priority: 90, // qa-allow: index - độ ưu tiên cắt cơn
      action: 'HOLD',
      drugId: 'prednisolone',
      title: severeHyperglycemiaOrDka
        ? `TẠM HOÃN Corticosteroid toàn thân liều cao do tăng đường huyết cấp cứu (≥ ${severeGlu} mmol/L) / nghi DKA–HHS`
        : 'TẠM HOÃN Corticosteroid toàn thân liều cao do đang có xuất huyết tiêu hóa / nội sọ cấp tính',
      rationale:
        `Corticosteroid đường toàn thân liều ${predMin}–${predMax} mg/ngày trên nền tăng đường huyết mất kiểm soát nặng / DKA–HHS hoặc xuất huyết tiêu hóa tiến triển làm tăng nguy cơ hôn mê thẩm thấu và tái xuất huyết nặng. Ưu tiên ổn định đường huyết bằng Insulin / cầm máu nội viện, chườm đá lạnh tại chỗ, chọc hút tiêm nội khớp khu trú nếu chỉ viêm 1–2 khớp lớn hoặc hội chẩn chuyên khoa xét thuốc ức chế IL-1.`,
      warnings: getSteroidClinicalWarnings(ctx),
      citationIds: ['acr.gout.2020.flare_first_line', 'acr.gout.2020.il1_inhibitor_flare', 'acr.gout.2020.topical_ice_flare', 'ada.dm2.2026.early_insulin_severe']
    });
  }

  if (isUnableToTakeOral(ctx) && !steroidContra && !severeHyperglycemiaOrDka) {
    return goutRec({
      id: 'rec_gout_npo_parenteral_steroid',
      tier: TIER_FLARE,
      tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
      priority: 90, // qa-allow: index - độ ưu tiên cắt cơn
      action: 'START',
      drugId: 'methylprednisolone',
      dose: `Tiêm tĩnh mạch hoặc tiêm bắp liều tương đương Prednisolone ${predMin}–${predMax} mg/ngày (hoặc tiêm nội khớp nếu viêm đơn khớp lớn)`,
      title: 'Bệnh nhân không uống được (NPO): Khuyến cáo mạnh Glucocorticoid đường tiêm (IV/IM hoặc nội khớp)',
      rationale:
        'Theo ACR 2020 (Table 6, PICO 32), ở bệnh nhân cơn gút cấp không thể dùng thuốc đường uống (NPO), khuyến cáo mạnh dùng Glucocorticoid đường tiêm tĩnh mạch, tiêm bắp hoặc tiêm nội khớp ưu tiên hơn ức chế IL-1 hoặc ACTH.',
      warnings: getSteroidClinicalWarnings(ctx),
      citationIds: ['acr.gout.2020.npo_parenteral_steroid', 'eular.gout.2016.flare_options']
    });
  }

  if (isMonoarthritisLargeJoint(ctx) && !isSeverePolyarticularFlare(ctx) && !steroidContra && !severeHyperglycemiaOrDka) {
    return goutRec({
      id: 'rec_gout_intraarticular_steroid',
      tier: TIER_FLARE,
      tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
      priority: 90, // qa-allow: index - độ ưu tiên cắt cơn
      action: 'START',
      drugId: 'prednisolone',
      dose: `Chọc hút dịch khớp & tiêm Corticosteroid nội khớp (hoặc Prednisolone uống ${predMin}–${predMax} mg/ngày trong ${predDaysMin}–${predDaysMax} ngày nếu không tiêm được)`,
      title: 'Viêm đơn khớp lớn cấp tính: Ưu tiên chọc hút và tiêm Corticosteroid nội khớp',
      rationale:
        'Theo EULAR 2016, ACR 2020 và KDIGO 2024, với cơn gút cấp khu trú ở 1–2 khớp lớn dễ tiếp cận (sau khi loại trừ nhiễm khuẩn khớp), chọc hút dịch khớp kèm tiêm Corticosteroid nội khớp giúp cắt cơn nhanh và hạn chế phơi nhiễm thuốc toàn thân.',
      warnings: getSteroidClinicalWarnings(ctx),
      citationIds: [
        'acr.gout.2020.flare_first_line',
        'eular.gout.2016.flare_options',
        'kdigo.gout.2024.acute_flare_ckd',
        'byt.gout.2014.septic_arthritis_exclude_p93'
      ]
    });
  }

  return null;
}
