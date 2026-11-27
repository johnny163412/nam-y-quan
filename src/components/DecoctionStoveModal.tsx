import React, { useState } from 'react';
import { HERB_MAP } from '../data/herbs';
import { ACUPOINT_MAP } from '../data/acupoints';
import { apothecaryAudio } from '../engine/audio';
import { getRecommendedDecoction } from '../engine/tcmEngine';
import { DecoctionChoice, DosingAdvice, FireType, PatientCase, PrescriptionSlots } from '../types/tcm';

interface DecoctionStoveModalProps {
  patientCase: PatientCase;
  slots: PrescriptionSlots;
  selectedAcupoints: string[];
  onCancel: () => void;
  onConfirmDecoction: (choice: DecoctionChoice) => void;
}

const FIRE_OPTIONS: { id: FireType; title: string; subtitle: string }[] = [
  {
    id: 'vu-hoa',
    title: 'Vũ Hỏa (Lửa lớn sôi nhanh 10–15 phút)',
    subtitle: 'Giữ nguyên tinh dầu thơm cho thuốc giải biểu, thanh phế.'
  },
  {
    id: 'van-vu',
    title: 'Văn Vũ Hỏa (Đun sôi bùng rồi hạ lửa vừa 20–25 phút)',
    subtitle: 'Cân bằng giữa hành khí thanh nhiệt và chiết dược lực vừa phải.'
  },
  {
    id: 'van-hoa',
    title: 'Văn Hỏa (Lửa nhỏ riu riu 35–45 phút)',
    subtitle: 'Chiết kiệt tinh chất đậm đặc cho thuốc bổ tạng phủ, rễ củ dày.'
  }
];

const DOSING_OPTIONS: { id: DosingAdvice; title: string; subtitle: string }[] = [
  {
    id: 'nong-dap-chan',
    title: 'Uống nóng — đắp chăn mỏng cho râm ran mồ hôi',
    subtitle: 'Trợ dương khí tán hàn tà ra ngoài hoặc làm ấm bụng.'
  },
  {
    id: 'am-thoang-gio',
    title: 'Uống ấm vừa — nghỉ nơi thoáng mát tránh ủ nóng',
    subtitle: 'Giữ thanh khí hạ nhiệt, tránh ủ bí làm tăng hỏa.'
  },
  {
    id: 'am-duong-tang',
    title: 'Uống ấm chia 2 lần sau bữa ăn',
    subtitle: 'Êm dịu cho Tỳ Vị, giúp tạng phủ hấp thu sâu dưỡng chất.'
  }
];

export const DecoctionStoveModal: React.FC<DecoctionStoveModalProps> = ({
  patientCase,
  slots,
  selectedAcupoints,
  onCancel,
  onConfirmDecoction
}) => {
  const recommended = getRecommendedDecoction(patientCase);
  const [fire, setFire] = useState<FireType>('van-vu');
  const [dosing, setDosing] = useState<DosingAdvice>('am-duong-tang');

  const assignedHerbs = Object.values(slots)
    .filter(Boolean)
    .map((id) => HERB_MAP[id!]?.name)
    .filter(Boolean);

  const chosenPoints = selectedAcupoints
    .map((id) => ACUPOINT_MAP[id]?.name)
    .filter(Boolean);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Bếp siêu đất nung sắc thuốc">
      <div className="woodblock-sheet modal-scroll">
        <div className="section-heading">
          <span>Canh Lửa Siêu Đất Nung — Sắc Thuốc Trao {patientCase.patientName}</span>
          <span className="tag-badge">Chứng: {patientCase.seasonTag}</span>
        </div>

        <div className={`stove-scene-frame fire-${fire}`}>
          <img
            src="./art/tools/decoction-stove.webp"
            alt="Siêu đất nung sắc thuốc trên bếp than hồng"
            className="stove-scene-img"
          />
          <div className="stove-ember-glow" aria-hidden="true" />
          <div className="stove-steam-layer" aria-hidden="true">
            <span className="steam-wisp w1" />
            <span className="steam-wisp w2" />
            <span className="steam-wisp w3" />
          </div>
          <div className="stove-pot-caption">
            <span>
              <strong>Trong siêu:</strong> {assignedHerbs.join(', ') || 'Chưa có vị thuốc'}
              {chosenPoints.length > 0 ? ` | Phối huyệt: ${chosenPoints.join(', ')}` : ''}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <strong style={{ display: 'block', fontFamily: 'var(--font-serif)', marginBottom: '6px' }}>
            1. Chọn Độ Lửa Sắc Thuốc (Hỏa hầu):
          </strong>
          <div className="inquiry-grid">
            {FIRE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`exam-option-plaque ${fire === opt.id ? 'picked' : ''}`}
                onClick={() => {
                  setFire(opt.id);
                  apothecaryAudio.playStoveSimmer(opt.id === 'vu-hoa');
                }}
              >
                <div style={{ fontWeight: 700, color: fire === opt.id ? '#E7B96A' : 'var(--ivory-text)' }}>
                  {opt.title}
                </div>
                <div className="opt-detail">{opt.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <strong style={{ display: 'block', fontFamily: 'var(--font-serif)', marginBottom: '6px' }}>
            2. Dặn Dò Cách Uống &amp; Kiêng Kỵ Sinh Hoạt:
          </strong>
          <div className="inquiry-grid">
            {DOSING_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`exam-option-plaque ${dosing === opt.id ? 'picked' : ''}`}
                onClick={() => {
                  setDosing(opt.id);
                  apothecaryAudio.playPageTurn();
                }}
              >
                <div style={{ fontWeight: 700, color: dosing === opt.id ? '#E7B96A' : 'var(--ivory-text)' }}>
                  {opt.title}
                </div>
                <div className="opt-detail">{opt.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="muted-note" style={{ marginBottom: '12px', fontSize: '0.82rem' }}>
          Mẹo Y gia: Dựa vào chứng trạng đã chốt ({recommended.rationale.split('.')[0]}), hãy cân nhắc độ lửa thích hợp để giữ trọn khí vị thang thuốc.
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Quay lại chỉnh đơn thuốc
          </button>
          <button
            type="button"
            className="btn-cinnabar"
            onClick={() => onConfirmDecoction({ fire, dosing })}
          >
            Rót Thuốc Trao Người Bệnh &amp; Luận Án
          </button>
        </div>
      </div>
    </div>
  );
};
