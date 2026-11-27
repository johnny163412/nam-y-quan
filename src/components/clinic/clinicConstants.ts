import type { AntiqueIconName } from '../svg/AntiqueIcons';
import type { FireType, RoleSlot } from '../../types/tcm';

export const ROLE_TITLES: Record<RoleSlot, string> = {
  quan: 'Quân dược',
  than: 'Thần dược',
  ta: 'Tá dược',
  su: 'Sứ dược'
};

export const ROOM_NODES: { idx: 0 | 1 | 2 | 3; roman: string; label: string }[] = [
  { idx: 0, roman: 'I', label: 'Tiền Đường' },
  { idx: 1, roman: 'II', label: 'Dược Các' },
  { idx: 2, roman: 'III', label: 'Nội Các & Lò' },
  { idx: 3, roman: 'IV', label: 'Hậu Viên' }
];

export const EXAM_INSTRUMENTS: { id: ExamTab; label: string; icon: AntiqueIconName }[] = [
  { id: 'vong', label: 'Soi Gương', icon: 'mirror' },
  { id: 'van', label: 'Nghe Thở', icon: 'ear-wave' },
  { id: 'van-hoi', label: 'Thẻ Vấn', icon: 'bamboo-slips' },
  { id: 'thiet', label: 'Gối Mạch', icon: 'pulse-pillow' }
];

export const FIRE_TARGET_RANGES: Record<FireType, [number, number]> = {
  'vu-hoa': [75, 100],
  'van-vu': [42, 74],
  'van-hoa': [15, 41]
};

export type ExamTab = 'vong' | 'van' | 'van-hoi' | 'thiet';

/** Light over the rooms for each of the 12 Tý Ngọ watches, in TY_NGO_WATCHES order (Tý … Hợi). */
export const WATCH_LIGHT: { tint: string; strength: number; angle: string; lamp: boolean }[] = [
  { tint: 'rgb(24, 34, 72)', strength: 0.62, angle: '180deg', lamp: true }, // Tý
  { tint: 'rgb(20, 30, 66)', strength: 0.66, angle: '180deg', lamp: true }, // Sửu
  { tint: 'rgb(46, 50, 96)', strength: 0.52, angle: '200deg', lamp: true }, // Dần — trời sắp rạng
  { tint: 'rgb(255, 168, 120)', strength: 0.34, angle: '250deg', lamp: false }, // Mão — bình minh
  { tint: 'rgb(255, 214, 150)', strength: 0.26, angle: '240deg', lamp: false }, // Thìn
  { tint: 'rgb(255, 238, 200)', strength: 0.16, angle: '200deg', lamp: false }, // Tỵ
  { tint: 'rgb(255, 250, 228)', strength: 0.12, angle: '180deg', lamp: false }, // Ngọ — chính trưa
  { tint: 'rgb(255, 222, 160)', strength: 0.18, angle: '160deg', lamp: false }, // Mùi
  { tint: 'rgb(240, 170, 90)', strength: 0.28, angle: '120deg', lamp: false }, // Thân
  { tint: 'rgb(228, 108, 58)', strength: 0.4, angle: '110deg', lamp: false }, // Dậu — hoàng hôn
  { tint: 'rgb(84, 60, 112)', strength: 0.5, angle: '160deg', lamp: true }, // Tuất
  { tint: 'rgb(34, 40, 80)', strength: 0.58, angle: '180deg', lamp: true } // Hợi
];

export const SOLAR_WEATHER: Record<string, 'rain' | 'sunbeams' | 'garden'> = {
  'Xuân Vũ': 'rain',
  'Hạ Thử': 'sunbeams',
  'Thu Táo': 'garden',
  'Đông Hàn': 'rain'
};
export type TabletopTool = ExamTab | 'bat-cuong';
