import { describe, expect, it } from 'vitest';
import { buildDailyCase, dailyKey, dailyShareText, seedFromKey } from '../dailyCase';
import { evaluateCaseSubmission } from '../tcmEngine';

describe('Danh Y Hằng Ngày (seeded daily case)', () => {
  it('formats the local calendar day as YYYY-MM-DD', () => {
    expect(dailyKey(new Date(2026, 10, 28, 23, 59))).toBe('2026-11-28');
    expect(dailyKey(new Date(2027, 0, 3))).toBe('2027-01-03');
  });

  it('gives every player the identical case for a given day', () => {
    const a = buildDailyCase('2026-11-28');
    const b = buildDailyCase('2026-11-28');
    expect(a).toEqual(b);
    expect(a.id).toBe('daily-2026-11-28');
    expect(a.isDaily).toBe(true);
    expect(a.isProcedural).toBe(true); // never chains into a tái khám
    expect(a.title).toContain('28/11/2026');
  });

  it('varies the case across a month of days', () => {
    const titles = new Set(
      Array.from({ length: 30 }, (_, i) => buildDailyCase(dailyKey(new Date(2026, 10, 1 + i))).title.split(' — ')[1])
    );
    expect(titles.size).toBeGreaterThan(4);
    expect(seedFromKey('2026-11-28')).not.toBe(seedFromKey('2026-11-29'));
  });

  it('is solvable and shares a compact, emoji-free result', () => {
    const c = buildDailyCase('2026-11-28');
    const [quan, than, ta] = c.keyHerbs;
    const res = evaluateCaseSubmission(c, c.targetDiagnosis, { quan: c.idealQuanHerb ?? quan, than, ta: ta ?? null, su: 'cam-thao' }, []);
    const text = dailyShareText('2026-11-28', res);
    expect(text).toContain('Danh Y Hằng Ngày 28/11/2026');
    expect(text).toContain(`${res.totalScore}/100`);
    expect(text.split('\n')).toHaveLength(6);
    expect(/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(text)).toBe(false);
  });
});
