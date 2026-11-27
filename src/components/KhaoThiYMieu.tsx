import React, { useState } from 'react';
import { apothecaryAudio } from '../engine/audio';
import { selectExamSession } from '../engine/examEngine';
import { ExamQuestion, UserProgress } from '../types/tcm';
import { MeridianBodyMap } from './MeridianBodyMap';
import { PulseCanvas } from './PulseCanvas';
import { TongueMirror } from './svg/TongueMirror';

const RADAR_AXES: { label: string; calc: (p: UserProgress) => number }[] = [
  {
    label: 'Thiệt Chẩn',
    calc: (p) => {
      const entries = Object.entries(p.mastery).filter(([k]) => k.startsWith('tongue-'));
      if (entries.length === 0) return 32;
      const sum = entries.reduce((acc, [, v]) => acc + (v.seen ? v.correct / v.seen : 0), 0);
      return Math.max(25, Math.min(100, Math.round((sum / entries.length) * 100)));
    }
  },
  {
    label: 'Mạch Chẩn',
    calc: (p) => {
      const entries = Object.entries(p.mastery).filter(([k]) => k.startsWith('pulse-'));
      if (entries.length === 0) return 32;
      const sum = entries.reduce((acc, [, v]) => acc + (v.seen ? v.correct / v.seen : 0), 0);
      return Math.max(25, Math.min(100, Math.round((sum / entries.length) * 100)));
    }
  },
  {
    label: 'Bát Cương',
    calc: (p) => {
      const cleared = Object.values(p.completedCases).filter((c) => c.bestScore >= 70).length;
      return Math.max(28, Math.min(100, 28 + cleared * 9 + p.proceduralCleared * 6));
    }
  },
  {
    label: 'Thảo Dược',
    calc: (p) => {
      const entries = Object.entries(p.mastery).filter(([k]) => k.startsWith('formula-'));
      const formulaBonus = (p.discoveredFormulas?.length ?? 0) * 6;
      if (entries.length === 0) return Math.min(100, 34 + formulaBonus);
      const sum = entries.reduce((acc, [, v]) => acc + (v.seen ? v.correct / v.seen : 0), 0);
      return Math.max(28, Math.min(100, Math.round((sum / entries.length) * 85) + formulaBonus));
    }
  },
  {
    label: 'Kinh Lạc',
    calc: (p) => {
      const entries = Object.entries(p.mastery).filter(
        ([k]) => k.startsWith('pt-') || k.startsWith('acupoint-')
      );
      if (entries.length === 0) return 30;
      const sum = entries.reduce((acc, [, v]) => acc + (v.seen ? v.correct / v.seen : 0), 0);
      return Math.max(25, Math.min(100, Math.round((sum / entries.length) * 100)));
    }
  }
];

