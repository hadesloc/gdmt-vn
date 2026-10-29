/**
 * GDMT-VN Lipid Module - Cardiovascular Risk Stratification Matrix
 * Phân quyền: Agent I3
 */

import type { MatrixDefinition } from '../../engine/types';
import { thFor } from '../../kb-types';

export function buildLipidRiskMatrix(): MatrixDefinition {
  const atorvaHighMin = thFor('dose_mg', 'lipid.dose.atorva_high_start');
  const atorvaHighMax = thFor('dose_mg', 'lipid.dose.atorva_high_max');
  const atorvaModMin = thFor('dose_mg', 'lipid.dose.atorva_moderate_start');
  const atorvaModMax = thFor('dose_mg', 'lipid.dose.atorva_moderate_max');
  const rosuvaHighMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
  const rosuvaHighMax = thFor('dose_mg', 'lipid.dose.rosuva_high_max');
  const rosuvaStart = thFor('dose_mg', 'lipid.dose.rosuva_asian_start');
  const rosuvaModMax = thFor('dose_mg', 'lipid.dose.rosuva_moderate_max');
  const simvaMax = thFor('dose_mg', 'lipid.dose.simva_max');
  const simvaContra = thFor('dose_mg', 'lipid.dose.simva_contra_dose');
  const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
  const evoBiweekly = thFor('dose_mg', 'lipid.dose.evolocumab_biweekly');
  const evoMonthly = thFor('dose_mg', 'lipid.dose.evolocumab_monthly');
  const inclisiranDose = thFor('dose_mg', 'lipid.dose.inclisiran_standard');
  const bempDose = thFor('dose_mg', 'lipid.dose.bempedoic_standard');
  const icosapentDaily = thFor('dose_g', 'lipid.dose.icosapent_daily');
  const fenoStart = thFor('dose_mg', 'lipid.dose.fenofibrate_start_145');
  const fenoMax = thFor('dose_mg', 'lipid.dose.fenofibrate_standard');

  const vhLdl = thFor('ldl', 'lipid.target.very_high_ldl');
  const recLdl = thFor('ldl', 'lipid.target.recurrent_acs_ldl');
  const highLdl = thFor('ldl', 'lipid.target.high_ldl');
  const modLdl = thFor('ldl', 'lipid.target.moderate_ldl');
  const lowLdl = thFor('ldl', 'lipid.target.low_ldl');
  const tgPanc = thFor('tg', 'lipid.tg.pancreatitis_risk');
  const tgRes = thFor('tg', 'lipid.tg.residual_risk_min');
  const minPct = thFor('ldl_reduction_pct', 'lipid.target.percent_reduction_min');

  return {
    title: 'Ma trận lựa chọn thuốc hạ lipid máu theo phân tầng nguy cơ tim mạch (ESC/EAS 2019–2025 & ACC/AHA 2026)',
    columns: [
      {
        id: 'very_high',
        label: 'Rất cao / Cực cao',
        subLabel: `LDL-C < ${vhLdl.toFixed(1)} (hoặc < ${recLdl.toFixed(1)}) mmol/L & giảm ≥ ${minPct}%`
      },
      {
        id: 'high',
        label: 'Nguy cơ cao',
        subLabel: `LDL-C < ${highLdl.toFixed(1)} mmol/L & giảm ≥ ${minPct}%`
      },
      {
        id: 'moderate',
        label: 'Nguy cơ trung bình',
        subLabel: `LDL-C < ${modLdl.toFixed(1)} mmol/L`
      },
      {
        id: 'low',
        label: 'Nguy cơ thấp',
        subLabel: `LDL-C < ${lowLdl.toFixed(1)} mmol/L`
      }
    ],
    rows: [
      {
        drugId: 'atorvastatin',
        nameVi: 'Atorvastatin (Statin cường độ cao / trung bình)',
        cells: {
          very_high: {
            initiate: 'rec',
            continue: 'rec',
            dose: `${atorvaHighMin}–${atorvaHighMax} mg/ngày`,
            note: 'Thuốc nền tảng bước 1 (ưu tiên ở cả suy thận nặng)',
            citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'acc.lipid.2026.statin_doses']
          },
          high: {
            initiate: 'rec',
            continue: 'rec',
            dose: `${atorvaHighMin}–${atorvaHighMax} mg/ngày`,
            note: `Hạ ≥ ${minPct}% LDL-C để đạt mục tiêu kép`,
            citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'acc.lipid.2026.statin_doses']
          },
          moderate: {
            initiate: 'caution',
            continue: 'ok',
            dose: `${atorvaModMin}–${atorvaModMax} mg/ngày`,
            note: 'Cân nhắc khi thay đổi lối sống chưa đạt đích',
            citationIds: ['esc.lipid.2019.target_moderate', 'acc.lipid.2026.statin_doses']
          },
          low: {
            initiate: 'caution',
            continue: 'ok',
            dose: `${atorvaModMin} mg/ngày`,
            note: 'Ưu tiên can thiệp lối sống trước',
            citationIds: ['esc.lipid.2019.target_low', 'acc.lipid.2026.statin_doses']
          }
        }
      },
      {
        drugId: 'rosuvastatin',
        nameVi: 'Rosuvastatin (Statin cường độ cao / trung bình)',
        cells: {
          very_high: {
            initiate: 'rec',
            continue: 'rec',
            dose: `${rosuvaHighMin}–${rosuvaHighMax} mg/ngày`,
            note: `Người châu Á tăng gấp ~2 lần AUC: ưu tiên ${rosuvaHighMin} mg + Ezetimibe`,
            citationIds: [
              'esc.lipid.2019.statin_high_dose_rec',
              'acc.lipid.2026.statin_doses',
              'fda.rosuvastatin.asian_dose'
            ]
          },
          high: {
            initiate: 'rec',
            continue: 'rec',
            dose: `${rosuvaHighMin}–${rosuvaHighMax} mg/ngày`,
            note: 'Không qua CYP3A4; giới hạn liều ở CKD nặng hoặc dùng Ticagrelor',
            citationIds: [
              'acc.lipid.2026.statin_doses',
              'fda.rosuvastatin.renal_impairment',
              'fda.rosuvastatin.ticagrelor_limit_20mg'
            ]
          },
          moderate: {
            initiate: 'caution',
            continue: 'ok',
            dose: `${rosuvaStart}–${rosuvaModMax} mg/ngày`,
            note: `Khởi đầu ${rosuvaStart} mg/ngày ở bệnh nhân châu Á`,
            citationIds: ['fda.rosuvastatin.asian_dose', 'acc.lipid.2026.statin_doses']
          },
          low: {
            initiate: 'caution',
            continue: 'ok',
            dose: `${rosuvaStart} mg/ngày`,
            note: 'Chỉ cân nhắc khi LDL-C tăng cao kéo dài dù đã thay đổi lối sống',
            citationIds: ['esc.lipid.2019.target_low', 'fda.rosuvastatin.asian_dose']
          }
        }
      },
      {
        drugId: 'simvastatin',
        nameVi: 'Simvastatin (Statin cường độ trung bình)',
        cells: {
          very_high: {
            initiate: 'not_rec',
            continue: 'caution',
            dose: `≤ ${simvaMax} mg/ngày (ưu tiên chuyển đổi)`,
            note: `Chống chỉ định ${simvaContra} mg/ngày do tiêu cơ vân; chuyển sang Atorva/Rosuva`,
            citationIds: ['acc.lipid.2026.simva_contra_80mg', 'acc.lipid.2026.simvastatin_dose']
          },
          high: {
            initiate: 'not_rec',
            continue: 'caution',
            dose: `≤ ${simvaMax} mg/ngày`,
            note: 'Giới hạn liều chặt với Diltiazem/Verapamil/Amlodipine/Amiodarone',
            citationIds: ['acc.lipid.2026.simva_contra_80mg', 'fda.diltiazem.simvastatin_limit_10mg']
          },
          moderate: {
            initiate: 'ok',
            continue: 'ok',
            dose: `${atorvaModMax}–${simvaMax} mg/ngày (uống buổi tối)`,
            note: 'Có thể dùng ở nguy cơ trung bình không có tương tác CYP3A4',
            citationIds: ['acc.lipid.2026.simvastatin_dose']
          },
          low: {
            initiate: 'caution',
            continue: 'ok',
            dose: `${atorvaModMin}–${atorvaModMax} mg/ngày`,
            note: 'Chỉ dùng khi thất bại thay đổi lối sống',
            citationIds: ['esc.lipid.2019.target_low', 'acc.lipid.2026.simvastatin_dose']
          }
        }
      },
      {
        drugId: 'ezetimibe',
        nameVi: 'Ezetimibe (Ức chế hấp thu cholesterol NPC1L1)',
        cells: {
          very_high: {
            initiate: 'rec',
            continue: 'rec',
            dose: `${ezeDose} mg 1 lần/ngày`,
            note: 'Phối hợp Bước 2 hoặc phối hợp sớm ngay từ đầu khi khoảng cách đích xa',
            citationIds: ['esc.lipid.2019.ezetimibe_add_on', 'esc.lipid.2025.acs_naive_combination']
          },
          high: {
            initiate: 'rec',
            continue: 'rec',
            dose: `${ezeDose} mg 1 lần/ngày`,
            note: 'Bổ sung khi Statin tối đa dung nạp chưa đạt đích hoặc không dung nạp statin',
            citationIds: ['esc.lipid.2019.ezetimibe_add_on', 'acc.lipid.2026.ezetimibe_outpatient_addon']
          },
          moderate: {
            initiate: 'caution',
            continue: 'ok',
            dose: `${ezeDose} mg 1 lần/ngày`,
            note: 'Cân nhắc khi không dung nạp statin hoặc đơn trị statin chưa đạt đích',
            citationIds: ['esc.lipid.2019.ezetimibe_add_on']
          },
          low: {
            initiate: 'not_rec',
            continue: 'caution',
            note: 'Không chỉ định đầu tay ở nhóm nguy cơ thấp',
            citationIds: ['esc.lipid.2019.target_low']
          }
        }
      },
      {
        drugId: 'evolocumab',
        nameVi: 'Evolocumab / Alirocumab / Inclisiran (Ức chế PCSK9)',
        cells: {
          very_high: {
            initiate: 'rec',
            continue: 'rec',
            dose: `Evolocumab ${evoBiweekly} mg/2 tuần (${evoMonthly} mg/tháng); Inclisiran ${inclisiranDose} mg`,
            note: 'Bước 3 khi Statin tối đa + Ezetimibe chưa đạt mục tiêu (Class I ở ASCVD/FH)',
            citationIds: ['esc.lipid.2019.pcsk9_add_on_secondary', 'fda.evolocumab.dose']
          },
          high: {
            initiate: 'caution',
            continue: 'ok',
            dose: `Evolocumab ${evoBiweekly} mg/2 tuần`,
            note: 'Chỉ định ở bệnh nhân FH nguy cơ cao hoặc không dung nạp statin chưa đạt đích',
            citationIds: ['esc.lipid.2019.pcsk9_fh_very_high', 'esc.lipid.2019.pcsk9_add_on_secondary']
          },
          moderate: {
            initiate: 'not_rec',
            continue: 'not_rec',
            note: 'Không có chỉ định thường quy ở nhóm nguy cơ trung bình',
            citationIds: ['esc.lipid.2019.pcsk9_add_on_secondary']
          },
          low: {
            initiate: 'not_rec',
            continue: 'not_rec',
            note: 'Không chỉ định ở nhóm nguy cơ thấp',
            citationIds: ['esc.lipid.2019.target_low']
          }
        }
      },
      {
        drugId: 'bempedoic_acid',
        nameVi: 'Bempedoic acid (Ức chế ACL)',
        cells: {
          very_high: {
            initiate: 'ok',
            continue: 'ok',
            dose: `${bempDose} mg 1 lần/ngày`,
            note: 'Class I ở không dung nạp statin; thận trọng gút, tăng acid uric và đứt gân',
            citationIds: [
              'esc.lipid.2025.bempedoic_statin_intolerance',
              'fda.bempedoic.dose',
              'fda.bempedoic.gout_risk'
            ]
          },
          high: {
            initiate: 'ok',
            continue: 'ok',
            dose: `${bempDose} mg 1 lần/ngày`,
            note: 'Phối hợp Ezetimibe khi không dung nạp statin hoặc bổ sung bậc 3 không kèm FH',
            citationIds: ['esc.lipid.2025.bempedoic_statin_intolerance', 'fda.bempedoic.dose']
          },
          moderate: {
            initiate: 'caution',
            continue: 'ok',
            dose: `${bempDose} mg 1 lần/ngày`,
            note: 'Chỉ cân nhắc ở một số ca chọn lọc không dung nạp statin',
            citationIds: ['fda.bempedoic.dose']
          },
          low: {
            initiate: 'not_rec',
            continue: 'not_rec',
            note: 'Chưa có lợi ích vượt trội nguy cơ ở nhóm nguy cơ thấp',
            citationIds: ['esc.lipid.2019.target_low']
          }
        }
      },
      {
        drugId: 'icosapent_ethyl',
        nameVi: 'Icosapent ethyl (EPA tinh khiết liều cao)',
        cells: {
          very_high: {
            initiate: 'caution',
            continue: 'ok',
            dose: `${icosapentDaily} g/ngày (chia 2 lần trong bữa ăn)`,
            note: `Cân nhắc khi TG ≥ ${tgRes.toFixed(1)} mmol/L trên nền Statin (ESC IIa-B / ACC COR 2b)`,
            citationIds: [
              'esc.lipid.2019.htg_icosapent_ethyl',
              'acc.lipid.2026.icosapent_cor2b',
              'acc.lipid.2026.icosapent_af_bleeding'
            ]
          },
          high: {
            initiate: 'caution',
            continue: 'ok',
            dose: `${icosapentDaily} g/ngày`,
            note: `Cân nhắc khi TG ${tgRes.toFixed(1)}–<${tgPanc.toFixed(1)} mmol/L dù đã dùng Statin`,
            citationIds: ['esc.lipid.2019.htg_icosapent_ethyl', 'acc.lipid.2026.icosapent_cor2b']
          },
          moderate: {
            initiate: 'not_rec',
            continue: 'not_rec',
            note: 'Chỉ dùng nhóm nguy cơ cao / rất cao theo REDUCE-IT',
            citationIds: ['esc.lipid.2019.htg_icosapent_ethyl']
          },
          low: {
            initiate: 'not_rec',
            continue: 'not_rec',
            note: 'Không chỉ định ở nguy cơ thấp',
            citationIds: ['esc.lipid.2019.target_low']
          }
        }
      },
      {
        drugId: 'fenofibrate',
        nameVi: 'Fenofibrate (Dẫn xuất acid fibric PPAR-alpha)',
        cells: {
          very_high: {
            initiate: 'caution',
            continue: 'caution',
            dose: `${fenoStart}–${fenoMax} mg/ngày (chỉnh theo thận)`,
            note: `Ưu tiên khi TG ≥ ${tgPanc.toFixed(1)} mmol/L phòng viêm tụy; tránh Gemfibrozil`,
            citationIds: [
              'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
              'acc.lipid.2026.fenofibrate_dose_range',
              'acc.lipid.2026.gemfibrozil_statin_contra'
            ]
          },
          high: {
            initiate: 'caution',
            continue: 'caution',
            dose: `${fenoStart}–${fenoMax} mg/ngày`,
            note: `Chỉ định chính dự phòng viêm tụy cấp khi TG ≥ ${tgPanc.toFixed(1)} mmol/L`,
            citationIds: [
              'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
              'byt.lipid.2020.fenofibrate_145_200'
            ]
          },
          moderate: {
            initiate: 'caution',
            continue: 'caution',
            dose: `${fenoStart}–${fenoMax} mg/ngày`,
            note: `Dùng khi tăng TG nặng ≥ ${tgPanc.toFixed(1)} mmol/L và eGFR cho phép`,
            citationIds: [
              'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
              'acc.lipid.2026.fenofibrate_dose_range',
              'acc.lipid.2026.fenofibrate_renal'
            ]
          },
          low: {
            initiate: 'caution',
            continue: 'caution',
            dose: `${fenoStart}–${fenoMax} mg/ngày`,
            note: `Chỉ dùng khi TG rất cao ≥ ${tgPanc.toFixed(1)} mmol/L gây nguy cơ viêm tụy cấp`,
            citationIds: [
              'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
              'acc.lipid.2026.fenofibrate_dose_range'
            ]
          }
        }
      }
    ]
  };
}

export const lipidRiskMatrix: MatrixDefinition = buildLipidRiskMatrix();
