/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc Bậc 5 (Duy trì nền, LAMA cộng thêm & Định hướng Thuốc sinh học Type 2)
 * Phân quyền: Agent M
 */

import { resolveKbDrugId } from '../../engine/safety/drugClassify';
import type { Rule, Recommendation, CurrentMed } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  ADULT_18_ONLY_DRUGS,
  ASTHMA_TYPE2_BIOLOGIC_DRUGS,
  CYP3A4_SENSITIVE_ICS_LABA_DRUGS,
  DPI_ONLY_LACTOSE_DRUGS,
  TRIPLE_INHALER_DRUGS,
  asDose,
  asthmaGate,
  asthmaRule,
  computeEffectiveTrack1Step,
  computeEffectiveTrack2Step,
  evaluateAcuteAsthma,
  evaluateGinaControl,
  getMartMaxDailyPuffs,
  hasSevereMilkProteinAllergy,
  hasStrongCyp3a4Inhibitor,
  isAdult18OrOlder,
  isAdultOrAdolescent,
  isAllergicToDrug,
  isMartOveruse,
  isUsingRapihaler80,
  resolveControllerAction,
  resolveTrack1MartDrugId,
  resolveTrack2IcsLabaDrugId,
  shouldDeferTripleInhalerToCopd
} from './helpers';

function isStep5Active(ctx: Parameters<Rule['when']>[0]): boolean {
  if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return false;
  if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
  if (evaluateGinaControl(ctx).level === 'missing') return false;
  const ci = ctx.patient.customInputs ?? {};
  const isTrack2 = ci.currentTrack === 'track2';
  return isTrack2 ? computeEffectiveTrack2Step(ctx) === 5 : computeEffectiveTrack1Step(ctx) === 5;
}

function getDuplicateBiologicExtra(ctx: Parameters<Rule['when']>[0]): CurrentMed | undefined {
  const bios = ctx.patient.currentMeds.filter((m) =>
    ASTHMA_TYPE2_BIOLOGIC_DRUGS.has(m.drugId.toLowerCase())
  );
  return bios.length >= 2 ? bios[1] : undefined; // qa-allow: index - phát hiện phối hợp trùng 2 thuốc sinh học Type 2
}

