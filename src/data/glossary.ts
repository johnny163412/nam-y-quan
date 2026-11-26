export interface GlossaryTerm {
  id: string;
  term: string;
  aliases: string[];
  category: string;
  plainMeaning: string;
  everydayExample: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'bieu-chung',
    term: 'Biểu chứng',
    aliases: ['Biểu chứng', 'Biểu Hàn', 'Biểu Nhiệt', 'Biểu Thực', 'ở phần Biểu', 'ở Biểu'],
    category: 'Bát Cương (Nông — Sâu)',
    plainMeaning: 'Bệnh còn ở lớp ngoài cơ thể (da lông, mũi họng, cơ bắp), thường mới mắc khi trúng gió mưa, nắng nóng.',
    everydayExample: 'Ví dụ: mới dầm mưa thấy gai rét, nghẹt mũi, mỏi cổ gáy — chưa ăn sâu vào bụng hay nội tạng.'
  },
  {
    id: 'ly-chung',
    term: 'Lý chứng',
    aliases: ['Lý chứng', 'Lý Hàn', 'Lý Nhiệt', 'Lý Thực', 'Lý hư', 'Lý Hư', 'ở phần Lý', 'ở Lý'],
    category: 'Bát Cương (Nông — Sâu)',
    plainMeaning: 'Bệnh đã ở sâu bên trong Tạng Phủ (dạ dày, ruột, gan, tim, thận), thường biểu hiện qua ăn uống, giấc ngủ, đại tiểu tiện.',
    everydayExample: 'Ví dụ: đau bụng lạnh tiêu chảy, mất ngủ nhiệt miệng, đau mỏi lưng gối kéo dài.'
  },
  {
    id: 'han-chung',
    term: 'Hàn chứng',
    aliases: ['Hàn chứng', 'thiên Hàn', 'Thuần Hàn', 'Hàn thấp', 'Phong Hàn'],
    category: 'Bát Cương (Lạnh — Nóng)',
    plainMeaning: 'Cơ thể bị lạnh hoặc thiếu hơi ấm: sợ lạnh, thích chườm nóng, tay chân lạnh, không khát nước, lưỡi nhợt ẩm.',
    everydayExample: 'Gặp trường hợp này phải dùng thuốc ấm nóng (gừng, quế, tía tô) hoặc hơ ngải cứu, kỵ đồ lạnh.'
  },
  {
    id: 'nhiet-chung',
    term: 'Nhiệt chứng',
    aliases: ['Nhiệt chứng', 'thiên Nhiệt', 'Thực nhiệt', 'Phong Nhiệt', 'Tâm hỏa', 'Can hỏa'],
    category: 'Bát Cương (Lạnh — Nóng)',
    plainMeaning: 'Cơ thể đang nóng bức hoặc bốc hỏa: sốt nóng, khát nước mát, mặt đỏ, tiểu vàng sậm, đầu lưỡi đỏ, rêu vàng.',
    everydayExample: 'Cần vị thuốc mát (bạc hà, kim ngân hoa, tâm sen) để hạ nhiệt; tránh gừng, quế nóng.'
  },
  {
    id: 'hu-chung',
    term: 'Hư chứng',
    aliases: ['Hư chứng', 'Tỳ Vị hư hàn', 'Tỳ khí hư', 'Tâm Tỳ lưỡng hư', 'Thận dương hư', 'Khí huyết bất túc', 'chính khí suy'],
    category: 'Bát Cương (Yếu — Mạnh)',
    plainMeaning: 'Sức đề kháng và khí huyết trong người bị suy giảm, thiếu hụt: mệt mỏi, thở ngắn, vã mồ hôi, mạch nhỏ yếu.',
    everydayExample: 'Không nên công phạt mạnh mà cần bồi bổ êm dịu (củ mài, đinh lăng, kỷ tử) kết hợp sao vàng ấm bụng.'
  },
  {
    id: 'thuc-chung',
    term: 'Thực chứng',
    aliases: ['Thực chứng', 'thực trệ', 'khí trệ', 'ứ trệ'],
    category: 'Bát Cương (Yếu — Mạnh)',
    plainMeaning: 'Tà khí (gió, lạnh, nóng, thức ăn ứ trệ) đang mạnh nhưng sức người vẫn còn khỏe để chống lại: đau dữ, tiếng vang, mạch căng mạnh.',
    everydayExample: 'Cần dùng thuốc phát tán, tiêu trệ hoặc thanh nhiệt dứt khoát để đẩy tà khí ra ngoài.'
  },
  {
    id: 'phu-khan',
    term: 'Mạch Phù Khẩn',
    aliases: ['Mạch Phù Khẩn', 'Phù Khẩn', 'Phù thủ'],
    category: 'Mạch Chẩn',
    plainMeaning: 'Đặt nhẹ ngón tay sát da đã thấy mạch đập rõ (Phù = bệnh ở ngoài) và căng bật như dây thừng (Khẩn = gặp lạnh co rút).',
    everydayExample: 'Rất hay gặp khi vừa nhiễm cảm lạnh không ra mồ hôi.'
  },
  {
    id: 'phu-sac',
    term: 'Mạch Phù Sác',
    aliases: ['Mạch Phù Sác', 'Phù Sác', 'Hồng Sác'],
    category: 'Mạch Chẩn',
    plainMeaning: 'Phù là mạch nổi trên bề mặt, Hồng là sóng to cuộn mạnh, Sác là đập nhanh trên 90 nhịp/phút — dấu hiệu nhiệt tà đang vượng.',
    everydayExample: 'Khi thấy mạch nhanh kèm đầu lưỡi đỏ rát họng, chắc chắn là chứng nóng.'
  },
  {
    id: 'tram-nhuoc',
    term: 'Mạch Trầm Nhược',
    aliases: ['Mạch Trầm Nhược', 'Trầm Nhược Trì', 'Trầm Tế Nhược', 'Tế Nhược', 'Trầm thủ'],
    category: 'Mạch Chẩn',
    plainMeaning: 'Phải ấn ngón tay sâu xuống gần xương mới thấy mạch (Trầm = bệnh ở sâu bên trong), sợi mạch nhỏ yếu mềm (Nhược/Tế = thiếu khí huyết), Trì là đập chậm.',
    everydayExample: 'Đặc trưng của người gầy yếu lâu ngày, tay chân lạnh, hay mệt.'
  },
  {
    id: 'huyen-hoat',
    term: 'Mạch Huyền / Mạch Hoạt',
    aliases: ['Mạch Huyền Sác', 'Mạch Hoạt Sác', 'Huyền mạch', 'Hoạt mạch', 'Trầm Khẩn Hoạt'],
    category: 'Mạch Chẩn',
    plainMeaning: 'Huyền là mạch căng thẳng như dây đàn (thường do stress, tức sườn ở tạng Can); Hoạt là mạch trơn tròn như viên bi lăn (đờm thấp, thực trệ hoặc mạch thai kỳ).',
    everydayExample: 'Phụ nữ mang thai khỏe mạnh thường có mạch Hoạt nhẹ trơn đều.'
  },
  {
    id: 'quan-than-ta-su',
    term: 'Quân — Thần — Tá — Sứ',
    aliases: ['Quân — Thần — Tá — Sứ', 'Quân - Thần - Tá - Sứ', 'Quân dược', 'Thần dược', 'Tá dược', 'Sứ dược'],
    category: 'Phối Ngũ Cổ Truyền',
    plainMeaning: 'Nguyên tắc dựng một thang thuốc như tổ chức triều đình: Quân là vị chủ lực đánh trúng gốc bệnh; Thần trợ sức cho Quân; Tá trị triệu chứng phụ hoặc giảm độc; Sứ dẫn thuốc và điều hòa (thường là Cam thảo).',
    everydayExample: 'Đặt đúng vị chủ lực vào đĩa Quân giúp thang thuốc hiệu nghiệm gấp bội.'
  },
  {
    id: 'tan-on-tan-luong',
    term: 'Tân Ôn & Tân Lương Giải Biểu',
    aliases: ['Tân ôn giải biểu', 'Tân lương giải biểu'],
    category: 'Phép Trị',
    plainMeaning: 'Tân là vị cay giúp mở lỗ chân lông phát tán tà khí. Cảm lạnh dùng Tân Ôn (cay ấm: tía tô, gừng); cảm nóng dùng Tân Lương (cay mát: bạc hà, cúc hoa).',
    everydayExample: 'Đừng bao giờ uống trà gừng tía tô khi đang sốt cao đau rát họng!'
  },
  {
    id: 'can-khi-uat',
    term: 'Can khí uất kết',
    aliases: ['Can Khí Uất Kết', 'Can khí uất kết', 'Can uất hóa hỏa', 'Can mộc khắc Tỳ thổ'],
    category: 'Tạng Phủ',
    plainMeaning: 'Căng thẳng, lo nghĩ buồn bực kéo dài khiến khí của tạng Can (Gan) bị dồn nén, gây tức hai bên sườn, hay thở dài, miệng đắng và kéo theo đầy bụng.',
    everydayExample: 'Hay gặp ở người ôn thi, suy nghĩ nhiều rồi đau tức dạ dày kèm cáu gắt.'
  },
  {
    id: 'vu-van-hoa',
    term: 'Vũ Hỏa & Văn Hỏa',
    aliases: ['Vũ Hỏa', 'Vũ hỏa', 'Văn Hỏa', 'Văn hỏa', 'Văn Vũ Hỏa', 'Văn Vũ hỏa'],
    category: 'Hỏa Hầu Sắc Thuốc',
    plainMeaning: 'Vũ hỏa là lửa to đun sôi nhanh (10–15 phút) để giữ hương tinh dầu cho thuốc giải cảm; Văn hỏa là lửa nhỏ riu riu (35–45 phút) để ninh kỹ dưỡng chất rễ củ thuốc bổ.',
    everydayExample: 'Thuốc cảm lá tía tô mà ninh kỹ quá lâu sẽ bay mất tinh dầu giải cảm.'
  },
  {
    id: 'pao-zhi',
    term: 'Bào chế Đông dược',
    aliases: ['Sao vàng', 'Chích mật', 'Giã dập', 'Bào chế'],
    category: 'Kỹ Thuật Y Quán',
    plainMeaning: 'Sơ chế vị thuốc trước khi sắc để đổi hoặc tăng công hiệu: Sao vàng trên chảo giúp rễ củ thơm ấm dễ tiêu (kiện Tỳ); Chích mật ong làm dịu họng và bổ khí; Giã dập giúp gừng/rễ cứng nhanh ra chất.',
    everydayExample: 'Cam thảo chích mật có vị ngọt ấm bổ Tỳ hơn hẳn cam thảo để sống.'
  },
  {
    id: 'cuu-ngai',
    term: 'Cứu ngải & Thông tắc bất thống',
    aliases: ['Thông tắc bất thống', 'Cứu ngải', 'Hơ ngải cứu', 'Trong uống ngoài châm'],
    category: 'Châm Cứu',
    plainMeaning: '"Thông tắc bất thống" nghĩa là khí huyết lưu thông thì hết đau nhức. Hơ điếu ngải cứu đang cháy ấm gần huyệt đạo giúp hơi ấm thấm sâu xua tan lạnh ẩm khớp xương.',
    everydayExample: 'Rất hợp cho người đau lưng, mỏi gối lạnh buốt hoặc cứng cổ gáy do gió lạnh.'
  },
  {
    id: 'doan-khi-hao-tan',
    term: 'Đoản khí & Hao tân',
    aliases: ['tân dịch', 'sinh tân', 'chỉ ẩu', 'hạ hành', 'an thai'],
    category: 'Thuật Ngữ Lâm Sàng',
    plainMeaning: 'Tân dịch là nước và chất ẩm nuôi cơ thể; Sinh tân là tạo lại độ ẩm dịu khát; Chỉ ẩu là cầm buồn nôn; Hạ hành là đẩy khí huyết đi xuống (thai phụ phải tuyệt đối tránh vị hạ hành).',
    everydayExample: 'Sắn dây, cúc hoa giúp sinh tân dịu khát; còn tía tô lại có tính an thai giảm nghén.'
  }
];

export interface GlossarySegment {
  text: string;
  entry?: GlossaryTerm;
}

const ALIAS_LOOKUP: { pattern: string; entry: GlossaryTerm }[] = GLOSSARY_TERMS.flatMap((entry) =>
  entry.aliases.map((alias) => ({ pattern: alias, entry }))
).sort((a, b) => b.pattern.length - a.pattern.length);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const COMBINED_REGEX = new RegExp(
  `(${ALIAS_LOOKUP.map((item) => escapeRegex(item.pattern)).join('|')})`,
  'g'
);

const EXACT_ALIAS_MAP = new Map<string, GlossaryTerm>(
  ALIAS_LOOKUP.map((item) => [item.pattern.toLowerCase(), item.entry])
);

export function segmentTextWithGlossary(input: string): GlossarySegment[] {
  if (!input) return [];
  const parts = input.split(COMBINED_REGEX);
  const seenTermsInText = new Set<string>();

  return parts
    .filter((p) => p.length > 0)
    .map((part) => {
      const entry = EXACT_ALIAS_MAP.get(part.toLowerCase());
      if (entry && !seenTermsInText.has(entry.id)) {
        seenTermsInText.add(entry.id);
        return { text: part, entry };
      }
      return { text: part };
    });
}
