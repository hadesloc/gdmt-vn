import type { PresetPatient } from '../../engine/types';
import { thFor } from '../../kb-types';

const tophiTargetUmol = thFor('urate', 'gout.target.urate_tophi_umol');
const vnTophiTargetUmol = thFor('urate', 'gout.target.urate_vn_tophi_umol');

export const goutPresets: PresetPatient[] = [
  {
    id: 'gout_preset_acute_monoarthritis_ckd',
    nameVi: 'Cơn gút cấp khớp gối trên nền Bệnh thận mạn (Ca On-Call 1520)',
    description:
      'Nam 64 tuổi, tiền sử bệnh thận mạn (Creatinin 150 µmol/L), acid uric 560 µmol/L. Nhập viện vì khớp gối phải sưng nóng đỏ đau dữ dội từ nửa đêm (VAS 8/10). Chống chỉ định NSAID; ưu tiên Corticoid nội khớp/uống.',
    patient: {
      age: 64,
      sex: 'male',
      weight: 70,
      height: 168,
      sbp: 142,
      dbp: 84,
      hr: 94,
      rhythm: 'sinus',
      scr: 150,
      uricAcid: 560,
      selectedModules: ['gout', 'ckd'],
      conditions: {
        gout: true,
        ckd: true
      },
      currentMeds: [],
      customInputs: {
        acuteFlare: true,
        monoarthritisLargeJoint: true,
        southeastAsianDescent: true,
        priorFlaresLifetime: 3,
        goutFlaresYear: 2,
        hlab5801: 'not_done'
      }
    }
  },
  {
    id: 'gout_preset_chronic_tophaceous_severe',
    nameVi: 'Gút mạn tính có hạt tophi & Acid uric tăng cao',
    description:
      `Nam 58 tuổi, gút mạn 8 năm, có nhiều hạt tophi ở vành tai và khớp bàn ngón chân cái, 4 đợt cấp/năm, acid uric 620 µmol/L, chức năng thận bảo tồn. Chỉ định mạnh khởi trị Allopurinol với mục tiêu urat tích cực < ${tophiTargetUmol} µmol/L (EULAR) / < ${vnTophiTargetUmol} µmol/L (BYT) kèm dự phòng Colchicine.`,
    patient: {
      age: 58,
      sex: 'male',
      weight: 74,
      height: 165,
      sbp: 130,
      dbp: 80,
      hr: 76,
      rhythm: 'sinus',
      scr: 95,
      uricAcid: 620,
      tophi: true,
      goutFlaresYear: 4,
      selectedModules: ['gout'],
      conditions: {
        gout: true
      },
      currentMeds: [],
      customInputs: {
        tophi: true,
        xrayDamage: true,
        priorFlaresLifetime: 10,
        goutFlaresYear: 4,
        hlab5801: 'negative',
        acuteFlare: false
      }
    }
  },
  {
    id: 'gout_preset_hlab5801_positive',
    nameVi: 'Gút mạn tính mang gen dị ứng HLA-B*58:01 dương tính',
    description:
      'Nam 52 tuổi, 3 đợt cấp/năm, acid uric 540 µmol/L, chức năng thận tốt. Xét nghiệm HLA-B*58:01 DƯƠNG TÍNH. Chống chỉ định tuyệt đối Allopurinol; khởi trị Febuxostat thay thế kèm dự phòng cơn bùng phát.',
    patient: {
      age: 52,
      sex: 'male',
      weight: 68,
      height: 166,
      sbp: 124,
      dbp: 78,
      hr: 72,
      rhythm: 'sinus',
      scr: 88,
      uricAcid: 540,
      goutFlaresYear: 3,
      selectedModules: ['gout'],
      conditions: {
        gout: true
      },
      currentMeds: [],
      customInputs: {
        hlab5801: 'positive',
        goutFlaresYear: 3,
        priorFlaresLifetime: 5,
        acuteFlare: false
      }
    }
  },
  {
    id: 'gout_preset_htn_on_thiazide',
    nameVi: 'Gút kèm Tăng huyết áp đang dùng Hydrochlorothiazide',
    description:
      'Nữ 66 tuổi, THA đang điều trị bằng Hydrochlorothiazide, gút tái phát 2 đợt cấp/năm, acid uric 510 µmol/L, HA 144/88 mmHg. Chỉ định khởi trị Allopurinol kèm dự phòng Colchicine và đổi Thiazide sang Losartan.',
    patient: {
      age: 66,
      sex: 'female',
      weight: 62,
      height: 156,
      sbp: 144,
      dbp: 88,
      hr: 78,
      rhythm: 'sinus',
      scr: 85,
      k: 4.3,
      uricAcid: 510,
      goutFlaresYear: 2,
      selectedModules: ['gout', 'htn'],
      conditions: {
        gout: true,
        htn: true
      },
      currentMeds: [
        {
          drugId: 'hydrochlorothiazide',
          name: 'Hydrochlorothiazide',
          dose: 25,
          unit: 'mg'
        }
      ],
      customInputs: {
        takingThiazide: true,
        goutFlaresYear: 2,
        priorFlaresLifetime: 4,
        hlab5801: 'negative',
        acuteFlare: false
      }
    }
  },
  {
    id: 'gout_preset_first_flare_mild',
    nameVi: 'Cơn gút đầu tiên không biến chứng (Chưa chỉ định ULT)',
    description:
      'Nam 42 tuổi, vừa bị cơn gút cấp đầu tiên cách đây 3 tuần đã khỏi hoàn toàn, không tophi, không sỏi thận, chức năng thận tốt, acid uric 440 µmol/L. Chưa có chỉ định dùng thuốc hạ urat máu; ưu tiên điều chỉnh lối sống.',
    patient: {
      age: 42,
      sex: 'male',
      weight: 76,
      height: 172,
      sbp: 118,
      dbp: 76,
      hr: 70,
      rhythm: 'sinus',
      scr: 78,
      uricAcid: 440,
      selectedModules: ['gout'],
      conditions: {
        gout: true
      },
      currentMeds: [],
      customInputs: {
        priorFlaresLifetime: 1,
        goutFlaresYear: 1,
        tophi: false,
        xrayDamage: false,
        urolithiasis: false,
        acuteFlare: false
      }
    }
  }
];
