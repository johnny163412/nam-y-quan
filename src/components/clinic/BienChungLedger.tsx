import React from 'react';
import { BIEN_CHUNG_MAX_ATTEMPTS, BIEN_CHUNG_MIN_CLUES, BienChungRecord } from '../../engine/tcmEngine';
import type { DiagnosisChoice } from '../../types/tcm';
import { ELEMENT_FULL } from '../EightPrinciplesCompass';
import { GlossaryText } from '../GlossaryText';

interface BienChungLedgerProps {
  diagnosis: DiagnosisChoice;
  pickedAxes: (keyof DiagnosisChoice)[];
  clues: string[];
  bienChung: BienChungRecord;
  ledgerFx: 'sealed' | 'rejected' | null;
  onSeal: () => void;
}

export const BienChungLedger: React.FC<BienChungLedgerProps> = ({ diagnosis, pickedAxes, clues, bienChung, ledgerFx, onSeal }) => {
  const inkLeft = BIEN_CHUNG_MAX_ATTEMPTS - bienChung.failedAttempts;
  const ready = clues.length >= BIEN_CHUNG_MIN_CLUES && pickedAxes.length === 4;
  const axisText = (axis: keyof DiagnosisChoice, text: string) => (pickedAxes.includes(axis) ? text : '?');
  return (
        <section
          className={`bien-chung-ledger ${bienChung.sealed ? 'is-sealed' : ''} ${
            ledgerFx === 'rejected' ? 'is-rejected' : ''
          }`}
          aria-label="Sổ Biện Chứng"
        >
          {bienChung.sealed && (
            <span className={`bien-chung-seal ${ledgerFx === 'sealed' ? 'is-slamming' : ''}`} aria-hidden="true">
              證
            </span>
          )}
          <header className="bien-chung-head">
            <strong>Sổ Biện Chứng</strong>
            <span className="muted-note">
              {bienChung.sealed ? 'Đã ấn chứng' : `Còn ${inkLeft}/${BIEN_CHUNG_MAX_ATTEMPTS} nét mực`}
            </span>
          </header>
          <p className="bien-chung-line">
            {axisText('location', diagnosis.location === 'bieu' ? 'Biểu' : 'Lý')} ·{' '}
            {axisText('nature', diagnosis.nature === 'han' ? 'Hàn' : 'Nhiệt')} ·{' '}
            {axisText('state', diagnosis.state === 'hu' ? 'Hư' : 'Thực')} · tạng chủ:{' '}
            {axisText('primaryElement', ELEMENT_FULL[diagnosis.primaryElement])}
          </p>
          <div className="clue-list">
            {clues.map((c, i) => (
              <span key={i} className="clue-chip">
                <GlossaryText text={c} />
              </span>
            ))}
          </div>
          {bienChung.sealed ? (
            <p className="bien-chung-note">
              Biện chứng đúng trọn bốn trục. La bàn đã khóa — hãy lập phương theo đúng chứng này.
            </p>
          ) : inkLeft <= 0 ? (
            <p className="bien-chung-note">
              Đã cạn mực. Vẫn có thể bốc thuốc, nhưng mỗi nét sai trừ 4 điểm Chẩn đoán.
            </p>
          ) : (
            <>
              <p className="bien-chung-note">
                Sổ chỉ ấn chứng khi cả Biểu/Lý, Hàn/Nhiệt, Hư/Thực và tạng chủ đều đúng — không chỉ ra trục nào sai.
                Mỗi nét sai trừ 4 điểm Chẩn đoán; đúng ngay nét đầu được thưởng 3 điểm.
              </p>
              <button
                type="button"
                className="btn-cinnabar"
                style={{ width: '100%' }}
                disabled={!ready}
                onClick={onSeal}
              >
                {clues.length < BIEN_CHUNG_MIN_CLUES
                  ? `Thu thêm chứng trạng (${clues.length}/${BIEN_CHUNG_MIN_CLUES})`
                  : pickedAxes.length < 4
                  ? `Tự chọn đủ 4 trục trên la bàn (${pickedAxes.length}/4)`
                  : 'Ấn chứng vào sổ'}
              </button>
            </>
          )}
        </section>
  );
};
