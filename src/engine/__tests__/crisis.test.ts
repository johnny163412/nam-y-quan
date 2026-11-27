import { describe, expect, it } from 'vitest';
import { CRISIS_CASES } from '../../data/crisisCases';
import { HERB_MAP } from '../../data/herbs';
import { applyCrisisRules, buildTeacherReview, evaluateReferral, nextCrisisCase } from '../crisis';
import { evaluateCaseSubmission } from '../tcmEngine';

const referral = CRISIS_CASES.filter((c) => c.crisis?.referral);
const treatable = CRISIS_CASES.filter((c) => !c.crisis?.referral);
const redFlagTags = (c: (typeof CRISIS_CASES)[number]) =>
  c.inquiries.map((q) => q.clueTag).filter((t) => t.includes('dấu hiệu báo động'));

describe('Đêm Mưa Gõ Cửa (crisis cases)', () => {
  it('mixes must-refer and treatable nights, rotating through all of them', () => {
    expect(referral.length).toBeGreaterThanOrEqual(2);
    expect(treatable.length).toBeGreaterThanOrEqual(2);
    expect(new Set(CRISIS_CASES.map((_, i) => nextCrisisCase(i).id)).size).toBe(CRISIS_CASES.length);
    for (const c of referral) expect(redFlagTags(c).length).toBeGreaterThanOrEqual(2);
  });

  it('referring a red-flag case passes, and scores higher when the red flags were asked about', () => {
    for (const c of referral) {
      const blind = evaluateReferral(c, []);
      const sharp = evaluateReferral(c, redFlagTags(c));
      expect(blind.passed).toBe(true);
      expect(sharp.totalScore).toBeGreaterThan(blind.totalScore);
      expect(sharp.totalScore).toBeLessThanOrEqual(100);
    }
  });

  it('prescribing for a red-flag case fails however good the herbs look', () => {
    for (const c of referral) {
      const res = applyCrisisRules(c, evaluateCaseSubmission(c, c.targetDiagnosis, { quan: 'tia-to', than: 'kinh-gioi', ta: null, su: 'cam-thao' }, []));
      expect(res.passed).toBe(false);
      expect(res.totalScore).toBeLessThanOrEqual(20);
      expect(res.summaryFeedback).toContain(c.crisis!.redFlags[0]);
    }
  });

  it('treatable nights are solvable with herbs and fail if needlessly referred', () => {
    for (const c of treatable) {
      for (const id of c.keyHerbs) expect(HERB_MAP[id]).toBeDefined();
      const [than, ta, su] = c.keyHerbs.filter((h) => h !== c.idealQuanHerb);
      const res = applyCrisisRules(
        c,
        evaluateCaseSubmission(c, c.targetDiagnosis, { quan: c.idealQuanHerb, than, ta: ta ?? null, su: su ?? null }, [])
      );
      expect(res.passed).toBe(true);
      expect(evaluateReferral(c, []).passed).toBe(false);
    }
  });
});

describe('Thầy chấm bài (diagnostic chain review)', () => {
  it('marks found and missed clues, wrong Bát Cương axes and the expected Quân/Thần', () => {
    const c = treatable[0];
    const asked = c.inquiries[0].clueTag;
    const wrong = { ...c.targetDiagnosis, nature: c.targetDiagnosis.nature === 'han' ? 'nhiet' : 'han' } as const;
    const review = buildTeacherReview(c, [asked], wrong, { quan: c.idealQuanHerb, than: null, ta: null, su: null });
    expect(review.clues.find((x) => x.tag === asked)?.found).toBe(true);
    expect(review.clues.filter((x) => !x.found).length).toBe(c.inquiries.length - 1);
    expect(review.axes.filter((a) => !a.ok).map((a) => a.label)).toEqual(['Hàn / Nhiệt']);
    expect(review.herbs[0].ok).toBe(true);
    expect(review.herbs[1].ok).toBe(false);
  });

  it('shows no herb row for a must-refer case', () => {
    const c = referral[0];
    expect(buildTeacherReview(c, [], c.targetDiagnosis, { quan: null, than: null, ta: null, su: null }).herbs).toEqual([]);
  });
});
