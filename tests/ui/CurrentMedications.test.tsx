import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import CurrentMedications from '../../src/ui/CurrentMedications';
import type { CurrentMed, ModuleId } from '../../src/engine/types';
import { getRecordedDoseChoices } from '../../src/ui/currentMedicationDoses';
import { drug } from '../../src/kb-types';
import { getMedicationGroups } from '../../src/ui/currentMedicationGroups';
import App from '../../src/App';
import { encodeStateToHash, decodeStateFromHash } from '../../src/engine/urlState';
import { setDemoEnabled } from '../../src/modules/registry';

afterEach(() => { cleanup(); window.location.hash = ''; setDemoEnabled(false); });
function Harness({ initial = [], modules = ['hf'] }: { initial?: CurrentMed[]; modules?: ModuleId[] }) {
  const [medications, onChange] = useState(initial);
  return <><CurrentMedications medications={medications} onChange={onChange} moduleIds={modules} />
    <output data-testid="stored-meds">{JSON.stringify(medications)}</output></>;
}
const stored = (): CurrentMed[] => JSON.parse(screen.getByTestId('stored-meds').textContent || '[]');
const field = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('Ghi nhận thuốc đang dùng qua nhóm chọn và tìm kiếm', () => {
  it('các nhóm ĐTĐ hiện đầy đủ, không giấu metformin và SGLT2 sau nhóm khác', () => {
    render(<Harness modules={['dm2']} />);
    expect(screen.getByRole('button', { name: 'Metformin' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Empagliflozin' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sitagliptin' })).toBeDefined();
    expect(screen.queryByText(/^Các nhóm thuốc khác/)).toBeNull();
  });

  it('lọc nhóm theo bệnh giữ thuốc đã ghi nhận và bỏ bộ lọc không còn hợp lệ', () => {
    const meds = [{ drugId: 'bisoprolol', dose: '3.75', unit: 'mg' }];
    const { rerender } = render(<CurrentMedications medications={meds} onChange={() => {}} moduleIds={['hf', 'dm2']} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Hiển thị nhóm thuốc' }), { target: { value: 'dm2' } });
    expect(screen.getByRole('button', { name: 'Metformin' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Bisoprolol' })).toBeNull();
    rerender(<CurrentMedications medications={meds} onChange={() => {}} moduleIds={['hf', 'ckd']} />);
    expect((screen.getByRole('combobox', { name: 'Hiển thị nhóm thuốc' }) as HTMLSelectElement).value).toBe('all');
    expect(screen.getByRole('button', { name: 'Bisoprolol' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/Đã ghi nhận: 3.75 mg/)).toBeDefined();
  });
  it('chọn/bỏ thuốc nhanh; không tự gán liều trước khi người dùng chọn', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Bisoprolol' }));
    expect(stored()[0].drugId).toBe('bisoprolol');
    expect(stored()[0].dose).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Bisoprolol: 3.75 mg · 1 lần/ngày' }));
    expect(stored()[0]).toMatchObject({ dose: '3.75', unit: 'mg', freq: '1 lần/ngày' });
    fireEvent.click(screen.getByRole('button', { name: 'Bisoprolol' }));
    expect(stored()).toEqual([]);
  });
  it('tìm biệt dược rồi nhập đúng liều, đơn vị và thiết bị', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Tìm / thêm thuốc khác' }));
    field('Tìm thuốc đang dùng', 'Concor');
    fireEvent.click(screen.getByRole('button', { name: 'Chọn Bisoprolol' }));
    expect((screen.getByLabelText('Liều đang dùng') as HTMLInputElement).value).toBe('');
    field('Liều đang dùng', '2.5'); field('Đơn vị (nếu tách riêng)', 'mg');
    field('Tần suất đang dùng', '1 lần/ngày'); field('Đường dùng / thiết bị', 'uống');
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thuốc' }));
    expect(stored()[0]).toMatchObject({ drugId: 'bisoprolol', dose: '2.5', unit: 'mg', freq: '1 lần/ngày', route: 'uống' });
  });
  it('không thêm trùng alias của thuốc đang dùng', () => {
    render(<Harness initial={[{ drugId: 'symbicort', name: 'Symbicort' }]} modules={['asthma']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tìm / thêm thuốc khác' }));
    field('Tìm thuốc đang dùng', 'Symbicort');
    fireEvent.click(screen.getByRole('button', { name: 'Chọn Budesonide / Formoterol' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thuốc' }));
    expect(screen.getByRole('alert').textContent).toContain('Đã có thuốc');
    expect(stored()).toHaveLength(1);
  });
  it('sửa liều cũ giữ đơn vị/tần suất/thiết bị và cho phép sửa đơn vị', () => {
    render(<Harness initial={[{ drugId: 'bisoprolol', dose: 2.5, unit: 'mg', freq: 'mỗi sáng', route: 'uống' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Bisoprolol' }));
    field('Liều đang dùng', '5');
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thuốc' }));
    expect(stored()[0]).toMatchObject({ dose: '5', unit: 'mg', freq: 'mỗi sáng', route: 'uống' });
  });
  it('đổi tên thuốc khi sửa không mang liều thuốc cũ sang thuốc mới', () => {
    render(<Harness initial={[{ drugId: 'bisoprolol', dose: '5', unit: 'mg', freq: 'mỗi sáng' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Bisoprolol' }));
    field('Tìm thuốc đang dùng', 'Dapagliflozin');
    fireEvent.click(screen.getByRole('button', { name: 'Chọn Dapagliflozin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thuốc' }));
    expect(stored()[0].drugId).toBe('dapagliflozin'); expect(stored()[0].dose).toBeUndefined();
    expect(stored()[0].unit).toBeUndefined();
  });
  it('nhập thuốc ngoài danh mục không xóa tên và có thông báo giới hạn', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Tìm / thêm thuốc khác' }));
    field('Tìm thuốc đang dùng', 'Paxlovid');
    fireEvent.click(screen.getByRole('button', { name: 'Dùng tên thuốc này: Paxlovid' }));
    expect(screen.getByRole('note').textContent).toContain('chưa đầy đủ');
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thuốc' }));
    expect(stored()[0]).toMatchObject({ drugId: 'paxlovid', name: 'Paxlovid' });
    fireEvent.click(screen.getByRole('button', { name: 'Xóa Paxlovid' })); expect(stored()).toEqual([]);
  });
  it('reset hoặc đổi preset không để editor cũ ghi đè danh sách mới', () => {
    const onChange = () => {};
    const { rerender } = render(<CurrentMedications medications={[{ drugId: 'bisoprolol' }]} onChange={onChange} moduleIds={['hf']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Bisoprolol' }));
    field('Liều đang dùng', '7.5');
    rerender(<CurrentMedications medications={[{ drugId: 'dapagliflozin' }]} onChange={onChange} moduleIds={['hf']} />);
    expect(screen.queryByRole('button', { name: 'Lưu thuốc' })).toBeNull();
  });
  it('mức liều chỉ lấy từ KB và nhóm đa bệnh không lặp thuốc', () => {
    expect(getRecordedDoseChoices(drug('bisoprolol')).map((d) => String(d.amount))).toEqual(['1.25', '2.5', '3.75', '5', '7.5', '10']);
    const ids = getMedicationGroups(['hf', 'ckd', 'dm2']).flatMap((g) => g.drugIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getMedicationGroups(['hf']).find((g) => g.id === 'mra')?.drugIds).toContain('finerenone');
  });
  it('thuốc và liều chọn trong app được engine dùng và lưu/khôi phục qua URL', () => {
    setDemoEnabled(false);
    window.location.hash = encodeStateToHash({ id: 'synthetic-hf-ui', age: 65, sex: 'male', weight: 70,
      scr: 80, k: 4.2, sbp: 125, dbp: 75, hr: 75, lvef: 32, selectedModules: ['hf'],
      conditions: { hf: true }, currentMeds: [], customInputs: { nyhaClass: 2 } });
    const { unmount } = render(<App />);
    const meds = within(screen.getByRole('region', { name: 'Thuốc bệnh nhân đang dùng' }));
    fireEvent.click(meds.getByRole('button', { name: 'Bisoprolol' }));
    fireEvent.click(meds.getByRole('button', { name: 'Bisoprolol: 3.75 mg · 1 lần/ngày' }));
    const saved = decodeStateFromHash(window.location.hash)?.patient.currentMeds;
    expect(saved?.[0]).toMatchObject({ drugId: 'bisoprolol', dose: '3.75', unit: 'mg', freq: '1 lần/ngày' });
    expect(screen.getByTestId('plan-list-panel').textContent).toContain('Bisoprolol');
    expect(screen.getByTestId('plan-list-panel').textContent).toContain('Đang dùng: 3.75 mg');
    unmount(); render(<App />);
    expect(screen.getByRole('button', { name: 'Bisoprolol: 3.75 mg · 1 lần/ngày' }).getAttribute('aria-pressed')).toBe('true');
  });
});
