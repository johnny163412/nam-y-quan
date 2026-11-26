import { ACUPOINT_MAP, TY_NGO_WATCHES } from '../data/acupoints';
import { detectActiveFormulas } from '../data/formulas';
import { HERB_MAP } from '../data/herbs';
import {
  ContraindicationAlert,
  DecoctionChoice,
  DiagnosisChoice,
  DosingAdvice,
  EightPrinciplesVector,
  ElementKey,
  ElementMap,
  EvaluationGrade,
  EvaluationResult,
  FireType,
  PaoZhiMethod,
  PatientCase,
  PrescriptionSlots,
  RoleSlot,
  TreatmentPreview,
  TyNgoWatch
} from '../types/tcm';

export const ROLE_WEIGHTS: Record<RoleSlot, number> = {
  quan: 1.25,
  than: 0.95,
  ta: 0.75,
  su: 0.55
};

export const ELEMENT_LABELS: Record<ElementKey, string> = {
  moc: 'Mộc (Can - Đởm)',
  hoa: 'Hỏa (Tâm - Tiểu Trường)',
  tho: 'Thổ (Tỳ - Vị)',
  kim: 'Kim (Phế - Đại Trường)',
  thuy: 'Thủy (Thận - Bàng Quang)'
};

export const ELEMENT_SHORT: Record<ElementKey, string> = {
  moc: 'Mộc',
  hoa: 'Hỏa',
  tho: 'Thổ',
  kim: 'Kim',
  thuy: 'Thủy'
};

export const ELEMENT_CYCLE_ORDER: ElementKey[] = ['moc', 'hoa', 'tho', 'kim', 'thuy'];

export function emptySlots(): PrescriptionSlots {
  return { quan: null, than: null, ta: null, su: null };
}

/**
 * Assigns a herb to a role slot without ever duplicating the same herb across pans.
 * If the herb is already in another pan, it is moved cleanly to the target pan.
 */