const MasteryPentagonRadar: React.FC<{ progress: UserProgress }> = ({ progress }) => {
  const cx = 130;
  const cy = 114;
  const radius = 72;
  const values = RADAR_AXES.map((ax) => ({ label: ax.label, val: ax.calc(progress) }));
  const pointFor = (idx: number, ratio: number) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 5;
    return [cx + Math.cos(angle) * radius * ratio, cy + Math.sin(angle) * radius * ratio];
  };
  const gridRings = [0.35, 0.68, 1];
  const dataPoints = values.map((v, i) => pointFor(i, v.val / 100).join(',')).join(' ');

  return (
    <div className="y-mieu-radar-card">
      <svg viewBox="0 0 260 225" className="pentagon-radar-svg" role="img" aria-label="Đồ hình Ngũ Giác Tinh Thông Y Lý">
        {gridRings.map((ring) => (
          <polygon
            key={ring}
            points={[0, 1, 2, 3, 4].map((i) => pointFor(i, ring).join(',')).join(' ')}
            fill="none"
            stroke="rgba(122, 88, 42, 0.34)"
            strokeWidth={ring === 1 ? '1.6' : '1'}
          />
        ))}
        {[0, 1, 2, 3, 4].map((i) => {
          const [px, py] = pointFor(i, 1);
          return (
            <line key={i} x1={cx} y1={cy} x2={px} y2={py} stroke="rgba(122, 88, 42, 0.28)" strokeWidth="1" />
          );
        })}
        <polygon
          points={dataPoints}
          fill="rgba(166, 38, 32, 0.28)"
          stroke="#9E241E"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {values.map((v, i) => {
          const [dx, dy] = pointFor(i, v.val / 100);
          const [lx, ly] = pointFor(i, 1.24);
          return (
            <g key={v.label}>
              <circle cx={dx} cy={dy} r="3.6" fill="#C59344" stroke="#5A1914" strokeWidth="1.2" />
              <text
                x={lx}
                y={ly + 3}
                textAnchor="middle"
                fontSize="10.2"
                fontWeight="700"
                fill="#3E2A19"
              >
                {v.label} ({v.val}%)
              </text>
            </g>
          );
        })}
      </svg>
      <div className="radar-summary-col">
        <strong style={{ fontFamily: 'var(--font-serif)', color: '#2F1F12', fontSize: '0.98rem' }}>
          Ngũ Giác Tinh Thông Y Lý
        </strong>
        <p className="muted-note" style={{ margin: '4px 0 8px', fontSize: '0.82rem' }}>
          Tự động cập nhật khi bạn trả lời sát hạch Y Miếu và điều trị các ca lâm sàng tại Y Quán.
        </p>
        <div className="radar-mini-bars">
          {values.map((v) => (
            <div key={v.label} className="radar-stat-chip">
              <span>{v.label}</span>
              <strong>{v.val}%</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface KhaoThiYMieuProps {
  progress: UserProgress;
  onRecordAnswer: (targetKey: string, isCorrect: boolean) => void;
  onPassExamChapter: (chapter: 1 | 2 | 3) => void;
}

export const KhaoThiYMieu: React.FC<KhaoThiYMieuProps> = ({
  progress,
  onRecordAnswer,
  onPassExamChapter
}) => {
  const [questions, setQuestions] = useState<ExamQuestion[]>(() => selectExamSession(progress, 5));
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [scoreCount, setScoreCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[index];

  const handleConfirm = () => {
    if (!current || !selectedOption || submitted) return;
    const isCorrect = selectedOption === current.correctOptionId;
    setSubmitted(true);
    if (isCorrect) setScoreCount((c) => c + 1);
    apothecaryAudio.playSealStamp(isCorrect);
    onRecordAnswer(current.targetKey, isCorrect);
  };

  const handleNext = () => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelectedOption(null);
      setSubmitted(false);
    } else {
      setFinished(true);
      if (scoreCount >= 3) {
        onPassExamChapter(progress.unlockedChapter);
      }
    }
  };

  const handleRestart = () => {
    setQuestions(selectExamSession(progress, 5));
    setIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setScoreCount(0);
    setFinished(false);
  };

  return (
    <div className="woodblock-sheet" style={{ maxWidth: '920px', margin: '0 auto' }}>
      <div className="scene-diorama-banner">
        <img
          src="./art/scenes/y-mieu-temple.webp"
          alt="Khuê Văn Các Văn Miếu — Khoa trường Khảo Thí Y Miếu"
          className="scene-diorama-img"
        />
        <div className="scene-diorama-scrim" aria-hidden="true" />
        <div className="scene-diorama-content">
          <h2 className="scene-diorama-title">Y Miếu Quốc Học — Khoa Trường Sát Hạch</h2>
          <p className="scene-diorama-sub">
            Ứng thí Tứ Chẩn &amp; Thảo Dược để thăng ấn hiệu Y Gia và khai mở chương mới
          </p>
        </div>
        <div className="scene-couplet-group" aria-hidden="true">
          <span className="couplet-plaque">「 Y Đạo Tinh Thâm 」</span>
        </div>
      </div>

      <div className="section-heading">
        <span>Khảo Thí Y Miếu — Sát Hạch Thăng Cấp Y Gia</span>
        <span className="tag-badge">Ấn hiệu hiện tại: {progress.rank}</span>
      </div>

      <p className="muted-note" style={{ marginTop: 0 }}>
        Hệ thống tự động ưu tiên các nội dung Thiệt chẩn, Mạch chẩn, Phối ngũ và Huyệt đạo bạn từng nhầm lẫn để giúp ghi nhớ dài lâu. Đạt từ 3/5 câu trở lên sẽ đủ điều kiện thăng cấp chương mới.
      </p>

      <MasteryPentagonRadar progress={progress} />

      {finished ? (
        <div
          style={{
            padding: '18px',
            background: 'var(--paper-aged)',
            border: '1.5px solid var(--border-ink)',
            borderRadius: '2px',
            textAlign: 'center'
          }}
        >
          <div className="seal-stamp-badge" style={{ marginBottom: '10px' }}>
            {scoreCount >= 4 ? 'Khoa Bảng Xuất Sắc' : scoreCount >= 3 ? 'Đạt Chuẩn Y Miếu' : 'Cần Ôn Luyện Thêm'}
          </div>
          <h3 style={{ margin: '6px 0', fontFamily: 'var(--font-serif)', fontSize: '1.3rem' }}>
            Kết quả sát hạch: {scoreCount}/{questions.length} câu đúng
          </h3>
          <p className="muted-note" style={{ margin: '0 auto 14px' }}>
            {scoreCount >= 3
              ? `Chúc mừng! Ấn hiệu hiện tại của bạn là ${progress.rank}. Bạn đã mở khóa thêm kiến thức và ca bệnh ở Y Quán.`
              : 'Hãy mở lại Tàng Thư Các để quan sát kỹ vùng lưỡi, sóng mạch và vị trí huyệt rồi thử lại.'}
          </p>
          <button type="button" className="btn-cinnabar" onClick={handleRestart}>
            Thi lại lượt câu hỏi mới
          </button>
        </div>
      ) : current ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 600, fontSize: '0.88rem' }}>
            <span>Thử thách {index + 1}/{questions.length}</span>
            <span>Điểm hiện tại: {scoreCount}</span>
          </div>

          <div className="wood-parchment-panel" style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontSize: '1.06rem' }}>
              {current.prompt}
            </h3>
            <p className="muted-note" style={{ margin: '0 0 10px' }}>{current.subtext}</p>

            {current.tonguePreview && (
              <div style={{ marginBottom: '10px' }}>
                <TongueMirror tongue={current.tonguePreview} compact hideSummary blindLabels />
              </div>
            )}

            {current.pulsePreview && (
              <div style={{ marginBottom: '10px' }}>
                <PulseCanvas pulse={current.pulsePreview} hideName />
              </div>
            )}

            {current.type === 'acupoint' && (
              <div style={{ marginBottom: '10px' }}>
                <MeridianBodyMap
                  selectedIds={selectedOption ? [selectedOption] : []}
                  forcedSide={current.acupointMapSide}
                  candidateIds={current.acupointCandidateIds}
                  hideDetails
                  onToggleAcupoint={(id) => {
                    if (!submitted) setSelectedOption(id);
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
            {current.options.map((opt) => {
              const isPicked = selectedOption === opt.id;
              const isCorrect = opt.id === current.correctOptionId;
              const cls = [
                'exam-option-plaque',
                submitted
                  ? isCorrect
                    ? 'correct'
                    : isPicked
                    ? 'wrong'
                    : ''
                  : isPicked
                  ? 'picked'
                  : ''
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={submitted}
                  onClick={() => setSelectedOption(opt.id)}
                  className={cls}
                >
                  <div style={{ fontWeight: 700 }}>{opt.label}</div>
                  {opt.detail && <div className="opt-detail">{opt.detail}</div>}
                </button>
              );
            })}
          </div>

          {submitted && (
            <div
              className={`alert-banner ${
                selectedOption === current.correctOptionId ? 'caution' : ''
              }`}
              style={{
                background:
                  selectedOption === current.correctOptionId
                    ? 'var(--herbal-jade-soft)'
                    : 'var(--cinnabar-soft)',
                borderColor:
                  selectedOption === current.correctOptionId
                    ? 'var(--herbal-jade)'
                    : 'var(--cinnabar)',
                color: 'var(--ink-primary)'
              }}
            >
              <strong>
                {selectedOption === current.correctOptionId ? 'Chính xác! ' : 'Chưa đúng. '}
              </strong>
              {current.explanation}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            {!submitted ? (
              <button
                type="button"
                className="btn-cinnabar"
                disabled={!selectedOption}
                onClick={handleConfirm}
              >
                Nộp bài luận đáp
              </button>
            ) : (
              <button type="button" className="btn-cinnabar" onClick={handleNext}>
                {index + 1 < questions.length ? 'Câu tiếp theo' : 'Xem kết quả Y Miếu'}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
