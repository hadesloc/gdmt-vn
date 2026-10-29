import type { Action, Rule } from '../../engine/types';
import { hasCondition, missingInputRec, need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  getCustomInput,
  hasExtraCondition,
  hasHfContext,
  isOutpatientDecompensatedCrisis,
} from './helpers';

export const hfDeviceRules: Rule[] = [
  {
    id: 'hf.gdit.icd',
    module: 'hf',
    nameVi: 'Máy phá rung tự động cấy ghép (ICD) dự phòng tiên phát đột tử',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.hf.2026.icd_primary_prevention',
      'esc.hf.2026.icd_contra_nyha4_mi40d',
      'aha.hf.2022.icd_nonischemic_cor1',
      'aha.hf.2022.icd_nyha1_post_mi_ef30',
    ],
    when: (ctx) => {
      if (!hasHfContext(ctx) || isOutpatientDecompensatedCrisis(ctx)) return false;
      const lvef = need(ctx, 'lvef');
      return lvef !== undefined && lvef <= thFor('lvef', 'hf.icd.ef_max');
    },
    produce: (ctx) => {
      const cits = [
        'esc.hf.2026.icd_primary_prevention',
        'esc.hf.2026.icd_contra_nyha4_mi40d',
        'aha.hf.2022.icd_nonischemic_cor1',
      ];
      const nyha = need(ctx, 'nyha');
      if (nyha === undefined) {
        return missingInputRec('hf', 'nyha', 'xác định phân độ cơ năng NYHA trước khi đánh giá chỉ định cấy máy ICD dự phòng tiên phát', cits);
      }
      const lvef = need(ctx, 'lvef')!;
      const isIschemic = Boolean(
        getCustomInput(ctx, 'ischemicEtiology') ||
          getCustomInput(ctx, 'postMiOver40d') ||
          hasCondition(ctx, 'cad') ||
          hasCondition(ctx, 'mi') ||
          hasCondition(ctx, 'ascvd')
      );

      const nyha1EfMax = thFor('lvef', 'hf.icd.ef_max_nyha1_post_mi_us');
      if (nyha === 1) {
        if (!(ctx.settings.profile === 'US' && isIschemic && lvef <= nyha1EfMax)) return null;
      }

      if (nyha === 4 || hasExtraCondition(ctx, 'limitedLifespan')) {
        return {
          id: 'rec_hf_icd_contra',
          module: 'hf',
          tier: 'Thiết bị can thiệp GDIT (Class III)',
          tierOrder: 3,
          action: 'AVOID',
          title: 'Không chỉ định cấy ICD dự phòng tiên phát (NYHA IV dai dẳng / kỳ vọng sống ngắn)',
          rationale: 'ESC 2026 Class III-C không khuyến cáo cấy ICD ở bệnh nhân NYHA IV kháng trị nội khoa (trừ ứng viên CRT/LVAD/ghép tim) hoặc kỳ vọng sống đạt chất lượng tốt không quá một năm.',
          gates: [{ parameter: 'NYHA / Tiên lượng', passed: false, value: nyha, messageVi: 'NYHA IV / kỳ vọng sống hạn chế' }],
          citationIds: ['esc.hf.2026.icd_contra_nyha4_mi40d'],
          priority: 82,
        };
      }

      const fmtMonths = need(ctx, 'fmtDurationMonths');
      const minMonths = thFor('duration_months', 'hf.icd.omt_months_min');
      const minPostMiDays = thFor('duration_days', 'hf.icd.post_mi_days_min');
      const recentMi = hasCondition(ctx, 'recentAcs') || hasCondition(ctx, 'acuteAcsWithin24h');
      if (recentMi || fmtMonths === undefined || fmtMonths < minMonths) {
        return {
          id: 'rec_hf_icd_defer',
          module: 'hf',
          tier: 'Thiết bị can thiệp GDIT',
          tierOrder: 3,
          action: 'DEFER',
          title: `Trì hoãn quyết định cấy ICD cho tới khi tối ưu FMT đủ >= ${minMonths} tháng`,
          rationale: `Cần tối ưu 4 trụ cột FMT ít nhất ${minMonths} tháng (và chờ >= ${minPostMiDays} ngày sau NMCT cấp, Class III-B1) rồi siêu âm tim đánh giá lại LVEF.`,
          gates: [{ parameter: 'Thời gian FMT', passed: false, value: fmtMonths ?? 'Chưa đủ', threshold: `>= ${minMonths} tháng`, messageVi: `FMT >= ${minMonths} tháng` }],
          citationIds: cits,
          priority: 68,
        };
      }

      const actIcd: Action = isIschemic || ctx.settings.profile === 'US' ? 'START' : 'CONSIDER';
      const classLabel = isIschemic
        ? 'Class I-B1 / COR 1-A'
        : ctx.settings.profile === 'US'
          ? 'COR 1-A'
          : 'Class IIa-B1';

      return {
        id: 'rec_hf_icd_start',
        module: 'hf',
        tier: `Thiết bị can thiệp GDIT (${classLabel})`,
        tierOrder: 3,
        action: actIcd,
        title: `${actIcd === 'START' ? 'Chỉ định' : 'Xem xét'} cấy máy phá rung tự động ICD dự phòng tiên phát (${classLabel})`,
        rationale: `Bệnh nhân HFrEF (LVEF ${lvef}% <= ${thFor('lvef', 'hf.icd.ef_max')}%, NYHA ${nyha}, nguyên nhân ${isIschemic ? 'thiếu máu cục bộ' : 'không thiếu máu cục bộ'}) sau >= ${minMonths} tháng điều trị FMT tối ưu và kỳ vọng sống trên một năm: đánh giá cấy ICD giảm đột tử do loạn nhịp thất.`,
        gates: [{ parameter: 'Thời gian FMT', passed: true, value: fmtMonths, threshold: `>= ${minMonths} tháng`, messageVi: 'Đã đủ thời gian tối ưu hóa FMT' }],
        profileDiff: {
          INTL: 'ESC 2026 xếp bệnh cơ tim thiếu máu cục bộ ở mức Class I-B1 và không thiếu máu cục bộ (DANISH) ở mức Class IIa-B1 (chỉ áp dụng NYHA II–III).',
          US: `AHA/ACC/HFSA 2022 xếp COR 1-A cho cả thiếu máu cục bộ lẫn không thiếu máu cục bộ (NYHA II–III), và COR 1 B-R cho NYHA I sau NMCT ít nhất ${minPostMiDays} ngày có LVEF không quá ${nyha1EfMax}% (MADIT-II).`,
          VN: 'BYT QĐ 1857/2022 phân tầng Class I (thiếu máu cục bộ) và Class IIa (không thiếu máu cục bộ).',
        },
        citationIds: nyha === 1 ? ['aha.hf.2022.icd_nyha1_post_mi_ef30', ...cits] : cits,
        priority: 81,
      };
    },
  },
  {
    id: 'hf.gdit.crt',
    module: 'hf',
    nameVi: 'Liệu pháp tái đồng bộ cơ tim (CRT-D / CRT-P)',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.hf.2026.crt_lbbb_qrs_150',
      'esc.hf.2026.crt_non_lbbb_150_lbbb_130_149',
      'esc.hf.2026.crt_qrs_130',
      'esc.hf.2026.crt_reassessment',
      'esc.hf.2026.af_avn_ablation_crt',
      'aha.hf.2022.crt_120_149_lbbb_2a',
    ],
    when: (ctx) => {
      if (!hasHfContext(ctx) || isOutpatientDecompensatedCrisis(ctx)) return false;
      const lvef = need(ctx, 'lvef');
      return lvef !== undefined && lvef <= thFor('lvef', 'hf.crt.ef_max');
    },
    produce: (ctx) => {
      const cits = [
        'esc.hf.2026.crt_lbbb_qrs_150',
        'esc.hf.2026.crt_non_lbbb_150_lbbb_130_149',
        'esc.hf.2026.crt_qrs_130',
        'esc.hf.2026.crt_reassessment',
      ];
      const qrs = need(ctx, 'qrsDuration');
      const qrsMinEsc = thFor('qrs_duration', 'hf.crt.qrs_min');
      const qrsMinUs = thFor('qrs_duration', 'hf.crt.qrs_min_us');
      const qrsContraCut = ctx.settings.profile === 'US' ? qrsMinUs : qrsMinEsc;
      const qrsClass1 = thFor('qrs_duration', 'hf.crt.qrs_class1');

      if (qrs === undefined) {
        if (ctx.patient.rhythm !== undefined && ctx.patient.rhythm !== 'sinus' && ctx.patient.rhythm !== 'afib') return null;
        return {
          id: 'rec_hf_crt_enter_qrs',
          module: 'hf',
          tier: 'Thiết bị can thiệp GDIT',
          tierOrder: 3,
          action: 'CONSIDER',
          title: 'Cần nhập độ rộng & hình dạng phức bộ QRS trên ECG để sàng lọc chỉ định CRT',
          rationale: `Ở bệnh nhân suy tim có LVEF <= ${thFor('lvef', 'hf.crt.ef_max')}%, cần đo bề rộng QRS và xác định dạng LBBB để đánh giá chỉ định máy tái đồng bộ tim (CRT khi QRS >= ${qrsContraCut} ms).`,
          gates: [],
          citationIds: cits,
          priority: 60,
        };
      }

      if (qrs < qrsContraCut) {
        return {
          id: 'rec_hf_crt_contra',
          module: 'hf',
          tier: 'Thiết bị can thiệp GDIT (Class III)',
          tierOrder: 3,
          action: 'AVOID',
          title: `Chống chỉ định cấy CRT khi phức bộ QRS hẹp (${qrs} ms < ${qrsContraCut} ms)`,
          rationale: `Không đặt máy tái đồng bộ tim (CRT) khi bề rộng QRS dưới ${qrsContraCut} ms (Class III - Gây hại).`,
          gates: [{ parameter: 'QRS', passed: false, value: qrs, threshold: `>= ${qrsContraCut} ms`, messageVi: `QRS < ${qrsContraCut} ms (Class III)` }],
          citationIds: ['esc.hf.2026.crt_qrs_130'],
          priority: 77,
        };
      }

      const nyha = need(ctx, 'nyha');
      if (nyha === undefined || ctx.patient.rhythm === undefined) {
        return {
          id: 'rec_hf_crt_enter_qrs',
          module: 'hf',
          tier: 'Thiết bị can thiệp GDIT',
          tierOrder: 3,
          action: 'CONSIDER',
          title: 'Cần nhập đủ nhịp tim trên ECG và phân độ NYHA trước khi quyết định đặt CRT',
          rationale: 'Chỉ định CRT đòi hỏi xác nhận nhịp ECG (nhịp xoang hoặc rung nhĩ) và triệu chứng cơ năng NYHA II–IV.',
          gates: [],
          citationIds: cits,
          priority: 62,
        };
      }

      if (nyha < 2) return null;

      const fmtMonths = need(ctx, 'fmtDurationMonths');
      const minMonths = thFor('duration_months', 'hf.icd.omt_months_min');
      if (fmtMonths === undefined || fmtMonths < minMonths) {
        return {
          id: 'rec_hf_crt_defer',
          module: 'hf',
          tier: 'Thiết bị can thiệp GDIT',
          tierOrder: 3,
          action: 'DEFER',
          title: `Trì hoãn cấy CRT cho tới khi điều trị tối ưu FMT đủ >= ${minMonths} tháng`,
          rationale: `Cần tối ưu hóa 4 trụ cột FMT ít nhất ${minMonths} tháng và đánh giá lại LVEF / QRS trước khi cấy CRT.`,
          gates: [{ parameter: 'Thời gian FMT', passed: false, value: fmtMonths ?? 'Chưa đủ', threshold: `>= ${minMonths} tháng`, messageVi: `FMT >= ${minMonths} tháng` }],
          citationIds: ['esc.hf.2026.crt_reassessment', ...cits],
          priority: 69,
        };
      }

      if (ctx.patient.rhythm === 'afib') {
        if (nyha < 3 || qrs < qrsMinEsc) return null;
        return {
          id: 'rec_hf_crt_start',
          module: 'hf',
          tier: 'Thiết bị can thiệp GDIT (Class IIa - Rung nhĩ)',
          tierOrder: 3,
          action: 'CONSIDER',
          title: `Xem xét cấy CRT kết hợp chiến lược đảm bảo tạo nhịp hai thất gần 100% ở HFrEF kèm rung nhĩ (QRS ${qrs} ms)`,
          rationale: `Theo ESC 2026 (Class IIa-C), ở bệnh nhân HFrEF (LVEF <= ${thFor('lvef', 'hf.crt.ef_max')}%, NYHA III–IV) kèm rung nhĩ và QRS >= ${qrsMinEsc} ms, nên cân nhắc CRT với điều kiện đảm bảo tỷ lệ tạo nhịp hai thất gần 100% (bao gồm đốt nút nhĩ-thất nếu kiểm soát tần số không hoàn toàn).`,
          gates: [{ parameter: 'QRS (Rung nhĩ)', passed: true, value: qrs, threshold: `>= ${qrsMinEsc} ms`, messageVi: `QRS ${qrs} ms kèm chiến lược tạo nhịp ~100%` }],
          citationIds: ['esc.hf.2026.af_avn_ablation_crt', ...cits],
          priority: 76,
        };
      }

      if (ctx.patient.rhythm !== 'sinus') return null;

      const rawMorph = String(getCustomInput(ctx, 'qrsMorphology') ?? '').trim().toLowerCase();
      if (!rawMorph) {
        return missingInputRec('hf', 'qrsMorphology', 'phân biệt dạng LBBB hay non-LBBB để xác định chỉ định CRT (Class I-A so với Class IIa/IIb)', cits);
      }

      if (ctx.settings.profile === 'US' && qrs < qrsMinEsc && rawMorph !== 'lbbb') {
        return {
          id: 'rec_hf_crt_contra',
          module: 'hf',
          tier: 'Thiết bị can thiệp GDIT (Class III)',
          tierOrder: 3,
          action: 'AVOID',
          title: `Không chỉ định CRT ở dạng non-LBBB có QRS ${qrs} ms (< ${qrsMinEsc} ms)`,
          rationale: `Ở khoảng QRS ${qrsMinUs}–129 ms, AHA/ACC 2022 chỉ cân nhắc CRT khi có hình thái LBBB điển hình.`,
          gates: [{ parameter: 'Hình dạng QRS', passed: false, value: rawMorph, messageVi: `Non-LBBB kèm QRS dưới ${qrsMinEsc} ms` }],
          citationIds: ['aha.hf.2022.crt_120_149_lbbb_2a', 'esc.hf.2026.crt_qrs_130'],
          priority: 75,
        };
      }

      const crtEf = thFor('lvef', 'hf.crt.ef_max');
      const isClassI = rawMorph === 'lbbb' && qrs >= qrsClass1;
      const act: Action = isClassI ? 'START' : 'CONSIDER';
      return {
        id: 'rec_hf_crt_start',
        module: 'hf',
        tier: isClassI ? 'Thiết bị can thiệp GDIT (Class I)' : 'Thiết bị can thiệp GDIT (Class IIa/IIb)',
        tierOrder: 3,
        action: act,
        title: isClassI
          ? `Chỉ định cấy máy tái đồng bộ tim CRT (LBBB, QRS ${qrs} ms >= ${qrsClass1} ms - Class I-A)`
          : `Xem xét cấy máy tái đồng bộ tim CRT (${rawMorph.toUpperCase()}, QRS ${qrs} ms - Class IIa/IIb)`,
        rationale: isClassI
          ? `CRT được khuyến cáo Class I-A ở HFrEF nhịp xoang có LVEF <= ${crtEf}%, LBBB và QRS >= ${qrsClass1} ms sau tối ưu FMT nhằm giảm tử vong và nhập viện.`
          : `CRT được cân nhắc (Class IIa ở LBBB ${qrsMinEsc}–149 ms hoặc non-LBBB từ ${qrsClass1} ms trở lên; Mỹ cân nhắc LBBB từ ${qrsMinUs}–149 ms COR 2a) nhằm giảm nhập viện và cải thiện tái cấu trúc thất trái.`,
        gates: [{ parameter: 'QRS', passed: true, value: qrs, threshold: `>= ${qrsContraCut} ms`, messageVi: `QRS ${qrs} ms (${rawMorph.toUpperCase()})` }],
        profileDiff: {
          INTL: `ESC 2026 chống chỉ định CRT khi QRS dưới ${qrsMinEsc} ms (Class III-A).`,
          US: `AHA/ACC/HFSA 2022 cho phép cân nhắc CRT (COR 2a, B-NR) ở LBBB có QRS ${qrsMinUs}–149 ms và chống chỉ định khi QRS dưới ${qrsMinUs} ms.`,
          VN: `BYT QĐ 1857/2022 lấy mốc QRS từ ${qrsMinEsc} ms trở lên.`,
        },
        citationIds: ['aha.hf.2022.crt_120_149_lbbb_2a', ...cits],
        priority: isClassI ? 85 : 75,
      };
    },
  },
];
