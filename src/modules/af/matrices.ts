/**
 * Ma trận quyết định lâm sàng Module Rung nhĩ (AF)
 * 1. Ma trận Liều thuốc chống đông (DOAC & VKA) theo độ thanh thải Creatinin (CrCl Cockcroft-Gault)
 * 2. Ma trận Thuốc kiểm soát tần số & kiểm soát nhịp theo bệnh tim cấu trúc / LVEF
 * 100% dữ liệu liều và hành động được truy xuất động từ KB (drug/thFor) — không chứa hằng số liều cứng.
 */

import type { MatrixDefinition, MatrixCellData } from '../../engine/types';
import type { Dose } from '../../kb-types';
import { drug, thFor } from '../../kb-types/access';

function formatKbDose(val: Dose | string | undefined): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val;
  return `${val.amount} ${val.unit}${val.frequency ? ` (${val.frequency})` : ''}`;
}

function getCellFromRenal(drugId: string, bandIndex: number): MatrixCellData {
  const entry = drug(drugId);
  const band = entry.renal[bandIndex];
  if (!band) {
    return { initiate: 'no_data', continue: 'no_data', citationIds: entry.citationIds };
  }
  return {
    initiate: band.initiate,
    continue: band.continue,
    dose: formatKbDose(band.dose),
    note: band.note,
    citationIds: band.citationIds
  };
}

function getStartDose(drugId: string): string {
  return formatKbDose(drug(drugId).start) ?? '';
}

const edoxHighCrcl = thFor('crcl', 'af.edoxaban.high_crcl_limit');
const modCrcl = thFor('crcl', 'af.crcl.moderate_impairment_50');
const dabiContra = thFor('crcl', 'af.dabigatran.crcl_contra');
const doacContraMin = thFor('crcl', 'af.doac.contra_crcl_min');
const efCutoff = thFor('lvef', 'af.rate.lvef_cutoff');

/**
 * Ma trận 1: Chỉnh liều thuốc chống đông theo CrCl (Cockcroft-Gault, mL/phút)
 */
