/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Kiểm định An toàn Thành phần Phối hợp Cố định (FDC)
 * Phân quyền: Agent F4
 *
 * Bảo đảm không bao giờ sinh lệnh CONTINUE trên một viên/bút phối hợp cố định (FDC / FRC)
 * khi thành phần đi kèm trong cùng chế phẩm đó đang bị chống chỉ định, STOP hoặc HOLD.
 */

import type { CurrentMed, RuleContext } from '../../engine/types';
import { thFor } from '../../kb-types/access';
import {
  DPP4_IDS,
  INCRETIN_RA_IDS,
  SGLT2_IDS,
  SU_IDS,
  hasDrugAllergy,
  isFdcMed,
  resolveCanonicalDrugIds,
  resolveDrugNameVi
} from './helpers.drugs';
import {
  evaluateHyperglycemicCrisis,
  getEffectiveEgfr,
  hasActiveBladderCancer,
  hasActiveFootUlcer,
  hasCirrhosis,
  hasHepaticImpairment,
  hasHf,
  hasHypoglycemiaOrOvertreatment,
  hasMtcOrMen2,
  hasPancreatitis,
  hasPioglitazoneHepaticContra,
  hasPlannedContrast,
  hasPlannedSurgery,
  hasSevereGastroparesis,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isOnDialysis,
  isPregnant,
  willStartOrContinueGlp1
} from './helpers';

