import { useState } from 'react';
import { calculatorRegistry } from '../engine/calculators';
import type { CalculatorRegistryItem } from '../engine/calculators/types';

export const LearnView = () => {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'calculators'>('knowledge');
  const [selectedCalcId, setSelectedCalcId] = useState<string>(calculatorRegistry[0]?.id || 'egfr');
  const [calcInputs, setCalcInputs] = useState<Record<string, unknown>>({});
  const [calcResult, setCalcResult] = useState<unknown>(null);

  const currentCalc: CalculatorRegistryItem | undefined = calculatorRegistry.find(
    (c) => c.id === selectedCalcId
  );

  const handleSelectCalc = (id: string) => {
    setSelectedCalcId(id);
    const c = calculatorRegistry.find((item) => item.id === id);
    const defaults: Record<string, unknown> = {};
    if (c) {
      for (const input of c.inputs) {
        if (input.defaultValue !== undefined) {
          defaults[input.id] = input.defaultValue;
        }
      }
    }
    setCalcInputs(defaults);
    setCalcResult(null);
  };

  const handleRunCalc = () => {
    if (!currentCalc) return;
    try {
      const res = currentCalc.compute(calcInputs);
      setCalcResult(res);
    } catch (err) {
      setCalcResult({ error: String(err) });
    }
  };

  const resultNeedsVerification = Boolean(
    currentCalc?.source.needsSourceVerification ||
    (calcResult &&
      typeof calcResult === 'object' &&
      (calcResult as Record<string, unknown>).needsSourceVerification === true)
  );

  return (
    <div className="panel" data-testid="learn-view-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span>📚 Kiến thức & Công cụ Tính Lâm sàng</span>
        </h2>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
            onClick={() => setActiveTab('knowledge')}
          >
            Kiến thức GDMT
          </button>
          <button
            type="button"
            className={`segmented-btn ${activeTab === 'calculators' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('calculators');
              if (Object.keys(calcInputs).length === 0 && currentCalc) {
                handleSelectCalc(currentCalc.id);
              }
            }}
          >
            Công cụ tính ({calculatorRegistry.length})
          </button>
        </div>
      </div>

      {activeTab === 'knowledge' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
          <section style={{ padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem' }}>
              1. Bốn trụ cột nền tảng trong HFrEF (ESC 2026 / ACC/AHA)
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Khởi động sớm và song song cả 4 nhóm thuốc trong vòng 4–6 tuần giúp giảm đáng kể nguy cơ tử vong do mọi nguyên nhân và nhập viện do suy tim:
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
              <li><strong>ARNI (Sacubitril/Valsartan):</strong> Ưu tiên thay thế ACEi/ARB khi SBP ≥ 100 mmHg (cần ngừng ACEi ≥ 36 giờ trước liều đầu).</li>
              <li><strong>Chẹn beta giao cảm (Bisoprolol, Carvedilol, Metoprolol succinate, Nebivolol):</strong> Chuẩn độ từ liều thấp khi huyết động ổn định.</li>
              <li><strong>MRA (Spironolactone, Eplerenone):</strong> Gating K⁺ ≤ 5.0 mmol/L và eGFR ≥ 30 mL/min/1.73m².</li>
              <li><strong>SGLT2i (Dapagliflozin, Empagliflozin):</strong> Khởi trị sớm không cần chuẩn độ liều, bảo vệ tim thận độc lập với đái tháo đường.</li>
            </ul>
          </section>

          <section style={{ padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem' }}>
              2. Trụ cột bảo vệ tim - thận ở bệnh nhân ĐTĐ típ 2 và CKD (KDIGO 2024 / ADA 2026)
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Chiến lược đa tầng tập trung giảm tiến triển suy thận và biến cố xơ vữa:
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
              <li><strong>SGLT2i:</strong> Chỉ định khi eGFR ≥ 20 mL/min/1.73m² kèm albumin niệu hoặc đái tháo đường. Tiếp tục dùng đến khi lọc máu.</li>
              <li><strong>RASi (ACEi / ARB):</strong> Liều dung nạp tối đa ở bệnh nhân THA kèm albumin niệu.</li>
              <li><strong>Finerenone (MRA không steroid):</strong> Chỉ định ở ĐTĐ típ 2 có CKD tồn dư albumin niệu dù đã tối ưu RASi, khi K⁺ ≤ 4.8 mmol/L và eGFR ≥ 25 mL/min/1.73m².</li>
              <li><strong>GLP-1 RA:</strong> Bằng chứng vượt trội trên biến cố tim mạch ASCVD và làm chậm suy thận (thử nghiệm FLOW).</li>
            </ul>
          </section>

          <section style={{ padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem' }}>
              3. Quy tắc "Ngày ốm" (Sick-day rules)
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Tạm hoãn nhóm thuốc SADMAN (SGLT2i, ACEi, Diuretics, Metformin, ARBs, NSAIDs) khi bệnh nhân có nguy cơ mất nước, sốt cao, nôn ói, tiêu chảy cấp hoặc phẫu thuật lớn để phòng ngừa suy thận cấp và toan lactic/toan ceton đẳng đường huyết.
            </p>
          </section>
        </div>
      )}

      {activeTab === 'calculators' && (
        <div>
          {/* Danh sách máy tính */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
              Chọn máy tính lâm sàng:
            </label>
            <div className="chips-container">
              {calculatorRegistry.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`disease-chip ${selectedCalcId === c.id ? 'selected' : ''}`}
                  onClick={() => handleSelectCalc(c.id)}
                >
                  {c.nameVi.split('(')[0].trim()}
                  {c.source.needsSourceVerification && (
                    <span style={{ fontSize: '0.7rem', color: '#eab308' }} title="Cần đối chiếu nguồn PDF gốc">
                      ⚠️
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {currentCalc && (
            <div style={{ background: 'var(--bg-muted)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {currentCalc.nameVi}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {currentCalc.shortDescriptionVi}
                  </div>
                </div>

                {/* Cờ kiểm chứng nguồn */}
                {currentCalc.source.needsSourceVerification ? (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: '#fef9c3',
                      color: '#854d0e',
                      border: '1px solid #fde047'
                    }}
                  >
                    ⚠️ Chưa kiểm chứng nguồn (Chờ đối chiếu PDF)
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: '#dcfce7',
                      color: '#166534',
                      border: '1px solid #86efac'
                    }}
                  >
                    ✓ Đã kiểm chứng nguồn
                  </span>
                )}
              </div>

              {/* Hộp cảnh báo nổi bật khi needsSourceVerification === true */}
              {resultNeedsVerification && (
                <div
                  data-testid="unverified-source-warning"
                  role="alert"
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #f59e0b',
                    borderLeft: '4px solid #d97706',
                    borderRadius: '6px',
                    padding: '0.75rem 0.9rem',
                    marginBottom: '0.85rem',
                    fontSize: '0.85rem',
                    color: '#92400e'
                  }}
                >
                  <strong>⚠️ Cảnh báo bắt buộc đối chiếu nguồn gốc:</strong> Bảng hệ số hoặc ngưỡng tham chiếu của công cụ{' '}
                  <strong>{currentCalc.nameVi}</strong> hiện gắn cờ <code>needsSourceVerification = true</code> (chưa được xác thực tự động trực tiếp trên tệp PDF gốc trong thư viện). Kết quả dưới đây chỉ mang tính ước tính tham khảo lâm sàng; bác sĩ cần đối chiếu hướng dẫn gốc ({currentCalc.source.organization} {currentCalc.source.year}) trước khi quyết định điều trị.
                </div>
              )}

              {/* Form nhập liệu máy tính */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', margin: '1rem 0' }}>
                {currentCalc.inputs.map((inp) => {
                  const val = calcInputs[inp.id];
                  return (
                    <div key={inp.id} className="form-group">
                      <label className="form-label">
                        {inp.labelVi} {inp.unit ? `(${inp.unit})` : ''}
                      </label>
                      {inp.type === 'select' ? (
                        <select
                          className="form-input"
                          value={String(val ?? inp.defaultValue ?? '')}
                          onChange={(e) => setCalcInputs({ ...calcInputs, [inp.id]: e.target.value })}
                        >
                          {inp.options?.map((opt) => (
                            <option key={String(opt.value)} value={String(opt.value)}>
                              {opt.labelVi}
                            </option>
                          ))}
                        </select>
                      ) : inp.type === 'boolean' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', height: '42px' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(val ?? inp.defaultValue)}
                            onChange={(e) => setCalcInputs({ ...calcInputs, [inp.id]: e.target.checked })}
                          />
                          <span>Có</span>
                        </label>
                      ) : (
                        <input
                          type="number"
                          inputMode="decimal"
                          step={inp.step ?? 1}
                          className="form-input"
                          value={val !== undefined ? String(val) : String(inp.defaultValue ?? '')}
                          onChange={(e) => setCalcInputs({ ...calcInputs, [inp.id]: e.target.value ? Number(e.target.value) : undefined })}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="btn-header"
                style={{
                  background: 'var(--primary)',
                  color: '#ffffff',
                  minHeight: '38px',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
                onClick={handleRunCalc}
              >
                🔢 Tính toán kết quả
              </button>

              {/* Hiển thị kết quả */}
              {calcResult !== null && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'var(--bg-surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}
                  data-testid="calculator-result-box"
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    Kết quả tính toán:
                  </div>
                  <pre
                    style={{
                      background: 'var(--bg-muted)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      overflowX: 'auto',
                      maxHeight: '260px',
                      fontFamily: 'monospace'
                    }}
                  >
                    {JSON.stringify(calcResult, null, 2)}
                  </pre>
                </div>
              )}

              {/* Nguồn trích dẫn */}
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                <strong>Tài liệu nguồn:</strong> {currentCalc.source.organization} • {currentCalc.source.guideline} ({currentCalc.source.year}) • {currentCalc.source.locator}
                {currentCalc.source.notesVi && (
                  <div>Ghi chú: {currentCalc.source.notesVi}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
