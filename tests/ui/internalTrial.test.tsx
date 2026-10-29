import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../../src/App';
import { setDemoEnabled } from '../../src/modules/registry';
beforeEach(() => { cleanup(); window.location.hash = ''; setDemoEnabled(false); });
describe('internal trial usable flow regression', () => {
  it('does not inject DEMO recommendations into the default official workspace', () => {
    const { container } = render(<App />);
    expect(container.textContent).not.toContain('_DEMO');
    expect(screen.queryByTestId('module-inputs-_demo')).toBeNull();
  });
  it('shows an internal-trial scope and local save/open controls', () => {
    render(<App />);
    expect(screen.getByTestId('trial-banner').textContent).toContain('Bản thử nghiệm nội bộ');
    expect(screen.getByRole('button', { name: 'Lưu hồ sơ' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Mở hồ sơ' })).toBeDefined();
  });
  it('lets the user read a note even when clipboard is unavailable', () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Ghi chú/ }));
    expect(screen.getByRole('dialog', { name: 'Ghi chú kế hoạch' })).toBeDefined();
    expect(screen.getByRole('textbox', { name: 'Nội dung ghi chú' })).toBeDefined();
  });
  it('common patient inputs have accessible labels for keyboard/screen-reader use', () => {
    render(<App />);
    expect(screen.getByRole('spinbutton', { name: 'Tuổi (năm)' })).toBeDefined();
    expect(screen.getByRole('spinbutton', { name: 'Kali máu (K⁺ mmol/L)' })).toBeDefined();
  });
  it('has a printable document independent of the hidden mobile patient/plan pane', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /🖨️ In/ }));
    expect(print).toHaveBeenCalled();
    expect(screen.getByTestId('print-document').textContent).toContain('GDMT-VN');
    print.mockRestore();
  });
  it('finds a relevant preset with an unaccented Vietnamese search', () => {
    render(<App />); fireEvent.click(screen.getByRole('button', { name: /BN mẫu/ }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm ca theo bệnh hoặc tình huống' }), { target: { value: 'suy tim' } });
    expect(screen.getByText(/BN 1: HFrEF chuẩn/)).toBeDefined();
    expect(screen.queryByText(/THA Độ 2 mới chẩn đoán/)).toBeNull();
  });
});
