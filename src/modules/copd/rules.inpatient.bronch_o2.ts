import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor, drug, hasDrug } from '../../kb-types';
import {
  COPD_PROFILES,
  SAMA_CONTAINING_IDS,
  getRestingSpo2,
  getAbgPh,
  getAbgPaco2,
  hasCurrentMed,
  findAllCurrentMedsInSet,
  hasSupplementalOxygen,
  hasAnticholinergicContra,
  hasConcurrentAsthma,
  isAcuteExacerbation,
  hasOutpatientAcuteRespiratoryFailure,
  copdMissingRec,
} from './helpers';

function makeIpratropiumContraRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.inpatient.ipratropium_contra_avoid'
        : `copd.inpatient.ipratropium_contra_avoid_${slotIndex}`,
    module: 'copd',
    nameVi: 'Chặn phối hợp SAMA (Ipratropium / Berodual / Combivent) trong đợt cấp khi có glôcôm góc đóng / bí tiểu',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.lama_glaucoma_caution', 'gina.copd.2026.lama_urinary_retention'],
    when: (ctx) => {
      if (!isAcuteExacerbation(ctx) || !hasAnticholinergicContra(ctx)) return false;
      const samaMeds = findAllCurrentMedsInSet(ctx, SAMA_CONTAINING_IDS);
      if (slotIndex === 0) return true;
      return samaMeds.length > slotIndex;
    },
    produce: (ctx) => {
      const samaMeds = findAllCurrentMedsInSet(ctx, SAMA_CONTAINING_IDS);
      const med = samaMeds[slotIndex];
      if (!med) {
        return {
          id: 'rec_copd_inpatient_avoid_ipratropium_contra',
          module: 'copd',
          tier: 'An toàn thuốc bắt buộc',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'ipratropium',
          drugNameVi: 'Ipratropium bromide / SABA+SAMA (Atrovent, Berodual, Combivent)',
          dose: undefined,
          title: 'TRÁNH DÙNG khí dung/xịt chứa Ipratropium (SAMA / SABA+SAMA) do glôcôm góc đóng / bí tiểu cấp',
          rationale:
            'Theo GOLD 2026 (Appendix 3, PDF p. 157), dung dịch kháng cholinergic phun khí dung (đặc biệt qua mặt nạ) tiếp xúc với mắt có thể khởi phát cơn glôcôm góc đóng cấp tính hoặc làm nặng bí tiểu cấp. Chỉ dùng SABA đơn thuần (Salbutamol) để cắt cơn trong đợt cấp.',
          gates: [],
          citationIds: ['gold.copd.2026.lama_glaucoma_caution', 'gina.copd.2026.lama_urinary_retention'],
          priority: 106,
        };
      }

      const rawId = med.drugId.trim();
      const medName =
        med.name || (hasDrug(rawId.toLowerCase()) ? drug(rawId.toLowerCase()).nameVi : rawId);

      return {
        id:
          slotIndex === 0
            ? 'rec_copd_inpatient_avoid_ipratropium_contra'
            : `rec_copd_inpatient_avoid_ipratropium_contra_${slotIndex}`,
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'STOP',
        drugId: rawId,
        drugNameVi: medName,
        dose: undefined,
        title: `NGỪNG NGAY ${medName} (chứa kháng cholinergic SAMA) trong đợt cấp do glôcôm góc đóng / bí tiểu cấp`,
        rationale: `Người bệnh đang dùng ${medName} (chứa Ipratropium kháng muscarinic) trên nền glôcôm góc đóng hoặc bí tiểu cấp. Theo GOLD 2026 (Appendix 3, PDF p. 157), phải ngừng ngay mọi chế phẩm SAMA đơn chất hoặc phối hợp SABA+SAMA (Atrovent, Berodual, Combivent) và chuyển sang SABA đơn thuần (Salbutamol) cắt cơn.`,
        gates: [],
        citationIds: ['gold.copd.2026.lama_glaucoma_caution', 'gina.copd.2026.lama_urinary_retention'],
        priority: 106,
      };
    },
  };
}

