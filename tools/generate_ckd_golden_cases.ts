import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { GoldenCase } from '../src/kb-types/goldenCase';

const ROOT_DIR = process.cwd().endsWith('gdmt-vn') ? process.cwd() : join(process.cwd(), 'gdmt-vn');
const GOLDEN_CKD_DIR = join(ROOT_DIR, 'tests', 'golden', 'ckd');
mkdirSync(GOLDEN_CKD_DIR, { recursive: true });

const defaultSettings: GoldenCase['settings'] = {
  setting: 'outpatient',
  profile: 'INTL',
  units: {
    cr: 'umol_L',
    glucose: 'mmol_L',
    lipid: 'mmol_L',
    urat: 'umol_L',
    uacr: 'mg_mmol',
    hba1c: 'pct'
  },
  score2Region: 'high',
  fontScale: 'normal',
  theme: 'light',
  onlyReviewed: false
};

const inpatientSettings: GoldenCase['settings'] = {
  ...defaultSettings,
  setting: 'inpatient'
};

const cases: GoldenCase[] = [
  // 1. SGLT2i ở ĐTĐ2 + CKD G3a
  {
    id: 'ckd_01_sglt2i_t2d_g3a',
    titleVi: 'Khởi trị Dapagliflozin ở bệnh nhân ĐTĐ2 kèm CKD G3a (eGFR 52 mL/min)',
    source: 'KDIGO 2024 CKD Rec 3.7.1 / kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_01',
      name: 'BN CKD 01',
      age: 62,
      sex: 'male',
      weight: 70,
      sbp: 132,
      dbp: 82,
      hr: 72,
      scr: 125, // eGFR ~52
      k: 4.5,
      uacr: 25, // A2/A3
      conditions: { dm: true, ckd: true },
      currentMeds: [{ drugId: 'metformin', name: 'Metformin', dose: 1000, unit: 'mg' }],
      selectedModules: ['ckd', 'dm2']
    },
    expect: {
      mustInclude: [{ drugId: 'dapagliflozin', action: 'START', doseContains: '10 mg' }],
      mustNotInclude: [{ drugId: 'dapagliflozin', action: 'STOP' }]
    },
    descriptionVi: 'Bệnh nhân có eGFR 52 >= 20 kèm ĐTĐ2, đủ tiêu chuẩn chỉ định SGLT2i 1A.'
  },

  // 2. Tiếp tục SGLT2i khi eGFR < 20
  {
    id: 'ckd_02_sglt2i_continue_below20',
    titleVi: 'Tiếp tục duy trì Dapagliflozin khi eGFR giảm xuống 16 mL/phút',
    source: 'KDIGO 2024 CKD PP 3.7.1 / kdigo.ckd.2024.pp_3_7_1_continue_below_20',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_02',
      name: 'BN CKD 02',
      age: 66,
      sex: 'female',
      weight: 56,
      sbp: 128,
      dbp: 78,
      hr: 70,
      scr: 280, // eGFR ~16
      k: 4.8,
      uacr: 35,
      conditions: { ckd: true, dm: true },
      currentMeds: [{ drugId: 'dapagliflozin', name: 'Forxiga 10 mg', dose: 10, unit: 'mg' }],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ drugId: 'dapagliflozin', action: 'CONTINUE' }],
      mustNotInclude: [{ drugId: 'dapagliflozin', action: 'STOP' }]
    },
    descriptionVi: 'KDIGO 2024 cho phép tiếp tục SGLT2i khi eGFR < 20 cho tới khi lọc máu.'
  },

  // 3. Khởi trị RASi (Perindopril) khi có Albumin niệu nặng A3 không ĐTĐ
  {
    id: 'ckd_03_rasi_a3_nondm',
    titleVi: 'Khởi trị Perindopril ở bệnh nhân CKD G2A3 không đái tháo đường',
    source: 'KDIGO 2024 CKD Rec 3.6.1 / kdigo.ckd.2024.rec_3_6_1_rasi_a3_nondm',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_03',
      name: 'BN CKD 03',
      age: 54,
      sex: 'male',
      weight: 68,
      sbp: 136,
      dbp: 84,
      hr: 74,
      scr: 100, // eGFR ~78
      k: 4.3,
      uacr: 45, // A3 (>300 mg/g)
      conditions: { ckd: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ drugId: 'perindopril', action: 'START' }],
      mustNotInclude: [{ drugId: 'perindopril', action: 'STOP' }]
    },
    descriptionVi: 'Khuyến cáo mức 1B bắt buộc khởi trị RASi khi có albumin niệu A3 không ĐTĐ.'
  },

  // 4. Chuẩn độ RASi tăng liều tới liều tối đa
  {
    id: 'ckd_04_rasi_uptitrate_to_target',
    titleVi: 'Chuẩn độ tăng liều Losartan từ 50 mg lên 100 mg ở bệnh nhân CKD có albumin niệu',
    source: 'KDIGO 2024 CKD PP 3.6.1 / kdigo.ckd.2024.pp_3_6_1_rasi_max_dose',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_04',
      name: 'BN CKD 04',
      age: 60,
      sex: 'male',
      weight: 74,
      sbp: 138, // HA chưa đạt đích, dung nạp tốt
      dbp: 86,
      hr: 72,
      scr: 140,
      k: 4.4, // K+ an toàn <= 4.8
      uacr: 22,
      conditions: { ckd: true, htn: true },
      currentMeds: [{ drugId: 'losartan', name: 'Cozaar 50 mg', dose: 50, unit: 'mg' }],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ drugId: 'losartan', action: 'UPTITRATE' }]
    },
    descriptionVi: 'Tăng liều RASi tới liều tối đa khi huyết động và kali máu cho phép.'
  },

  // 5. Khởi trị Finerenone ở ĐTĐ2 + CKD G3aA2 (10 mg khi eGFR < 60)
  {
    id: 'ckd_05_finerenone_t2d_on_rasi',
    titleVi: 'Khởi trị Finerenone 10 mg ở bệnh nhân ĐTĐ2 kèm CKD G3a còn albumin niệu',
    source: 'KDIGO 2024 CKD Rec 3.8.1 / kdigo.ckd.2024.rec_3_8_1_finerenone_indication',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_05',
      name: 'BN CKD 05',
      age: 63,
      sex: 'male',
      weight: 76,
      sbp: 130,
      dbp: 80,
      hr: 74,
      scr: 150, // eGFR ~47
      k: 4.4,
      uacr: 28, // A2/A3
      conditions: { ckd: true, dm: true },
      currentMeds: [{ drugId: 'losartan', name: 'Cozaar 100 mg', dose: 100, unit: 'mg' }],
      selectedModules: ['ckd', 'dm2']
    },
    expect: {
      mustInclude: [{ drugId: 'finerenone', action: 'START', doseContains: '10 mg' }]
    },
    descriptionVi: 'Chỉ định Finerenone 2A khi ĐTĐ2 có CKD eGFR > 25, K+ <= 5.0 và còn albumin niệu.'
  },

  // 6. Finerenone liều 20 mg khi eGFR >= 60
  {
    id: 'ckd_06_finerenone_g2_start_20mg',
    titleVi: 'Khởi trị Finerenone 20 mg ở bệnh nhân ĐTĐ2 có eGFR >= 60 mL/min',
    source: 'FDA Kerendia Label Table 1 / fda.finerenone.table_1_starting_dose',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_06',
      name: 'BN CKD 06',
      age: 58,
      sex: 'female',
      weight: 64,
      sbp: 128,
      dbp: 80,
      hr: 72,
      scr: 85, // eGFR ~72
      k: 4.2,
      uacr: 35,
      conditions: { ckd: true, dm: true },
      currentMeds: [{ drugId: 'enalapril', name: 'Renitec 20 mg', dose: 20, unit: 'mg' }],
      selectedModules: ['ckd', 'dm2']
    },
    expect: {
      mustInclude: [{ drugId: 'finerenone', action: 'START', doseContains: '20 mg' }]
    },
    descriptionVi: 'Khởi đầu finerenone 20 mg khi eGFR >= 60 theo nhãn FDA.'
  },

  // 7. Cảnh báo tạm hoãn Finerenone khi Kali > 5.0
  {
    id: 'ckd_07_finerenone_defer_high_k',
    titleVi: 'Tạm hoãn khởi trị Finerenone khi Kali máu > 5.0 mmol/L',
    source: 'FDA Kerendia Table 2 / fda.finerenone.table_2_dose_adjustment',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_07',
      name: 'BN CKD 07',
      age: 62,
      sex: 'male',
      weight: 72,
      sbp: 134,
      dbp: 82,
      hr: 70,
      scr: 145,
      k: 5.3, // K > 5.0
      uacr: 30,
      conditions: { ckd: true, dm: true },
      currentMeds: [{ drugId: 'losartan', name: 'Cozaar 100 mg', dose: 100, unit: 'mg' }],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ drugId: 'finerenone', action: 'DEFER' }],
      mustNotInclude: [{ drugId: 'finerenone', action: 'START' }]
    },
    descriptionVi: 'Không được khởi trị finerenone nếu kali máu > 5.0 mmol/L.'
  },

  // 8. Cấm phối hợp kép ACEi + ARB
  {
    id: 'ckd_08_avoid_dual_rasi',
    titleVi: 'Ngừng ngay phối hợp đồng thời ACEi + ARB',
    source: 'KDIGO 2024 CKD Rec 3.6.4 / kdigo.ckd.2024.rec_3_6_4_avoid_dual_rasi',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_08',
      name: 'BN CKD 08',
      age: 65,
      sex: 'male',
      weight: 70,
      sbp: 130,
      dbp: 80,
      hr: 72,
      scr: 130,
      k: 4.8,
      conditions: { ckd: true, htn: true },
      currentMeds: [
        { drugId: 'perindopril', name: 'Coversyl 5 mg', dose: 5, unit: 'mg' },
        { drugId: 'losartan', name: 'Cozaar 50 mg', dose: 50, unit: 'mg' }
      ],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ drugId: 'losartan', action: 'STOP' }]
    },
    descriptionVi: 'Chống chỉ định phối hợp ACEi + ARB do nguy cơ suy thận cấp và tăng kali.'
  },

  // 9. Ngừng thuốc kháng viêm NSAID ở bệnh nhân CKD
  {
    id: 'ckd_09_stop_nsaid_ckd',
    titleVi: 'Ngừng ngay thuốc giảm đau NSAID (Meloxicam) trên bệnh nhân CKD',
    source: 'KDIGO 2024 CKD / kdigo.ckd.2024.fig_48_referral_criteria',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_09',
      name: 'BN CKD 09',
      age: 69,
      sex: 'female',
      weight: 58,
      sbp: 138,
      dbp: 84,
      hr: 76,
      scr: 170, // eGFR ~28
      k: 4.9,
      conditions: { ckd: true },
      currentMeds: [{ drugId: 'meloxicam', name: 'Mobic (Meloxicam) 7.5 mg', dose: 7.5, unit: 'mg' }],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ drugId: 'meloxicam', action: 'STOP' }]
    },
    descriptionVi: 'Tuyệt đối tránh NSAID ở bệnh nhân suy thận mạn.'
  },

  // 10. Toan chuyển hóa: Khởi trị Natri Bicarbonat khi HCO3 < 18
  {
    id: 'ckd_10_metabolic_acidosis_bicarb',
    titleVi: 'Khởi trị Natri Bicarbonat uống điều trị toan chuyển hóa khi HCO3 < 18',
    source: 'KDIGO 2024 PP 3.10.1 / kdigo.ckd.2024.pp_3_10_1_acidosis_bicarbonate',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_10',
      name: 'BN CKD 10',
      age: 67,
      sex: 'male',
      weight: 65,
      sbp: 136,
      dbp: 82,
      hr: 74,
      scr: 220, // eGFR ~27
      hco3: 15, // < 18 mmol/L
      k: 4.8,
      conditions: { ckd: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ drugId: 'sodium_bicarbonate', action: 'START' }]
    },
    descriptionVi: 'Chỉ định bù kiềm natri bicarbonat khi HCO3- < 18 mmol/L để đạt đích 22–26 mmol/L.'
  },

  // 11. Tăng Kali mạn: Khởi trị chất gắn Kali để giữ thuốc RASi
  {
    id: 'ckd_11_chronic_hyperk_binder',
    titleVi: 'Dùng chất gắn Kali để tiếp tục duy trì thuốc ức chế hệ RAS',
    source: 'KDIGO 2024 CKD PP 3.6.3 / kdigo.ckd.2024.pp_3_6_3_hyperkalemia_k_binders',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_11',
      name: 'BN CKD 11',
      age: 64,
      sex: 'male',
      weight: 72,
      sbp: 135,
      dbp: 84,
      hr: 72,
      scr: 180,
      k: 5.3, // K 5.3 mạn tính khi đang dùng RASi
      uacr: 24,
      conditions: { ckd: true },
      currentMeds: [{ drugId: 'perindopril', name: 'Coversyl 5 mg', dose: 5, unit: 'mg' }],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'rec_ckd_k_binder_start', action: 'START' }]
    },
    descriptionVi: 'Ưu tiên thêm chất gắn kali thay vì ngừng thuốc bảo vệ thận RASi.'
  },

  // 12. Điều trị Statin ở bệnh nhân CKD >= 50 tuổi
  {
    id: 'ckd_12_statin_elderly_ckd',
    titleVi: 'Khởi trị Atorvastatin phòng ngừa tim mạch ở bệnh nhân CKD 58 tuổi',
    source: 'KDIGO 2024 CKD Rec 3.15.1.1 / kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_12',
      name: 'BN CKD 12',
      age: 58,
      sex: 'male',
      weight: 70,
      sbp: 130,
      dbp: 80,
      hr: 70,
      scr: 140, // eGFR ~50
      conditions: { ckd: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ drugId: 'atorvastatin', action: 'START' }]
    },
    descriptionVi: 'Mọi bệnh nhân CKD từ 50 tuổi trở lên có eGFR < 60 được khuyến cáo dùng statin 1A.'
  },

  // 13. Chuyển khám chuyên khoa Thận khi eGFR < 30
  {
    id: 'ckd_13_nephrology_referral_g4',
    titleVi: 'Chỉ định chuyển khám Chuyên khoa Thận khi eGFR < 30 mL/phút',
    source: 'KDIGO 2024 CKD Figure 48 / kdigo.ckd.2024.fig_48_referral_criteria',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_13',
      name: 'BN CKD 13',
      age: 70,
      sex: 'female',
      weight: 52,
      sbp: 134,
      dbp: 82,
      hr: 72,
      scr: 215, // eGFR ~21 < 30
      conditions: { ckd: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'rec_ckd_refer_specialist', action: 'REFER' }]
    },
    descriptionVi: 'eGFR < 30 mL/phút/1.73m2 bắt buộc chuyển khám chuyên khoa Thận.'
  },

  // 14. Chuyển khám Thận khi Albumin niệu rất cao (> 70 mg/mmol)
  {
    id: 'ckd_14_nephrology_referral_very_high_uacr',
    titleVi: 'Chuyển khám Thận khi Albumin niệu rất cao (> 70 mg/mmol)',
    source: 'KDIGO 2024 CKD Figure 48 / kdigo.ckd.2024.fig_48_referral_criteria',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_14',
      name: 'BN CKD 14',
      age: 48,
      sex: 'male',
      weight: 68,
      sbp: 138,
      dbp: 86,
      hr: 76,
      scr: 110,
      uacr: 85, // > 70 mg/mmol
      conditions: { ckd: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'rec_ckd_refer_specialist', action: 'REFER' }]
    },
    descriptionVi: 'UACR > 70 mg/mmol là chỉ định chuyển khám chuyên khoa theo Figure 48.'
  },

  // 15. Chuyển khám Thận khi Albumin niệu A3 kèm tiểu máu
  {
    id: 'ckd_15_nephrology_referral_nephritic',
    titleVi: 'Chuyển khám Thận khi có hội chứng viêm thận: Albumin niệu A3 + tiểu máu',
    source: 'KDIGO 2024 CKD Figure 48 / kdigo.ckd.2024.fig_48_referral_criteria',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_15',
      name: 'BN CKD 15',
      age: 42,
      sex: 'male',
      weight: 66,
      sbp: 136,
      dbp: 86,
      hr: 78,
      scr: 115,
      uacr: 38, // A3
      conditions: { ckd: true },
      customInputs: { hematuria: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'rec_ckd_refer_specialist', action: 'REFER' }]
    },
    descriptionVi: 'Albumin niệu A3 kết hợp tiểu máu vi thể gợi ý viêm cầu thận tiến triển.'
  },

  // 16. Dòng CÂN NHẮC khi thiếu Kali máu
  {
    id: 'ckd_16_missing_k_consider',
    titleVi: 'Cân nhắc định lượng Kali huyết thanh khi chưa có kết quả',
    source: 'KDIGO 2024 CKD / kdigo.ckd.2024.pp_3_6_2_rasi_monitoring',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_16',
      name: 'BN CKD 16',
      age: 60,
      sex: 'male',
      weight: 70,
      sbp: 130,
      dbp: 80,
      hr: 72,
      scr: 130,
      // k undefined
      conditions: { ckd: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'missing_input_k', action: 'CONSIDER' }]
    },
    descriptionVi: 'Thiếu Kali máu sinh dòng CÂN NHẮC yêu cầu nhập K+ để đánh giá.'
  },

  // 17. Dòng CÂN NHẮC khi thiếu UACR
  {
    id: 'ckd_17_missing_uacr_consider',
    titleVi: 'Cân nhắc xét nghiệm UACR nước tiểu khi chưa có kết quả',
    source: 'KDIGO 2024 CKD / kdigo.ckd.2024.table_3_albuminuria_categories',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_17',
      name: 'BN CKD 17',
      age: 61,
      sex: 'female',
      weight: 58,
      sbp: 128,
      dbp: 80,
      hr: 74,
      scr: 120,
      k: 4.4,
      // uacr undefined
      conditions: { ckd: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'missing_input_uacr', action: 'CONSIDER' }]
    },
    descriptionVi: 'Thiếu UACR sinh dòng CÂN NHẮC phân tầng A1–A3.'
  },

  // 18. Hướng dẫn ngày ốm ngoại trú
  {
    id: 'ckd_18_sick_day_guidance',
    titleVi: 'Kế hoạch xử trí ngày ốm (Sick-day rules) cho bệnh nhân CKD ngoại trú',
    source: 'KDIGO 2024 CKD PP 3.7.2 / kdigo.ckd.2024.pp_3_7_2_sick_day_hold',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_18',
      name: 'BN CKD 18',
      age: 59,
      sex: 'male',
      weight: 68,
      sbp: 126,
      dbp: 80,
      hr: 72,
      scr: 135,
      k: 4.5,
      conditions: { ckd: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'rec_ckd_sick_day_plan', action: 'MONITOR' }]
    },
    descriptionVi: 'Luật giáo dục ngày ốm sinh dòng MONITOR.'
  },

  // 19. Chống chỉ định RASi trong thai kỳ
  {
    id: 'ckd_19_rasi_contra_pregnancy',
    titleVi: 'Chống chỉ định tuyệt đối nhóm RASi ở phụ nữ mang thai mắc CKD',
    source: 'KDIGO 2024 CKD Rec 3.6.1 / kdigo.ckd.2024.rec_3_6_1_rasi_a3_nondm',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_19',
      name: 'BN CKD 19',
      age: 29,
      sex: 'female',
      weight: 56,
      sbp: 138,
      dbp: 88,
      hr: 80,
      scr: 90,
      k: 4.1,
      uacr: 35,
      conditions: { ckd: true, htn: true, pregnant: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'rec_ckd_rasi_contra_preg', action: 'AVOID' }]
    },
    descriptionVi: 'Thai kỳ là chống chỉ định tuyệt đối của ACEi và ARB.'
  },

  // 20. Tránh RASi khi có tiền sử phù mạch
  {
    id: 'ckd_20_rasi_contra_angioedema',
    titleVi: 'Tránh dùng RASi ở bệnh nhân có tiền sử phù mạch do thuốc',
    source: 'KDIGO 2024 CKD Rec 3.6.1 / kdigo.ckd.2024.rec_3_6_1_rasi_a3_nondm',
    settings: defaultSettings,
    patient: {
      id: 'pt_ckd_20',
      name: 'BN CKD 20',
      age: 55,
      sex: 'male',
      weight: 70,
      sbp: 140,
      dbp: 86,
      hr: 74,
      scr: 125,
      k: 4.3,
      uacr: 25,
      conditions: { ckd: true, priorAngioedema: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'rec_ckd_rasi_contra_allergy', action: 'AVOID' }]
    },
    descriptionVi: 'Tiền sử phù mạch chống chỉ định nhóm thuốc ức chế hệ RAS.'
  },

  // 21. Nội viện: Chẩn đoán tổn thương thận cấp AKI Giai đoạn 1
  {
    id: 'ckd_21_inpatient_aki_stage1',
    titleVi: 'Nội viện - Chẩn đoán AKI Giai đoạn 1 khi Creatinin tăng >= 26.5 µmol/L',
    source: 'KDIGO 2012 AKI Table 2 / kdigo.aki.2012.table_2_staging',
    settings: inpatientSettings,
    patient: {
      id: 'pt_ckd_21',
      name: 'BN CKD 21',
      age: 68,
      sex: 'male',
      weight: 65,
      sbp: 118,
      dbp: 72,
      hr: 78,
      scr: 170, // Tăng từ 135 (+35 µmol/L)
      k: 4.6,
      conditions: { ckd: true },
      customInputs: { baselineScr: 135, akiSuspected: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'rec_ckd_aki_stage_alert', action: 'MONITOR' }]
    },
    descriptionVi: 'Creatinin tăng >= 26.5 µmol/L chẩn đoán AKI Stage 1.'
  },

  // 22. Nội viện: Tạm ngừng thuốc ngày ốm (Empagliflozin + Enalapril) khi có AKI
  {
    id: 'ckd_22_inpatient_aki_stage2_hold',
    titleVi: 'Nội viện - Tạm ngừng Empagliflozin và Enalapril khi có AKI Giai đoạn 2',
    source: 'KDIGO 2024 CKD PP 3.7.2 / kdigo.ckd.2024.pp_3_7_2_sick_day_hold',
    settings: inpatientSettings,
    patient: {
      id: 'pt_ckd_22',
      name: 'BN CKD 22',
      age: 72,
      sex: 'male',
      weight: 66,
      sbp: 108,
      dbp: 66,
      hr: 82,
      scr: 260, // Tăng từ 120 (ratio 2.16x -> Stage 2)
      k: 5.2,
      conditions: { ckd: true, dm: true },
      customInputs: { baselineScr: 120, akiSuspected: true },
      currentMeds: [
        { drugId: 'empagliflozin', name: 'Jardiance 10 mg', dose: 10, unit: 'mg' },
        { drugId: 'enalapril', name: 'Renitec 10 mg', dose: 10, unit: 'mg' }
      ],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'rec_ckd_hold_sick_day', action: 'HOLD' }]
    },
    descriptionVi: 'Bắt buộc HOLD nhóm thuốc ngày ốm trong đợt cấp AKI nội viện.'
  },

  // 23. Nội viện: Chuyển đổi từ ON-CALL icu_aki_rrt_0230 (AKI Stage 3 + Vô niệu -> Chỉ định lọc máu)
  {
    id: 'ckd_23_inpatient_aki_stage3_rrt',
    titleVi: 'Nội viện - Ca icu_aki_rrt_0230: AKI Giai đoạn 3, Vô niệu kéo dài và Toan nặng -> Chỉ định lọc máu',
    source: 'on-call:icu_aki_rrt_0230 / kdigo.aki.2012.table_2_staging',
    settings: inpatientSettings,
    patient: {
      id: 'pt_ckd_23',
      name: 'BN icu_aki_rrt_0230',
      age: 64,
      sex: 'male',
      weight: 68,
      sbp: 164,
      dbp: 94,
      hr: 48,
      scr: 420, // Cr >= 353.6 -> Stage 3
      k: 6.4,
      hco3: 12,
      conditions: { ckd: true },
      customInputs: {
        akiSuspected: true,
        urineOutputRate: 'anuria_12h'
      },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [
        { ruleId: 'rec_ckd_aki_stage_alert', action: 'MONITOR' },
        { ruleId: 'rec_ckd_emergency_rrt', action: 'REFER' }
      ]
    },
    descriptionVi: 'Ca bệnh chuyển từ ON-CALL: Bệnh nhân vô niệu, toan máu nặng có chỉ định cấp cứu lọc máu và hạ kali.'
  },

  // 24. Nội viện: Chuyển đổi từ ON-CALL icu_hyperkalemia_0320 (K+ 7.2 + ECG sóng T nhọn)
  {
    id: 'ckd_24_inpatient_hyperkalemia_severe',
    titleVi: 'Nội viện - Ca icu_hyperkalemia_0320: Tăng Kali máu nặng (7.2 mmol/L + ECG sóng T nhọn) -> Canxi TM + Insulin-Glucose',
    source: 'on-call:icu_hyperkalemia_0320 / ukka.2022.guideline_16_2_calcium_salts',
    settings: inpatientSettings,
    patient: {
      id: 'pt_ckd_24',
      name: 'BN icu_hyperkalemia_0320',
      age: 63,
      sex: 'male',
      weight: 68,
      sbp: 100,
      dbp: 64,
      hr: 52,
      scr: 520,
      k: 7.2, // K+ nặng
      hco3: 15,
      conditions: { ckd: true },
      customInputs: {
        ecgHyperkalemia: true
      },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [
        { ruleId: 'rec_ckd_hyperkalemia_severe_bundle', action: 'START' },
        { ruleId: 'rec_ckd_emergency_rrt', action: 'REFER' }
      ]
    },
    descriptionVi: 'Ca bệnh chuyển từ ON-CALL: Tăng kali máu nguy kịch có biến đổi ECG yêu cầu tiêm canxi tĩnh mạch khẩn cấp và lọc máu.'
  },

  // 25. Nội viện: Tăng Kali máu trung bình (K+ 6.2 mmol/L)
  {
    id: 'ckd_25_inpatient_hyperkalemia_moderate',
    titleVi: 'Nội viện - Xử trí tăng kali máu trung bình (6.2 mmol/L) bằng Insulin-Glucose',
    source: 'UKKA 2022 Guideline 16.3.2 / ukka.2022.guideline_16_3_2_insulin_glucose_moderate',
    settings: inpatientSettings,
    patient: {
      id: 'pt_ckd_25',
      name: 'BN CKD 25',
      age: 61,
      sex: 'female',
      weight: 60,
      sbp: 130,
      dbp: 80,
      hr: 74,
      scr: 190,
      k: 6.2, // 6.0 - 6.4
      conditions: { ckd: true },
      customInputs: {},
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'rec_ckd_hyperkalemia_mod', action: 'START' }]
    },
    descriptionVi: 'Tăng kali trung bình 6.0–6.4 chỉ định insulin-glucose tĩnh mạch.'
  },

  // 26. Nội viện: Dự phòng AKI do thuốc cản quang iod
  {
    id: 'ckd_26_inpatient_ci_aki_prevention',
    titleVi: 'Nội viện - Gói dự phòng tổn thương thận cấp do thuốc cản quang (CI-AKI)',
    source: 'KDIGO 2012 AKI Rec 4.3.2 & 4.4.1 / kdigo.aki.2012.ci_aki_iso_low_osmolar',
    settings: inpatientSettings,
    patient: {
      id: 'pt_ckd_26',
      name: 'BN CKD 26',
      age: 67,
      sex: 'male',
      weight: 68,
      sbp: 132,
      dbp: 80,
      hr: 76,
      scr: 185, // eGFR ~33 < 60
      conditions: { ckd: true },
      customInputs: { contrastPlanned: true },
      currentMeds: [],
      selectedModules: ['ckd']
    },
    expect: {
      mustInclude: [{ ruleId: 'rec_ckd_ci_aki_bundle', action: 'START' }]
    },
    descriptionVi: 'Bệnh nhân có eGFR < 60 cần chụp thuốc cản quang có chỉ định bù dịch dự phòng.'
  }
];

// Ghi từng ca ra file JSON
for (const tc of cases) {
  const filePath = join(GOLDEN_CKD_DIR, `${tc.id}.json`);
  writeFileSync(filePath, JSON.stringify(tc, null, 2), 'utf8');
}

console.log(`Đã tạo thành công ${cases.length} Golden Cases tại tests/golden/ckd/!`);
