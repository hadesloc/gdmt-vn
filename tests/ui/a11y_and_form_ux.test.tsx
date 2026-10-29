import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import App from '../../src/App';
import { EvidenceQuote } from '../../src/ui/EvidenceQuote';
import { encodeStateToHash, decodeStateFromHash } from '../../src/engine/urlState';
import { setDemoEnabled } from '../../src/modules/registry';

describe('A11Y-01 & UX-01/02: Accessible Controls, Deduplicated Form, Collapsible Groups & Clinical Summary', () => {
  beforeEach(() => {
    cleanup();
    window.location.hash = '';
    setDemoEnabled(false);
  });

  it('DATA-01 & A11Y-01: reset creates truly empty ECG rhythm (not fake sinus) and writes canonical rhythm on selection', () => {
    render(<App />);

    // Reset to empty patient
    fireEvent.click(screen.getByRole('button', { name: 'Hồ sơ mới' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tạo hồ sơ trống' }));

    const rhythmSelect = screen.getByRole('combobox', { name: /Nhịp trên ECG/i }) as HTMLSelectElement;
    expect(rhythmSelect.value).toBe('');

    // Select AFib on empty patient -> must write top-level patient.rhythm = 'afib'
    fireEvent.change(rhythmSelect, { target: { value: 'afib' } });
    expect(rhythmSelect.value).toBe('afib');

    const decoded = decodeStateFromHash(window.location.hash);
    expect(decoded?.patient?.rhythm).toBe('afib');
    expect(decoded?.patient?.customInputs?.rhythm).toBeUndefined();
  });

  it('DATA-01: displays conflict banner when URL hash contains contradictory rhythm and resolves on click', () => {
    window.location.hash = `#${encodeStateToHash({
      age: 66,
      sex: 'male',
      rhythm: 'sinus',
      selectedModules: ['hf'],
      conditions: { hf: true },
      currentMeds: [],
      customInputs: { rhythm: 'afib' }
    })}`;

    render(<App />);

    const conflictAlert = screen.getByTestId('patient-field-conflicts');
    expect(conflictAlert.textContent).toContain('Xung đột nhịp ECG');

    // Rhythm select fails closed to empty until resolved
    const rhythmSelect = screen.getByRole('combobox', { name: /Nhịp trên ECG/i }) as HTMLSelectElement;
    expect(rhythmSelect.value).toBe('');

    fireEvent.click(within(conflictAlert).getByRole('button', { name: /Đồng bộ về giá trị chuẩn/i }));
    expect(screen.queryByTestId('patient-field-conflicts')).toBeNull();
    expect(rhythmSelect.value).toBe('sinus');
  });

  it('UX-01 & A11Y-01: deduplicates shared fields across multiple active modules and exposes accessible labels', () => {
    render(<App />);

    // Activate HF, AF, Gout in addition to default CKD + DM2
    fireEvent.click(screen.getByRole('button', { name: /Suy tim/i }));
    fireEvent.click(screen.getByRole('button', { name: /Rung nhĩ/i }));
    fireEvent.click(screen.getByRole('button', { name: /Gút/i }));

    // Each shared primary field must appear exactly ONCE in the entire form
    expect(screen.getAllByRole('combobox', { name: /Nhịp trên ECG/i })).toHaveLength(1);
    expect(screen.getAllByRole('spinbutton', { name: /^Creatinin/i })).toHaveLength(1);
    expect(screen.getAllByRole('spinbutton', { name: /^UACR/i })).toHaveLength(1);
    expect(screen.getAllByRole('spinbutton', { name: /^Acid Uric/i })).toHaveLength(1);
    expect(screen.getAllByRole('checkbox', { name: 'Đang mang thai' })).toHaveLength(1);
    expect(screen.getAllByRole('checkbox', { name: 'Đang cho con bú' })).toHaveLength(1);
    expect(screen.getAllByRole('checkbox', { name: 'Tiền sử phù mạch' })).toHaveLength(1);

    // Module-specific HF primary group is expanded by default with accessible label on congestion select
    const congestionSelect = screen.getByRole('combobox', {
      name: /Tình trạng sung huyết \/ ứ dịch/i
    }) as HTMLSelectElement;
    expect(congestionSelect).toBeDefined();
  });

  it('UX-01: hides strict inpatient groups in outpatient mode, reveals them in inpatient mode, and preserves collapsed group state', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Suy tim/i }));

    // Strict inpatient HF group is hidden in outpatient mode
    expect(
      screen.queryByRole('button', { name: /Theo dõi nội viện \(Suy tim cấp/i })
    ).toBeNull();

    // Secondary HF group ("Điện tâm đồ (QRS) & Thiết bị can thiệp (GDIT)") is collapsed by default
    const qrsGroupBtn = screen.getByRole('button', {
      name: /Điện tâm đồ \(QRS\) & Thiết bị can thiệp/i
    });
    expect(qrsGroupBtn.getAttribute('aria-expanded')).toBe('false');

    // Expand secondary group, enter QRS duration, collapse and re-expand -> value preserved
    fireEvent.click(qrsGroupBtn);
    expect(qrsGroupBtn.getAttribute('aria-expanded')).toBe('true');

    const qrsInput = screen.getByRole('spinbutton', { name: /Độ rộng phức bộ QRS/i }) as HTMLInputElement;
    fireEvent.change(qrsInput, { target: { value: '155' } });
    expect(qrsInput.value).toBe('155');
    expect(qrsGroupBtn.textContent).toContain('Đã nhập 1/');

    fireEvent.click(qrsGroupBtn);
    expect(qrsGroupBtn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(qrsGroupBtn);
    expect(
      (screen.getByRole('spinbutton', { name: /Độ rộng phức bộ QRS/i }) as HTMLInputElement).value
    ).toBe('155');

    // Switching to Inpatient mode reveals and expands the HF inpatient monitoring group
    fireEvent.click(screen.getByRole('button', { name: 'Nội viện' }));
    const inpatientGroupBtn = screen.getByRole('button', {
      name: /Theo dõi nội viện \(Suy tim cấp/i
    });
    expect(inpatientGroupBtn.getAttribute('aria-expanded')).toBe('true');
  });

  it('A11Y-01 & UX-02: renders PlanList clinical summary bar, PlanRow aria-expanded, and clear non-clinical review scope badges', () => {
    render(<App />);

    // Clinical summary bar shows eGFR, K+, BP, HR
    const summaryBar = screen.getByTestId('plan-clinical-summary');
    expect(summaryBar.textContent).toContain('eGFR');
    expect(summaryBar.textContent).toContain('K⁺ 4.5 mmol/L');
    expect(summaryBar.textContent).toContain('HA 135/82 mmHg');

    // PlanRow header has aria-expanded="false" initially, toggles to "true" on click
    const planPanel = screen.getByTestId('plan-list-panel');
    const firstRowHeader = within(planPanel)
      .getAllByRole('button')
      .find((el) => el.classList.contains('plan-row-header'))!;
    expect(firstRowHeader.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(firstRowHeader);
    expect(firstRowHeader.getAttribute('aria-expanded')).toBe('true');

    // EvidenceQuote explicitly clarifies automated check vs clinical sign-off
    cleanup();
    render(
      <EvidenceQuote
        quote="SGLT2 inhibitors are recommended in patients with T2D and CKD."
        sourceOrg="KDIGO 2024"
        locator="Chapter 3"
        page={42}
        reviewStatus="auto_checked"
      />
    );
    const autoBadge = screen.getByTestId('review-badge-auto_checked');
    expect(autoBadge.textContent).toContain('chưa duyệt lâm sàng');
    expect(autoBadge.getAttribute('aria-label')).toContain('chưa được bác sĩ chuyên khoa thẩm định lâm sàng');
  });
});
