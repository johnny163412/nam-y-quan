import { Herb } from '../types/tcm';

export const HERBS: Herb[] = [
  // ==================== CHƯƠNG 1: BIỂU - LÝ & HÀN - NHIỆT (8 VỊ) ====================
  {
    id: 'tia-to',
    name: 'Tía tô',
    traditionalName: 'Tử tô diệp',
    partUsed: 'Lá và cành non',
    chapter: 1,
    motif: 'leaf-serrated',
    nature: 'Ôn',
    flavors: ['Cay'],
    meridians: ['Phế', 'Tỳ'],
    primaryElement: 'kim',
    vectorEffect: { exteriorInterior: 34, coldHeat: 30, deficiencyExcess: -24 },
    elementEffect: { kim: 18, tho: 10 },
    recommendedRole: 'quan',
    summary: 'Phát tán phong hàn, hành khí khoan trung, giải uất và an thai nhẹ.',
    homeTip: 'Nấu cháo hành tía tô nóng ăn khi vừa chớm dầm mưa lạnh, gai rét không ra mồ hôi.',
    contraindications: {
      avoidHeatExcess: true,
      warningText: 'Không dùng liều cao cho người âm hư nội nhiệt, ra nhiều mồ hôi tự hãn.'
    }
  },
  {
    id: 'kinh-gioi',
    name: 'Kinh giới',
    traditionalName: 'Kinh giới tuệ',
    partUsed: 'Ngọn mang hoa và lá',
    chapter: 1,
    motif: 'leaf-aromatic',
    nature: 'Ôn',
    flavors: ['Cay'],
    meridians: ['Phế', 'Can'],
    primaryElement: 'kim',
    vectorEffect: { exteriorInterior: 30, coldHeat: 22, deficiencyExcess: -22 },
    elementEffect: { kim: 16, moc: 8 },
    recommendedRole: 'than',
    summary: 'Khu phong giải biểu, thấu chẩn, sao đen có tác dụng cầm huyết nhẹ.',
    homeTip: 'Phối cùng tía tô hoặc xông hơi nhẹ giúp thông mũi, giảm đau đầu do gió lạnh.',
    contraindications: {
      avoidHeatExcess: true,
      warningText: 'Tránh dùng khi biểu hư ra mồ hôi nhiều hoặc nhiệt độc thịnh.'
    }
  },
  {
    id: 'sinh-khuong',
    name: 'Sinh khương (Gừng tươi)',
    traditionalName: 'Sinh khương',
    partUsed: 'Thân rễ tươi',
    chapter: 1,
    motif: 'rhizome',
    nature: 'Ôn',
    flavors: ['Cay'],
    meridians: ['Phế', 'Tỳ', 'Vị'],
    primaryElement: 'tho',
    vectorEffect: { exteriorInterior: -22, coldHeat: 38, deficiencyExcess: -24 },
    elementEffect: { tho: 18, kim: 10 },
    recommendedRole: 'ta',
    summary: 'Phát hãn giải biểu, ôn trung chỉ ẩu (làm ấm dạ dày, hết buồn nôn), giải độc bán hạ.',
    homeTip: 'Vài lát gừng tươi đập dập hãm nước ấm uống buổi sáng giúp ấm bụng, giảm say tàu xe.',
    contraindications: {
      avoidHeatExcess: true,
      warningText: 'Người âm hư hỏa vượng, táo bón, chảy máu cam không nên dùng nhiều gừng.'
    }
  },
  {
    id: 'bac-ha',
    name: 'Bạc hà',
    traditionalName: 'Bạc hà diệp',
    partUsed: 'Lá và thân non',
    chapter: 1,
    motif: 'leaf-aromatic',
    nature: 'Lương',
    flavors: ['Cay'],
    meridians: ['Phế', 'Can'],
    primaryElement: 'kim',
    vectorEffect: { exteriorInterior: 34, coldHeat: -30, deficiencyExcess: -24 },
    elementEffect: { kim: 16, moc: 12 },
    recommendedRole: 'quan',
    summary: 'Sơ tán phong nhiệt, thanh lợi đầu mục (sáng mắt, dịu họng), sơ Can giải uất.',
    homeTip: 'Hãm trà bạc hà ấm khi đau họng, khô mũi, đầu căng tức do cảm nóng.',
    contraindications: {
      avoidColdDeficiency: true,
      warningText: 'Người khí hư, tự ra mồ hôi lạnh hoặc trẻ sơ sinh tránh dùng tinh dầu đậm đặc.'
    }
  },
  {
    id: 'kim-ngan-hoa',
    name: 'Kim ngân hoa',
    traditionalName: 'Nhẫn đông hoa',
    partUsed: 'Nụ hoa chớm nở',
    chapter: 1,
    motif: 'flower-cluster',
    nature: 'Hàn',
    flavors: ['Ngọt'],
    meridians: ['Phế', 'Vị', 'Tâm'],
    primaryElement: 'hoa',
    vectorEffect: { exteriorInterior: 18, coldHeat: -38, deficiencyExcess: -26 },
    elementEffect: { hoa: -20, kim: 12 },
    recommendedRole: 'quan',
    summary: 'Thanh nhiệt giải độc, sơ tán phong nhiệt ở phần khí và phần huyết, tiêu mụn nhọt.',
    homeTip: 'Đầu vị trong các bài trà thanh nhiệt khi sốt nóng, viêm họng, rôm sảy.',
    contraindications: {
      avoidColdDeficiency: true,
      warningText: 'Tỳ vị hư hàn (hay lạnh bụng, tiêu chảy phân lỏng) kỵ dùng vị đại hàn này làm Quân.'
    }
  },
  {
    id: 'cuc-hoa',
    name: 'Cúc hoa vàng',
    traditionalName: 'Hoàng cúc hoa',
    partUsed: 'Cụm hoa phơi sấy',
    chapter: 1,
    motif: 'flower-daisy',
    nature: 'Lương',
    flavors: ['Ngọt', 'Đắng'],
    meridians: ['Phế', 'Can'],
    primaryElement: 'moc',
    vectorEffect: { exteriorInterior: 24, coldHeat: -28, deficiencyExcess: -18 },
    elementEffect: { moc: -14, kim: 10 },
    recommendedRole: 'than',
    summary: 'Sơ phong thanh nhiệt, bình Can minh mục (hạ hỏa ở gan, dịu nhức mắt chóng mặt).',
    homeTip: 'Hãm cúc hoa cùng kỷ tử cho người làm việc máy tính mỏi mắt, bốc hỏa nhẹ.',
    contraindications: {
      avoidColdDeficiency: true,
      warningText: 'Người sợ lạnh, Tỳ hư tiêu chảy kéo dài nên hạn chế.'
    }
  },
  {
    id: 'cat-can',
    name: 'Cát căn (Sắn dây)',
    traditionalName: 'Cát căn',
    partUsed: 'Rễ củ thái phiến',
    chapter: 1,
    motif: 'root-tuber',
    nature: 'Lương',
    flavors: ['Ngọt', 'Cay nhẹ'],
    meridians: ['Tỳ', 'Vị'],
    primaryElement: 'tho',
    vectorEffect: { exteriorInterior: 20, coldHeat: -26, deficiencyExcess: -12 },
    elementEffect: { tho: 14, hoa: -10 },
    recommendedRole: 'ta',
    summary: 'Giải cơ thoái nhiệt (giải cứng gáy, hạ sốt), sinh tân chỉ khát, thăng dương chỉ tả.',
    homeTip: 'Bột sắn dây pha chín giúp dịu cơn khát, giải nhiệt miệng và giảm căng cứng vai gáy.',
    contraindications: {
      avoidColdDeficiency: true,
      warningText: 'Người vị hàn, lạnh bụng đầy hơi không nên uống bột sắn dây sống với nước lạnh.'
    }
  },
  {
    id: 'cam-thao',
    name: 'Cam thảo bắc',
    traditionalName: 'Sinh / Chích cam thảo',
    partUsed: 'Rễ phơi khô',
    chapter: 1,
    motif: 'root-tuber',
    nature: 'Bình',
    flavors: ['Ngọt'],
    meridians: ['Tâm', 'Phế', 'Tỳ', 'Vị'],
    primaryElement: 'tho',
    vectorEffect: { exteriorInterior: -6, coldHeat: 0, deficiencyExcess: 10 },
    elementEffect: { tho: 14 },
    recommendedRole: 'su',
    summary: 'Ích khí bổ tỳ, nhuận phế chỉ khái, điều hòa tính mãnh liệt của các vị thuốc khác (Quốc lão).',
    homeTip: 'Lượng nhỏ 2–4g giúp làm dịu cổ họng và điều vị ấm êm trong thang thuốc.',
    contraindications: {
      warningText: 'Không dùng liều lớn kéo dài ở người phù thũng, tăng huyết áp.'
    }
  },

  // ==================== CHƯƠNG 2: TẠNG PHỦ NGŨ HÀNH & QUÂN THẦN TÁ SỨ (8 VỊ) ====================
  {
    id: 'tran-bi',
    name: 'Trần bì (Vỏ quýt lâu năm)',
    traditionalName: 'Trần bì',
    partUsed: 'Vỏ quả chín phơi để lâu',
    chapter: 2,
    motif: 'peel-curl',
    nature: 'Ôn',
    flavors: ['Cay', 'Đắng'],
    meridians: ['Tỳ', 'Phế'],
    primaryElement: 'tho',
    vectorEffect: { exteriorInterior: -24, coldHeat: 16, deficiencyExcess: -16 },
    elementEffect: { tho: 18, kim: 12 },
    recommendedRole: 'than',
    summary: 'Lý khí kiện Tỳ, táo thấp hóa đờm; giúp thuốc bổ không bị nê trệ gây đầy bụng.',
    homeTip: 'Vỏ quýt phơi khô hãm với gừng giúp tiêu thực, giảm đầy chướng sau bữa ăn nhiều dầu mỡ.',
    contraindications: {
      avoidHeatExcess: true,
      warningText: 'Người âm hư ho khan không đờm, lưỡi đỏ ít rêu cần thận trọng.'
    }
  },
  {
    id: 'hoai-son',
    name: 'Hoài sơn (Củ mài)',
    traditionalName: 'Sơn dược',
    partUsed: 'Thân rễ củ mài',
    chapter: 2,
    motif: 'root-tuber',
    nature: 'Bình',
    flavors: ['Ngọt'],
    meridians: ['Tỳ', 'Phế', 'Thận'],
    primaryElement: 'tho',
    vectorEffect: { exteriorInterior: -34, coldHeat: 6, deficiencyExcess: 38 },
    elementEffect: { tho: 26, kim: 12, thuy: 12 },
    recommendedRole: 'quan',
    summary: 'Bổ Tỳ dưỡng Vị, sinh tân ích Phế, bổ Thận sáp tinh — vị thuốc bình hòa nuôi chính khí.',
    homeTip: 'Nấu cháo củ mài hạt sen rất tốt cho người gầy yếu, ăn kém, đi ngoài phân nát.',
    contraindications: {
      warningText: 'Người thực tích đầy trướng bụng nhiều nên phối thêm vị hành khí như Trần bì.'
    }
  },
  {
    id: 'dinh-lang',
    name: 'Đinh lăng',
    traditionalName: 'Nam dương sâm',
    partUsed: 'Rễ củ (tốt nhất từ 3 năm trở lên)',
    chapter: 2,
    motif: 'root-tuber',
    nature: 'Ôn',
    flavors: ['Ngọt', 'Hơi đắng'],
    meridians: ['Tỳ', 'Tâm', 'Can'],
    primaryElement: 'tho',
    vectorEffect: { exteriorInterior: -30, coldHeat: 8, deficiencyExcess: 34 },
    elementEffect: { tho: 18, hoa: 14, moc: 10 },
    recommendedRole: 'than',
    summary: 'Bổ ngũ tạng, thông huyết mạch, tăng sức bền cơ thể, được ví như nhân sâm của người Việt.',
    homeTip: 'Lá non làm rau sống/tráng trứng, rễ sắc nhẹ giúp phục hồi mệt mỏi sau ốm.',
    contraindications: {
      warningText: 'Không dùng rễ liều quá cao đột ngột gây say mệt do chứa saponin.'
    }
  },
  {
    id: 'ngai-cuu',
    name: 'Ngải cứu',
    traditionalName: 'Ngải diệp',
    partUsed: 'Lá phơi khô (Trần ngải)',
    chapter: 2,
    motif: 'leaf-serrated',
    nature: 'Ôn',
    flavors: ['Đắng', 'Cay'],
    meridians: ['Can', 'Tỳ', 'Thận'],
    primaryElement: 'tho',
    vectorEffect: { exteriorInterior: -34, coldHeat: 36, deficiencyExcess: 20 },
    elementEffect: { tho: 20, thuy: 14, moc: 10 },
    recommendedRole: 'quan',
    summary: 'Ôn kinh chỉ huyết, tán hàn chỉ thống (làm ấm tử cung, ấm bụng dưới, trừ đau nhức do lạnh).',
    homeTip: 'Rang ngải cứu với muối hột chườm vùng thắt lưng hoặc bụng lạnh rất hiệu nghiệm.',
    contraindications: {
      pregnancyCautionAsQuan: true,
      avoidHeatExcess: true,
      warningText: 'Thận trọng dùng liều cao (Quân dược) cho phụ nữ mang thai; kỵ người huyết nhiệt.'
    }
  },
  {
    id: 'lac-tien',
    name: 'Lạc tiên (Nhãn lồng)',
    traditionalName: 'Lạc tiên',
    partUsed: 'Ngọn non, dây và lá',
    chapter: 2,
    motif: 'vine-tendril',
    nature: 'Lương',
    flavors: ['Ngọt', 'Đắng nhẹ'],
    meridians: ['Tâm', 'Can'],
    primaryElement: 'hoa',
    vectorEffect: { exteriorInterior: -28, coldHeat: -16, deficiencyExcess: 16 },
    elementEffect: { hoa: -14, moc: -12 },
    recommendedRole: 'than',
    summary: 'Thanh nhiệt giải độc, dưỡng Tâm an thần, giúp êm dịu thần kinh và dễ vào giấc ngủ.',
    homeTip: 'Ngọn lạc tiên luộc ăn hoặc sắc uống buổi tối giúp dịu căng thẳng, ngủ ngon hơn.',
    contraindications: {
      warningText: 'Không lạm dụng liều quá cao vào ban ngày nếu cần lái xe hoặc tập trung cao độ.'
    }
  },
  {
    id: 'tam-sen',
    name: 'Tâm sen (Liên tâm)',
    traditionalName: 'Liên tâm',
    partUsed: 'Mầm xanh trong hạt sen',
    chapter: 2,
    motif: 'seed-core',
    nature: 'Hàn',
    flavors: ['Đắng'],
    meridians: ['Tâm', 'Thận'],
    primaryElement: 'hoa',
    vectorEffect: { exteriorInterior: -32, coldHeat: -38, deficiencyExcess: -14 },
    elementEffect: { hoa: -28, thuy: 12 },
    recommendedRole: 'quan',
    summary: 'Thanh Tâm hỏa, trừ phiền, an thần, giao thông Tâm - Thận khi bốc hỏa mất ngủ.',
    homeTip: 'Sao vàng nhẹ 2–3g hãm trà uống trước ngủ khi tim đập nhanh, bứt rứt, nhiệt miệng.',
    contraindications: {
      avoidColdDeficiency: true,
      warningText: 'Tính hàn đắng mạnh — kỵ người Tỳ vị hư hàn, huyết áp thấp, lạnh bụng.'
    }
  },
  {
    id: 'ky-tu',
    name: 'Kỷ tử',
    traditionalName: 'Câu kỷ tử',
    partUsed: 'Quả chín phơi khô',
    chapter: 2,
    motif: 'berry-cluster',
    nature: 'Bình',
    flavors: ['Ngọt'],
    meridians: ['Can', 'Thận', 'Phế'],
    primaryElement: 'moc',
    vectorEffect: { exteriorInterior: -32, coldHeat: -8, deficiencyExcess: 34 },
    elementEffect: { moc: 18, thuy: 18 },
    recommendedRole: 'ta',
    summary: 'Tư bổ Can Thận, ích tinh sáng mắt, nhuận Phế — dưỡng âm mà không gây nê trệ.',
    homeTip: 'Nhai hoặc hãm cùng cúc hoa giúp giảm khô mắt, mỏi lưng gối ở người thức khuya.',
    contraindications: {
      warningText: 'Đang sốt cao do ngoại cảm hoặc Tỳ hư tiêu chảy phân sống nên tạm ngưng.'
    }
  },
  {
    id: 'nhan-tran',
    name: 'Nhân trần',
    traditionalName: 'Nhân trần cao',
    partUsed: 'Phần trên mặt đất phơi khô',
    chapter: 2,
    motif: 'leaf-aromatic',
    nature: 'Lương',
    flavors: ['Đắng', 'Cay nhẹ'],
    meridians: ['Tỳ', 'Vị', 'Can', 'Đởm'],
    primaryElement: 'moc',
    vectorEffect: { exteriorInterior: -28, coldHeat: -32, deficiencyExcess: -26 },
    elementEffect: { moc: -18, tho: -8 },
    recommendedRole: 'quan',
    summary: 'Thanh lợi thấp nhiệt ở Can Đởm, sơ tiết uất khí, giúp ăn ngon và nhẹ người.',
    homeTip: 'Hãm trà nhân trần loãng vào mùa nóng cho người đắng miệng, nước tiểu vàng đậm.',
    contraindications: {
      avoidColdDeficiency: true,
      warningText: 'Không uống thay nước lọc quanh năm nếu thể trạng gầy lạnh, Tỳ vị hư hàn.'
    }
  },

  // ==================== CHƯƠNG 3: KINH LẠC & TRONG UỐNG NGOÀI CHÂM (4 VỊ) ====================
  {
    id: 'la-lot',
    name: 'Lá lốt',
    traditionalName: 'Tất bát diệp',
    partUsed: 'Lá và thân rễ',
    chapter: 3,
    motif: 'leaf-serrated',
    nature: 'Ôn',
    flavors: ['Cay'],
    meridians: ['Vị', 'Đởm', 'Thận'],
    primaryElement: 'tho',
    vectorEffect: { exteriorInterior: -22, coldHeat: 32, deficiencyExcess: -18 },
    elementEffect: { tho: 14, thuy: 12 },
    recommendedRole: 'than',
    summary: 'Ôn trung tán hàn, hạ khí chỉ thống, khu phong trừ thấp — trị đau nhức xương khớp do lạnh ẩm.',
    homeTip: 'Ngâm chân nước lá lốt + gừng + muối ấm trước khi ngủ giảm tê buốt bàn chân.',
    contraindications: {
      avoidHeatExcess: true,
      warningText: 'Người nhiệt táo, hay chảy máu cam, táo bón hạn chế dùng.'
    }
  },
  {
    id: 'co-xuoc',
    name: 'Cỏ xước (Ngưu tất nam)',
    traditionalName: 'Thổ ngưu tất',
    partUsed: 'Rễ và toàn cây',
    chapter: 3,
    motif: 'root-tuber',
    nature: 'Bình',
    flavors: ['Đắng', 'Chua'],
    meridians: ['Can', 'Thận'],
    primaryElement: 'thuy',
    vectorEffect: { exteriorInterior: -26, coldHeat: -8, deficiencyExcess: 16 },
    elementEffect: { thuy: 18, moc: 14 },
    recommendedRole: 'ta',
    summary: 'Hoạt huyết thông kinh, bổ Can Thận mạnh gân cốt, dẫn các vị thuốc đi xuống hạ tiêu.',
    homeTip: 'Sắc cùng lá lốt hỗ trợ người trung niên mỏi gối, tê bì chân tay khi trở trời.',
    contraindications: {
      pregnancyLock: true,
      warningText: 'CẤM KỴ TUYỆT ĐỐI cho phụ nữ có thai vì tính hoạt huyết hạ hành mạnh dễ động thai.'
    }
  },
  {
    id: 'que-chi',
    name: 'Quế chi',
    traditionalName: 'Quế chi',
    partUsed: 'Cành nhỏ cây quế',
    chapter: 3,
    motif: 'bark-quill',
    nature: 'Ôn',
    flavors: ['Cay', 'Ngọt'],
    meridians: ['Tâm', 'Phế', 'Bàng quang'],
    primaryElement: 'hoa',
    vectorEffect: { exteriorInterior: 16, coldHeat: 38, deficiencyExcess: 10 },
    elementEffect: { hoa: 20, kim: 12, thuy: 12 },
    recommendedRole: 'quan',
    summary: 'Phát hãn giải cơ, ôn thông kinh mạch, trợ dương hóa khí — đưa dương khí ra tứ chi.',
    homeTip: 'Phối với sinh khương, đại táo giúp người hay lạnh tay chân, cứng vai gáy mùa đông ấm lên nhanh.',
    contraindications: {
      pregnancyCautionAsQuan: true,
      avoidHeatExcess: true,
      warningText: 'Kỵ chứng âm hư hỏa vượng, sốt cao ra mồ hôi; thận trọng liều Quân ở thai phụ.'
    }
  },
  {
    id: 'dan-sam',
    name: 'Đan sâm',
    traditionalName: 'Đan sâm',
    partUsed: 'Rễ màu đỏ gạch',
    chapter: 3,
    motif: 'root-tuber',
    nature: 'Lương',
    flavors: ['Đắng'],
    meridians: ['Tâm', 'Can'],
    primaryElement: 'hoa',
    vectorEffect: { exteriorInterior: -26, coldHeat: -16, deficiencyExcess: -12 },
    elementEffect: { hoa: -12, moc: 14 },
    recommendedRole: 'ta',
    summary: 'Hoạt huyết khứ ứ, lương huyết tiêu ung, dưỡng huyết an thần (Nhất vị đan sâm công đồng tứ vật).',
    homeTip: 'Dùng theo chỉ định thầy thuốc để hỗ trợ tuần hoàn huyết mạch và giảm đau tức vùng ngực sườn.',
    contraindications: {
      pregnancyLock: true,
      warningText: 'CẤM KỴ phụ nữ có thai và người đang chảy máu cấp, không phối với Lê lô.'
    }
  }
];

export const HERB_MAP: Record<string, Herb> = Object.fromEntries(HERBS.map((h) => [h.id, h]));
