import React from 'react';
import { SONG_AN_PAIRS, STORY_CASES } from '../../data/cases';
import type { PatientCase } from '../../types/tcm';
import { AntiqueIcon } from '../svg/AntiqueIcons';

interface CaseDirectoryModalProps {
  yDucPoints: number;
  hasDragonScale: boolean;
  hasBatTrangPot: boolean;
  hasJadeSeal: boolean;
  activeChapter: 1 | 2 | 3;
  onSelectChapter: (ch: 1 | 2 | 3) => void;
  chapterCases: PatientCase[];
  completedCases: Record<string, { bestScore: number }>;
  selectedCaseId: string;
  songAnClearedIds: string[];
  ledgerCount: number;
  onPickCase: (c: PatientCase) => void;
  onPickSongAn: (caseA: PatientCase, pairId: string) => void;
  onClose: () => void;
  onOpenLedger: () => void;
  onSpawnProcedural: () => void;
}

export const CaseDirectoryModal: React.FC<CaseDirectoryModalProps> = ({
  yDucPoints,
  hasDragonScale,
  hasBatTrangPot,
  hasJadeSeal,
  activeChapter,
  onSelectChapter,
  chapterCases,
  completedCases,
  selectedCaseId,
  songAnClearedIds,
  ledgerCount,
  onPickCase,
  onPickSongAn,
  onClose,
  onOpenLedger,
  onSpawnProcedural
}) => (
  <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Mục lục ca bệnh và Sổ Y Án">
    <div className="woodblock-sheet modal-scroll sac-phong-frame">
      <div className="section-heading">
        <span>Mục Lục Bệnh Án &amp; Công Đức Tuệ Tâm Đường</span>
        <button type="button" className="btn-secondary" onClick={onClose}>
          Đóng lại
        </button>
      </div>

      <div className="yduc-relics-pill" style={{ marginBottom: '12px' }}>
        <strong>Điểm Y Đức: {yDucPoints}</strong>
        <span className={`relic-dot ${hasDragonScale ? 'unlocked' : ''}`}>
          {hasDragonScale ? 'Đã mở: Cân Giao Long' : '25đ: Cân Long'}
        </span>
        <span className={`relic-dot ${hasBatTrangPot ? 'unlocked' : ''}`}>
          {hasBatTrangPot ? 'Đã mở: Siêu Bát Tràng (+1đ)' : '60đ: Siêu Bát Tràng'}
        </span>
        <span className={`relic-dot ${hasJadeSeal ? 'unlocked' : ''}`}>
          {hasJadeSeal ? 'Đã mở: Ấn Bạch Ngọc' : '100đ: Ấn Bạch Ngọc'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {([1, 2, 3] as const).map((ch) => (
          <button
            key={ch}
            type="button"
            className={`chapter-btn ${activeChapter === ch ? 'active' : ''}`}
            onClick={() => onSelectChapter(ch)}
          >
            Chương {ch}: {ch === 1 ? 'Biểu Lý Hàn Nhiệt' : ch === 2 ? 'Tạng Phủ Ngũ Hành' : 'Kinh Lạc'}
          </button>
        ))}
      </div>

        <div style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
        {chapterCases.map((c) => {
          const done = completedCases[c.id];
          const isCur = c.id === selectedCaseId;
          return (
            <button
              key={c.id}
              type="button"
              className={`exam-option-plaque ${isCur ? 'picked' : ''}`}
              onClick={() => onPickCase(c)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <strong>{c.title}</strong>
                <span style={{ color: '#E7B96A', fontSize: '0.8rem' }}>
                  {done ? `Đã đạt ${done.bestScore}đ` : 'Chưa trị'}
                </span>
              </div>
              <div className="opt-detail">{c.patientName} · {c.seasonTag}</div>
            </button>
          );
        })}
      </div>

      <div className="songan-directory-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <strong style={{ fontFamily: 'var(--font-serif)', color: '#fff3d6', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <AntiqueIcon name="yin-yang" size={15} />
            <span>Thử Thách Song Án Đồng Bệnh Dị Trị (+40 Y Đức)</span>
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#E7B96A' }}>
            Đã đạt {songAnClearedIds.length}/{SONG_AN_PAIRS.length}
          </span>
        </div>
        <div className="songan-grid">
          {SONG_AN_PAIRS.map((pair) => {
            const isCleared = songAnClearedIds.includes(pair.id);
            const caseA = STORY_CASES.find((c) => c.id === pair.caseAId);
            return (
              <button
                key={pair.id}
                type="button"
                className={`songan-challenge-btn ${isCleared ? 'cleared' : ''}`}
                onClick={() => caseA && onPickSongAn(caseA, pair.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                  <strong>{pair.title}</strong>
                  <span style={{ fontSize: '0.72rem', color: isCleared ? '#95E3B3' : '#F3CA78', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    {isCleared ? (
                      <>
                        <AntiqueIcon name="check-seal" size={12} /> <span>Hoàn thành</span>
                      </>
                    ) : (
                      `+${pair.rewardYDuc}đ`
                    )}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#E4CFA8', marginTop: '2px' }}>
                  {pair.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onOpenLedger}
        >
          Mở Sổ Lưu Y Án ({ledgerCount})
        </button>
        <button type="button" className="btn-cinnabar" onClick={onSpawnProcedural}>
          Gõ Mõ Đón Khách Vãng Lai mới
        </button>
      </div>
    </div>
  </div>
);
