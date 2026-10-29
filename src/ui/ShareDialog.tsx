import { useState } from 'react';
import { Modal } from './Modal';

export function ShareDialog({ kind, text, onClose }: { kind: 'note' | 'link'; text: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const isNote = kind === 'note';
  return <Modal title={isNote ? 'Ghi chú kế hoạch' : 'Liên kết hồ sơ'} onClose={onClose}>
    <p>{isNote ? 'Ghi chú phản ánh kế hoạch đang hiển thị, bao gồm bộ lọc đã chọn.'
      : 'Liên kết chứa toàn bộ dữ liệu hồ sơ. Chỉ chia sẻ ca giả lập trong bản thử nghiệm.'}</p>
    <textarea readOnly className="form-input workspace-text" aria-label={isNote ? 'Nội dung ghi chú' : 'Liên kết hồ sơ'} value={text}
      onFocus={(event) => event.target.select()} />
    <div className="workspace-actions"><button type="button" className="workspace-button primary" onClick={async () => {
      setCopied(false); setError('');
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text); setCopied(true);
      } catch { setError('Không thể sao chép tự động. Chọn nội dung phía trên rồi sao chép thủ công.'); }
    }}>Sao chép</button></div>
    {copied && <p role="status">Đã sao chép.</p>}{error && <p role="alert" className="workspace-error">{error}</p>}
  </Modal>;
}
