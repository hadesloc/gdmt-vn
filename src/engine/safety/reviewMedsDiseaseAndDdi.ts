/**
 * GDMT-VN Medication Safety Review - Disease & DDI Contraindication Rules
 * Phân quyền: Agent B
 *
 * Kiểm tra các chống chỉ định tuyệt đối theo bệnh lý & tương tác tử vong trên thuốc nền `currentMeds`:
 * - Viên phối hợp chứa ACEi khi có chỉ định khởi trị / chuyển đổi ARNI (washout 36h)
 * - PDE-5i + Nitrat / Vericiguat
 * - Chất ức chế mạnh CYP3A4 + Eplerenone / Finerenone / Ivabradine / Simvastatin / Lovastatin / Colchicine (khi suy thận/gan)
 * - Ivabradine + Diltiazem / Verapamil
 * - Chống chỉ định Class III ở HFrEF / Suy tim (Non-DHP CCB, Class IC / Dronedarone, TZD, Saxagliptin, NSAID)
 * - Ivabradine ở Rung nhĩ; Chẹn beta không chọn lọc đường toàn thân ở Hen phế quản; NSAID COX-1 / Aspirin ở AERD
 */

import type { Patient, Recommendation } from '../types';
import { hasCondition } from '../types';
import {
  getNormalizedDrugClasses,
  isCox1NsaidOrSalicylate,
  inferReviewModule,
  PDE5I_DRUG_IDS,
  NITRATE_OR_SGC_DRUG_IDS
} from './gates';

export interface DiseaseAndDdiMedCheckParams {
  drugId: string;
  resolvedKbId: string;
  drugName: string;
  components: string[];
  fdc: boolean;
  isOphthalmicBb: boolean;
  drugClasses: Set<string>;
  isNsaid: boolean;
  egfr: number | undefined;
  patient: Patient;
  currentMedIdsLower: Set<string>;
  arniPlanned: boolean;
  takingPde5i: boolean;
  takingNitrateOrSgc: boolean;
  takingStrongCyp3a4: boolean;
  hasHfReduced: boolean;
  hasHfAny: boolean;
  hasAf: boolean;
  hasAsthma: boolean;
  hasAerd: boolean;
}

