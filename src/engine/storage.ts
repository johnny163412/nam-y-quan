import { UserProgress } from '../types/tcm';

export const STORAGE_KEY = 'nam-y-quan:progress:v1';

export function createDefaultProgress(): UserProgress {
  return {
    version: 1,
    unlockedChapter: 1,
    rank: 'Y Sinh',
    completedCases: {},
    proceduralCleared: 0,
    examPassedChapters: [],
    herbNotes: {},
    mastery: {},
    soundEnabled: true,
    ambientEnabled: false,
    sfxVolume: 0.8,
    musicVolume: 0.65,
    mentorDismissed: false,
    caseLedger: [],
    discoveredFormulas: []
  };
}

function isValidProgressShape(raw: unknown): raw is UserProgress {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) return false;
  if (obj.unlockedChapter !== 1 && obj.unlockedChapter !== 2 && obj.unlockedChapter !== 3) return false;
  if (typeof obj.completedCases !== 'object' || obj.completedCases === null) return false;
  if (!Array.isArray(obj.examPassedChapters)) return false;
  if (typeof obj.herbNotes !== 'object' || obj.herbNotes === null) return false;
  if (typeof obj.mastery !== 'object' || obj.mastery === null) return false;
  return true;
}

export function loadProgress(storage?: Storage): UserProgress {
  try {
    const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return createDefaultProgress();
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return createDefaultProgress();
    const parsed: unknown = JSON.parse(raw);
    if (!isValidProgressShape(parsed)) {
      return createDefaultProgress();
    }
    return {
      ...createDefaultProgress(),
      ...parsed
    };
  } catch {
    return createDefaultProgress();
  }
}

export function saveProgress(progress: UserProgress, storage?: Storage): void {
  try {
    const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!store) return;
    store.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota or private browsing errors gracefully
  }
}

export function exportSaveJson(progress: UserProgress): string {
  return JSON.stringify(progress, null, 2);
}

export function importSaveJson(
  jsonString: string
): { ok: true; progress: UserProgress } | { ok: false; error: string } {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    if (!isValidProgressShape(parsed)) {
      return {
        ok: false,
        error: 'Tệp lưu không đúng định dạng Nam Y Quán (thiếu trường hoặc sai phiên bản).'
      };
    }
    return {
      ok: true,
      progress: {
        ...createDefaultProgress(),
        ...parsed
      }
    };
  } catch {
    return {
      ok: false,
      error: 'Không thể đọc tệp JSON — dữ liệu bị lỗi cú pháp.'
    };
  }
}