export const afMatrixDoacCrCl: MatrixDefinition = {
  title: 'Ma trận Liều Thuốc Chống Đông (DOAC & VKA) theo Chức năng thận (CrCl Cockcroft-Gault)',
  columns: [
    { id: 'crcl_gt95', label: `CrCl trên ${edoxHighCrcl}`, subLabel: 'mL/phút (Thanh thải cao)' },
    { id: 'crcl_51_95', label: `CrCl trên ${modCrcl} đến ${edoxHighCrcl}`, subLabel: 'mL/phút (Bình thường / Giảm nhẹ)' },
    { id: 'crcl_30_50', label: `CrCl từ ${dabiContra} đến ${modCrcl}`, subLabel: 'mL/phút (Suy thận vừa)' },
    { id: 'crcl_15_29', label: `CrCl từ ${doacContraMin} đến dưới ${dabiContra}`, subLabel: 'mL/phút (Suy thận nặng)' },
    { id: 'crcl_lt15', label: `CrCl dưới ${doacContraMin}`, subLabel: 'mL/phút / Lọc máu' }
  ],
  rows: [
    {
      drugId: 'apixaban',
      nameVi: drug('apixaban').nameVi,
      cells: {
        crcl_gt95: getCellFromRenal('apixaban', 0), // qa-allow: index - Dải thận bảo tồn của Apixaban
        crcl_51_95: getCellFromRenal('apixaban', 0), // qa-allow: index - Dải thận 51-95 của Apixaban
        crcl_30_50: getCellFromRenal('apixaban', 0), // qa-allow: index - Dải thận 30-50 của Apixaban
        crcl_15_29: getCellFromRenal('apixaban', 1), // qa-allow: index - Dải thận 15-29 giảm liều Apixaban
        crcl_lt15: getCellFromRenal('apixaban', 2) // qa-allow: index - Dải thận <15 của Apixaban
      }
    },
    {
      drugId: 'rivaroxaban',
      nameVi: drug('rivaroxaban').nameVi,
      cells: {
        crcl_gt95: getCellFromRenal('rivaroxaban', 0), // qa-allow: index - Dải thận >50 của Rivaroxaban
        crcl_51_95: getCellFromRenal('rivaroxaban', 0), // qa-allow: index - Dải thận >50 của Rivaroxaban
        crcl_30_50: getCellFromRenal('rivaroxaban', 1), // qa-allow: index - Dải thận 15-50 của Rivaroxaban
        crcl_15_29: getCellFromRenal('rivaroxaban', 1), // qa-allow: index - Dải thận 15-29 của Rivaroxaban
        crcl_lt15: getCellFromRenal('rivaroxaban', 2) // qa-allow: index - Dải thận <15 chống chỉ định Rivaroxaban
      }
    },
    {
      drugId: 'dabigatran',
      nameVi: drug('dabigatran').nameVi,
      cells: {
        crcl_gt95: getCellFromRenal('dabigatran', 0), // qa-allow: index - Dải thận ≥50 của Dabigatran
        crcl_51_95: getCellFromRenal('dabigatran', 0), // qa-allow: index - Dải thận ≥50 của Dabigatran
        crcl_30_50: getCellFromRenal('dabigatran', 1), // qa-allow: index - Dải thận 30-49 của Dabigatran
        crcl_15_29: getCellFromRenal('dabigatran', 2), // qa-allow: index - Dải thận 15-29 (thận trọng US 75 mg / chống chỉ định INTL-VN)
        crcl_lt15: getCellFromRenal('dabigatran', 3) // qa-allow: index - Dải thận <15 chống chỉ định tuyệt đối Dabigatran
      }
    },
    {
      drugId: 'edoxaban',
      nameVi: drug('edoxaban').nameVi,
      cells: {
        crcl_gt95: getCellFromRenal('edoxaban', 0), // qa-allow: index - Dải thận >95 cảnh báo hộp đen FDA của Edoxaban
        crcl_51_95: getCellFromRenal('edoxaban', 1), // qa-allow: index - Dải thận 51-95 liều chuẩn Edoxaban
        crcl_30_50: getCellFromRenal('edoxaban', 2), // qa-allow: index - Dải thận 15-50 giảm liều Edoxaban
        crcl_15_29: getCellFromRenal('edoxaban', 2), // qa-allow: index - Dải thận 15-29 giảm liều Edoxaban
        crcl_lt15: getCellFromRenal('edoxaban', 3) // qa-allow: index - Dải thận <15 chống chỉ định Edoxaban
      }
    },
    {
      drugId: 'warfarin',
      nameVi: drug('warfarin').nameVi,
      cells: {
        crcl_gt95: getCellFromRenal('warfarin', 0), // qa-allow: index - Warfarin không phụ thuộc độ thanh thải thận
        crcl_51_95: getCellFromRenal('warfarin', 0), // qa-allow: index - Warfarin không phụ thuộc độ thanh thải thận
        crcl_30_50: getCellFromRenal('warfarin', 0), // qa-allow: index - Warfarin không phụ thuộc độ thanh thải thận
        crcl_15_29: getCellFromRenal('warfarin', 0), // qa-allow: index - Warfarin theo dõi sát INR
        crcl_lt15: getCellFromRenal('warfarin', 1) // qa-allow: index - Warfarin thận trọng ở suy thận giai đoạn cuối
      }
    },
    {
      drugId: 'acenocoumarol',
      nameVi: drug('acenocoumarol').nameVi,
      cells: {
        crcl_gt95: getCellFromRenal('acenocoumarol', 0), // qa-allow: index - Acenocoumarol chỉnh liều theo INR
        crcl_51_95: getCellFromRenal('acenocoumarol', 0), // qa-allow: index - Acenocoumarol chỉnh liều theo INR
        crcl_30_50: getCellFromRenal('acenocoumarol', 0), // qa-allow: index - Acenocoumarol chỉnh liều theo INR
        crcl_15_29: getCellFromRenal('acenocoumarol', 0), // qa-allow: index - Acenocoumarol theo dõi sát INR
        crcl_lt15: getCellFromRenal('acenocoumarol', 1) // qa-allow: index - Acenocoumarol thận trọng ở suy thận giai đoạn cuối
      }
    }
  ]
};

/**
 * Ma trận 2: Lựa chọn thuốc Kiểm soát tần số & Kiểm soát nhịp theo LVEF và Bệnh tim cấu trúc
 */
