import { useState, useEffect } from 'react';
import type { Recommendation, Action } from '../engine/types';
import { EvidenceQuote } from './EvidenceQuote';
import { deduplicateCleanCitationIds, resolveCitationDisplay } from './kbLookup';

export interface PlanRowProps {
  recommendation: Recommendation;
  defaultExpanded?: boolean;
  onOpenMatrix?: (drugId?: string) => void;
}

const ACTION_MAP: Record<Action, { label: string; className: string }> = {
  START: { label: 'BẮT ĐẦU', className: 'badge-start' },
  UPTITRATE: { label: 'TĂNG LIỀU', className: 'badge-uptitrate' },
  CONTINUE: { label: 'TIẾP TỤC', className: 'badge-continue' },
  REDUCE: { label: 'GIẢM LIỀU', className: 'badge-reduce' },
  SWITCH: { label: 'CHUYỂN ĐỔI', className: 'badge-switch' },
  HOLD: { label: 'TẠM HOÃN', className: 'badge-hold' },
  STOP: { label: 'NGỪNG THUỐC', className: 'badge-stop' },
  AVOID: { label: 'CHỐNG CHỈ ĐỊNH', className: 'badge-avoid' },
  CONSIDER: { label: 'CÂN NHẮC', className: 'badge-consider' },
  DEFER: { label: 'HOÃN LẠI', className: 'badge-defer' },
  MONITOR: { label: 'THEO DÕI', className: 'badge-monitor' },
  REFER: { label: 'CHUYỂN KHÁM', className: 'badge-refer' }
};

export const PlanRow = ({
  recommendation: r,
  defaultExpanded = false,
  onOpenMatrix
}: PlanRowProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAllQuotes, setShowAllQuotes] = useState(false);

  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);

  const actionInfo = ACTION_MAP[r.action] || { label: r.action, className: 'badge-continue' };
  const cleanCitationIds = deduplicateCleanCitationIds(r.citationIds);
  const visibleCitationIds =
    showAllQuotes || cleanCitationIds.length <= 1
      ? cleanCitationIds
      : cleanCitationIds.slice(0, 1);
  const hiddenCitationCount = Math.max(0, cleanCitationIds.length - visibleCitationIds.length);
  const bodyDomId = `plan-row-body-${r.id}`;
  const hasDistinctSubtitle = Boolean(
    r.drugNameVi && r.title && r.title.trim() !== r.drugNameVi.trim()
  );

  return (
    <div className="plan-row-card" data-testid={`plan-row-${r.id}`}>
      <div
        className="plan-row-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={bodyDomId}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="plan-row-title-area">
            <span className={`badge-action ${actionInfo.className}`}>
              {actionInfo.label}
            </span>
            <span className="plan-row-name">{r.drugNameVi || r.title}</span>
            {r.dose && <span className="plan-row-dose">{r.dose}</span>}
            {r.benefitsAlso && r.benefitsAlso.length > 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#2563eb',
                  background: '#eff6ff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}
              >
                + {r.benefitsAlso.map((m) => m.toUpperCase()).join(' · ')}
              </span>
            )}
          </div>
          {hasDistinctSubtitle && (
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-subtle)',
                marginTop: '0.2rem',
                lineHeight: 1.35
              }}
            >
              {r.title}
            </div>
          )}
        </div>
        <div
          aria-hidden="true"
          style={{ color: 'var(--text-subtle)', fontSize: '0.9rem', flexShrink: 0 }}
        >
          {isExpanded ? '▲' : '▼'}
        </div>
      </div>

      {isExpanded && (
        <div id={bodyDomId} className="plan-row-body" data-testid={`plan-row-body-${r.id}`}>
          <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            <strong>Chỉ định lâm sàng:</strong> {r.rationale}
          </div>

          {/* Gating Status Pills */}
          {r.gates && r.gates.length > 0 && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Đánh giá cổng an toàn (Gating):
              </div>
              <div className="gating-pills">
                {r.gates.map((g, idx) => (
                  <span
                    key={idx}
                    className={`gating-pill ${g.passed ? 'passed' : 'failed'}`}
                  >
                    {g.passed ? '✓' : '⚠'} {g.parameter}: {g.messageVi}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Profile differences if available */}
          {r.profileDiff && (
            <div
              style={{
                fontSize: '0.8rem',
                margin: '0.5rem 0',
                padding: '0.5rem',
                background: '#fef3c7',
                borderRadius: '6px',
                color: '#92400e'
              }}
            >
              <strong>Khác biệt giữa các khuyến cáo:</strong>
              {r.profileDiff.INTL && <div>• Quốc tế: {r.profileDiff.INTL}</div>}
              {r.profileDiff.VN && <div>• Bộ Y tế: {r.profileDiff.VN}</div>}
              {r.profileDiff.US && <div>• Hoa Kỳ: {r.profileDiff.US}</div>}
            </div>
          )}

          {/* Warnings */}
          {r.warnings && r.warnings.length > 0 && (
            <div style={{ margin: '0.5rem 0' }}>
              {r.warnings.map((w, idx) => (
                <div key={idx} style={{ color: '#b91c1c', fontSize: '0.85rem' }}>
                  ⚠ Cảnh báo: {w}
                </div>
              ))}
            </div>
          )}

          {/* Evidence Quotes from verified KB (progressive disclosure for >1 citation) */}
          {cleanCitationIds.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.25rem'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Bằng chứng trích dẫn nguyên văn ({cleanCitationIds.length}):
                </div>
                {cleanCitationIds.length > 1 && (
                  <button
                    type="button"
                    aria-expanded={showAllQuotes}
                    onClick={() => setShowAllQuotes(!showAllQuotes)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '2px 4px'
                    }}
                  >
                    {showAllQuotes
                      ? 'Thu gọn bớt trích dẫn'
                      : `+ Xem thêm ${hiddenCitationCount} trích dẫn gốc`}
                  </button>
                )}
              </div>
              {visibleCitationIds.map((cid) => {
                const resolved = resolveCitationDisplay(cid, {
                  drugId: r.drugId,
                  moduleId: r.module,
                  explicitStatus: r.reviewStatus
                });
                return (
                  <EvidenceQuote
                    key={cid}
                    quote={resolved.quote}
                    quoteVi={resolved.quoteVi}
                    sourceOrg={resolved.sourceOrg}
                    sourceTitle={resolved.sourceTitle}
                    locator={resolved.locator}
                    page={resolved.page}
                    cor={resolved.cor}
                    loe={resolved.loe}
                    reviewStatus={resolved.reviewStatus}
                  />
                );
              })}
            </div>
          )}

          {/* Actions button */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {onOpenMatrix && r.drugId && (
              <button
                type="button"
                className="btn-header"
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--primary)',
                  borderColor: 'var(--primary)'
                }}
                onClick={() => onOpenMatrix(r.drugId)}
              >
                📊 Xem ma trận thận
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
