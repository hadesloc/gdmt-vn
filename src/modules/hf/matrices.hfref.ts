import type { MatrixDefinition } from '../../engine/types';
import { dose, drug, thFor } from '../../kb-types/access';
import { formatHfDose } from './helpers';

export const egfrColumns = [
  { id: 'g1', label: 'G1', subLabel: '≥ 90' },
  { id: 'g2', label: 'G2', subLabel: '60–89' },
  { id: 'g3a', label: 'G3a', subLabel: '45–59' },
  { id: 'g3b', label: 'G3b', subLabel: '30–44' },
  { id: 'g4', label: 'G4', subLabel: '15–29' },
  { id: 'g5', label: 'G5', subLabel: '< 15' },
  { id: 'dialysis', label: 'Lọc máu', subLabel: 'HD/PD' },
  { id: 'aki', label: 'AKI', subLabel: 'Cấp tính' },
];

const dapaStart = formatHfDose(dose('dapagliflozin', 'start'));
const spiroStart = formatHfDose(dose('spironolactone', 'start'));
const spiroTarget = formatHfDose(dose('spironolactone', 'target'));
const spiroLowMg = thFor('dose_mg', 'hf.mra.spironolactone_low_start_dose_mg');
const spiroAltMg = thFor('dose_mg', 'hf.mra.spironolactone_g3_alt_day_dose_mg');
const epleStart = formatHfDose(dose('eplerenone', 'start'));
const epleTarget = formatHfDose(dose('eplerenone', 'target'));
const arniStart = formatHfDose(dose('sacubitril_valsartan', 'start'));
const arniTarget = formatHfDose(dose('sacubitril_valsartan', 'target'));
const arniLowForm = '24/26 mg'; // qa-allow: ui-step - chuỗi hàm lượng viên chuẩn 24/26 mg
const bisoStart = formatHfDose(dose('bisoprolol', 'start'));
const bisoTarget = formatHfDose(dose('bisoprolol', 'target'));
const ivaStart = formatHfDose(dose('ivabradine', 'start'));
const ivaTarget = formatHfDose(dose('ivabradine', 'target'));
const verStart = formatHfDose(dose('vericiguat', 'start'));
const verTarget = formatHfDose(dose('vericiguat', 'target'));
const furoStart = formatHfDose(dose('furosemide', 'start'));
const furoMax = thFor('dose_mg', 'hf.acute.furosemide_iv_max_mg');
const torseStart = formatHfDose(dose('torsemide', 'start'));
const torseTarget = formatHfDose(dose('torsemide', 'target'));
const sglt2Min = thFor('egfr', 'hf.sglt2i.egfr_initiate_min');
const sglt2Cits = ['esc.hf.2026.sglt2i_doses_table11', 'esc.hf.2026.sglt2i_all_lvef', 'esc.hf.2026.sglt2i_table_s9'];

