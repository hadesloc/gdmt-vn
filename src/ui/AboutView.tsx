export const AboutView = () => {
  return (
    <div className="panel" data-testid="about-view-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span>ℹ️ Giới thiệu dự án GDMT-VN</span>
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
        <p>
          <strong>GDMT-VN</strong> là ứng dụng web tiến bộ (PWA) hỗ trợ quyết định lâm sàng theo mục tiêu chuẩn y khoa (Guideline-Directed Medical Therapy) cho 9 bệnh lý mạn tính thường gặp: Bệnh thận mạn (CKD), Đái tháo đường típ 2, Tăng huyết áp, COPD, Hen phế quản, Gút, Suy tim, Rối loạn lipid máu và Rung nhĩ.
        </p>

        <section style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.35rem' }}>
            ⚠️ Tuyên bố miễn trừ trách nhiệm y khoa (Medical Disclaimer)
          </h3>
          <p style={{ color: '#7f1d1d', fontSize: '0.85rem' }}>
            Đây là bản thử nghiệm nội bộ với ca giả lập để kiểm tra trải nghiệm. Các module và nguồn vẫn đang được rà soát, chưa hoàn tất kiểm định lâm sàng. Không dùng bản thử nghiệm để ra quyết định điều trị cho bệnh nhân thực.
          </p>
        </section>

        <section style={{ padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            🔒 Quyền riêng tư & An toàn dữ liệu
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Hồ sơ được xử lý cục bộ trên trình duyệt, không có backend nhận hồ sơ. Tệp lưu và liên kết chia sẻ đều chứa dữ liệu bạn đã nhập. Bản thử nghiệm chỉ dùng dữ liệu giả lập. Có thể mở lại ngoại tuyến trên localhost hoặc HTTPS sau khi ứng dụng được tải và lưu bộ nhớ đệm thành công; HTTP trên mạng LAN không hỗ trợ đầy đủ chế độ PWA.
          </p>
        </section>

        <section style={{ padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            📌 Tiêu chuẩn kiểm chứng Knowledge Base
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Có thể mở từng khuyến cáo để xem lý do, cổng an toàn, đoạn trích dẫn, nguồn và trang. Nhãn bản nháp phản ánh việc chưa duyệt nội dung hiện hành; kiểm tra cấu trúc, hash hoặc trích dẫn không thay thế review chuyên môn. Tài liệu nguồn và các finding còn mở đang được rà soát theo kế hoạch của dự án.
          </p>
        </section>
      </div>
    </div>
  );
};