export function reviewDiseaseAndDdiStopForCurrentMed(
  p: DiseaseAndDdiMedCheckParams
): Recommendation | null {
  const {
    drugId,
    resolvedKbId,
    drugName,
    components,
    fdc,
    isOphthalmicBb,
    drugClasses,
    isNsaid,
    egfr,
    patient,
    currentMedIdsLower,
    arniPlanned,
    takingPde5i,
    takingNitrateOrSgc,
    takingStrongCyp3a4,
    hasHfReduced,
    hasHfAny,
    hasAf,
    hasAsthma,
    hasAerd
  } = p;

  // 2a. HF-R2-R3-16: Viên phối hợp chứa ACEi khi có chỉ định khởi trị / chuyển sang ARNI -> STOP SPC + washout 36h
  if (fdc && drugClasses.has('acei') && arniPlanned) {
    const nonAceiComps = components.filter((c) => !getNormalizedDrugClasses(c).has('acei'));
    return {
      id: `med_review_acei_spc_arni_washout_stop_${drugId}`,
      module: 'hf',
      tier: 'An toàn chuyển đổi ACEi sang ARNI (Washout 36 giờ)',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG ${drugName} & CHỜ ĐỦ 36 GIỜ WASHOUT TRƯỚC KHI DÙNG ARNI`,
      rationale: `${drugName} chứa thành phần ức chế men chuyển (ACEi). Bắt buộc ngừng viên phối hợp này và chờ tối thiểu 36 giờ (washout) trước khi uống liều đầu tiên Sacubitril/valsartan để phòng phù mạch đe dọa tính mạng.${nonAceiComps.length > 0 ? ` Có thể duy trì thành phần còn lại (${nonAceiComps.join(', ')}) dưới dạng viên đơn chất nếu còn chỉ định huyết áp/lợi tiểu.` : ''}`,
      gates: [
        {
          parameter: 'acei_arni_washout_36h',
          passed: false,
          action: 'contra',
          messageVi: 'Bắt buộc ngừng viên phối hợp chứa ACEi và washout 36 giờ trước khi khởi trị ARNI'
        }
      ],
      citationIds: ['fda.entresto.acei_36h_washout', 'esc.hf.2026.washout_acei_arni_36h'],
      priority: 100
    };
  }

  // 2b. Tương tác chống chỉ định tuyệt đối PDE-5i + Nitrat / Vericiguat (kể cả Bidil chứa ISDN)
  if (
    takingPde5i &&
    takingNitrateOrSgc &&
    (PDE5I_DRUG_IDS.has(resolvedKbId) ||
      drugClasses.has('pde5i') ||
      NITRATE_OR_SGC_DRUG_IDS.has(resolvedKbId) ||
      drugClasses.has('nitrate'))
  ) {
    return {
      id: `med_review_pde5i_nitrate_stop_${drugId}`,
      module: 'hf',
      tier: 'Cảnh báo tương tác tử vong',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG NGAY ${drugName} (Chống chỉ định phối hợp PDE-5i + Nitrat / Vericiguat)`,
      rationale:
        'Phối hợp đồng thời thuốc ức chế PDE-5 (sildenafil, tadalafil, vardenafil) với Nitrat hoặc thuốc kích thích sGC (Vericiguat) gây cộng hưởng cGMP làm tụt huyết áp sâu kháng trị và tử vong. Bắt buộc ngừng phối hợp ngay lập tức.',
      gates: [
        {
          parameter: 'PDE5i_Nitrate_SGC',
          passed: false,
          action: 'contra',
          messageVi: 'Chống chỉ định phối hợp PDE-5i với Nitrat hoặc Vericiguat'
        }
      ],
      citationIds: ['esc.hf.2026.vericiguat_rec', 'esc.hf.2026.acute_vasodilators'],
      priority: 100
    };
  }

  // 2b2. Eplerenone / Finerenone / Ivabradine / Simvastatin / Lovastatin / Colchicine (khi suy thận/gan) + Strong CYP3A4i
  const colchicineCypContra =
    components.includes('colchicine') &&
    ((egfr !== undefined && egfr < 60) ||
      hasCondition({ normalized: patient, patient }, 'liverDisease') ||
      Boolean(patient.customInputs?.childPugh));

  if (
    takingStrongCyp3a4 &&
    (components.some((c) =>
      ['eplerenone', 'finerenone', 'ivabradine', 'simvastatin', 'lovastatin'].includes(c)
    ) ||
      colchicineCypContra)
  ) {
    const cypCits = colchicineCypContra
      ? ['fda.colchicine.contraindication_renal_hepatic', 'fda.colchicine.strong_cyp3a4_table1']
      : components.includes('ivabradine')
        ? ['fda.ivabradine.contraindication_strong_cyp3a4']
        : components.includes('simvastatin') || components.includes('lovastatin')
          ? ['fda.atorvastatin.itraconazole_limit_20mg']
          : ['fda.finerenone.strong_cyp3a4_contraindicated', 'esc.hf.2026.mra_guidance_table_s8'];
    return {
      id: `med_review_strong_cyp3a4_stop_${drugId}`,
      module: colchicineCypContra
        ? 'gout'
        : components.includes('simvastatin') || components.includes('lovastatin')
          ? 'lipid'
          : 'hf',
      tier: 'Cảnh báo tương tác chống chỉ định',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG NGAY ${drugName} (Chống chỉ định phối hợp chất ức chế mạnh CYP3A4/P-gp)`,
      rationale: `${drugName} bị tăng vọt nồng độ huyết tương khi phối hợp với thuốc ức chế mạnh CYP3A4/P-gp (clarithromycin, ketoconazole, itraconazole, ritonavir, cyclosporine), gây độc tính nặng đe dọa tính mạng.`,
      gates: [
        {
          parameter: 'CYP3A4_contra',
          passed: false,
          action: 'contra',
          messageVi: 'Chống chỉ định phối hợp với thuốc ức chế mạnh CYP3A4/P-gp'
        }
      ],
      citationIds: cypCits,
      priority: 100
    };
  }

  // 2b3. Ivabradine + Diltiazem / Verapamil -> STOP Ivabradine
  if (
    components.includes('ivabradine') &&
    (currentMedIdsLower.has('diltiazem') || currentMedIdsLower.has('verapamil'))
  ) {
    return {
      id: `med_review_ivabradine_ndhp_ccb_stop_${drugId}`,
      module: 'hf',
      tier: 'Cảnh báo tương tác chống chỉ định',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG NGAY ${drugName} (Chống chỉ định phối hợp Ivabradine với Diltiazem / Verapamil)`,
      rationale:
        'Diltiazem và Verapamil ức chế CYP3A4 làm tăng nồng độ Ivabradine gấp 2–3 lần đồng thời cộng hưởng ức chế nút xoang gây nhịp chậm nặng. Chống chỉ định phối hợp.',
      gates: [
        {
          parameter: 'ivabradine_ndhp_ccb_contra',
          passed: false,
          action: 'contra',
          messageVi: 'Chống chỉ định phối hợp Ivabradine với Diltiazem / Verapamil'
        }
      ],
      citationIds: ['fda.ivabradine.verapamil_diltiazem_avoid'],
      priority: 99
    };
  }

  // 2c. Thuốc Class III chống chỉ định ở HFrEF / Suy tim
  const isNonDhpCcb =
    drugClasses.has('ndhp_ccb') || components.some((c) => ['diltiazem', 'verapamil'].includes(c));
  const isTzd =
    drugClasses.has('tzd') || components.some((c) => ['pioglitazone', 'rosiglitazone'].includes(c));
  const isClassIcOrDronedarone = components.some((c) =>
    ['flecainide', 'propafenone', 'dronedarone'].includes(c)
  );

  if (hasHfReduced && isNonDhpCcb) {
    return {
      id: `med_review_hfref_ndhp_ccb_stop_${drugId}`,
      module: 'hf',
      tier: 'Chống chỉ định trong suy tim HFrEF',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG NGAY ${drugName} (Chống chỉ định Class III ở suy tim HFrEF)`,
      rationale: `${drugName} ức chế co bóp cơ tim mạnh (inotropic âm tính), làm nặng tình trạng suy tim và tăng nhập viện/tử vong ở HFrEF. Nếu cần kiểm soát huyết áp hoặc đau thắt ngực, chuyển sang Amlodipine hoặc Felodipine.`,
      gates: [{ parameter: 'HFrEF', passed: false, action: 'contra', messageVi: 'Chống chỉ định CCB Non-DHP ở HFrEF' }],
      citationIds: ['esc.hf.2026.non_dhp_ccb_contraindicated', 'esc.af.2024.non_dhp_ccb_contra_lvef40'],
      priority: 99
    };
  }

  if (hasHfReduced && isClassIcOrDronedarone) {
    const cits = components.includes('dronedarone')
      ? ['acc.af.2023.dronedarone_hf_contra', 'esc.af.2024.aad_dronedarone_rec']
      : ['esc.af.2024.aad_flecainide_propafenone', 'esc.af.2024.table13_flecainide'];
    return {
      id: `med_review_hfref_aad_stop_${drugId}`,
      module: 'hf',
      tier: 'Chống chỉ định trong suy tim HFrEF',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG NGAY ${drugName} (Chống chỉ định ở suy tim HFrEF - tăng tử vong)`,
      rationale: `${drugName} làm tăng tỷ lệ loạn nhịp thất ác tính, suy tim mất bù và tử vong ở bệnh nhân suy tim phân suất tống máu giảm (HFrEF). Bắt buộc ngừng thuốc.`,
      gates: [{ parameter: 'HFrEF', passed: false, action: 'contra', messageVi: `Chống chỉ định ${drugName} ở HFrEF` }],
      citationIds: cits,
      priority: 99
    };
  }

  if (hasHfAny && isTzd) {
    return {
      id: `med_review_hf_tzd_stop_${drugId}`,
      module: 'hf',
      tier: 'Chống chỉ định trong suy tim',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG NGAY ${drugName} (Chống chỉ định ở suy tim - giữ muối nước)`,
      rationale: `Nhóm Thiazolidinedione trong ${drugName} gây giữ muối nước tiến triển và làm tăng nguy cơ đợt cấp suy tim mất bù phải nhập viện. Chống chỉ định ở bệnh nhân suy tim.`,
      gates: [{ parameter: 'heart_failure', passed: false, action: 'contra', messageVi: 'Chống chỉ định TZD ở suy tim' }],
      citationIds: ['fda.pioglitazone.heart_failure_contra', 'fda.pioglitazone.heart_failure_risk'],
      priority: 99
    };
  }

  if (hasHfAny && components.includes('saxagliptin')) {
    return {
      id: fdc ? `med_review_hf_saxagliptin_stop_${drugId}` : 'med_review_hf_saxagliptin_stop',
      module: 'hf',
      tier: 'Chống chỉ định trong suy tim',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG ${drugName} (Chứa Saxagliptin làm tăng nhập viện vì suy tim - SAVOR-TIMI 53)`,
      rationale: `Saxagliptin làm tăng có ý nghĩa thống kê tỷ lệ nhập viện vì suy tim (thử nghiệm SAVOR-TIMI 53). Bắt buộc ngừng ${drugName} ở bệnh nhân suy tim và ưu tiên SGLT2i hoặc GLP-1 RA.`,
      gates: [{ parameter: 'heart_failure', passed: false, action: 'contra', messageVi: 'Tránh / Ngừng Saxagliptin ở bệnh nhân suy tim' }],
      citationIds: ['ada.dm2.2026.saxagliptin_heart_failure'],
      priority: 99
    };
  }

  if (hasHfAny && isNsaid) {
    return {
      id: `med_review_hf_nsaid_stop_${drugId}`,
      module: 'hf',
      tier: 'Chống chỉ định trong suy tim',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG NGAY ${drugName} (Chống chỉ định NSAID ở suy tim)`,
      rationale: `NSAID (${drugName}) gây giữ muối nước, làm mất tác dụng thuốc lợi tiểu và ức chế hệ RAA, thúc đẩy suy tim mất bù cấp và tổn thương thận cấp. Bắt buộc ngừng NSAID.`,
      gates: [{ parameter: 'heart_failure', passed: false, action: 'contra', messageVi: 'Chống chỉ định NSAID ở suy tim' }],
      citationIds: ['fda.entresto.nsaid_triple_whammy', 'kdigo.ckd.2024.nsaid_nephrotoxicity_p132'],
      priority: 99
    };
  }

  // 2d. Ivabradine ở bệnh nhân Rung nhĩ -> STOP
  if (components.includes('ivabradine') && hasAf) {
    return {
      id: 'med_review_af_ivabradine_stop',
      module: 'hf',
      tier: 'An toàn dẫn truyền & nhịp tim',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG ${drugName} (Không hiệu quả và chống chỉ định ở Rung nhĩ)`,
      rationale:
        'Ivabradine ức chế chọn lọc kênh If tại nút xoang nên hoàn toàn không kiểm soát được tần số thất trong rung nhĩ và còn làm tăng nguy cơ rung nhĩ. Cần ngừng Ivabradine.',
      gates: [{ parameter: 'rhythm', passed: false, action: 'contra', messageVi: 'Ivabradine chỉ có tác dụng khi nhịp xoang' }],
      citationIds: ['esc.hf.2026.ivabradine_rec'],
      priority: 98
    };
  }

  // 2e. Chẹn beta không chọn lọc đường toàn thân ở Hen phế quản -> STOP
  const isNonSelectiveBb =
    !isOphthalmicBb &&
    (drugClasses.has('bb_nonselective') ||
      components.some((c) =>
        ['carvedilol', 'propranolol', 'nadolol', 'timolol', 'sotalol', 'labetalol', 'pindolol'].includes(c)
      ));
  if (hasAsthma && isNonSelectiveBb) {
    return {
      id: `med_review_asthma_nonselective_bb_stop_${drugId}`,
      module: 'asthma',
      tier: 'An toàn đường thở & hen phế quản',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG / CHUYỂN ĐỔI ${drugName} (Chống chỉ định chẹn beta không chọn lọc ở Hen phế quản)`,
      rationale: `${drugName} ức chế thụ thể beta-2 phế quản gây co thắt phế quản cấp tính nguy hiểm ở bệnh nhân hen. Cần ngừng ngay; nếu có chỉ định bắt buộc về suy tim/mạch vành, chuyển sang chẹn beta chọn lọc beta-1 (Bisoprolol hoặc Metoprolol succinate) liều thấp dưới sự giám sát chặt chẽ.`,
      gates: [{ parameter: 'asthma', passed: false, action: 'contra', messageVi: 'Chống chỉ định chẹn beta không chọn lọc ở hen phế quản' }],
      citationIds: ['fda.carvedilol.contraindication_asthma', 'gina.asthma.2026.beta_blocker_bronchospasm'],
      priority: 99
    };
  }

  // 2e2. ASTHMA-R3-R3-02: NSAID ức chế COX-1 / Aspirin ở bệnh nhân AERD -> STOP
  if (hasAerd && isCox1NsaidOrSalicylate(drugId, resolvedKbId, drugClasses)) {
    return {
      id: `med_review_aerd_nsaid_stop_${drugId}`,
      module: inferReviewModule(patient, resolvedKbId, drugClasses, 'aerd'),
      tier: 'An toàn đường thở & cơ địa AERD',
      tierOrder: 0,
      action: 'STOP',
      drugId,
      drugNameVi: drugName,
      title: `NGỪNG NGAY ${drugName} (Chống chỉ định NSAID ức chế COX-1 / Aspirin ở bệnh nhân AERD)`,
      rationale: `Bệnh nhân mắc bệnh hô hấp kịch phát do aspirin/NSAID (AERD / tam chứng Samter): ${drugName} ức chế COX-1 làm chuyển hướng arachidonic acid sang leukotriene cysteinyl, khởi phát co thắt phế quản cấp đe dọa tính mạng. Bắt buộc ngừng ngay (GINA 2026).`,
      gates: [
        {
          parameter: 'AERD_COX1_NSAID',
          passed: false,
          action: 'contra',
          messageVi: 'Chống chỉ định tuyệt đối aspirin và NSAID ức chế COX-1 ở bệnh nhân AERD'
        }
      ],
      citationIds: ['gina.asthma.2026.aerd_avoid_nsaid'],
      priority: 99
    };
  }

  return null;
}
