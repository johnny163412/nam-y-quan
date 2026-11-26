import { ClassicalFormula, PrescriptionSlots } from '../types/tcm';

export const CLASSICAL_FORMULAS: ClassicalFormula[] = [
  {
    id: 'tan-on-giai-bieu',
    name: 'Tân Ôn Giải Biểu Phương',
    requiredHerbs: ['tia-to', 'kinh-gioi'],
    optionalAnyHerbs: ['sinh-khuong'],
    category: 'Giải biểu tán hàn',
    principle:
      'Tía tô + Kinh giới tương tu hiệp đồng mở lỗ chân lông đuổi Phong Hàn; thêm Sinh khương ấm trung đẩy khí ra ngoài biểu.',
    bonusPoints: 4
  },
  {
    id: 'ngan-cuc-thanh-phe',
    name: 'Ngân Cúc Thanh Phế Trà',
    requiredHerbs: ['bac-ha', 'kim-ngan-hoa'],
    optionalAnyHerbs: ['cuc-hoa', 'cat-can'],
    category: 'Tân lương giải biểu',
    principle:
      'Bạc hà sơ phong thanh đầu mục phối Kim ngân hoa thanh nhiệt giải độc phần khí — cặp vàng trị cảm nóng đau rát họng.',
    bonusPoints: 4
  },
  {
    id: 'khuong-to-hoa-vi',
    name: 'Khương Tô Hòa Vị Thang',
    requiredHerbs: ['sinh-khuong', 'tia-to'],
    category: 'Ôn trung giải độc',
    principle:
      'Sinh khương ấm Vị cầm nôn phối Tía tô hành khí giải độc thủy hải sản — hóa giải nhanh hàn thấp đình trệ dạ dày.',
    bonusPoints: 3
  },
  {
    id: 'bo-ty-bat-tre',
    name: 'Kiện Tỳ Bất Trệ Đối Dược',
    requiredHerbs: ['hoai-son', 'tran-bi'],
    optionalAnyHerbs: ['dinh-lang', 'cam-thao'],
    category: 'Bổ khí kiện Tỳ',
    principle:
      'Hoài sơn bổ Tỳ nhưng dễ nê trệ; phối Trần bì lý khí vận hóa giúp "bổ mà không trệ", người yếu tiêu hóa hấp thu trọn vẹn.',
    bonusPoints: 4
  },
  {
    id: 'nhan-tran-cuc-hoa',
    name: 'Thanh Can Giải Uất Phương',
    requiredHerbs: ['nhan-tran', 'cuc-hoa'],
    optionalAnyHerbs: ['lac-tien'],
    category: 'Sơ Can thanh nhiệt',
    principle:
      'Nhân trần thanh thấp nhiệt Can Đởm đi cùng Cúc hoa bình Can sáng mắt — giảm hẳn căng tức sườn, đắng miệng, bốc hỏa.',
    bonusPoints: 4
  },
  {
    id: 'nam-duong-an-than',
    name: 'Nam Dương Dưỡng Tâm Phương',
    requiredHerbs: ['dinh-lang', 'lac-tien'],
    optionalAnyHerbs: ['hoai-son', 'ky-tu'],
    category: 'Bổ khí huyết an thần',
    principle:
      'Đinh lăng (Nam dương sâm) ích khí hoạt huyết kết hợp Lạc tiên dưỡng Tâm an thần — trị mất ngủ do suy nhược mà không gây lạnh bụng.',
    bonusPoints: 4
  },
  {
    id: 'lien-tam-thanh-hoa',
    name: 'Liên Tiên Giáng Hỏa Trà',
    requiredHerbs: ['tam-sen', 'lac-tien'],
    optionalAnyHerbs: ['kim-ngan-hoa', 'ky-tu'],
    category: 'Thanh Tâm an thần',
    principle:
      'Tâm sen tả Tâm hỏa thực nhiệt phối Lạc tiên dịu thần kinh — đưa Hỏa đi xuống, giúp ngủ sâu khi bứt rứt nhiệt miệng.',
    bonusPoints: 4
  },
  {
    id: 'on-kinh-tru-thap',
    name: 'Ôn Kinh Khu Phong Thấp Phương',
    requiredHerbs: ['la-lot'],
    optionalAnyHerbs: ['que-chi', 'ngai-cuu', 'co-xuoc'],
    category: 'Thông kinh hoạt lạc',
    principle:
      'Lá lốt ôn trung tán hàn trừ phong thấp phối Quế chi / Ngải cứu / Cỏ xước đưa dương khí thông suốt kinh lạc vai gáy và lưng gối.',
    bonusPoints: 4
  },
  {
    id: 'tu-to-an-thai',
    name: 'Tử Tô Hòa Thai Phương',
    requiredHerbs: ['tia-to', 'hoai-son'],
    optionalAnyHerbs: ['lac-tien', 'cam-thao'],
    category: 'An thai chỉ ẩu',
    principle:
      'Tía tô giáng khí hết buồn nôn thai nghén kết hợp Hoài sơn cố Thận kiện Tỳ giữ thai — cặp thuốc Nam hiền hòa cho thai phụ.',
    bonusPoints: 5
  }
];

export function detectActiveFormulas(slots: PrescriptionSlots): ClassicalFormula[] {
  const assigned = new Set(Object.values(slots).filter(Boolean) as string[]);
  if (assigned.size === 0) return [];

  return CLASSICAL_FORMULAS.filter((formula) => {
    const hasRequired = formula.requiredHerbs.every((id) => assigned.has(id));
    if (!hasRequired) return false;
    if (formula.optionalAnyHerbs && formula.optionalAnyHerbs.length > 0 && formula.requiredHerbs.length < 2) {
      return formula.optionalAnyHerbs.some((id) => assigned.has(id));
    }
    return true;
  });
}