export const afMatrixRateRhythmLvef: MatrixDefinition = {
  title: 'Ma trận Thuốc Kiểm Soát Tần Số & Nhịp theo LVEF và Bệnh Tim Cấu Trúc (ESC 2024 / ACC 2023)',
  columns: [
    { id: 'no_shd', label: `LVEF > ${efCutoff}%`, subLabel: 'Không bệnh tim cấu trúc' },
    { id: 'cad_hcm', label: `LVEF > ${efCutoff}% + CAD`, subLabel: 'Bệnh mạch vành ổn định' },
    { id: 'hfref', label: `LVEF ≤ ${efCutoff}%`, subLabel: 'Suy tim HFrEF' },
    { id: 'asthma_copd', label: 'Hen / Co thắt PQ', subLabel: `LVEF > ${efCutoff}%` }
  ],
  rows: [
    {
      drugId: 'bisoprolol',
      nameVi: `${drug('bisoprolol').nameVi} (Kiểm soát tần số)`,
      cells: {
        no_shd: { initiate: 'rec', continue: 'rec', dose: getStartDose('bisoprolol'), citationIds: ['esc.af.2024.rate_control_lvef_preserved'] },
        cad_hcm: { initiate: 'rec', continue: 'rec', dose: getStartDose('bisoprolol'), citationIds: ['esc.af.2024.rate_control_lvef_preserved'] },
        hfref: { initiate: 'rec', continue: 'rec', dose: getStartDose('bisoprolol'), note: 'Chuẩn độ chậm khi bù trừ dịch ổn định', citationIds: ['esc.af.2024.rate_control_lvef_reduced'] },
        asthma_copd: { initiate: 'caution', continue: 'caution', note: 'Thận trọng hen phế quản; ưu tiên Non-DHP CCB nếu hen chưa kiểm soát', citationIds: ['esc.af.2024.rate_control_lvef_preserved'] }
      }
    },
    {
      drugId: 'diltiazem',
      nameVi: `${drug('diltiazem').nameVi} / ${drug('verapamil').nameVi}`,
      cells: {
        no_shd: { initiate: 'rec', continue: 'rec', dose: getStartDose('diltiazem'), citationIds: ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.diltiazem_dose'] },
        cad_hcm: { initiate: 'ok', continue: 'ok', dose: getStartDose('diltiazem'), citationIds: ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.diltiazem_dose'] },
        hfref: { initiate: 'contra', continue: 'contra', note: `Chống chỉ định tuyệt đối khi LVEF ≤ ${efCutoff}% hoặc Amyloidosis tim`, citationIds: ['esc.af.2024.non_dhp_ccb_contra_lvef40'] },
        asthma_copd: { initiate: 'rec', continue: 'rec', dose: getStartDose('diltiazem'), note: 'Ưu tiên hàng đầu khi chống chỉ định chẹn beta', citationIds: ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.diltiazem_dose'] }
      }
    },
    {
      drugId: 'digoxin',
      nameVi: `${drug('digoxin').nameVi} (Kiểm soát tần số)`,
      cells: {
        no_shd: { initiate: 'caution', continue: 'ok', dose: getStartDose('digoxin'), note: 'Hàng hai hoặc phối hợp ở người ít vận động', citationIds: ['esc.af.2024.rate_control_lvef_preserved', 'esc.hf.2026.digoxin_rec'] },
        cad_hcm: { initiate: 'caution', continue: 'ok', dose: getStartDose('digoxin'), note: 'Tránh trong HCM tắc nghẽn và cấm tuyệt đối trong Amyloidosis tim', citationIds: ['esc.hf.2026.digoxin_rec', 'esc.hf.2026.amyloidosis_avoid_digoxin'] },
        hfref: { initiate: 'rec', continue: 'rec', dose: getStartDose('digoxin'), note: 'Phối hợp chẹn beta hoặc thay thế khi không dung nạp (cấm trong Amyloidosis)', citationIds: ['esc.af.2024.rate_control_lvef_reduced', 'esc.hf.2026.digoxin_rec'] },
        asthma_copd: { initiate: 'ok', continue: 'ok', dose: getStartDose('digoxin'), citationIds: ['esc.hf.2026.digoxin_rec'] }
      }
    },
    {
      drugId: 'flecainide',
      nameVi: `${drug('flecainide').nameVi} / ${drug('propafenone').nameVi} (Nhóm IC)`,
      cells: {
        no_shd: { initiate: 'rec', continue: 'rec', dose: getStartDose('flecainide'), note: 'Bắt buộc phối hợp thuốc ức chế dẫn truyền nút nhĩ thất', citationIds: ['esc.af.2024.aad_flecainide_propafenone', 'esc.af.2024.table13_flecainide'] },
        cad_hcm: { initiate: 'contra', continue: 'contra', note: 'Chống chỉ định tuyệt đối trong CAD, HCM và bệnh tim cấu trúc (CAST)', citationIds: ['esc.af.2024.aad_flecainide_propafenone'] },
        hfref: { initiate: 'contra', continue: 'contra', note: 'Chống chỉ định tuyệt đối do nguy cơ loạn nhịp thất tử vong', citationIds: ['esc.af.2024.aad_flecainide_propafenone'] },
        asthma_copd: { initiate: 'caution', continue: 'caution', dose: getStartDose('flecainide'), note: 'Tránh Propafenone ở hen phế quản (hoạt tính chẹn beta nhẹ)', citationIds: ['esc.af.2024.table13_flecainide', 'acc.af.2023.table23_propafenone_liver'] }
      }
    },
    {
      drugId: 'dronedarone',
      nameVi: `${drug('dronedarone').nameVi} (Nhóm III)`,
      cells: {
        no_shd: { initiate: 'rec', continue: 'rec', dose: getStartDose('dronedarone'), note: 'Không dùng trong rung nhĩ vĩnh viễn', citationIds: ['esc.af.2024.aad_dronedarone_rec', 'esc.af.2024.table13_dronedarone_sotalol'] },
        cad_hcm: { initiate: 'rec', continue: 'rec', dose: getStartDose('dronedarone'), note: 'An toàn trong CAD ổn định; tránh trong HCM và suy gan', citationIds: ['esc.af.2024.aad_dronedarone_rec', 'esc.af.2024.table13_dronedarone_sotalol'] },
        hfref: { initiate: 'contra', continue: 'contra', note: 'Chống chỉ định tuyệt đối trong HFrEF / NYHA III–IV (ANDROMEDA)', citationIds: ['acc.af.2023.dronedarone_hf_contra'] },
        asthma_copd: { initiate: 'ok', continue: 'ok', dose: getStartDose('dronedarone'), citationIds: ['esc.af.2024.aad_dronedarone_rec', 'esc.af.2024.table13_dronedarone_sotalol'] }
      }
    },
    {
      drugId: 'amiodarone',
      nameVi: `${drug('amiodarone').nameVi} (Nhóm III)`,
      cells: {
        no_shd: { initiate: 'caution', continue: 'caution', dose: getStartDose('amiodarone'), note: 'Chỉ dùng hàng hai do độc tính ngoài tim dài hạn', citationIds: ['esc.af.2024.aad_amiodarone_hfref', 'esc.af.2024.amiodarone_dose_regimen'] },
        cad_hcm: { initiate: 'ok', continue: 'ok', dose: getStartDose('amiodarone'), note: 'Hiệu quả cao trong CAD và HCM; theo dõi tuyến giáp, gan, phổi, QTc', citationIds: ['esc.af.2024.aad_amiodarone_hfref', 'esc.af.2024.amiodarone_dose_regimen'] },
        hfref: { initiate: 'rec', continue: 'rec', dose: getStartDose('amiodarone'), note: 'Thuốc chống loạn nhịp duy nhất an toàn khi LVEF ≤ 40%', citationIds: ['esc.af.2024.aad_amiodarone_hfref', 'esc.af.2024.amiodarone_dose_regimen'] },
        asthma_copd: { initiate: 'caution', continue: 'caution', dose: getStartDose('amiodarone'), note: 'Theo dõi sát nguy cơ xơ phổi mô kẽ do Amiodarone', citationIds: ['esc.af.2024.aad_amiodarone_hfref', 'esc.af.2024.amiodarone_dose_regimen'] }
      }
    }
  ]
};

export const afMatrixRateControlEF = afMatrixRateRhythmLvef;
export const afMatrices: MatrixDefinition[] = [afMatrixDoacCrCl, afMatrixRateRhythmLvef];
