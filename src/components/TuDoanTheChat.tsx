import React, { useMemo, useState } from 'react';
import { ACUPOINT_MAP } from '../data/acupoints';
import { CONSTITUTIONS, CONSTITUTION_QUESTIONS, evaluateConstitution } from '../data/constitutions';
import { HERB_MAP } from '../data/herbs';
import { apothecaryAudio } from '../engine/audio';
import { BodyConstitutionId } from '../types/tcm';
import { MeridianBodyMap } from './MeridianBodyMap';
import { BotanicalSvg } from './svg/BotanicalSvg';

interface TuDoanTheChatProps {
  savedConstitution?: BodyConstitutionId;
  onSaveConstitution: (id: BodyConstitutionId) => void;
  onOpenCodexHerb: (herbId: string) => void;
}

export const TuDoanTheChat: React.FC<TuDoanTheChatProps> = ({
  savedConstitution,
  onSaveConstitution,
  onOpenCodexHerb
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stepIdx, setStepIdx] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const currentQ = CONSTITUTION_QUESTIONS[stepIdx];

  const evaluation = useMemo(() => evaluateConstitution(answers), [answers]);

  const handlePickOption = (qId: string, optId: string) => {
    const next = { ...answers, [qId]: optId };
    setAnswers(next);
    apothecaryAudio.playPageTurn();

    if (stepIdx + 1 < CONSTITUTION_QUESTIONS.length) {
      setStepIdx(stepIdx + 1);
    } else {
      const res = evaluateConstitution(next);
      onSaveConstitution(res.primary.id);
      apothecaryAudio.playSealStamp(true);
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setStepIdx(0);
    setShowResult(false);
  };

  return (
    <div className="woodblock-sheet stitched-binding" style={{ maxWidth: '1040px', margin: '0 auto' }}>
      <div className="scene-diorama-banner">
        <img
          src="./art/scenes/duong-sinh-scroll.jpg"
          alt="Tranh dân gian Đông Hồ và bản thảo Dưỡng Sinh"
          className="scene-diorama-img"
        />
        <div className="scene-diorama-scrim" aria-hidden="true" />
        <div className="scene-diorama-content">
          <h2 className="scene-diorama-title">Cửu Chủng Thể Chất &amp; Dưỡng Sinh Dân Gian</h2>
          <p className="scene-diorama-sub">
            Soi xét Hàn — Nhiệt — Hư — Thực để lập tờ Sắc Phong trà dược &amp; huyệt xoa bóp
          </p>
        </div>
        <div className="scene-couplet-group" aria-hidden="true">
          <span className="couplet-plaque">「 Thuận Thiên Dưỡng Sinh 」</span>
        </div>
      </div>

      <div className="section-heading">
        <span>Tự Đoán Thể Chất Cửu Chủng — Dưỡng Sinh Cá Nhân</span>
        {savedConstitution && (
          <span className="tag-badge">
            Đã lưu: {CONSTITUTIONS.find((c) => c.id === savedConstitution)?.name ?? savedConstitution}
          </span>
        )}
      </div>

      <p className="muted-note" style={{ marginTop: 0 }}>
        Trả lời 8 câu hỏi theo học thuyết Cửu Chủng Thể Chất (Hàn — Nhiệt, Khí — Huyết, Tạng Phủ) để nhận tờ Sắc Phong Dưỡng Sinh kèm trà Nam dược và huyệt đạo xoa bóp phù hợp cho chính bạn hoặc người thân.
      </p>

      {!showResult && currentQ ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <strong>
              Thẻ tre {stepIdx + 1}/{CONSTITUTION_QUESTIONS.length}: {currentQ.topic}
            </strong>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {CONSTITUTION_QUESTIONS.map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  className={`toggle-pill ${i === stepIdx ? 'active' : ''}`}
                  style={{ flex: 'none', padding: '3px 8px', fontSize: '0.78rem' }}
                  onClick={() => setStepIdx(i)}
                >
                  {i + 1}
                  {answers[q.id] ? ' ·' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="wood-parchment-panel" style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>
              {currentQ.prompt}
            </h3>
            <div className="inquiry-grid">
              {currentQ.options.map((opt) => {
                const picked = answers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`bamboo-tally-btn ${picked ? 'active-tally' : ''}`}
                    onClick={() => handlePickOption(currentQ.id, opt.id)}
                  >
                    <strong style={{ color: '#E7B96A', marginRight: '6px' }}>
                      {opt.id.toUpperCase()}.
                    </strong>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={stepIdx === 0}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            >
              Thẻ trước
            </button>

            {answeredCount === CONSTITUTION_QUESTIONS.length && (
              <button
                type="button"
                className="btn-cinnabar"
                onClick={() => {
                  onSaveConstitution(evaluation.primary.id);
                  setShowResult(true);
                }}
              >
                Lập Sắc Phong Thể Chất
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Sắc Phong Dưỡng Sinh Cá Nhân — Sơn Son Thếp Vàng */}
          <div className="patient-banner sac-phong-frame" style={{ alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                  <span className="seal-stamp-badge">Sắc Phong Dưỡng Sinh</span>
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', color: 'var(--ivory-text)', fontSize: '1.28rem' }}>
                    {evaluation.primary.name}
                  </h2>
                </div>
                <span className="cinnabar-chop" title="Ấn triện Tuệ Tâm Đường">惠心堂印</span>
              </div>
              <p style={{ margin: '4px 0 8px', color: 'var(--sand-muted)' }}>
                {evaluation.primary.tagline}
                {evaluation.secondary ? ` (Kiêm nhẹ ${evaluation.secondary.name})` : ''}
              </p>
              <div className="wood-speech-bubble">
                <strong>Biểu hiện đặc trưng:</strong> {evaluation.primary.signs.join(' • ')}
                <div style={{ marginTop: '4px', color: 'var(--herbal-jade)', fontWeight: 600 }}>
                  Gương soi Thiệt chẩn: {evaluation.primary.tongueSummary}
                </div>
              </div>
            </div>
          </div>

          <div className="desk-grid">
            <div className="wood-parchment-panel">
              <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.02rem' }}>
                Nam Dược &amp; Trà Dưỡng Sinh Khuyên Dùng
              </strong>
              <div style={{ display: 'grid', gap: '8px', margin: '10px 0 12px' }}>
                {evaluation.primary.recommendedHerbIds.map((hid) => {
                  const h = HERB_MAP[hid];
                  if (!h) return null;
                  return (
                    <div
                      key={h.id}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                        padding: '8px',
                        background: '#DFCCA8',
                        border: '1.5px solid #5A3E28',
                        borderRadius: '3px'
                      }}
                    >
                      <BotanicalSvg herbId={h.id} motif={h.motif} size={52} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-serif)' }}>
                          {h.name} ({h.nature} — {h.flavors.join(', ')})
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{h.homeTip}</div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                        onClick={() => onOpenCodexHerb(h.id)}
                      >
                        Xem Y thư
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="alert-banner caution" style={{ marginBottom: '8px' }}>
                <strong>Khung giờ vàng Tý Ngọ Lưu Chú:</strong> {evaluation.primary.bestTyNgoBranch}
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                <strong>Nếp sinh hoạt khuyên dùng:</strong> {evaluation.primary.dietLifestyleTip}
              </p>
            </div>

            <div className="wood-parchment-panel">
              <strong style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: '1.02rem', marginBottom: '8px' }}>
                Huyệt Đạo Xoa Bóp Trước Khi Ngủ ({evaluation.primary.recommendedAcupointIds.map((id) => ACUPOINT_MAP[id]?.name).filter(Boolean).join(', ')})
              </strong>
              <MeridianBodyMap
                selectedIds={evaluation.primary.recommendedAcupointIds}
                onToggleAcupoint={() => {}}
              />
            </div>
          </div>

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-cinnabar" onClick={handleRestart}>
              Đoán lại cho bản thân hoặc người thân
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
