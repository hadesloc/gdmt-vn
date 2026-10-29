import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import App from '../../src/App';
import { ShareDialog } from '../../src/ui/ShareDialog';
import { setDemoEnabled } from '../../src/modules/registry';
import { decodeStateFromHash, encodeStateToHash } from '../../src/engine/urlState';
import { buildDisplayedPlan } from '../../src/ui/displayedPlan';
import { evaluate } from '../../src/engine/evaluate';
import type { Patient, Settings } from '../../src/engine/types';
const patient: Patient = { age: 67, selectedModules: ['ckd'], conditions: {}, currentMeds: [] };
const settings: Settings = { setting: 'outpatient', profile: 'VN', units: { cr: 'mg_dL', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_g', hba1c: 'pct' }, score2Region: 'high', theme: 'light', fontScale: 'normal', onlyReviewed: false };
beforeEach(() => { cleanup(); window.location.hash = ''; setDemoEnabled(false); vi.restoreAllMocks(); });
describe('internal trial persistence, copy and notes', () => {
  it('does not report clipboard success before permission is granted', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    render(<ShareDialog kind="note" text="Ca giả lập" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('thủ công'));
    expect(screen.queryByRole('status')).toBeNull();
    expect((screen.getByRole('textbox', { name: 'Nội dung ghi chú' }) as HTMLTextAreaElement).value).toBe('Ca giả lập');
  });
  it('reports successful copy only after the actual write resolves', async () => {
    const copy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } });
    render(<ShareDialog kind="link" text="http://localhost/#test" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Đã sao chép.'));
    expect(copy).toHaveBeenCalledWith('http://localhost/#test');
  });
  it('restores focus to the launching button when a dialog closes with Escape', () => {
    render(<App />); const launch = screen.getByRole('button', { name: /Ghi chú/ }); launch.focus(); fireEvent.click(launch);
    const dialog = screen.getByRole('dialog', { name: 'Ghi chú kế hoạch' }); expect(document.activeElement).toBe(dialog);
    fireEvent.keyDown(dialog, { key: 'Escape' }); expect(screen.queryByRole('dialog')).toBeNull(); expect(document.activeElement).toBe(launch);
  });
  it('loads partial unit settings with all missing preferences filled, without DEMO or stale labs', () => {
    window.location.hash = encodeStateToHash({ age: 60, selectedModules: ['hf', '_demo'], currentMeds: [] }, { units: { ...settings.units, cr: 'mg_dL' } });
    render(<App />); const decoded = decodeStateFromHash(window.location.hash);
    expect(decoded?.patient.selectedModules).toEqual(['hf']); expect(decoded?.patient.scr).toBeUndefined();
    expect(decoded?.settings?.units?.cr).toBe('mg_dL'); expect(decoded?.settings?.units?.lipid).toBe('mmol_L');
  });
  it('shows an invalid-link error and an empty workspace rather than silently using the example patient', () => {
    window.location.hash = '#v2=invalid'; render(<App />);
    expect(screen.getByRole('alert').textContent).toContain('liên kết');
    expect(decodeStateFromHash(window.location.hash)?.patient.selectedModules).toEqual([]);
    expect((screen.getByRole('spinbutton', { name: 'Tuổi (năm)' }) as HTMLInputElement).value).toBe('');
  });
  it('requires confirmation before clearing the case and resets to an empty official workspace', () => {
    render(<App />); fireEvent.click(screen.getByRole('button', { name: 'Hồ sơ mới' }));
    expect((screen.getByRole('spinbutton', { name: 'Tuổi (năm)' }) as HTMLInputElement).value).toBe('65');
    fireEvent.click(screen.getByRole('button', { name: 'Tạo hồ sơ trống' }));
    expect(decodeStateFromHash(window.location.hash)?.patient).toEqual({ selectedModules: [], currentMeds: [], conditions: {} });
  });
  it('does not replace the open case when an invalid file is chosen', async () => {
    render(<App />); const before = window.location.hash;
    const file = new File(['broken'], 'broken.json', { type: 'application/json' }); Object.defineProperty(file, 'text', { value: async () => 'broken' });
    fireEvent.change(screen.getByTestId('case-file-input'), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('JSON'));
    expect(window.location.hash).toBe(before); expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('previews a valid import and replaces state only after explicit confirmation', async () => {
    render(<App />);
    const file = new File([], 'synthetic.json'); const imported = { format: 'gdmt-vn-case', version: 1, patient: { ...patient, currentMeds: [{ drugId: 'bisoprolol', dose: 3.75 }] }, settings };
    Object.defineProperty(file, 'text', { value: async () => JSON.stringify(imported) });
    fireEvent.change(screen.getByTestId('case-file-input'), { target: { files: [file] } });
    await screen.findByRole('dialog', { name: 'Mở hồ sơ đã lưu' });
    expect(decodeStateFromHash(window.location.hash)?.patient.age).toBe(65);
    fireEvent.click(screen.getByRole('button', { name: 'Dùng hồ sơ này' }));
    expect(decodeStateFromHash(window.location.hash)?.patient.age).toBe(67);
    expect(decodeStateFromHash(window.location.hash)?.patient.currentMeds?.[0].dose).toBe(3.75);
    expect(decodeStateFromHash(window.location.hash)?.settings?.units?.cr).toBe('mg_dL');
  });
  it('filters summaries and note/print contents along with the visible recommendations', () => {
    const raw = evaluate(patient, settings, { modules: [] });
    raw.recommendations = [
      { id: 'x', module: 'ckd', action: 'START', drugId: 'missing', title: 'UNREVIEWED_START_SENTINEL', rationale: '', citationIds: [], gates: [], priority: 1, tier: 'x' },
      { id: 'y', module: 'ckd', action: 'STOP', title: 'KEEP_SAFETY_SENTINEL', rationale: '', citationIds: [], gates: [], priority: 1, tier: 'x' },
    ]; raw.summary.total = 2; raw.summary.byAction.START = 1; raw.summary.byAction.STOP = 1;
    const displayed = buildDisplayedPlan(raw, patient, {}, { ...settings, onlyReviewed: true });
    expect(displayed.recommendations.map((r) => r.id)).toEqual(['y']);
    expect(displayed.summary.total).toBe(1); expect(displayed.summary.byAction.START).toBe(0); expect(displayed.summary.byAction.STOP).toBe(1);
    expect(displayed.noteText).not.toContain('UNREVIEWED_START_SENTINEL'); expect(displayed.noteText).toContain('KEEP_SAFETY_SENTINEL');
    expect(raw.recommendations).toHaveLength(2);
  });
});
