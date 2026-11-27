import React, { useState } from 'react';
import { UserProgress } from '../types/tcm';
import { ACHIEVEMENTS } from '../data/achievements';
import { AmbientParticlesCanvas } from './AmbientParticlesCanvas';
import { AntiqueIcon } from './svg/AntiqueIcons';

interface TitleGateScreenProps {
  progress: UserProgress;
  unlockedAchievementCount: number;
  onEnterClinic: (withMusic: boolean) => void;
}

export const TitleGateScreen: React.FC<TitleGateScreenProps> = ({
  progress,
  unlockedAchievementCount,
  onEnterClinic
}) => {
  const [opening, setOpening] = useState(false);
  const completedCount = Object.values(progress.completedCases).filter((c) => c.bestScore >= 70).length;
  const isReturning = completedCount > 0 || (progress.yDucPoints ?? 0) > 0;

  const triggerEnter = (withMusic: boolean) => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(() => {
      onEnterClinic(withMusic);
    }, 520);
  };

  return (
    <div className={`title-gate-overlay ${opening ? 'is-opening' : ''}`} role="dialog" aria-modal="true" aria-label="Cổng Nam Y Quán — Tuệ Tâm Đường">
      <img
        src="./art/scenes/title-gate.webp"
        alt="Cổng gỗ Nam Y Quán Tuệ Tâm Đường dưới ánh đèn lồng sau mưa"
        className="title-gate-bg"
      />
      <div className="title-gate-vignette" aria-hidden="true" />
      <div className="title-gate-lantern-glow" aria-hidden="true" />
      <AmbientParticlesCanvas mode="sunbeams" />

      <div className="title-gate-card">
        <div className="title-gate-seal" aria-hidden="true">
          Tuệ Tâm
        </div>
        <p className="title-gate-eyebrow">Y học cổ truyền Việt Nam · Mô phỏng Hành Y</p>
        <h1 className="title-gate-heading">Nam Y Quán</h1>
        <p className="title-gate-sub">Tuệ Tâm Đường — Nam dược trị Nam nhân</p>

        <div className="title-gate-pillars">
          <span>Tứ Chẩn Biện Chứng</span>
          <span>·</span>
          <span>Cân Tiểu Ly &amp; Bào Chế</span>
          <span>·</span>
          <span>24 Huyệt Kinh Lạc</span>
          <span>·</span>
          <span>Hỏa Lò &amp; Dược Viên</span>
        </div>

        {isReturning && (
          <div className="title-gate-stats">
            <span><strong>Ấn hiệu:</strong> {progress.rank}</span>
            <span>·</span>
            <span><strong>Đã chữa:</strong> {completedCount} ca</span>
            <span>·</span>
            <span><strong>Y Đức:</strong> {progress.yDucPoints ?? 0}</span>
            <span>·</span>
            <span><strong>Ấn triện:</strong> {unlockedAchievementCount}/{ACHIEVEMENTS.length}</span>
          </div>
        )}

        <div className="title-gate-actions">
          <button
            type="button"
            className="btn-cinnabar title-gate-primary-btn"
            onClick={() => triggerEnter(true)}
          >
            <AntiqueIcon name="star-seal" size={16} />
            <span>{isReturning ? 'Tiếp Tục Hành Y (Kèm Nhạc Cổ Phong)' : 'Mở Cửa Y Quán (Kèm Nhạc Cổ Phong)'}</span>
          </button>
          <button
            type="button"
            className="btn-secondary title-gate-quiet-btn"
            onClick={() => triggerEnter(false)}
          >
            Vào Y Quán (Im lặng)
          </button>
        </div>
      </div>
    </div>
  );
};
