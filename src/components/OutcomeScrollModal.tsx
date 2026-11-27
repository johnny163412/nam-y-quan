import React from 'react';
import { EvaluationResult, PatientCase } from '../types/tcm';
import { GlossaryText } from './GlossaryText';
import { VillagerPortrait } from './svg/VillagerPortrait';

interface OutcomeScrollModalProps {
  patientCase: PatientCase;
  result: EvaluationResult;
  onClose: () => void;
  onNextCase: () => void;
  onOpenLedger?: () => void;
}

export const OutcomeScrollModal: React.FC<OutcomeScrollModalProps> = ({
  patientCase,
  result,
  onClose,
  onNextCase,
  onOpenLedger
}) => {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Y án luận trị">
      <div className="woodblock-sheet modal-scroll sac-phong-frame">
        <div className="section-heading">
          <span>Y Án Luận Trị — {patientCase.patientName}</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="cinnabar-chop" title="Ấn triện Tuệ Tâm Đường">惠心堂印</span>
            <span className="seal-stamp-badge">{result.grade}</span>
          </div>
        </div>

        <div className="outcome-recovery-stage">
          <div className="outcome-portrait-box">
            <VillagerPortrait
              patientCase={patientCase}
              size="compact"
              mood={result.passed ? 'recovered' : 'sick'}
            />
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: result.passed ? 'var(--herbal-jade)' : '#7C1A14', marginTop: '4px', textAlign: 'center' }}>
              {result.passed ? 'Thần sắc hồng nhuận · Khí huyết điều hòa' : 'Bệnh khí chưa lui hết · Cần xem lại đơn'}
            </div>
          </div>

          <div className="outcome-bowl-box">
            <div className="taste-bowl-stage is-outcome">
              <img
                src="./art/tools/porcelain-decoction-bowl.jpg"
                alt="Bát thuốc sứ Bát Tràng dâng người bệnh"
                className="taste-bowl-thumb"
              />
              <span className="bowl-steam-wisp w1" aria-hidden="true" />
              <span className="bowl-steam-wisp w2" aria-hidden="true" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.72rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: result.passed ? 'var(--herbal-jade)' : 'var(--cinnabar)' }}>
                {result.totalScore}/100 điểm
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--ink-primary)' }}>
                <div>Biện chứng Bát Cương: <strong>{result.diagnosisScore}/30</strong></div>
                <div>Phối ngũ &amp; Huyệt đạo: <strong>{result.treatmentScore}/70</strong></div>
                {(result.craftBonusScore ?? 0) > 0 && (
                  <div style={{ color: 'var(--herbal-jade)', fontWeight: 700 }}>
                    Tay nghề Bào chế / Châm Cứu: +{result.craftBonusScore}đ
                  </div>
                )}
                {result.safetyPenalty > 0 && (
                  <div style={{ color: 'var(--cinnabar)', fontWeight: 700 }}>
                    Trừ điểm Cấm kỵ Y gia: -{result.safetyPenalty}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <p style={{ fontWeight: 600, margin: '0 0 10px' }}>{result.summaryFeedback}</p>

        {result.followUpLetter && (
          <blockquote className="follow-up-letter">
            <span className="letter-stamp">Thư Hồi Âm Sau 3 Ngày</span>
            <p style={{ margin: '6px 0 0' }}>{result.followUpLetter}</p>
          </blockquote>
        )}

        {result.matchedFormulas.length > 0 && (
          <div className="synergy-banner" style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#E7B96A', fontFamily: 'var(--font-serif)' }}>
              Lĩnh hội Cổ Phương Bí Truyền: {result.matchedFormulas.map((f) => f.name).join(', ')}
            </strong>
            <div style={{ marginTop: '3px', fontSize: '0.84rem' }}>
              {result.matchedFormulas[0].principle}
            </div>
          </div>
        )}

        {result.decoctionFeedback && (
          <div className="alert-banner caution" style={{ marginBottom: '10px' }}>
            <strong>Hỏa hầu &amp; Cách dùng ({result.decoctionScore >= 0 ? `+${result.decoctionScore}` : result.decoctionScore}đ):</strong>{' '}
            <GlossaryText text={result.decoctionFeedback} />
          </div>
        )}

        {result.craftBonusNotes && result.craftBonusNotes.length > 0 && (
          <div className="alert-banner caution" style={{ marginBottom: '10px', background: 'rgba(35,87,76,0.14)', borderColor: 'var(--herbal-jade)', color: 'var(--herbal-jade)' }}>
            <strong>Điểm sáng Bào chế &amp; Cứu ấm:</strong>{' '}
            {result.craftBonusNotes.join(' · ')}
          </div>
        )}

        {result.alerts.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            {result.alerts.map((al, i) => (
              <div
                key={`${al.sourceId}-${i}`}
                className={`alert-banner ${al.severity === 'caution' ? 'caution' : ''}`}
              >
                {al.message}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            padding: '10px 12px',
            background: 'var(--paper-highlight)',
            border: '1.5px solid #5A3E28',
            borderRadius: '3px',
            marginBottom: '10px'
          }}
        >
          <strong style={{ fontFamily: 'var(--font-serif)' }}>Luận giải Y lý chuẩn:</strong>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>
            <GlossaryText text={patientCase.clinicalExplanation} />
          </p>
        </div>

        {(result.herbNotes.length > 0 || result.acupointNotes.length > 0) && (
          <div style={{ marginBottom: '10px', fontSize: '0.86rem' }}>
            <strong>Chi tiết đơn thuốc &amp; huyệt của bạn:</strong>
            <ul style={{ margin: '6px 0', paddingLeft: '18px' }}>
              {result.herbNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
              {result.acupointNotes.map((note, idx) => (
                <li key={`pt-${idx}`}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        <div
          style={{
            padding: '10px 12px',
            background: 'var(--herbal-jade-soft)',
            border: '1px solid rgba(35,87,76,0.45)',
            borderRadius: '2px',
            fontSize: '0.88rem',
            marginBottom: '14px'
          }}
        >
          <strong style={{ color: 'var(--herbal-jade)' }}>Ứng dụng Nam dược đời thường:</strong>{' '}
          {patientCase.realLifeTakeaway}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          {onOpenLedger ? (
            <button type="button" className="btn-secondary" onClick={onOpenLedger}>
              Mở Sổ Lưu Y Án
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Xem lại đơn trên bàn khám
            </button>
            <button type="button" className="btn-cinnabar" onClick={onNextCase}>
              Đón người bệnh tiếp theo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
