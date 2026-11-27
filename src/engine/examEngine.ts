import { ACUPOINTS } from '../data/acupoints';
import { STORY_CASES } from '../data/cases';
import { HERB_MAP } from '../data/herbs';
import { ExamQuestion, RankTitle, UserProgress } from '../types/tcm';

export function computeRank(progress: UserProgress): RankTitle {
  const clearedCount = Object.values(progress.completedCases).filter((c) => c.bestScore >= 70).length;
  const passedExams = progress.examPassedChapters.length;

  if (passedExams >= 3 && clearedCount >= 9) return 'Danh Y';
  if (passedExams >= 2 && clearedCount >= 6) return 'Lương Y';
  if (passedExams >= 1 && clearedCount >= 3) return 'Học Đồ';
  return 'Y Sinh';
}

export function buildExamBank(): ExamQuestion[] {
  const bank: ExamQuestion[] = [
    {
      id: 'ex-tongue-ty-hu',
      type: 'tongue',
      targetKey: 'tongue-ty-hu',
      prompt: 'Quan sát Thiệt chẩn: Chất lưỡi nhợt màu, thân lưỡi bệu và hằn dấu răng hai bên rìa chỉ chứng trạng gì?',
      subtext: 'Gợi ý: Suy xét chức năng vận hóa thủy thấp của tạng ở vùng giữa lưỡi.',
      tonguePreview: STORY_CASES[3].tongue,
      options: [
        { id: 'a', label: 'Tỳ khí hư kèm thủy thấp đình trệ', detail: 'Tỳ mất kiện vận làm lưỡi phù bệu hằn vào cung răng' },
        { id: 'b', label: 'Tâm hỏa cang thịnh bốc lên đầu lưỡi', detail: 'Thường thấy đầu lưỡi đỏ thẫm rêu vàng khô' },
        { id: 'c', label: 'Can Đởm thấp nhiệt uất kết', detail: 'Thường thấy hai rìa lưỡi đỏ rực kèm rêu vàng nhớt' },
        { id: 'd', label: 'Phong Nhiệt biểu chứng mới mắc', detail: 'Thường thấy đầu lưỡi đỏ nhẹ, rêu trắng ngả vàng mỏng' }
      ],
      correctOptionId: 'a',
      explanation: 'Lưỡi nhợt bệu có dấu răng là kinh điển của Tỳ khí hư (không vận hóa được thủy thấp làm lưỡi sưng nhẹ tì vào răng).'
    },
    {
      id: 'ex-tongue-can-hoa',
      type: 'tongue',
      targetKey: 'tongue-can-hoa',
      prompt: 'Hai bên rìa lưỡi đỏ rực kèm rêu vàng hơi nhớt là phản ánh bất thường ở cặp Tạng Phủ nào?',
      subtext: 'Đối chiếu bản đồ 5 vùng phản xạ trên mặt lưỡi.',
      tonguePreview: STORY_CASES[4].tongue,
      options: [
        { id: 'a', label: 'Phế và Đại Trường', detail: 'Phản ánh ở đầu lưỡi' },
        { id: 'b', label: 'Can và Đởm', detail: 'Phản ánh dọc hai rìa lưỡi' },
        { id: 'c', label: 'Thận và Bàng Quang', detail: 'Phản ánh ở gốc lưỡi' },
        { id: 'd', label: 'Tâm và Tiểu Trường', detail: 'Phản ánh ở chóp đầu lưỡi' }
      ],
      correctOptionId: 'b',
      explanation: 'Theo Thiệt chẩn phân vùng: Đầu lưỡi thuộc Tâm-Phế, Giữa lưỡi thuộc Tỳ-Vị, Hai rìa thuộc Can-Đởm, Gốc lưỡi thuộc Thận.'
    },
    {
      id: 'ex-pulse-phu-khan',
      type: 'pulse',
      targetKey: 'pulse-phu-khan',
      prompt: 'Đặt tay Phù thủ (ấn nhẹ) thấy mạch nổi bật căng như dây thừng xoắn, ấn sâu lại dịu hơn. Đây là mạch gì?',
      subtext: 'Lắng nghe và quan sát biên độ sóng mạch ở hai tầng lực ấn.',
      pulsePreview: STORY_CASES[0].pulse,
      options: [
        { id: 'a', label: 'Mạch Phù Khẩn — Biểu Hàn Thực chứng', detail: 'Tà phong hàn đang tranh đấu ngoài biểu' },
        { id: 'b', label: 'Mạch Trầm Nhược — Lý Hư chứng', detail: 'Chính khí suy yếu ở tạng phủ sâu' },
        { id: 'c', label: 'Mạch Hồng Sác — Lý Nhiệt thịnh', detail: 'To rộng cuồn cuộn và đập nhanh' },
        { id: 'd', label: 'Mạch Tế Nhược — Khí huyết lưỡng hư', detail: 'Nhỏ mảnh như sợi chỉ, yếu ớt' }
      ],
      correctOptionId: 'a',
      explanation: 'Phù là nổi ở ngoài (Biểu), Khẩn là căng như dây xoắn gặp lạnh (Hàn) -> Phù Khẩn chủ Biểu Hàn thực chứng.'
    },
    {
      id: 'ex-pulse-tram-te',
      type: 'pulse',
      targetKey: 'pulse-tram-te',
      prompt: 'Ấn nhẹ rất mờ, ấn sâu (Trầm thủ) mới thấy sợi mạch mảnh và yếu ở bộ Xích. Ý nghĩa lâm sàng là gì?',
      subtext: 'Bộ Xích phản ánh hạ tiêu và tạng Thận.',
      pulsePreview: STORY_CASES[9].pulse,
      options: [
        { id: 'a', label: 'Ngoại cảm Phong Nhiệt cấp', detail: 'Phải đi với mạch Phù Sác' },
        { id: 'b', label: 'Thận hư / Lý Hư chứng', detail: 'Chính khí và tinh huyết hạ tiêu bất túc' },
        { id: 'c', label: 'Can uất thực hỏa', detail: 'Mạch đi căng thẳng bật tay (Huyền Sác)' },
        { id: 'd', label: 'Thấp nhiệt đình trệ cấp tính', detail: 'Mạch đi trơn mạnh (Hoạt Sác)' }
      ],
      correctOptionId: 'b',
      explanation: 'Trầm là bệnh ở Lý, Tế Nhược là khí huyết tinh thủy suy kém -> đặc trưng của Thận hư / Lý hư.'
    },
    {
      id: 'ex-formula-phong-han',
      type: 'formula',
      targetKey: 'herb-tia-to',
      prompt: 'Bệnh nhân vừa dầm mưa lạnh, sợ rét không mồ hôi, rêu trắng mỏng. Vị Nam dược nào thích hợp làm Quân dược?',
      subtext: 'Chọn vị có tính Ôn, vị Cay, vào kinh Phế để phát tán phong hàn.',
      options: [
        { id: 'a', label: HERB_MAP['tia-to'].name, detail: 'Ôn, cay — phát tán phong hàn giải biểu' },
        { id: 'b', label: HERB_MAP['kim-ngan-hoa'].name, detail: 'Hàn, ngọt — thanh nhiệt giải độc' },
        { id: 'c', label: HERB_MAP['tam-sen'].name, detail: 'Hàn, đắng — thanh Tâm hỏa' },
        { id: 'd', label: HERB_MAP['hoai-son'].name, detail: 'Bình, ngọt — bổ Tỳ ích khí cố sáp' }
      ],
      correctOptionId: 'a',
      explanation: 'Cảm Phong Hàn cần phép Tân ôn giải biểu -> Tía tô là Quân dược kinh điển của Nam dược.'
    },
    {
      id: 'ex-formula-thai-phu',
      type: 'formula',
      targetKey: 'herb-safety-pregnancy',
      prompt: 'Một thai phụ 16 tuần bị buồn nôn, tức ngực và đau mỏi người. Vị thuốc / huyệt nào TUYỆT ĐỐI CẤM dùng?',
      subtext: 'Ghi nhớ nguyên tắc Cấm kỵ Y gia bảo vệ thai nguyên.',
      options: [
        { id: 'a', label: 'Cỏ xước, Đan sâm, Hợp Cốc, Tam Âm Giao', detail: 'Tính hoạt huyết hạ hành hoặc kích thích tử cung mạnh' },
        { id: 'b', label: 'Tía tô và huyệt Nội Quan', detail: 'Giúp an thai chỉ ẩu an toàn' },
        { id: 'c', label: 'Hoài sơn và Sinh khương lượng nhỏ', detail: 'Kiện Tỳ hòa Vị dịu nhẹ' },
        { id: 'd', label: 'Lạc tiên và huyệt Ấn Đường', detail: 'Dịu thần kinh an toàn' }
      ],
      correctOptionId: 'a',
      explanation: 'Cỏ xước, Đan sâm hoạt huyết hạ hành; huyệt Hợp Cốc + Tam Âm Giao thúc đẩy khí huyết tử cung mạnh -> cấm kỵ tuyệt đối khi mang thai.'
    },
    {
      id: 'ex-acupoint-phong-tri',
      type: 'acupoint',
      targetKey: 'pt-phong-tri',
      prompt: 'Định vị trên Đồ hình: Hãy chọn đúng huyệt PHONG TRÌ (GB20) — chủ trị đau đầu sau gáy và cứng cổ do gió lạnh.',
      subtext: 'Nhấn trực tiếp vào điểm huyệt nằm ở hai hõm dưới xương chẩm sau gáy.',
      acupointMapSide: 'back',
      acupointCandidateIds: ['phong-tri', 'bach-hoi', 'ngoai-quan', 'than-du'],
      options: ACUPOINTS.filter((a) => ['phong-tri', 'bach-hoi', 'ngoai-quan', 'than-du'].includes(a.id)).map((a) => ({
        id: a.id,
        label: `${a.name} (${a.code})`
      })),
      correctOptionId: 'phong-tri',
      explanation: 'Phong Trì (GB20) nằm ở chỗ lõm dưới xương chẩm sau gáy — cửa ngõ khu phong tán hàn cho đầu và vai gáy.'
    },
    {
      id: 'ex-acupoint-tuc-tam-ly',
      type: 'acupoint',
      targetKey: 'pt-tuc-tam-ly',
      prompt: 'Định vị trên Đồ hình: Chọn đúng huyệt TÚC TAM LÝ (ST36) — "Huyệt trường thọ" kiện Tỳ hòa Vị.',
      subtext: 'Nhấn vào huyệt nằm dưới mắt gối ngoài 3 thốn, phía trước ngoài cẳng chân.',
      acupointMapSide: 'front',
      acupointCandidateIds: ['tuc-tam-ly', 'tam-am-giao', 'thai-xung', 'trung-quan'],
      options: ACUPOINTS.filter((a) => ['tuc-tam-ly', 'tam-am-giao', 'thai-xung', 'trung-quan'].includes(a.id)).map((a) => ({
        id: a.id,
        label: `${a.name} (${a.code})`
      })),
      correctOptionId: 'tuc-tam-ly',
      explanation: 'Túc Tam Lý (ST36) là Hợp huyệt của kinh Vị, nằm dưới đầu gối ngoài 3 thốn — huyệt hàng đầu bổ Tỳ Vị và tăng chính khí.'
    },
    {
      id: 'ex-acupoint-uy-trung',
      type: 'acupoint',
      targetKey: 'pt-uy-trung',
      prompt: 'Định vị trên Đồ hình Mặt Sau: Chọn đúng huyệt ỦY TRUNG (BL40) — "Yêu bối Ủy Trung cầu" chủ trị đau thắt lưng.',
      subtext: 'Nhấn trực tiếp vào điểm huyệt nằm chính giữa nếp lằn ngang hõm khoeo sau đầu gối.',
      acupointMapSide: 'back',
      acupointCandidateIds: ['uy-trung', 'than-du', 'menh-mon', 'kien-tinh'],
      options: ACUPOINTS.filter((a) => ['uy-trung', 'than-du', 'menh-mon', 'kien-tinh'].includes(a.id)).map((a) => ({
        id: a.id,
        label: `${a.name} (${a.code})`
      })),
      correctOptionId: 'uy-trung',
      explanation: 'Ủy Trung (BL40) là Hợp huyệt kinh Bàng Quang nằm chính giữa nếp lằn hõm khoeo sau gối, huyệt đặc hiệu trị đau thắt lưng cấp/mạn.'
    },
    {
      id: 'ex-acupoint-menh-mon',
      type: 'acupoint',
      targetKey: 'pt-menh-mon',
      prompt: 'Định vị trên Đồ hình Mặt Sau: Chọn đúng huyệt MỆNH MÔN (GV4) — cửa ngõ ôn bổ Thận dương và thắt lưng.',
      subtext: 'Nhấn vào huyệt nằm trên Đốc Mạch, ngay dưới mỏm gai đốt sống thắt lưng L2 (chính giữa cột sống).',
      acupointMapSide: 'back',
      acupointCandidateIds: ['menh-mon', 'dai-chuy', 'phe-du', 'tam-du'],
      options: ACUPOINTS.filter((a) => ['menh-mon', 'dai-chuy', 'phe-du', 'tam-du'].includes(a.id)).map((a) => ({
        id: a.id,
        label: `${a.name} (${a.code})`
      })),
      correctOptionId: 'menh-mon',
      explanation: 'Mệnh Môn (GV4) nằm chính giữa cột sống thắt lưng dưới L2 (ngang với Thận Du BL23 hai bên), chủ trị Thận dương hư và lưng gối lạnh buốt.'
    }
  ];

  return bank;
}

/**
 * Selects 5 exam questions using simple spaced-repetition priority:
 * lowest mastery ratio or recently missed items surface first.
 */
export function selectExamSession(progress: UserProgress, count = 5): ExamQuestion[] {
  const bank = buildExamBank();
  const scored = bank.map((q) => {
    const m = progress.mastery[q.targetKey];
    if (!m || m.seen === 0) {
      return { q, priority: 100 }; // Unseen items get high priority
    }
    const accuracy = m.correct / m.seen;
    const recentMissBoost = m.lastMissedAt ? 35 : 0;
    return { q, priority: (1 - accuracy) * 80 + recentMissBoost };
  });

  scored.sort((a, b) => b.priority - a.priority);
  return scored.slice(0, count).map((item) => item.q);
}
