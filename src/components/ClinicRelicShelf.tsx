import React from 'react';
import { AntiqueIcon, AntiqueIconName } from './svg/AntiqueIcons';

interface ClinicRelicShelfProps {
  yDucPoints: number;
}

interface ClinicRelic {
  id: string;
  name: string;
  requiredYDuc: number;
  icon: AntiqueIconName;
  effectText: string;
  tier: 'incense' | 'gold' | 'porcelain' | 'jade';
}

const CLINIC_RELICS: ClinicRelic[] = [
  {
    id: 'incense-burner',
    name: 'Đỉnh Trầm Hương',
    requiredYDuc: 20,
    icon: 'flame',
    effectText: 'Khói trầm tĩnh tâm lan tỏa khắp Tiền Đường',
    tier: 'incense'
  },
  {
    id: 'dragon-scale',
    name: 'Cân Giao Long',
    requiredYDuc: 40,
    icon: 'yin-yang',
    effectText: 'Đòn cân mạ vàng linh động tại Dược Các',
    tier: 'gold'
  },
  {
    id: 'battrang-pot',
    name: 'Siêu Bát Tràng',
    requiredYDuc: 80,
    icon: 'porcelain-pot',
    effectText: 'Siêu men lam giữ tinh khí (+1đ Dược hiệu)',
    tier: 'porcelain'
  },
  {
    id: 'jade-seal',
    name: 'Ấn Ngọc Bích',
    requiredYDuc: 120,
    icon: 'star-seal',
    effectText: 'Hào quang ngọc bích khi đóng ấn giao thuốc',
    tier: 'jade'
  }
];

export const ClinicRelicShelf: React.FC<ClinicRelicShelfProps> = ({ yDucPoints }) => {
  const nextLocked = CLINIC_RELICS.find((r) => yDucPoints < r.requiredYDuc);
  const unlockedCount = CLINIC_RELICS.filter((r) => yDucPoints >= r.requiredYDuc).length;

  return (
    <div className="clinic-relic-shelf" aria-label="Kệ Bảo Vật Trấn Quán">
      <div className="relic-shelf-header">
        <span className="relic-shelf-title">
          Kệ Bảo Vật Trấn Quán ({unlockedCount}/{CLINIC_RELICS.length})
        </span>
        <span className="relic-shelf-milestone">
          {nextLocked
            ? `Cần thêm ${nextLocked.requiredYDuc - yDucPoints} Y Đức để mở ${nextLocked.name}`
            : 'Đã quy tụ trọn bộ Tứ Bảo Tuệ Tâm Đường'}
        </span>
      </div>

      <div className="relic-shelf-grid">
        {CLINIC_RELICS.map((relic) => {
          const unlocked = yDucPoints >= relic.requiredYDuc;
          return (
            <div
              key={relic.id}
              className={`relic-pedestal tier-${relic.tier} ${unlocked ? 'is-unlocked' : 'is-locked'}`}
              title={unlocked ? `${relic.name}: ${relic.effectText}` : `Mở khóa khi đạt ${relic.requiredYDuc} Y Đức`}
            >
              <div className="relic-orb">
                <AntiqueIcon name={relic.icon} size={18} />
                {unlocked && relic.tier === 'incense' && (
                  <span className="relic-incense-wisp" aria-hidden="true" />
                )}
              </div>
              <div className="relic-meta">
                <div className="relic-name">{relic.name}</div>
                <div className="relic-sub">
                  {unlocked ? relic.effectText : `Mở ở ${relic.requiredYDuc} Y Đức`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
