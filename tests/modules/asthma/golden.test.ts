/**
 * GDMT-VN Module Hen phế quản (Asthma) - Golden Cases & Action Plan Verification Suite
 * Phân quyền: Agent M
 *
 * Kiểm chứng độc lập toàn bộ 38 ca chuẩn trong `tests/golden/asthma/`
 * kèm kiểm thử đơn vị (unit test) cho trình sinh Kế hoạch hành động hen 3 vùng màu (`actionPlan.ts`).
 */

import { describe, it, expect, vi } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

vi.mock('../../../src/modules/registry', async () => {
  const { asthmaModule } = await import('../../../src/modules/asthma/index');
  const { goutModule } = await import('../../../src/modules/gout/index');
  const map = new Map([
    ['asthma', asthmaModule],
    ['gout', goutModule]
  ]);
  return {
    setDemoEnabled: () => {},
    isDemoEnabled: () => false,
    getAllModules: () => [asthmaModule, goutModule],
    getModule: (id: string) => map.get(id),
    getActiveModules: (ids: string[]) => ids.map((id) => map.get(id)).filter((m): m is typeof asthmaModule => Boolean(m))
  };
});

import { evaluate } from '../../../src/engine/evaluate';
import { generateAsthmaActionPlanVi } from '../../../src/modules/asthma/actionPlan';
import { asthmaPresets } from '../../../src/modules/asthma/presets';
import type { Patient } from '../../../src/engine/types';
import type { GoldenCase, GoldenCaseExpectItem } from '../../../src/kb-types/goldenCase';
import { validateGoldenCase } from '../../../src/kb-types/goldenCase';

const ROOT_DIR = resolve(process.cwd(), 'gdmt-vn');
const ASTHMA_GOLDEN_DIR = existsSync(join(ROOT_DIR, 'tests', 'golden', 'asthma'))
  ? join(ROOT_DIR, 'tests', 'golden', 'asthma')
  : resolve(process.cwd(), 'tests', 'golden', 'asthma');

function matchesExpectItem(
  rec: { id: string; drugId?: string; action: string; dose?: unknown; title?: string },
  item: GoldenCaseExpectItem
): boolean {
  if (item.drugId && rec.drugId !== item.drugId) return false;
  if (item.ruleId && rec.id !== item.ruleId) return false;
  if (rec.action !== item.action) return false;
  if (item.doseContains) {
    const doseStr = JSON.stringify(rec.dose ?? '') + ' ' + (rec.title ?? '');
    if (!doseStr.toLowerCase().includes(item.doseContains.toLowerCase())) return false;
  }
  return true;
}