export function isCompanionComponentBlocked(ctx: RuleContext, compId: string): string | undefined {
  if (hasDrugAllergy(ctx, compId)) {
    return `dị ứng với thành phần ${resolveDrugNameVi(compId)}`;
  }

  const egfr = getEffectiveEgfr(ctx);
  const dialysis = isOnDialysis(ctx);
  const crisis = evaluateHyperglycemicCrisis(ctx);
  const isInpatient = ctx.settings.setting === 'inpatient';

  if (isPregnant(ctx) && compId !== 'metformin') {
    return `thai kỳ chống chỉ định/không khuyến cáo thành phần ${resolveDrugNameVi(compId)}`;
  }
  if (isBreastfeeding(ctx) && compId !== 'metformin') {
    return `thời kỳ cho con bú cần ngừng thành phần ${resolveDrugNameVi(compId)}`;
  }

  if (compId === 'metformin') {
    if (dialysis || (egfr !== undefined && egfr < thFor('egfr', 'dm2.metformin.egfr_contra'))) {
      return `chống chỉ định Metformin do eGFR < ${thFor('egfr', 'dm2.metformin.egfr_contra')} mL/phút/1.73m² hoặc lọc máu`;
    }
    if (hasHepaticImpairment(ctx)) {
      return 'chống chỉ định Metformin do suy gan / xơ gan mất bù (nguy cơ nhiễm toan lactic)';
    }
    if (hasPlannedContrast(ctx)) {
      return 'cần tạm ngừng Metformin trước/tại thời điểm tiêm thuốc cản quang iod';
    }
    if (hasPlannedSurgery(ctx) || isInpatient || crisis.isConfirmedCrisis || crisis.isSuspectedUnconfirmed) {
      return 'cần tạm ngừng Metformin trong giai đoạn nội viện / tiền phẫu / cấp tính';
    }
  }

  if ((SGLT2_IDS as readonly string[]).includes(compId)) {
    if (dialysis) return 'chống chỉ định SGLT2i trên bệnh nhân lọc máu';
    if (compId === 'canagliflozin' && hasActiveFootUlcer(ctx)) {
      return 'cần ngừng Canagliflozin do đang loét bàn chân / nguy cơ đoạn chi (CANVAS)';
    }
    if (crisis.isConfirmedCrisis || crisis.isSuspectedUnconfirmed || crisis.isIsolatedKetonemia) {
      return 'cần ngừng SGLT2i do biến cố toan ceton / tăng áp lực thẩm thấu cấp';
    }
    if (hasPlannedSurgery(ctx) || isInpatient) {
      return 'cần tạm ngừng SGLT2i chu phẫu / nội viện cấp tính';
    }
    if (hasHepaticImpairment(ctx)) {
      return 'không khuyến cáo SGLT2i ở suy gan nặng / xơ gan mất bù';
    }
  }

  if (compId === 'pioglitazone') {
    if (hasHf(ctx)) return 'chống chỉ định tuyệt đối Pioglitazone ở bệnh nhân suy tim';
    if (hasPioglitazoneHepaticContra(ctx)) return 'chống chỉ định Pioglitazone do bệnh gan hoạt động / tăng ALT > 2.5× ULN';
    if (hasActiveBladderCancer(ctx)) return 'chống chỉ định Pioglitazone do ung thư bàng quang đang hoạt động';
    if (isInpatient || hasPlannedSurgery(ctx)) return 'cần tạm ngừng Pioglitazone trong nội viện / tiền phẫu';
  }

  if ((DPP4_IDS as readonly string[]).includes(compId)) {
    if (hasPancreatitis(ctx)) return `chống chỉ định ${resolveDrugNameVi(compId)} do viêm tụy cấp`;
    if (compId === 'saxagliptin' && hasHf(ctx)) {
      return 'cần ngừng Saxagliptin do làm tăng nhập viện vì suy tim (SAVOR-TIMI 53)';
    }
    if (compId === 'vildagliptin' && hasHepaticImpairment(ctx)) {
      return 'chống chỉ định Vildagliptin do suy gan / ALT hoặc AST > 3× ULN';
    }
    if (willStartOrContinueGlp1(ctx)) {
      return `cần ngừng thành phần DPP-4i (${resolveDrugNameVi(compId)}) do không phối hợp trùng lặp cơ chế với GLP-1 RA`;
    }
    if (isInpatient || hasPlannedSurgery(ctx)) {
      return `cần tạm ngừng ${resolveDrugNameVi(compId)} trong nội viện / tiền phẫu`;
    }
  }

  if ((INCRETIN_RA_IDS as readonly string[]).includes(compId)) {
    if (hasMtcOrMen2(ctx)) return `chống chỉ định tuyệt đối ${resolveDrugNameVi(compId)} do tiền sử MTC / MEN 2`;
    if (hasPancreatitis(ctx)) return `chống chỉ định ${resolveDrugNameVi(compId)} do viêm tụy cấp`;
    if (hasSevereGastroparesis(ctx)) return `cần tránh ${resolveDrugNameVi(compId)} do liệt dạ dày nặng`;
    if ((compId === 'lixisenatide' || compId === 'exenatide') && (dialysis || (egfr !== undefined && egfr <= thFor('egfr', 'dm2.metformin.egfr_contra')))) {
      return `không khuyến cáo ${resolveDrugNameVi(compId)} khi eGFR ≤ ${thFor('egfr', 'dm2.metformin.egfr_contra')} mL/phút/1.73m²`;
    }
    if (isInpatient || hasPlannedSurgery(ctx)) {
      return `cần tạm ngừng ${resolveDrugNameVi(compId)} nội viện cấp tính / tiền phẫu`;
    }
  }

  if ((SU_IDS as readonly string[]).includes(compId)) {
    if (isActivelyHypoglycemic(ctx) || hasHypoglycemiaOrOvertreatment(ctx)) {
      return `cần ngừng ${resolveDrugNameVi(compId)} do nguy cơ hạ đường huyết`;
    }
    if (dialysis || (egfr !== undefined && egfr < thFor('egfr', 'dm2.metformin.egfr_contra'))) {
      return `chống chỉ định ${resolveDrugNameVi(compId)} khi suy thận nặng eGFR < ${thFor('egfr', 'dm2.metformin.egfr_contra')} mL/phút/1.73m²`;
    }
    if (hasHepaticImpairment(ctx)) {
      return `chống chỉ định ${resolveDrugNameVi(compId)} do suy gan nặng`;
    }
    if (isInpatient || hasPlannedSurgery(ctx)) {
      return `cần tạm ngừng ${resolveDrugNameVi(compId)} trong nội viện / tiền phẫu`;
    }
  }

  if (compId === 'acarbose') {
    if (hasCirrhosis(ctx) || hasHepaticImpairment(ctx)) return 'chống chỉ định Acarbose ở xơ gan / suy gan';
    if (dialysis || (egfr !== undefined && egfr < thFor('egfr', 'dm2.su_agi.egfr_contra'))) {
      return 'chống chỉ định Acarbose khi suy thận nặng';
    }
  }

  return undefined;
}

export function getFdcBlockedCompanionReason(
  ctx: RuleContext,
  med: CurrentMed | undefined,
  keepCanonicalId: string
): string | undefined {
  if (!med || !isFdcMed(med)) return undefined;
  const components = resolveCanonicalDrugIds(med.drugId, med.name);
  for (const comp of components) {
    if (comp === keepCanonicalId) continue;
    const reason = isCompanionComponentBlocked(ctx, comp);
    if (reason) return reason;
  }
  return undefined;
}
