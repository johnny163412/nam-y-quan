import React from 'react';
import { ACUPOINT_MAP } from '../data/acupoints';
import { HERB_MAP } from '../data/herbs';
import { CaseLedgerEntry, PaoZhiMethod, RoleSlot } from '../types/tcm';

interface CaseLedgerModalProps {
  entries: CaseLedgerEntry[];
  onClose: () => void;
}

const PAO_ZHI_LABELS: Record<PaoZhiMethod, string> = {
  'sinh-dung': 'Để mộc',
  'gia-dap': 'Giã dập',
  'sao-vang': 'Sao vàng',
  'chich-mat': 'Chích mật'
};

export const CaseLedgerModal: React.FC<CaseLedgerModalProps> = ({ entries, onClose }) => {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Sổ Lưu Y Án Tuệ Tâm Đường">
      <div className="woodblock-sheet modal-scroll sac-phong-frame">
        <div className="section-heading">
          <span>Sổ Lưu Y Án — Tuệ Tâm Đường ({entries.length} ca đã trị)</span>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Gấp sổ lại
          </button>
        </div>

        <p className="muted-note" style={{ marginTop: 0 }}>
          Ghi chép lại những thang thuốc bạn đã cân, phép bào chế, huyệt đạo và thư hồi âm người bệnh gửi về y quán sau ba ngày dùng thuốc.
        </p>

        {entries.length === 0 ? (
          <div className="wood-parchment-panel" style={{ textAlign: 'center' }}>
            Chưa có ca bệnh nào được ghi vào sổ. Hãy khám và đóng ấn đơn thuốc đầu tiên!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {entries.map((item) => {
              const herbList = (['quan', 'than', 'ta', 'su'] as RoleSlot[])
                .map((role) => {
                  const id = item.slots[role];
                  if (!id) return null;
                  const h = HERB_MAP[id];
                  const pz = item.paoZhi?.[role];
                  const roleShort =
                    role === 'quan' ? 'Quân' : role === 'than' ? 'Thần' : role === 'ta' ? 'Tá' : 'Sứ';
                  return `${roleShort}: ${h?.name ?? id}${pz && pz !== 'sinh-dung' ? ` (${PAO_ZHI_LABELS[pz]})` : ''}`;
                })
                .filter(Boolean);

              const pointNames = item.acupoints
                .map((id) => ACUPOINT_MAP[id]?.name ?? id)
                .filter(Boolean);

              return (
                <article key={item.id} className="ledger-entry-card">
                  <div className="ledger-entry-head">
                    <div>
                      <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '0.98rem' }}>
                        {item.patientName}
                      </strong>{' '}
                      <span className="muted-note">— {item.caseTitle}</span>
                    </div>
                    <span
                      className="tag-badge"
                      style={{
                        background: item.passed ? '#23574C' : '#8E231D',
                        borderColor: '#CFA052'
                      }}
                    >
                      {item.totalScore}đ · {item.grade}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', marginTop: '6px', color: 'var(--ink-primary)' }}>
                    <strong>Đơn thuốc:</strong> {herbList.join(' · ') || 'Chỉ châm cứu'}
                    {pointNames.length > 0 && (
                      <span>
                        {' '}
                        | <strong>Huyệt:</strong> {pointNames.join(', ')}
                        {item.moxaEnabled ? ' (Có hơ Ngải cứu)' : ''}
                      </span>
                    )}
                  </div>

                  {item.followUpLetter && (
                    <blockquote className="follow-up-letter ledger-letter">
                      <span className="letter-stamp">Thư hồi âm sau 3 ngày</span>
                      {item.followUpLetter}
                    </blockquote>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
