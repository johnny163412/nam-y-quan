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

      {/* Hanging calligraphy scroll: brush title, lạc khoản seal, two ways in */}
      <div className="title-gate-card">
        <span className="title-scroll-rod" aria-hidden="true" />
        <h1 className="title-gate-heading">
          Nam Y Quán
          <span className="title-gate-seal" aria-hidden="true">
            Tuệ
            <br />
            Tâm
          </span>
        </h1>
        <p className="title-gate-sub">Tuệ Tâm Đường</p>
        <p className="title-gate-motto">Nam dược trị Nam nhân</p>

        {isReturning && (
          <p className="title-gate-stats">
            {progress.rank} · {completedCount} ca đã chữa · {progress.yDucPoints ?? 0} Y Đức · {unlockedAchievementCount}/
            {ACHIEVEMENTS.length} ấn triện
          </p>
        )}

        <div className="title-gate-actions">
          <button type="button" className="btn-cinnabar title-gate-primary-btn" onClick={() => triggerEnter(true)}>
            <AntiqueIcon name="star-seal" size={16} />
            <span>{isReturning ? 'Tiếp Tục Hành Y' : 'Mở Cửa Y Quán'}</span>
          </button>
          <button type="button" className="title-gate-quiet-btn" onClick={() => triggerEnter(false)}>
            Vào Y Quán (Im lặng)
          </button>
        </div>
        <span className="title-scroll-rod is-bottom" aria-hidden="true" />
      </div>
    </div>
  );
};
