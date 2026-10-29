/**
 * GDMT-VN Gout Module - Low-Dose Aspirin & Lifestyle Rules
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation } from '../../engine/types';
import {
  goutRule,
  goutRec,
  LOW_DOSE_ASPIRIN_IDS,
  PPI_DRUG_IDS,
  isOnMed,
  isOnAnticoagulant,
  hasActiveMajorBleeding,
  hasPriorGiUlcerOrBleedHistory
} from './helpers';

const TIER_SAFETY = 'An toàn thuốc & Chống chỉ định';
const TIER_COMORBID = 'Tối ưu thuốc đồng mắc & Lối sống';

export const goutAspirinAndLifestyleRules: Rule[] = [
  goutRule({
    id: 'gout.concurrent.keep_aspirin',
    nameVi: 'Xử trí Aspirin liều thấp trên bệnh nhân Gút (duy trì dự phòng tim mạch kèm PPI nếu tiền sử loét; ngừng khi xuất huyết cấp)',
    citationIds: ['acr.gout.2020.do_not_stop_aspirin', 'byt.gout.2014.nsaid_contra_p198', 'byt.gout.2014.nsaid_ppi_gastroprotection_p199'],
    when: (ctx) =>
      isOnMed(ctx, LOW_DOSE_ASPIRIN_IDS) || Boolean(ctx.normalized.customInputs?.takingLowDoseAspirin),
    produce: (ctx): Recommendation => {
      if (hasActiveMajorBleeding(ctx)) {
        return goutRec({
          id: 'rec_gout_stop_aspirin_active_bleed',
          tier: TIER_SAFETY,
          tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 99, // qa-allow: index - độ ưu tiên xuất huyết cấp
          action: 'STOP',
          drugId: 'aspirin',
          title: 'NGỪNG KHẨN CẤP Aspirin do đang có xuất huyết nội sọ cấp / xuất huyết tiêu hóa tiến triển',
          rationale:
            'Đang có biến cố chảy máu cấp tính đe dọa tính mạng (xuất huyết nội sọ hoặc loét – xuất huyết tiêu hóa đang hoạt động): bắt buộc ngừng ngay Aspirin và hội chẩn chuyên khoa Tim mạch – Thần kinh/Tiêu hóa.',
          citationIds: ['byt.gout.2014.nsaid_contra_p198']
        });
      }
      if (isOnAnticoagulant(ctx) && !ctx.normalized.conditions?.recentAcs) {
        return goutRec({
          id: 'rec_gout_review_aspirin_on_oac',
          tier: TIER_COMORBID,
          tierOrder: 7, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 74, // qa-allow: index - độ ưu tiên rà soát chống huyết khối
          action: 'CONSIDER',
          drugId: 'aspirin',
          title: 'Rà soát chỉ định phối hợp Aspirin trên nền thuốc chống đông đường uống (OAC)',
          rationale:
            'Không ngừng Aspirin chỉ vì lý do tăng acid uric trong bệnh gút, nhưng do bệnh nhân đang dùng thuốc chống đông (DOAC/Warfarin) không kèm hội chứng vành cấp mới, cần rà soát chuyên khoa Tim mạch xem xét ngừng kháng tiểu cầu đơn thuần để giảm nguy cơ xuất huyết nặng.',
          citationIds: ['acr.gout.2020.do_not_stop_aspirin', 'byt.gout.2014.nsaid_contra_p198']
        });
      }
      const priorUlcerOrBleed = hasPriorGiUlcerOrBleedHistory(ctx);
      const warns =
        priorUlcerOrBleed && !isOnMed(ctx, PPI_DRUG_IDS)
          ? [
              'Bệnh nhân có tiền sử loét dạ dày – tá tràng hoặc tiền sử xuất huyết tiêu hóa đã ổn định: BẮT BUỘC phối hợp thuốc ức chế bơm proton (PPI) bảo vệ niêm mạc tiêu hóa khi tiếp tục duy trì Aspirin liều thấp dự phòng tim mạch thứ phát (không tự ý ngừng Aspirin gây huyết khối stent/nhồi máu cơ tim).'
            ]
          : undefined;
      return goutRec({
        id: 'rec_gout_keep_low_dose_aspirin',
        tier: TIER_COMORBID,
        tierOrder: 7, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 70, // qa-allow: index - độ ưu tiên thuốc đồng mắc
        action: 'CONTINUE',
        drugId: 'aspirin',
        title: 'Tiếp tục duy trì Aspirin liều thấp bảo vệ tim mạch (KHÔNG ngừng vì bệnh Gút)',
        rationale:
          'Dù Aspirin liều thấp làm giảm nhẹ bài xuất acid uric qua thận, ACR 2020 (Table 8, PICO 47) khuyến cáo KHÔNG ngừng Aspirin liều thấp ở bệnh nhân đang có chỉ định dự phòng biến cố tim mạch phù hợp.',
        warnings: warns,
        citationIds: priorUlcerOrBleed
          ? ['acr.gout.2020.do_not_stop_aspirin', 'byt.gout.2014.nsaid_ppi_gastroprotection_p199']
          : ['acr.gout.2020.do_not_stop_aspirin']
      });
    }
  }),

  goutRule({
    id: 'gout.lifestyle.advice',
    nameVi: 'Tư vấn dinh dưỡng, kiểm soát cân nặng và điều chỉnh lối sống toàn diện cho bệnh nhân Gút',
    citationIds: [
      'acr.gout.2020.lifestyle_alcohol',
      'acr.gout.2020.lifestyle_purine',
      'acr.gout.2020.lifestyle_hfcs',
      'acr.gout.2020.lifestyle_weight',
      'byt.gout.2014.target_urate'
    ],
    when: () => true,
    produce: () =>
      goutRec({
        id: 'rec_gout_lifestyle_guidance',
        tier: TIER_COMORBID,
        tierOrder: 7, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 55, // qa-allow: index - độ ưu tiên lối sống
        action: 'MONITOR',
        title: 'Chế độ ăn uống & Lối sống: Hạn chế rượu bia, purin, nước ngọt giàu fructose và giảm cân nếu thừa cân',
        rationale:
          'Theo ACR 2020 (Table 7), khuyến cáo cho mọi bệnh nhân gút: (1) Hạn chế rượu bia (đặc biệt bia và rượu mạnh); (2) Hạn chế thực phẩm giàu nhân purin (nội tạng động vật, thịt đỏ, hải sản); (3) Tránh đồ uống chứa siro ngô giàu fructose (HFCS); (4) Giảm cân từ từ nếu thừa cân/béo phì và uống đủ nước.',
        profileDiff: {
          US: 'ACR 2020: Khuyến cáo hạn chế rượu bia, purin, HFCS, giảm cân khi thừa cân; không khuyến cáo bổ sung Vitamin C thường quy để hạ urat.',
          INTL: 'EULAR 2016: Khuyến khích dùng sữa ít béo và tập thể dục đều đặn bên cạnh hạn chế rượu bia, thịt đỏ/hải sản và đồ uống có đường.',
          VN: 'BYT 361/2014: Cữ tuyệt đối rượu bia, phủ tạng động vật, hải sản; uống đủ nước lọc/nước khoáng kiềm nhẹ nếu không suy tim hoặc phù.'
        },
        citationIds: [
          'acr.gout.2020.lifestyle_alcohol',
          'acr.gout.2020.lifestyle_purine',
          'acr.gout.2020.lifestyle_hfcs',
          'acr.gout.2020.lifestyle_weight',
          'byt.gout.2014.target_urate'
        ]
      })
  })
];
