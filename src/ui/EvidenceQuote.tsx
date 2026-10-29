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

  const statusLabels: Record<
    string,
    { label: string; color: string; icon: string; scopeVi: string }
  > = {
    draft: {
      label: 'Bản nháp – chưa duyệt',
      color: '#64748b',
      icon: '✎',
      scopeVi:
        'Dữ liệu chưa qua bước kiểm định độc lập hoặc đã thay đổi sau lần kiểm trước; chưa thẩm định lâm sàng bởi bác sĩ.'
    },
    auto_checked: {
      label: 'Kiểm tự động trích dẫn (chưa duyệt lâm sàng)',
      color: '#0284c7',
      icon: '⚙',
      scopeVi:
        'Chỉ mới kiểm tự động cấu trúc tệp, mã tài liệu và khớp chuỗi trích dẫn KB; chưa được bác sĩ chuyên khoa thẩm định lâm sàng.'
    },
    ai_cross_checked: {
      label: 'AI đối chiếu nguồn (chưa duyệt lâm sàng)',
      color: '#7c3aed',
      icon: '✓',
      scopeVi:
        'Mô hình AI đã đối chiếu trích dẫn với tài liệu nguồn; chưa thay thế thẩm định lâm sàng của bác sĩ.'
    },
    ai_multi_reviewed: {
      label: 'Đa AI đối chiếu nguồn (chưa duyệt lâm sàng)',
      color: '#16a34a',
      icon: '✓',
      scopeVi:
        'Nhiều mô hình AI đồng thuận về trích dẫn và ngưỡng số học; chưa thay thế hội chẩn hoặc phê duyệt lâm sàng của bác sĩ.'
    },
    demo: {
      label: 'Dữ liệu DEMO',
      color: '#d97706',
      icon: '🧪',
      scopeVi: 'Dữ liệu minh họa giao diện, không dùng cho quyết định điều trị.'
    }
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
          title={statusInfo.scopeVi}
          aria-label={`Phạm vi kiểm chứng bằng chứng: ${statusInfo.label}. ${statusInfo.scopeVi}`}
          style={{
            marginLeft: 'auto',
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '4px',
            background: `${statusInfo.color}15`,
            color: statusInfo.color,
            border: `1px solid ${statusInfo.color}40`,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'help'
          }}
        >
          {statusInfo.icon} {statusInfo.label}
        </span>
      </div>
    </div>
  );
};
