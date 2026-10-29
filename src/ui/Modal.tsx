import { useEffect, useId, useRef, type ReactNode } from 'react';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const headingId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab' || !element) return;
      const focusable = Array.from(element.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea, select, a[href], [tabindex="0"]'));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === element)) { event.preventDefault(); first?.focus(); }
    };
    element?.addEventListener('keydown', handleKey);
    return () => { element?.removeEventListener('keydown', handleKey); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content workspace-dialog" role="dialog" aria-modal="true" aria-labelledby={headingId}
      ref={dialog} tabIndex={-1} onClick={(event) => event.stopPropagation()}>
      <div className="workspace-dialog-header"><h2 id={headingId}>{title}</h2>
        <button type="button" className="workspace-button" aria-label={`Đóng ${title}`} onClick={onClose}>Đóng</button></div>
      {children}
    </div>
  </div>;
}