describe('GDMT-VN Module Hen (asthma) - 69 Golden Cases & Action Plan Suite', () => {
  const files = readdirSync(ASTHMA_GOLDEN_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  it('có ít nhất 69 ca chuẩn hen phế quản (bao phủ toàn diện Round 1, Round 2 & Round 3)', () => {
    expect(files.length).toBeGreaterThanOrEqual(69);
  });

  for (const fileName of files) {
    const filePath = join(ASTHMA_GOLDEN_DIR, fileName);
    const testCase: GoldenCase = JSON.parse(readFileSync(filePath, 'utf8'));

    describe(`[${testCase.id}] ${testCase.titleVi}`, () => {
      it('tuân thủ schema GoldenCase', () => {
        const val = validateGoldenCase(testCase);
        if (!val.valid) {
          throw new Error(`Lỗi schema ${fileName}: ${val.errors.join(', ')}`);
        }
        expect(val.valid).toBe(true);
      });

      it('chạy evaluate() và khớp toàn bộ mustInclude / mustNotInclude', () => {
        const plan = evaluate(testCase.patient, testCase.settings);

        for (const item of testCase.expect.mustInclude) {
          const found = plan.recommendations.some((rec) => matchesExpectItem(rec, item));
          if (!found) {
            const availableRecs = plan.recommendations.map(
              (r) => `${r.drugId || r.id} -> ${r.action} (${r.title})`
            );
            throw new Error(
              `[${fileName}] Thiếu kỳ vọng: drugId=${item.drugId}, ruleId=${item.ruleId}, action=${item.action}, doseContains=${item.doseContains}\nThực tế:\n  - ${availableRecs.join('\n  - ')}`
            );
          }
          expect(found).toBe(true);
        }

        if (testCase.expect.mustNotInclude) {
          for (const item of testCase.expect.mustNotInclude) {
            const prohibited = plan.recommendations.find((rec) => matchesExpectItem(rec, item));
            if (prohibited) {
              throw new Error(
                `[${fileName}] Sinh khuyến cáo bị cấm: drugId=${prohibited.drugId}, ruleId=${prohibited.id}, action=${prohibited.action}`
              );
            }
            expect(prohibited).toBeUndefined();
          }
        }

        // Bất biến tiêu chuẩn toàn cục #4: Thẻ STOP / AVOID / HOLD không bao giờ còn dính chuỗi dose thừa
        for (const rec of plan.recommendations) {
          if (rec.action === 'STOP' || rec.action === 'AVOID' || rec.action === 'HOLD') {
            expect(rec.dose).toBeUndefined();
          }
        }
      });
    });
  }

  describe('Kiểm thử đơn vị Action Plan 3 vùng màu (R1-01, R2-02, R3-06, R3-07)', () => {
    it('PEF tốt nhất 500 L/phút tính Vùng Xanh > 400 L/phút, Vàng 250 – 395 L/phút, Đỏ < 250 L/phút và DPI an toàn', () => {
      const plan = generateAsthmaActionPlanVi({
        patientName: 'Vũ Văn K',
        track: 'track1',
        controllerDrug: 'Symbicort Turbuhaler 160/4.5 mcg',
        relieverDrug: 'Symbicort Turbuhaler 160/4.5 mcg',
        maintenanceDose: '1 nhát x 2 lần/ngày',
        relieverInstructions: '1 nhát khi cần',
        pefBestLMin: 500
      });
      expect(plan).toContain('> 400 L/phút');
      expect(plan).toContain('250 – 395 L/phút');
      expect(plan).toContain('< 250 L/phút');
      expect(plan).not.toContain('64 L/phút');
      // Thiết bị DPI (Turbuhaler) không bao giờ hướng dẫn lắp vào buồng đệm hay máy khí dung (R2-02, R3-07)
      expect(plan).toContain('Bình bột khô Turbuhaler/DPI tuyệt đối KHÔNG dùng qua buồng đệm và KHÔNG đổ vào máy khí dung');
    });

    it('PEF 80% dự đoán giữ nguyên đơn vị % (> 80%, 50% – 79%, < 50%) không nhân nhầm thành 64 L/phút', () => {
      const plan = generateAsthmaActionPlanVi({
        patientName: 'Phạm Thị M',
        track: 'track2',
        controllerDrug: 'Seretide Evohaler 125/25 mcg',
        relieverDrug: 'Salbutamol pMDI 100 mcg',
        maintenanceDose: '2 nhát x 2 lần/ngày',
        relieverInstructions: '2 nhát khi cần',
        pefPct: 80
      });
      expect(plan).toContain('> 80% giá trị dự đoán');
      expect(plan).toContain('50% – 79% giá trị dự đoán');
      expect(plan).toContain('< 50% giá trị dự đoán');
      expect(plan).not.toContain('64 L/phút');
      expect(plan).toContain('4–6 nhát');
      expect(plan).toContain('buồng đệm');
    });

    it('Chế độ AIR-only Bậc 1–2 hiển thị đúng hướng dẫn hít khi cần ở Vùng Xanh/Vàng và ghi chú trần 24 nhát cho Rapihaler 80/2.25 mcg (ASTHMA-R2-207, ASTHMA-R2-211)', () => {
      const plan = generateAsthmaActionPlanVi({
        patientName: 'Nguyễn Văn A',
        track: 'track1',
        controllerDrug: 'Budesonide/Formoterol 160/4.5 mcg',
        relieverDrug: 'Budesonide/Formoterol 160/4.5 mcg',
        maintenanceDose: 'Không dùng duy trì hàng ngày (chỉ hít khi cần)',
        relieverInstructions: '1 nhát khi cần'
      });
      expect(plan).toContain('Chế độ kháng viêm cắt cơn (AIR Bậc 1–2)');
      expect(plan).not.toContain('Thuốc duy trì: Dùng Budesonide/Formoterol 160/4.5 mcg liều Không dùng');
      expect(plan).toContain('80/2.25 mcg');
      expect(plan).toContain('24 nhát/ngày');
    });
  });

  describe('Kiểm thử loại bỏ hoàn toàn cảnh báo trùng lặp giả dup.ics / dup.laba khi SWITCH bình hít (R1-ASTHMA-V2-04, ASTHMA-R2-204, ASTHMA-R2-R3-07)', () => {
    it('Preset 2 (đang dùng Budesonide đơn chất -> nâng lên Budesonide/Formoterol MART Bậc 3) phát SWITCH kèm switchFrom và sinh 0 cảnh báo dup.ics / dup.laba', () => {
      const preset2 = asthmaPresets.find((p) => p.id === 'preset_asthma_uncontrolled_step2');
      expect(preset2).toBeDefined();
      const plan = evaluate(preset2!.patient as Patient, {
        setting: 'outpatient',
        profile: 'INTL',
        units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
        score2Region: 'high',
        fontScale: 'normal',
        theme: 'light',
        onlyReviewed: false
      });

      const martRec = plan.recommendations.find((r) => r.drugId === 'budesonide_formoterol');
      expect(martRec?.action).toBe('SWITCH');
      expect(martRec?.switchFrom).toBe('budesonide');

      const falseDupAlerts = plan.alerts.filter(
        (a) => a.type === 'duplicate' || a.id === 'dup.ics' || a.id === 'dup.laba'
      );
      expect(falseDupAlerts).toHaveLength(0);
    });

    it('Chuyển từ Seretide (fluticasone_salmeterol) sang MART (budesonide_formoterol) phát SWITCH kèm switchFrom và sinh 0 cảnh báo dup.ics / dup.laba', () => {
      const preset2 = asthmaPresets.find((p) => p.id === 'preset_asthma_uncontrolled_step2')!;
      const patientOnSeretide: Patient = {
        ...(preset2.patient as Patient),
        currentMeds: [{ drugId: 'fluticasone_salmeterol', name: 'Seretide 250/50', dose: '1 nhát', freq: '2 lần/ngày' }]
      };
      const plan = evaluate(patientOnSeretide, {
        setting: 'outpatient',
        profile: 'INTL',
        units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
        score2Region: 'high',
        fontScale: 'normal',
        theme: 'light',
        onlyReviewed: false
      });

      const martRec = plan.recommendations.find((r) => r.drugId === 'budesonide_formoterol');
      expect(martRec?.action).toBe('SWITCH');
      expect(martRec?.switchFrom).toBe('fluticasone_salmeterol');

      const falseDupAlerts = plan.alerts.filter(
        (a) => a.type === 'duplicate' || a.id === 'dup.ics' || a.id === 'dup.laba'
      );
      expect(falseDupAlerts).toHaveLength(0);
    });
  });
});
