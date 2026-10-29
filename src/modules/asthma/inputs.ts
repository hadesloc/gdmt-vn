/**
 * GDMT-VN Module Hen phế quản (Asthma) - Input Schema
 * Phân quyền: Agent M
 *
 * Khai báo đầy đủ các trường nhập chuyên sâu:
 * 1. 4 câu hỏi kiểm soát GINA trong 4 tuần qua.
 * 2. Tiền sử đợt cấp 12 tháng, FEV1, PEF, BCAT (Eosinophils), FeNO, bệnh đồng mắc.
 * 3. Phác đồ hiện tại (Track 1 / Track 2), bậc hiện tại (1–5), kỹ thuật hít, tuân thủ.
 * 4. Cấp cứu / Đợt cấp nội viện: khả năng nói, nhịp thở, co kéo cơ hô hấp, ý thức, phổi im lặng.
 */

import type { ModuleInputSchema } from '../../engine/types';

export const asthmaInputs: ModuleInputSchema = {
  groups: [
    {
      id: 'asthma_control_group',
      titleVi: 'Đánh giá mức độ kiểm soát hen (GINA 4 tuần qua)',
      descriptionVi: 'Khung đánh giá kiểm soát triệu chứng hen theo GINA 2026 (Box 2-2) và Bộ Y tế QĐ 1851/2020',
      fields: [
        {
          id: 'customInputs.daytimeSymptomsMoreThanTwiceWeek',
          labelVi: '1. Triệu chứng hen ban ngày > 2 lần/tuần trong 4 tuần qua?',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Ho, khò khè, nặng ngực hoặc khó thở ban ngày xuất hiện trên 2 lần mỗi tuần'
        },
        {
          id: 'customInputs.nightWakingDueToAsthma',
          labelVi: '2. Có bất kỳ lần thức giấc ban đêm nào do triệu chứng hen?',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Thức giấc do ho, khó thở, thở rít trong đêm trong 4 tuần qua'
        },
        {
          id: 'customInputs.relieverNeededMoreThanTwiceWeek',
          labelVi: '3. Cần dùng thuốc cắt cơn SABA > 2 lần/tuần? (Chỉ tính SABA; không tính ICS-formoterol Track 1)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chỉ áp dụng khi người bệnh dùng thuốc cắt cơn là SABA (Salbutamol, Ventolin, Terbutaline); không tính thuốc cắt cơn chống viêm ICS-formoterol trong Track 1 và không tính lần hít dự phòng trước vận động'
        },
        {
          id: 'customInputs.activityLimitationDueToAsthma',
          labelVi: '4. Bất kỳ sự giới hạn hoạt động thể lực nào do hen?',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Phải giảm bớt hoặc không thể tham gia vận động, làm việc, thể thao vì hen'
        }
      ]
    },
    {
      id: 'asthma_history_and_risks_group',
      titleVi: 'Tiền sử đợt cấp, Chức năng phổi & Yếu tố nguy cơ',
      descriptionVi: 'Đánh giá nguy cơ tương lai, kiểu hình viêm Type 2 và các bệnh lý đi kèm',
      fields: [
        {
          id: 'customInputs.exacerbationsLastYear',
          labelVi: 'Số đợt cấp trong 12 tháng qua (cần OCS hoặc nhập viện)',
          type: 'number',
          min: 0,
          max: 20,
          step: 1,
          defaultValue: 0,
          unit: 'đợt/năm',
          helpVi: 'Tiền sử ≥ 1 đợt cấp trong năm qua là yếu tố nguy cơ độc lập mạnh nhất cho đợt cấp tái phát'
        },
        {
          id: 'fev1Pct',
          labelVi: 'FEV₁ % giá trị dự đoán sau giãn phế quản',
          type: 'number',
          min: 15,
          max: 140,
          step: 1,
          unit: '%',
          placeholder: 'vd: 68',
          helpVi: 'FEV₁ < 60% dự đoán là yếu tố nguy cơ đợt cấp nặng và chỉ điểm hen kiểm soát kém'
        },
        {
          id: 'customInputs.pefPct',
          labelVi: 'Tỷ lệ Lưu lượng đỉnh (PEF %) so với giá trị dự đoán (%)',
          type: 'number',
          min: 15,
          max: 140,
          step: 1,
          unit: '%',
          placeholder: 'vd: 75',
          helpVi: 'Chỉ nhập tỷ lệ phần trăm (vd: 75 tương ứng 75%); dùng khi chưa biết PEF cá nhân tốt nhất theo L/phút'
        },
        {
          id: 'customInputs.pefBestLMin',
          labelVi: 'Lưu lượng đỉnh (PEF) cá nhân tốt nhất đo được tuyệt đối (L/phút)',
          type: 'number',
          min: 50,
          max: 900,
          step: 10,
          unit: 'L/phút',
          placeholder: 'vd: 500',
          helpVi: 'Giá trị thể tích lưu lượng đỉnh tốt nhất đo bằng lưu lượng đỉnh kế khi hen ổn định (vd: 450–600 L/phút); dùng để tính ngưỡng L/phút trong Kế hoạch hành động hen'
        },
        {
          id: 'customInputs.bloodEosinophils',
          labelVi: 'Bạch cầu ái toan máu ngoại vi (Blood Eosinophils / BCAT)',
          type: 'number',
          min: 0,
          max: 3000,
          step: 10,
          unit: 'tế bào/µL',
          placeholder: 'vd: 350',
          helpVi: 'BCAT ≥ 300 tế bào/µL (hoặc ≥ 150 khi đang dùng OCS) gợi ý kiểu hình viêm Type 2 đáp ứng tốt với thuốc sinh học'
        },
        {
          id: 'customInputs.feno',
          labelVi: 'Nồng độ NO trong khí thở ra (FeNO)',
          type: 'number',
          min: 0,
          max: 200,
          step: 1,
          unit: 'ppb',
          placeholder: 'vd: 40',
          helpVi: 'FeNO ≥ 20–50 ppb chỉ điểm viêm đường thở qua trung gian bạch cầu ái toan'
        },
        {
          id: 'customInputs.allergicPhenotype',
          labelVi: 'Kiểu hình dị ứng (IgE đặc hiệu hoặc test lẩy da dương tính)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Điều kiện chỉ định thuốc sinh học kháng IgE (Omalizumab) ở Bậc 5'
        },
        {
          id: 'customInputs.smokingStatus',
          labelVi: 'Tình trạng hút thuốc lá / thuốc lào',
          type: 'select',
          options: [
            { value: 'never', label: 'Không bao giờ hút thuốc' },
            { value: 'former', label: 'Đã cai thuốc lá' },
            { value: 'current', label: 'Hiện đang hút thuốc lá / thuốc lào' }
          ],
          defaultValue: 'never',
          helpVi: 'Khói thuốc lá làm giảm đáp ứng với corticosteroid hít và tăng tần suất đợt cấp'
        },
        {
          id: 'conditions.allergicRhinitis',
          labelVi: 'Bệnh lý viêm mũi dị ứng / Viêm xoang mạn',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Một bệnh lý đường thở thống nhất - cần điều trị đồng thời viêm mũi dị ứng để kiểm soát hen'
        },
        {
          id: 'conditions.gerd',
          labelVi: 'Trào ngược dạ dày thực quản (GERD)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'GERD chưa điều trị là yếu tố kích phát cơn hen về đêm dai dẳng'
        },
        {
          id: 'conditions.obesity',
          labelVi: 'Béo phì (BMI ≥ 30 kg/m² hoặc thể trạng thừa cân nhiều)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Béo phì làm thay đổi cơ học phổi, giảm thể tích khí cặn chức năng và khó kiểm soát hen'
        },
        {
          id: 'conditions.aerd',
          labelVi: 'Hen phế quản nhạy cảm Aspirin / NSAID (AERD / Tam chứng Samter)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Tiền sử co thắt phế quản cấp hoặc polyp mũi/viêm xoang mạn nặng lên sau dùng Aspirin hoặc thuốc kháng viêm NSAID ức chế COX-1'
        },
        {
          id: 'conditions.pregnant',
          labelVi: 'Bệnh nhân nữ đang mang thai',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Cần duy trì liên tục thuốc kiểm soát chứa ICS (đặc biệt Budesonide) và không tự ý hạ bậc trong thai kỳ vì thiếu oxy do cơn hen nguy hiểm hơn tác dụng phụ của thuốc'
        },
        {
          id: 'conditions.breastfeeding',
          labelVi: 'Bệnh nhân nữ đang cho con bú',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Corticosteroid hít (ICS) và SABA/LABA an toàn khi cho con bú; lưu ý thận trọng và theo dõi trẻ khi dùng corticoid toàn thân liều cao, Montelukast hoặc Theophylline'
        },
        {
          id: 'conditions.severeMilkProteinAllergy',
          labelVi: 'Dị ứng nặng đạm sữa bò (Phản vệ với protein sữa bò / Lactose bình bột khô)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định tất cả bình hít bột khô (DPI: Turbuhaler, Accuhaler/Diskus, Ellipta, Nexthaler, Breezhaler) do chứa tá dược lactose mang vết đạm sữa bò; bắt buộc dùng bình xịt định liều pMDI không chứa lactose'
        },
        {
          id: 'conditions.narrowAngleGlaucoma',
          labelVi: 'Tăng nhãn áp góc đóng / Glôcôm góc hẹp',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Khi dùng kháng cholinergic khí dung (Ipratropium) bắt buộc dùng ống ngậm miệng (mouthpiece) và bảo vệ mắt, tuyệt đối không chụp mặt nạ hở tránh giãn đồng tử cấp'
        },
        {
          id: 'conditions.myastheniaGravis',
          labelVi: 'Nhược cơ (Myasthenia gravis) hoặc Block nhĩ thất độ cao',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Chống chỉ định tuyệt đối truyền tĩnh mạch Magnesium sulfate do nguy cơ liệt cơ hô hấp và ngừng dẫn truyền nhĩ thất'
        }
      ]
    },
    {
      id: 'asthma_regimen_technique_group',
      titleVi: 'Phác đồ điều trị hiện tại & Kỹ thuật dùng thuốc',
      descriptionVi: 'Phân loại Track 1 (ICS-formoterol cắt cơn) vs Track 2 (SABA cắt cơn) và kiểm tra tuân thủ',
      fields: [
        {
          id: 'customInputs.currentTrack',
          labelVi: 'Phân nhánh điều trị hiện tại (Track)',
          type: 'select',
          options: [
            { value: 'none', label: 'Chưa dùng thuốc kiểm soát (Khởi trị ban đầu)' },
            { value: 'track1', label: 'Track 1 (Ưu tiên GINA): ICS-formoterol làm thuốc cắt cơn (AIR/MART)' },
            { value: 'track2', label: 'Track 2 (Thay thế): SABA làm thuốc cắt cơn' }
          ],
          defaultValue: 'track1',
          helpVi: 'Track 1 là phân nhánh ưu tiên của GINA 2026 giúp giảm tối đa nguy cơ đợt cấp nặng'
        },
        {
          id: 'customInputs.currentStep',
          labelVi: 'Bậc điều trị hiện tại',
          type: 'select',
          options: [
            { value: 0, label: 'Chưa phân bậc (Khởi đầu mới)' },
            { value: 1, label: 'Bậc 1: Triệu chứng nhẹ ngắt quãng' },
            { value: 2, label: 'Bậc 2: Liều thấp ICS hoặc AIR khi cần' },
            { value: 3, label: 'Bậc 3: Liều thấp ICS-LABA hoặc MART liều thấp' },
            { value: 4, label: 'Bậc 4: Liều trung bình ICS-LABA hoặc MART liều trung bình' },
            { value: 5, label: 'Bậc 5: Liều cao ICS-LABA ± LAMA ± Thuốc sinh học' }
          ],
          defaultValue: 0,
          helpVi: 'Xác định bậc điều trị hiện tại để tính toán chuẩn độ tăng bậc hoặc hạ bậc'
        },
        {
          id: 'customInputs.wellControlledMonths',
          labelVi: 'Số tháng duy trì kiểm soát hen ổn định liên tục',
          type: 'number',
          min: 0,
          max: 60,
          step: 1,
          defaultValue: 0,
          unit: 'tháng',
          helpVi: 'GINA và BYT khuyến cáo chỉ xem xét hạ bậc sau khi đã kiểm soát tốt ổn định liên tục ≥ 2–3 tháng'
        },
        {
          id: 'customInputs.inhalerTechniqueCorrect',
          labelVi: 'Kỹ thuật xịt/hít bình hít đã được kiểm tra và làm đúng',
          type: 'boolean',
          defaultValue: true,
          helpVi: 'Bắt buộc kiểm tra kỹ thuật hít và sửa sai trước khi quyết định tăng bậc điều trị'
        },
        {
          id: 'customInputs.goodAdherence',
          labelVi: 'Sự tuân thủ dùng thuốc ngừa cơn đều đặn',
          type: 'boolean',
          defaultValue: true,
          helpVi: 'Kém tuân thủ là nguyên nhân phổ biến nhất khiến hen không kiểm soát'
        },
        {
          id: 'customInputs.sabaOnly',
          labelVi: 'Hiện chỉ đang dùng thuốc cắt cơn SABA đơn độc (không có ICS)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'GINA 2026 chống chỉ định SABA đơn độc vì làm tăng nguy cơ tử vong do hen'
        },
        {
          id: 'customInputs.icsFormoterolStrength',
          labelVi: 'Hàm lượng bình hít ICS-formoterol đang dùng (nếu theo Track 1)',
          type: 'select',
          options: [
            { value: '160_4.5', label: 'Budesonide/Formoterol 160/4.5 mcg (Turbuhaler / chuẩn 1 nhát)' },
            { value: '80_2.25', label: 'Budesonide/Formoterol 80/2.25 mcg (Symbicort Rapihaler pMDI - nhân đôi số nhát)' },
            { value: '100_6', label: 'Beclometasone/Formoterol 100/6 mcg (Foster pMDI/Nexthaler - người lớn ≥ 18 tuổi)' }
          ],
          defaultValue: '160_4.5',
          helpVi: 'Rapihaler pMDI 80/2.25 mcg chứa nửa liều mỗi nhát xịt nên liều duy trì và trần tối đa 24 giờ nhân đôi (24 nhát/ngày thay vì 12 nhát/ngày)'
        },
        {
          id: 'customInputs.totalDailyPuffsUsed',
          labelVi: 'Số nhát hít ICS-formoterol đã dùng trong 24 giờ qua',
          type: 'number',
          min: 0,
          max: 36,
          step: 1,
          defaultValue: 0,
          unit: 'nhát/ngày',
          helpVi: 'Trần tối đa Formoterol trong phác đồ MART là 12 nhát/ngày với loại 160/4.5 hoặc 100/6 mcg (hoặc 24 nhát/ngày với Rapihaler 80/2.25 mcg)'
        }
      ]
    },
    {
      id: 'asthma_inpatient_acute_group',
      titleVi: 'Phân loại & Xử trí Cơn hen cấp (Cấp cứu / Nội viện & Tuyến ban đầu)',
      descriptionVi: 'Phân tầng mức độ nặng theo GINA 2026 Box 4-2 / Box 9-3 và Bộ Y tế QĐ 1851/2020 & QĐ 5850/2021',
      fields: [
        {
          id: 'customInputs.isAcuteExacerbation',
          labelVi: 'Bệnh nhân đang có đợt cấp / Cơn hen phế quản cấp tính',
          type: 'boolean',
          helpVi: 'Bật cờ này để kích hoạt phác đồ cấp cứu cơn hen; tắt cờ nếu bệnh nhân nằm viện vì lý do khác hoặc đã ổn định'
        },
        {
          id: 'customInputs.spo2',
          labelVi: 'Độ bão hòa oxy mao mạch SpO₂ thở khí trời (%)',
          type: 'number',
          min: 50,
          max: 100,
          step: 1,
          unit: '%',
          placeholder: 'vd: 92',
          helpVi: 'SpO₂ < 90% phân loại cơn hen cấp nặng; thở oxy bổ sung khi SpO₂ < 93% với đích duy trì 93–95% (phụ nữ mang thai ≥ 95%)'
        },
        {
          id: 'customInputs.paco2',
          labelVi: 'Phân áp CO₂ máu động mạch PaCO₂ (mmHg)',
          type: 'number',
          min: 15,
          max: 120,
          step: 1,
          unit: 'mmHg',
          placeholder: 'vd: 48',
          helpVi: 'PaCO₂ bình thường cao (≥ 40–45 mmHg) cảnh báo mệt cơ hô hấp; PaCO₂ > 45 mmHg chỉ điểm suy hô hấp tăng CO₂ đe dọa tính mạng'
        },
        {
          id: 'customInputs.abgPh',
          labelVi: 'pH máu động mạch (ABG pH)',
          type: 'number',
          min: 6.8,
          max: 7.7,
          step: 0.01,
          placeholder: 'vd: 7.28',
          helpVi: 'Toan hô hấp cấp (pH < 7.35, đặc biệt ≤ 7.25) là dấu hiệu suy hô hấp nguy kịch cần hội chẩn ICU / đặt nội khí quản'
        },
        {
          id: 'customInputs.speechAbility',
          labelVi: 'Khả năng nói khi gắng sức',
          type: 'select',
          options: [
            { value: 'sentences', label: 'Nói cả câu bình thường (Nhẹ - Trung bình)' },
            { value: 'phrases', label: 'Nói từng cụm từ ngắn ngắt quãng (Trung bình)' },
            { value: 'words', label: 'Chỉ nói được từng từ riêng lẻ (Cơn hen nặng)' },
            { value: 'unable', label: 'Không thể nói được / Thở hắt (Nguy kịch)' }
          ],
          helpVi: 'Chỉ nói được từng từ riêng lẻ phân loại Cơn hen cấp nặng; nói từng cụm từ ngắn phân loại Cơn hen cấp trung bình'
        },
        {
          id: 'customInputs.respiratoryRate',
          labelVi: 'Nhịp thở thực tế (Respiratory Rate)',
          type: 'number',
          min: 4,
          max: 60,
          step: 1,
          unit: 'lần/phút',
          placeholder: 'vd: 28',
          helpVi: 'Nhịp thở > 30 lần/phút chỉ điểm cơn hen cấp nặng; thở chậm < 10 lần/phút chỉ điểm kiệt sức hô hấp nguy kịch'
        },
        {
          id: 'customInputs.accessoryMuscleUse',
          labelVi: 'Co kéo cơ hô hấp phụ / Hõm ức / Tư thế ngồi ngả ra trước',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'Dấu hiệu tăng công hô hấp rõ rệt trong cơn hen nặng'
        },
        {
          id: 'customInputs.silentChest',
          labelVi: 'Lồng ngực im lặng (Silent chest - tiếng thở rít/khò khè giảm hẳn hoặc mất)',
          type: 'boolean',
          defaultValue: false,
          helpVi: 'DẤU HIỆU NGUY KỊCH: Đường thở tắc nghẽn gần hoàn toàn, luồng khí lưu thông quá yếu để tạo ra tiếng rít'
        },
        {
          id: 'customInputs.mentalStatus',
          labelVi: 'Tình trạng ý thức & tri giác',
          type: 'select',
          options: [
            { value: 'alert', label: 'Tỉnh táo, hợp tác' },
            { value: 'anxious', label: 'Kích động, hoảng hốt, vật vã' },
            { value: 'drowsy_confused', label: 'Ngủ gà, lơ mơ, lú lẫn, kiệt sức (Nguy kịch đe dọa tính mạng)' }
          ],
          defaultValue: 'alert',
          helpVi: 'Bệnh nhân ngủ gà hoặc lú lẫn cần chuyển ngay vào khoa Hồi sức tích cực (ICU)'
        },
        {
          id: 'customInputs.acuteResponseAfter1h',
          labelVi: 'Đánh giá đáp ứng sau 1 giờ điều trị tích cực ban đầu',
          type: 'select',
          options: [
            { value: 'not_assessed', label: 'Chưa đánh giá lại sau 1 giờ' },
            { value: 'good_response', label: 'Đáp ứng tốt: Hết khó thở, PEF > 70% GTLT, SpO2 ≥ 94%' },
            { value: 'incomplete_response', label: 'Đáp ứng một phần: Còn thở nhanh nhẹ, PEF 50–70%' },
            { value: 'poor_response', label: 'Không đáp ứng / Xấu đi: Khó thở tăng, PEF < 50%, kiệt sức' }
          ],
          defaultValue: 'not_assessed',
          helpVi: 'Quyết định cho xuất viện về nhà hoặc tiếp tục nhập viện theo dõi nội trú'
        }
      ]
    }
  ]
};
