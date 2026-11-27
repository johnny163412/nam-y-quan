import { caseFromTemplate, PROCEDURAL_TEMPLATES, VILLAGER_NAMES } from '../data/cases';
import { EvaluationResult, PatientCase } from '../types/tcm';

export const PLAY_URL = 'https://johnny163412.github.io/nam-y-quan/';

/** Local calendar day as YYYY-MM-DD: everyone playing on the same date gets the same case. */
export function dailyKey(date: Date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** FNV-1a: a stable 32-bit seed from the day key (no Math.random, so every device agrees). */
export function seedFromKey(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

const shortDate = (key: string) => {
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
};

export function buildDailyCase(key: string = dailyKey()): PatientCase {
  const seed = seedFromKey(key);
  const template = PROCEDURAL_TEMPLATES[seed % PROCEDURAL_TEMPLATES.length];
  const persona = VILLAGER_NAMES[(seed >>> 8) % VILLAGER_NAMES.length];
  const base = caseFromTemplate(template, persona, 3, `daily-${key}`);
  return {
    ...base,
    title: `Danh Y Hằng Ngày ${shortDate(key)} — ${base.title}`,
    isDaily: true
  };
}

const dots = (value: number, max: number) => {
  const filled = Math.max(0, Math.min(5, Math.round((value / max) * 5)));
  return '●'.repeat(filled) + '○'.repeat(5 - filled);
};

/** Wordle-style result to paste into a chat: score, the two scored parts as dots, craft bonus. */
export function dailyShareText(key: string, result: EvaluationResult): string {
  const craft = result.craftBonusScore ?? 0;
  return [
    `Nam Y Quán · Danh Y Hằng Ngày ${shortDate(key)}`,
    `${result.totalScore}/100 · ${result.grade}${result.passed ? '' : ' (chưa đạt)'}`,
    `Biện chứng ${dots(result.diagnosisScore, 30)} ${result.diagnosisScore}/30`,
    `Phối ngũ   ${dots(result.treatmentScore, 70)} ${result.treatmentScore}/70`,
    `Tay nghề   ${craft >= 0 ? '+' : ''}${craft}đ`,
    PLAY_URL
  ].join('\n');
}
