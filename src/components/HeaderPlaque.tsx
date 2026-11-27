import React, { useState } from 'react';
import { getSeasonalSolarTerm } from '../data/cases';
import { getTyNgoWatch } from '../engine/tcmEngine';
import { exportSaveJson, importSaveJson } from '../engine/storage';
import { UserProgress } from '../types/tcm';
import { AntiqueIcon } from './svg/AntiqueIcons';

export type MainTab = 'clinic' | 'codex' | 'exam' | 'constitution';

interface HeaderPlaqueProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  progress: UserProgress;
  unlockedAchievementCount: number;
  totalAchievementCount: number;
  onOpenAchievements: () => void;
  onToggleSound: () => void;
  onToggleAmbient: () => void;
  onChangeVolumes: (sfxVolume: number, musicVolume: number) => void;
  onImportProgress: (next: UserProgress) => void;
  onResetProgress: () => void;
}

export const HeaderPlaque: React.FC<HeaderPlaqueProps> = ({
  activeTab,
  onSelectTab,
  progress,
  unlockedAchievementCount,
  totalAchievementCount,
  onOpenAchievements,
  onToggleSound,
  onToggleAmbient,
  onChangeVolumes,
  onImportProgress,
  onResetProgress
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const nowHour = new Date().getHours();
  const activeWatch = getTyNgoWatch(nowHour);
  const dayCount = progress.dayCount ?? 1;
  const solarTerm = getSeasonalSolarTerm(dayCount);

  const handleDownloadSave = () => {
    const json = exportSaveJson(progress);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nam-y-quan-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Đã tải xuống tệp lưu tiến trình.');
  };

  const handleImportSubmit = () => {
    const res = importSaveJson(importText);
    if (!res.ok) {
      setStatusMsg(res.error);
      return;
    }
    onImportProgress(res.progress);
    setImportText('');
    setStatusMsg('Đã khôi phục hồ sơ hành y thành công!');
  };

  return (
    <header className="header-plaque slim-header spatial-top-hud">
      <div className="header-inner slim-header-inner spatial-hud-inner">
        <div className="brand-group">
          <div className="rank-seal" title="Ấn hiệu Y gia hiện tại">
            {progress.rank}
          </div>
          <div className="spatial-brand-meta">
            <h1 className="brand-title">Nam Y Quán</h1>
            <span className="spatial-hud-pills">
              <span className="hud-mini-chip" title={`${activeWatch.branch} (${activeWatch.organ} vượng)`}>
                Ngày {dayCount} · {solarTerm.name}
              </span>
              <span className="hud-mini-chip is-gold" title="Điểm Y Đức mở khóa Bảo Vật Trấn Quán">
                Y Đức {progress.yDucPoints ?? 0}
              </span>
              {(progress.currentStreak ?? 0) >= 2 && (
                <span className="hud-mini-chip is-flame" title="Chuỗi chữa khỏi liên tiếp">
                  <AntiqueIcon name="flame" size={11} /> x{progress.currentStreak}
                </span>
              )}
            </span>
          </div>
        </div>

        <nav className="nav-tabs calligraphy-tabs spatial-nav-pills" aria-label="Cuộn giấy phụ">
          <button
            type="button"
            className={`calligraphy-tab ${activeTab === 'codex' ? 'active' : ''}`}
            onClick={() => onSelectTab(activeTab === 'codex' ? 'clinic' : 'codex')}
          >
            Tàng Thư
          </button>
          <button
            type="button"
            className={`calligraphy-tab ${activeTab === 'exam' ? 'active' : ''}`}
            onClick={() => onSelectTab(activeTab === 'exam' ? 'clinic' : 'exam')}
          >
            Y Miếu
          </button>
          <button
            type="button"
            className={`calligraphy-tab ${activeTab === 'constitution' ? 'active' : ''}`}
            onClick={() => onSelectTab(activeTab === 'constitution' ? 'clinic' : 'constitution')}
          >
            Thể Chất
          </button>
        </nav>

        <div className="header-tools">
          <button
            type="button"
            className="round-gear-btn achievement-trigger-btn"
            onClick={onOpenAchievements}
            aria-label="Mở Tủ Ấn Triện Danh Dự"
            title="Xem 12 Ấn Triện Danh Dự & Sao chép khoe bạn bè"
          >
            <AntiqueIcon name="star-seal" size={13} />{' '}
            <span>{unlockedAchievementCount}/{totalAchievementCount}</span>
          </button>
          <button
            type="button"
            className="round-gear-btn"
            onClick={() => {
              setStatusMsg(null);
              setShowSettingsModal(true);
            }}
            aria-label="Cài đặt âm thanh và hồ sơ hành y"
            title="Âm thanh, Nhạc cảnh & Sao lưu Hồ sơ"
          >
            <AntiqueIcon name="brass-cog" size={13} /> <span>Cài đặt</span>
          </button>
        </div>
      </div>

      {showSettingsModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Cài đặt âm thanh và hồ sơ hành y">
          <div className="woodblock-sheet modal-scroll" style={{ color: 'var(--ink-primary)' }}>
            <div className="section-heading">
              <span>Cài đặt Âm thanh &amp; Hồ sơ Hành y</span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowSettingsModal(false)}
              >
                Đóng lại
              </button>
            </div>

            <div className="wood-parchment-panel" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  className={`toggle-pill ${progress.ambientEnabled ? 'active' : ''}`}
                  onClick={onToggleAmbient}
                  aria-pressed={Boolean(progress.ambientEnabled)}
                >
                  {progress.ambientEnabled ? 'Nhạc Đàn Tranh & Mưa: Bật' : 'Nhạc Đàn Tranh & Mưa: Tắt'}
                </button>
                <button
                  type="button"
                  className={`toggle-pill ${progress.soundEnabled ? 'active' : ''}`}
                  onClick={onToggleSound}
                  aria-pressed={progress.soundEnabled}
                >
                  {progress.soundEnabled ? 'Tiếng động Tay nghề: Bật' : 'Tiếng động Tay nghề: Tắt'}
                </button>
              </div>

              <div className="audio-mixer-row">
                <label htmlFor="music-vol-range">
                  Âm lượng Nhạc &amp; Âm cảnh ({Math.round((progress.musicVolume ?? 0.65) * 100)}%)
                </label>
                <input
                  id="music-vol-range"
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((progress.musicVolume ?? 0.65) * 100)}
                  onChange={(e) =>
                    onChangeVolumes(progress.sfxVolume ?? 0.8, Number(e.target.value) / 100)
                  }
                />
              </div>

              <div className="audio-mixer-row">
                <label htmlFor="sfx-vol-range">
                  Âm lượng Tiếng động &amp; Văn chẩn ({Math.round((progress.sfxVolume ?? 0.8) * 100)}%)
                </label>
                <input
                  id="sfx-vol-range"
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((progress.sfxVolume ?? 0.8) * 100)}
                  onChange={(e) =>
                    onChangeVolumes(Number(e.target.value) / 100, progress.musicVolume ?? 0.65)
                  }
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              <button type="button" className="btn-cinnabar" onClick={handleDownloadSave}>
                Xuất tệp lưu (.json)
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  onResetProgress();
                  setStatusMsg('Đã đặt lại hồ sơ về bậc Y Sinh ban đầu.');
                }}
              >
                Khởi tạo lại từ đầu
              </button>
            </div>

            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
              Khôi phục từ chuỗi JSON đã sao lưu:
            </label>
            <textarea
              rows={3}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Dán nội dung tệp .json vào đây..."
              style={{
                width: '100%',
                padding: '8px',
                background: 'var(--paper-highlight)',
                border: '1.5px solid var(--border-ink)',
                borderRadius: '2px',
                marginBottom: '8px'
              }}
            />
            <button type="button" className="btn-secondary" onClick={handleImportSubmit}>
              Nhập dữ liệu khôi phục
            </button>

            {statusMsg && (
              <div className="alert-banner caution" style={{ marginTop: '10px' }}>
                {statusMsg}
              </div>
            )}

            <div
              style={{
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(90, 62, 34, 0.25)',
                fontSize: '0.75rem',
                color: 'var(--ink-muted)',
                lineHeight: 1.45
              }}
            >
              Nam Y Quán — Tuệ Tâm Đường là sản phẩm giáo dục mô phỏng Y học cổ truyền Việt Nam, không thay thế chẩn đoán hay điều trị của bác sĩ, lương y được cấp phép.
              <br />
              Nhạc nền: “Ripples” &amp; “Eastern Thought” — Kevin MacLeod (incompetech.com), CC BY 4.0.
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
