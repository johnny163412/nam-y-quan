import React, { useState } from 'react';
import {
  ACHIEVEMENTS,
  buildAchievementShareSummary
} from '../data/achievements';
import { UserProgress } from '../types/tcm';

interface AchievementCabinetModalProps {
  progress: UserProgress;
  unlockedIds: string[];
  onClose: () => void;
}

export const AchievementCabinetModal: React.FC<AchievementCabinetModalProps> = ({
  progress,
  unlockedIds,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyShare = async () => {
    const text = buildAchievementShareSummary(progress, unlockedIds);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      setCopied(false);
    }
  };

  const pct = Math.round((unlockedIds.length / ACHIEVEMENTS.length) * 100);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Tủ Ấn Triện Danh Dự Y Quán"
      onClick={onClose}
    >
      <div
        className="woodblock-sheet modal-scroll achievement-cabinet-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="section-heading">
          <span>Tủ Ấn Triện Danh Dự ({unlockedIds.length}/{ACHIEVEMENTS.length})</span>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Đóng lại
          </button>
        </div>

        <div className="achievement-summary-bar">
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
              Ấn hiệu: {progress.rank} · Y Đức: {progress.yDucPoints ?? 0} · Hoàn thành {pct}%
            </div>
            <div className="achievement-progress-track" aria-hidden="true">
              <div className="achievement-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <button type="button" className="btn-cinnabar" onClick={handleCopyShare}>
            {copied ? 'Đã chép thẻ thành tích!' : 'Sao chép khoe bạn bè'}
          </button>
        </div>

        <div className="achievement-grid">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedIds.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`achievement-card ${isUnlocked ? `unlocked tier-${ach.tier}` : 'locked'}`}
              >
                <div className={`honor-seal-stamp ${isUnlocked ? `tier-${ach.tier}` : 'locked'}`}>
                  <span>{ach.sealText}</span>
                </div>
                <div className="achievement-card-body">
                  <div className="achievement-card-title">{ach.title}</div>
                  <div className="achievement-card-desc">{ach.description}</div>
                  <div className="achievement-card-status">
                    {isUnlocked ? 'Đã đóng ấn' : 'Chưa mở khóa'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
