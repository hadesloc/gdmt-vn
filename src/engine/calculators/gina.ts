/**
 * Đánh giá Mức độ Kiểm soát Triệu chứng Hen theo GINA
 * Phân quyền: Agent D / Agent C3 (Vòng 2 Fail-Closed ASTHMA-R2-R3-15)
 *
 * Tiêu chuẩn:
 * - Khung đánh giá kiểm soát triệu chứng hen trong 4 tuần qua gồm 4 câu hỏi:
 *   1. Triệu chứng hen ban ngày > 2 lần/tuần?
 *   2. Có bất kỳ lần thức giấc ban đêm nào do hen?
 *   3. Cần dùng thuốc cắt cơn giảm triệu chứng > 2 lần/tuần?
 *   4. Bất kỳ sự giới hạn hoạt động thể lực nào do hen?
 * - Phân loại 3 mức độ khi đủ 4/4 câu hỏi:
 *   - Kiểm soát tốt (Well-controlled): 0 tiêu chí có.
 *   - Kiểm soát một phần (Partly controlled): 1 - 2 tiêu chí có.
 *   - Không kiểm soát (Uncontrolled): 3 - 4 tiêu chí có.
 * - Nguyên tắc An toàn Fail-Closed (ASTHMA-R2-R3-15):
 *   - Nếu đã có ≥ 3 tiêu chí dương tính (`true`), chắc chắn thuộc mức `uncontrolled` kể cả khi còn 1 câu chưa trả lời.
 *   - Nếu thiếu bất kỳ câu hỏi nào (`answered < 4`) mà số câu dương tính hiện tại < 3, TUYỆT ĐỐI KHÔNG tự động gán `false` hay kết luận nhầm `'well_controlled'` / `'partly_controlled'` -> trả `controlLevel: null`.
 *
 * Nguồn:
 * - Global Initiative for Asthma (GINA) Strategy Report (2026 update).
 *   Box 2-2A: GINA assessment of asthma symptom control (p. 41).
 *   Đường dẫn thư viện: Medical_Library_2026/01_Noi_Khoa/Ho_Hap/GINA_2026_Strategy_Report.pdf
 */

import type { GinaInput, GinaResult, SourceCitationInfo } from './types';

export const COEFFICIENTS = {
  uncontrolledMinCriteria: 3,
  partlyControlledMaxCriteria: 2,
  totalCriteriaRequired: 4,
  source: {
    organization: 'GINA',
    guideline: 'Global Strategy for Asthma Management and Prevention (2026 Report)',
    year: 2026,
    locator: 'Box 2-2A: Assessment of symptom control (p. 41)',
    doiOrUrl: 'https://ginasthma.org',
    notesVi: 'Bảng 4 câu hỏi trong 4 tuần đánh giá mức độ kiểm soát hen kinh điển (Fail-closed khi thiếu câu hỏi)',
    needsSourceVerification: false,
  } as SourceCitationInfo,
};

const CRITERIA_LABELS_VI: ReadonlyArray<{ key: keyof GinaInput; labelVi: string }> = [
  { key: 'daytimeSymptomsMoreThanTwiceWeek', labelVi: 'triệu chứng ban ngày > 2 lần/tuần' },
  { key: 'nightWakingDueToAsthma', labelVi: 'thức giấc ban đêm do hen' },
  { key: 'relieverNeededMoreThanTwiceWeek', labelVi: 'dùng thuốc cắt cơn > 2 lần/tuần' },
  { key: 'activityLimitationDueToAsthma', labelVi: 'giới hạn hoạt động thể lực do hen' },
];

/**
 * Đánh giá mức độ kiểm soát triệu chứng hen theo GINA 2026 (Box 2-2A)
 */
