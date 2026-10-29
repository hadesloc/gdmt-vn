import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../../src/App';
import { buildPatientFromPreset, applyPresetSelection } from '../../src/ui/AppShell';
import { normalizePatientUnits } from '../../src/engine/units';
import { derivePatientData } from '../../src/engine/derive';
import { decodeStateFromHash } from '../../src/engine/urlState';
import { getAllModules, setDemoEnabled } from '../../src/modules/registry';
import type { Settings } from '../../src/engine/types';

describe('UI Shell - GDMT-VN Full Application', () => {
  beforeEach(() => {
    window.location.hash = '';
    setDemoEnabled(true);
  });

  it('renders AppShell with navy header and default tabs', () => {
    render(<App />);

    expect(screen.getByText('GDMT-VN')).toBeDefined();
    expect(screen.getByText(/Phác đồ điều trị nội khoa tối ưu/i)).toBeDefined();

    expect(screen.getAllByRole('button', { name: /Lộ trình/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /Phác đồ/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /Bằng chứng/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /Cài đặt/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('switches between main tabs correctly and never displays TODO: strings anywhere in UI', () => {
    const { container } = render(<App />);
    expect(container.textContent).not.toContain('TODO:');

    // Click on "Bằng chứng"
    const evidenceTab = screen.getAllByRole('button', { name: /Bằng chứng/i })[0];
    fireEvent.click(evidenceTab);
    expect(screen.getByTestId('matrix-view-panel')).toBeDefined();
    expect(container.textContent).not.toContain('TODO:');

    // Click on "Lộ trình"
    const pathwayTab = screen.getAllByRole('button', { name: /Lộ trình/i })[0];
    fireEvent.click(pathwayTab);
    expect(screen.getByTestId('pathway-view-panel')).toBeDefined();
    expect(container.textContent).not.toContain('TODO:');

    // Click on "Cài đặt"
    const settingsTab = screen.getAllByRole('button', { name: /Cài đặt/i })[0];
    fireEvent.click(settingsTab);
    expect(screen.getByTestId('settings-view-panel')).toBeDefined();
    expect(container.textContent).not.toContain('TODO:');

    // Click back to "Phác đồ"
    const planTab = screen.getAllByRole('button', { name: /Phác đồ/i })[0];
    fireEvent.click(planTab);
    expect(screen.getByTestId('patient-form-panel')).toBeDefined();
    expect(screen.getByTestId('plan-list-panel')).toBeDefined();
  });

  it('switches setting (Ngoại trú / Nội viện) and profile via segmented controls', () => {
    render(<App />);

    const inpatientBtn = screen.getByRole('button', { name: 'Nội viện' });
    fireEvent.click(inpatientBtn);
    expect(inpatientBtn.className).toContain('active');

    const bytBtn = screen.getByRole('button', { name: 'Bộ Y tế' });
    fireEvent.click(bytBtn);
    expect(bytBtn.className).toContain('active');
  });

  it('renders recommendations and expands PlanRow to show gating, real KB quotes, and honest review badges', () => {
    const { container } = render(<App />);

    const planPanel = screen.getByTestId('plan-list-panel');
    expect(planPanel).toBeDefined();

    const dapaName = within(planPanel).getAllByText(/Dapagliflozin/i)[0];
    expect(dapaName).toBeDefined();

    fireEvent.click(dapaName);

    expect(screen.getByText(/Đánh giá cổng an toàn/i)).toBeDefined();
    expect(screen.getByText(/Bằng chứng trích dẫn nguyên văn/i)).toBeDefined();
    expect(container.textContent).not.toContain('TODO:');
    expect(container.textContent).not.toContain('Chưa có vị trí trang');
  });

  it('displays prominent unverified-source warning banner in LearnView for calculators with needsSourceVerification=true', () => {
    render(<App />);

    const learnTab = screen.getAllByRole('button', { name: /Học/i })[0];
    fireEvent.click(learnTab);
    expect(screen.getByTestId('learn-view-panel')).toBeDefined();

    const calcSubTab = screen.getByRole('button', { name: /Công cụ tính/i });
    fireEvent.click(calcSubTab);

    // Default calculator (eGFR CKD-EPI 2021) is verified -> no unverified warning box
    expect(screen.queryByTestId('unverified-source-warning')).toBeNull();
    expect(screen.getByText(/Đã kiểm chứng nguồn/i)).toBeDefined();

    // Switch to SCORE2 (needsSourceVerification: true) -> prominent warning banner MUST appear
    const score2Chip = screen.getByRole('button', { name: /SCORE2/i });
    fireEvent.click(score2Chip);
    const warningBox = screen.getByTestId('unverified-source-warning');
    expect(warningBox).toBeDefined();
    expect(warningBox.textContent).toContain('Cảnh báo bắt buộc đối chiếu nguồn gốc');
  });

  it('supports mobile viewports (360x780 and 390x844) with mobile segment toggle and zero horizontal overflow styles', () => {
    for (const [w, h] of [
      [360, 780],
      [390, 844]
    ]) {
      window.innerWidth = w;
      window.innerHeight = h;
      window.dispatchEvent(new Event('resize'));

      const { unmount } = render(<App />);
      const shell = screen.getByTestId('app-shell');
      expect(shell).toBeDefined();

      // Mobile floating plan toggle button switches between patient and plan views cleanly
      const floatingBtn = screen.getByRole('button', { name: /Xem kế hoạch/i });
      fireEvent.click(floatingBtn);
      expect(screen.getByRole('button', { name: /Sửa bệnh nhân/i })).toBeDefined();

      unmount();
    }
  });

  it('opens and closes presets modal', () => {
    render(<App />);

    const presetBtn = screen.getByRole('button', { name: /BN mẫu/i });
    fireEvent.click(presetBtn);

    expect(screen.getByText(/Chọn Bệnh Nhân Mẫu Chuẩn/i)).toBeDefined();
    expect(screen.getByText(/BN 1: Bệnh thận mạn/i)).toBeDefined();

    fireEvent.click(screen.getByText(/BN 1: Bệnh thận mạn/i));

    expect(screen.queryByText(/Chọn Bệnh Nhân Mẫu Chuẩn/i)).toBeNull();
  });

  it('CKD-R2-R1-07: resets patient state cleanly on preset selection without leaking INITIAL_PATIENT labs (uacr, glucose, hba1c)', () => {
    const cleanPatient = buildPatientFromPreset(
      {
        id: 'ckd_inpatient_hyperk',
        nameVi: 'Tăng kali máu cấp nội viện',
        description: 'CKD G5 tăng K+ cấp không có ĐTĐ',
        patient: {
          age: 58,
          sex: 'female',
          sbp: 145,
          dbp: 85,
          hr: 68,
          scr: 480,
          k: 6.4,
          selectedModules: ['ckd'],
          conditions: { ckd: true }
        }
      },
      ['ckd', 'dm2']
    );

    expect(cleanPatient.uacr).toBeUndefined();
    expect(cleanPatient.glucose).toBeUndefined();
    expect(cleanPatient.hba1c).toBeUndefined();
    expect(cleanPatient.conditions.dm).toBeUndefined();
    expect(cleanPatient.conditions.htn).toBeUndefined();
    expect(cleanPatient.selectedModules).toEqual(['ckd']);

    // Also verify selecting a preset in the full App UI does NOT retain INITIAL_PATIENT labs that the preset omitted
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /BN mẫu/i }));
    const hfPresetOption = screen.getByText(/BN 2: Suy tim HFrEF \+ THA/i);
    fireEvent.click(hfPresetOption);

    const decoded = decodeStateFromHash(window.location.hash);
    expect(decoded?.patient).toBeDefined();
    expect(decoded?.patient?.uacr).toBeUndefined();
    expect(decoded?.patient?.glucose).toBeUndefined();
    expect(decoded?.patient?.hba1c).toBeUndefined();
  });

  it('CKD-R3-R1-01 & CKD-R3-R3-02: syncs preset.setting (outpatient/inpatient) and converts SI preset labs into active mg_dL/mg_g units cleanly across all CKD presets', () => {
    const ckdMod = getAllModules().find((m) => m.id === 'ckd');
    const ckdPresets = ckdMod?.presets ?? [];
    expect(ckdPresets.length).toBeGreaterThanOrEqual(4);

    const siSettings: Settings = {
      setting: 'inpatient',
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

    const usSettings: Settings = {
      ...siSettings,
      setting: 'outpatient',
      units: {
        cr: 'mg_dL',
        glucose: 'mg_dL',
        lipid: 'mg_dL',
        urat: 'mg_dL',
        uacr: 'mg_g',
        hba1c: 'pct'
      }
    };

    const ckdInputFields = ckdMod?.inputs?.groups
      ? ckdMod.inputs.groups.flatMap((g) => g.fields)
      : [];

    for (const preset of ckdPresets) {
      const expectedSetting = preset.setting ?? 'outpatient';

      const appliedSi = applyPresetSelection(preset, siSettings, ['ckd'], ckdInputFields);
      const appliedUs = applyPresetSelection(preset, usSettings, ['ckd'], ckdInputFields);

      expect(appliedSi.settings.setting).toBe(expectedSetting);
      expect(appliedUs.settings.setting).toBe(expectedSetting);

      if (preset.patient.scr !== undefined) {
        // US mg/dL must never retain raw SI umol/L (> 50)!
        expect(appliedUs.patient.scr!).toBeLessThan(15);
      }

      const normSi = normalizePatientUnits(appliedSi.patient, appliedSi.settings.units, ckdInputFields);
      const normUs = normalizePatientUnits(appliedUs.patient, appliedUs.settings.units, ckdInputFields);

      const derivedSi = derivePatientData(normSi);
      const derivedUs = derivePatientData(normUs);

      expect(derivedUs.egfr).toBe(derivedSi.egfr);
      expect(derivedUs.kdigoG).toBe(derivedSi.kdigoG);
    }
  });
});
