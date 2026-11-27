import React from 'react';
import { HonorSealAchievement } from '../data/achievements';

interface AchievementToastProps {
  achievement: HonorSealAchievement | null;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onDismiss }) => {
  if (!achievement) return null;
  return (
    <div
      className={`achievement-toast tier-${achievement.tier}`}
      role="status"
      aria-live="polite"
      onClick={onDismiss}
    >
      <div className={`honor-seal-stamp small tier-${achievement.tier}`}>
        <span>{achievement.sealText}</span>
      </div>
      <div className="achievement-toast-text">
        <div className="achievement-toast-kicker">Mở khóa Ấn Triện Danh Dự</div>
        <div className="achievement-toast-title">{achievement.title}</div>
        <div className="achievement-toast-desc">{achievement.description}</div>
      </div>
    </div>
  );
};
