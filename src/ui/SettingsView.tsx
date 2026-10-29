import type { Settings } from '../engine/types';

export interface SettingsViewProps {
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
}

export const SettingsView = ({
  settings,
  onUpdateSettings
}: SettingsViewProps) => {
  const updateUnit = <K extends keyof Settings['units']>(key: K, val: Settings['units'][K]) => {
    onUpdateSettings({
      ...settings,
      units: {
        ...settings.units,
        [key]: val
      }
    });
  };

  return (
    <div className="panel" data-testid="settings-view-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span>⚙️ Cài đặt hệ thống & Đơn vị lâm sàng</span>
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem' }}>
        {/* Phác đồ tham chiếu (Guideline Profile) */}
        <div>
          <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
            Phác đồ tham chiếu mặc định (Guideline Profile)
          </label>
          <div className="segmented-control" style={{ width: '100%', maxWidth: '400px' }}>
            <button
              type="button"
              className={`segmented-btn ${settings.profile === 'INTL' ? 'active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => onUpdateSettings({ ...settings, profile: 'INTL' })}
            >
              Quốc tế (INTL)
            </button>
            <button
              type="button"
              className={`segmented-btn ${settings.profile === 'VN' ? 'active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => onUpdateSettings({ ...settings, profile: 'VN' })}
            >
              Bộ Y tế VN
            </button>
            <button
              type="button"
              className={`segmented-btn ${settings.profile === 'US' ? 'active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => onUpdateSettings({ ...settings, profile: 'US' })}
            >
              Hoa Kỳ (US)
            </button>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            Mặc định: Guideline quốc tế mới nhất (KDIGO 2024, ADA 2026, ESC 2026, GOLD 2026).
          </div>
        </div>

        {/* Cài đặt Đơn vị đo lâm sàng */}
        <div style={{ padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Đơn vị đo xét nghiệm lâm sàng (Mặc định chuẩn Việt Nam)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Creatinin huyết thanh
              </label>
              <div className="segmented-control" style={{ width: '100%', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className={`segmented-btn ${settings.units.cr === 'umol_L' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => updateUnit('cr', 'umol_L')}
                >
                  µmol/L (VN)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${settings.units.cr === 'mg_dL' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => updateUnit('cr', 'mg_dL')}
                >
                  mg/dL (US)
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Glucose máu
              </label>
              <div className="segmented-control" style={{ width: '100%', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className={`segmented-btn ${settings.units.glucose === 'mmol_L' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => updateUnit('glucose', 'mmol_L')}
                >
                  mmol/L (VN)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${settings.units.glucose === 'mg_dL' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => updateUnit('glucose', 'mg_dL')}
                >
                  mg/dL (US)
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Lipid máu (Cholesterol/TG)
              </label>
              <div className="segmented-control" style={{ width: '100%', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className={`segmented-btn ${settings.units.lipid === 'mmol_L' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => updateUnit('lipid', 'mmol_L')}
                >
                  mmol/L (VN)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${settings.units.lipid === 'mg_dL' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => updateUnit('lipid', 'mg_dL')}
                >
                  mg/dL (US)
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Albumin niệu (UACR)
              </label>
              <div className="segmented-control" style={{ width: '100%', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className={`segmented-btn ${settings.units.uacr === 'mg_mmol' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => updateUnit('uacr', 'mg_mmol')}
                >
                  mg/mmol (VN)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${settings.units.uacr === 'mg_g' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => updateUnit('uacr', 'mg_g')}
                >
                  mg/g (US)
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Acid Uric
              </label>
              <div className="segmented-control" style={{ width: '100%', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className={`segmented-btn ${settings.units.urat === 'umol_L' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => updateUnit('urat', 'umol_L')}
                >
                  µmol/L (VN)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${settings.units.urat === 'mg_dL' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => updateUnit('urat', 'mg_dL')}
                >
                  mg/dL (US)
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                HbA1c
              </label>
              <div className="segmented-control" style={{ width: '100%', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className={`segmented-btn ${settings.units.hba1c === 'pct' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => updateUnit('hba1c', 'pct')}
                >
                  % (NGSP)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${settings.units.hba1c === 'mmol_mol' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => updateUnit('hba1c', 'mmol_mol')}
                >
                  mmol/mol (IFCC)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vùng nguy cơ SCORE2 */}
        <div>
          <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
            Vùng nguy cơ SCORE2 (ESC)
          </label>
          <div className="segmented-control" style={{ width: '100%', maxWidth: '480px' }}>
            <button
              type="button"
              className={`segmented-btn ${settings.score2Region === 'low' ? 'active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => onUpdateSettings({ ...settings, score2Region: 'low' })}
            >
              Thấp
            </button>
            <button
              type="button"
              className={`segmented-btn ${settings.score2Region === 'moderate' ? 'active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => onUpdateSettings({ ...settings, score2Region: 'moderate' })}
            >
              Trung bình
            </button>
            <button
              type="button"
              className={`segmented-btn ${settings.score2Region === 'high' ? 'active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => onUpdateSettings({ ...settings, score2Region: 'high' })}
            >
              Cao (VN mặc định)
            </button>
            <button
              type="button"
              className={`segmented-btn ${settings.score2Region === 'very_high' ? 'active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => onUpdateSettings({ ...settings, score2Region: 'very_high' })}
            >
              Rất cao
            </button>
          </div>
        </div>

        {/* Tùy chỉnh hiển thị (Theme & Font) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
              Chế độ màu giao diện
            </label>
            <div className="segmented-control" style={{ width: '100%' }}>
              <button
                type="button"
                className={`segmented-btn ${settings.theme === 'light' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
              >
                Sáng
              </button>
              <button
                type="button"
                className={`segmented-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
              >
                Tối
              </button>
              <button
                type="button"
                className={`segmented-btn ${settings.theme === 'high_contrast' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => onUpdateSettings({ ...settings, theme: 'high_contrast' })}
              >
                Tương phản cao
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
              Cỡ chữ hiển thị
            </label>
            <div className="segmented-control" style={{ width: '100%' }}>
              <button
                type="button"
                className={`segmented-btn ${settings.fontScale === 'normal' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => onUpdateSettings({ ...settings, fontScale: 'normal' })}
              >
                A (Chuẩn)
              </button>
              <button
                type="button"
                className={`segmented-btn ${settings.fontScale === 'large' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => onUpdateSettings({ ...settings, fontScale: 'large' })}
              >
                A+ (Lớn)
              </button>
              <button
                type="button"
                className={`segmented-btn ${settings.fontScale === 'xlarge' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => onUpdateSettings({ ...settings, fontScale: 'xlarge' })}
              >
                A++ (Rất lớn)
              </button>
            </div>
          </div>
        </div>

        {/* Lọc chất lượng kiểm duyệt */}
        <div style={{ marginTop: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={settings.onlyReviewed}
              onChange={(e) => onUpdateSettings({ ...settings, onlyReviewed: e.target.checked })}
            />
            <span>Chỉ hiển thị các khuyến cáo đã qua kiểm duyệt đa AI đồng thuận (ai_multi_reviewed)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
