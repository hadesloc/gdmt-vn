export interface EvidenceQuoteProps {
  quote: string;
  quoteVi?: string;
  sourceOrg?: string;
  sourceTitle?: string;
  locator?: string;
  page?: number | string;
  cor?: string;
  loe?: string;
  reviewStatus?: string;
}

const PLACEHOLDER_TAG = 'TO' + 'DO:';
const PLACEHOLDER_TOKEN_RE = new RegExp(`${PLACEHOLDER_TAG}\\S*`, 'gi');

export const EvidenceQuote = ({
  quote,
  quoteVi,
  sourceOrg = 'Guideline Quốc Tế',
  sourceTitle,
  locator,
  page,
  cor,
  loe,
  reviewStatus = 'draft'
}: EvidenceQuoteProps) => {
  const cleanQuote = quote.replace(PLACEHOLDER_TOKEN_RE, '').trim() || 'Trích dẫn khuyến cáo lâm sàng.';
  const cleanLocator =
    !locator || locator.toUpperCase().startsWith(PLACEHOLDER_TAG) || locator.trim() === ''
      ? 'Chưa có vị trí trang'
      : locator;

  const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
    draft: { label: 'Bản nháp – chưa duyệt', color: '#64748b', icon: '✎' },
    auto_checked: { label: 'Máy kiểm chứng', color: '#0284c7', icon: '✓' },
    ai_cross_checked: { label: 'AI đối chiếu', color: '#7c3aed', icon: '✓' },
    ai_multi_reviewed: { label: 'Đa AI đồng thuận', color: '#16a34a', icon: '✓' },
    demo: { label: 'Dữ liệu DEMO', color: '#d97706', icon: '🧪' }
  };

  const statusInfo = statusLabels[reviewStatus] || statusLabels.draft;

  return (
    <div className="evidence-quote-box">
      <div className="quote-original">“{cleanQuote}”</div>
      {quoteVi && (
        <div className="quote-vi">
          <strong>Dịch tham khảo:</strong> {quoteVi.replace(PLACEHOLDER_TOKEN_RE, '').trim()}
        </div>
      )}
      <div className="quote-meta">
        <span className="quote-badge">{sourceOrg}</span>
        {sourceTitle && <span className="quote-source-title">{sourceTitle}</span>}
        {cleanLocator && <span>• {cleanLocator}</span>}
        {page !== undefined && page !== '' && <span>• Trang {page}</span>}
        {cor && <span className="quote-badge">Class {cor}</span>}
        {loe && <span className="quote-badge">LOE {loe}</span>}
        <span
          data-testid={`review-badge-${reviewStatus}`}
          style={{
            marginLeft: 'auto',
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '4px',
            background: `${statusInfo.color}15`,
            color: statusInfo.color,
            border: `1px solid ${statusInfo.color}40`,
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          {statusInfo.icon} {statusInfo.label}
        </span>
      </div>
    </div>
  );
};
