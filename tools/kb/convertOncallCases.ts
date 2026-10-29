/**
 * Tool chuyển đổi 13 ca ON CALL sang định dạng Golden Case nháp
 * Phân quyền: Agent C
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { GoldenCase } from '../../src/kb-types/goldenCase';
import type { ModuleId } from '../../src/engine/types';

const ONCALL_CASES_DIR = 'C:\\Users\\hades\\OneDrive\\Desktop\\New folder (4)\\on-call\\src\\content\\cases';
const OUTPUT_DIR = resolve(process.cwd(), 'gdmt-vn', 'tests', 'golden', '_from_oncall');

interface OncallCaseRaw {
  id: string;
  title: string;
  patient: {
    age?: number;
    sex?: string;
    weightKg?: number;
    label?: string;
  };
  initialVitals: {
    sbp?: number;
    dbp?: number;
    hr?: number;
    rr?: number;
    spo2?: number;
    temp?: number;
    gcs?: number;
  };
  presentation?: {
    nurseCall?: string;
    bedside?: string[];
  };
  orders?: Array<{
    id: string;
    result?: {
      textVi?: string;
      summaryVi?: string;
    };
  }>;
}

const TARGET_CASES: Record<string, { modules: ModuleId[]; conditions: Record<string, boolean>; defaultLabs?: Record<string, number> }> = {
  icu_dka_0130: {
    modules: ['dm2'],
    conditions: { dm: true },
    defaultLabs: { glucose: 26.5, k: 5.2, hco3: 11, na: 132 },
  },
  icu_hhs_hyperosmolar_0210: {
    modules: ['dm2'],
    conditions: { dm: true },
    defaultLabs: { glucose: 38.0, k: 4.8, na: 148, scr: 180 },
  },
  er_hypoglycemia_0415: {
    modules: ['dm2', 'ckd'],
    conditions: { dm: true, ckd: true },
    defaultLabs: { glucose: 2.1, scr: 160 },
  },
  icu_hyperkalemia_0320: {
    modules: ['ckd'],
    conditions: { ckd: true },
    defaultLabs: { k: 7.2, scr: 520, hco3: 15 },
  },
  icu_aki_rrt_0230: {
    modules: ['ckd'],
    conditions: { ckd: true },
    defaultLabs: { k: 6.4, scr: 420, hco3: 12 },
  },
  im_hypertensive_emergency_0135: {
    modules: ['htn'],
    conditions: {},
    defaultLabs: { scr: 140 },
  },
  icu_hypertensive_urgency_stepdown_1620: {
    modules: ['htn'],
    conditions: {},
    defaultLabs: { scr: 110 },
  },
  im_acute_gout_monoarthritis_1520: {
    modules: ['gout', 'ckd'],
    conditions: { gout: true, ckd: true },
    defaultLabs: { uricAcid: 560, scr: 150, egfr: 42 },
  },
  im_acute_hf_0310: {
    modules: ['hf'],
    conditions: { hf: true },
    defaultLabs: { scr: 130, k: 4.2 },
  },
  im_heart_failure_gdmt_predischarge_1020: {
    modules: ['hf', 'ckd'],
    conditions: { hf: true, ckd: true },
    defaultLabs: { scr: 120, k: 4.5, lvef: 32 },
  },
  im_af_rvr_1940: {
    modules: ['af', 'hf'],
    conditions: { hf: true },
    defaultLabs: { scr: 95, k: 4.1 },
  },
  im_copd_exacerbation_0245: {
    modules: ['copd'],
    conditions: { copd: true },
    defaultLabs: { eos: 250 },
  },
  er_asthma_0218: {
    modules: ['asthma'],
    conditions: { asthma: true },
    defaultLabs: { fev1Pct: 45 },
  },
};

export function convertCases() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Bắt đầu chuyển đổi 13 ca từ ${ONCALL_CASES_DIR}...`);

  let count = 0;
  for (const [caseId, meta] of Object.entries(TARGET_CASES)) {
    const srcPath = join(ONCALL_CASES_DIR, `${caseId}.json`);
    if (!existsSync(srcPath)) {
      console.warn(`[Cảnh báo] Không tìm thấy file ca: ${srcPath}`);
      continue;
    }

    const raw: OncallCaseRaw = JSON.parse(readFileSync(srcPath, 'utf8'));

    const isFemale =
      raw.patient?.sex === 'Nữ' ||
      raw.patient?.sex === 'female' ||
      (raw.patient?.label && raw.patient.label.toLowerCase().includes('nữ'));

    const descParts: string[] = [];
    if (raw.presentation?.nurseCall) descParts.push(raw.presentation.nurseCall);
    if (raw.presentation?.bedside) descParts.push(raw.presentation.bedside.join(' '));

    const goldenCase: GoldenCase = {
      id: raw.id,
      titleVi: raw.title.replace(/^\d{2}:\d{2}\s*—\s*/, ''), // bỏ prefix giờ nếu có
      source: `on-call:${raw.id}`,
      settings: {
        setting: 'inpatient',
        profile: 'INTL',
        units: {
          cr: 'umol_L',
          glucose: 'mmol_L',
          lipid: 'mmol_L',
          urat: 'umol_L',
          uacr: 'mg_mmol',
          hba1c: 'pct',
        },
        score2Region: 'high',
        fontScale: 'normal',
        theme: 'light',
        onlyReviewed: false,
      },
      patient: {
        id: `pt_${raw.id}`,
        name: raw.patient?.label ?? 'Bệnh nhân nội viện',
        age: raw.patient?.age ?? 60,
        sex: isFemale ? 'female' : 'male',
        weight: raw.patient?.weightKg ?? 65,
        sbp: raw.initialVitals?.sbp ?? 120,
        dbp: raw.initialVitals?.dbp ?? 80,
        hr: raw.initialVitals?.hr ?? 75,
        conditions: meta.conditions,
        selectedModules: meta.modules,
        currentMeds: [],
        ...(meta.defaultLabs ?? {}),
      },
      expect: {
        mustInclude: [],
        mustNotInclude: [],
        alertsInclude: [],
      },
      descriptionVi: descParts.join(' ').trim(),
      notes: 'TODO: Ca nháp nội viện chuyển từ on-call. Module agent chịu trách nhiệm điền expect.mustInclude và mustNotInclude.',
    };

    const outPath = join(OUTPUT_DIR, `${caseId}.json`);
    writeFileSync(outPath, JSON.stringify(goldenCase, null, 2), 'utf8');
    console.log(`✔ Đã tạo: ${caseId}.json`);
    count++;
  }

  console.log(`\nHoàn thành chuyển đổi ${count}/13 ca thành công vào: ${OUTPUT_DIR}\n`);
}

if (process.argv[1] && process.argv[1].endsWith('convertOncallCases.ts')) {
  convertCases();
}
