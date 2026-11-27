import { UserProgress } from '../types/tcm';

export interface HonorSealAchievement {
  id: string;
  sealText: string;
  title: string;
  description: string;
  tier: 'cinnabar' | 'gold' | 'jade';
  check: (p: UserProgress) => boolean;
}

export const ACHIEVEMENTS: HonorSealAchievement[] = [
  {
    id: 'khai-quan',
    sealText: 'Khai Quán',
    title: 'Khai Quán Hành Y',
    description: 'Chữa khỏi ca bệnh đầu tiên tại Tuệ Tâm Đường (≥ 70 điểm).',
    tier: 'cinnabar',
    check: (p) => Object.values(p.completedCases).some((c) => c.bestScore >= 70)
  },
  {
    id: 'dieu-thu',
    sealText: 'Diệu Thủ',
    title: 'Diệu Thủ Hồi Xuân',
    description: 'Đạt điểm xuất sắc từ 90/100 trở lên ở bất kỳ bệnh án nào.',
    tier: 'gold',
    check: (p) => Object.values(p.completedCases).some((c) => c.bestScore >= 90)
  },
  {
    id: 'lien-hoan',
    sealText: 'Liên Hoàn',
    title: 'Liên Hoàn Tế Thế',
    description: 'Đạt chuỗi chữa khỏi 3 ca bệnh liên tiếp không đứt mạch.',
    tier: 'gold',
    check: (p) => (p.currentStreak ?? 0) >= 3
  },
  {
    id: 'co-phuong',
    sealText: 'Cổ Phương',
    title: 'Cổ Phương Đắc Ý',
    description: 'Phối đúng ít nhất 1 bài thuốc Cổ Phương kinh điển trên Cân Tiểu Ly.',
    tier: 'jade',
    check: (p) => (p.discoveredFormulas?.length ?? 0) >= 1
  },
  {
    id: 'song-an',
    sealText: 'Song Án',
    title: 'Song Án Đồng Chứng',
    description: 'Hoàn thành trọn vẹn 1 cặp Song Án đối chứng biện biệt.',
    tier: 'jade',
    check: (p) => (p.songAnClearedIds?.length ?? 0) >= 1
  },
  {
    id: 'bach-thao-vien',
    sealText: 'Dược Viên',
    title: 'Bách Thảo Viên Sư',
    description: 'Tưới sương và thu hoạch lá thuốc tươi tại Hậu Viên.',
    tier: 'jade',
    check: (p) =>
      (p.freshHerbIds?.length ?? 0) >= 1 ||
      Object.values(p.gardenGrowth ?? {}).some((v) => v === 0)
  },
  {
    id: 'bao-che',
    sealText: 'Bào Chế',
    title: 'Bào Chế Tinh Tường',
    description: 'Áp dụng Cối giã hoặc Chảo sao bào chế vị thuốc trong 1 ca đã kê.',
    tier: 'cinnabar',
    check: (p) =>
      (p.caseLedger ?? []).some(
        (entry) =>
          entry.paoZhi &&
          Object.values(entry.paoZhi).some((m) => m && m !== 'sinh-dung')
      )
  },
  {
    id: 'kim-cham',
    sealText: 'Đắc Khí',
    title: 'Kim Châm Đắc Khí',
    description: 'Châm từ 2 huyệt trở lên hoặc phối hơ điếu Ngải cứu trong 1 bệnh án.',
    tier: 'cinnabar',
    check: (p) =>
      (p.caseLedger ?? []).some(
        (entry) => entry.acupoints.length >= 2 || Boolean(entry.moxaEnabled)
      )
  },
  {
    id: 'y-duc',
    sealText: 'Y Đức',
    title: 'Lương Y Tích Đức',
    description: 'Tích lũy từ 100 điểm Y Đức trở lên nhờ cứu chữa dân làng.',
    tier: 'gold',
    check: (p) => (p.yDucPoints ?? 0) >= 100
  },
  {
    id: 'tang-thu',
    sealText: 'Tàng Thư',
    title: 'Tàng Thư Học Giả',
    description: 'Ghi chép tâm đắc cho ít nhất 1 vị Nam dược trong Tàng Thư Các.',
    tier: 'jade',
    check: (p) => Object.values(p.herbNotes).some((note) => note.trim().length > 0)
  },
  {
    id: 'y-mieu',
    sealText: 'Bảng Vàng',
    title: 'Bảng Vàng Y Miếu',
    description: 'Vượt qua ít nhất 1 kỳ Khảo Thí tại Y Miếu.',
    tier: 'gold',
    check: (p) => p.examPassedChapters.length >= 1
  },
  {
    id: 'tue-tam',
    sealText: 'Tuệ Tâm',
    title: 'Tuệ Tâm Danh Y',
    description: 'Chữa khỏi ít nhất 6 bệnh án khác nhau tại Tuệ Tâm Đường.',
    tier: 'gold',
    check: (p) =>
      Object.values(p.completedCases).filter((c) => c.bestScore >= 70).length >= 6
  }
];

export function computeUnlockedAchievements(progress: UserProgress): string[] {
  const existing = new Set(progress.unlockedAchievements ?? []);
  for (const ach of ACHIEVEMENTS) {
    if (ach.check(progress)) {
      existing.add(ach.id);
    }
  }
  return Array.from(existing);
}

export function buildAchievementShareSummary(progress: UserProgress, unlockedIds: string[]): string {
  const cleared = Object.values(progress.completedCases).filter((c) => c.bestScore >= 70).length;
  const sealNames = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id))
    .map((a) => a.title)
    .join(', ');
  return [
    `[Nam Y Quán — Tuệ Tâm Đường]`,
    `Ấn hiệu: ${progress.rank} | Y Đức: ${progress.yDucPoints ?? 0} | Ca chữa khỏi: ${cleared}`,
    `Ấn Triện Danh Dự: ${unlockedIds.length}/${ACHIEVEMENTS.length}${sealNames ? ` (${sealNames})` : ''}`,
    `Chơi thử tại: https://johnny163412.github.io/nam-y-quan/`
  ].join('\n');
}