export function assignHerbToSlot(
  slots: PrescriptionSlots,
  role: RoleSlot,
  herbId: string | null
): PrescriptionSlots {
  const next: PrescriptionSlots = { ...slots };
  if (herbId) {
    (Object.keys(next) as RoleSlot[]).forEach((key) => {
      if (next[key] === herbId) {
        next[key] = null;
      }
    });
  }
  next[role] = herbId;
  return next;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function checkContraindications(
  patientCase: PatientCase,
  slots: PrescriptionSlots,
  selectedAcupoints: string[]
): ContraindicationAlert[] {
  const alerts: ContraindicationAlert[] = [];
  const isColdPatient = patientCase.initialVector.coldHeat <= -30;
  const isHeatPatient = patientCase.initialVector.coldHeat >= 45;
  const isDeficientPatient = patientCase.initialVector.deficiencyExcess <= -30;

  (Object.keys(slots) as RoleSlot[]).forEach((role) => {
    const herbId = slots[role];
    if (!herbId) return;
    const herb = HERB_MAP[herbId];
    if (!herb) return;

    if (patientCase.isPregnant && herb.contraindications.pregnancyLock) {
      alerts.push({
        severity: 'critical',
        sourceId: herb.id,
        sourceName: herb.name,
        message: `CẤM KỴ THAI KỲ: ${herb.name} hoạt huyết hạ hành mạnh, tuyệt đối không kê cho thai phụ!`
      });
    } else if (
      patientCase.isPregnant &&
      herb.contraindications.pregnancyCautionAsQuan &&
      role === 'quan'
    ) {
      alerts.push({
        severity: 'critical',
        sourceId: herb.id,
        sourceName: herb.name,
        message: `CẤM KỴ THAI KỲ: Không dùng ${herb.name} ở ngôi Quân dược (liều chủ lực) cho phụ nữ mang thai.`
      });
    }

    if (isColdPatient && herb.contraindications.avoidColdDeficiency && (role === 'quan' || role === 'than')) {
      const severe = role === 'quan' || (role === 'than' && isDeficientPatient);
      alerts.push({
        severity: severe ? 'critical' : 'caution',
        sourceId: herb.id,
        sourceName: herb.name,
        message: `${herb.name} tính ${herb.nature.toLowerCase()} dễ làm tổn thương dương khí ở bệnh nhân đang thiên Hàn${isDeficientPatient ? ' Hư' : ''}.`
      });
    }

    if (isHeatPatient && herb.contraindications.avoidHeatExcess && (role === 'quan' || role === 'than')) {
      const severe = role === 'quan';
      alerts.push({
        severity: severe ? 'critical' : 'caution',
        sourceId: herb.id,
        sourceName: herb.name,
        message: `${herb.name} tính ${herb.nature.toLowerCase()} dễ trợ Hỏa tăng nhiệt khi bệnh nhân đang thiên Nhiệt thịnh.`
      });
    }
  });

  selectedAcupoints.forEach((id) => {
    const pt = ACUPOINT_MAP[id];
    if (!pt) return;
    if (patientCase.isPregnant && pt.pregnancyForbidden) {
      alerts.push({
        severity: 'critical',
        sourceId: pt.id,
        sourceName: `${pt.name} (${pt.code})`,
        message: `CẤM KỴ THAI KỲ: Huyệt ${pt.name} (${pt.code}) thúc đẩy khí huyết tử cung mạnh, tuyệt đối cấm châm/bấm cho thai phụ!`
      });
    }
  });

  return alerts;
}

export function computeTreatmentPreview(
  patientCase: PatientCase,
  slots: PrescriptionSlots,
  selectedAcupoints: string[]
): TreatmentPreview {
  let ext = patientCase.initialVector.exteriorInterior;
  let ch = patientCase.initialVector.coldHeat;
  let de = patientCase.initialVector.deficiencyExcess;

  const elements: ElementMap = { ...patientCase.elementImbalance };
  const activeHarmonizer = slots.su === 'cam-thao';

  (Object.keys(slots) as RoleSlot[]).forEach((role) => {
    const herbId = slots[role];
    if (!herbId) return;
    const herb = HERB_MAP[herbId];
    if (!herb) return;

    const w = ROLE_WEIGHTS[role];
    ext += herb.vectorEffect.exteriorInterior * w;
    ch += herb.vectorEffect.coldHeat * w;
    de += herb.vectorEffect.deficiencyExcess * w;

    (Object.keys(herb.elementEffect) as ElementKey[]).forEach((el) => {
      const delta = herb.elementEffect[el] ?? 0;
      elements[el] = clamp(elements[el] + delta * w * 0.65, 5, 100);
    });
  });

  selectedAcupoints.forEach((ptId) => {
    const pt = ACUPOINT_MAP[ptId];
    if (!pt) return;
    ext += pt.vectorEffect.exteriorInterior * 0.45;
    ch += pt.vectorEffect.coldHeat * 0.45;
    de += pt.vectorEffect.deficiencyExcess * 0.45;

    (Object.keys(pt.elementEffect) as ElementKey[]).forEach((el) => {
      const delta = pt.elementEffect[el] ?? 0;
      elements[el] = clamp(elements[el] + delta * 0.5, 5, 100);
    });
  });

  // Harmonizer dampens slight overshoots toward equilibrium (Âm bình Dương bí)
  if (activeHarmonizer) {
    ext *= 0.88;
    ch *= 0.88;
    de *= 0.88;
  }

  const resultingVector: EightPrinciplesVector = {
    exteriorInterior: Math.round(clamp(ext, -100, 100)),
    coldHeat: Math.round(clamp(ch, -100, 100)),
    deficiencyExcess: Math.round(clamp(de, -100, 100))
  };

  const residualDistance =
    Math.abs(resultingVector.exteriorInterior) +
    Math.abs(resultingVector.coldHeat) +
    Math.abs(resultingVector.deficiencyExcess);

  const balanceScore = Math.round(clamp(100 - residualDistance / 2.2, 0, 100));
  const alerts = checkContraindications(patientCase, slots, selectedAcupoints);

  return {
    resultingVector,
    resultingElements: {
      moc: Math.round(elements.moc),
      hoa: Math.round(elements.hoa),
      tho: Math.round(elements.tho),
      kim: Math.round(elements.kim),
      thuy: Math.round(elements.thuy)
    },
    balanceScore,
    alerts,
    activeHarmonizer
  };
}

export function getRecommendedDecoction(patientCase: PatientCase): {
  fire: FireType;
  dosing: DosingAdvice;
  rationale: string;
} {
  const { location, nature, state } = patientCase.targetDiagnosis;
  if (location === 'bieu') {
    const dosing: DosingAdvice = nature === 'han' ? 'nong-dap-chan' : 'am-thoang-gio';
    return {
      fire: 'vu-hoa',
      dosing,
      rationale:
        nature === 'han'
          ? 'Thuốc giải biểu chứa tinh dầu cần sắc Vũ hỏa (lửa lớn sôi nhanh 10–15 phút) kẻo bay mất khí vị; uống nóng rồi đắp chăn mỏng cho râm ran mồ hôi.'
          : 'Thuốc tân lương giải biểu sắc Vũ hỏa nhanh để giữ thanh khí; uống ấm vừa nơi thoáng gió nhẹ, tránh ủ kín gây tăng nhiệt.'
    };
  }
  if (state === 'hu') {
    return {
      fire: 'van-hoa',
      dosing: 'am-duong-tang',
      rationale:
        'Thuốc bổ Tạng Phủ cần sắc Văn hỏa (lửa nhỏ riu riu 35–45 phút) để chiết sâu tinh chất, uống ấm chia 2 lần sau bữa ăn để dưỡng tỳ vị.'
    };
  }
  return {
    fire: 'van-vu',
    dosing: nature === 'han' ? 'nong-dap-chan' : 'am-thoang-gio',
    rationale:
      'Chứng Lý Thực nên dùng Văn Vũ hỏa (đun sôi bùng rồi hạ lửa vừa 20–25 phút) để vừa giữ khí hành trệ vừa chiết đủ dược lực.'
  };
}

export function getIdealPaoZhi(herbId: string): { method: PaoZhiMethod; reason: string } {
  switch (herbId) {
    case 'cam-thao':
    case 'ky-tu':
      return {
        method: 'chich-mat',
        reason: 'Chích mật ong giúp tăng vị ngọt ấm bổ Tỳ Phế và điều hòa thang thuốc.'
      };
    case 'hoai-son':
    case 'tran-bi':
    case 'dinh-lang':
    case 'cat-can':
    case 'co-xuoc':
      return {
        method: 'sao-vang',
        reason: 'Sao vàng hạ thổ nhẹ giúp rễ củ thơm ấm, kiện Tỳ dễ tiêu và dẫn thuốc êm.'
      };
    case 'sinh-khuong':
    case 'que-chi':
    case 'dan-sam':
      return {
        method: 'gia-dap',
        reason: 'Giã dập vừa phải giúp tinh dầu và hoạt chất chiết nhanh khi sắc.'
      };
    default:
      return {
        method: 'sinh-dung',
        reason: 'Dùng tươi hoặc phơi âm can (Sinh dụng) giữ trọn thanh khí và tinh dầu giải biểu/thanh nhiệt.'
      };
  }
}

export function evaluateCaseSubmission(
  patientCase: PatientCase,
  userDiagnosis: DiagnosisChoice,
  slots: PrescriptionSlots,
  selectedAcupoints: string[],
  decoctionChoice?: DecoctionChoice
): EvaluationResult {
  const preview = computeTreatmentPreview(patientCase, slots, selectedAcupoints);
  const matchedFormulas = detectActiveFormulas(slots);
  const formulaBonus = Math.min(
    6,
    matchedFormulas.reduce((sum, f) => sum + f.bonusPoints, 0)
  );

  // 1. Diagnosis score (0..30)
  let diagnosisScore = 0;
  if (userDiagnosis.location === patientCase.targetDiagnosis.location) diagnosisScore += 8;
  if (userDiagnosis.nature === patientCase.targetDiagnosis.nature) diagnosisScore += 10;
  if (userDiagnosis.state === patientCase.targetDiagnosis.state) diagnosisScore += 7;
  if (userDiagnosis.primaryElement === patientCase.targetDiagnosis.primaryElement) diagnosisScore += 5;

  // 2. Treatment score (0..70): 40 pts from vector balance + 30 pts from clinical match
  const residual =
    Math.abs(preview.resultingVector.exteriorInterior) +
    Math.abs(preview.resultingVector.coldHeat) +
    Math.abs(preview.resultingVector.deficiencyExcess);
  const initialDist =
    Math.abs(patientCase.initialVector.exteriorInterior) +
    Math.abs(patientCase.initialVector.coldHeat) +
    Math.abs(patientCase.initialVector.deficiencyExcess);

  const improvementRatio = initialDist > 0 ? clamp((initialDist - residual) / initialDist, 0, 1) : 1;
  const closenessScore = clamp(1 - residual / 140, 0, 1);
  const vectorPoints = Math.round((improvementRatio * 0.55 + closenessScore * 0.45) * 40);

  const assignedHerbIds = (Object.values(slots).filter(Boolean) as string[]);
  const matchedHerbs = assignedHerbIds.filter((id) => patientCase.keyHerbs.includes(id));
  const herbRatio =
    patientCase.keyHerbs.length > 0
      ? Math.min(1, matchedHerbs.length / Math.min(3, patientCase.keyHerbs.length))
      : 1;

  let rolePoints = herbRatio * 18;
  if (slots.quan && patientCase.keyHerbs.includes(slots.quan)) {
    rolePoints += slots.quan === patientCase.idealQuanHerb ? 6 : 3;
  }

  let acupointPoints = 6;
  if (patientCase.allowAcupuncture && patientCase.keyAcupoints.length > 0) {
    const matchedPts = selectedAcupoints.filter((id) => patientCase.keyAcupoints.includes(id));
    acupointPoints = Math.round(
      Math.min(1, matchedPts.length / Math.min(2, patientCase.keyAcupoints.length)) * 6
    );
  }

  const treatmentScore = Math.round(clamp(vectorPoints + rolePoints + acupointPoints + formulaBonus, 0, 70));

  // 3. Decoction fire, dosing, Pao Zhi & Moxa evaluation (gentle bonus, never penalizes default Sinh Dung)
  let decoctionScore = 0;
  let decoctionFeedback = '';
  let craftBonusScore = 0;
  const craftBonusNotes: string[] = [];

  if (decoctionChoice) {
    const rec = getRecommendedDecoction(patientCase);
    if (decoctionChoice.fire === rec.fire) {
      decoctionScore += 3;
    } else if (patientCase.targetDiagnosis.location === 'bieu' && decoctionChoice.fire === 'van-hoa') {
      decoctionScore -= 3;
    }
    if (decoctionChoice.dosing === rec.dosing) {
      decoctionScore += 3;
    } else if (patientCase.targetDiagnosis.nature === 'nhiet' && decoctionChoice.dosing === 'nong-dap-chan') {
      decoctionScore -= 2;
    }
    decoctionFeedback =
      decoctionScore >= 5
        ? `Canh lửa và dặn dò uống thuốc chuẩn xác! ${rec.rationale}`
        : `Lưu ý khi sắc & dùng thuốc: ${rec.rationale}`;

    if (decoctionChoice.paoZhi) {
      let matchedCraft = 0;
      (Object.keys(slots) as RoleSlot[]).forEach((role) => {
        const herbId = slots[role];
        const chosenMethod = decoctionChoice.paoZhi?.[role];
        if (!herbId || !chosenMethod || chosenMethod === 'sinh-dung') return;
        const herb = HERB_MAP[herbId];
        const ideal = getIdealPaoZhi(herbId);
        if (chosenMethod === ideal.method) {
          matchedCraft += 1;
          craftBonusNotes.push(`${herb?.name ?? herbId}: ${ideal.reason}`);
        }
      });
      if (matchedCraft > 0) {
        craftBonusScore += Math.min(3, matchedCraft);
      }
    }

    if (
      decoctionChoice.moxaEnabled &&
      patientCase.allowAcupuncture &&
      selectedAcupoints.length > 0 &&
      patientCase.targetDiagnosis.nature === 'han'
    ) {
      craftBonusScore += 2;
      craftBonusNotes.push('Hơ điếu Ngải cứu ấm kinh mạch rất hợp với chứng Hàn / Hư Hàn.');
    }

    if (decoctionChoice.fanMatched) {
      craftBonusScore += 2;
      craftBonusNotes.push('Quạt nan giữ chuẩn độ lửa hỏa hầu giúp chiết trọn khí vị.');
    }

    const usedFreshCount = (decoctionChoice.usedFreshHerbs ?? []).filter((id) =>
      assignedHerbIds.includes(id)
    ).length;
    if (usedFreshCount > 0) {
      craftBonusScore += Math.min(2, usedFreshCount);
      craftBonusNotes.push('Dùng lá thuốc tươi hái tại Hậu Viên vườn quán (+dược lực tinh khiết).');
    }

    if (decoctionChoice.hasBatTrangPot) {
      craftBonusScore += 1;
      craftBonusNotes.push('Sắc bằng Siêu Gốm Bát Tràng Cổ (bảo vật mở khóa từ Y Đức).');
    }
  }

  // 4. Safety penalties
  const criticalCount = preview.alerts.filter((a) => a.severity === 'critical').length;
  const cautionCount = preview.alerts.filter((a) => a.severity === 'caution').length;
  const safetyPenalty = criticalCount * 35 + cautionCount * 12;

  let rawTotal = clamp(
    diagnosisScore + treatmentScore + decoctionScore + craftBonusScore - safetyPenalty,
    0,
    100
  );
  if (criticalCount > 0) {
    rawTotal = Math.min(rawTotal, 55);
  }

  const totalScore = Math.round(rawTotal);

  const followUpLetter =
    patientCase.followUpLetters
      ? totalScore >= 80 && criticalCount === 0
        ? patientCase.followUpLetters.good
        : totalScore >= 65 && criticalCount === 0
        ? patientCase.followUpLetters.partial
        : patientCase.followUpLetters.poor
      : undefined;

  let grade: EvaluationGrade = 'Sai Lệch Y Lý';
  if (totalScore >= 88 && criticalCount === 0) {
    grade = 'Thần Y Diệu Thủ';
  } else if (totalScore >= 70 && criticalCount === 0) {
    grade = 'Đối Chứng Khỏi Bệnh';
  } else if (totalScore >= 50) {
    grade = 'Thuyên Giảm Chậm';
  }

  const herbNotes: string[] = (Object.keys(slots) as RoleSlot[])
    .filter((role) => Boolean(slots[role]))
    .map((role) => {
      const herb = HERB_MAP[slots[role]!];
      if (!herb) return '';
      const roleLabel =
        role === 'quan' ? 'Quân' : role === 'than' ? 'Thần' : role === 'ta' ? 'Tá' : 'Sứ';
      const isKey = patientCase.keyHerbs.includes(herb.id);
      return `${roleLabel} (${herb.name} — ${herb.nature}): ${
        isKey ? 'Đúng phép trị trọng tâm.' : 'Có thể hỗ trợ phụ nhưng chưa thật sát bệnh cơ.'
      }`;
    })
    .filter(Boolean);

  const acupointNotes: string[] = selectedAcupoints.map((id) => {
    const pt = ACUPOINT_MAP[id];
    if (!pt) return '';
    if (patientCase.isPregnant && pt.pregnancyForbidden) {
      return `${pt.name} (${pt.code}): VI PHẠM CẤM KỴ THAI KỲ!`;
    }
    const isKey = patientCase.keyAcupoints.includes(pt.id);
    return `${pt.name} (${pt.code}): ${
      isKey ? 'Trúng huyệt chủ lực khai thông kinh lạc.' : 'Huyệt hỗ trợ ngoại vi.'
    }`;
  });

  const summaryFeedback =
    criticalCount > 0
      ? 'Đơn trị liệu phạm điều Cấm kỵ Y gia nghiêm trọng! Cần điều chỉnh ngay trước khi dùng cho người bệnh.'
      : totalScore >= 88
      ? 'Biện chứng chính xác, phối ngũ Quân - Thần - Tá - Sứ chặt chẽ, âm dương quân bình!'
      : totalScore >= 70
      ? 'Hướng trị liệu đúng đắn, bệnh tình thuyên giảm rõ. Có thể tinh chỉnh thêm vị Quân hoặc Bát Cương để đạt tuyệt đối.'
      : 'Chẩn đoán hoặc dược tính chưa thuận chiều bệnh cơ. Hãy đối chiếu lại Thiệt chẩn, Mạch chẩn và La bàn Bát Cương.';

  return {
    totalScore,
    diagnosisScore,
    treatmentScore,
    safetyPenalty,
    grade,
    alerts: preview.alerts,
    resultingVector: preview.resultingVector,
    herbNotes,
    acupointNotes,
    matchedFormulas,
    decoctionScore,
    decoctionFeedback,
    craftBonusScore,
    craftBonusNotes,
    followUpLetter,
    summaryFeedback,
    passed: totalScore >= 70 && criticalCount === 0
  };
}

export interface FiveElementsSimulation {
  levels: ElementMap;
  effects: {
    relation: 'Tương Sinh' | 'Tương Khắc' | 'Tương Thừa (Khắc quá)' | 'Tương Vũ (Phản khắc)' | 'Sinh bất túc';
    from: ElementKey;
    to: ElementKey;
    description: string;
  }[];
}

/**
 * Interactive Five Elements Sandbox ("Sa Bàn Ngũ Hành"):
 * Perturbing one element propagates Physiological (Sinh/Khắc) or Pathological (Thừa/Vũ) effects.
 */
export function simulateFiveElements(
  activeElement: ElementKey,
  level: number
): FiveElementsSimulation {
  const clamped = clamp(level, 10, 100);
  const idx = ELEMENT_CYCLE_ORDER.indexOf(activeElement);
  const child = ELEMENT_CYCLE_ORDER[(idx + 1) % 5]; // Ta sinh (Con)
  const grandChild = ELEMENT_CYCLE_ORDER[(idx + 2) % 5]; // Ta khắc (Bị ta khắc)
  const controller = ELEMENT_CYCLE_ORDER[(idx + 3) % 5]; // Khắc ta
  const mother = ELEMENT_CYCLE_ORDER[(idx + 4) % 5]; // Sinh ta (Mẹ)

  const levels: ElementMap = {
    moc: 50,
    hoa: 50,
    tho: 50,
    kim: 50,
    thuy: 50
  };
  levels[activeElement] = clamped;

  const delta = clamped - 50;
  const effects: FiveElementsSimulation['effects'] = [];

  if (delta >= 20) {
    // Quá vượng -> Sinh con quá mức, Tương Thừa người bị khắc, Phản Vũ kẻ khắc mình
    levels[child] = clamp(Math.round(50 + delta * 0.45), 10, 100);
    levels[grandChild] = clamp(Math.round(50 - delta * 0.65), 10, 100);
    levels[controller] = clamp(Math.round(50 - delta * 0.35), 10, 100);
    levels[mother] = clamp(Math.round(50 + delta * 0.15), 10, 100);

    effects.push({
      relation: 'Tương Thừa (Khắc quá)',
      from: activeElement,
      to: grandChild,
      description: `${ELEMENT_LABELS[activeElement]} thái quá ức chế mạnh khiến ${ELEMENT_LABELS[grandChild]} suy yếu (tương thừa).`
    });
    effects.push({
      relation: 'Tương Vũ (Phản khắc)',
      from: activeElement,
      to: controller,
      description: `${ELEMENT_SHORT[activeElement]} quá mạnh nên phản khắc ngược lại ${ELEMENT_SHORT[controller]} (tương vũ).`
    });
    effects.push({
      relation: 'Tương Sinh',
      from: activeElement,
      to: child,
      description: `Mẹ vượng truyền nhiệt/khí sang con làm ${ELEMENT_SHORT[child]} tăng theo.`
    });
  } else if (delta <= -20) {
    // Quá suy -> Mẹ không nuôi nổi con, Bị kẻ khắc lấn át (Tương Thừa), Không khắc nổi grandChild
    levels[child] = clamp(Math.round(50 + delta * 0.5), 10, 100);
    levels[grandChild] = clamp(Math.round(50 - delta * 0.3), 10, 100);
    levels[controller] = clamp(Math.round(50 - delta * 0.25), 10, 100);
    levels[mother] = clamp(Math.round(50 + delta * 0.3), 10, 100);

    effects.push({
      relation: 'Sinh bất túc',
      from: activeElement,
      to: child,
      description: `${ELEMENT_LABELS[activeElement]} suy yếu nên không nuôi dưỡng đủ cho ${ELEMENT_LABELS[child]} ("Mẹ bệnh lụy con").`
    });
    effects.push({
      relation: 'Tương Thừa (Khắc quá)',
      from: controller,
      to: activeElement,
      description: `${ELEMENT_SHORT[activeElement]} yếu khiến ${ELEMENT_SHORT[controller]} thừa cơ lấn át mạnh hơn bình thường.`
    });
  } else {
    effects.push({
      relation: 'Tương Sinh',
      from: activeElement,
      to: child,
      description: `Ngũ hành điều hòa: ${ELEMENT_SHORT[activeElement]} nuôi dưỡng ${ELEMENT_SHORT[child]} và được ${ELEMENT_SHORT[controller]} chế ước vừa đủ.`
    });
    effects.push({
      relation: 'Tương Khắc',
      from: activeElement,
      to: grandChild,
      description: `${ELEMENT_SHORT[activeElement]} giữ thế cân bằng sinh lý với ${ELEMENT_SHORT[grandChild]}, không sinh bệnh biến.`
    });
  }

  return { levels, effects };
}

export function getTyNgoWatch(hour: number): TyNgoWatch {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 23 || h < 1) return TY_NGO_WATCHES[0];
  const found = TY_NGO_WATCHES.find((w) => w.startHour !== 23 && h >= w.startHour && h < w.endHour);
  return found ?? TY_NGO_WATCHES[0];
}
