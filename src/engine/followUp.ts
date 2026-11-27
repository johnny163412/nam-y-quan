import { PROCEDURAL_TEMPLATES, STORY_CASES, caseFromTemplate } from '../data/cases';
import { EightPrinciplesVector, EvaluationResult, PatientCase, PendingFollowUp } from '../types/tcm';

export const FOLLOW_UP_DELAY_DAYS = 2;
const FLIP_THRESHOLD = 25;

type Axis = keyof EightPrinciplesVector;
const AXES: Axis[] = ['exteriorInterior', 'coldHeat', 'deficiencyExcess'];

/** Axes whose sign the treatment reversed by a clinically meaningful margin (quá tay). */
function flippedAxes(before: EightPrinciplesVector, after: EightPrinciplesVector): Axis[] {
  return AXES.filter((a) => Math.sign(before[a]) !== Math.sign(after[a]) && Math.abs(after[a]) >= FLIP_THRESHOLD);
}

/** Decide whether a story-case patient returns, and in what state. null = khỏi hẳn / no visit. */
export function planFollowUp(
  patientCase: PatientCase,
  result: EvaluationResult,
  currentDay: number
): PendingFollowUp | null {
  // Only first visits of story cases come back; procedural and tái khám visits don't chain.
  if (patientCase.isProcedural || patientCase.followUpOf) return null;
  const unsafe = result.alerts.some((a) => a.severity === 'critical');
  if (result.totalScore >= 80 && !unsafe) return null;

  const base = {
    caseId: patientCase.id,
    patientName: patientCase.patientName,
    // the day counter advances by 1 when this case is stamped
    dueDay: currentDay + 1 + FOLLOW_UP_DELAY_DAYS
  };
  // Unsafe prescription: the family stopped the decoction, so the original pattern persists untouched.
  if (unsafe) return { ...base, kind: 'chua-lui', residual: { ...patientCase.initialVector } };

  const flipped = flippedAxes(patientCase.initialVector, result.resultingVector);
  if (flipped.length > 0) {
    const want = { ...patientCase.initialVector };
    flipped.forEach((a) => (want[a] = result.resultingVector[a]));
    const score = (v: EightPrinciplesVector) =>
      AXES.reduce((n, a) => n + (Math.sign(v[a]) === Math.sign(want[a]) ? (flipped.includes(a) ? 10 : 1) : 0), 0);
    const best = [...PROCEDURAL_TEMPLATES].sort((x, y) => score(y.initialVector) - score(x.initialVector))[0];
    if (best && flipped.every((a) => Math.sign(best.initialVector[a]) === Math.sign(want[a]))) {
      return { ...base, kind: 'chuyen-the', residual: { ...best.initialVector }, templateCode: best.code };
    }
  }
  return { ...base, kind: 'chua-lui', residual: { ...result.resultingVector } };
}

export function buildFollowUpCase(fu: PendingFollowUp): PatientCase | null {
  const original = STORY_CASES.find((c) => c.id === fu.caseId);
  if (!original) return null;
  const id = `${original.id}~tai-kham`;

  if (fu.kind === 'chuyen-the') {
    const template = PROCEDURAL_TEMPLATES.find((t) => t.code === fu.templateCode);
    if (!template) return null;
    const persona = { name: original.patientName, role: original.patientRole, age: original.age };
    return {
      ...caseFromTemplate(template, persona, original.chapter, id),
      isProcedural: false,
      followUpOf: original.id,
      isPregnant: original.isPregnant,
      title: `Tái khám — bệnh chuyển thể: ${original.patientName}`,
      chiefComplaint: `Thưa thầy, uống thang hôm trước xong thì chứng cũ đổi khác hẳn. ${template.chiefComplaint}`,
      clinicalExplanation: `Thang trước dùng quá tay nên bệnh cơ đảo chiều, từ "${original.seasonTag}" chuyển thành "${template.seasonTag}". ${template.clinicalExplanation}`
    };
  }

  return {
    ...original,
    id,
    followUpOf: original.id,
    title: `Tái khám — bệnh chưa lui: ${original.patientName}`,
    chiefComplaint:
      'Thưa thầy, tôi quay lại tái khám vì bệnh cũ vẫn chưa lui hẳn — các chứng vẫn như hôm trước tôi kể với thầy.',
    initialVector: { ...fu.residual }
  };
}

export function dueFollowUps(pending: PendingFollowUp[] | undefined, day: number): PendingFollowUp[] {
  return (pending ?? []).filter((f) => f.dueDay <= day);
}
