/**
 * GDMT-VN Clinical Progress Note Generator
 * Phân quyền: Agent B
 *
 * Sinh văn bản tóm tắt kế hoạch điều trị theo định dạng bệnh án / hồ sơ bệnh án điện tử (EMR/HIS) tiếng Việt.
 * R3-HF-20: Hiển thị đầy đủ LVEF & NYHA (nếu có) và TUYỆT ĐỐI không tự ghi `(xoang)` khi `patient.rhythm === undefined`.
 */

import type { Patient, Derived, Plan, Settings, Action } from './types';
import {
  crUmolLToMgDl,
  glucoseMmolLToMgDl,
  cholMmolLToMgDl,
  tgMmolLToMgDl,
  uratUmolLToMgDl,
  uacrMgMmolToMgG,
  hba1cPercentToMmolMol
} from './units';
import { getNormalizedDrugClasses, resolveKbDrugId } from './safety/drugClassify';

const ACTION_LABELS: Record<Action, string> = {
  START: 'BẮT ĐẦU KHỞI TRỊ',
  UPTITRATE: 'TĂNG LIỀU / CHUẨN ĐỘ',
  CONTINUE: 'DUY TRÌ',
  REDUCE: 'GIẢM LIỀU',
  SWITCH: 'CHUYỂN ĐỔI THUỐC',
  HOLD: 'TẠM HOÃN / TẠM NGƯNG',
  STOP: 'NGỪNG THUỐC',
  AVOID: 'CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG',
  CONSIDER: 'CÂN NHẮC CHỈ ĐỊNH',
  DEFER: 'TRÌ HOÃN ĐỢI ĐÁNH GIÁ LẠI',
  MONITOR: 'THEO DÕI ĐỊNH KỲ',
  REFER: 'CHUYỂN KHÁM CHUYÊN KHOA'
};

const RHYTHM_LABELS: Record<string, string> = {
  sinus: 'nhịp xoang',
  afib: 'rung nhĩ',
  af: 'rung nhĩ',
  flutter: 'cuồng nhĩ',
  other: 'nhịp khác'
};

