import React from 'react';
import { followUpLetterText } from '../../engine/followUp';
import type { PendingFollowUp } from '../../types/tcm';
import { GlossaryText } from '../GlossaryText';

interface FollowUpLetterModalProps {
  fu: PendingFollowUp;
  onClose: () => void;
  onInvite: () => void;
}

export const FollowUpLetterModal: React.FC<FollowUpLetterModalProps> = ({ fu, onClose, onInvite }) => (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Thư của ${fu.patientName}`}>
      <div className="woodblock-sheet follow-up-letter-sheet">
        <div className="section-heading">
          <span>Thư báo tái khám</span>
        </div>
        <p className="follow-up-letter-body">
          <GlossaryText text={followUpLetterText(fu)} />
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Để sau
          </button>
          <button
            type="button"
            className="btn-cinnabar"
            onClick={onInvite}
          >
            Mời {fu.patientName} vào
          </button>
        </div>
      </div>
    </div>
);
