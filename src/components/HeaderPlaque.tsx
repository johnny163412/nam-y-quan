import React, { useState } from 'react';
import { getTyNgoWatch } from '../engine/tcmEngine';
import { exportSaveJson, importSaveJson } from '../engine/storage';
import { UserProgress } from '../types/tcm';

export type MainTab = 'clinic' | 'codex' | 'exam';

interface HeaderPlaqueProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  progress: UserProgress;
  onToggleSound: () => void;
  onImportProgress: (next: UserProgress) => void;
  onResetProgress: () => void;
}

export const HeaderPlaque: React.FC<HeaderPlaqueProps> = ({
  activeTab,
  onSelectTab,
  progress,
  onToggleSound,
  onImportProgress,
  onResetProgress
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const nowHour = new Date().getHours();
  const activeWatch = getTyNgoWatch(nowHour);

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
    <header className="header-plaque">
      <div className="header-inner">
        <div className="brand-group">
          <div className="rank-seal" title="Ấn hiệu Y gia hiện tại">
            {progress.rank}
          </div>
          <div>
            <h1 className="brand-title">Nam Y Quán — Tuệ Tâm Đường</h1>
            <p className="brand-subtitle">Nam dược trị Nam nhân — Y quán học thuật tương tác</p>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Khu vực chính">
          <button
            type="button"
            className={`nav-tab ${activeTab === 'clinic' ? 'active' : ''}`}
            onClick={() => onSelectTab('clinic')}
          >
            1. Bàn Khám Y Quán
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'codex' ? 'active' : ''}`}
            onClick={() => onSelectTab('codex')}
          >
            2. Tàng Thư Các
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'exam' ? 'active' : ''}`}
            onClick={() => onSelectTab('exam')}
          >
            3. Khảo Thí Y Miếu
          </button>
        </nav>

        <div className="header-tools">
          <button
            type="button"
            className="watch-pill"
            onClick={() => onSelectTab('codex')}
            title="Xem bàn xoay 12 Canh Giờ Tý Ngọ Lưu Chú trong Tàng Thư Các"
          >
            <span>{activeWatch.branch}</span>
            <span>({activeWatch.organ} vượng)</span>
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={onToggleSound}
            aria-pressed={progress.soundEnabled}
          >
            {progress.soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              setStatusMsg(null);
              setShowSaveModal(true);
            }}
          >
            Hồ sơ lưu
          </button>
        </div>
      </div>

      {showSaveModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Quản lý hồ sơ hành y">
          <div className="woodblock-sheet modal-scroll" style={{ color: 'var(--ink-primary)' }}>
            <div className="section-heading">
              <span>Hồ sơ Hành y &amp; Sao lưu dữ liệu</span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowSaveModal(false)}
              >
                Đóng lại
              </button>
            </div>

            <p className="muted-note" style={{ marginTop: 0 }}>
              Tiến trình học tập, ghi chú thảo dược và ấn hiệu được lưu tự động trên trình duyệt. Bạn có thể xuất tệp JSON để mang sang máy khác.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
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
              rows={4}
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
          </div>
        </div>
      )}
    </header>
  );
};
