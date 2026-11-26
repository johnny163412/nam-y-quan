import { BodyConstitutionId, ConstitutionProfile, ConstitutionQuestion } from '../types/tcm';

export const CONSTITUTIONS: ConstitutionProfile[] = [
  {
    id: 'binh-hoa',
    name: 'Thể Bình Hòa (Âm Dương Quân Bình)',
    tagline: 'Khí huyết sung mãn, tạng phủ điều hòa — nền tảng sức khỏe lý tưởng.',
    signs: ['Sắc mặt tươi nhuận, ngủ sâu giấc', 'Ăn ngon tiêu hóa ổn định', 'Ít ốm vặt khi thời tiết giao mùa'],
    tongueSummary: 'Chất lưỡi hồng tươi, rêu trắng mỏng ẩm vừa phải.',
    recommendedHerbIds: ['hoai-son', 'cam-thao', 'ky-tu'],
    recommendedAcupointIds: ['tuc-tam-ly', 'noi-quan'],
    dietLifestyleTip: 'Duy trì ăn uống điều độ theo mùa, ngủ trước 23h (giờ Tý) và xoa nhẹ Túc Tam Lý giữ chính khí.',
    bestTyNgoBranch: 'Giờ Thìn (07:00–09:00): Ăn sáng ấm để dưỡng Vị khí.'
  },
  {
    id: 'khi-hu',
    name: 'Thể Khí Hư (Chính Khí Suy Kém)',
    tagline: 'Dễ mệt hụt hơi, làm việc nhẹ đã vã mồ hôi, hay cảm vặt.',
    signs: ['Nói nhỏ hơi ngắn, dễ đuối sức', 'Tự vã mồ hôi ban ngày khi gắng sức nhẹ', 'Lưỡi nhợt bệu có vết hằn răng'],
    tongueSummary: 'Lưỡi nhợt hơi bệu, rìa lưỡi hằn dấu răng, rêu trắng mỏng.',
    recommendedHerbIds: ['hoai-son', 'dinh-lang', 'cam-thao'],
    recommendedAcupointIds: ['tuc-tam-ly', 'khi-hai'],
    dietLifestyleTip: 'Ăn cháo Hoài sơn nấu mềm ấm, tránh nhịn ăn sáng và tránh đồ sống lạnh hay lao lực quá sức.',
    bestTyNgoBranch: 'Giờ Tỵ (09:00–11:00): Tỳ vận hóa mạnh nhất, thích hợp bồi bổ.'
  },
  {
    id: 'duong-hu',
    name: 'Thể Dương Hư (Nội Hàn Sợ Lạnh)',
    tagline: 'Tay chân lạnh ngắt, sợ gió lạnh, bụng dễ sôi khi ăn đồ mát.',
    signs: ['Bốn mùa bàn tay bàn chân lạnh', 'Uống nước mát hay đau bụng đi ngoài', 'Tiểu đêm nhiều, nước tiểu trong'],
    tongueSummary: 'Chất lưỡi nhợt ẩm ướt, rêu trắng trơn.',
    recommendedHerbIds: ['sinh-khuong', 'ngai-cuu', 'la-lot', 'que-chi'],
    recommendedAcupointIds: ['than-du', 'khi-hai', 'tuc-tam-ly'],
    dietLifestyleTip: 'Uống trà gừng ấm buổi sáng, ngâm chân nước lá lốt ấm buổi tối và giữ ấm vùng thắt lưng, cổ chân.',
    bestTyNgoBranch: 'Giờ Dậu (17:00–19:00): Ngâm chân ấm dưỡng Thận dương.'
  },
  {
    id: 'am-hu',
    name: 'Thể Âm Hư (Tân Dịch Thiếu, Nội Nhiệt)',
    tagline: 'Người gầy khô nóng, lòng bàn tay chân ấm bứt rứt, khô họng khô mắt.',
    signs: ['Hay nóng bừng về chiều tối', 'Miệng khô thích uống từng ngụm mát, ngủ hay mộng', 'Mắt khô mỏi, đại tiện hơi táo'],
    tongueSummary: 'Chất lưỡi đỏ thon gầy, ít rêu hoặc rêu mỏng khô.',
    recommendedHerbIds: ['ky-tu', 'cuc-hoa', 'cat-can', 'lac-tien'],
    recommendedAcupointIds: ['tam-am-giao', 'than-mon'],
    dietLifestyleTip: 'Ngủ sớm trước 23h dưỡng Can Thận âm, hãm trà Kỷ tử + Cúc hoa dịu mắt và hạn chế đồ chiên nướng cay nóng.',
    bestTyNgoBranch: 'Giờ Sửu (01:00–03:00): Ngủ say để Can tàng huyết, sinh âm dịch.'
  },
  {
    id: 'dam-thap',
    name: 'Thể Đàm Thấp (Trì Trệ Nặng Nề)',
    tagline: 'Cơ thể nặng nề buồn ngủ, da nhờn, dễ đầy bụng sau ăn béo ngọt.',
    signs: ['Ngủ dậy người nặng trĩu kém sảng khoái', 'Miệng dính nhớt, hay có đờm ở họng', 'Vùng bụng mềm trướng sau bữa ăn'],
    tongueSummary: 'Thân lưỡi to bệu, rêu trắng dày nhớt hoặc hơi nhầy.',
    recommendedHerbIds: ['tran-bi', 'sinh-khuong', 'hoai-son'],
    recommendedAcupointIds: ['trung-quan', 'tuc-tam-ly'],
    dietLifestyleTip: 'Giảm đồ ngọt béo, trà sữa lạnh; dùng vỏ quýt khô (Trần bì) hãm gừng ấm sau bữa ăn và vận động ra mồ hôi nhẹ.',
    bestTyNgoBranch: 'Giờ Mão (05:00–07:00): Vận động nhẹ và uống nước ấm thông lợi.'
  },
  {
    id: 'thap-nhiet',
    name: 'Thể Thấp Nhiệt (Nóng Ẩm Tích Tụ)',
    tagline: 'Mặt hay bóng dầu nổi mụn, miệng đắng hôi, nước tiểu vàng đậm.',
    signs: ['Miệng đắng hoặc dính khó chịu buổi sáng', 'Dễ nổi mụn nhọt, nhiệt miệng', 'Tiểu vàng sậm, đại tiện hơi dính hoặc nóng'],
    tongueSummary: 'Chất lưỡi đỏ, rêu vàng dày nhớt ở giữa và gốc lưỡi.',
    recommendedHerbIds: ['nhan-tran', 'kim-ngan-hoa', 'cuc-hoa'],
    recommendedAcupointIds: ['thai-xung', 'noi-quan'],
    dietLifestyleTip: 'Tránh rượu bia đồ cay; hãm trà Nhân trần + Kim ngân hoa thanh nhẹ, tăng rau xanh mát.',
    bestTyNgoBranch: 'Giờ Mùi (13:00–15:00): Uống đủ nước ấm hỗ trợ Tiểu Trường thanh lọc.'
  },
  {
    id: 'huyet-u',
    name: 'Thể Huyết Ứ (Kinh Mạch Kém Thông)',
    tagline: 'Hay đau nhói cố định, sắc mặt hoặc môi hơi sậm, da dễ bầm tím.',
    signs: ['Hay đau mỏi cổ vai gáy hoặc tê bì chân tay', 'Sắc môi hoặc dưới lưỡi hơi tím sậm', 'Hay quên, quầng mắt sậm màu'],
    tongueSummary: 'Chất lưỡi hơi tím hoặc có điểm ứ huyết sẫm màu.',
    recommendedHerbIds: ['dan-sam', 'co-xuoc', 'dinh-lang'],
    recommendedAcupointIds: ['hop-coc', 'thai-xung', 'phong-tri'],
    dietLifestyleTip: 'Vận động kéo giãn vai gáy mỗi ngày, tránh ngồi bất động quá lâu; lưu ý phụ nữ mang thai tránh các vị hoạt huyết.',
    bestTyNgoBranch: 'Giờ Tuất (19:00–21:00): Xoa bóp nhẹ thư giãn kinh lạc.'
  },
  {
    id: 'khi-uat',
    name: 'Thể Khí Uất (Can Khí Không Thư Thái)',
    tagline: 'Dễ lo âu căng thẳng, hay thở dài, ngực sườn căng tức khi áp lực.',
    signs: ['Ngực hoặc hai bên mạng sườn hay tức ngầm', 'Hay thở dài, dễ cáu gắt hoặc chùng xuống', 'Khó vào giấc khi suy nghĩ nhiều'],
    tongueSummary: 'Hai rìa lưỡi hơi đỏ, rêu trắng mỏng.',
    recommendedHerbIds: ['lac-tien', 'cuc-hoa', 'bac-ha', 'tran-bi'],
    recommendedAcupointIds: ['thai-xung', 'noi-quan', 'an-duong'],
    dietLifestyleTip: 'Hít thở sâu chậm, hãm trà Lạc tiên + Cúc hoa + Bạc hà buổi chiều tối và miết huyệt Thái Xung giải uất.',
    bestTyNgoBranch: 'Giờ Hợi (21:00–23:00): Thư giãn tâm trí, tránh nghĩ việc căng thẳng.'
  },
  {
    id: 'dac-bam',
    name: 'Thể Đặc Bẩm (Cơ Địa Nhạy Cảm Dị Ứng)',
    tagline: 'Dễ hắt hơi dị ứng thời tiết, nổi mề đay hoặc nhạy cảm mùi/thức ăn.',
    signs: ['Trở trời gió lạnh hay hắt hơi sổ mũi ngay', 'Da dễ mẩn ngứa, dị ứng theo mùa', 'Cần dưỡng Vệ khí Phế - Tỳ bền vững'],
    tongueSummary: 'Chất lưỡi hồng nhạt, có thể nhạy cảm thay đổi theo mùa.',
    recommendedHerbIds: ['tia-to', 'kinh-gioi', 'kim-ngan-hoa', 'hoai-son'],
    recommendedAcupointIds: ['liet-khuyet', 'tuc-tam-ly', 'phong-tri'],
    dietLifestyleTip: 'Giữ ấm vùng cổ gáy khi chuyển mùa, tránh thức ăn dễ gây dị ứng và củng cố Phế - Tỳ bằng Hoài sơn, Tía tô.',
    bestTyNgoBranch: 'Giờ Dần (03:00–05:00): Giữ ấm kín gió để bảo vệ Phế khí.'
  }
];

