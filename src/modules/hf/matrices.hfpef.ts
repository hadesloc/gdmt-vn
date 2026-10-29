import type { MatrixDefinition } from '../../engine/types';
import { dose, thFor } from '../../kb-types/access';
import { formatHfDose } from './helpers';
import { egfrColumns } from './matrices.hfref';

const dapaStart = formatHfDose(dose('dapagliflozin', 'start'));
const spiroStart = formatHfDose(dose('spironolactone', 'start'));
const spiroTarget = formatHfDose(dose('spironolactone', 'target'));
const spiroLowMg = thFor('dose_mg', 'hf.mra.spironolactone_low_start_dose_mg');
const spiroAltMg = thFor('dose_mg', 'hf.mra.spironolactone_g3_alt_day_dose_mg');
const furoStart = formatHfDose(dose('furosemide', 'start'));
const furoMax = thFor('dose_mg', 'hf.acute.furosemide_iv_max_mg');
const finLowMg = thFor('dose_mg', 'hf.finerenone.start_low_dose_mg');
const finMidMg = thFor('dose_mg', 'hf.finerenone.start_high_or_target_low_dose_mg');
const finHighMg = thFor('dose_mg', 'hf.finerenone.target_high_dose_mg');
const sglt2Min = thFor('egfr', 'hf.sglt2i.egfr_initiate_min');
const sglt2Cits = ['esc.hf.2026.sglt2i_doses_table11', 'esc.hf.2026.sglt2i_all_lvef', 'esc.hf.2026.sglt2i_table_s9'];