export const asthmaStep5Rules: Rule[] = [
  asthmaRule({
    id: 'asthma.step5.dupilumab_hypereosinophilia_contra',
    setting: 'both',
    nameVi: 'Chống chỉ định / Ngừng Dupilumab khi bạch cầu ái toan máu ngoại vi ≥ 1500 tế bào/µL',
    citationIds: [
      'gina.asthma.2026.dupilumab_eos_1500_contra',
      'fda.asthma.dupilumab_eos_1500_excluded',
      'gina.asthma.2026.hypereosinophilia_1500_egpa_strongyloides'
    ],
    when: (ctx) => {
      if (!ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'dupilumab')) return false;
      const ci = ctx.patient.customInputs ?? {};
      const eos = typeof ci.bloodEosinophils === 'number' ? ci.bloodEosinophils : need(ctx, 'eos');
      const dupEosMax = thFor('eos', 'asthma.biologic.dupilumab_eos_max');
      return eos !== undefined && eos >= dupEosMax;
    },
    produce: (ctx): Recommendation => {
      const ci = ctx.patient.customInputs ?? {};
      const eos = typeof ci.bloodEosinophils === 'number' ? ci.bloodEosinophils : need(ctx, 'eos');
      const dupEosMax = thFor('eos', 'asthma.biologic.dupilumab_eos_max');
      return {
        id: 'rec_asthma_dupilumab_hypereosinophilia_stop',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị an toàn
        priority: 98, // qa-allow: index - độ ưu tiên chống chỉ định tăng BCAT nặng
        action: 'STOP',
        drugId: 'dupilumab',
        dose: undefined,
        title: `NGỪNG / TRÁNH Dupilumab: Bạch cầu ái toan máu tăng rất cao (${eos} ≥ ${dupEosMax} tế bào/µL) — Tầm soát EGPA & Ký sinh trùng`,
        rationale: `Theo GINA 2026 (Chương 8) và nhãn FDA, tránh dùng Dupilumab ở bệnh nhân có BCAT máu ≥ ${dupEosMax} tế bào/µL do nguy cơ gây tăng vọt BCAT máu triệu chứng và bộc lộ u hạt bạch cầu ái toan kèm viêm đa mạch (EGPA / hội chứng Churg-Strauss). Bắt buộc chuyển chuyên khoa tầm soát ngay EGPA và nhiễm giun lươn (Strongyloides) trước khi chọn kháng IL-5/IL-5Rα (Mepolizumab/Benralizumab).`,
        gates: [asthmaGate('bloodEosinophils', false, `BCAT máu ${eos} ≥ ${dupEosMax} tế bào/µL`, eos, dupEosMax)],
        citationIds: [
          'gina.asthma.2026.dupilumab_eos_1500_contra',
          'fda.asthma.dupilumab_eos_1500_excluded',
          'gina.asthma.2026.hypereosinophilia_1500_egpa_strongyloides'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.step5.no_dual_biologics',
    setting: 'both',
    nameVi: 'Chống chỉ định phối hợp đồng thời hai thuốc sinh học kháng viêm Type 2',
    citationIds: ['gina.asthma.2026.step5_biologics'],
    when: (ctx) => Boolean(getDuplicateBiologicExtra(ctx)),
    produce: (ctx): Recommendation | null => {
      const extraBio = getDuplicateBiologicExtra(ctx);
      if (!extraBio) return null;
      return {
        id: 'rec_asthma_no_dual_type2_biologics',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 97, // qa-allow: index - độ ưu tiên chống phối hợp kép sinh học
        action: 'STOP',
        drugId: extraBio.drugId,
        dose: undefined,
        title: `NGỪNG phối hợp chồng hai thuốc sinh học Type 2 (${extraBio.name || extraBio.drugId})`,
        rationale:
          'Không khuyến cáo dùng đồng thời hai kháng thể đơn dòng nhắm đích Type 2 (kể cả ở bệnh nhân đồng mắc Hen nặng và COPD tăng BCAT hoặc polyp mũi) do chưa có bằng chứng an toàn dài hạn và tăng nguy cơ nhiễm trùng/phản vệ. Chỉ chọn duy nhất một thuốc sinh học bao phủ tốt nhất cả hai bệnh cảnh.',
        gates: [asthmaGate('currentMeds', false, 'Đang kê trùng 2 thuốc sinh học Type 2')],
        citationIds: ['gina.asthma.2026.step5_biologics']
      };
    }
  }),

  asthmaRule({
    id: 'asthma.step5.controller_continuation',
    setting: 'outpatient',
    nameVi: 'Bậc 5: Tiếp tục duy trì tối ưu thuốc kiểm soát nền ICS-LABA liều trung bình – cao',
    citationIds: [
      'gina.asthma.2026.track1_step5_severe',
      'gina.asthma.2026.step5_lama_triplet',
      'gina.asthma.2026.triple_tiotropium_age_limits'
    ],
    when: (ctx) => {
      if (shouldDeferTripleInhalerToCopd(ctx)) return false;
      return isStep5Active(ctx);
    },
    produce: (ctx): Recommendation => {
      const ci = ctx.patient.customInputs ?? {};
      const currentStep = typeof ci.currentStep === 'number' ? ci.currentStep : 0;
      const isTrack2 = ci.currentTrack === 'track2';
      const maxPuffs = getMartMaxDailyPuffs(ctx);
      const age = need(ctx, 'age');
      const minAdult18 = thFor('age', 'asthma.age.min_adult_18');
      const milkAllergy = hasSevereMilkProteinAllergy(ctx);
      const strongCyp = hasStrongCyp3a4Inhibitor(ctx);
      const isRap80 = isUsingRapihaler80(ctx);

      const safeExistingTriple = ctx.patient.currentMeds.find((m) => {
        const id = resolveKbDrugId(m.drugId);
        if (!TRIPLE_INHALER_DRUGS.has(id)) return false;
        if (age !== undefined && age < minAdult18 && ADULT_18_ONLY_DRUGS.has(id)) return false;
        if (milkAllergy && DPI_ONLY_LACTOSE_DRUGS.has(id)) return false;
        if (strongCyp && CYP3A4_SENSITIVE_ICS_LABA_DRUGS.has(id)) return false;
        if (isAllergicToDrug(ctx, id)) return false;
        return true;
      });

      if (safeExistingTriple) {
        return {
          id: 'rec_asthma_step5_controller_continue',
          module: 'asthma',
          tier: 'Hen nặng & Kiểu hình Bậc 5',
          tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 94, // qa-allow: index - độ ưu tiên duy trì nền Bậc 5
          action: 'CONTINUE',
          drugId: safeExistingTriple.drugId,
          dose: asDose(
            safeExistingTriple.dose
              ? String(safeExistingTriple.dose)
              : 'Duy trì liều chuẩn Bậc 5 hàng ngày theo hướng dẫn của bình hít 3 thành phần'
          ),
          title: `Bậc 5: Tiếp tục duy trì bình hít 3 thành phần ICS-LABA-LAMA (${safeExistingTriple.name || safeExistingTriple.drugId})`,
          rationale:
            'Ở Bậc 5, người bệnh bắt buộc duy trì liên tục thuốc kiểm soát nền ICS-LABA-LAMA hàng ngày song song với quá trình đánh giá kiểu hình viêm Type 2 và khởi trị thuốc sinh học tại chuyên khoa Hô hấp.',
          gates: [],
          citationIds: ['gina.asthma.2026.track1_step5_severe', 'gina.asthma.2026.step5_lama_triplet']
        };
      }

      if (isTrack2) {
        const icsLaba = resolveTrack2IcsLabaDrugId(ctx);
        const desiredAction = currentStep < 5 ? 'UPTITRATE' : 'CONTINUE';
        const { action, switchFrom } = resolveControllerAction(ctx, icsLaba, desiredAction);
        const addTioNote = !isAdult18OrOlder(ctx)
          ? ' + phối hợp bình rời Tiotropium Respimat (≥ 6 tuổi)'
          : '';

        let highDose: string;
        if (icsLaba === 'fluticasone_vilanterol') {
          highDose = `184/22 mcg (Relvar Ellipta 200/25): Hít 1 nhát x 1 lần/ngày${addTioNote} + SABA khi cần cắt cơn`;
        } else if (icsLaba === 'mometasone_formoterol') {
          highDose = `200/5 mcg (Dulera pMDI): Xịt 2 nhát x 2 lần/ngày${addTioNote} + SABA khi cần cắt cơn`;
        } else {
          const dev = milkAllergy
            ? 'Seretide Evohaler pMDI (không chứa lactose; qua buồng đệm, không cấp dạng Accuhaler/Diskus) 250/25 mcg x 2 nhát'
            : '500/50 mcg Accuhaler 1 nhát (hoặc Evohaler pMDI 250/25 mcg x 2 nhát)';
          highDose = `${dev} x 2 lần/ngày${addTioNote} + SABA khi cần cắt cơn`;
        }

        return {
          id: 'rec_asthma_step5_controller_continue',
          module: 'asthma',
          tier: 'Hen nặng & Kiểu hình Bậc 5',
          tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 94, // qa-allow: index - độ ưu tiên duy trì nền Bậc 5
          action,
          drugId: icsLaba,
          switchFrom,
          dose: asDose(highDose),
          title: 'Bậc 5 (Track 2): Duy trì / Tối ưu hóa ICS-LABA liều cao hàng ngày (không ngừng thuốc kiểm soát nền)',
          rationale:
            'Theo GINA 2026 và Bộ Y tế QĐ 1851/2020, khi chuyển chuyên khoa Hô hấp đánh giá Bậc 5, bắt buộc duy trì liên tục ICS-LABA nền; ICS liều cao kéo dài làm tăng nguy cơ tác dụng phụ toàn thân nên ưu tiên chỉ thử nghiệm 3–6 tháng kết hợp cộng thêm LAMA/thuốc sinh học.',
          gates: [],
          citationIds: [
            'gina.asthma.2026.track1_step5_severe',
            'gina.asthma.2026.step5_lama_triplet',
            'gina.asthma.2026.triple_tiotropium_age_limits'
          ]
        };
      }

      const martDrugId = resolveTrack1MartDrugId(ctx);
      const isFost = martDrugId === 'beclometasone_formoterol';
      const { action, switchFrom } = resolveControllerAction(ctx, martDrugId, 'CONTINUE');

      let step5MartDose: string;
      if (isFost) {
        const dev = milkAllergy ? 'Foster pMDI 100/6 mcg (qua buồng đệm)' : 'Foster 100/6 mcg';
        step5MartDose = `${dev}: Duy trì 2 nhát x 2 lần/ngày + 1 nhát khi cần cắt cơn (tối đa ${maxPuffs} nhát/ngày)`;
      } else if (milkAllergy || isRap80) {
        const maintPuffs = isRap80 ? 4 : 2; // qa-allow: unit-conversion - Rapihaler 80/2.25 dùng 4 nhát x 2 lần/ngày
        const prnPuffs = isRap80 ? 2 : 1; // qa-allow: unit-conversion - Rapihaler 80/2.25 dùng 2 nhát mỗi lần cắt cơn
        const strength = isRap80 ? '80/2.25 mcg' : '160/4.5 mcg';
        step5MartDose = `Symbicort Rapihaler pMDI ${strength} (qua buồng đệm — không chứa lactose): Duy trì ${maintPuffs} nhát x 2 lần/ngày + ${prnPuffs} nhát khi cần cắt cơn (tối đa ${maxPuffs} nhát/ngày)`;
      } else {
        step5MartDose = `160/4.5 mcg: Duy trì 2 nhát x 2 lần/ngày (cân nhắc tối ưu liều cao ngắn hạn theo chuyên khoa) + 1 nhát khi cần cắt cơn (tối đa ${maxPuffs} nhát/ngày)`;
      }

      return {
        id: 'rec_asthma_step5_controller_continue',
        module: 'asthma',
        tier: 'Hen nặng & Kiểu hình Bậc 5',
        tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 94, // qa-allow: index - độ ưu tiên duy trì nền Bậc 5
        action,
        drugId: martDrugId,
        switchFrom,
        dose: asDose(step5MartDose),
        title: `Bậc 5 (Track 1 MART): Tiếp tục duy trì ${isFost ? 'Beclometasone/formoterol' : 'Budesonide/formoterol'} nền & Cắt cơn chống viêm`,
        rationale:
          'Khi chuyển bệnh nhân lên Bậc 5 để cộng thêm LAMA và đánh giá thuốc sinh học, tuyệt đối không ngừng thuốc kiểm soát nền ICS-formoterol đang dùng nhằm bảo vệ đường thở liên tục trong thời gian chờ chuyên khoa định danh kiểu hình.',
        gates: [],
        citationIds: ['gina.asthma.2026.track1_step5_severe', 'gina.asthma.2026.step5_lama_triplet']
      };
    }
  }),

  asthmaRule({
    id: 'asthma.step5.severe_management',
    setting: 'outpatient',
    nameVi: 'Bậc 5 (Hen nặng): Cộng thêm LAMA & Chuyển chuyên khoa xét nghiệm kiểu hình chỉ định Thuốc sinh học',
    citationIds: [
      'gina.asthma.2026.track1_step5_severe',
      'gina.asthma.2026.step5_biologics',
      'gina.asthma.2026.step5_lama_triplet',
      'gina.asthma.2026.triple_tiotropium_age_limits',
      'gina.asthma.2026.dupilumab_eos_1500_contra',
      'gina.asthma.2026.hypereosinophilia_1500_egpa_strongyloides',
      'byt.asthma.2020.type2_biomarkers'
    ],
    when: (ctx) => isStep5Active(ctx),
    produce: (ctx): Recommendation => {
      const ci = ctx.patient.customInputs ?? {};
      const eos = typeof ci.bloodEosinophils === 'number' ? ci.bloodEosinophils : need(ctx, 'eos');
      const feno = typeof ci.feno === 'number' ? ci.feno : undefined;
      const allergic = Boolean(ci.allergicPhenotype);
      const eosMin = thFor('eos', 'asthma.biologic.eosinophils_type2_min');
      const dupEosMax = thFor('eos', 'asthma.biologic.dupilumab_eos_max');
      const fenoMin = thFor('feno', 'asthma.biologic.feno_type2_min');
      const minAdult18 = thFor('age', 'asthma.age.min_adult_18');
      const minAdol = thFor('age', 'asthma.age.min_adult_adolescent');
      const is18Plus = isAdult18OrOlder(ctx);
      const milkAllergy = hasSevereMilkProteinAllergy(ctx);
      const hasCopd = ctx.patient.selectedModules.includes('copd');

      const alreadyOnLamaOrTriple = ctx.patient.currentMeds.some((m) => {
        const id = resolveKbDrugId(m.drugId);
        return TRIPLE_INHALER_DRUGS.has(id) || id === 'tiotropium';
      });

      const isHypereosinophilic = eos !== undefined && eos >= dupEosMax;
      const isType2Eos =
        (eos !== undefined && eos >= eosMin) || (feno !== undefined && feno >= fenoMin);

      let biologicSuggestion =
        'Cần xét nghiệm BCAT máu (Blood Eosinophils), FeNO và IgE đặc hiệu/test lẩy da: nếu không có dấu ấn viêm Type 2, có thể cân nhắc kháng TSLP (Tezepelumab ≥ 12 tuổi) hoặc Azithromycin liều thấp 3 lần/tuần ở người lớn đã sàng lọc QTc và lao không điển hình.';

      if (isHypereosinophilic) {
        biologicSuggestion = `CẢNH BÁO TĂNG BẠCH CẦU ÁI TOAN RẤT CAO (BCAT = ${eos} ≥ ${dupEosMax} tế bào/µL): (1) TRÁNH KÊ DUPILUMAB (chống chỉ định/loại trừ theo GINA 2026 & nhãn FDA do nguy cơ hội chứng tăng BCAT và bộc lộ viêm mạch EGPA); (2) Bắt buộc tầm soát nguyên nhân u hạt bạch cầu ái toan kèm viêm đa mạch (EGPA / ANCA) và nhiễm ký sinh trùng giun lươn (Strongyloides) trước khi cân nhắc kháng IL-5/IL-5Rα (Mepolizumab, Benralizumab) hoặc kháng TSLP (Tezepelumab).`;
      } else if (isType2Eos && allergic) {
        biologicSuggestion =
          'Kiểu hình Viêm Type 2 hỗn hợp (Dị ứng + Tăng BCAT/FeNO): Ứng viên của Kháng IL-5/IL-5Rα (Benralizumab, Mepolizumab), Kháng IL-4Rα (Dupilumab), Kháng IgE (Omalizumab) hoặc Kháng TSLP (Tezepelumab).';
      } else if (isType2Eos) {
        biologicSuggestion =
          'Kiểu hình Hen tăng Bạch cầu ái toan nặng (Type 2 Eosinophilic): Ưu tiên Kháng IL-5/IL-5Rα (Benralizumab, Mepolizumab), Kháng IL-4Rα (Dupilumab) hoặc Kháng TSLP (Tezepelumab).';
      } else if (allergic) {
        biologicSuggestion =
          'Kiểu hình Hen dị ứng nặng qua trung gian IgE: Ưu tiên Kháng IgE (Omalizumab, chỉnh liều theo cân nặng và IgE toàn phần) hoặc Kháng TSLP (Tezepelumab).';
      }

      const lamaStepText = alreadyOnLamaOrTriple
        ? 'Người bệnh đã có thành phần LAMA phối hợp nền nhưng chưa kiểm soát — trọng tâm là xác định kiểu hình chuyên sâu và khởi trị thuốc sinh học'
        : is18Plus
          ? milkAllergy
            ? 'Cộng thêm Tiotropium Respimat 2.5 mcg x 2 nhát/ngày (dạng phun sương không chứa lactose; tránh bình bột khô Ellipta/Enerzair)'
            : `Cộng thêm LAMA (Tiotropium Respimat ≥ 6 tuổi hoặc chuyển sang bình 3 thành phần ICS-LABA-LAMA cho người lớn ≥ ${minAdult18} tuổi)`
          : `Cộng thêm bình rời Tiotropium Respimat 2.5 mcg x 2 nhát/ngày (phê duyệt ≥ 6 tuổi; KHÔNG dùng các bình gộp 3 thành phần Trelegy, Trimbow, Enerzair ở người < ${minAdult18} tuổi). Riêng Budesonide/Glycopyrronium/Formoterol (Breztri) có thể được chuyên khoa cân nhắc từ ≥ ${minAdol} tuổi theo FDA/GINA 2026, xác nhận đúng hàm lượng chỉ định hen và khả năng tiếp cận tại địa phương`;

      const copdSingleBioNote = hasCopd
        ? ' Lưu ý đồng mắc COPD: Tuyệt đối KHÔNG phối hợp 2 thuốc sinh học cùng lúc; chỉ lựa chọn duy nhất một kháng thể đơn dòng phù hợp kiểu hình chung.'
        : '';

      return {
        id: 'rec_asthma_track1_step5_lama_biologic',
        module: 'asthma',
        tier: 'Hen nặng & Kiểu hình Bậc 5',
        tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 93, // qa-allow: index - độ ưu tiên Bậc 5
        action: 'REFER',
        title: alreadyOnLamaOrTriple
          ? 'Bậc 5 (Hen nặng chưa kiểm soát dù đã có ICS-LABA + LAMA): Chuyển chuyên khoa Hô hấp định danh kiểu hình & xét Thuốc sinh học'
          : 'Bậc 5 (Hen khó trị / Hen nặng): Cộng thêm LAMA & Chuyển chuyên khoa Hô hấp chỉ định Thuốc sinh học theo kiểu hình',
        rationale: `${lamaStepText}. Định hướng sinh học: ${biologicSuggestion}${copdSingleBioNote} Tránh tối đa việc duy trì Corticosteroid đường uống (OCS) kéo dài hàng ngày do biến chứng loãng xương, đái tháo đường, đục thủy tinh thể và suy thượng thận (GINA 2026 Chứng cứ A).`,
        gates: [],
        citationIds: [
          'gina.asthma.2026.track1_step5_severe',
          'gina.asthma.2026.step5_biologics',
          'gina.asthma.2026.step5_lama_triplet',
          'gina.asthma.2026.triple_tiotropium_age_limits',
          'gina.asthma.2026.dupilumab_eos_1500_contra',
          'gina.asthma.2026.hypereosinophilia_1500_egpa_strongyloides',
          'byt.asthma.2020.type2_biomarkers'
        ]
      };
    }
  })
];