export function computeGina(input: GinaInput): GinaResult {
  let answeredCount = 0;
  let positiveCount = 0;
  const missingCriteria: string[] = [];
  const missingLabelsVi: string[] = [];

  for (const item of CRITERIA_LABELS_VI) {
    const val = input[item.key];
    if (typeof val === 'boolean') {
      answeredCount++;
      if (val) positiveCount++;
    } else {
      missingCriteria.push(item.key);
      missingLabelsVi.push(item.labelVi);
    }
  }

  // Trường hợp 1: Đã có >= 3 câu dương tính -> chắc chắn Không kiểm soát dù thiếu câu thứ 4
  if (positiveCount >= COEFFICIENTS.uncontrolledMinCriteria) {
    return {
      positiveCriteriaCount: positiveCount,
      answeredCriteriaCount: answeredCount,
      missingCriteria,
      controlLevel: 'uncontrolled',
      controlLevelVi: 'Không kiểm soát',
      managementAdviceVi:
        'Hen không kiểm soát: Nguy cơ đợt cấp nặng rất cao. Cần đánh giá khẩn cấp kỹ thuật xịt/hít, tuân thủ dùng thuốc ngừa cơn, tăng bậc điều trị theo GINA (Track 1 tăng liều duy trì ICS-formoterol hoặc Track 2 thêm LABA/LAMA), và xem xét đợt ngắn corticoid đường uống nếu có dấu hiệu đợt cấp.',
      warning:
        missingLabelsVi.length > 0
          ? `Còn thiếu câu hỏi (${missingLabelsVi.join(', ')}), nhưng đã có ${positiveCount}/4 tiêu chí dương tính nên chắc chắn thuộc mức Không kiểm soát theo GINA Box 2-2A.`
          : undefined,
    };
  }

  // Trường hợp 2 (Fail-Closed): Chưa đủ 4 câu hỏi và tổng câu dương tính < 3 -> không kết luận mù well_controlled / partly_controlled
  if (answeredCount < COEFFICIENTS.totalCriteriaRequired) {
    return {
      positiveCriteriaCount: positiveCount,
      answeredCriteriaCount: answeredCount,
      missingCriteria,
      controlLevel: null,
      controlLevelVi: 'Chưa đủ dữ liệu đánh giá',
      managementAdviceVi:
        'Chưa đủ dữ liệu để phân loại kiểm soát triệu chứng hen theo GINA Box 2-2A: bắt buộc khai thác đầy đủ cả 4 câu hỏi trong 4 tuần qua trước khi kết luận kiểm soát tốt hoặc quyết định hạ bậc điều trị.',
      warning: `Thiếu ${missingCriteria.length}/4 tiêu chí GINA bắt buộc (${missingLabelsVi.join(', ')}). Áp dụng nguyên tắc an toàn Fail-Closed: không tự động giả định câu hỏi bị bỏ trống là âm tính.`,
    };
  }

  // Trường hợp 3: Đã trả lời đủ 4/4 câu hỏi
  if (positiveCount === 0) {
    return {
      positiveCriteriaCount: 0,
      answeredCriteriaCount: 4,
      missingCriteria: [],
      controlLevel: 'well_controlled',
      controlLevelVi: 'Kiểm soát tốt',
      managementAdviceVi:
        'Bệnh nhân đạt kiểm soát tốt triệu chứng. Duy trì phác đồ điều trị hiện tại (ưu tiên Track 1: ICS-formoterol liều thấp khi cần hoặc duy trì và cắt cơn). Xem xét giảm bậc điều trị sau khi duy trì kiểm soát ổn định liên tục ≥ 3 tháng.',
    };
  }

  return {
    positiveCriteriaCount: positiveCount,
    answeredCriteriaCount: 4,
    missingCriteria: [],
    controlLevel: 'partly_controlled',
    controlLevelVi: 'Kiểm soát một phần',
    managementAdviceVi:
      'Kiểm soát một phần: Kiểm tra kỹ thuật hít thuốc, sự tuân thủ điều trị, các yếu tố kích phát môi trường và bệnh đồng mắc (viêm mũi dị ứng, trào ngược). Cân nhắc tăng bậc điều trị hoặc tối ưu hóa liều ICS duy trì.',
  };
}
