import { PatientCase } from '../types/tcm';
import { STORY_CASES } from './cases';

/**
 * Đêm Mưa Gõ Cửa: someone knocks on a rainy night. Half of these must be sent to hospital at once
 * (the lesson is recognising red flags); the other half are severe but within YHCT first aid.
 */
const story = (id: string) => STORY_CASES.find((c) => c.id === id)!;
const heat = story('c1-phong-nhiet');
const cold = story('c1-phong-han');
const fire = story('c2-tam-hoa-vuong');

const letters = (name: string) => ({
  good: `${name} nhắn lại: "Đêm ấy nhờ thầy tỉnh táo mà nhà tôi qua cơn nguy. Cả nhà xin khắc tấm hoành phi tạ ơn Tuệ Tâm Đường."`,
  partial: `${name} nhắn lại: "Đã qua cơn nguy nhưng người còn mệt, mong thầy dặn thêm cách giữ gìn."`,
  poor: `${name} nhắn lại: "Đêm ấy chậm trễ mất một quãng, may mà hàng xóm kịp đưa đi viện..."`
});

export const CRISIS_CASES: PatientCase[] = [
  {
    id: 'crisis-trung-phong',
    title: 'Đêm Mưa Gõ Cửa: Ông lão rơi đũa giữa bữa cơm',
    chapter: 3,
    isProcedural: true,
    crisis: {
      referral: true,
      redFlags: ['Méo miệng một bên', 'Yếu tay chân nửa người', 'Nói ngọng đột ngột'],
      lesson:
        'Méo miệng, yếu nửa người, nói khó xuất hiện đột ngột là dấu hiệu đột quỵ (Trúng phong). Mỗi phút trôi qua não mất thêm hàng triệu tế bào: phải gọi 115 và đưa tới bệnh viện có khả năng chụp và tiêu sợi huyết ngay, không châm chích, không cạo gió, không cho uống thuốc.',
      plaque: 'Minh Sát Thu Hào'
    },
    patientName: 'Cụ Tư Thợ Mộc',
    patientRole: 'Thợ mộc về hưu xóm Đình',
    age: 71,
    seasonTag: 'Trúng phong (đột quỵ)',
    allowAcupuncture: false,
    chiefComplaint:
      'Con trai cụ đội mưa cõng cha tới: "Thầy ơi, đang ăn cơm tối thì bố tôi tự dưng rơi đũa, miệng méo xệch sang một bên, gọi thì nói ngọng líu lưỡi. Mới cách đây chừng nửa canh giờ thôi ạ!"',
    visualAppearance: 'Khóe miệng bên phải xệ xuống, nhân trung lệch, tay phải buông thõng không nắm lại được.',
    audioObservation: 'Tiếng nói lắp bắp, nuốt nước bọt bị sặc, thở khò khè.',
    auscultationType: 'weak-breath',
    tongue: {
      ...fire.tongue,
      summary: 'Lưỡi đỏ, khi bảo thè lưỡi ra thì lệch hẳn sang một bên — dấu hiệu Can phong nội động, cũng là dấu thần kinh khu trú.'
    },
    pulse: {
      ...fire.pulse,
      name: 'Mạch Huyền Hoạt Sác (Căng, trơn, nhanh)',
      summary: 'Mạch căng như dây đàn, đập mạnh và nhanh: Can dương hóa phong xông lên.'
    },
    inquiries: [
      { id: 'q1', topic: 'Khởi phát', question: 'Bệnh đến từ từ hay đột ngột?', answer: 'Đột ngột lắm thầy ạ, mới nãy còn kể chuyện vui, thoắt cái đã thế này.', clueTag: 'Khởi phát đột ngột — dấu hiệu báo động' },
      { id: 'q2', topic: 'Tay chân', question: 'Cụ thử giơ cả hai tay lên xem?', answer: 'Tay trái giơ được, tay phải nhấc lên lại rơi xuống ngay.', clueTag: 'Yếu nửa người — dấu hiệu báo động' },
      { id: 'q3', topic: 'Lời nói', question: 'Cụ nói lại câu "trời hôm nay mưa to" được không?', answer: '"Chời... nay... ưa..." — cụ nói không tròn chữ.', clueTag: 'Rối loạn ngôn ngữ — dấu hiệu báo động' },
      { id: 'q4', topic: 'Tiền sử', question: 'Cụ có bệnh huyết áp không?', answer: 'Huyết áp cao lâu năm, thuốc thì lúc uống lúc quên.', clueTag: 'Can dương thượng cang lâu ngày' },
      { id: 'q5', topic: 'Đầu', question: 'Trước đó cụ có kêu đau đầu chóng mặt?', answer: 'Mấy hôm nay hay kêu váng đầu, mặt đỏ bừng.', clueTag: 'Can phong nội động' }
    ],
    maxInquiries: 4,
    initialVector: { ...fire.initialVector },
    elementImbalance: { ...fire.elementImbalance },
    targetDiagnosis: { location: 'ly', nature: 'nhiet', state: 'thuc', primaryElement: 'moc' },
    keyHerbs: [],
    idealQuanHerb: '',
    keyAcupoints: [],
    clinicalExplanation:
      'Theo YHCT đây là Trúng phong do Can dương hóa phong; theo y học hiện đại là đột quỵ não. Đây là cấp cứu: chẩn đoán đúng nhưng kê thuốc tại quán là sai, vì "giờ vàng" điều trị chỉ tính bằng giờ.',
    realLifeTakeaway:
      'Nhớ quy tắc "Méo – Yếu – Nói – Gọi": méo miệng, yếu tay chân, nói khó thì gọi 115 ngay, ghi lại giờ khởi phát, không cạo gió, không chích máu đầu ngón tay.',
    followUpLetters: letters('Con trai cụ Tư')
  },
  {
    id: 'crisis-sot-li-bi',
    title: 'Đêm Mưa Gõ Cửa: Cháu bé sốt cao li bì',
    chapter: 3,
    isProcedural: true,
    crisis: {
      referral: true,
      redFlags: ['Li bì gọi khó tỉnh', 'Cứng gáy', 'Nốt tím không mất khi ấn'],
      lesson:
        'Trẻ sốt cao kèm li bì, cứng gáy, nôn vọt và ban xuất huyết tím không mất khi ấn là dấu hiệu viêm màng não hoặc nhiễm khuẩn huyết. Phải đưa đi bệnh viện ngay; chậm vài giờ có thể nguy đến tính mạng.',
      plaque: 'Tâm Như Minh Kính'
    },
    patientName: 'Bé Na',
    patientRole: 'Con gái nhà đánh cá bến sông',
    age: 6,
    seasonTag: 'Ôn bệnh nhập Doanh huyết',
    allowAcupuncture: false,
    chiefComplaint:
      'Người mẹ ướt sũng ôm con vào: "Thầy ơi, con bé sốt hai hôm nay, chiều nay nôn vọt mấy lần, giờ cứ lả đi gọi mãi mới mở mắt!"',
    visualAppearance: 'Mặt đỏ bừng, mắt lờ đờ sợ ánh đèn, trên cẳng chân lấm tấm nốt tím đỏ.',
    audioObservation: 'Rên khe khẽ, thở nhanh nông, không khóc thành tiếng.',
    auscultationType: 'wheeze-heat',
    tongue: { ...heat.tongue, summary: 'Lưỡi đỏ thẫm khô, rêu vàng — nhiệt đã vào phần Doanh huyết.' },
    pulse: { ...heat.pulse, name: 'Mạch Tế Sác (Nhỏ, rất nhanh)', summary: 'Mạch nhỏ mà nhanh dồn dập: nhiệt độc thương âm.' },
    inquiries: [
      { id: 'q1', topic: 'Tỉnh táo', question: 'Gọi tên con bé có đáp lại không?', answer: 'Phải lay mạnh mới hé mắt, rồi lại lịm đi ngay.', clueTag: 'Li bì — dấu hiệu báo động' },
      { id: 'q2', topic: 'Cổ gáy', question: 'Cúi cằm con bé xuống ngực được không?', answer: 'Cháu kêu đau, cổ cứng đơ không cúi được.', clueTag: 'Cứng gáy — dấu hiệu báo động' },
      { id: 'q3', topic: 'Da', question: 'Ấn ly thủy tinh lên nốt tím thì nốt có mờ đi không?', answer: 'Không mờ thầy ạ, vẫn tím nguyên.', clueTag: 'Ban xuất huyết — dấu hiệu báo động' },
      { id: 'q4', topic: 'Nôn', question: 'Nôn thế nào?', answer: 'Nôn vọt ra xa, không ăn gì cũng nôn.', clueTag: 'Nôn vọt — tăng áp lực nội sọ' },
      { id: 'q5', topic: 'Khát', question: 'Cháu có đòi uống nước không?', answer: 'Môi khô nứt nhưng lả quá không uống nổi.', clueTag: 'Nhiệt thịnh thương tân' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: 80, coldHeat: 92, deficiencyExcess: 70 },
    elementImbalance: { ...heat.elementImbalance },
    targetDiagnosis: { location: 'ly', nature: 'nhiet', state: 'thuc', primaryElement: 'hoa' },
    keyHerbs: [],
    idealQuanHerb: '',
    keyAcupoints: [],
    clinicalExplanation:
      'Ôn bệnh nhiệt nhập Doanh huyết (sốt cao, ban, thần chí mơ hồ) tương ứng với viêm màng não / nhiễm khuẩn huyết. Ngay cả danh y xưa cũng coi đây là chứng hiểm; ngày nay việc đúng là chuyển viện tức thì.',
    realLifeTakeaway:
      'Trẻ sốt mà li bì, cứng cổ, nôn vọt, hoặc có nốt tím không mất khi ấn ly thủy tinh lên: đưa ngay tới bệnh viện, không chờ hạ sốt tại nhà.',
    followUpLetters: letters('Mẹ bé Na')
  },
  {
    id: 'crisis-trung-thu',
    title: 'Đêm Mưa Gõ Cửa: Thợ gặt say nắng ngất ngoài đồng',
    chapter: 3,
    isProcedural: true,
    crisis: {
      referral: false,
      redFlags: [],
      lesson:
        'Đây là Trúng thử còn nhẹ: người còn tỉnh, nói rõ, uống được nước, vẫn ra mồ hôi. Đưa vào chỗ mát, nới áo, lau mát và cho uống từng ngụm là đủ. Chỉ cần chuyển viện nếu lú lẫn, co giật, da nóng khô không còn mồ hôi.',
      plaque: 'Diệu Thủ Hồi Xuân'
    },
    patientName: 'Anh Sáu Gặt',
    patientRole: 'Thợ gặt thuê mùa hè',
    age: 34,
    seasonTag: 'Trúng thử (say nắng)',
    allowAcupuncture: false,
    chiefComplaint:
      'Bạn gặt dìu vào: "Thầy ơi, nó gặt từ trưa tới chiều không nghỉ, vừa nãy choáng váng khuỵu xuống bờ ruộng, giờ đã tỉnh lại nhưng mệt lả, khát khô cổ."',
    visualAppearance: 'Mặt đỏ, mồ hôi vã ướt áo, mắt vẫn nhìn theo đèn, trả lời đúng tên tuổi.',
    audioObservation: 'Thở hơi nhanh, giọng mệt nhưng rõ ràng.',
    auscultationType: 'wheeze-heat',
    tongue: heat.tongue,
    pulse: heat.pulse,
    inquiries: [
      { id: 'q1', topic: 'Tỉnh táo', question: 'Anh có biết mình đang ở đâu không?', answer: 'Ở quán thuốc thầy chứ đâu, tôi tỉnh rồi, chỉ mệt rã.', clueTag: 'Thần chí tỉnh — chưa có dấu báo động' },
      { id: 'q2', topic: 'Mồ hôi', question: 'Người còn ra mồ hôi không?', answer: 'Vẫn vã mồ hôi ướt hết lưng áo.', clueTag: 'Còn ra mồ hôi — chưa sốc nhiệt' },
      { id: 'q3', topic: 'Khát & Uống', question: 'Uống được nước không?', answer: 'Khát lắm, uống được, thèm nước mát.', clueTag: 'Khát thích mát — Nhiệt chứng' },
      { id: 'q4', topic: 'Đầu', question: 'Đầu thấy thế nào?', answer: 'Nhức đầu, hoa mắt, nóng bừng mặt.', clueTag: 'Thử nhiệt xông lên' },
      { id: 'q5', topic: 'Tiểu tiện', question: 'Nước tiểu ra sao?', answer: 'Ít và vàng sẫm.', clueTag: 'Nhiệt thương tân dịch' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: -80, coldHeat: 84, deficiencyExcess: 68 },
    elementImbalance: { ...heat.elementImbalance },
    targetDiagnosis: { location: 'bieu', nature: 'nhiet', state: 'thuc', primaryElement: 'kim' },
    keyHerbs: ['bac-ha', 'kim-ngan-hoa', 'cuc-hoa', 'cat-can', 'cam-thao'],
    idealQuanHerb: 'bac-ha',
    keyAcupoints: [],
    clinicalExplanation:
      'Trúng thử thể nhẹ: thử nhiệt còn ở phần khí, người tỉnh, còn mồ hôi. Phép trị thanh thử giải nhiệt, sinh tân: Bạc hà, Kim ngân, Cúc hoa thanh nhiệt; Cát căn sinh tân giải cơ; Cam thảo điều hòa.',
    realLifeTakeaway:
      'Say nắng: đưa vào bóng mát, nới quần áo, lau mát, uống từng ngụm nước có chút muối. Lú lẫn, co giật hay da nóng khô không mồ hôi là phải gọi 115.',
    followUpLetters: letters('Anh Sáu Gặt')
  },
  {
    id: 'crisis-cam-han-nang',
    title: 'Đêm Mưa Gõ Cửa: Người đánh cá rét run sau đêm bão',
    chapter: 3,
    isProcedural: true,
    crisis: {
      referral: false,
      redFlags: [],
      lesson:
        'Rét run dữ dội nhưng tỉnh táo, thở êm, không đau ngực, không tím tái: đây là Phong Hàn biểu thực nặng, YHCT xử trí được bằng tân ôn giải biểu và ủ ấm. Chuyển viện khi lơ mơ, thở gấp, môi tím hoặc thân nhiệt hạ sâu không ấm lại.',
      plaque: 'Nhân Tâm Nhân Thuật'
    },
    patientName: 'Chú Bảy Lưới',
    patientRole: 'Người đánh cá đầm Bình Giang',
    age: 52,
    seasonTag: 'Phong Hàn biểu thực nặng',
    allowAcupuncture: false,
    chiefComplaint:
      'Chú run lập cập bước vào: "Thầy ơi, thuyền lật giữa đầm, tôi ngâm nước lạnh gần một canh giờ mới bơi được vào bờ. Giờ rét thấu xương, đau mình mẩy, không ra được mồ hôi."',
    visualAppearance: 'Da tái, nổi da gà, môi hơi nhợt nhưng không tím, tự đi lại được.',
    audioObservation: 'Răng va lập cập, hắt hơi, giọng nghẹt mũi nhưng nói mạch lạc.',
    auscultationType: 'cold-sniffle',
    tongue: cold.tongue,
    pulse: cold.pulse,
    inquiries: [
      { id: 'q1', topic: 'Hàn - Nhiệt', question: 'Rét nhiều hay sốt nhiều?', answer: 'Rét là chính, quấn chăn vẫn run.', clueTag: 'Ố hàn trọng — Biểu Hàn' },
      { id: 'q2', topic: 'Mồ hôi', question: 'Có ra mồ hôi không?', answer: 'Khô rang, không một giọt.', clueTag: 'Vô hãn — Biểu Thực' },
      { id: 'q3', topic: 'Hô hấp', question: 'Có khó thở hay đau ngực không?', answer: 'Thở bình thường, không đau ngực.', clueTag: 'Không có dấu báo động hô hấp' },
      { id: 'q4', topic: 'Tỉnh táo', question: 'Chú có thấy buồn ngủ díp mắt, lơ mơ không?', answer: 'Không, tôi tỉnh lắm, chỉ rét thôi.', clueTag: 'Thần chí tỉnh — chưa hạ thân nhiệt nặng' },
      { id: 'q5', topic: 'Đau', question: 'Đau ở đâu?', answer: 'Đau mỏi khắp mình, cứng gáy.', clueTag: 'Hàn bó kinh Thái Dương' }
    ],
    maxInquiries: 4,
    initialVector: { exteriorInterior: -84, coldHeat: -84, deficiencyExcess: 64 },
    elementImbalance: { ...cold.elementImbalance },
    targetDiagnosis: { location: 'bieu', nature: 'han', state: 'thuc', primaryElement: 'kim' },
    keyHerbs: ['tia-to', 'kinh-gioi', 'sinh-khuong', 'cam-thao'],
    idealQuanHerb: 'tia-to',
    keyAcupoints: [],
    clinicalExplanation:
      'Phong Hàn biểu thực nặng sau ngâm lạnh: tân ôn giải biểu với Tía tô làm Quân, Kinh giới làm Thần, Sinh khương làm Tá, Cam thảo làm Sứ; ủ ấm và cho ăn cháo nóng.',
    realLifeTakeaway:
      'Sau khi ngâm nước lạnh: thay đồ khô, ủ ấm từ từ, uống nước gừng ấm. Lơ mơ, thở chậm, môi tím là phải đưa đi viện.',
    followUpLetters: letters('Chú Bảy Lưới')
  }
];
