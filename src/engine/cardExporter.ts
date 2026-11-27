import { ConstitutionProfile, EvaluationResult, PatientCase } from '../types/tcm';

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 4
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function drawParchmentCardBase(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  kicker: string,
  mainTitle: string
) {
  // Warm antique rice-paper gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#FAF2DF');
  bg.addColorStop(0.5, '#F3E5C7');
  bg.addColorStop(1, '#E7D4AE');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle paper fiber speckles
  for (let i = 0; i < 420; i++) {
    const x = (i * 197) % w;
    const y = (i * 313) % h;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(112, 76, 36, 0.05)' : 'rgba(255, 252, 240, 0.08)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Outer carved dark wood border + inner gold/cinnabar frame
  ctx.strokeStyle = '#4B2E16';
  ctx.lineWidth = 14;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  ctx.strokeStyle = '#B88438';
  ctx.lineWidth = 4;
  ctx.strokeRect(42, 42, w - 84, h - 84);

  ctx.strokeStyle = 'rgba(158, 38, 28, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, w - 104, h - 104);

  // Corner ornamental squares
  const corners = [
    [42, 42],
    [w - 66, 42],
    [42, h - 66],
    [w - 66, h - 66]
  ];
  ctx.fillStyle = '#9E261C';
  corners.forEach(([cx, cy]) => {
    ctx.fillRect(cx, cy, 24, 24);
    ctx.strokeStyle = '#E7B96A';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx + 4, cy + 4, 16, 16);
  });

  // Top header plaque
  ctx.fillStyle = '#7C4D21';
  ctx.font = '700 24px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText('NAM Y QUÁN — TUỆ TÂM ĐƯỜNG', w / 2, 114);

  ctx.fillStyle = '#9E261C';
  ctx.font = '700 22px Georgia, "Times New Roman", serif';
  ctx.fillText(kicker.toUpperCase(), w / 2, 152);

  // Decorative divider
  ctx.strokeStyle = '#B88438';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(160, 174);
  ctx.lineTo(w - 160, 174);
  ctx.stroke();

  // Main title
  ctx.fillStyle = '#2A180B';
  ctx.font = '700 50px Georgia, "Times New Roman", serif';
  const titleLines = wrapLines(ctx, mainTitle, w - 180, 2);
  titleLines.forEach((line, idx) => {
    ctx.fillText(line, w / 2, 238 + idx * 58);
  });

  // Cinnabar Seal Stamp bottom-right
  ctx.save();
  ctx.translate(w - 170, h - 170);
  ctx.rotate(-0.07);
  ctx.fillStyle = '#A1231B';
  ctx.fillRect(-58, -58, 116, 116);
  ctx.strokeStyle = '#F7DFB0';
  ctx.lineWidth = 4;
  ctx.strokeRect(-50, -50, 100, 100);
  ctx.fillStyle = '#FDF4E3';
  ctx.font = '700 28px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText('惠心', 0, -8);
  ctx.fillText('堂印', 0, 30);
  ctx.restore();

  // Footer URL
  ctx.textAlign = 'left';
  ctx.fillStyle = '#6B4E34';
  ctx.font = '600 20px Georgia, "Times New Roman", serif';
  ctx.fillText('Nam dược trị Nam nhân · Chơi thử miễn phí:', 92, h - 122);
  ctx.fillStyle = '#23574C';
  ctx.font = '700 22px Georgia, "Times New Roman", serif';
  ctx.fillText('johnny163412.github.io/nam-y-quan', 92, h - 90);
}