export const hfMatrixHFpEF: MatrixDefinition = {
  title: 'Ma trận an toàn thuốc theo chức năng thận ở HFpEF (và HFmrEF theo US/BYT)',
  columns: egfrColumns,
  rows: [
    {
      drugId: 'dapagliflozin',
      nameVi: 'Dapagliflozin / Empagliflozin (SGLT2i - Class I)',
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `${dapaStart}`, citationIds: sglt2Cits },
        g2: { initiate: 'rec', continue: 'rec', dose: `${dapaStart}`, citationIds: sglt2Cits },
        g3a: { initiate: 'rec', continue: 'rec', dose: `${dapaStart}`, citationIds: sglt2Cits },
        g3b: { initiate: 'rec', continue: 'rec', dose: `${dapaStart}`, citationIds: sglt2Cits },
        g4: {
          initiate: 'rec', continue: 'rec', dose: `${dapaStart}`,
          note: `eGFR từ ${sglt2Min}–29: Khuyến cáo khởi trị; eGFR 15–19: Không khởi trị mới, chỉ duy trì nếu đang dùng`,
          citationIds: ['fda.hf.dapagliflozin_egfr25', ...sglt2Cits],
        },
        g5: { initiate: 'not_rec', continue: 'ok', citationIds: ['esc.hf.2026.sglt2i_table_s9'] },
        dialysis: { initiate: 'not_rec', continue: 'not_rec', citationIds: ['esc.hf.2026.sglt2i_table_s9'] },
        aki: { initiate: 'not_rec', continue: 'not_rec', citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k', 'esc.hf.2026.sglt2i_table_s9'] },
      },
    },
    {
      drugId: 'finerenone',
      nameVi: 'Finerenone (nsMRA - Class I ESC 2026 / Class 2a ACC 2026)',
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `${finMidMg} mg/ngày (đích ${finHighMg} mg/ngày)`, citationIds: ['esc.hf.2026.table_11_finerenone_doses', 'esc.hf.2026.finerenone_doses_footnote_g'] },
        g2: { initiate: 'rec', continue: 'rec', dose: `${finMidMg} mg/ngày (đích ${finHighMg} mg/ngày)`, citationIds: ['esc.hf.2026.table_11_finerenone_doses', 'esc.hf.2026.finerenone_doses_footnote_g'] },
        g3a: { initiate: 'rec', continue: 'rec', dose: `${finLowMg} mg/ngày (đích ${finMidMg} mg/ngày)`, citationIds: ['esc.hf.2026.table_11_finerenone_doses', 'esc.hf.2026.finerenone_doses_footnote_g'] },
        g3b: { initiate: 'rec', continue: 'rec', dose: `${finLowMg} mg/ngày (đích ${finMidMg} mg/ngày)`, citationIds: ['esc.hf.2026.table_11_finerenone_doses', 'esc.hf.2026.finerenone_doses_footnote_g'] },
        g4: {
          initiate: 'caution', continue: 'ok', dose: `${finLowMg} mg/ngày (khi eGFR từ ${thFor('egfr', 'hf.finerenone.egfr_min_initiate')})`,
          note: `Khởi trị khi eGFR từ ${thFor('egfr', 'hf.finerenone.egfr_min_initiate')}; ngưng nếu giảm dưới ${thFor('egfr', 'hf.finerenone.egfr_stop_min')}`,
          citationIds: ['esc.hf.2026.table_11_finerenone_doses', 'esc.hf.2026.mra_guidance_table_s8'],
        },
        g5: { initiate: 'contra', continue: 'contra', citationIds: ['esc.hf.2026.mra_guidance_table_s8'] },
        dialysis: { initiate: 'contra', continue: 'contra', citationIds: ['esc.hf.2026.mra_guidance_table_s8'] },
        aki: { initiate: 'contra', continue: 'contra', citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k', 'esc.hf.2026.mra_guidance_table_s8'] },
      },
    },
    {
      drugId: 'spironolactone',
      nameVi: 'Spironolactone (sMRA - Class I ESC 2026 / Class IIb US-BYT)',
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `${spiroStart} đến ${spiroTarget}`, note: 'ESC 2026 xếp sMRA/nsMRA Class I-A; US/BYT xếp Class IIb', citationIds: ['esc.hf.2026.mra_all_lvef', 'esc.hf.2026.mra_doses', 'acc.hfpef.2026.finerenone'] },
        g2: { initiate: 'rec', continue: 'rec', dose: `${spiroStart} đến ${spiroTarget}`, note: 'ESC 2026 xếp sMRA/nsMRA Class I-A; US/BYT xếp Class IIb', citationIds: ['esc.hf.2026.mra_all_lvef', 'esc.hf.2026.mra_doses', 'acc.hfpef.2026.finerenone'] },
        g3a: { initiate: 'rec', continue: 'rec', dose: `${spiroStart}`, citationIds: ['esc.hf.2026.mra_all_lvef', 'esc.hf.2026.mra_doses', 'acc.hfpef.2026.finerenone'] },
        g3b: { initiate: 'caution', continue: 'ok', dose: `${spiroLowMg} mg/ngày (hoặc ${spiroAltMg} mg cách ngày)`, citationIds: ['fda.hf.spironolactone_egfr_30_50', 'esc.hf.2026.mra_guidance_table_s8'] },
        g4: { initiate: 'contra', continue: 'contra', note: `Chống chỉ định khi eGFR dưới ${thFor('egfr', 'hf.mra.egfr_min_initiate')}`, citationIds: ['esc.hf.2026.mra_guidance_table_s8'] },
        g5: { initiate: 'contra', continue: 'contra', citationIds: ['esc.hf.2026.mra_guidance_table_s8'] },
        dialysis: { initiate: 'contra', continue: 'contra', citationIds: ['esc.hf.2026.mra_guidance_table_s8'] },
        aki: { initiate: 'contra', continue: 'contra', citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k', 'esc.hf.2026.mra_guidance_table_s8'] },
      },
    },
    {
      drugId: 'furosemide',
      nameVi: 'Furosemide (Lợi tiểu quai khi có sung huyết)',
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${furoStart}, tối đa ${furoMax} mg/ngày`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g2: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${furoStart}, tối đa ${furoMax} mg/ngày`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g3a: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${furoStart}, tối đa ${furoMax} mg/ngày`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g3b: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${furoStart}, tối đa ${furoMax} mg/ngày`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g4: { initiate: 'rec', continue: 'rec', dose: `Thường cần tăng liều (tối đa ${furoMax} mg/ngày)`, citationIds: ['esc.hf.2026.acute_furosemide_40_max600', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g5: { initiate: 'rec', continue: 'rec', dose: `Thường cần tăng liều (tối đa ${furoMax} mg/ngày)`, citationIds: ['esc.hf.2026.acute_furosemide_40_max600', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        dialysis: { initiate: 'ok', continue: 'ok', citationIds: ['esc.hf.2026.loop_diuretics_chronic'] },
        aki: { initiate: 'caution', continue: 'caution', citationIds: ['esc.hf.2026.acute_iv_diuretics'] },
      },
    },
  ],
};