export const CONSTITUTION_QUESTIONS: ConstitutionQuestion[] = [
  {
    id: 'cq-temp',
    topic: 'Cảm nhận Hàn — Nhiệt',
    prompt: 'Bàn tay, bàn chân và cảm giác nóng lạnh thường ngày của bạn ra sao?',
    options: [
      { id: 'a', label: 'Ấm áp vừa phải, không sợ nóng quá cũng không sợ lạnh quá', weights: { 'binh-hoa': 3 } },
      { id: 'b', label: 'Tay chân thường lạnh ngắt, sợ gió lạnh điều hòa, thích đồ ấm', weights: { 'duong-hu': 4, 'khi-hu': 2 } },
      { id: 'c', label: 'Lòng bàn tay chân hay nóng bứt rứt về chiều tối, khô họng', weights: { 'am-hu': 4, 'thap-nhiet': 2 } },
      { id: 'd', label: 'Người hay nóng hầm hập, dễ đổ mồ hôi dầu và nổi mụn', weights: { 'thap-nhiet': 4 } }
    ]
  },
  {
    id: 'cq-energy',
    topic: 'Khí lực & Mồ hôi',
    prompt: 'Sức bền khi làm việc và tình trạng ra mồ hôi của bạn thế nào?',
    options: [
      { id: 'a', label: 'Khỏe khoắn bền bỉ, ít mệt mỏi vặt', weights: { 'binh-hoa': 3 } },
      { id: 'b', label: 'Nhanh hụt hơi mệt mỏi, leo cầu thang nhẹ đã rịn mồ hôi', weights: { 'khi-hu': 4, 'duong-hu': 1 } },
      { id: 'c', label: 'Ngủ dậy người nặng nề ì ạch, hay buồn ngủ sau bữa ăn', weights: { 'dam-thap': 4, 'khi-hu': 1 } },
      { id: 'd', label: 'Sức bình thường nhưng hay đau nhức cứng mỏi vai gáy cố định', weights: { 'huyet-u': 4 } }
    ]
  },
  {
    id: 'cq-digestion',
    topic: 'Tỳ Vị & Tiêu hóa',
    prompt: 'Bụng dạ phản ứng thế nào sau bữa ăn hoặc khi uống đồ mát?',
    options: [
      { id: 'a', label: 'Ăn ngon, đại tiện đều đặn thành khuôn', weights: { 'binh-hoa': 3 } },
      { id: 'b', label: 'Ăn đồ lạnh/mát dễ sôi bụng, phân nát hoặc lỏng', weights: { 'duong-hu': 3, 'khi-hu': 3 } },
      { id: 'c', label: 'Hay đầy chướng khó tiêu, miệng dính nhớt, nhiều đờm', weights: { 'dam-thap': 4 } },
      { id: 'd', label: 'Sáng dậy miệng đắng, hay nhiệt miệng hoặc hơi táo', weights: { 'thap-nhiet': 3, 'am-hu': 2 } }
    ]
  },
  {
    id: 'cq-emotion',
    topic: 'Tình chí & Giấc ngủ',
    prompt: 'Tâm trạng khi gặp áp lực và giấc ngủ ban đêm của bạn?',
    options: [
      { id: 'a', label: 'Tâm trạng ổn định, đặt lưng là ngủ yên tới sáng', weights: { 'binh-hoa': 3 } },
      { id: 'b', label: 'Hay lo nghĩ, tức nhẹ mạng sườn, hay thở dài và khó vào giấc', weights: { 'khi-uat': 5 } },
      { id: 'c', label: 'Ngủ nông hay mơ giật mình, sáng dậy khô mắt khô miệng', weights: { 'am-hu': 3, 'huyet-u': 2 } },
      { id: 'd', label: 'Ngủ nhiều vẫn thấy uể oải nặng đầu', weights: { 'dam-thap': 3, 'khi-hu': 2 } }
    ]
  },
  {
    id: 'cq-tongue',
    topic: 'Tự soi Gương Thiệt chẩn',
    prompt: 'Khi soi gương buổi sáng, lưỡi bạn gần giống mô tả nào nhất?',
    options: [
      { id: 'a', label: 'Hồng tươi vừa phải, rêu trắng mỏng ẩm nhẹ', weights: { 'binh-hoa': 3 } },
      { id: 'b', label: 'Nhợt màu, hơi bệu hoặc có dấu hằn răng hai bên rìa', weights: { 'khi-hu': 3, 'duong-hu': 3 } },
      { id: 'c', label: 'Thân lưỡi đỏ thon ít rêu, hoặc rêu vàng dày nhớt', weights: { 'am-hu': 3, 'thap-nhiet': 3 } },
      { id: 'd', label: 'Sắc lưỡi hơi sẫm tím hoặc hai rìa lưỡi đỏ nổi rõ', weights: { 'huyet-u': 4, 'khi-uat': 3 } }
    ]
  },
  {
    id: 'cq-season',
    topic: 'Phản ứng Giao mùa & Dị ứng',
    prompt: 'Khi trời trở gió lạnh hoặc phấn hoa/bụi thay đổi?',
    options: [
      { id: 'a', label: 'Thích nghi tốt, ít khi hắt hơi mẩn ngứa', weights: { 'binh-hoa': 2 } },
      { id: 'b', label: 'Lập tức hắt hơi, chảy mũi hoặc nổi mề đay dị ứng', weights: { 'dac-bam': 5 } },
      { id: 'c', label: 'Hay đau nhức xương khớp hoặc lạnh buốt lưng gối', weights: { 'duong-hu': 3, 'huyet-u': 2 } },
      { id: 'd', label: 'Dễ khô họng, rát mũi, bốc hỏa', weights: { 'am-hu': 3, 'thap-nhiet': 2 } }
    ]
  },
  {
    id: 'cq-skin',
    topic: 'Sắc mặt & Da dẻ',
    prompt: 'Quan sát sắc mặt, môi và da dẻ thường ngày?',
    options: [
      { id: 'a', label: 'Sắc mặt hồng nhuận tự nhiên', weights: { 'binh-hoa': 2 } },
      { id: 'b', label: 'Sắc mặt hơi nhợt vàng thiếu tươi, môi nhạt', weights: { 'khi-hu': 3, 'duong-hu': 2 } },
      { id: 'c', label: 'Da bóng dầu dễ mụn, hoặc khô gò má ửng đỏ chiều tối', weights: { 'thap-nhiet': 3, 'am-hu': 3 } },
      { id: 'd', label: 'Sắc môi hơi sậm, quầng mắt sẫm hoặc da dễ bầm tím', weights: { 'huyet-u': 4 } }
    ]
  },
  {
    id: 'cq-habit',
    topic: 'Thói quen Dưỡng sinh mong muốn',
    prompt: 'Triệu chứng nào làm bạn phiền lòng và muốn cải thiện nhất?',
    options: [
      { id: 'a', label: 'Giữ gìn sức khỏe cân bằng lâu dài', weights: { 'binh-hoa': 2 } },
      { id: 'b', label: 'Bớt lạnh tay chân, bớt mệt mỏi, tăng đề kháng không ốm vặt', weights: { 'khi-hu': 2, 'duong-hu': 2, 'dac-bam': 2 } },
      { id: 'c', label: 'Thanh nhẹ người, giảm đầy bụng, giảm mụn nhiệt miệng', weights: { 'dam-thap': 2, 'thap-nhiet': 2 } },
      { id: 'd', label: 'Giảm căng thẳng mất ngủ, thông đau mỏi cổ vai gáy', weights: { 'khi-uat': 3, 'huyet-u': 2, 'am-hu': 2 } }
    ]
  }
];

