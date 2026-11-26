import React from 'react';
import { EvaluationResult, PatientCase } from '../types/tcm';

interface OutcomeScrollModalProps {
  patientCase: PatientCase;
  result: EvaluationResult;
  onClose: () => void;
  onNextCase: () => void;
}

export const OutcomeScrollModal: React.FC<OutcomeScrollModalProps> = ({
  patientCase,
  result,
  onClose,
  onNextCase
}) => {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Y án luận trị">
      <div className="woodblock-sheet modal-scroll">
        <div className="section-heading">
          <span>Y Án Luận Trị — {patientCase.patientName}</span>
          <span className="seal-stamp-badge">{result.grade}</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '12px',
            padding: '10px 12px',
            background: 'var(--paper-aged)',
            border: '1px solid rgba(42,33,27,0.35)',
            borderRadius: '2px'
          }}
        >
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: result.passed ? 'var(--herbal-jade)' : 'var(--cinnabar)' }}>
            {result.totalScore}/100 điểm
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--ink-primary)' }}>
            <div>Biện chứng Bát Cương: <strong>{result.diagnosisScore}/30</strong></div>
            <div>Phối ngũ &amp; Huyệt đạo: <strong>{result.treatmentScore}/70</strong></div>
            {result.safetyPenalty > 0 && (
              <div style={{ color: 'var(--cinnabar)', fontWeight: 700 }}>
                Trừ điểm Cấm kỵ Y gia: -{result.safetyPenalty}
              </div>
            )}
          </div>
        </div>

        <p style={{ fontWeight: 600, margin: '0 0 10px' }}>{result.summaryFeedback}</p>

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
            background: 'rgba(255,252,244,0.75)',
            border: '1px solid rgba(42,33,27,0.3)',
            borderRadius: '2px',
            marginBottom: '10px'
          }}
        >
          <strong style={{ fontFamily: 'var(--font-serif)' }}>Luận giải Y lý chuẩn:</strong>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>{patientCase.clinicalExplanation}</p>
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Xem lại đơn trên bàn khám
          </button>
          <button type="button" className="btn-cinnabar" onClick={onNextCase}>
            Đón người bệnh tiếp theo
          </button>
        </div>
      </div>
    </div>
  );
};