export function generateClinicalNote(
  patient: Patient,
  derived: Derived,
  plan: Plan,
  settings: Settings
): string {
  const dateStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const lines: string[] = [];

  lines.push(`=== TÓM TẮT KẾ HOẠCH ĐIỀU TRỊ GDMT-VN (${dateStr}) ===`);
  lines.push(`Bối cảnh: ${settings.setting === 'outpatient' ? 'Ngoại trú' : 'Nội viện'} | Phác đồ tham chiếu: ${settings.profile}`);
  lines.push('');

  // 1. Thông tin bệnh nhân & sinh hiệu
  lines.push('1. THÔNG TIN BỆNH NHÂN & SINH HIỆU:');
  const ptInfo: string[] = [];
  if (patient.age !== undefined) ptInfo.push(`Tuổi: ${patient.age}`);
  if (patient.sex) ptInfo.push(`Giới: ${patient.sex === 'male' ? 'Nam' : 'Nữ'}`);
  if (patient.weight !== undefined) ptInfo.push(`Cân nặng: ${patient.weight} kg`);
  if (patient.height !== undefined) ptInfo.push(`Chiều cao: ${patient.height} cm`);
  if (derived.bmi !== undefined) ptInfo.push(`BMI: ${derived.bmi.toFixed(1)} kg/m²`);
  if (ptInfo.length > 0) lines.push(ptInfo.join(' | '));

  const vitalInfo: string[] = [];
  if (patient.sbp !== undefined && patient.dbp !== undefined) {
    vitalInfo.push(`Huyết áp: ${patient.sbp}/${patient.dbp} mmHg`);
  } else if (patient.sbp !== undefined) {
    vitalInfo.push(`Huyết áp tâm thu: ${patient.sbp} mmHg`);
  }

  if (patient.hr !== undefined) {
    const rhythmPart = patient.rhythm
      ? ` (${RHYTHM_LABELS[patient.rhythm] || patient.rhythm})`
      : '';
    vitalInfo.push(`Nhịp tim: ${patient.hr} bpm${rhythmPart}`);
  } else if (patient.rhythm) {
    vitalInfo.push(`Nhịp tim: ${RHYTHM_LABELS[patient.rhythm] || patient.rhythm}`);
  }

  if (patient.lvef !== undefined) {
    const hfPhenoPart = derived.hfPhenotype ? ` (${derived.hfPhenotype})` : '';
    vitalInfo.push(`LVEF: ${patient.lvef}%${hfPhenoPart}`);
  }

  const nyhaVal = patient.nyha ?? (patient.customInputs?.nyha as number | string | undefined);
  if (nyhaVal !== undefined && nyhaVal !== '') {
    vitalInfo.push(`NYHA: ${nyhaVal}`);
  }

  const patExtra = patient as unknown as Record<string, unknown>;
  const spo2Val =
    (patExtra.spo2 as number | string | undefined) ??
    (patient.customInputs?.restingSpo2 as number | string | undefined) ??
    (patient.customInputs?.spo2 as number | string | undefined);
  if (spo2Val !== undefined && spo2Val !== '') {
    vitalInfo.push(`SpO₂: ${spo2Val}%`);
  }

  const rrVal =
    (patExtra.respiratoryRate as number | string | undefined) ??
    (patient.customInputs?.respiratoryRate as number | string | undefined);
  if (rrVal !== undefined && rrVal !== '') {
    vitalInfo.push(`Nhịp thở: ${rrVal} lần/phút`);
  }

  if (vitalInfo.length > 0) lines.push(vitalInfo.join(' | '));

  // 2. Xét nghiệm & Chỉ số tính toán (tôn trọng hệ đơn vị settings.units đang chọn)
  const u = settings?.units;
  const labInfo: string[] = [];
  if (patient.scr !== undefined) {
    labInfo.push(
      `Creatinin: ${u?.cr === 'mg_dL' ? `${crUmolLToMgDl(patient.scr)} mg/dL` : `${patient.scr} µmol/L`}`
    );
  }
  if (derived.egfr !== undefined || derived.egfrCr !== undefined) {
    const egfrVal = derived.egfr ?? derived.egfrCr;
    labInfo.push(`eGFR: ${egfrVal?.toFixed(0)} mL/min/1.73m²${derived.kdigoG ? ` (${derived.kdigoG})` : ''}`);
  }
  if (patient.k !== undefined) labInfo.push(`K⁺: ${patient.k} mmol/L`);
  if (patient.na !== undefined) labInfo.push(`Na⁺: ${patient.na} mmol/L`);
  if (patient.glucose !== undefined) {
    labInfo.push(
      `Glucose: ${u?.glucose === 'mg_dL' ? `${glucoseMmolLToMgDl(patient.glucose)} mg/dL` : `${patient.glucose} mmol/L`}`
    );
  }
  if (patient.hba1c !== undefined) {
    labInfo.push(
      `HbA1c: ${u?.hba1c === 'mmol_mol' ? `${hba1cPercentToMmolMol(patient.hba1c)} mmol/mol` : `${patient.hba1c}%`}`
    );
  }
  if (patient.uacr !== undefined) {
    const uacrStr =
      u?.uacr === 'mg_g' ? `${uacrMgMmolToMgG(patient.uacr)} mg/g` : `${patient.uacr} mg/mmol`;
    labInfo.push(`UACR: ${uacrStr}${derived.kdigoA ? ` (${derived.kdigoA})` : ''}`);
  }
  if (patient.tc !== undefined) {
    labInfo.push(`TC: ${u?.lipid === 'mg_dL' ? `${cholMmolLToMgDl(patient.tc)} mg/dL` : `${patient.tc} mmol/L`}`);
  }
  if (patient.ldl !== undefined) {
    labInfo.push(`LDL-C: ${u?.lipid === 'mg_dL' ? `${cholMmolLToMgDl(patient.ldl)} mg/dL` : `${patient.ldl} mmol/L`}`);
  }
  if (patient.hdl !== undefined) {
    labInfo.push(`HDL-C: ${u?.lipid === 'mg_dL' ? `${cholMmolLToMgDl(patient.hdl)} mg/dL` : `${patient.hdl} mmol/L`}`);
  }
  if (patient.tg !== undefined) {
    labInfo.push(`TG: ${u?.lipid === 'mg_dL' ? `${tgMmolLToMgDl(patient.tg)} mg/dL` : `${patient.tg} mmol/L`}`);
  }

  const rawNonHdl = patient.nonHdl ?? patient.customInputs?.nonHdl;
  if (rawNonHdl !== undefined && rawNonHdl !== '') {
    const nVal = Number(rawNonHdl);
    if (Number.isFinite(nVal)) {
      labInfo.push(
        `Non-HDL-C: ${u?.lipid === 'mg_dL' ? `${cholMmolLToMgDl(nVal)} mg/dL` : `${rawNonHdl} mmol/L`}`
      );
    }
  } else if (patient.tc !== undefined && patient.hdl !== undefined) {
    const calcNonHdl = Number((patient.tc - patient.hdl).toFixed(2));
    if (calcNonHdl > 0) {
      labInfo.push(
        `Non-HDL-C: ${u?.lipid === 'mg_dL' ? `${cholMmolLToMgDl(calcNonHdl)} mg/dL` : `${calcNonHdl} mmol/L`}`
      );
    }
  }

  const apoBVal = patient.customInputs?.apob ?? patient.customInputs?.apoB;
  if (apoBVal !== undefined && apoBVal !== '') {
    const apoBStr = String(apoBVal).trim();
    const apoBHasUnit = /[a-zA-Z]/.test(apoBStr);
    labInfo.push(`ApoB: ${apoBStr}${apoBHasUnit ? '' : ' mg/dL'}`);
  }

  const lpaVal = patient.customInputs?.lpa ?? patient.customInputs?.lpA;
  if (lpaVal !== undefined && lpaVal !== '') {
    const lpaStr = String(lpaVal).trim();
    const lpaHasUnit = /[a-zA-Z]/.test(lpaStr);
    const lpaUnit =
      typeof patient.customInputs?.lpaUnit === 'string' && patient.customInputs.lpaUnit.trim()
        ? patient.customInputs.lpaUnit.trim()
        : 'mg/dL';
    labInfo.push(`Lp(a): ${lpaStr}${lpaHasUnit ? '' : ` ${lpaUnit}`}`);
  }

  const altVal = patient.customInputs?.alt;
  const altUlnVal = patient.customInputs?.altUlnTimes;
  if (altVal !== undefined && altVal !== '') {
    labInfo.push(`ALT: ${altVal} U/L${altUlnVal !== undefined && altUlnVal !== '' ? ` (${altUlnVal}x ULN)` : ''}`);
  } else if (altUlnVal !== undefined && altUlnVal !== '') {
    labInfo.push(`ALT: ${altUlnVal}x ULN`);
  }

  const ckVal = patient.customInputs?.ck;
  const ckUlnVal = patient.customInputs?.ckUlnTimes;
  if (ckVal !== undefined && ckVal !== '') {
    labInfo.push(`CK: ${ckVal} U/L${ckUlnVal !== undefined && ckUlnVal !== '' ? ` (${ckUlnVal}x ULN)` : ''}`);
  } else if (ckUlnVal !== undefined && ckUlnVal !== '') {
    labInfo.push(`CK: ${ckUlnVal}x ULN`);
  }

  if (patient.uricAcid !== undefined) {
    labInfo.push(
      `Acid uric: ${u?.urat === 'mg_dL' ? `${uratUmolLToMgDl(patient.uricAcid)} mg/dL` : `${patient.uricAcid} µmol/L`}`
    );
  }

  const qtcVal = patient.qtc ?? (patient.customInputs?.qtc as number | string | undefined);
  if (qtcVal !== undefined && qtcVal !== '') {
    labInfo.push(`QTc: ${qtcVal} ms`);
  }

  const rawFev1Fvc = patient.customInputs?.fev1FvcRatio;
  const fev1FvcVal =
    rawFev1Fvc !== undefined && rawFev1Fvc !== ''
      ? rawFev1Fvc
      : patient.fev1 && patient.fvc
        ? Number((patient.fev1 / patient.fvc).toFixed(2))
        : undefined;
  if (fev1FvcVal !== undefined) {
    labInfo.push(`FEV₁/FVC: ${fev1FvcVal}`);
  }

  const fev1PctVal =
    patient.fev1Pct ??
    (patient.customInputs?.fev1PredPct as number | string | undefined) ??
    (patient.customInputs?.fev1Pct as number | string | undefined);
  if (fev1PctVal !== undefined && fev1PctVal !== '') {
    const goldParts: string[] = [];
    if (derived.goldGrade) {
      goldParts.push(derived.goldGrade.startsWith('GOLD') ? derived.goldGrade : `GOLD ${derived.goldGrade}`);
    }
    if (derived.goldGroup) goldParts.push(`Group ${derived.goldGroup}`);
    const goldSuffix = goldParts.length > 0 ? ` (${goldParts.join(', ')})` : '';
    labInfo.push(`FEV₁: ${fev1PctVal}% dự đoán${goldSuffix}`);
  }

  const pefPctVal =
    (patExtra.pefPct as number | string | undefined) ??
    (patient.customInputs?.pefPct as number | string | undefined);
  if (pefPctVal !== undefined && pefPctVal !== '') {
    labInfo.push(`PEF: ${pefPctVal}%`);
  }

  const mmrcVal =
    patient.mmrc ??
    (patient.customInputs?.mmrc as number | string | undefined) ??
    (patient.customInputs?.mmrcScore as number | string | undefined);
  if (mmrcVal !== undefined && mmrcVal !== '') {
    labInfo.push(`mMRC: ${mmrcVal}`);
  }

  const catVal =
    patient.cat ??
    (patient.customInputs?.cat as number | string | undefined) ??
    (patient.customInputs?.catScore as number | string | undefined);
  if (catVal !== undefined && catVal !== '') {
    labInfo.push(`CAT: ${catVal}`);
  }

  const eosVal =
    patient.eos ??
    (patient.customInputs?.eos as number | string | undefined) ??
    (patient.customInputs?.bloodEos as number | string | undefined) ??
    (patient.customInputs?.bloodEosinophils as number | string | undefined);
  if (eosVal !== undefined && eosVal !== '') {
    labInfo.push(`Eosinophils: ${eosVal} tế bào/µL`);
  }

  const phVal = patient.customInputs?.abgPh ?? patient.customInputs?.ph;
  if (phVal !== undefined && phVal !== '') {
    labInfo.push(`pH: ${phVal}`);
  }

  const paco2Val = patient.customInputs?.abgPaco2 ?? patient.customInputs?.paco2;
  if (paco2Val !== undefined && paco2Val !== '') {
    labInfo.push(`PaCO₂: ${paco2Val} mmHg`);
  }

  const hco3Val =
    patient.hco3 ??
    (patient.customInputs?.serumBicarb as number | string | undefined) ??
    (patient.customInputs?.hco3 as number | string | undefined);
  if (hco3Val !== undefined && hco3Val !== '') {
    labInfo.push(`HCO₃⁻: ${hco3Val} mmol/L`);
  }

  if (labInfo.length > 0) {
    lines.push('');
    lines.push('2. CẬN LÂM SÀNG CHÍNH:');
    lines.push(labInfo.join(' | '));
  }

  // 3. Cảnh báo an toàn & Tương tác
  if (plan.alerts.length > 0) {
    lines.push('');
    lines.push('3. CẢNH BÁO AN TOÀN & TƯƠNG TÁC THUỐC:');
    for (const alert of plan.alerts) {
      lines.push(` [!] ${(alert.title || 'CẢNH BÁO').toUpperCase()}: ${alert.messageVi}`);
    }
  }

  // 4. Kế hoạch điều trị thuốc theo nhóm
  lines.push('');
  lines.push('4. PHÁC ĐỒ ĐIỀU TRỊ THEO MỤC TIÊU (GDMT):');
  if (plan.recommendations.length === 0) {
    lines.push('  (Chưa có khuyến cáo điều trị phù hợp với thông số hiện tại)');
  } else {
    const grouped = new Map<Action, typeof plan.recommendations>();
    for (const rec of plan.recommendations) {
      if (!grouped.has(rec.action)) {
        grouped.set(rec.action, []);
      }
      grouped.get(rec.action)!.push(rec);
    }

    const actionOrder: Action[] = [
      'START', 'UPTITRATE', 'CONTINUE', 'REDUCE', 'SWITCH',
      'HOLD', 'STOP', 'AVOID', 'CONSIDER', 'DEFER', 'MONITOR', 'REFER'
    ];

    for (const act of actionOrder) {
      const recs = grouped.get(act);
      if (!recs || recs.length === 0) continue;

      lines.push(`  * ${ACTION_LABELS[act]}:`);
      for (const r of recs) {
        const drugPart = r.drugNameVi || r.title;
        const dosePart = r.dose ? ` [Liều: ${r.dose}]` : '';
        const benefitPart = r.benefitsAlso && r.benefitsAlso.length > 0
          ? ` (Lợi ích kèm theo: ${r.benefitsAlso.map((m) => m.toUpperCase()).join(', ')})`
          : '';
        lines.push(`    - ${drugPart}${dosePart}: ${r.rationale}${benefitPart}`);
        if (r.warnings && r.warnings.length > 0) {
          for (const w of r.warnings) {
            lines.push(`      ⚠ Lưu ý: ${w}`);
          }
        }
      }
    }
  }

  // 5. Kế hoạch tái khám & theo dõi
  const activeMods = new Set<string>([
    ...(patient.selectedModules || []),
    ...(plan.summary?.activeModules || []),
    ...plan.recommendations.map((r) => r.module)
  ]);

  const RENAL_ELECTROLYTE_CLASSES = new Set([
    'acei', 'arb', 'arni', 'rasi', 'mra', 'mra_steroidal', 'mra_nonsteroidal',
    'sglt2i', 'loop_diuretic', 'thiazide_diuretic', 'k_sparing_diuretic', 'diuretic'
  ]);
  const hasRenalMed = [
    ...(patient.currentMeds || []).map((m) => m.drugId),
    ...plan.recommendations.map((r) => r.drugId)
  ].some((rawId) => {
    if (!rawId) return false;
    const classes = getNormalizedDrugClasses(resolveKbDrugId(rawId));
    for (const c of RENAL_ELECTROLYTE_CLASSES) {
      if (classes.has(c)) return true;
    }
    return false;
  });

  const hasCardioRenalMetabolicModule =
    activeMods.has('ckd') || activeMods.has('hf') || activeMods.has('htn') || activeMods.has('dm2');
  const hasRespModule = activeMods.has('copd') || activeMods.has('asthma');
  const isPureRespiratory =
    hasRespModule &&
    !hasCardioRenalMetabolicModule &&
    !activeMods.has('af') &&
    !activeMods.has('lipid') &&
    !activeMods.has('gout');

  lines.push('');
  lines.push('5. THEO DÕI & TÁI KHÁM:');
  if (hasRenalMed || hasCardioRenalMetabolicModule) {
    lines.push('- Đánh giá lại chức năng thận (Creatinin, eGFR) và Kali máu sau 2–4 tuần khi khởi trị hoặc chuẩn độ tăng liều thuốc nhóm RASi/ARNI/MRA.');
  }
  if (hasRespModule) {
    lines.push('- Tái khám đánh giá mức độ kiểm soát triệu chứng hô hấp, kiểm tra trực tiếp kỹ thuật sử dụng bình hít và mức độ tuân thủ điều trị.');
  }
  if (!isPureRespiratory || patient.sbp !== undefined || patient.hr !== undefined) {
    lines.push('- Hướng dẫn bệnh nhân theo dõi huyết áp và nhịp tim tại nhà.');
  }

  lines.push('');
  lines.push('---');
  lines.push('Khuyến cáo tự động sinh bởi GDMT-VN hỗ trợ quyết định lâm sàng. Bác sĩ điều trị chịu trách nhiệm toàn diện đối với y lệnh.');

  return lines.join('\n');
}