export function evaluateConstitution(
  answers: Record<string, string>
): {
  primary: ConstitutionProfile;
  secondary: ConstitutionProfile | null;
  scores: Record<BodyConstitutionId, number>;
} {
  const scores: Record<BodyConstitutionId, number> = {
    'binh-hoa': 0,
    'khi-hu': 0,
    'duong-hu': 0,
    'am-hu': 0,
    'dam-thap': 0,
    'thap-nhiet': 0,
    'huyet-u': 0,
    'khi-uat': 0,
    'dac-bam': 0
  };

  CONSTITUTION_QUESTIONS.forEach((q) => {
    const pickedId = answers[q.id];
    const opt = q.options.find((o) => o.id === pickedId);
    if (!opt) return;
    (Object.keys(opt.weights) as BodyConstitutionId[]).forEach((cid) => {
      scores[cid] += opt.weights[cid] ?? 0;
    });
  });

  const sorted = [...CONSTITUTIONS].sort((a, b) => scores[b.id] - scores[a.id]);
  const primary = sorted[0];
  const candidateSecond = sorted[1];
  const secondary =
    candidateSecond &&
    scores[candidateSecond.id] >= 4 &&
    candidateSecond.id !== 'binh-hoa' &&
    primary.id !== 'binh-hoa'
      ? candidateSecond
      : null;

  return { primary, secondary, scores };
}
