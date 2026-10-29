/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Mục tiêu HbA1c Cá thể hóa
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  evaluateHyperglycemicCrisis,
  hasAscvd,
  hasCkd,
  hasDm2Context,
  hasHf,
  isBreastfeeding,
  isPregnant,
  resolveElderlyStatus
} from './helpers';

export const dm2Hba1cTargetRules: Rule[] = [
  {
    id: 'dm2.outpatient.hba1c_target',
    module: 'dm2',
    nameVi: 'Xác định mục tiêu HbA1c cá thể hóa',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => hasDm2Context(ctx) && !evaluateHyperglycemicCrisis(ctx).isCrisis,
    produce: (ctx) => {
      const stdTarget = thFor('hba1c', 'dm2.hba1c.target_standard');
      const youngTarget = thFor('hba1c', 'dm2.hba1c.target_young');
      const olderHealthy = thFor('hba1c', 'dm2.hba1c.target_older_healthy');
      const olderComplex = thFor('hba1c', 'dm2.hba1c.target_older_complex');
      const olderVeryComplex = thFor('hba1c', 'dm2.hba1c.target_older_very_complex');
      const elderlyAge = thFor('age', 'dm2.elderly.age_threshold');

      if (isPregnant(ctx)) {
        return {
          id: 'rec_dm2_hba1c_target',
          module: 'dm2',
          tier: 'Mục tiêu đường huyết cá thể hóa',
          tierOrder: 1,
          action: 'MONITOR',
          title: `Mục tiêu đường huyết Thai kỳ: HbA1c < ${youngTarget.toFixed(1)}% (nếu đạt an toàn không hạ đường huyết)`,
          rationale:
            'ADA 2026 Ch. 15: Trong thai kỳ, ưu tiên theo dõi sát đường huyết mao mạch trước và sau ăn hàng ngày; mục tiêu HbA1c thấp hơn người không mang thai nếu đạt được an toàn.',
          gates: [],
          citationIds: ['ada.dm2.2026.pregnancy_insulin', 'byt.dm2.2020.hba1c_goals'],
          priority: 100
        };
      }

      if (isBreastfeeding(ctx)) {
        return {
          id: 'rec_dm2_hba1c_target',
          module: 'dm2',
          tier: 'Mục tiêu đường huyết cá thể hóa',
          tierOrder: 1,
          action: 'MONITOR',
          title: `Mục tiêu đường huyết giai đoạn Cho con bú: HbA1c < ${stdTarget.toFixed(1)}% (Phòng ngừa hạ đường huyết sau sinh)`,
          rationale:
            'ADA 2026 Ch. 15: Giai đoạn hậu sản và cho con bú làm tăng nhạy cảm insulin và tiêu hao năng lượng tiết sữa; duy trì mục tiêu HbA1c chuẩn không hạ đường huyết bằng Insulin và/hoặc Metformin.',
          gates: [],
          citationIds: ['ada.dm2.2026.pregnancy_insulin', 'ada.dm2.2026.hba1c_target_standard'],
          priority: 100
        };
      }

      const age = need(ctx, 'age');
      const elderlyStatus = resolveElderlyStatus(ctx);
      const dmDuration = need(ctx, 'dmDurationYears');
      const hasSevereComplications = hasAscvd(ctx) || hasCkd(ctx) || hasHf(ctx);
      const recentHypo = Boolean(ctx.patient.customInputs?.recentHypo);

      let targetText = `< ${stdTarget.toFixed(1)}%`;
      let rationale =
        'Mục tiêu kiểm soát đường huyết chuẩn cho đa số người trưởng thành không mang thai nhằm giảm thiểu biến chứng vi mạch và mạch máu lớn.';
      let citation = 'ada.dm2.2026.hba1c_target_standard';

      if (
        elderlyStatus === 'not_elderly' &&
        age !== undefined &&
        age < elderlyAge - 20 && // qa-allow: index - Phân tầng người trưởng thành trẻ dưới 45 tuổi
        dmDuration !== undefined &&
        dmDuration < 3 && // qa-allow: index - Mới chẩn đoán dưới 3 năm
        !hasSevereComplications &&
        !recentHypo
      ) {
        targetText = `< ${youngTarget.toFixed(1)}%`;
        rationale =
          'Người trẻ tuổi, mới chẩn đoán, không có bệnh tim mạch và nguy cơ hạ đường huyết thấp: hướng tới mục tiêu chặt chẽ hơn để bảo vệ mạch máu lâu dài.';
        citation = 'byt.dm2.2020.hba1c_young';
      } else if (elderlyStatus !== 'not_elderly') {
        if (elderlyStatus === 'very_complex') {
          targetText = `Tránh dựa vào HbA1c (< ${olderVeryComplex.toFixed(1)}%)`;
          rationale =
            'Người cao tuổi suy yếu nặng / sức khỏe rất phức tạp hoặc kỳ vọng sống hạn chế: mục tiêu hàng đầu là tránh hạ đường huyết và tránh tăng đường huyết có triệu chứng, không ép hạ HbA1c chặt chẽ.';
          citation = 'ada.dm2.2026.older_very_complex_goal';
        } else if (elderlyStatus === 'complex') {
          targetText = `< ${olderComplex.toFixed(1)}%`;
          rationale =
            'Người cao tuổi có hội chứng suy yếu, nhiều bệnh mạn tính đồng mắc hoặc suy giảm chức năng: nới lỏng mục tiêu đường huyết để ưu tiên an toàn.';
          citation = 'ada.dm2.2026.older_complex_goal';
        } else {
          targetText = `< ${stdTarget.toFixed(1)} – ${olderHealthy.toFixed(1)}%`;
          rationale =
            'Người cao tuổi khỏe mạnh, ít bệnh đồng mắc, chức năng nhận thức – vận động bảo tồn: duy trì mục tiêu đường huyết ổn định.';
          citation = 'ada.dm2.2026.older_healthy_goal';
        }
      }

      return {
        id: 'rec_dm2_hba1c_target',
        module: 'dm2',
        tier: 'Mục tiêu đường huyết cá thể hóa',
        tierOrder: 1,
        action: 'MONITOR',
        title: `Mục tiêu HbA1c cá thể hóa: ${targetText}`,
        rationale,
        gates: [],
        citationIds: [citation, 'byt.dm2.2020.hba1c_goals'],
        priority: 100,
        profileDiff: {
          INTL: `ADA 2026: Phân tầng người cao tuổi thành 3 nhóm (Khỏe mạnh < ${stdTarget.toFixed(1)}–${olderHealthy.toFixed(1)}%, Phức tạp < ${olderComplex.toFixed(1)}%, Rất phức tạp tránh dựa vào HbA1c).`,
          VN: `BYT 5481/2020 Bảng 4 & 5: Đích chung < ${stdTarget.toFixed(1)}%; người trẻ mới chẩn đoán < ${youngTarget.toFixed(1)}%; người cao tuổi nhiều bệnh kèm ${olderHealthy.toFixed(1)}–${olderComplex.toFixed(1)}% (sức khỏe kém < ${olderVeryComplex.toFixed(1)}%).`,
          US: `ADA Standards of Care 2026 Ch. 6 & 13: Đích chuẩn < ${stdTarget.toFixed(1)}%; cá thể hóa nới lỏng ở người cao tuổi theo tình trạng sức khỏe.`
        }
      };
    },
    citationIds: ['ada.dm2.2026.hba1c_target_standard', 'byt.dm2.2020.hba1c_goals']
  }
];