export const hfMatrixHFrEF: MatrixDefinition = {
  title: `Ma trận an toàn thuốc theo chức năng thận ở HFrEF (ESC 2026 LVEF dưới ${thFor('lvef', 'hf.ef.hfref_max_esc2026')}% / US-VN từ ${thFor('lvef', 'hf.ef.hfref_max')}% trở xuống)`,
  columns: egfrColumns,
  rows: [
    {
      drugId: 'dapagliflozin',
      nameVi: `${drug('dapagliflozin').nameVi} / Empagliflozin (SGLT2i)`,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `${dapaStart}`, citationIds: sglt2Cits },
        g2: { initiate: 'rec', continue: 'rec', dose: `${dapaStart}`, citationIds: sglt2Cits },
        g3a: { initiate: 'rec', continue: 'rec', dose: `${dapaStart}`, citationIds: sglt2Cits },
        g3b: { initiate: 'rec', continue: 'rec', dose: `${dapaStart}`, citationIds: sglt2Cits },
        g4: {
          initiate: 'rec', continue: 'rec', dose: `${dapaStart}`,
          note: `eGFR từ ${sglt2Min}–29: Khuyến cáo khởi trị chuẩn (Mỹ: Farxiga khởi trị từ ${thFor('egfr', 'hf.sglt2i.egfr_initiate_min_us')}); eGFR 15–19: Không khởi trị mới, chỉ tiếp tục duy trì nếu đã dùng trước đó`,
          citationIds: ['fda.hf.dapagliflozin_egfr25', ...sglt2Cits],
        },
        g5: {
          initiate: 'not_rec', continue: 'ok', dose: `${dapaStart}`,
          note: `Không khởi trị mới khi eGFR dưới ${sglt2Min}; nếu đang dùng tiếp tục đến khi lọc máu`,
          citationIds: sglt2Cits,
        },
        dialysis: { initiate: 'not_rec', continue: 'not_rec', note: 'Ngưng khi bắt đầu lọc máu chu kỳ', citationIds: ['esc.hf.2026.sglt2i_table_s9'] },
        aki: { initiate: 'not_rec', continue: 'not_rec', note: 'Tạm ngưng ngay trong đợt tổn thương thận cấp (AKI)', citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k', 'esc.hf.2026.sglt2i_table_s9'] },
      },
    },
    {
      drugId: 'spironolactone',
      nameVi: `${drug('spironolactone').nameVi} (sMRA)`,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `${spiroStart} đến ${spiroTarget}`, citationIds: ['esc.hf.2026.mra_doses', 'esc.hf.2026.mra_guidance_table_s8'] },
        g2: { initiate: 'rec', continue: 'rec', dose: `${spiroStart} đến ${spiroTarget}`, citationIds: ['esc.hf.2026.mra_doses', 'esc.hf.2026.mra_guidance_table_s8'] },
        g3a: { initiate: 'rec', continue: 'rec', dose: `${spiroStart} đến ${spiroTarget}`, citationIds: ['esc.hf.2026.mra_doses', 'esc.hf.2026.mra_guidance_table_s8'] },
        g3b: {
          initiate: 'caution', continue: 'ok',
          dose: `Khởi đầu ${spiroLowMg} mg/ngày (hoặc ${spiroAltMg} mg cách ngày)`,
          note: `Đích tối đa ${spiroAltMg} mg/ngày ở eGFR 30–49; theo dõi K+ và creatinin sau 1–2 tuần`,
          citationIds: ['fda.hf.spironolactone_egfr_30_50', 'esc.hf.2026.mra_guidance_table_s8'],
        },
        g4: { initiate: 'contra', continue: 'contra', note: `Chống chỉ định MRA steroid khi eGFR dưới ${thFor('egfr', 'hf.mra.egfr_min_initiate')}`, citationIds: ['esc.hf.2026.mra_guidance_table_s8'] },
        g5: { initiate: 'contra', continue: 'contra', citationIds: ['esc.hf.2026.mra_guidance_table_s8'] },
        dialysis: { initiate: 'contra', continue: 'contra', citationIds: ['esc.hf.2026.mra_guidance_table_s8'] },
        aki: { initiate: 'contra', continue: 'contra', note: 'Ngưng ngay trong AKI để tránh tăng kali máu nguy kịch', citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k', 'esc.hf.2026.mra_guidance_table_s8'] },
      },
    },
    {
      drugId: 'eplerenone',
      nameVi: `${drug('eplerenone').nameVi} (sMRA chọn lọc)`,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `${epleStart} đến ${epleTarget}`, citationIds: ['esc.hf.2026.mra_doses', 'fda.hf.eplerenone_contra_crcl30'] },
        g2: { initiate: 'rec', continue: 'rec', dose: `${epleStart} đến ${epleTarget}`, citationIds: ['esc.hf.2026.mra_doses', 'fda.hf.eplerenone_contra_crcl30'] },
        g3a: { initiate: 'caution', continue: 'ok', dose: `Khởi đầu ${epleStart} (tối đa ${thFor('dose_mg', 'hf.eplerenone.mod_cyp3a4_max_mg')} mg/ngày nếu dùng kèm ức chế vừa CYP3A4)`, citationIds: ['esc.hf.2026.mra_doses', 'fda.hf.eplerenone_mod_cyp3a4_25mg'] },
        g3b: { initiate: 'caution', continue: 'ok', dose: `${spiroAltMg} mg cách ngày tới ${epleStart}`, citationIds: ['esc.hf.2026.mra_doses', 'fda.hf.eplerenone_contra_crcl30'] },
        g4: { initiate: 'contra', continue: 'contra', note: `Chống chỉ định tuyệt đối khi eGFR/CrCl từ ${thFor('egfr', 'hf.mra.egfr_min_initiate')} trở xuống`, citationIds: ['fda.hf.eplerenone_contra_crcl30'] },
        g5: { initiate: 'contra', continue: 'contra', citationIds: ['fda.hf.eplerenone_contra_crcl30'] },
        dialysis: { initiate: 'contra', continue: 'contra', citationIds: ['fda.hf.eplerenone_contra_crcl30'] },
        aki: { initiate: 'contra', continue: 'contra', citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k'] },
      },
    },
    {
      drugId: 'sacubitril_valsartan',
      nameVi: `${drug('sacubitril_valsartan').nameVi} (ARNI)`,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `${arniStart} (đích ${arniTarget})`, citationIds: ['esc.hf.2026.sacubitril_valsartan_dose'] },
        g2: { initiate: 'rec', continue: 'rec', dose: `${arniStart} (đích ${arniTarget})`, citationIds: ['esc.hf.2026.sacubitril_valsartan_dose'] },
        g3a: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${arniLowForm} x 2 lần/ngày`, citationIds: ['esc.hf.2026.sacubitril_valsartan_low_dose'] },
        g3b: { initiate: 'caution', continue: 'ok', dose: `Khởi đầu ${arniLowForm} x 2 lần/ngày`, citationIds: ['esc.hf.2026.sacubitril_valsartan_low_dose'] },
        g4: { initiate: 'caution', continue: 'ok', dose: `Khởi đầu ${arniLowForm} x 2 lần/ngày, chuẩn độ thận trọng`, citationIds: ['esc.hf.2026.sacubitril_valsartan_low_dose', 'fda.hf.sacubitril_renal_egfr30'] },
        g5: { initiate: 'not_rec', continue: 'not_rec', note: `Tạm ngưng / không khởi trị thường quy khi eGFR dưới ${thFor('egfr', 'hf.arni.egfr_esrd_min')}`, citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k', 'esc.hf.2026.arni_table_s5_contra_caution'] },
        dialysis: { initiate: 'not_rec', continue: 'caution', citationIds: ['esc.hf.2026.arni_table_s5_contra_caution'] },
        aki: { initiate: 'not_rec', continue: 'not_rec', note: 'Tạm ngưng ngay trong đợt tổn thương thận cấp (AKI)', citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k'] },
      },
    },
    {
      drugId: 'bisoprolol',
      nameVi: `${drug('bisoprolol').nameVi} (Beta-blocker)`,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `${bisoStart} đến ${bisoTarget}`, citationIds: ['esc.hf.2026.bb_doses', 'esc.hf.2026.bb_guidance_table_s6'] },
        g2: { initiate: 'rec', continue: 'rec', dose: `${bisoStart} đến ${bisoTarget}`, citationIds: ['esc.hf.2026.bb_doses', 'esc.hf.2026.bb_guidance_table_s6'] },
        g3a: { initiate: 'rec', continue: 'rec', dose: `${bisoStart} đến ${bisoTarget}`, citationIds: ['esc.hf.2026.bb_doses', 'esc.hf.2026.bb_guidance_table_s6'] },
        g3b: { initiate: 'rec', continue: 'rec', dose: `${bisoStart} đến ${bisoTarget}`, citationIds: ['esc.hf.2026.bb_doses', 'esc.hf.2026.bb_guidance_table_s6'] },
        g4: { initiate: 'caution', continue: 'ok', dose: `Khởi đầu ${bisoStart}, tối đa ${bisoTarget}`, citationIds: ['esc.hf.2026.bb_doses', 'ema.hf.bisoprolol_contra_hepatic'] },
        g5: { initiate: 'caution', continue: 'ok', dose: `Khởi đầu ${bisoStart}, chuẩn độ chậm`, citationIds: ['esc.hf.2026.bb_doses', 'ema.hf.bisoprolol_contra_hepatic'] },
        dialysis: { initiate: 'caution', continue: 'ok', citationIds: ['esc.hf.2026.bb_guidance_table_s6'] },
        aki: { initiate: 'not_rec', continue: 'caution', note: 'Không khởi trị mới trong đợt cấp; duy trì nếu không sốc tim/nhịp chậm', citationIds: ['esc.hf.2026.bb_guidance_table_s6'] },
      },
    },
    {
      drugId: 'ivabradine',
      nameVi: `${drug('ivabradine').nameVi} (Ức chế kênh If)`,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `${ivaStart} đến ${ivaTarget}`, citationIds: ['esc.hf.2026.amt_doses_table11', 'esc.hf.2026.ivabradine_rec'] },
        g2: { initiate: 'rec', continue: 'rec', dose: `${ivaStart} đến ${ivaTarget}`, citationIds: ['esc.hf.2026.amt_doses_table11', 'esc.hf.2026.ivabradine_rec'] },
        g3a: { initiate: 'rec', continue: 'rec', dose: `${ivaStart} đến ${ivaTarget}`, citationIds: ['esc.hf.2026.amt_doses_table11', 'esc.hf.2026.ivabradine_rec'] },
        g3b: { initiate: 'rec', continue: 'rec', dose: `${ivaStart} đến ${ivaTarget}`, citationIds: ['esc.hf.2026.amt_doses_table11', 'esc.hf.2026.ivabradine_rec'] },
        g4: { initiate: 'caution', continue: 'ok', dose: `${ivaStart}`, citationIds: ['esc.hf.2026.amt_doses_table11', 'esc.hf.2026.ivabradine_rec'] },
        g5: { initiate: 'not_rec', continue: 'caution', note: `Dữ liệu hạn chế khi eGFR dưới ${thFor('egfr', 'hf.vericiguat.egfr_min')}`, citationIds: ['esc.hf.2026.ivabradine_rec', 'fda.hf.vericiguat_renal_hepatic'] },
        dialysis: { initiate: 'not_rec', continue: 'caution', citationIds: ['esc.hf.2026.ivabradine_rec'] },
        aki: { initiate: 'not_rec', continue: 'caution', citationIds: ['esc.hf.2026.ivabradine_rec'] },
      },
    },
    {
      drugId: 'vericiguat',
      nameVi: `${drug('vericiguat').nameVi} (Kích thích sGC)`,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `${verStart} đến ${verTarget}`, citationIds: ['esc.hf.2026.amt_doses_table11', 'esc.hf.2026.vericiguat_rec'] },
        g2: { initiate: 'rec', continue: 'rec', dose: `${verStart} đến ${verTarget}`, citationIds: ['esc.hf.2026.amt_doses_table11', 'esc.hf.2026.vericiguat_rec'] },
        g3a: { initiate: 'rec', continue: 'rec', dose: `${verStart} đến ${verTarget}`, citationIds: ['esc.hf.2026.amt_doses_table11', 'esc.hf.2026.vericiguat_rec'] },
        g3b: { initiate: 'rec', continue: 'rec', dose: `${verStart} đến ${verTarget}`, citationIds: ['esc.hf.2026.amt_doses_table11', 'esc.hf.2026.vericiguat_rec'] },
        g4: { initiate: 'rec', continue: 'rec', dose: `${verStart} đến ${verTarget}`, citationIds: ['esc.hf.2026.amt_doses_table11', 'fda.hf.vericiguat_renal_hepatic'] },
        g5: { initiate: 'not_rec', continue: 'not_rec', note: `Không khởi trị khi eGFR dưới ${thFor('egfr', 'hf.vericiguat.egfr_min')}`, citationIds: ['fda.hf.vericiguat_renal_hepatic'] },
        dialysis: { initiate: 'not_rec', continue: 'not_rec', citationIds: ['fda.hf.vericiguat_renal_hepatic'] },
        aki: { initiate: 'not_rec', continue: 'not_rec', citationIds: ['fda.hf.vericiguat_renal_hepatic'] },
      },
    },
    {
      drugId: 'furosemide',
      nameVi: `${drug('furosemide').nameVi} (Lợi tiểu quai)`,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${furoStart}, tối đa ${furoMax} mg/ngày`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g2: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${furoStart}, tối đa ${furoMax} mg/ngày`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g3a: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${furoStart}, tối đa ${furoMax} mg/ngày`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g3b: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${furoStart}, tối đa ${furoMax} mg/ngày`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g4: { initiate: 'rec', continue: 'rec', dose: `Thường cần tăng liều (tối đa ${furoMax} mg/ngày)`, citationIds: ['esc.hf.2026.acute_furosemide_40_max600', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g5: { initiate: 'rec', continue: 'rec', dose: `Thường cần tăng liều (tối đa ${furoMax} mg/ngày)`, citationIds: ['esc.hf.2026.acute_furosemide_40_max600', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        dialysis: { initiate: 'ok', continue: 'ok', note: 'Hiệu quả nếu còn nước tiểu tồn dư; tránh khi vô niệu', citationIds: ['esc.hf.2026.loop_diuretics_chronic', 'fda.hf.bumetanide_contra_anuria_hepatic'] },
        aki: { initiate: 'caution', continue: 'caution', note: 'Chỉ dùng giải áp khi quá tải dịch sung huyết và không vô niệu/sốc', citationIds: ['esc.hf.2026.acute_iv_diuretics', 'fda.hf.bumetanide_contra_anuria_hepatic'] },
      },
    },
    {
      drugId: 'torsemide',
      nameVi: `${drug('torsemide').nameVi} (Lợi tiểu quai sinh khả dụng ổn định)`,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${torseStart}, tối đa ${torseTarget}`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g2: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${torseStart}, tối đa ${torseTarget}`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g3a: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${torseStart}, tối đa ${torseTarget}`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g3b: { initiate: 'rec', continue: 'rec', dose: `Khởi đầu ${torseStart}, tối đa ${torseTarget}`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g4: { initiate: 'rec', continue: 'rec', dose: `Chuẩn độ tới tối đa ${torseTarget}`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        g5: { initiate: 'rec', continue: 'rec', dose: `Chuẩn độ tới tối đa ${torseTarget}`, citationIds: ['esc.hf.2026.loop_diuretics_doses_table_s7', 'aha.hf.2022.loop_diuretic_chronic_doses'] },
        dialysis: { initiate: 'ok', continue: 'ok', note: 'Thải trừ chủ yếu qua gan; tránh khi vô niệu', citationIds: ['fda.hf.bumetanide_contra_anuria_hepatic'] },
        aki: { initiate: 'caution', continue: 'caution', note: 'Chỉ dùng khi có quá tải dịch và không vô niệu', citationIds: ['esc.hf.2026.acute_iv_diuretics'] },
      },
    },
  ],
};