function triggerCanvasDownload(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export function downloadOutcomeCertificatePng(
  patientCase: PatientCase,
  result: EvaluationResult
): void {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  drawParchmentCardBase(
    ctx,
    1080,
    1350,
    'Sắc Phong Luận Trị Y Án',
    `${patientCase.patientName} (${patientCase.age}t)`
  );

  // Score medallion box
  ctx.fillStyle = result.passed ? 'rgba(35, 87, 76, 0.12)' : 'rgba(158, 38, 28, 0.12)';
  ctx.fillRect(110, 308, 860, 180);
  ctx.strokeStyle = result.passed ? '#23574C' : '#9E261C';
  ctx.lineWidth = 3;
  ctx.strokeRect(110, 308, 860, 180);

  ctx.textAlign = 'center';
  ctx.fillStyle = result.passed ? '#1E5245' : '#9E261C';
  ctx.font = '700 84px Georgia, "Times New Roman", serif';
  ctx.fillText(`${result.totalScore}/100`, 340, 412);

  ctx.fillStyle = '#4A2E17';
  ctx.font = '700 32px Georgia, "Times New Roman", serif';
  ctx.fillText(`Xếp bậc: ${result.grade}`, 710, 378);

  ctx.font = '600 24px Georgia, "Times New Roman", serif';
  ctx.fillText(
    `Biện chứng: ${result.diagnosisScore}/30  ·  Phối ngũ: ${result.treatmentScore}/70`,
    710,
    430
  );

  // Case Title & Feedback
  ctx.textAlign = 'left';
  ctx.fillStyle = '#7C4D21';
  ctx.font = '700 24px Georgia, "Times New Roman", serif';
  ctx.fillText(`Bệnh án: ${patientCase.title}`, 110, 545);

  ctx.fillStyle = '#2B1A0D';
  ctx.font = '600 26px Georgia, "Times New Roman", serif';
  const sumLines = wrapLines(ctx, result.summaryFeedback, 860, 4);
  sumLines.forEach((line, i) => ctx.fillText(line, 110, 595 + i * 38));

  let y = 765;
  if (result.matchedFormulas.length > 0) {
    ctx.fillStyle = '#8F221B';
    ctx.font = '700 26px Georgia, "Times New Roman", serif';
    ctx.fillText(
      `Cổ Phương lĩnh hội: ${result.matchedFormulas.map((f) => f.name).join(', ')}`,
      110,
      y
    );
    y += 52;
  }

  // Follow-up letter box
  if (result.followUpLetter) {
    ctx.fillStyle = 'rgba(255, 250, 238, 0.78)';
    ctx.fillRect(110, y, 860, 210);
    ctx.strokeStyle = '#9C6B30';
    ctx.lineWidth = 2;
    ctx.strokeRect(110, y, 860, 210);

    ctx.fillStyle = '#7C4D21';
    ctx.font = '700 22px Georgia, "Times New Roman", serif';
    ctx.fillText('THƯ HỒI ÂM TỪ GIA CHỦ SAU 3 NGÀY:', 138, y + 40);

    ctx.fillStyle = '#332012';
    ctx.font = 'italic 24px Georgia, "Times New Roman", serif';
    const letterLines = wrapLines(ctx, `“${result.followUpLetter}”`, 804, 4);
    letterLines.forEach((line, i) => ctx.fillText(line, 138, y + 84 + i * 34));
  }

  triggerCanvasDownload(canvas, `nam-y-quan-bang-khen-${patientCase.id}.png`);
}

export function downloadConstitutionCardPng(
  primary: ConstitutionProfile,
  secondary: ConstitutionProfile | null,
  herbNames: string[],
  acupointNames: string[]
): void {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  drawParchmentCardBase(
    ctx,
    1080,
    1350,
    'Sắc Phong Thể Chất Dưỡng Sinh',
    primary.name
  );

  ctx.textAlign = 'center';
  ctx.fillStyle = '#6B261C';
  ctx.font = 'italic 28px Georgia, "Times New Roman", serif';
  const tagText = secondary
    ? `${primary.tagline} (Kiêm nhẹ ${secondary.name})`
    : primary.tagline;
  const tagLines = wrapLines(ctx, tagText, 860, 2);
  tagLines.forEach((l, i) => ctx.fillText(l, 540, 326 + i * 38));

  // Signs Box
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 250, 238, 0.78)';
  ctx.fillRect(105, 405, 870, 220);
  ctx.strokeStyle = '#9C6B30';
  ctx.lineWidth = 2;
  ctx.strokeRect(105, 405, 870, 220);

  ctx.fillStyle = '#7C4D21';
  ctx.font = '700 23px Georgia, "Times New Roman", serif';
  ctx.fillText('BIỂU HIỆN & THIỆT CHẨN ĐẶC TRƯNG', 135, 448);

  ctx.fillStyle = '#2B1A0D';
  ctx.font = '600 24px Georgia, "Times New Roman", serif';
  const signsLines = wrapLines(ctx, primary.signs.join(' · '), 810, 3);
  signsLines.forEach((l, i) => ctx.fillText(l, 135, 490 + i * 34));

  ctx.fillStyle = '#23574C';
  ctx.font = '700 23px Georgia, "Times New Roman", serif';
  ctx.fillText(`Soi lưỡi: ${primary.tongueSummary}`, 135, 600);

  // Herbs & Acupoints
  ctx.fillStyle = '#2B1A0D';
  ctx.font = '700 26px Georgia, "Times New Roman", serif';
  ctx.fillText('Nam Dược & Trà Dưỡng Sinh Khuyên Dùng:', 105, 682);
  ctx.fillStyle = '#7C2017';
  ctx.font = '700 28px Georgia, "Times New Roman", serif';
  ctx.fillText(herbNames.join('  ·  '), 105, 724);

  ctx.fillStyle = '#2B1A0D';
  ctx.font = '700 26px Georgia, "Times New Roman", serif';
  ctx.fillText('Huyệt Đạo Xoa Bóp Trước Khi Ngủ:', 105, 788);
  ctx.fillStyle = '#23574C';
  ctx.font = '700 28px Georgia, "Times New Roman", serif';
  ctx.fillText(acupointNames.join('  ·  '), 105, 830);

  // Tý Ngọ & Lifestyle
  ctx.fillStyle = 'rgba(35, 87, 76, 0.1)';
  ctx.fillRect(105, 878, 870, 210);
  ctx.strokeStyle = '#23574C';
  ctx.lineWidth = 2;
  ctx.strokeRect(105, 878, 870, 210);

  ctx.fillStyle = '#1D4D42';
  ctx.font = '700 24px Georgia, "Times New Roman", serif';
  ctx.fillText(`Khung giờ vàng Tý Ngọ: ${primary.bestTyNgoBranch}`, 135, 922);

  ctx.fillStyle = '#2B1A0D';
  ctx.font = '600 24px Georgia, "Times New Roman", serif';
  const tipLines = wrapLines(ctx, primary.dietLifestyleTip, 810, 4);
  tipLines.forEach((l, i) => ctx.fillText(l, 135, 964 + i * 34));

  triggerCanvasDownload(canvas, `nam-y-quan-the-chat-${primary.id}.png`);
}
