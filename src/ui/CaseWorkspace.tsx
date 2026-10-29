import { useRef, useState } from 'react';
import type { Patient, Settings } from '../engine/types';
import { parseCaseFile, serializeCaseFile } from '../engine/workspaceState';
import { Modal } from './Modal';

export const TRIAL_SCOPE = 'Bản thử nghiệm nội bộ — dùng ca giả lập; nội dung lâm sàng đang chờ kiểm định.';

export function CaseWorkspace({ patient, settings, onImport, loadError }: {
  patient: Patient; settings: Settings; onImport: (patient: Partial<Patient>, settings: Partial<Settings>) => void; loadError?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<ReturnType<typeof parseCaseFile>>();
  const save = () => {
    const blob = new Blob([serializeCaseFile(patient, settings)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `gdmt-vn-ho-so-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Đã tạo tệp hồ sơ để tải xuống.'); setError('');
  };
  return <section className="case-workspace" aria-label="Hồ sơ làm việc">
    <aside className="trial-banner" data-testid="trial-banner">
      <strong>Bản thử nghiệm nội bộ</strong><span>Dùng ca giả lập. Nội dung lâm sàng đang chờ kiểm định.</span>
    </aside>
    <div className="workspace-bar"><p>Chọn <strong>BN mẫu</strong> để bắt đầu, hoặc nhập một ca giả lập.</p>
      <div className="workspace-actions"><button type="button" className="workspace-button" onClick={save}>Lưu hồ sơ</button>
        <button type="button" className="workspace-button" onClick={() => fileInput.current?.click()}>Mở hồ sơ</button></div>
    </div>
    <input ref={fileInput} type="file" accept=".json,application/json" data-testid="case-file-input" aria-label="Chọn tệp hồ sơ" hidden
      onChange={async (event) => {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
        try {
          if (file.size > 2_000_000) throw new Error('Hồ sơ quá lớn (tối đa 2 MB).');
          const imported = parseCaseFile(await file.text()); setPending(imported); setError(''); setMessage('');
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không đọc được hồ sơ.'); }
      }} />
    {(loadError || error) && <p role="alert" className="workspace-error">{error || loadError}</p>}
    {message && <p role="status" className="workspace-feedback">{message}</p>}
    {pending && <Modal title="Mở hồ sơ đã lưu" onClose={() => setPending(undefined)}>
      <p>Hồ sơ có {pending.patient.selectedModules?.length ?? 0} bệnh và {pending.patient.currentMeds?.length ?? 0} thuốc đang dùng. Dữ liệu này sẽ thay thế hồ sơ đang mở.</p>
      <p>Bạn có thể lưu hồ sơ hiện tại trước khi tiếp tục.</p>
      <div className="workspace-actions"><button type="button" className="workspace-button" onClick={() => setPending(undefined)}>Hủy</button>
        <button type="button" className="workspace-button primary" onClick={() => {
          onImport(pending.patient, pending.settings); setPending(undefined); setMessage('Đã mở hồ sơ.');
        }}>Dùng hồ sơ này</button></div>
    </Modal>}
  </section>;
}
