import { PatientCase } from '../types/tcm';

export const STORY_CASES: PatientCase[] = [
  // ==================== CHƯƠNG 1 ====================
  {
    id: 'c1-phong-han',
    title: 'Ca 01: Người chèo đò dầm mưa đêm',
    chapter: 1,
    patientName: 'Ông Ba Đò',
    patientRole: 'Người lái đò bến Bình Giang',
    age: 46,
    seasonTag: 'Phong Hàn nhập Biểu',
    allowAcupuncture: false,
    chiefComplaint:
      'Thưa thầy, tối qua tôi chèo chuyến đò muộn gặp mưa phùn gió bấc. Sáng nay người ớn lạnh run cầm cập, đau cứng gáy, nghẹt mũi chảy nước trong, không ra giọt mồ hôi nào.',
    visualAppearance:
      'Sắc mặt hơi tái, hai vai co rúm giữ ấm, trán khô ráo không có mồ hôi.',
    audioObservation:
      'Giọng nói hơi nghẹt mũi, thỉnh thoảng hắt hơi và ho tiếng đục nhẹ, không khàn rát họng.',
    auscultationType: 'cold-sniffle',
    tongue: {
      bodyColor: 'pink',
      bodyShape: 'normal',
      coatColor: 'thin-white',
      moisture: 'wet-slippery',
      summary: 'Chất lưỡi hồng nhạt bình thường, rêu lưỡi trắng mỏng hơi ướt — dấu hiệu tà khí còn ở Biểu và thiên Hàn.',
      zones: [
        { zone: 'tip', label: 'Đầu lưỡi (Tâm - Phế)', organRef: 'Phế', finding: 'Hồng nhạt, chưa có chấm đỏ nhiệt', clueTag: 'Chưa hóa Nhiệt' },
        { zone: 'center', label: 'Giữa lưỡi (Tỳ - Vị)', organRef: 'Tỳ Vị', finding: 'Rêu trắng mỏng phủ đều', clueTag: 'Vị khí còn hòa' },
        { zone: 'sides', label: 'Hai rìa lưỡi (Can - Đởm)', organRef: 'Can', finding: 'Không đỏ, không dấu ấn răng', clueTag: 'Không uất nhiệt' },
        { zone: 'root', label: 'Gốc lưỡi (Thận)', organRef: 'Thận', finding: 'Bình thường, ẩm nhẹ', clueTag: 'Thận chưa tổn thương' },
        { zone: 'coat', label: 'Rêu lưỡi tổng thể', organRef: 'Biểu Hàn', finding: 'Trắng mỏng, hơi ướt trơn', clueTag: 'Phong Hàn biểu chứng' }
      ]
    },
    pulse: {
      name: 'Mạch Phù Khẩn (Nổi và Căng)',
      bpm: 70,
      phuStrength: 0.92,
      tramStrength: 0.42,
      waveStyle: 'tight',
      summary: 'Đặt nhẹ ngón tay (Phù thủ) đã thấy mạch đập rõ căng như dây thừng xoắn; ấn sâu lại hơi yếu hơn.',
      phuFinding: 'Rất rõ và căng bật đầu ngón tay -> Tà khí đang tranh đấu ở phần Biểu (Phù) và gặp lạnh co rút (Khẩn).',
      tramFinding: 'Ấn sâu lực trung bình, không sác -> Lý khí chưa nhiệt, chính khí chưa suy.',
      zoneNotes: {
        thon: { label: 'Thốn (Phế — Biểu)', strengthMultiplier: 1.08, finding: 'Bộ Thốn nổi bật căng rõ nhất -> Phong hàn đang bó chặt Phế vệ bên ngoài.' },
        quan: { label: 'Quan (Can — Tỳ)', strengthMultiplier: 0.92, finding: 'Bộ Quan đều vừa, hơi căng nhẹ.' },
        xich: { label: 'Xích (Thận)', strengthMultiplier: 0.84, finding: 'Bộ Xích bình hòa, chưa tổn thương phần gốc.' }
      }
    },
    inquiries: [
      { id: 'q1', topic: 'Hàn - Nhiệt', question: 'Bác thấy sợ lạnh nhiều hơn hay phát sốt nóng nhiều hơn?', answer: 'Sợ lạnh là chính thầy ạ! Đắp hai lớp chăn bông vẫn thấy gai lạnh sống lưng, sốt chỉ hâm hấp nhẹ.', clueTag: 'Ố hàn trọng, phát nhiệt khinh -> Biểu Hàn' },
      { id: 'q2', topic: 'Mồ hôi', question: 'Từ sáng tới giờ da dẻ có rịn mồ hôi không?', answer: 'Khô rang thầy ơi, không ra nổi một giọt mồ hôi nào nên người nặng trĩu bí bách.', clueTag: 'Vô hãn -> Biểu Thực (vệ khí bế)' },
      { id: 'q3', topic: 'Khát & Uống', question: 'Miệng có khát, muốn uống nước mát hay nước nóng?', answer: 'Không khát chút nào, chỉ thèm bát nước gừng nóng.', clueTag: 'Bất khát -> Hàn chứng' },
      { id: 'q4', topic: 'Đầu & Cổ gáy', question: 'Đau nhức vùng nào nhất?', answer: 'Đau ê ẩm sau gáy và nhức mỏi khắp bả vai.', clueTag: 'Kinh Thái Dương bị phong hàn bó' },
      { id: 'q5', topic: 'Đại tiểu tiện', question: 'Đi ngoài và nước tiểu thế nào?', answer: 'Nước tiểu trong, đi bình thường.', clueTag: 'Không có Lý nhiệt' },
      { id: 'q6', topic: 'Họng & Đờm', question: 'Cổ họng có sưng rát không?', answer: 'Không đau rát họng, chỉ chảy nước mũi trong.', clueTag: 'Loại trừ Phong Nhiệt' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: -65, coldHeat: -86, deficiencyExcess: 64 },
    elementImbalance: { moc: 48, hoa: 34, tho: 46, kim: 24, thuy: 62 },
    targetDiagnosis: { location: 'bieu', nature: 'han', state: 'thuc', primaryElement: 'kim' },
    keyHerbs: ['tia-to', 'kinh-gioi', 'sinh-khuong', 'cam-thao'],
    idealQuanHerb: 'tia-to',
    keyAcupoints: [],
    clinicalExplanation:
      'Bệnh nhân nhiễm Phong Hàn ở biểu: sợ lạnh nhiều, không mồ hôi, rêu trắng mỏng, mạch Phù Khẩn. Phép trị là Tân ôn giải biểu — lấy Tía tô làm Quân, Kinh giới làm Thần để phát hãn tán hàn, Sinh khương làm Tá ôn trung thông dương, Cam thảo làm Sứ điều hòa.',
    realLifeTakeaway:
      'Khi mới dính mưa lạnh, gai rét không mồ hôi, một bát cháo nóng nấu với lá tía tô, kinh giới và vài lát gừng tươi giúp ra mồ hôi nhẹ là giải cảm rất nhanh.',
    followUpLetters: {
      good: 'Thư tay từ bến đò Bình Giang: "Thưa thầy, sắc ấm thang tía tô gừng uống xong, tôi trùm chăn rịn được lượt mồ hôi mỏng thì cổ vai nhẹ bẫng, hết hẳn gai rét. Nay tôi đã ra bến chèo đò sớm đón khách, xin biếu thầy cặp cá sông mới kéo lưới!"',
      partial: 'Thư nhắn qua chú tiểu: "Cơn ớn lạnh của tôi đã dịu đi nhiều sau hai ngày nghỉ, nhưng mũi vẫn còn hơi sụt sịt mỗi sớm gió sương. Tôi sẽ qua xin thầy gia giảm thêm chút giải biểu."',
      poor: 'Nhắn tin từ bến đò: "Thưa thầy, uống xong chén thuốc tôi thấy bụng hơi lạnh hơn mà mồ hôi vẫn chưa ra nổi, cổ gáy vẫn còn cứng mỏi..."'
    }
  },
  {
    id: 'c1-phong-nhiet',
    title: 'Ca 02: Cô giáo dạy học khàn tiếng sốt nóng',
    chapter: 1,
    patientName: 'Cô Lan',
    patientRole: 'Giáo viên tiểu học',
    age: 29,
    seasonTag: 'Phong Nhiệt phạm Phế',
    allowAcupuncture: false,
    chiefComplaint:
      'Thưa thầy, hai hôm nay trời hanh nóng, tôi lại nói nhiều trên lớp. Nay người sốt nóng bừng, đau rát cổ họng, khát nước liên tục, ho ra đờm vàng đặc và hơi nhức đầu vùng trán.',
    visualAppearance:
      'Gò má hơi ửng hồng, môi khô, cổ họng nhìn qua hơi đỏ sưng, có rịn mồ hôi nhẹ ở trán.',
    audioObservation:
      'Giọng nói khàn, tiếng ho vang nặng và khô rát.',
    auscultationType: 'wheeze-heat',
    tongue: {
      bodyColor: 'red',
      bodyShape: 'normal',
      coatColor: 'yellow-dry',
      moisture: 'dry',
      summary: 'Đầu lưỡi đỏ tươi, rêu trắng ngả vàng mỏng và hơi khô — đặc trưng Phong Nhiệt đang xâm phạm Phế.',
      zones: [
        { zone: 'tip', label: 'Đầu lưỡi (Tâm - Phế)', organRef: 'Phế', finding: 'Đỏ rực với vài chấm gai đỏ', clueTag: 'Phế nhiệt rõ rệt' },
        { zone: 'center', label: 'Giữa lưỡi (Tỳ - Vị)', organRef: 'Tỳ Vị', finding: 'Rêu vàng mỏng, ít tân dịch', clueTag: 'Nhiệt bắt đầu hao tân' },
        { zone: 'sides', label: 'Hai rìa lưỡi (Can - Đởm)', organRef: 'Can', finding: 'Hơi hồng đỏ', clueTag: 'Nhẹ' },
        { zone: 'root', label: 'Gốc lưỡi (Thận)', organRef: 'Thận', finding: 'Bình thường', clueTag: 'Chưa tổn thương Thận âm' },
        { zone: 'coat', label: 'Rêu lưỡi tổng thể', organRef: 'Biểu Nhiệt', finding: 'Vàng mỏng khô', clueTag: 'Phong Nhiệt chứng' }
      ]
    },
    pulse: {
      name: 'Mạch Phù Sác (Nổi và Nhanh)',
      bpm: 98,
      phuStrength: 0.9,
      tramStrength: 0.52,
      waveStyle: 'rapid-surging',
      summary: 'Ấn nhẹ thấy mạch nảy nổi rõ và đập dồn dập nhanh (~98 nhịp/phút).',
      phuFinding: 'Mạch nổi rõ và đập nhanh -> Nhiệt tà ở Biểu (Phù Sác).',
      tramFinding: 'Ấn sâu vẫn còn lực -> Chính khí còn khỏe, thuộc Thực chứng.',
      zoneNotes: {
        thon: { label: 'Thốn (Phế — Hầu họng)', strengthMultiplier: 1.12, finding: 'Bộ Thốn nảy nhanh và nổi sát da -> Phong nhiệt đang tụ ở Phế và họng.' },
        quan: { label: 'Quan (Can — Vị)', strengthMultiplier: 0.96, finding: 'Bộ Quan hơi nhanh theo nhiệt thế.' },
        xich: { label: 'Xích (Thận)', strengthMultiplier: 0.85, finding: 'Bộ Xích êm, tân dịch ở hạ tiêu chưa cạn.' }
      }
    },
    inquiries: [
      { id: 'q1', topic: 'Hàn - Nhiệt', question: 'Cô sợ gió lạnh nhiều hay thấy nóng bức nhiều?', answer: 'Sốt nóng bức là chính ạ, chỉ hơi gai gió chút thôi.', clueTag: 'Phát nhiệt trọng -> Nhiệt chứng' },
      { id: 'q2', topic: 'Khát & Uống', question: 'Có khát nước và thích uống thế nào?', answer: 'Khát khô cổ lắm, chỉ muốn uống nước mát từng ngụm.', clueTag: 'Khát thích uống mát -> Nhiệt hao tân' },
      { id: 'q3', topic: 'Họng & Đờm', question: 'Họng và đờm thế nào?', answer: 'Nuốt nước bọt cũng đau rát họng, khạc đờm đặc hơi vàng.', clueTag: 'Phế nhiệt' },
      { id: 'q4', topic: 'Mồ hôi', question: 'Người có ra mồ hôi không?', answer: 'Có rịn mồ hôi nhẹ nhưng sốt vẫn chưa lui.', clueTag: 'Hữu hãn -> Phong Nhiệt' },
      { id: 'q5', topic: 'Tiểu tiện', question: 'Nước tiểu màu gì?', answer: 'Hơi vàng sậm hơn mọi ngày.', clueTag: 'Nhiệt chứng' },
      { id: 'q6', topic: 'Tiêu hóa', question: 'Bụng dạ có lạnh đau hay tiêu chảy không?', answer: 'Bụng êm, chỉ hơi táo nhẹ.', clueTag: 'Không có Tỳ hư hàn' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: -82, coldHeat: 88, deficiencyExcess: 72 },
    elementImbalance: { moc: 58, hoa: 78, tho: 46, kim: 30, thuy: 40 },
    targetDiagnosis: { location: 'bieu', nature: 'nhiet', state: 'thuc', primaryElement: 'kim' },
    keyHerbs: ['bac-ha', 'kim-ngan-hoa', 'cuc-hoa', 'cat-can', 'cam-thao'],
    idealQuanHerb: 'bac-ha',
    keyAcupoints: [],
    clinicalExplanation:
      'Đây là chứng Phong Nhiệt phạm Phế: sốt nóng, rát họng, khát nước mát, đầu lưỡi đỏ rêu vàng mỏng, mạch Phù Sác. Phép trị là Tân lương giải biểu, thanh Phế lợi hầu — dùng Bạc hà / Kim ngân hoa làm Quân-Thần, Cúc hoa hoặc Cát căn làm Tá sinh tân hạ nhiệt, Cam thảo làm Sứ dịu họng.',
    realLifeTakeaway:
      'Cảm nóng rát họng không nên ăn cháo hành gừng tía tô (vì tính ôn cay sẽ làm tăng hỏa). Trà kim ngân hoa, bạc hà, cúc hoa pha ấm là lựa chọn đúng đắn.',
    followUpLetters: {
      good: 'Thư viết nắn nót trên giấy ô ly: "Em Lan kính gửi thầy! Uống hết hai ấm thuốc thơm mùi bạc hà, hoa cúc, tối qua em hạ sốt hẳn, cổ họng mát dịu và sáng nay đã đứng lớp đọc bài cùng các cháu được rồi ạ."',
      partial: 'Thư gửi từ trường làng: "Cơn sốt đã giảm nhưng giọng em vẫn còn hơi khàn khi giảng bài lâu, chắc còn dư nhiệt ở họng ạ."',
      poor: 'Lời nhắn của người nhà cô Lan: "Thưa thầy, uống xong ấm thuốc thấy họng cô ấy rát khô hơn và người vẫn còn sốt nóng bứt rứt..."'
    }
  },
  {
    id: 'c1-thuong-thuc-han',
    title: 'Ca 03: Chàng thợ mộc lạnh bụng sau tiệc khuya',
    chapter: 1,
    patientName: 'Anh Tư Mộc',
    patientRole: 'Thợ chạm gỗ',
    age: 34,
    seasonTag: 'Trung tiêu Hàn thấp',
    allowAcupuncture: false,
    chiefComplaint:
      'Thưa thầy, đêm qua ăn hải sản sống kèm bia lạnh, từ sáng bụng trên đau quặn âm ỉ, chườm ấm thì dịu, buồn nôn ợ chua, đi ngoài phân lỏng nát.',
    visualAppearance:
      'Sắc mặt hơi xám, tay ôm vùng thượng vị, hay ợ hơi mùi thức ăn chưa tiêu.',
    audioObservation:
      'Tiếng thở bình thường, không ho, bụng sôi lọc xọc.',
    auscultationType: 'normal-gurgle',
    tongue: {
      bodyColor: 'pale',
      bodyShape: 'swollen-teeth',
      coatColor: 'thick-white',
      moisture: 'wet-slippery',
      summary: 'Chất lưỡi nhợt hơi bệu, giữa lưỡi phủ rêu trắng dày nhớt — Hàn thấp đình trệ ở Tỳ Vị.',
      zones: [
        { zone: 'tip', label: 'Đầu lưỡi', organRef: 'Tâm - Phế', finding: 'Nhợt nhạt bình thường', clueTag: 'Không ngoại cảm biểu nhiệt' },
        { zone: 'center', label: 'Giữa lưỡi (Tỳ - Vị)', organRef: 'Tỳ Vị', finding: 'Rêu trắng dày nhớt, ướt đẫm', clueTag: 'Hàn thấp trệ trung tiêu' },
        { zone: 'sides', label: 'Hai rìa lưỡi', organRef: 'Can - Đởm', finding: 'Có vết hằn răng nhẹ', clueTag: 'Tỳ thấp' },
        { zone: 'root', label: 'Gốc lưỡi', organRef: 'Thận', finding: 'Ẩm ướt', clueTag: 'Hàn nhiều' },
        { zone: 'coat', label: 'Rêu lưỡi', organRef: 'Lý Hàn', finding: 'Trắng dày ướt nhớt', clueTag: 'Lý Hàn thực trệ' }
      ]
    },
    pulse: {
      name: 'Mạch Trầm Khẩn Hoạt (Chìm, Căng và Trơn)',
      bpm: 64,
      phuStrength: 0.36,
      tramStrength: 0.86,
      waveStyle: 'slippery',
      summary: 'Ấn nhẹ rất mờ, phải ấn sâu (Trầm thủ) mới thấy mạch đập chắc và cuộn trơn.',
      phuFinding: 'Ấn nhẹ mờ yếu -> Bệnh không ở Biểu.',
      tramFinding: 'Ấn sâu thấy căng chắc và trơn -> Bệnh ở Lý (Trầm), có Hàn (Khẩn) và thực trệ đờm thấp (Hoạt).',
      zoneNotes: {
        thon: { label: 'Thốn (Tâm — Phế)', strengthMultiplier: 0.78, finding: 'Bộ Thốn bình lặng, không bị ngoại cảm.' },
        quan: { label: 'Quan (Tỳ — Vị)', strengthMultiplier: 1.15, finding: 'Bộ Quan bên phải cuộn trơn và căng rõ -> Thức ăn lạnh ứ trệ ngay dạ dày (Trung tiêu).' },
        xich: { label: 'Xích (Thận)', strengthMultiplier: 0.88, finding: 'Bộ Xích ổn định.' }
      }
    },
    inquiries: [
      { id: 'q1', topic: 'Đau bụng', question: 'Chườm khăn nóng hay ấn vào bụng thì dễ chịu hơn hay đau hơn?', answer: 'Chườm ấm vào thấy êm hẳn, chứ đụng nước lạnh là quặn lên ngay.', clueTag: 'Hỷ ôn (thích ấm) -> Lý Hàn' },
      { id: 'q2', topic: 'Nôn & Ợ', question: 'Có buồn nôn hay ợ mùi gì không?', answer: 'Buồn nôn dữ lắm, ợ lên toàn mùi đồ ăn tối qua.', clueTag: 'Vị khí thượng nghịch, thực trệ' },
      { id: 'q3', topic: 'Hàn - Nhiệt', question: 'Người có sốt hay sợ lạnh gì không?', answer: 'Không sốt, không nhức đầu, chỉ lạnh ngang bụng và tay chân hơi lạnh.', clueTag: 'Lý chứng (không Biểu)' },
      { id: 'q4', topic: 'Đại tiện', question: 'Đi tiêu thế nào?', answer: 'Đi phân lỏng nát 3 lần từ sáng, mùi tanh lạnh.', clueTag: 'Tỳ Vị hàn thấp' },
      { id: 'q5', topic: 'Khát', question: 'Có khát nước không?', answer: 'Không khát, miệng nhạt thếch.', clueTag: 'Hàn chứng' },
      { id: 'q6', topic: 'Tiểu tiện', question: 'Nước tiểu ra sao?', answer: 'Trong dài bình thường.', clueTag: 'Hàn chứng' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: 24, coldHeat: -76, deficiencyExcess: 48 },
    elementImbalance: { moc: 48, hoa: 38, tho: 26, kim: 50, thuy: 68 },
    targetDiagnosis: { location: 'ly', nature: 'han', state: 'thuc', primaryElement: 'tho' },
    keyHerbs: ['sinh-khuong', 'tia-to', 'cam-thao'],
    idealQuanHerb: 'sinh-khuong',
    keyAcupoints: [],
    clinicalExplanation:
      'Bệnh nhân ăn đồ sống lạnh làm Hàn thấp đình trệ tại trung tiêu (Lý - Hàn - Thực): đau bụng thích ấm, rêu trắng dày ướt, mạch Trầm Khẩn. Cần lấy Sinh khương làm Quân để ôn trung tán hàn chỉ ẩu, phối Tía tô (hành khí giải độc hải sản) làm Thần, Cam thảo làm Sứ hòa vị. Tuyệt đối tránh Kim ngân hoa hay Tâm sen kẻo làm bụng lạnh đau nặng thêm.',
    realLifeTakeaway:
      'Khi lạnh bụng, buồn nôn do đồ hải sản hay thức ăn lạnh, nước gừng tươi nấu cùng lá tía tô và vài lát cam thảo giúp ấm bụng và cầm nôn rất hiệu quả.',
    followUpLetters: {
      good: 'Thư kèm mảnh gỗ thơm của anh Tư Mộc: "Thầy ơi, chén thuốc gừng tía tô ấm sực bụng! Uống xong một khắc là hết quặn, chiều đó tôi ăn được bát cháo trắng và sáng nay lại cầm đục chạm tiếp kịp đơn đình làng."',
      partial: 'Nhắn gửi thầy: "Tôi hết buồn nôn rồi nhưng bụng vẫn còn hơi nặng trướng, chắc bữa sau phải chừa đồ sống lạnh."',
      poor: 'Nhắn gửi gấp: "Thầy ơi, uống xong bụng anh Tư lại sôi mạnh và đi lỏng thêm, chắc trong đơn có vị mát quá..."'
    }
  },

  // ==================== CHƯƠNG 2 ====================
  {
    id: 'c2-ty-vi-hu-han',
    title: 'Ca 04: Bà cụ bán trầu gầy yếu lạnh bụng kéo dài',
    chapter: 2,
    patientName: 'Bà Năm Trầu',
    patientRole: 'Người bán hàng chợ huyện',
    age: 62,
    seasonTag: 'Tỳ Vị Hư Hàn',
    allowAcupuncture: false,
    chiefComplaint:
      'Thưa thầy, mấy tháng nay tôi ăn uống kém ngon, hễ ăn đồ hơi mát là bụng sôi râm ran rồi đi phân lỏng. Tay chân lúc nào cũng lạnh, người mệt rã rời không có sức.',
    visualAppearance:
      'Thân hình gầy, sắc mặt vàng úa thiếu tươi, nói chuyện chậm rãi nhỏ nhẹ.',
    audioObservation:
      'Hơi thở ngắn, tiếng nói nhỏ yếu không có lực.',
    auscultationType: 'weak-breath',
    tongue: {
      bodyColor: 'pale',
      bodyShape: 'swollen-teeth',
      coatColor: 'thin-white',
      moisture: 'wet-slippery',
      summary: 'Lưỡi nhợt màu, thân lưỡi bệu có dấu hằn răng rõ hai bên rìa — dấu hiệu điển hình của Tỳ khí hư kèm thủy thấp.',
      zones: [
        { zone: 'tip', label: 'Đầu lưỡi', organRef: 'Tâm - Phế', finding: 'Nhợt màu thiếu huyết', clueTag: 'Khí huyết bất túc' },
        { zone: 'center', label: 'Giữa lưỡi (Tỳ - Vị)', organRef: 'Tỳ Vị', finding: 'Nhợt, rêu trắng mỏng ướt', clueTag: 'Tỳ Vị hư hàn' },
        { zone: 'sides', label: 'Hai rìa lưỡi', organRef: 'Can / Tỳ', finding: 'Hằn dấu răng cưa rõ', clueTag: 'Tỳ hư không vận hóa thủy thấp' },
        { zone: 'root', label: 'Gốc lưỡi', organRef: 'Thận', finding: 'Hơi nhợt ẩm', clueTag: 'Dương khí kém' },
        { zone: 'coat', label: 'Rêu lưỡi', organRef: 'Hàn', finding: 'Trắng mỏng ướt', clueTag: 'Hư Hàn' }
      ]
    },
    pulse: {
      name: 'Mạch Trầm Nhược Trì (Chìm, Yếu và Chậm)',
      bpm: 56,
      phuStrength: 0.25,
      tramStrength: 0.45,
      waveStyle: 'thready',
      summary: 'Cả ấn nhẹ lẫn ấn sâu đều thấy sợi mạch nhỏ mềm, yếu ớt và chậm rãi (~56 nhịp/phút).',
      phuFinding: 'Rất yếu, gần như không thấy ở tầng nông -> Không phải biểu chứng.',
      tramFinding: 'Ấn sâu thấy yếu mềm và chậm -> Lý - Hư - Hàn (Chính khí và Dương khí đều suy).',
      zoneNotes: {
        thon: { label: 'Thốn (Tâm — Phế)', strengthMultiplier: 0.72, finding: 'Nhịp yếu nhẹ -> Khí hư, hụt hơi.' },
        quan: { label: 'Quan (Tỳ — Vị)', strengthMultiplier: 0.65, finding: 'Bộ Quan trống rỗng mềm yếu nhất -> Tỳ Vị hư hàn nặng.' },
        xich: { label: 'Xích (Thận)', strengthMultiplier: 0.78, finding: 'Thận dương cũng hơi yếu kèm theo.' }
      }
    },
    inquiries: [
      { id: 'q1', topic: 'Đau bụng', question: 'Đau bụng của bà có thích xoa bóp hay chườm ấm không?', answer: 'Đau âm ỉ thôi thầy, lấy tay xoa nhẹ và chườm ấm thì dễ chịu ngay.', clueTag: 'Hỷ án hỷ ôn -> Hư Hàn' },
      { id: 'q2', topic: 'Ăn uống', question: 'Sức ăn và tiêu hóa dạo này sao?', answer: 'Ăn nửa bát cơm đã đầy trướng khó tiêu, hay đi ngoài phân nát sống phân.', clueTag: 'Tỳ mất kiện vận' },
      { id: 'q3', topic: 'Tinh thần & Sức lực', question: 'Người có hay mệt hay ra mồ hôi trộm ban ngày không?', answer: 'Làm chút việc đã thở dốc, sáng dậy hay vã mồ hôi lạnh.', clueTag: 'Khí hư' },
      { id: 'q4', topic: 'Nhiệt độ tứ chi', question: 'Tay chân thế nào?', answer: 'Bốn mùa tay chân đều lạnh ngắt.', clueTag: 'Dương hư' },
      { id: 'q5', topic: 'Giấc ngủ', question: 'Đêm ngủ có mộng mị nhiều không?', answer: 'Ngủ chập chờn vì hay lạnh bụng lúc gần sáng.', clueTag: 'Tỳ Thận dương kém' },
      { id: 'q6', topic: 'Khát', question: 'Có khát nước không?', answer: 'Không khát, chỉ nhấp ngụm trà ấm.', clueTag: 'Hàn chứng' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: 78, coldHeat: -76, deficiencyExcess: -78 },
    elementImbalance: { moc: 45, hoa: 34, tho: 18, kim: 36, thuy: 40 },
    targetDiagnosis: { location: 'ly', nature: 'han', state: 'hu', primaryElement: 'tho' },
    keyHerbs: ['hoai-son', 'dinh-lang', 'ngai-cuu', 'tran-bi', 'sinh-khuong', 'cam-thao'],
    idealQuanHerb: 'hoai-son',
    keyAcupoints: [],
    clinicalExplanation:
      'Tỳ Vị hư hàn (Lý - Hư - Hàn): lưỡi nhợt bệu hằn răng, mạch Trầm Nhược Trì, đau bụng thích xoa ấm, ăn kém phân lỏng. Phép trị là Ôn trung kiện Tỳ, bổ khí hành trệ — dùng Hoài sơn làm Quân bổ Tỳ Vị, Đinh lăng / Ngải cứu làm Thần bổ khí ôn trung, Trần bì làm Tá lý khí để thuốc bổ không gây đầy bụng, Cam thảo làm Sứ.',
    realLifeTakeaway:
      'Người Tỳ Vị hư hàn ăn uống kém nên nấu cháo củ mài (Hoài sơn) với vài lát gừng và ít vỏ quýt khô (Trần bì), tránh tuyệt đối trà thanh nhiệt như Tâm sen, Nhân trần hay đồ sống lạnh.',
    followUpLetters: {
      good: 'Gửi thầy buồng thuốc qua cháu ngoại: "Bà Năm ăn hết nửa nồi cháo củ mài gừng trần bì rồi cười móm mém khen ngon. Ba hôm nay bụng bà êm ru, bàn chân hết lạnh ngắt và chiều nay đã xách thúng trầu ra đầu chợ ngồi hóng nắng rồi ạ."',
      partial: 'Lời nhắn từ chợ huyện: "Bà đỡ sôi bụng nhiều nhưng ăn vẫn còn hơi ít, chắc Tỳ vị suy yếu lâu ngày cần tẩm bổ củ mài từ từ."',
      poor: 'Cháu bà Năm báo gấp: "Thưa thầy, bà uống xong thấy bụng lạnh quặn và đi phân lỏng nhiều hơn, không dám uống chén thứ hai..."'
    }
  },
  {
    id: 'c2-can-khi-uat',
    title: 'Ca 05: Chàng thư sinh tức sườn, đắng miệng sau kỳ thi',
    chapter: 2,
    patientName: 'Cậu Minh',
    patientRole: 'Thư sinh chuẩn bị thi Hương',
    age: 23,
    seasonTag: 'Can Khí Uất Kết hóa Hỏa',
    allowAcupuncture: false,
    chiefComplaint:
      'Thưa thầy, dạo này lo nghĩ thi cử nhiều, tôi hay cáu gắt vô cớ, ngực sườn hai bên tức trướng, miệng đắng, hay thở dài và ợ hơi nóng, đêm khó ngủ.',
    visualAppearance:
      'Chân mày nhíu chặt, mắt hơi đỏ, hay thở dài thườn thượt khi kể bệnh.',
    audioObservation:
      'Giọng nói to nhanh, hơi gắt gỏng, tiếng thở hay kéo dài rồi thở hắt ra.',
    auscultationType: 'sigh-stagnation',
    tongue: {
      bodyColor: 'red',
      bodyShape: 'normal',
      coatColor: 'yellow-greasy',
      moisture: 'normal',
      summary: 'Hai rìa lưỡi (vùng Can Đởm) đỏ rực, giữa lưỡi có rêu vàng mỏng hơi nhớt — Can khí uất hóa hỏa phạm Tỳ Vị.',
      zones: [
        { zone: 'tip', label: 'Đầu lưỡi', organRef: 'Tâm - Phế', finding: 'Hơi đỏ', clueTag: 'Tâm phiền' },
        { zone: 'center', label: 'Giữa lưỡi', organRef: 'Tỳ Vị', finding: 'Rêu vàng mỏng', clueTag: 'Can mộc khắc Tỳ thổ' },
        { zone: 'sides', label: 'Hai rìa lưỡi (Can - Đởm)', organRef: 'Can Đởm', finding: 'Đỏ rực nổi bật dọc hai mép lưỡi', clueTag: 'Can uất hóa hỏa' },
        { zone: 'root', label: 'Gốc lưỡi', organRef: 'Thận', finding: 'Bình thường', clueTag: 'Chưa tổn Thận' },
        { zone: 'coat', label: 'Rêu lưỡi', organRef: 'Nhiệt Thấp', finding: 'Vàng hơi nhớt', clueTag: 'Can Đởm thấp nhiệt' }
      ]
    },
    pulse: {
      name: 'Mạch Huyền Sác (Căng như dây đàn và Nhanh)',
      bpm: 92,
      phuStrength: 0.62,
      tramStrength: 0.9,
      waveStyle: 'wiry',
      summary: 'Ấn sâu vào thấy mạch bật thẳng và căng cứng dưới tay như dây đàn tỳ bà, nhịp hơi nhanh.',
      phuFinding: 'Trung bình, không nổi hẳn -> Bệnh ở Lý (Tạng Can).',
      tramFinding: 'Căng thẳng bật tay (Huyền) và nhanh (Sác) -> Can uất hóa hỏa (Lý - Nhiệt - Thực).',
      zoneNotes: {
        thon: { label: 'Thốn (Tâm — Phế)', strengthMultiplier: 0.94, finding: 'Hơi nhanh -> Can hỏa nhiễu lên Tâm khiến khó ngủ.' },
        quan: { label: 'Quan (Can — Đởm)', strengthMultiplier: 1.18, finding: 'Bộ Quan tay trái căng bật như dây đàn -> Tâm điểm Can khí uất hóa hỏa!' },
        xich: { label: 'Xích (Thận)', strengthMultiplier: 0.85, finding: 'Bộ Xích tương đối điều hòa.' }
      }
    },
    inquiries: [
      { id: 'q1', topic: 'Tình chí & Đau tức', question: 'Vùng ngực sườn tức thế nào, có liên quan tâm trạng không?', answer: 'Hễ bực bội hay lo lắng là hai bên mạng sườn căng tức ngay, thở dài xong thấy nhẹ đi chút.', clueTag: 'Can khí uất kết' },
      { id: 'q2', topic: 'Khẩu vị', question: 'Trong miệng cảm thấy vị gì?', answer: 'Sáng dậy miệng đắng nghét, họng khô.', clueTag: 'Đởm nhiệt thượng nghịch (khẩu khổ)' },
      { id: 'q3', topic: 'Tiêu hóa', question: 'Ăn uống có chướng bụng ợ hơi không?', answer: 'Ăn không ngon, hay ợ hơi và đầy tức thượng vị.', clueTag: 'Mộc vượng khắc Thổ (Can phạm Vị)' },
      { id: 'q4', topic: 'Đại tiểu tiện', question: 'Tiểu tiện và đại tiện thế nào?', answer: 'Nước tiểu vàng sậm, đại tiện hơi táo.', clueTag: 'Lý nhiệt' },
      { id: 'q5', topic: 'Mắt & Đầu', question: 'Đầu mắt có khó chịu gì không?', answer: 'Đau nhức hai bên thái dương, mắt hơi cay đỏ.', clueTag: 'Can Đởm kinh nhiệt' },
      { id: 'q6', topic: 'Hàn - Nhiệt', question: 'Có sợ lạnh hay ớn rét ngoài da không?', answer: 'Không sợ lạnh, chỉ thấy người nóng nực bứt rứt.', clueTag: 'Không có Biểu Hàn' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: 56, coldHeat: 76, deficiencyExcess: 42 },
    elementImbalance: { moc: 88, hoa: 68, tho: 34, kim: 48, thuy: 44 },
    targetDiagnosis: { location: 'ly', nature: 'nhiet', state: 'thuc', primaryElement: 'moc' },
    keyHerbs: ['nhan-tran', 'cuc-hoa', 'lac-tien', 'tran-bi', 'cam-thao'],
    idealQuanHerb: 'nhan-tran',
    keyAcupoints: [],
    clinicalExplanation:
      'Can khí uất kết hóa hỏa phạm Tỳ (Lý - Nhiệt - Thực): hai rìa lưỡi đỏ, mạch Huyền Sác, tức mạng sườn, đắng miệng, tiểu vàng. Phép trị là Sơ Can thanh nhiệt, hòa Vị — Nhân trần làm Quân thanh Can Đởm thấp nhiệt, Cúc hoa / Lạc tiên làm Thần bình Can an thần, Trần bì làm Tá hành khí giải uất (hoặc Cam thảo làm Sứ).',
    realLifeTakeaway:
      'Stress kéo dài làm "Can mộc khắc Tỳ thổ", gây vừa cáu gắt vừa đau tức dạ dày. Trà hoa cúc, nhân trần hoặc lạc tiên ấm cùng hít thở sâu giúp hạ Can hỏa rất tốt.',
    followUpLetters: {
      good: 'Thư thư sinh viết chữ chân phương: "Kính bái tạ tiên sinh! Ba chén trà nhân trần hoa cúc đã giải tỏa cơn tức sườn bấy lâu. Sáng nay thức dậy miệng hết đắng, đầu óc thanh thản đọc sách rất vào, lòng nhẹ như mây."',
      partial: 'Thư gửi từ thư phòng: "Ngực sườn đã đỡ tức hơn trước nhưng hễ thức khuya ôn bài lại hơi bốc nóng mắt."',
      poor: 'Thư từ cậu Minh: "Thưa thầy, uống thuốc xong lòng vẫn nóng bứt rứt, tối qua lại mất ngủ thêm..."'
    }
  },
  {
    id: 'c2-tam-ty-luong-hu',
    title: 'Ca 06: Bà chủ tiệm lụa mất ngủ, hồi hộp, hay quên',
    chapter: 2,
    patientName: 'Cô Ba Lụa',
    patientRole: 'Chủ hiệu vải phố cổ',
    age: 41,
    seasonTag: 'Tâm Tỳ Lưỡng Hư',
    allowAcupuncture: false,
    chiefComplaint:
      'Thưa thầy, mấy tháng lo toan sổ sách buôn bán, đêm tôi rất khó vào giấc, ngủ hay mơ màng giật mình, tim đập hồi hộp, hay quên, ăn uống nhạt miệng mỏi mệt.',
    visualAppearance:
      'Sắc mặt hơi vàng nhợt không tươi, quầng mắt thâm nhẹ, môi nhạt màu.',
    audioObservation:
      'Giọng nói đều nhưng thiếu hơi, thỉnh thoảng thở nhẹ.',
    auscultationType: 'weak-breath',
    tongue: {
      bodyColor: 'pale',
      bodyShape: 'thin',
      coatColor: 'thin-white',
      moisture: 'normal',
      summary: 'Chất lưỡi nhợt hơi gầy, rêu trắng mỏng — biểu hiện Tâm huyết và Tỳ khí đều suy giảm.',
      zones: [
        { zone: 'tip', label: 'Đầu lưỡi (Tâm)', organRef: 'Tâm', finding: 'Nhợt màu, không đỏ', clueTag: 'Tâm huyết hư (không phải Tâm hỏa)' },
        { zone: 'center', label: 'Giữa lưỡi (Tỳ - Vị)', organRef: 'Tỳ Vị', finding: 'Nhợt, rêu trắng mỏng', clueTag: 'Tỳ khí bất túc' },
        { zone: 'sides', label: 'Hai rìa lưỡi', organRef: 'Can', finding: 'Hơi nhạt', clueTag: 'Huyết hư' },
        { zone: 'root', label: 'Gốc lưỡi', organRef: 'Thận', finding: 'Bình thường', clueTag: 'Chủ yếu Tâm - Tỳ' },
        { zone: 'coat', label: 'Rêu lưỡi', organRef: 'Hư chứng', finding: 'Trắng mỏng', clueTag: 'Không có thực nhiệt' }
      ]
    },
    pulse: {
      name: 'Mạch Tế Nhược (Nhỏ mảnh và Yếu)',
      bpm: 68,
      phuStrength: 0.3,
      tramStrength: 0.5,
      waveStyle: 'thready',
      summary: 'Sợi mạch mảnh như sợi chỉ (Tế), ấn nhẹ mờ và ấn sâu sức đập yếu (Nhược).',
      phuFinding: 'Mờ yếu -> Không phải ngoại cảm.',
      tramFinding: 'Nhỏ mảnh không lực -> Khí huyết lưỡng hư (Tâm huyết & Tỳ khí đều thiếu).',
      zoneNotes: {
        thon: { label: 'Thốn (Tâm)', strengthMultiplier: 0.72, finding: 'Bộ Thốn mảnh yếu rõ -> Tâm huyết không đủ nuôi dưỡng thần trí.' },
        quan: { label: 'Quan (Tỳ — Vị)', strengthMultiplier: 0.74, finding: 'Bộ Quan mềm yếu -> Tỳ khí suy giảm sinh huyết kém.' },
        xich: { label: 'Xích (Thận)', strengthMultiplier: 0.85, finding: 'Bộ Xích vừa phải.' }
      }
    },
    inquiries: [
      { id: 'q1', topic: 'Giấc ngủ & Tim', question: 'Mất ngủ kiểu khó vào giấc hay thức sớm, tim có đánh trống ngực?', answer: 'Trằn trọc khó ngủ lắm, ngủ được lại mơ liên miên. Lúc mệt tim đập thình thịch hồi hộp.', clueTag: 'Tâm huyết hư không dưỡng được Thần' },
      { id: 'q2', topic: 'Ăn uống & Đại tiện', question: 'Sức ăn và tiêu hóa thế nào?', answer: 'Ăn ít không thấy ngon, hay đầy bụng nhẹ và hơi mệt sau ăn.', clueTag: 'Tỳ khí hư' },
      { id: 'q3', topic: 'Hàn - Nhiệt', question: 'Người có nóng bừng lòng bàn tay chân hay khát nước nhiều không?', answer: 'Không nóng bứt rứt, không lở miệng, chỉ hơi ớn lạnh khi trời trở gió.', clueTag: 'Thiên Hư bình/hơi hàn, loại trừ Tâm hỏa thực' },
      { id: 'q4', topic: 'Đầu mắt', question: 'Khi đứng lên ngồi xuống có chóng mặt hoa mắt?', answer: 'Có ạ, hay tối sầm mắt thoáng qua và quên trước quên sau.', clueTag: 'Huyết hư không vinh dưỡng lên đầu' },
      { id: 'q5', topic: 'Kinh nguyệt', question: 'Sắc kinh và lượng kinh dạo này sao?', answer: 'Kinh ít hơn trước và màu hơi nhạt.', clueTag: 'Tỳ bất thống huyết / Huyết hư' },
      { id: 'q6', topic: 'Mồ hôi', question: 'Ban ngày có hay tự vã mồ hôi khi làm việc nhẹ?', answer: 'Có rịn mồ hôi nhẹ khi leo cầu thang.', clueTag: 'Khí hư' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: 78, coldHeat: -16, deficiencyExcess: -76 },
    elementImbalance: { moc: 40, hoa: 24, tho: 22, kim: 42, thuy: 44 },
    targetDiagnosis: { location: 'ly', nature: 'han', state: 'hu', primaryElement: 'hoa' },
    keyHerbs: ['hoai-son', 'dinh-lang', 'lac-tien', 'ky-tu', 'cam-thao'],
    idealQuanHerb: 'hoai-son',
    keyAcupoints: [],
    clinicalExplanation:
      'Tâm Tỳ lưỡng hư (Lý - Hư): mất ngủ, hay quên, hồi hộp, ăn kém, lưỡi nhợt, mạch Tế Nhược. Cần "kiện Tỳ để sinh huyết dưỡng Tâm" — Hoài sơn làm Quân bổ Tỳ, Đinh lăng làm Thần bổ khí hoạt huyết, Lạc tiên / Kỷ tử làm Tá an thần dưỡng huyết, Cam thảo làm Sứ. Lưu ý: nếu dùng Tâm sen (rất hàn) làm Quân sẽ làm Tỳ vị yếu thêm!',
    realLifeTakeaway:
      'Không phải ai mất ngủ cũng uống Tâm sen! Người gầy yếu, huyết áp thấp, sắc mặt nhợt mất ngủ do Tâm Tỳ hư nên bồi bổ bằng Hoài sơn, Đinh lăng, Kỷ tử và Lạc tiên dịu nhẹ.',
    followUpLetters: {
      good: 'Thiếp hoa gửi kèm mảnh lụa hồng: "Cảm ơn thầy nhiều lắm! Ba tối nay tôi ngủ một mạch tới sáng không còn mơ hoảng, sáng dậy đầu óc tỉnh táo, ăn cơm ngon miệng và sắc mặt hồng hào hẳn lên."',
      partial: 'Nhắn gửi từ tiệm lụa: "Giấc ngủ có sâu hơn trước nhưng chiều tối sổ sách mệt vẫn còn hơi hồi hộp nhẹ."',
      poor: 'Chị giúp việc nhắn lại: "Cô Ba uống thuốc xong thấy hơi lạnh bụng và choáng nhẹ, đêm vẫn trằn trọc..."'
    }
  },
  {
    id: 'c2-tam-hoa-vuong',
    title: 'Ca 07: Ông chủ xưởng rèn bứt rứt, nhiệt miệng, mất ngủ',
    chapter: 2,
    patientName: 'Ông Hai Lò Rèn',
    patientRole: 'Thợ rèn nông cụ',
    age: 48,
    seasonTag: 'Tâm Hỏa Kháng Thịnh',
    allowAcupuncture: false,
    chiefComplaint:
      'Thưa thầy, tuần nay tôi mất ngủ trắng đêm, trong ngực nóng bứt rứt không yên, đầu lưỡi lở loét đau rát, mặt đỏ bừng, tiểu tiện vàng gắt.',
    visualAppearance:
      'Mặt đỏ ửng, ánh mắt bồn chồn, môi khô nứt nhẹ.',
    audioObservation:
      'Nói năng gấp gáp, giọng vang, hay tặc lưỡi vì rát nhiệt miệng.',
    auscultationType: 'wheeze-heat',
    tongue: {
      bodyColor: 'crimson',
      bodyShape: 'normal',
      coatColor: 'yellow-dry',
      moisture: 'dry',
      summary: 'Đầu lưỡi đỏ thẫm như son và có nốt nhiệt rát, rêu vàng khô — Tâm hỏa vượng bốc lên lưỡi.',
      zones: [
        { zone: 'tip', label: 'Đầu lưỡi (Tâm)', organRef: 'Tâm', finding: 'Đỏ thẫm (giáng) kèm vết loét nhiệt', clueTag: 'Tâm hỏa vượng rõ rệt' },
        { zone: 'center', label: 'Giữa lưỡi', organRef: 'Tỳ Vị', finding: 'Rêu vàng khô mỏng', clueTag: 'Nhiệt thịnh hao tân' },
        { zone: 'sides', label: 'Hai rìa lưỡi', organRef: 'Can', finding: 'Đỏ nhẹ', clueTag: 'Can hỏa phụ họa' },
        { zone: 'root', label: 'Gốc lưỡi', organRef: 'Thận', finding: 'Khô ít nước bọt', clueTag: 'Tâm Thận bất giao' },
        { zone: 'coat', label: 'Rêu lưỡi', organRef: 'Lý Nhiệt', finding: 'Vàng khô', clueTag: 'Thực nhiệt' }
      ]
    },
    pulse: {
      name: 'Mạch Hồng Sác (To mạnh và Nhanh)',
      bpm: 102,
      phuStrength: 0.78,
      tramStrength: 0.92,
      waveStyle: 'rapid-surging',
      summary: 'Mạch đập to rộng cuồn cuộn như sóng triều dâng (Hồng) và rất nhanh (~102 nhịp/phút).',
      phuFinding: 'Đập mạnh và nhanh -> Hỏa nhiệt bức bách huyết mạch.',
      tramFinding: 'Ấn sâu lực rất mạnh, không rỗng -> Thực nhiệt ở Lý (Lý - Nhiệt - Thực).',
      zoneNotes: {
        thon: { label: 'Thốn (Tâm)', strengthMultiplier: 1.2, finding: 'Bộ Thốn bên trái đập cuộn như sóng triều và rất gấp -> Tâm Hỏa kháng thịnh rõ nhất!' },
        quan: { label: 'Quan (Can — Vị)', strengthMultiplier: 1.0, finding: 'Bộ Quan cũng nảy mạnh theo hỏa thế.' },
        xich: { label: 'Xích (Thận)', strengthMultiplier: 0.76, finding: 'Bộ Xích hơi yếu hơn bộ Thốn -> Thủy bất chế Hỏa.' }
      }
    },
    inquiries: [
      { id: 'q1', topic: 'Tâm & Ngực', question: 'Đêm nằm thấy thế nào?', answer: 'Tim đập dồn, lòng ngực nóng bừng bồn chồn, lăn lộn tới sáng.', clueTag: 'Tâm phiền bất miên' },
      { id: 'q2', topic: 'Miệng & Khát', question: 'Có khát và lở miệng không?', answer: 'Rát đầu lưỡi ăn cơm cũng xót, thèm uống nước mát liên tục.', clueTag: 'Tâm khai khiếu ra lưỡi -> Tâm hỏa' },
      { id: 'q3', topic: 'Tiểu tiện', question: 'Đi tiểu có rát hay vàng đậm?', answer: 'Nước tiểu đỏ vàng sậm và hơi nóng rát.', clueTag: 'Tâm di nhiệt sang Tiểu trường' },
      { id: 'q4', topic: 'Bụng & Đại tiện', question: 'Bụng có lạnh hay đi lỏng không?', answer: 'Không lạnh, chỉ hơi táo bón mấy hôm nay.', clueTag: 'Không có Tỳ hư hàn -> An toàn dùng vị hàn' },
      { id: 'q5', topic: 'Hàn - Nhiệt', question: 'Có sợ gió rét không?', answer: 'Chỉ thấy nóng bức thôi, chẳng sợ lạnh chút nào.', clueTag: 'Lý Nhiệt thuần' },
      { id: 'q6', topic: 'Ăn uống', question: 'Gần đây hay ăn uống gì?', answer: 'Đêm nào xong việc cũng uống rượu thuốc nóng với đồ nướng cay.', clueTag: 'Tích nhiệt sinh Tâm hỏa' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: 64, coldHeat: 88, deficiencyExcess: 28 },
    elementImbalance: { moc: 60, hoa: 94, tho: 46, kim: 44, thuy: 30 },
    targetDiagnosis: { location: 'ly', nature: 'nhiet', state: 'thuc', primaryElement: 'hoa' },
    keyHerbs: ['tam-sen', 'lac-tien', 'ky-tu', 'kim-ngan-hoa', 'cam-thao'],
    idealQuanHerb: 'tam-sen',
    keyAcupoints: [],
    clinicalExplanation:
      'Tâm hỏa cang thịnh (Lý - Nhiệt - Thực): đầu lưỡi đỏ thẫm nhiệt miệng, mạch Hồng Sác, bứt rứt mất ngủ, tiểu vàng rát. Đúng chỉ định dùng Tâm sen (Liên tâm) làm Quân để thanh Tâm giáng hỏa, Lạc tiên / Kim ngân hoa làm Thần an thần giải nhiệt, Kỷ tử hoặc Cam thảo làm Tá/Sứ tư âm điều hòa.',
    realLifeTakeaway:
      'Trà Tâm sen + Lạc tiên rất hợp với người bốc hỏa, nhiệt miệng, tiểu vàng mất ngủ. Nhưng phải phân biệt với mất ngủ do Tâm Tỳ hư ở ca trước để không dùng nhầm thuốc hàn.',
    followUpLetters: {
      good: 'Thư từ xưởng rèn đầu làng: "Nói thật với thầy, đêm đầu uống thang tâm sen lạc tiên tôi ngủ một lèo tới gà gáy! Đầu lưỡi hết rát, người mát hẳn, sáng nay tôi rèn xong cho thầy con dao thái thuốc nhỏ."',
      partial: 'Thư nhắn lại: "Lưỡi bớt rát rồi nhưng đêm vẫn chập chờn đôi chút nếu ban ngày đứng cạnh lò than lâu."',
      poor: 'Cháu ông Hai báo tin: "Ông uống xong vẫn nóng bức cồn cào, miệng loét đau thêm, mong thầy đổi vị thanh Tâm mát hơn..."'
    }
  },

  // ==================== CHƯƠNG 3: KINH LẠC & TRONG UỐNG NGOÀI CHÂM ====================
  {
    id: 'c3-vai-gay-phong-han',
    title: 'Ca 08: Bác phu xe cứng cổ vai gáy, đau đầu sau gáy',
    chapter: 3,
    patientName: 'Bác Tư Xe',
    patientRole: 'Người kéo xe hàng sớm',
    age: 52,
    seasonTag: 'Phong Hàn bế Kinh lạc',
    allowAcupuncture: true,
    chiefComplaint:
      'Thưa thầy, sáng sớm nay chở hàng gặp gió lạnh thốc thẳng vào gáy. Giờ cổ vai gáy cứng đơ không quay đầu được, đau giật lên sau gáy, hai cánh tay tê buốt nặng trĩu.',
    visualAppearance:
      'Đầu nghiêng cứng một bên, không dám ngoái cổ, vai phải co nâng lên để đỡ đau.',
    audioObservation:
      'Thỉnh thoảng rên khẽ khi xoay vai, không ho sốt cao.',
    auscultationType: 'cold-sniffle',
    tongue: {
      bodyColor: 'purplish',
      bodyShape: 'normal',
      coatColor: 'thin-white',
      moisture: 'normal',
      summary: 'Chất lưỡi hơi ám tím nhẹ (ứ trệ kinh lạc), rêu trắng mỏng — Phong Hàn làm khí huyết kinh mạch vùng vai gáy ngưng trệ.',
      zones: [
        { zone: 'tip', label: 'Đầu lưỡi', organRef: 'Tâm - Phế', finding: 'Hồng hơi sậm', clueTag: 'Khí trệ nhẹ' },
        { zone: 'center', label: 'Giữa lưỡi', organRef: 'Tỳ Vị', finding: 'Rêu trắng mỏng', clueTag: 'Vị khí bình' },
        { zone: 'sides', label: 'Hai rìa lưỡi', organRef: 'Can Đởm', finding: 'Hơi tím nhạt', clueTag: 'Kinh khí ứ trệ (Bất thông tắc thống)' },
        { zone: 'root', label: 'Gốc lưỡi', organRef: 'Thận', finding: 'Bình thường', clueTag: 'Chưa suy Thận' },
        { zone: 'coat', label: 'Rêu lưỡi', organRef: 'Biểu Hàn', finding: 'Trắng mỏng', clueTag: 'Phong Hàn' }
      ]
    },
    pulse: {
      name: 'Mạch Phù Khẩn Sáp (Nổi, Căng và hơi rít)',
      bpm: 68,
      phuStrength: 0.86,
      tramStrength: 0.52,
      waveStyle: 'tight',
      summary: 'Tầng nông bật căng do phong hàn bó kinh, dòng mạch đi hơi sượng nhẹ do khí huyết kinh lạc không thông.',
      phuFinding: 'Nổi và căng chắc -> Tà khí phong hàn ở kinh lạc biểu tầng.',
      tramFinding: 'Ấn sâu có lực -> Thực chứng kinh lạc.',
      zoneNotes: {
        thon: { label: 'Thốn (Phế — Vai gáy)', strengthMultiplier: 1.12, finding: 'Bộ Thốn nổi bật căng như dây -> Kinh lạc vùng cổ vai gáy đang bị gió lạnh bó chặt.' },
        quan: { label: 'Quan (Can — Gân cơ)', strengthMultiplier: 1.0, finding: 'Hơi căng ở gân mạch.' },
        xich: { label: 'Xích (Thận)', strengthMultiplier: 0.86, finding: 'Hạ tiêu ổn định.' }
      }
    },
    inquiries: [
      { id: 'q1', topic: 'Vị trí đau', question: 'Đau lan từ đâu tới đâu?', answer: 'Đau cứng từ hõm sau gáy lan xuống bả vai và tê dọc cánh tay.', clueTag: 'Kinh Đởm (Phong Trì), Thái Dương & Phế/Đại Trường' },
      { id: 'q2', topic: 'Tính chất đau', question: 'Đau gặp ấm hay gặp lạnh thay đổi sao?', answer: 'Gió lùa vào là buốt cứng thêm, xoa dầu nóng thì đỡ đôi chút.', clueTag: 'Hàn ngưng huyết ứ' },
      { id: 'q3', topic: 'Sinh hoạt', question: 'Ngủ dậy có bị sái cổ hay do gió sớm?', answer: 'Lúc mới dậy bình thường, ra đầu ngõ trúng gió lạnh mới cứng đơ.', clueTag: 'Ngoại phong hàn' },
      { id: 'q4', topic: 'Hàn - Nhiệt', question: 'Có sốt nóng hay khát nước không?', answer: 'Chỉ hơi gai lạnh, không sốt, không khát.', clueTag: 'Hàn chứng' },
      { id: 'q5', topic: 'Tiêu hóa', question: 'Ăn ngủ bình thường chứ?', answer: 'Ăn bình thường, đêm ngủ khó trở mình vì đau vai.', clueTag: 'Không tổn thương tạng sâu' },
      { id: 'q6', topic: 'Thai sản / Bệnh nền', question: 'Có bệnh nền huyết áp hay đang dùng thuốc gì không?', answer: 'Không có bệnh nền gì thầy ạ.', clueTag: 'An toàn thông kinh lạc' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: -64, coldHeat: -76, deficiencyExcess: 66 },
    elementImbalance: { moc: 62, hoa: 38, tho: 46, kim: 36, thuy: 54 },
    targetDiagnosis: { location: 'bieu', nature: 'han', state: 'thuc', primaryElement: 'moc' },
    keyHerbs: ['que-chi', 'tia-to', 'la-lot', 'sinh-khuong', 'cam-thao'],
    idealQuanHerb: 'que-chi',
    keyAcupoints: ['phong-tri', 'liet-khuyet', 'hop-coc'],
    clinicalExplanation:
      'Phong Hàn xâm nhập kinh lạc vùng cổ vai gáy ("Thông tắc bất thống, thống tắc bất thông"). Phối hợp "Trong uống ngoài châm": Quế chi làm Quân ôn thông kinh mạch đưa dương khí ra vai tay, Tía tô / Lá lốt làm Thần-Tá khu phong tán hàn, Cam thảo làm Sứ; kết hợp bấm huyệt Phong Trì + Liệt Khuyết (+ Hợp Cốc) mở cửa kinh lạc sau gáy ngay tức thì.',
    realLifeTakeaway:
      'Khi bị cứng cổ vai gáy do gió lạnh, hãy giữ ấm vùng gáy, day nhẹ huyệt Phong Trì (hai hõm sau gáy) và Liệt Khuyết (cổ tay) kết hợp uống nước quế gừng ấm.',
    followUpLetters: {
      good: 'Nhắn gửi từ bến xe huyện: "Hay quá thầy ơi! Vừa day Phong Trì - Liệt Khuyết xong uống ấm thang quế chi lá lốt, sáng hôm sau tôi quay cổ nhẹ nhàng như thường, kéo xe nhẹ tênh không còn tê buốt cánh tay."',
      partial: 'Thư nhắn qua bạn nghề: "Cổ đã quay sang được một nửa, nhưng sáng sớm gió lùa vẫn hơi ê ẩm bả vai."',
      poor: 'Nhắn gấp từ nhà bác Tư: "Cổ bác vẫn cứng đơ và đau giật thêm sau khi gặp lạnh..."'
    }
  },
  {
    id: 'c3-thai-phu-khi-nghich',
    title: 'Ca 09: Thai phụ buồn nôn, hồi hộp, đau trán (Cấm kỵ Thai kỳ)',
    chapter: 3,
    patientName: 'Chị Huệ',
    patientRole: 'Phụ nữ mang thai tháng thứ 4',
    age: 27,
    isPregnant: true,
    seasonTag: 'Thai phụ Vị khí nghịch & Tâm phiền',
    allowAcupuncture: true,
    chiefComplaint:
      'Thưa thầy, tôi đang mang thai tháng thứ 4. Mấy hôm nay trời oi bức, tôi hay buồn nôn khan, tức ngực hồi hộp, đau căng hai bên trán và ngủ rất chập chờn.',
    visualAppearance:
      'Bụng bầu nhẹ tháng thứ 4, sắc mặt hơi mỏi mệt, hay đưa tay vuốt vùng ngực và trán.',
    audioObservation:
      'Thở hơi gấp nhẹ, hay nuốt khan vì cảm giác buồn nôn.',
    auscultationType: 'sigh-stagnation',
    tongue: {
      bodyColor: 'pink',
      bodyShape: 'normal',
      coatColor: 'thin-white',
      moisture: 'normal',
      summary: 'Chất lưỡi hồng hơi đỏ ở đầu lưỡi, rêu trắng mỏng hơi khô nhẹ — Vị khí thượng nghịch kèm nhẹ Tâm phiền.',
      zones: [
        { zone: 'tip', label: 'Đầu lưỡi (Tâm)', organRef: 'Tâm', finding: 'Hơi đỏ nhẹ', clueTag: 'Tâm khí hơi phiền' },
        { zone: 'center', label: 'Giữa lưỡi (Vị)', organRef: 'Vị', finding: 'Rêu trắng mỏng', clueTag: 'Vị khí bất hòa nhẹ' },
        { zone: 'sides', label: 'Hai rìa lưỡi', organRef: 'Can', finding: 'Hồng bình thường', clueTag: 'Chưa uất nặng' },
        { zone: 'root', label: 'Gốc lưỡi', organRef: 'Thận', finding: 'Bình thường', clueTag: 'Thận khí ổn' },
        { zone: 'coat', label: 'Rêu lưỡi', organRef: 'Hơi Nhiệt nhẹ', finding: 'Trắng mỏng', clueTag: 'Chứng nhẹ, cần thuốc/huyệt an toàn' }
      ]
    },
    pulse: {
      name: 'Mạch Hoạt Sác nhẹ (Trơn đều — Mạch Thai)',
      bpm: 86,
      phuStrength: 0.6,
      tramStrength: 0.72,
      waveStyle: 'slippery',
      summary: 'Mạch đi tròn trơn mượt như hạt ngọc lăn trên đĩa (Hoạt mạch đặc trưng của thai kỳ), hơi nhanh nhẹ.',
      phuFinding: 'Vừa phải -> Không phải ngoại cảm nặng.',
      tramFinding: 'Trơn tròn đều (Hoạt) -> Mạch thai phụ kèm khí nghịch nhẹ ở Vị và Tâm.',
      zoneNotes: {
        thon: { label: 'Thốn (Tâm)', strengthMultiplier: 0.96, finding: 'Trơn đều hơi nhanh -> Tâm phiền nhẹ khi trời oi.' },
        quan: { label: 'Quan (Tỳ — Vị)', strengthMultiplier: 1.05, finding: 'Trơn tròn rõ (Hoạt) -> Vị khí thượng nghịch gây buồn nôn.' },
        xich: { label: 'Xích (Bào cung / Thận)', strengthMultiplier: 1.12, finding: 'Bộ Xích trơn tròn có lực (Mạch Thai rất rõ) -> Thai nhi bình an, tuyệt đối cấm dùng vị/huyệt hoạt huyết hạ hành!' }
      }
    },
    inquiries: [
      { id: 'q1', topic: 'Thai kỳ & Cơ địa', question: 'Chị mang thai tuần thứ mấy, thai máy và bụng dưới có đau trằn không?', answer: 'Được 16 tuần rồi thầy ạ, bụng dưới hoàn toàn êm, chỉ nghén buồn nôn và khó chịu vùng thượng vị.', clueTag: 'CẢNH BÁO THAI KỲ: Tuyệt đối tránh vị/huyệt hoạt huyết hạ hành!' },
      { id: 'q2', topic: 'Buồn nôn & Ngực', question: 'Cảm giác buồn nôn xuất hiện khi nào?', answer: 'Cứ ngửi mùi cơm hay chiều tối là ngực tức, buồn nôn khan.', clueTag: 'Vị khí thượng nghịch -> Hợp Nội Quan & Tía tô' },
      { id: 'q3', topic: 'Giấc ngủ & Đầu', question: 'Đầu đau chỗ nào và đêm ngủ ra sao?', answer: 'Căng nhức giữa trán và khó chợp mắt, hay giật mình.', clueTag: 'An thần bằng Ấn Đường / Lạc tiên nhẹ' },
      { id: 'q4', topic: 'Hàn - Nhiệt', question: 'Có sốt hay ớn lạnh nhiều không?', answer: 'Không sốt, không lạnh bụng.', clueTag: 'Ôn bình hòa trung' },
      { id: 'q5', topic: 'Đại tiểu tiện', question: 'Ăn uống đại tiểu tiện thế nào?', answer: 'Đi tiêu bình thường, tiểu hơi vàng nhẹ.', clueTag: 'Không táo nặng' },
      { id: 'q6', topic: 'Mong muốn trị liệu', question: 'Chị có ngại uống thuốc đắng hay muốn phối thêm bấm huyệt dịu nhẹ?', answer: 'Tôi sợ uống thuốc đắng mạnh, mong thầy kê thang thật lành tính và bấm huyệt an toàn cho em bé.', clueTag: 'Ưu tiên vị an thai (Tía tô) & huyệt Nội Quan, Ấn Đường' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: 42, coldHeat: -15, deficiencyExcess: -35 },
    elementImbalance: { moc: 52, hoa: 58, tho: 28, kim: 46, thuy: 44 },
    targetDiagnosis: { location: 'ly', nature: 'han', state: 'hu', primaryElement: 'tho' },
    keyHerbs: ['tia-to', 'hoai-son', 'lac-tien', 'cam-thao'],
    idealQuanHerb: 'hoai-son',
    keyAcupoints: ['noi-quan', 'an-duong'],
    clinicalExplanation:
      'BÀI HỌC CẤM KỴ Y GIA: Với thai phụ buồn nôn, tức ngực, đau đầu và khó ngủ, tuyệt đối CẤM dùng huyệt Hợp Cốc (LI4), Tam Âm Giao (SP6) và vị thuốc Cỏ xước / Đan sâm / Ngải cứu liều Quân (gây hoạt huyết co bóp tử cung). Hướng trị an toàn là Hoài sơn + Tía tô (vốn là vị an thai chỉ ẩu nổi tiếng!) kết hợp Lạc tiên, Cam thảo; bên ngoài chỉ bấm nhẹ Nội Quan (PC6 - chống nôn an thần) và Ấn Đường (EX-HN3 - dịu căng thẳng vùng trán).',
    realLifeTakeaway:
      'Huyệt Nội Quan (dưới nếp cổ tay 3 ngón tay) là huyệt vàng an toàn giúp giảm buồn nôn ốm nghén và say tàu xe. Ngược lại, phụ nữ mang thai phải tuyệt đối tránh bấm Hợp Cốc và Tam Âm Giao.',
    followUpLetters: {
      good: 'Thư viết bằng mực tím dịu dàng: "Chị Huệ cảm ơn thầy nhiều lắm! Nhờ thang Hoài sơn — Tía tô lành tính và cách bấm huyệt Nội Quan, Ấn Đường, ba hôm nay chị ăn được cơm thơm ngon, không còn buồn nôn và ngủ ngon giấc, thai máy đều khỏe."',
      partial: 'Thư chồng chị Huệ gửi tới: "Vợ tôi đỡ buồn nôn nhiều nhưng chiều tối vẫn hơi nhức trán nhẹ."',
      poor: 'CẢNH BÁO TỪ NHÀ CHỊ HUỆ: "Thầy ơi, chị Huệ uống hoặc bấm huyệt xong thấy bụng dưới râm ran tức nặng, gia đình rất lo và phải ngưng ngay!"'
    }
  },
  {
    id: 'c3-than-duong-hu-phong-thap',
    title: 'Ca 10: Bác tiều phu đau thắt lưng gối lạnh buốt khi trở trời',
    chapter: 3,
    patientName: 'Bác Năm Rừng',
    patientRole: 'Người hái măng vùng núi',
    age: 58,
    seasonTag: 'Thận Dương Hư kiêm Phong Thấp',
    allowAcupuncture: true,
    chiefComplaint:
      'Thưa thầy, nhiều năm đi rừng dầm sương, nay hai đầu gối và thắt lưng tôi đau nhức lạnh buốt, hễ trời sắp mưa là buốt tận xương. Đêm phải dậy tiểu 3–4 lần, chân tay luôn lạnh.',
    visualAppearance:
      'Lưng hơi khom khi bước vào, sắc mặt hơi tối xám, quầng mắt thâm.',
    audioObservation:
      'Giọng trầm khàn nhẹ, thở chậm, không ho sốt.',
    auscultationType: 'weak-breath',
    tongue: {
      bodyColor: 'pale',
      bodyShape: 'swollen-teeth',
      coatColor: 'thick-white',
      moisture: 'wet-slippery',
      summary: 'Chất lưỡi nhợt bệu, gốc lưỡi rêu trắng ướt — Thận Dương suy yếu không ôn ấm được lưng gối nên Phong Hàn Thấp thừa cơ xâm nhập.',
      zones: [
        { zone: 'tip', label: 'Đầu lưỡi', organRef: 'Tâm - Phế', finding: 'Nhợt màu', clueTag: 'Dương khí bất túc' },
        { zone: 'center', label: 'Giữa lưỡi', organRef: 'Tỳ Vị', finding: 'Rêu trắng ướt', clueTag: 'Thấp trệ' },
        { zone: 'sides', label: 'Hai rìa lưỡi', organRef: 'Can', finding: 'Hằn răng nhẹ', clueTag: 'Can Thận đồng nguyên suy' },
        { zone: 'root', label: 'Gốc lưỡi (Thận)', organRef: 'Thận', finding: 'Rêu trắng dày ướt ở gốc lưỡi', clueTag: 'Thận dương hư kiêm hàn thấp' },
        { zone: 'coat', label: 'Rêu lưỡi', organRef: 'Hàn Thấp', finding: 'Trắng ướt', clueTag: 'Hàn chứng' }
      ]
    },
    pulse: {
      name: 'Mạch Trầm Tế Nhược bộ Xích (Chìm, Nhỏ Yếu ở bộ Thận)',
      bpm: 58,
      phuStrength: 0.28,
      tramStrength: 0.44,
      waveStyle: 'thready',
      summary: 'Đặt tay sâu xuống bộ Xích (đại diện cho Thận) thấy mạch chìm sâu, nhỏ và yếu ớt rõ rệt.',
      phuFinding: 'Mờ nhạt -> Không phải cảm mạo cấp ở biểu.',
      tramFinding: 'Bộ Xích ấn sâu rất yếu và chậm -> Thận Dương hư (Lý - Hư - Hàn).',
      zoneNotes: {
        thon: { label: 'Thốn (Tâm — Phế)', strengthMultiplier: 0.85, finding: 'Hơi trầm tĩnh.' },
        quan: { label: 'Quan (Can — Tỳ)', strengthMultiplier: 0.82, finding: 'Mềm hơi yếu do Can Thận đồng nguyên.' },
        xich: { label: 'Xích (Thận — Mệnh Môn)', strengthMultiplier: 0.56, finding: 'Bộ Xích lún sâu và yếu mềm rõ rệt -> Gốc Thận Dương hư suy!' }
      }
    },
    inquiries: [
      { id: 'q1', topic: 'Lưng & Gối', question: 'Đau lưng gối nặng vào lúc nào và chườm nóng thấy sao?', answer: 'Đau âm ỉ lạnh buốt dọc thắt lưng và hai gối, trời mưa ẩm đau tăng, lấy túi muối rang chườm vào thì khoan khoái hẳn.', clueTag: 'Hàn thấp + Thận dương hư' },
      { id: 'q2', topic: 'Tiểu tiện & Ngủ', question: 'Ban đêm đi tiểu mấy lần?', answer: 'Đêm nào cũng dậy tiểu 3–4 lần, nước tiểu trong dài.', clueTag: 'Thận dương hư không nhiếp được Bàng quang' },
      { id: 'q3', topic: 'Tai & Tứ chi', question: 'Tai có ù và chân tay thế nào?', answer: 'Tai hay ù nhỏ như tiếng ve, hai bàn chân từ đầu gối trở xuống lạnh như đá.', clueTag: 'Thận khai khiếu ra tai' },
      { id: 'q4', topic: 'Hàn - Nhiệt', question: 'Có sốt nóng hay khát nước không?', answer: 'Không sốt, không khát, sợ gió lạnh.', clueTag: 'Thuần Hàn' },
      { id: 'q5', topic: 'Ăn uống', question: 'Sức ăn ra sao?', answer: 'Ăn uống trung bình, buổi sáng hay sôi bụng nhẹ.', clueTag: 'Thận dương hư liên lụy Tỳ' },
      { id: 'q6', topic: 'Tiền sử', question: 'Bác có bệnh lý chảy máu hay mang thai gì không?', answer: 'Tôi đàn ông khỏe mạnh, chỉ đau xương khớp và lạnh lưng lâu năm thôi.', clueTag: 'An toàn dùng Cỏ xước, Quế chi, Thận Du' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: 88, coldHeat: -86, deficiencyExcess: -58 },
    elementImbalance: { moc: 38, hoa: 30, tho: 34, kim: 40, thuy: 16 },
    targetDiagnosis: { location: 'ly', nature: 'han', state: 'hu', primaryElement: 'thuy' },
    keyHerbs: ['ngai-cuu', 'la-lot', 'co-xuoc', 'ky-tu', 'que-chi'],
    idealQuanHerb: 'ngai-cuu',
    keyAcupoints: ['than-du', 'khi-hai', 'tuc-tam-ly'],
    clinicalExplanation:
      'Thận Dương hư kiêm Phong Hàn Thấp (Lý - Hư - Hàn ở hạ tiêu): đau lưng mỏi gối lạnh buốt, tiểu đêm nhiều, bộ Xích mạch Trầm Tế Nhược. Cần "Bổ Thận ôn dương, khu phong trừ thấp" — Ngải cứu / Quế chi làm Quân ôn ấm hạ tiêu, Lá lốt làm Thần trừ phong thấp, Cỏ xước làm Tá dẫn thuốc xuống mạnh gân cốt (cùng Kỷ tử bổ Can Thận); kết hợp bấm/cứu huyệt Thận Du (BL23), Khí Hải (CV6) và Túc Tam Lý (ST36).',
    realLifeTakeaway:
      'Ngâm chân nước ấm nấu lá lốt + gừng + muối hột buổi tối và xoa ấm hai huyệt Thận Du sau thắt lưng giúp cải thiện rất tốt chứng lạnh chân, tiểu đêm và đau nhức gối khi trở trời.',
    followUpLetters: {
      good: 'Thư bọc lá dong từ bìa rừng: "Tốt lắm thầy ạ! Mỗi tối tôi hơ ngải cứu ấm huyệt Thận Du rồi uống chén thuốc ngải cứu lá lốt cỏ xước, đêm ngủ thẳng tới sáng không phải dậy đi tiểu nữa, hai đầu gối ấm hẳn lên!"',
      partial: 'Nhắn gửi qua người đi chợ phiên: "Đêm giảm tiểu còn một hai lần, nhưng gặp mưa rào lưng gối vẫn còn hơi mỏi."',
      poor: 'Chú hàng xóm báo tin: "Bác Năm uống xong thấy người vẫn lạnh và đầu gối nhức hơn khi trở gió..."'
    }
  }
];

interface ProceduralTemplate {
  code: string;
  titlePrefix: string;
  seasonTag: string;
  minChapter: 1 | 2 | 3;
  allowAcupuncture: boolean;
  chiefComplaint: string;
  visualAppearance: string;
  audioObservation: string;
  tongue: PatientCase['tongue'];
  pulse: PatientCase['pulse'];
  inquiries: PatientCase['inquiries'];
  initialVector: PatientCase['initialVector'];
  elementImbalance: PatientCase['elementImbalance'];
  targetDiagnosis: PatientCase['targetDiagnosis'];
  keyHerbs: string[];
  idealQuanHerb: string;
  keyAcupoints: string[];
  clinicalExplanation: string;
  realLifeTakeaway: string;
}

const PROCEDURAL_TEMPLATES: ProceduralTemplate[] = [
  {
    code: 'proc-phong-han',
    titlePrefix: 'Khách vãng lai: Trúng gió lạnh đồng ruộng',
    seasonTag: 'Phong Hàn biểu thực',
    minChapter: 1,
    allowAcupuncture: false,
    chiefComplaint:
      'Thưa thầy, vừa ra đồng sớm gặp gió lạnh, giờ tôi ớn rét run người, mũi tắc chảy nước trong, đau đầu không ra mồ hôi.',
    visualAppearance: 'Sắc mặt hơi tái, da khô không có mồ hôi.',
    audioObservation: 'Tiếng nói nghẹt mũi, hắt hơi liên tục.',
    tongue: STORY_CASES[0].tongue,
    pulse: STORY_CASES[0].pulse,
    inquiries: STORY_CASES[0].inquiries,
    initialVector: { exteriorInterior: -84, coldHeat: -84, deficiencyExcess: 64 },
    elementImbalance: { moc: 46, hoa: 36, tho: 46, kim: 26, thuy: 60 },
    targetDiagnosis: { location: 'bieu', nature: 'han', state: 'thuc', primaryElement: 'kim' },
    keyHerbs: ['tia-to', 'kinh-gioi', 'sinh-khuong', 'cam-thao'],
    idealQuanHerb: 'tia-to',
    keyAcupoints: [],
    clinicalExplanation: 'Chứng Phong Hàn biểu thực: tân ôn giải biểu với Tía tô, Kinh giới, Sinh khương, Cam thảo.',
    realLifeTakeaway: 'Uống ấm nước tía tô gừng tươi giúp giải cảm lạnh nhanh.'
  },
  {
    code: 'proc-phong-nhiet',
    titlePrefix: 'Khách vãng lai: Cảm nắng rát họng',
    seasonTag: 'Phong Nhiệt biểu chứng',
    minChapter: 1,
    allowAcupuncture: false,
    chiefComplaint:
      'Thưa thầy, đi chợ nắng gắt về tôi sốt nóng bừng, cổ họng đau rát, khát nước mát và ho đờm vàng.',
    visualAppearance: 'Gò má đỏ, môi khô, trán rịn mồ hôi.',
    audioObservation: 'Giọng khàn, ho khan tiếng đục.',
    tongue: STORY_CASES[1].tongue,
    pulse: STORY_CASES[1].pulse,
    inquiries: STORY_CASES[1].inquiries,
    initialVector: { exteriorInterior: -80, coldHeat: 84, deficiencyExcess: 68 },
    elementImbalance: { moc: 56, hoa: 76, tho: 46, kim: 30, thuy: 40 },
    targetDiagnosis: { location: 'bieu', nature: 'nhiet', state: 'thuc', primaryElement: 'kim' },
    keyHerbs: ['bac-ha', 'kim-ngan-hoa', 'cuc-hoa', 'cat-can', 'cam-thao'],
    idealQuanHerb: 'bac-ha',
    keyAcupoints: [],
    clinicalExplanation: 'Chứng Phong Nhiệt phạm Phế: tân lương giải biểu với Bạc hà, Kim ngân hoa, Cúc hoa, Cát căn.',
    realLifeTakeaway: 'Dùng trà bạc hà, kim ngân hoa, cúc hoa mát dịu họng khi cảm nắng nóng.'
  },
  {
    code: 'proc-ty-hu',
    titlePrefix: 'Khách vãng lai: Mỏi mệt ăn kém lạnh bụng',
    seasonTag: 'Tỳ Vị hư hàn',
    minChapter: 2,
    allowAcupuncture: false,
    chiefComplaint:
      'Thưa thầy, dạo này người tôi uể oải, ăn không tiêu, hay lạnh bụng đi ngoài phân nát, tay chân lạnh.',
    visualAppearance: 'Sắc mặt vàng nhạt, thiếu sức sống.',
    audioObservation: 'Nói nhỏ nhẹ, hơi thở ngắn.',
    tongue: STORY_CASES[3].tongue,
    pulse: STORY_CASES[3].pulse,
    inquiries: STORY_CASES[3].inquiries,
    initialVector: { exteriorInterior: 76, coldHeat: -74, deficiencyExcess: -74 },
    elementImbalance: { moc: 44, hoa: 34, tho: 20, kim: 38, thuy: 42 },
    targetDiagnosis: { location: 'ly', nature: 'han', state: 'hu', primaryElement: 'tho' },
    keyHerbs: ['hoai-son', 'dinh-lang', 'ngai-cuu', 'tran-bi', 'cam-thao'],
    idealQuanHerb: 'hoai-son',
    keyAcupoints: [],
    clinicalExplanation: 'Tỳ Vị hư hàn: bổ Tỳ ôn trung bằng Hoài sơn, Đinh lăng, Ngải cứu, Trần bì.',
    realLifeTakeaway: 'Cháo củ mài (Hoài sơn) + gừng + trần bì rất tốt cho người Tỳ vị yếu lạnh.'
  },
  {
    code: 'proc-tam-hoa',
    titlePrefix: 'Khách vãng lai: Bứt rứt nhiệt miệng mất ngủ',
    seasonTag: 'Tâm Hỏa vượng',
    minChapter: 2,
    allowAcupuncture: false,
    chiefComplaint:
      'Thưa thầy, mấy đêm liền tôi nóng bứt rứt không ngủ được, đầu lưỡi nhiệt đau rát, tiểu vàng đậm.',
    visualAppearance: 'Mặt hơi đỏ, mắt bồn chồn.',
    audioObservation: 'Nói gấp gáp, giọng vang.',
    tongue: STORY_CASES[6].tongue,
    pulse: STORY_CASES[6].pulse,
    inquiries: STORY_CASES[6].inquiries,
    initialVector: { exteriorInterior: 74, coldHeat: 84, deficiencyExcess: 54 },
    elementImbalance: { moc: 58, hoa: 90, tho: 46, kim: 44, thuy: 32 },
    targetDiagnosis: { location: 'ly', nature: 'nhiet', state: 'thuc', primaryElement: 'hoa' },
    keyHerbs: ['tam-sen', 'lac-tien', 'ky-tu', 'kim-ngan-hoa', 'cam-thao'],
    idealQuanHerb: 'tam-sen',
    keyAcupoints: [],
    clinicalExplanation: 'Tâm hỏa vượng: thanh Tâm an thần với Tâm sen, Lạc tiên, Kỷ tử, Cam thảo.',
    realLifeTakeaway: 'Trà tâm sen lạc tiên thích hợp khi nóng trong, nhiệt miệng mất ngủ.'
  },
  {
    code: 'proc-kinh-lac-vai-gay',
    titlePrefix: 'Khách vãng lai: Cứng cổ vai gáy gió lạnh',
    seasonTag: 'Kinh lạc Phong Hàn',
    minChapter: 3,
    allowAcupuncture: true,
    chiefComplaint:
      'Thưa thầy, sáng dậy gặp gió lạnh nên cổ gáy tôi cứng đơ, xoay đầu đau buốt xuống bả vai.',
    visualAppearance: 'Đầu hơi nghiêng cố định, vai nâng cao.',
    audioObservation: 'Thỉnh thoảng xuýt xoa khi cử động vai.',
    tongue: STORY_CASES[7].tongue,
    pulse: STORY_CASES[7].pulse,
    inquiries: STORY_CASES[7].inquiries,
    initialVector: { exteriorInterior: -62, coldHeat: -74, deficiencyExcess: 64 },
    elementImbalance: { moc: 62, hoa: 38, tho: 46, kim: 36, thuy: 52 },
    targetDiagnosis: { location: 'bieu', nature: 'han', state: 'thuc', primaryElement: 'moc' },
    keyHerbs: ['que-chi', 'tia-to', 'la-lot', 'sinh-khuong', 'cam-thao'],
    idealQuanHerb: 'que-chi',
    keyAcupoints: ['phong-tri', 'liet-khuyet', 'hop-coc'],
    clinicalExplanation: 'Ôn thông kinh lạc vùng gáy: Quế chi, Tía tô, Lá lốt, Sinh khương kết hợp Phong Trì, Liệt Khuyết.',
    realLifeTakeaway: 'Giữ ấm gáy và bấm Phong Trì + Liệt Khuyết giúp giải cứng cổ vai gáy nhanh.'
  }
];

const VILLAGER_NAMES = [
  { name: 'Chú Sáu Vườn', role: 'Người trồng hoa kiểng', age: 44 },
  { name: 'Cô Út Dệt', role: 'Thợ dệt lụa tơ tằm', age: 31 },
  { name: 'Bác Hai Đánh Cá', role: 'Ngư dân cửa biển', age: 55 },
  { name: 'Anh Tám Gốm', role: 'Thợ làm gốm Bát Tràng', age: 39 },
  { name: 'Bà Tư Chè', role: 'Người bán trà quán gốc đa', age: 59 }
];

export function generateProceduralCase(chapter: 1 | 2 | 3, seed: number): PatientCase {
  const pool = PROCEDURAL_TEMPLATES.filter((t) => t.minChapter <= chapter);
  const template = pool[Math.abs(seed) % pool.length];
  const persona = VILLAGER_NAMES[Math.abs(seed * 7 + 3) % VILLAGER_NAMES.length];

  return {
    id: `${template.code}-${seed}`,
    title: `${template.titlePrefix} (${persona.name})`,
    chapter,
    isProcedural: true,
    patientName: persona.name,
    patientRole: persona.role,
    age: persona.age,
    seasonTag: template.seasonTag,
    allowAcupuncture: chapter === 3 && template.allowAcupuncture,
    chiefComplaint: template.chiefComplaint,
    visualAppearance: template.visualAppearance,
    audioObservation: template.audioObservation,
    auscultationType:
      template.targetDiagnosis.nature === 'nhiet'
        ? 'wheeze-heat'
        : template.targetDiagnosis.state === 'hu'
        ? 'weak-breath'
        : 'cold-sniffle',
    tongue: template.tongue,
    pulse: template.pulse,
    inquiries: template.inquiries,
    maxInquiries: 4,
    initialVector: { ...template.initialVector },
    elementImbalance: { ...template.elementImbalance },
    targetDiagnosis: { ...template.targetDiagnosis },
    keyHerbs: [...template.keyHerbs],
    idealQuanHerb: template.idealQuanHerb,
    keyAcupoints: [...template.keyAcupoints],
    clinicalExplanation: template.clinicalExplanation,
    realLifeTakeaway: template.realLifeTakeaway,
    followUpLetters: {
      good: `Thư tay của ${persona.name}: "Thưa thầy, sau 3 ngày sắc uống đúng thang thuốc thầy cắt, chứng ${template.seasonTag.toLowerCase()} đã lui hẳn. Tôi ăn ngon ngủ yên và đã quay lại công việc thường nhật, xin đa tạ!"`,
      partial: `${persona.name} gửi lời nhắn: "Triệu chứng đã đỡ nhiều so với hôm mới tới quán, chỉ còn hơi mỏi nhẹ khi gặp gió."`,
      poor: `${persona.name} nhắn lại: "Uống hết thang thuốc nhưng chứng bệnh chưa thuyên giảm mấy, mong được thầy gia giảm kỹ lại..."`
    }
  };
}