export const copdInpatientBronchO2Rules: Rule[] = [
  {
    id: 'copd.inpatient.short_acting_bronchodilators',
    module: 'copd',
    nameVi: 'Thuốc giãn phế quản tác dụng ngắn (SABA ± SAMA) giờ đầu và duy trì trong đợt cấp',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'byt.copd.2026.bronchodilator_short_acting',
      'byt.copd.2026.salbutamol_neb_dose',
      'gold.copd.2026.exac_saba_initial',
      'gold.copd.2026.exac_saba_first_hour',
      'gold.copd.2026.lama_glaucoma_caution',
    ],
    when: (ctx) => isAcuteExacerbation(ctx),
    produce: (ctx) => {
      const nebDose = thFor('dose_mg', 'copd.salbutamol_nebulizer_dose');
      const minFirstHour = thFor('doses_count', 'copd.exac_saba_first_hour_min_doses');
      const maxFirstHour = thFor('doses_count', 'copd.exac_saba_first_hour_max_doses');
      const alreadyOnSaba = hasCurrentMed(ctx, 'salbutamol');
      const antiCholContra = hasAnticholinergicContra(ctx);
      const coAsthma = hasConcurrentAsthma(ctx);
      const o2Min = thFor('restingSpo2', 'copd.oxygen_target_spo2_min');
      const o2Max = thFor('restingSpo2', 'copd.oxygen_target_spo2_max');
      const isMildModOutpatient =
        ctx.settings.setting === 'outpatient' && !hasOutpatientAcuteRespiratoryFailure(ctx);

      const asthmaNebDose = thFor('dose_mg', 'asthma.acute.salbutamol_neb_dose');
      const asthmaRepeatMin = thFor('duration_min', 'asthma.acute.repeat_interval_min');

      const doseText = isMildModOutpatient
        ? antiCholContra
          ? `Salbutamol bình xịt định liều (pMDI) qua buồng đệm: xịt 1–${minFirstHour} nhát mỗi giờ × ${minFirstHour}–${maxFirstHour} liều đầu khi khó thở tăng, sau đó xịt mỗi 4–6 giờ tùy đáp ứng ngoại trú (TRÁNH Ipratropium do glôcôm góc đóng / bí tiểu)`
          : `Salbutamol bình xịt định liều (pMDI) qua buồng đệm (± Ipratropium pMDI): xịt 1–${minFirstHour} nhát mỗi giờ × ${minFirstHour}–${maxFirstHour} liều đầu, sau đó duy trì mỗi 4–6 giờ ngoại trú tùy đáp ứng lâm sàng`
        : antiCholContra
          ? `Salbutamol ${nebDose} mg đơn thuần (KHÔNG phối hợp Ipratropium do glôcôm góc đóng / bí tiểu) phun khí dung bằng máy nén khí mỗi giờ × ${minFirstHour}–${maxFirstHour} liều trong giờ đầu, sau đó mỗi 2–4–6 giờ tùy đáp ứng`
          : coAsthma
            ? `Salbutamol ${nebDose}–${asthmaNebDose} mg (± Ipratropium trong giờ đầu) phun khí dung bằng máy nén khí lặp lại sát trong giờ đầu (${minFirstHour}–${maxFirstHour} liều liên tiếp / mỗi ${asthmaRepeatMin} phút khi co thắt phế quản nặng kiểu chồng lấp Hen–COPD), sau đó mỗi 2–4 giờ tùy đáp ứng; giữ đích SpO₂ ${o2Min}–${o2Max}%`
            : `Salbutamol ${nebDose} mg (± phối hợp Ipratropium kháng cholinergic tác dụng ngắn) phun khí dung bằng máy nén khí mỗi 1 giờ × ${minFirstHour}–${maxFirstHour} liều đầu (hoặc pMDI qua buồng đệm), sau đó giãn ra mỗi 2–4–6 giờ tùy đáp ứng lâm sàng`;

      const warnings: string[] = isMildModOutpatient
        ? [
            'Ưu tiên dùng bình xịt định liều (pMDI) kết hợp buồng đệm (spacer) để tối ưu lắng đọng phổi ngoại trú; dặn người bệnh đến ngay Cấp cứu nếu khó thở tăng nhanh, không giảm sau xịt hoặc lơ mơ.',
            'Theo dõi nhịp tim nhanh và run tay khi tăng tần suất xịt SABA.',
          ]
        : [
            'Chạy khí dung bằng máy nén khí (khí trời), tuyệt đối không chạy khí dung bằng nguồn oxy dòng cao không kiểm soát ở bệnh nhân có nguy cơ tăng CO₂ máu.',
            'Theo dõi tần số tim và Kali máu khi phun khí dung SABA lặp lại nhiều liều trong giờ đầu.',
          ];
      if (antiCholContra) {
        warnings.unshift(
          'CHỐNG CHỈ ĐỊNH / TRÁNH SAMA: Bệnh nhân có glôcôm góc đóng hoặc bí tiểu cấp – tuyệt đối không dùng kèm Ipratropium (Atrovent/Berodual/Combivent) và không phun khí dung kháng cholinergic qua mặt nạ (facemask) tránh thuốc bắn vào mắt gây cơn tăng nhãn áp cấp.'
        );
      }

      const title = isMildModOutpatient
        ? antiCholContra
          ? 'Tăng liều thuốc giãn phế quản cắt cơn ngoại trú Salbutamol pMDI qua buồng đệm (TRÁNH Ipratropium do glôcôm góc đóng / bí tiểu)'
          : 'Tăng liều / tần suất thuốc giãn phế quản tác dụng ngắn (SABA ± SAMA dạng xịt pMDI qua buồng đệm) điều trị đợt cấp ngoại trú'
        : antiCholContra
          ? alreadyOnSaba
            ? 'Tăng cường khí dung Salbutamol đơn thuần cắt cơn cấp (TRÁNH Ipratropium do glôcôm góc đóng / bí tiểu)'
            : 'Khí dung Salbutamol đơn thuần cắt cơn cấp (TRÁNH Ipratropium do glôcôm góc đóng / bí tiểu)'
          : alreadyOnSaba
            ? 'Tăng liều / Chuyển sang khí dung cấp cứu SABA ± SAMA tích cực ngay giờ đầu'
            : 'Khí dung SABA ± SAMA tích cực giờ đầu cắt cơn co thắt phế quản cấp';

      return {
        id: 'rec_copd_inpatient_saba_sama',
        module: 'copd',
        tier: isMildModOutpatient ? 'Điều trị đợt cấp ngoại trú' : 'Xử trí đợt cấp cấp cứu',
        tierOrder: 1,
        action: alreadyOnSaba ? 'UPTITRATE' : 'START',
        drugId: 'salbutamol',
        drugNameVi: antiCholContra
          ? 'Salbutamol đơn thuần (SABA – Tránh SAMA Ipratropium)'
          : isMildModOutpatient
            ? 'Salbutamol pMDI + buồng đệm (± Ipratropium)'
            : 'Salbutamol ± Ipratropium (SABA ± SAMA)',
        dose: doseText,
        title,
        rationale: isMildModOutpatient
          ? `GOLD 2026 (Chapter 4, PDF p. 114) và BYT QĐ 2131/2026 (Mục 3.4.3): Ở đợt cấp COPD mức độ nhẹ–trung bình điều trị ngoại trú, ưu tiên tăng liều hoặc tần suất SABA qua bình xịt định liều pMDI kèm buồng đệm (1–${minFirstHour} nhát mỗi giờ trong ${minFirstHour}–${maxFirstHour} liều đầu khi khó thở cấp, sau đó mỗi 4–6 giờ tùy đáp ứng).${antiCholContra ? ' Tránh phối hợp Ipratropium do glôcôm góc đóng / bí tiểu.' : ''}`
          : `GOLD 2026 (PDF p. 114) và BYT QĐ 2131/2026 (Mục 3.4.4): Khởi đầu bằng SABA (Salbutamol ${nebDose} mg/lần khí dung bằng máy nén khí hoặc xịt qua buồng đệm) lặp lại mỗi giờ trong ${minFirstHour}–${maxFirstHour} liều đầu, sau đó mỗi 2–4–6 giờ tùy đáp ứng.${antiCholContra ? ' Do người bệnh có glôcôm góc đóng / bí tiểu, chỉ dùng SABA đơn thuần và tránh phun khí dung Ipratropium (GOLD 2026 PDF p. 157).' : ''}`,
        warnings,
        gates: [],
        citationIds: [
          'byt.copd.2026.bronchodilator_short_acting',
          'byt.copd.2026.salbutamol_neb_dose',
          'gold.copd.2026.exac_saba_initial',
          'gold.copd.2026.exac_saba_first_hour',
          ...(antiCholContra ? ['gold.copd.2026.lama_glaucoma_caution', 'gina.copd.2026.lama_urinary_retention'] : []),
        ],
        priority: 105,
      };
    },
  },

  makeIpratropiumContraRule(0),
  makeIpratropiumContraRule(1), // qa-allow: index - khe dừng SAMA/SABA+SAMA thứ 2 khi có glôcôm góc đóng / bí tiểu
  makeIpratropiumContraRule(2), // qa-allow: index - khe dừng SAMA/SABA+SAMA thứ 3 khi có glôcôm góc đóng / bí tiểu

  {
    id: 'copd.inpatient.spo2_required',
    module: 'copd',
    nameVi: 'Yêu cầu đo SpO₂ cấp cứu để quyết định oxy trị liệu có kiểm soát trong đợt cấp',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['byt.copd.2026.oxygen_target_88_92'],
    when: (ctx) => {
      if (!isAcuteExacerbation(ctx)) return false;
      return getRestingSpo2(ctx) === undefined && need(ctx, 'pao2') === undefined;
    },
    produce: () => {
      const o2Min = thFor('restingSpo2', 'copd.oxygen_target_spo2_min');
      const o2Max = thFor('restingSpo2', 'copd.oxygen_target_spo2_max');
      return copdMissingRec(
        'restingSpo2',
        'Độ bão hòa oxy máu ngoại vi (SpO₂)',
        `xác định tình trạng giảm oxy máu cấp và chỉnh lưu lượng thở oxy có kiểm soát giữ đích ${o2Min}–${o2Max}%`,
        ['byt.copd.2026.oxygen_target_88_92']
      );
    },
  },

  {
    id: 'copd.inpatient.controlled_oxygen',
    module: 'copd',
    nameVi: 'Thở oxy có kiểm soát trong đợt cấp COPD (đích SpO₂ 88–92%)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['byt.copd.2026.oxygen_target_88_92'],
    when: (ctx) => {
      if (!isAcuteExacerbation(ctx)) return false;
      const spo2 = getRestingSpo2(ctx);
      const pao2 = need(ctx, 'pao2');
      if (spo2 === undefined && pao2 === undefined) return false;
      const o2Max = thFor('restingSpo2', 'copd.oxygen_target_spo2_max');
      const pao2Min = thFor('pao2', 'copd.oxygen_target_pao2_min');
      if (spo2 !== undefined) return spo2 <= o2Max;
      return pao2 !== undefined && pao2 < pao2Min;
    },
    produce: (ctx) => {
      const spo2 = getRestingSpo2(ctx);
      const pao2 = need(ctx, 'pao2');
      const o2Min = thFor('restingSpo2', 'copd.oxygen_target_spo2_min');
      const o2Max = thFor('restingSpo2', 'copd.oxygen_target_spo2_max');
      const pao2Min = thFor('pao2', 'copd.oxygen_target_pao2_min');
      const pao2Max = thFor('pao2', 'copd.oxygen_target_pao2_max');
      const onO2 = hasSupplementalOxygen(ctx);
      const coAsthma = ctx.normalized.selectedModules.includes('asthma');

      const needsOxygenStart =
        (spo2 !== undefined && spo2 < o2Min) ||
        (pao2 !== undefined && pao2 < pao2Min) ||
        (onO2 && spo2 !== undefined && spo2 <= o2Max);

      const acoNote = coAsthma
        ? ` LƯU Ý ĐỒNG MẮC HEN – COPD (ACO): Ưu tiên thống nhất đích SpO₂ có kiểm soát ${o2Min}–${o2Max}% (thay vì đẩy lên > ${o2Max}%) để phòng ứ CO₂ và toan hô hấp cấp, đồng thời bắt buộc làm ngay Khí máu động mạch (pH, PaCO₂) để đánh giá thông khí.`
        : '';

      return {
        id: 'rec_copd_inpatient_oxygen',
        module: 'copd',
        tier: 'Xử trí đợt cấp cấp cứu',
        tierOrder: 1,
        action: needsOxygenStart ? 'START' : 'MONITOR',
        title: needsOxygenStart
          ? `Thở oxy có kiểm soát: Đích SpO₂ ${o2Min}–${o2Max}%`
          : coAsthma
            ? `Theo dõi sát oxy máu & khí máu động mạch ở đích kiểm soát SpO₂ ${o2Min}–${o2Max}% (đồng mắc Hen–COPD)`
            : `Theo dõi sát oxy máu giữ đích SpO₂ ${o2Min}–${o2Max}% (không thở thêm oxy khi khí phòng đã đạt đích)`,
        rationale: needsOxygenStart
          ? `Người bệnh giảm oxy máu (hoặc đang duy trì oxy bổ sung): Điều chỉnh oxy qua mặt nạ Venturi hoặc gọng mũi để đạt đúng mục tiêu SpO₂ ${o2Min}–${o2Max}% (PaO₂ ${pao2Min}–${pao2Max} mmHg). Kiểm tra lại khí máu động mạch sau 30–60 phút; tuyệt đối tránh thở oxy lưu lượng cao vượt quá ${o2Max}% gây ứ CO₂ và toan hô hấp.${acoNote}`
          : `SpO₂ tự thở khí phòng hiện tại (${spo2}%) đang nằm trong cửa sổ kiểm soát ${o2Min}–${o2Max}% của COPD: Theo dõi SpO₂ liên tục và làm khí máu động mạch nếu khó thở nặng, chỉ cấp thêm oxy có kiểm soát qua mặt nạ Venturi khi SpO₂ < ${o2Min}% (hoặc khi đã loại trừ tăng CO₂ máu trên bệnh nhân chồng lấp Hen cấp nặng) để tránh gây ứ CO₂.${acoNote}`,
        gates: [],
        citationIds: ['byt.copd.2026.oxygen_target_88_92'],
        priority: needsOxygenStart ? 100 : 88,
      };
    },
  },

  {
    id: 'copd.inpatient.avoid_hyperoxia',
    module: 'copd',
    nameVi: 'Cảnh báo giảm/ngừng oxy bổ sung quá mức khi SpO₂ > 92% trong đợt cấp COPD đang thở oxy',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['byt.copd.2026.oxygen_target_88_92'],
    when: (ctx) => {
      if (!isAcuteExacerbation(ctx)) return false;
      const spo2 = getRestingSpo2(ctx);
      if (spo2 === undefined || spo2 <= thFor('restingSpo2', 'copd.oxygen_target_spo2_max')) {
        return false;
      }
      if (hasSupplementalOxygen(ctx)) return true;
      if (ctx.settings.setting !== 'inpatient') return false;
      const ph = getAbgPh(ctx);
      const paco2 = getAbgPaco2(ctx);
      return (
        (paco2 !== undefined && paco2 >= thFor('abgPaco2', 'copd.niv_paco2_cutoff')) ||
        (ph !== undefined && ph <= thFor('abgPh', 'copd.niv_ph_cutoff'))
      );
    },
    produce: (ctx) => {
      const spo2 = getRestingSpo2(ctx)!;
      const o2Min = thFor('restingSpo2', 'copd.oxygen_target_spo2_min');
      const o2Max = thFor('restingSpo2', 'copd.oxygen_target_spo2_max');
      const onO2 = hasSupplementalOxygen(ctx);
      const coAsthma = ctx.normalized.selectedModules.includes('asthma');

      return {
        id: 'rec_copd_inpatient_avoid_hyperoxia',
        module: 'copd',
        tier: 'Xử trí đợt cấp cấp cứu',
        tierOrder: onO2 ? 0 : 1,
        action: onO2 ? 'REDUCE' : 'MONITOR',
        title: onO2
          ? `GIẢM NGAY lưu lượng oxy bổ sung (SpO₂ ${spo2}% > ${o2Max}%): Nguy cơ ứ CO₂ / toan hô hấp cấp, chỉnh về đích ${o2Min}–${o2Max}%`
          : `Nội trú tăng CO₂ / toan hô hấp có SpO₂ ${spo2}% > ${o2Max}%: Kiểm tra ngay nguồn oxy bổ sung (nếu có) và giữ đích ${o2Min}–${o2Max}%`,
        rationale: `Trong đợt cấp COPD${coAsthma ? ' (kể cả khi đồng mắc Hen phế quản có nguy cơ giữ CO₂)' : ''}, đích bão hòa oxy mục tiêu an toàn khi thở oxy bổ sung là ${o2Min}–${o2Max}%. Thở oxy quá liều làm SpO₂ > ${o2Max}% gây bất tương xứng thông khí – tưới máu (hiệu ứng Haldane và giảm thông khí phút), làm nặng nhanh tăng CO₂ máu và toan hô hấp cấp. Giảm ngay lưu lượng oxy bổ sung về đích ${o2Min}–${o2Max}% và kiểm tra khí máu động mạch.`,
        gates: [],
        citationIds: ['byt.copd.2026.oxygen_target_88_92'],
        priority: onO2 ? 102 : 96,
      };
    },
  },
];
