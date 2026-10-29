import { useState } from 'react';
import type { Plan, Action, Patient, Derived } from '../engine/types';
import { PlanRow } from './PlanRow';

export interface PlanListProps {
  plan: Plan;
  patient?: Patient;
  derived?: Derived;
  onOpenMatrix?: (drugId?: string) => void;
  onCopyNote?: () => void;
  onCopyLink?: () => void;
  onPrint?: () => void;
  onlyReviewed?: boolean;
}

const ACTION_LABELS: Record<Action, string> = {
  START: 'Bắt đầu',
  UPTITRATE: 'Tăng liều',
  CONTINUE: 'Duy trì',
  REDUCE: 'Giảm liều',
  SWITCH: 'Đổi thuốc',
  HOLD: 'Tạm hoãn',
  STOP: 'Ngừng',
  AVOID: 'Tránh dùng',
  CONSIDER: 'Cân nhắc',
  DEFER: 'Hoãn lại',
  MONITOR: 'Theo dõi',
  REFER: 'Chuyển khám'
};

export const PlanList = ({
  plan,
  patient,
  derived,
  onOpenMatrix,
  onCopyNote,
  onCopyLink,
  onPrint,
  onlyReviewed = false
}: PlanListProps) => {
  const [expandAll, setExpandAll] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  const handleCopyNote = () => onCopyNote?.();
  const handleCopyLink = () => onCopyLink?.();

  // Gom nhóm theo Tier
  const groupedByTier = new Map<string, typeof plan.recommendations>();
  for (const r of plan.recommendations) {
    const tierKey = r.tier || 'Khuyến cáo chung';
    if (!groupedByTier.has(tierKey)) {
      groupedByTier.set(tierKey, []);
    }
    groupedByTier.get(tierKey)!.push(r);
  }

  const missingInputCount = plan.recommendations.filter((r) =>
    r.id.toLowerCase().includes('missing_input')
  ).length;

  const urgentSafetyCount =
    (plan.summary.byAction.STOP || 0) +
    (plan.summary.byAction.HOLD || 0) +
    (plan.summary.byAction.REFER || 0);
  const activeOptimizationCount =
    (plan.summary.byAction.START || 0) +
    (plan.summary.byAction.UPTITRATE || 0) +
    (plan.summary.byAction.SWITCH || 0);

  const hfPhenotypeLabel =
    patient?.lvef !== undefined
      ? `${patient.lvef <= 40 ? 'HFrEF' : patient.lvef <= 49 ? 'HFmrEF' : 'HFpEF'} (LVEF ${patient.lvef}%)`
      : undefined;

  const summaryMetrics: Array<{ key: string; text: string; tone?: 'normal' | 'warn' | 'danger' }> = [];
  if (hfPhenotypeLabel) {
    summaryMetrics.push({ key: 'hf', text: `💓 ${hfPhenotypeLabel}` });
  }
  if (derived?.egfr !== undefined) {
    const stageStr = [derived.kdigoG, derived.kdigoA].filter(Boolean).join('');
    summaryMetrics.push({
      key: 'egfr',
      text: `🫘 eGFR ${derived.egfr}${stageStr ? ` (${stageStr})` : ''}`,
      tone: derived.egfr < 30 ? 'warn' : 'normal'
    });
  }
  if (patient?.k !== undefined) {
    summaryMetrics.push({
      key: 'k',
      text: `🧪 K⁺ ${patient.k} mmol/L`,
      tone: patient.k >= 5.5 || patient.k < 3.5 ? 'danger' : patient.k >= 5.0 ? 'warn' : 'normal'
    });
  }
  if (patient?.sbp !== undefined) {
    summaryMetrics.push({
      key: 'bp',
      text: `🩺 HA ${patient.sbp}/${patient.dbp ?? '--'} mmHg`,
      tone: patient.sbp < 90 || patient.sbp >= 180 ? 'danger' : 'normal'
    });
  }
  if (patient?.hr !== undefined) {
    const rhythmShort =
      patient.rhythm === 'afib'
        ? ' · AF'
        : patient.rhythm === 'sinus'
          ? ' · Xoang'
          : patient.rhythm === 'paced'
            ? ' · Tạo nhịp'
            : '';
    summaryMetrics.push({
      key: 'hr',
      text: `⚡ HR ${patient.hr} bpm${rhythmShort}`
    });
  }
  if (missingInputCount > 0) {
    summaryMetrics.push({
      key: 'missing',
      text: `📝 Cần bổ sung ${missingInputCount} thông số`,
      tone: 'warn'
    });
  }

  return (
    <div className="panel" data-testid="plan-list-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span>📋 Kế hoạch GDMT</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 500 }}>
            ({plan.recommendations.length} khuyến cáo)
          </span>
        </h2>

        {/* Action Buttons: Responsive Toolbar */}
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', position: 'relative' }}>
          <button
            type="button"
            className="btn-header"
            aria-pressed={expandAll}
            style={{
              background: 'var(--bg-muted)',
              color: 'var(--text-main)',
              borderColor: 'var(--border-color)',
              minHeight: '34px',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap'
            }}
            onClick={() => setExpandAll(!expandAll)}
          >
            {expandAll ? 'Thu gọn' : 'Mở tất cả'}
          </button>

          {/* Desktop inline buttons */}
          <div className="desktop-plan-actions" style={{ display: 'flex', gap: '0.35rem' }}>
            {onCopyNote && (
              <button
                type="button"
                className="btn-header"
                style={{
                  background: 'var(--bg-muted)',
                  color: 'var(--text-main)',
                  borderColor: 'var(--border-color)',
                  minHeight: '34px',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap'
                }}
                onClick={handleCopyNote}
              >
                📄 Ghi chú
              </button>
            )}
            {onCopyLink && (
              <button
                type="button"
                className="btn-header"
                style={{
                  background: 'var(--bg-muted)',
                  color: 'var(--text-main)',
                  borderColor: 'var(--border-color)',
                  minHeight: '34px',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap'
                }}
                onClick={handleCopyLink}
              >
                🔗 Link
              </button>
            )}
            {onPrint && (
              <button
                type="button"
                className="btn-header"
                style={{
                  background: 'var(--bg-muted)',
                  color: 'var(--text-main)',
                  borderColor: 'var(--border-color)',
                  minHeight: '34px',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap'
                }}
                onClick={onPrint}
              >
                🖨️ In
              </button>
            )}
          </div>

          {/* Mobile "⋯" action menu toggle button */}
          <div className="mobile-plan-actions-dropdown" style={{ display: 'none', position: 'relative' }}>
            <button
              type="button"
              className="btn-header"
              style={{
                background: 'var(--bg-muted)',
                color: 'var(--text-main)',
                borderColor: 'var(--border-color)',
                minHeight: '34px',
                fontSize: '0.9rem',
                padding: '0 0.55rem'
              }}
              onClick={() => setShowActionMenu(!showActionMenu)}
              title="Thêm thao tác"
              aria-label="Thêm thao tác kế hoạch"
              aria-expanded={showActionMenu}
            >
              ⋯
            </button>
            {showActionMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 70,
                  minWidth: '170px',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '4px'
                }}
              >
                {onCopyNote && (
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                    onClick={() => {
                      handleCopyNote();
                      setShowActionMenu(false);
                    }}
                  >
                    📄 Sao chép ghi chú
                  </button>
                )}
                {onCopyLink && (
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                    onClick={() => {
                      handleCopyLink();
                      setShowActionMenu(false);
                    }}
                  >
                    🔗 Sao chép Link
                  </button>
                )}
                {onPrint && (
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                    onClick={() => {
                      onPrint();
                      setShowActionMenu(false);
                    }}
                  >
                    🖨️ In phác đồ
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {onlyReviewed && (
        <p className="workspace-feedback">
          Đang lọc khuyến cáo đã review. Cảnh báo an toàn vẫn được giữ; ghi chú và bản in dùng cùng bộ lọc.
        </p>
      )}

      {/* UX-02: Thanh tóm tắt bối cảnh lâm sàng nhanh (Phenotype / eGFR / K+ / HA / HR / Thiếu dữ liệu) */}
      {summaryMetrics.length > 0 && (
        <div
          data-testid="plan-clinical-summary"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.35rem',
            padding: '0.5rem 0.65rem',
            marginBottom: '0.65rem',
            borderRadius: '8px',
            background: 'var(--bg-muted)',
            border: '1px solid var(--border-color)'
          }}
        >
          {summaryMetrics.map((m) => (
            <span
              key={m.key}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                background:
                  m.tone === 'danger'
                    ? '#fee2e2'
                    : m.tone === 'warn'
                      ? '#fef3c7'
                      : 'var(--bg-surface)',
                color:
                  m.tone === 'danger'
                    ? '#991b1b'
                    : m.tone === 'warn'
                      ? '#92400e'
                      : 'var(--text-main)',
                border:
                  m.tone === 'danger'
                    ? '1px solid #fca5a5'
                    : m.tone === 'warn'
                      ? '1px solid #fcd34d'
                      : '1px solid var(--border-color)'
              }}
            >
              {m.text}
            </span>
          ))}
        </div>
      )}

      {/* UX-02: Định hướng thứ tự ưu tiên xử trí lâm sàng */}
      {(urgentSafetyCount > 0 || activeOptimizationCount > 0) && (
        <div
          data-testid="plan-priority-guidance"
          style={{
            fontSize: '0.78rem',
            padding: '0.45rem 0.65rem',
            marginBottom: '0.65rem',
            borderRadius: '6px',
            background: urgentSafetyCount > 0 ? '#fff7ed' : '#eff6ff',
            color: urgentSafetyCount > 0 ? '#9a3412' : '#1e40af',
            border: urgentSafetyCount > 0 ? '1px solid #fed7aa' : '1px solid #bfdbfe'
          }}
        >
          <strong>Thứ tự ưu tiên xử trí:</strong>{' '}
          {urgentSafetyCount > 0
            ? `1) Xử lý ngay ${urgentSafetyCount} lệnh an toàn (Ngừng / Tạm hoãn / Chuyển khám) → `
            : ''}
          {activeOptimizationCount > 0
            ? `${urgentSafetyCount > 0 ? '2) ' : ''}Thực hiện ${activeOptimizationCount} bước khởi trị / chuẩn độ liều kế tiếp và hẹn kiểm tra lại sinh hóa – huyết động.`
            : 'Rà soát nguyên nhân cản trở trước khi tái khởi trị hoặc tăng liều.'}
        </div>
      )}

      {/* Action Count Summary Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
        {(Object.entries(plan.summary.byAction) as [Action, number][])
          .filter(([, count]) => count > 0)
          .map(([action, count]) => (
            <span
              key={action}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '12px',
                background: 'var(--bg-muted)',
                border: '1px solid var(--border-color)',
                fontWeight: 600,
                color: 'var(--text-muted)'
              }}
            >
              {ACTION_LABELS[action] || action}: <strong>{count}</strong>
            </span>
          ))}
      </div>

      {/* Safety Alerts Box */}
      {plan.alerts.length > 0 && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '0.85rem',
            marginBottom: '1rem'
          }}
          data-testid="safety-alerts-box"
        >
          <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
            ⚠️ CẢNH BÁO AN TOÀN & TƯƠNG TÁC THUỐC ({plan.alerts.length})
          </div>
          {plan.alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                fontSize: '0.85rem',
                color: '#7f1d1d',
                marginBottom: '0.4rem',
                paddingLeft: '0.5rem',
                borderLeft: '3px solid #dc2626'
              }}
            >
              {alert.provenanceLabelVi && (
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.08rem 0.4rem',
                    borderRadius: '4px',
                    marginRight: '0.4rem',
                    background:
                      alert.provenance === 'proposed_proposed'
                        ? '#fef3c7'
                        : alert.provenance === 'current_proposed'
                          ? '#ffedd5'
                          : '#fee2e2',
                    color:
                      alert.provenance === 'proposed_proposed'
                        ? '#92400e'
                        : alert.provenance === 'current_proposed'
                          ? '#9a3412'
                          : '#991b1b',
                    border: '1px solid rgba(153, 27, 27, 0.2)'
                  }}
                >
                  {alert.provenanceLabelVi}
                </span>
              )}
              <strong>{alert.title}:</strong> {alert.messageVi}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations grouped by Tier */}
      {plan.recommendations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-subtle)' }}>
          {onlyReviewed
            ? 'Chưa có khuyến cáo đáp ứng bộ lọc đã review cho hồ sơ này. Có thể tắt bộ lọc trong Cài đặt để tiếp tục thử nghiệm.'
            : 'Nhập thông tin bệnh nhân và chọn bệnh lý để sinh kế hoạch điều trị tối ưu GDMT.'}
        </div>
      ) : (
        Array.from(groupedByTier.entries()).map(([tier, recs]) => (
          <div key={tier} style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--primary)',
                marginBottom: '0.5rem',
                letterSpacing: '0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>🔹</span> {tier} ({recs.length})
            </div>
            {recs.map((r) => (
              <PlanRow
                key={r.id}
                recommendation={r}
                defaultExpanded={expandAll}
                onOpenMatrix={onOpenMatrix}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
};
