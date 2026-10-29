import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const GOLDEN_DIR = resolve(process.cwd(), 'tests', 'golden', 'asthma');
mkdirSync(GOLDEN_DIR, { recursive: true });

const defaultSettings = {
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

const cases = [
  {
    id: 'asthma_01_track1_step1_intermittent',
    titleVi: 'Hen mới chẩn đoán: Triệu chứng ngắt quãng nhẹ (Track 1 Bậc 1–2)',
    source: 'GINA 2026 Strategy Report / Summary Guide',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_01',
      name: 'Nam 24 tuổi',
      age: 24,
      sex: 'male',
      weight: 62,
      sbp: 118,
      dbp: 74,
      hr: 76,
      rhythm: 'sinus',
      fev1Pct: 86,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 0,
        daytimeSymptomsMoreThanTwiceWeek: false,
        nightWakingDueToAsthma: false,
        relieverNeededMoreThanTwiceWeek: false,
        activityLimitationDueToAsthma: false
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'budesonide_formoterol', action: 'START' }
      ],
      mustNotInclude: [
        { drugId: 'salbutamol', action: 'START' }
      ],
      alertsInclude: []
    },
    descriptionVi: 'BN hen nhẹ triệu chứng < 2 lần/tuần khởi đầu Track 1: Budesonide-formoterol liều thấp khi cần (AIR-only).'
  },
  {
    id: 'asthma_02_track1_step2_mild',
    titleVi: 'Hen Bậc 2 triệu chứng nhẹ: Khởi đầu Track 1 AIR khi cần',
    source: 'GINA 2026 Strategy Report',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_02',
      name: 'Nữ 28 tuổi',
      age: 28,
      sex: 'female',
      weight: 52,
      sbp: 112,
      dbp: 70,
      hr: 78,
      rhythm: 'sinus',
      fev1Pct: 82,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 1,
        daytimeSymptomsMoreThanTwiceWeek: true,
        nightWakingDueToAsthma: false,
        relieverNeededMoreThanTwiceWeek: false,
        activityLimitationDueToAsthma: false
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'budesonide_formoterol', action: 'START' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân Bậc 2 có triệu chứng ban ngày > 2 lần/tuần, dùng Track 1 AIR.'
  },
  {
    id: 'asthma_03_track1_step3_moderate',
    titleVi: 'Hen Bậc 2 không kiểm soát: Tăng bậc lên Track 1 Bậc 3 MART',
    source: 'GINA 2026 Strategy Report',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_03',
      name: 'Nam 34 tuổi',
      age: 34,
      sex: 'male',
      weight: 68,
      sbp: 122,
      dbp: 78,
      hr: 80,
      rhythm: 'sinus',
      fev1Pct: 74,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'budesonide', dose: '200 mcg x 2 lần/ngày', freq: '2 lần/ngày' }
      ],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 2,
        daytimeSymptomsMoreThanTwiceWeek: true,
        nightWakingDueToAsthma: true,
        relieverNeededMoreThanTwiceWeek: true,
        activityLimitationDueToAsthma: false,
        inhalerTechniqueCorrect: true,
        goodAdherence: true
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'budesonide_formoterol', action: 'UPTITRATE' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân không kiểm soát ở Bậc 2 dù tuân thủ và kỹ thuật đúng, tăng lên Bậc 3 MART.'
  },
  {
    id: 'asthma_04_track1_step4_uncontrolled_step3',
    titleVi: 'Hen Bậc 3 MART không kiểm soát: Tăng lên Bậc 4 MART liều trung bình',
    source: 'GINA 2026 Strategy Report',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_04',
      name: 'Nữ 42 tuổi',
      age: 42,
      sex: 'female',
      weight: 58,
      sbp: 118,
      dbp: 75,
      hr: 84,
      rhythm: 'sinus',
      fev1Pct: 65,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'budesonide_formoterol', dose: '160/4.5 mcg x 1 nhát x 2 lần/ngày', freq: '2 lần/ngày' }
      ],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 3,
        daytimeSymptomsMoreThanTwiceWeek: true,
        nightWakingDueToAsthma: true,
        relieverNeededMoreThanTwiceWeek: true,
        activityLimitationDueToAsthma: true,
        inhalerTechniqueCorrect: true,
        goodAdherence: true
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'budesonide_formoterol', action: 'UPTITRATE' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân Bậc 3 không kiểm soát (4 tiêu chí), kỹ thuật đúng, tăng lên Bậc 4 MART (2 nhát x 2 lần/ngày).'
  },
  {
    id: 'asthma_05_track1_step5_severe_eosinophilic',
    titleVi: 'Hen nặng Bậc 5: BCAT máu cao (Type 2) → Chuyển chuyên khoa & Thuốc sinh học',
    source: 'GINA 2026 Strategy Report',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_05',
      name: 'Nam 50 tuổi',
      age: 50,
      sex: 'male',
      weight: 72,
      sbp: 125,
      dbp: 80,
      hr: 82,
      rhythm: 'sinus',
      fev1Pct: 56,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'budesonide_formoterol', dose: '160/4.5 mcg x 2 nhát x 2 lần/ngày', freq: '2 lần/ngày' }
      ],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 4,
        daytimeSymptomsMoreThanTwiceWeek: true,
        nightWakingDueToAsthma: true,
        relieverNeededMoreThanTwiceWeek: true,
        activityLimitationDueToAsthma: true,
        inhalerTechniqueCorrect: true,
        goodAdherence: true,
        bloodEosinophils: 480
      }
    },
    expect: {
      mustInclude: [
        { ruleId: 'rec_asthma_track1_step5_lama_biologic', action: 'REFER' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân Bậc 4 không kiểm soát có BCAT máu 480 cells/uL, chỉ định Bậc 5 thêm LAMA và xét thuốc sinh học.'
  },
  {
    id: 'asthma_06_track1_step5_severe_allergic',
    titleVi: 'Hen nặng Bậc 5: Kiểu hình dị ứng nổi trội → Chỉ định Omalizumab',
    source: 'GINA 2026 Strategy Report',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_06',
      name: 'Nữ 36 tuổi',
      age: 36,
      sex: 'female',
      weight: 50,
      sbp: 115,
      dbp: 72,
      hr: 78,
      rhythm: 'sinus',
      fev1Pct: 59,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'budesonide_formoterol', dose: '160/4.5 mcg x 2 nhát x 2 lần/ngày', freq: '2 lần/ngày' }
      ],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 4,
        daytimeSymptomsMoreThanTwiceWeek: true,
        nightWakingDueToAsthma: true,
        relieverNeededMoreThanTwiceWeek: true,
        activityLimitationDueToAsthma: true,
        inhalerTechniqueCorrect: true,
        goodAdherence: true,
        allergicPhenotype: true
      }
    },
    expect: {
      mustInclude: [
        { ruleId: 'rec_asthma_track1_step5_lama_biologic', action: 'REFER' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân Bậc 4 không kiểm soát có kiểu hình dị ứng, chuyển chuyên khoa xét nghiệm Omalizumab.'
  },
  {
    id: 'asthma_07_track2_step1_alt',
    titleVi: 'Track 2 Bậc 1: ICS liều thấp mỗi khi dùng SABA cắt cơn',
    source: 'GINA 2026 Strategy Report',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_07',
      name: 'Nam 26 tuổi',
      age: 26,
      sex: 'male',
      weight: 60,
      sbp: 120,
      dbp: 76,
      hr: 75,
      rhythm: 'sinus',
      fev1Pct: 88,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        currentTrack: 'track2',
        currentStep: 1,
        daytimeSymptomsMoreThanTwiceWeek: false,
        nightWakingDueToAsthma: false,
        relieverNeededMoreThanTwiceWeek: false,
        activityLimitationDueToAsthma: false
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'fluticasone_propionate', action: 'START' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân chọn Track 2 Bậc 1: Dùng Fluticasone propionate liều thấp mỗi khi xịt SABA.'
  },
  {
    id: 'asthma_08_track2_step2_mild',
    titleVi: 'Track 2 Bậc 2: Fluticasone propionate duy trì liều thấp hàng ngày',
    source: 'GINA 2026 Strategy Report',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_08',
      name: 'Nữ 30 tuổi',
      age: 30,
      sex: 'female',
      weight: 55,
      sbp: 114,
      dbp: 72,
      hr: 76,
      rhythm: 'sinus',
      fev1Pct: 80,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        currentTrack: 'track2',
        currentStep: 2,
        daytimeSymptomsMoreThanTwiceWeek: true,
        nightWakingDueToAsthma: false,
        relieverNeededMoreThanTwiceWeek: false,
        activityLimitationDueToAsthma: false
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'fluticasone_propionate', action: 'START' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Track 2 Bậc 2: Duy trì Fluticasone propionate liều thấp hàng ngày + SABA khi cần.'
  },
  {
    id: 'asthma_09_track2_step3_moderate',
    titleVi: 'Track 2 Bậc 3: Fluticasone/salmeterol liều thấp duy trì',
    source: 'GINA 2026 Strategy Report',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_09',
      name: 'Nam 45 tuổi',
      age: 45,
      sex: 'male',
      weight: 70,
      sbp: 124,
      dbp: 78,
      hr: 80,
      rhythm: 'sinus',
      fev1Pct: 70,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        currentTrack: 'track2',
        currentStep: 3,
        daytimeSymptomsMoreThanTwiceWeek: true,
        nightWakingDueToAsthma: true,
        relieverNeededMoreThanTwiceWeek: false,
        activityLimitationDueToAsthma: false
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'fluticasone_salmeterol', action: 'START' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Track 2 Bậc 3: Khởi trị Fluticasone/salmeterol 125/25 x 2 lần/ngày + SABA khi cần.'
  },
  {
    id: 'asthma_10_track2_step4_severe',
    titleVi: 'Track 2 Bậc 4: Fluticasone/salmeterol liều trung bình duy trì',
    source: 'GINA 2026 Strategy Report',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_10',
      name: 'Nữ 52 tuổi',
      age: 52,
      sex: 'female',
      weight: 64,
      sbp: 128,
      dbp: 82,
      hr: 84,
      rhythm: 'sinus',
      fev1Pct: 62,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        currentTrack: 'track2',
        currentStep: 4,
        daytimeSymptomsMoreThanTwiceWeek: true,
        nightWakingDueToAsthma: true,
        relieverNeededMoreThanTwiceWeek: true,
        activityLimitationDueToAsthma: false
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'fluticasone_salmeterol', action: 'START' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Track 2 Bậc 4: Fluticasone/salmeterol 250/25 x 2 lần/ngày + SABA khi cần.'
  },
  {
    id: 'asthma_11_step_down_stable_6m',
    titleVi: 'Hen kiểm soát tốt ổn định 6 tháng: Xem xét hạ bậc giảm 25–50% liều ICS',
    source: 'GINA 2026 Strategy Report Box 4-13',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_11',
      name: 'Nữ 38 tuổi',
      age: 38,
      sex: 'female',
      weight: 56,
      sbp: 116,
      dbp: 74,
      hr: 72,
      rhythm: 'sinus',
      fev1Pct: 90,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'budesonide_formoterol', dose: '160/4.5 mcg x 1 nhát x 2 lần/ngày', freq: '2 lần/ngày' }
      ],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 3,
        daytimeSymptomsMoreThanTwiceWeek: false,
        nightWakingDueToAsthma: false,
        relieverNeededMoreThanTwiceWeek: false,
        activityLimitationDueToAsthma: false,
        wellControlledMonths: 6,
        inhalerTechniqueCorrect: true,
        goodAdherence: true
      }
    },
    expect: {
      mustInclude: [
        { ruleId: 'rec_asthma_step_down_consider', action: 'CONSIDER' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'BN Bậc 3 kiểm soát tốt ổn định 6 tháng liên tục -> Xem xét hạ bậc giảm 25–50% liều ICS duy trì.'
  },
  {
    id: 'asthma_12_under_12_blocked',
    titleVi: 'Chặn tuổi: Trẻ 9 tuổi (< 12 tuổi) không áp dụng phác đồ người lớn',
    source: 'GINA 2026 Strategy Report / QĐ 1851/BYT',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_12',
      name: 'Bé trai 9 tuổi',
      age: 9,
      sex: 'male',
      weight: 28,
      sbp: 95,
      dbp: 60,
      hr: 90,
      rhythm: 'sinus',
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        daytimeSymptomsMoreThanTwiceWeek: true
      }
    },
    expect: {
      mustInclude: [
        { ruleId: 'rec_asthma_age_under_12', action: 'CONSIDER' }
      ],
      mustNotInclude: [
        { drugId: 'budesonide_formoterol', action: 'START' }
      ],
      alertsInclude: []
    },
    descriptionVi: 'Trẻ 9 tuổi (< 12 tuổi) bị chặn, không sinh khuyến cáo thuốc người lớn.'
  },
  {
    id: 'asthma_13_saba_monotherapy_warning',
    titleVi: 'Cảnh báo nguy hiểm: Dùng SABA đơn độc không có ICS',
    source: 'GINA 2026 Strategy Report / QĐ 1851/BYT',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_13',
      name: 'Nam 25 tuổi',
      age: 25,
      sex: 'male',
      weight: 62,
      sbp: 120,
      dbp: 75,
      hr: 80,
      rhythm: 'sinus',
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'salbutamol', dose: '100 mcg khi cần', freq: 'khi cần' }
      ],
      customInputs: {
        sabaOnly: true
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'salbutamol', action: 'STOP' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân đang dùng Salbutamol đơn độc -> Bắt buộc ngừng và chuyển sang phối hợp ICS.'
  },
  {
    id: 'asthma_14_nonselective_betablocker_contra',
    titleVi: 'Chống chỉ định: Thuốc chẹn beta không chọn lọc (Carvedilol) ở người hen',
    source: 'GINA 2026 Strategy Report',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_14',
      name: 'Nam 55 tuổi',
      age: 55,
      sex: 'male',
      weight: 70,
      sbp: 135,
      dbp: 85,
      hr: 75,
      rhythm: 'sinus',
      conditions: { asthma: true, htn: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'carvedilol', dose: '12.5 mg x 2 lần/ngày', freq: '2 lần/ngày' }
      ],
      customInputs: {}
    },
    expect: {
      mustInclude: [
        { drugId: 'carvedilol', action: 'AVOID' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân hen đang dùng Carvedilol -> Cảnh báo chống chỉ định đối kháng beta-2 gây co thắt phế quản.'
  },
  {
    id: 'asthma_15_montelukast_psych_warning',
    titleVi: 'Cảnh báo FDA: Tác dụng phụ tâm thần kinh của Montelukast',
    source: 'GINA 2026 Strategy Report / FDA Boxed Warning',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_15',
      name: 'Nữ 30 tuổi',
      age: 30,
      sex: 'female',
      weight: 52,
      sbp: 110,
      dbp: 70,
      hr: 74,
      rhythm: 'sinus',
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'montelukast', dose: '10 mg/ngày', freq: '1 lần tối' }
      ],
      customInputs: {
        priorNeuropsychiatric: true
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'montelukast', action: 'MONITOR' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân dùng Montelukast có tiền sử tâm thần kinh -> Cảnh báo theo dõi FDA Boxed Warning.'
  },
  {
    id: 'asthma_16_inpatient_acute_mild_moderate',
    titleVi: 'Cơn hen phế quản cấp nhẹ - trung bình tại Cấp cứu',
    source: 'Bộ Y tế QĐ 5850/2021 & GINA 2026 Box 9-3',
    settings: { ...defaultSettings, setting: 'inpatient' },
    patient: {
      id: 'pt_asthma_16',
      name: 'Nam 35 tuổi',
      age: 35,
      sex: 'male',
      weight: 65,
      sbp: 122,
      dbp: 78,
      hr: 98,
      rhythm: 'sinus',
      fev1Pct: 65,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        isAcuteExacerbation: true,
        speechAbility: 'sentences',
        respiratoryRate: 22,
        accessoryMuscleUse: false,
        silentChest: false,
        mentalStatus: 'alert',
        pefPct: 65,
        spo2: 95
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'salbutamol', action: 'START' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Cơn hen nhẹ-vừa: Nói cả câu, HR 98, RR 22, SpO2 95% -> SABA xịt định liều + Prednisolone uống 5-7 ngày.'
  },
  {
    id: 'asthma_17_er_asthma_0218',
    titleVi: 'Cơn hen cấp nặng tại Cấp cứu (Ca on-call er_asthma_0218)',
    source: 'on-call:er_asthma_0218 / GINA 2026',
    settings: { ...defaultSettings, setting: 'inpatient' },
    patient: {
      id: 'pt_er_asthma_0218',
      name: 'Nữ 29 tuổi',
      age: 29,
      sex: 'female',
      weight: 54,
      sbp: 142,
      dbp: 86,
      hr: 128,
      rhythm: 'sinus',
      fev1Pct: 45,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        isAcuteExacerbation: true,
        speechAbility: 'words',
        respiratoryRate: 32,
        accessoryMuscleUse: true,
        silentChest: false,
        mentalStatus: 'anxious',
        pefPct: 45,
        spo2: 88
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'salbutamol', action: 'START' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Cơn hen cấp nặng: Nói từng từ, co kéo cơ hô hấp, HR 128, RR 32, SpO2 88% -> Phác đồ hồi sức cấp cứu phối hợp SABA + Ipratropium + Corticoid TM.'
  },
  {
    id: 'asthma_18_inpatient_acute_life_threatening',
    titleVi: 'Cơn hen nguy kịch đe dọa tính mạng: Phổi im lặng & Lơ mơ → Báo động ICU + Thuốc hồi sức',
    source: 'GINA 2026 Box 9-3 / BYT 5850/2021',
    settings: { ...defaultSettings, setting: 'inpatient' },
    patient: {
      id: 'pt_asthma_18',
      name: 'Nam 44 tuổi',
      age: 44,
      sex: 'male',
      weight: 72,
      sbp: 140,
      dbp: 90,
      hr: 135,
      rhythm: 'sinus',
      fev1Pct: 30,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        isAcuteExacerbation: true,
        speechAbility: 'unable',
        respiratoryRate: 36,
        silentChest: true,
        mentalStatus: 'drowsy_confused',
        spo2: 82
      }
    },
    expect: {
      mustInclude: [
        { ruleId: 'rec_asthma_acute_life_threatening_icu', action: 'REFER' },
        { drugId: 'salbutamol', action: 'START' }
      ],
      mustNotInclude: [
        { ruleId: 'rec_asthma_action_plan_doc', action: 'MONITOR' }
      ],
      alertsInclude: []
    },
    descriptionVi: 'Cơn hen đe dọa tử vong: Lồng ngực im lặng, lơ mơ -> Báo động ICU VÀ phát sinh đồng thời gói thuốc hồi sức cấp cứu (Salbutamol+Ipratropium+Methylprednisolone), không sinh action plan tại nhà.'
  },
  {
    id: 'asthma_19_inpatient_discharge_plan',
    titleVi: 'Kế hoạch ra viện sau đợt cấp hen: Chuyển sang Track 1 MART & Hẹn tái khám',
    source: 'GINA 2026 Strategy Report / BYT 5850',
    settings: { ...defaultSettings, setting: 'inpatient' },
    patient: {
      id: 'pt_asthma_19',
      name: 'Nữ 33 tuổi',
      age: 33,
      sex: 'female',
      weight: 56,
      sbp: 118,
      dbp: 76,
      hr: 78,
      rhythm: 'sinus',
      fev1Pct: 78,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        acuteResponseAfter1h: 'good_response'
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'budesonide_formoterol', action: 'START' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân ổn định sau xử trí cơn hen -> Kế hoạch ra viện với phác đồ Track 1 MART, uống đủ OCS 5-7 ngày và hẹn tái khám 2-7 ngày.'
  },
  {
    id: 'asthma_20_poor_inhaler_technique_no_stepup',
    titleVi: 'Kỹ thuật hít sai: Bắt buộc sửa kỹ thuật trước khi tăng bậc',
    source: 'GINA 2026 Strategy Report Box 4-4',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_20',
      name: 'Nữ 29 tuổi',
      age: 29,
      sex: 'female',
      weight: 53,
      sbp: 110,
      dbp: 70,
      hr: 76,
      rhythm: 'sinus',
      fev1Pct: 70,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'budesonide', dose: '200 mcg x 2 lần/ngày', freq: '2 lần/ngày' }
      ],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 2,
        daytimeSymptomsMoreThanTwiceWeek: true,
        nightWakingDueToAsthma: true,
        relieverNeededMoreThanTwiceWeek: true,
        activityLimitationDueToAsthma: false,
        inhalerTechniqueCorrect: false,
        goodAdherence: true
      }
    },
    expect: {
      mustInclude: [
        { ruleId: 'rec_asthma_check_technique_first', action: 'MONITOR' }
      ],
      mustNotInclude: [
        { drugId: 'budesonide_formoterol', action: 'UPTITRATE' }
      ],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân chưa kiểm soát nhưng kỹ thuật hít sai -> Không tăng bậc, yêu cầu sửa kỹ thuật hít trước.'
  },
  {
    id: 'asthma_21_mart_overuse_warning',
    titleVi: 'Cảnh báo quá liều MART: Đã dùng > 12 nhát hít formoterol trong ngày',
    source: 'GINA 2026 Table 7 / Box 9-2',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_21',
      name: 'Nam 37 tuổi',
      age: 37,
      sex: 'male',
      weight: 68,
      sbp: 124,
      dbp: 80,
      hr: 104,
      rhythm: 'sinus',
      fev1Pct: 62,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'budesonide_formoterol', dose: '160/4.5 mcg', freq: 'khi cần' }
      ],
      customInputs: {
        totalDailyPuffsUsed: 15
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'budesonide_formoterol', action: 'HOLD' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân dùng 15 nhát hít formoterol trong ngày (> 12 nhát) -> Cảnh báo quá liều khẩn cấp.'
  },
  {
    id: 'asthma_22_action_plan_generated',
    titleVi: 'Tự động tạo Bản kế hoạch hành động hen tiếng Việt (3 vùng màu)',
    source: 'Bộ Y tế QĐ 5850/2021 Phụ lục 4 & GINA 2026',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_22',
      name: 'Phạm Thị M (40 tuổi)',
      age: 40,
      sex: 'female',
      weight: 58,
      sbp: 118,
      dbp: 76,
      hr: 74,
      rhythm: 'sinus',
      fev1Pct: 88,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        currentTrack: 'track1',
        pefPct: 90
      }
    },
    expect: {
      mustInclude: [
        { ruleId: 'rec_asthma_action_plan_doc', action: 'MONITOR' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Tự động tạo bản Kế hoạch hành động hen tiếng Việt chuẩn y khoa để in hoặc sao chép.'
  },
  {
    id: 'asthma_23_laba_monotherapy_stopped',
    titleVi: 'Chống chỉ định: LABA đơn độc (Salmeterol) không có ICS bị STOP',
    source: 'FDA Boxed Warning / GINA 2026 / R3-03',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_23',
      name: 'Nam 38 tuổi',
      age: 38,
      sex: 'male',
      weight: 68,
      sbp: 120,
      dbp: 75,
      hr: 78,
      rhythm: 'sinus',
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'salmeterol', name: 'Salmeterol', dose: '50 mcg x 2 lần/ngày', freq: '2 lần/ngày' }
      ],
      customInputs: {}
    },
    expect: {
      mustInclude: [
        { drugId: 'salmeterol', action: 'STOP' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân dùng Salmeterol đơn độc không có ICS -> Lập tức cảnh báo hộp đen và yêu cầu STOP.'
  },
  {
    id: 'asthma_24_gina_control_1q_missing_fail_closed',
    titleVi: 'Fail-Closed: Chỉ trả lời 1 câu hỏi False -> Yêu cầu nhập đủ 4 câu',
    source: 'GINA 2026 Table 2A / R1-03 / R3-05',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_24',
      name: 'Nữ 31 tuổi',
      age: 31,
      sex: 'female',
      weight: 52,
      sbp: 114,
      dbp: 72,
      hr: 76,
      rhythm: 'sinus',
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        currentTrack: 'track1',
        daytimeSymptomsMoreThanTwiceWeek: false
        // 3 câu còn lại bỏ trống (undefined)
      }
    },
    expect: {
      mustInclude: [
        { ruleId: 'missing_input_daytimeSymptomsMoreThanTwiceWeek', action: 'CONSIDER' }
      ],
      mustNotInclude: [
        { drugId: 'budesonide_formoterol', action: 'START' }
      ],
      alertsInclude: []
    },
    descriptionVi: 'Chỉ trả lời 1 câu hỏi GINA không được kết luận kiểm soát tốt, fail-closed sinh CONSIDER yêu cầu nhập đủ.'
  },
  {
    id: 'asthma_25_step_down_blocked_by_prior_exac',
    titleVi: 'Chặn hạ bậc: Kiểm soát tốt 3 tháng nhưng có đợt cấp trong 12 tháng qua',
    source: 'GINA 2026 Box 2-2B / R1-05 / R3-11',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_25',
      name: 'Nam 46 tuổi',
      age: 46,
      sex: 'male',
      weight: 72,
      sbp: 122,
      dbp: 78,
      hr: 74,
      rhythm: 'sinus',
      fev1Pct: 82,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'budesonide_formoterol', name: 'Symbicort Turbuhaler', dose: '160/4.5 mcg x 1 nhát x 2 lần/ngày', freq: '2 lần/ngày' }
      ],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 3,
        daytimeSymptomsMoreThanTwiceWeek: false,
        nightWakingDueToAsthma: false,
        relieverNeededMoreThanTwiceWeek: false,
        activityLimitationDueToAsthma: false,
        wellControlledMonths: 4,
        exacerbationsLastYear: 1, // Có 1 đợt cấp trong năm qua
        inhalerTechniqueCorrect: true,
        goodAdherence: true
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'budesonide_formoterol', action: 'CONTINUE' }
      ],
      mustNotInclude: [
        { ruleId: 'rec_asthma_step_down_consider', action: 'CONSIDER' }
      ],
      alertsInclude: []
    },
    descriptionVi: 'Có tiền sử đợt cấp trong 12 tháng qua là yếu tố nguy cơ cao, không cho phép tự động hạ bậc dù kiểm soát 4 tháng.'
  },
  {
    id: 'asthma_26_inpatient_life_threatening_has_meds',
    titleVi: 'Cơn hen đe dọa tử vong: Có ĐỦ y lệnh cấp cứu Salbutamol + REFER ICU',
    source: 'BYT 5850/2021 / GINA 2026 / R1-01 / R2-01 / R3-01',
    settings: { ...defaultSettings, setting: 'inpatient' },
    patient: {
      id: 'pt_asthma_26',
      name: 'Nữ 39 tuổi',
      age: 39,
      sex: 'female',
      weight: 56,
      sbp: 145,
      dbp: 92,
      hr: 132,
      rhythm: 'sinus',
      fev1Pct: 28,
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        isAcuteExacerbation: true,
        speechAbility: 'unable',
        respiratoryRate: 38,
        silentChest: true,
        mentalStatus: 'drowsy_confused',
        spo2: 80
      }
    },
    expect: {
      mustInclude: [
        { ruleId: 'rec_asthma_acute_life_threatening_icu', action: 'REFER' },
        { drugId: 'salbutamol', action: 'START' }
      ],
      mustNotInclude: [
        { ruleId: 'rec_asthma_action_plan_doc', action: 'MONITOR' }
      ],
      alertsInclude: []
    },
    descriptionVi: 'Phổi im lặng và lơ mơ bắt buộc có đồng thời Báo động ICU VÀ gói thuốc cấp cứu Salbutamol+Ipratropium+Methylprednisolone.'
  },
  {
    id: 'asthma_27_action_plan_absolute_pef_units',
    titleVi: 'Kế hoạch hành động: Nhập PEF 500 L/phút tính ngưỡng L/phút chuẩn',
    source: 'BYT 5850/2021 Phụ lục 4 / R1-01 / R3-06',
    settings: { ...defaultSettings },
    patient: {
      id: 'pt_asthma_27',
      name: 'Vũ Văn K (35 tuổi)',
      age: 35,
      sex: 'male',
      weight: 65,
      sbp: 120,
      dbp: 80,
      hr: 75,
      rhythm: 'sinus',
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        currentTrack: 'track1',
        pefBestLMin: 500
      }
    },
    expect: {
      mustInclude: [
        { ruleId: 'rec_asthma_action_plan_doc', action: 'MONITOR' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân có PEF tốt nhất 500 L/phút, kế hoạch tính Vùng Xanh > 400 L/phút (không bị nhầm > 64 L/phút).'
  },
  {
    id: 'asthma_28_profile_diff_vietnam',
    titleVi: 'Profile VN: Hiển thị hướng dẫn đặc thù Bộ Y tế QĐ 1851/2020',
    source: 'BYT 1851/2020 / R1-08',
    settings: { ...defaultSettings, profile: 'VN' },
    patient: {
      id: 'pt_asthma_28',
      name: 'Hoàng Văn V (44 tuổi)',
      age: 44,
      sex: 'male',
      weight: 66,
      sbp: 125,
      dbp: 78,
      hr: 76,
      rhythm: 'sinus',
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        currentTrack: 'track1',
        daytimeSymptomsMoreThanTwiceWeek: false,
        nightWakingDueToAsthma: false,
        relieverNeededMoreThanTwiceWeek: false,
        activityLimitationDueToAsthma: false
      }
    },
    expect: {
      mustInclude: [
        { ruleId: 'rec_asthma_profile_diff_vietnam', action: 'MONITOR' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Profile VN kích hoạt hướng dẫn thực hành BHYT và danh mục thuốc của Bộ Y tế Việt Nam.'
  },
  {
    id: 'asthma_29_inpatient_sedative_contraindicated',
    titleVi: 'Cơn hen cấp nội viện: Chống chỉ định thuốc an thần (Diazepam)',
    source: 'GINA 2026 / BYT 5850 / R1-11',
    settings: { ...defaultSettings, setting: 'inpatient' },
    patient: {
      id: 'pt_asthma_29',
      name: 'Trần Thị S (50 tuổi)',
      age: 50,
      sex: 'female',
      weight: 58,
      sbp: 135,
      dbp: 84,
      hr: 105,
      rhythm: 'sinus',
      conditions: { asthma: true },
      selectedModules: ['asthma'],
      currentMeds: [
        { drugId: 'diazepam', name: 'Diazepam', dose: '5 mg', freq: 'khi cần' }
      ],
      customInputs: {
        isAcuteExacerbation: true,
        speechAbility: 'sentences',
        respiratoryRate: 24,
        spo2: 94
      }
    },
    expect: {
      mustInclude: [
        { drugId: 'diazepam', action: 'AVOID' }
      ],
      mustNotInclude: [],
      alertsInclude: []
    },
    descriptionVi: 'Bệnh nhân cơn hen cấp dùng thuốc an thần Diazepam -> Chống chỉ định Class III do ức chế trung tâm hô hấp.'
  }
];

for (const c of cases) {
  const filePath = join(GOLDEN_DIR, `${c.id}.json`);
  writeFileSync(filePath, JSON.stringify(c, null, 2), 'utf8');
}
console.log(`Đã ghi thành công ${cases.length} ca golden tests vào ${GOLDEN_DIR}`);

// Cập nhật ca oncall er_asthma_0218.json
const oncallPath = resolve(process.cwd(), 'tests', 'golden', '_from_oncall', 'er_asthma_0218.json');
const oncallCase = cases.find(c => c.id === 'asthma_17_er_asthma_0218');
if (oncallCase) {
  const oncallData = {
    ...oncallCase,
    id: 'er_asthma_0218',
    source: 'on-call:er_asthma_0218'
  };
  writeFileSync(oncallPath, JSON.stringify(oncallData, null, 2), 'utf8');
  console.log(`Đã cập nhật ca oncall ${oncallPath}`);
}
