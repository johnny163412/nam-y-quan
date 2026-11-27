import { CRISIS_CASES } from '../data/crisisCases';
import { HERB_MAP } from '../data/herbs';
import { DiagnosisChoice, EvaluationResult, PatientCase, PrescriptionSlots } from '../types/tcm';
import { ELEMENT_LABELS } from './tcmEngine';

/** A rainy-night knock comes after this many cured patients. */
export const CURES_PER_CRISIS = 3;

export const nextCrisisCase = (attended: number): PatientCase => CRISIS_CASES[attended % CRISIS_CASES.length];

const RED_FLAG_TAG = 'dấu hiệu báo động';
const redFlagCluesFound = (c: PatientCase, clues: string[]) =>
  c.inquiries.filter((q) => q.clueTag.includes(RED_FLAG_TAG) && clues.includes(q.clueTag)).length;

const baseResult = (c: PatientCase): EvaluationResult => ({
  totalScore: 0,
  diagnosisScore: 0,
  treatmentScore: 0,
  safetyPenalty: 0,
  grade: 'Sai Lệch Y Lý',
  alerts: [],
  resultingVector: { ...c.initialVector },
  herbNotes: [],
  acupointNotes: [],
  matchedFormulas: [],
  decoctionScore: 0,
  decoctionFeedback: '',
  summaryFeedback: '',
  passed: false
});

/** The healer pressed "Chuyển y viện ngay". */
export function evaluateReferral(c: PatientCase, clues: string[]): EvaluationResult {
  const res = baseResult(c);
  if (!c.crisis?.referral) {
    return {
      ...res,
      totalScore: 10,
      diagnosisScore: 10,
      followUpLetter: c.followUpLetters?.poor,
      summaryFeedback: `Chuyển viện vội vàng: ca này không có dấu hiệu báo động và YHCT xử trí được ngay tại quán. ${c.crisis?.lesson ?? ''}`.trim()
    };
  }
  const found = redFlagCluesFound(c, clues);
  const diagnosisScore = Math.min(30, 12 + found * 6);
  const totalScore = diagnosisScore + 70;
  return {
    ...res,
    totalScore,
    diagnosisScore,
    treatmentScore: 70,
    grade: totalScore >= 90 ? 'Thần Y Diệu Thủ' : 'Đối Chứng Khỏi Bệnh',
    passed: true,
    followUpLetter: c.followUpLetters?.good,
    summaryFeedback: `Quyết đoán đúng lúc: chuyển y viện ngay. ${c.crisis.lesson}`
  };
}

/** A prescription was stamped: on a red-flag case that is a missed emergency, whatever the herbs. */
export function applyCrisisRules(c: PatientCase, res: EvaluationResult): EvaluationResult {
  if (!c.crisis?.referral) return res;
  return {
    ...res,
    totalScore: Math.min(res.totalScore, 20),
    treatmentScore: 0,
    grade: 'Sai Lệch Y Lý',
    passed: false,
    followUpLetter: c.followUpLetters?.poor,
    summaryFeedback: `Bỏ lỡ cấp cứu: ${c.crisis.redFlags.join(', ')} là dấu hiệu phải chuyển viện ngay, không kê đơn tại quán. ${c.crisis.lesson}`
  };
}

const AXIS = {
  location: { bieu: 'Biểu', ly: 'Lý' },
  nature: { han: 'Hàn', nhiet: 'Nhiệt' },
  state: { hu: 'Hư', thuc: 'Thực' }
} as const;

export interface TeacherReview {
  clues: { tag: string; found: boolean; redFlag: boolean }[];
  axes: { label: string; expected: string; chosen: string; ok: boolean }[];
  herbs: { role: string; expected: string; chosen: string; ok: boolean }[];
}

/** Thầy chấm bài: the chain clues → Bát Cương → Quân/Thần, showing which links the healer missed. */
export function buildTeacherReview(
  c: PatientCase,
  clues: string[],
  diagnosis: DiagnosisChoice,
  slots: PrescriptionSlots
): TeacherReview {
  const t = c.targetDiagnosis;
  const axes = [
    { label: 'Biểu / Lý', expected: AXIS.location[t.location], chosen: AXIS.location[diagnosis.location] },
    { label: 'Hàn / Nhiệt', expected: AXIS.nature[t.nature], chosen: AXIS.nature[diagnosis.nature] },
    { label: 'Hư / Thực', expected: AXIS.state[t.state], chosen: AXIS.state[diagnosis.state] },
    { label: 'Tạng chủ', expected: ELEMENT_LABELS[t.primaryElement], chosen: ELEMENT_LABELS[diagnosis.primaryElement] }
  ].map((a) => ({ ...a, ok: a.expected === a.chosen }));

  const name = (id: string | null) => (id ? HERB_MAP[id]?.name ?? id : '—');
  const herbs = c.crisis?.referral
    ? []
    : [
        { role: 'Quân', expected: name(c.idealQuanHerb || c.keyHerbs[0]), chosen: name(slots.quan) },
        { role: 'Thần', expected: name(c.keyHerbs.find((h) => h !== c.idealQuanHerb) ?? null), chosen: name(slots.than) }
      ].map((h) => ({ ...h, ok: h.expected === h.chosen }));

  return {
    clues: c.inquiries.map((q) => ({
      tag: q.clueTag,
      found: clues.includes(q.clueTag),
      redFlag: q.clueTag.includes(RED_FLAG_TAG)
    })),
    axes,
    herbs
  };
}
