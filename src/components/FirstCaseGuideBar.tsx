import React from 'react';
import { AntiqueIcon } from './svg/AntiqueIcons';

interface FirstCaseGuideBarProps {
  activeRoom: 0 | 1 | 2 | 3;
  clueCount: number;
  assignedHerbCount: number;
  hasPaoZhi: boolean;
  selectedAcupointCount: number;
  onGoRoom: (room: 0 | 1 | 2 | 3) => void;
  onDismiss: () => void;
}

export const FirstCaseGuideBar: React.FC<FirstCaseGuideBarProps> = ({
  activeRoom,
  clueCount,
  assignedHerbCount,
  hasPaoZhi,
  selectedAcupointCount,
  onGoRoom,
  onDismiss
}) => {
  const step1Done = clueCount >= 3;
  const step2Done = assignedHerbCount >= 2;
  const step3Done = activeRoom === 2 || selectedAcupointCount >= 1;

  const currentStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : 4;

  const steps: {
    num: 1 | 2 | 3 | 4;
    label: string;
    room: 0 | 1 | 2;
    done: boolean;
    hint: string;
  }[] = [
    {
      num: 1,
      label: 'Tứ Chẩn',
      room: 0,
      done: step1Done,
      hint: 'Chạm Soi Gương, Nghe Thở, rút Thẻ Vấn hoặc Bắt Mạch để gom ít nhất 3 chứng trạng rồi chốt Bát Cương.'
    },
    {
      num: 2,
      label: 'Bốc Thuốc & Bào Chế',
      room: 1,
      done: step2Done,
      hint: hasPaoZhi
        ? 'Tuyệt vời! Chọn thêm vị thuốc lên Cân Tiểu Ly rồi bấm "Gói Giấy Hồng Điều" sang Nội Các.'
        : 'Sang Dược Các, mở hộc tủ bốc ít nhất 2 vị lên đĩa Quân/Thần rồi thử chạm Cối Giã hoặc Chảo Sao.'
    },
    {
      num: 3,
      label: 'Kinh Lạc & Lò Sắc',
      room: 2,
      done: step3Done && activeRoom === 2,
      hint: 'Sang Nội Các, chạm huyệt đạo trên đồ hình nhân (hoặc bật Ngải cứu) và quạt lửa vào vùng sáng chuẩn.'
    },
    {
      num: 4,
      label: 'Dập Ấn Giao Thuốc',
      room: 2,
      done: false,
      hint: 'Chọn lời dặn cách uống rồi bấm nút đỏ "Dập Ấn Chu Sa · Giao Thuốc" để xem Sắc Phong kết quả!'
    }
  ];

  const activeTip = steps.find((s) => s.num === currentStep) ?? steps[0];

  return (
    <div className="onboarding-guide-bar" role="region" aria-label="Hướng dẫn Ca Khai Trương 4 bước">
      <div className="onboarding-guide-top">
        <div className="onboarding-steps-row">
          <span className="onboarding-badge">Ca Khai Trương</span>
          {steps.map((s) => (
            <button
              key={s.num}
              type="button"
              className={`onboarding-step-pill ${
                s.done ? 'is-done' : s.num === currentStep ? 'is-current' : ''
              }`}
              onClick={() => onGoRoom(s.room)}
            >
              <span className="step-num">
                {s.done ? <AntiqueIcon name="check-seal" size={11} /> : s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="onboarding-dismiss-btn"
          onClick={onDismiss}
          title="Ẩn thanh hướng dẫn (có thể tự do khám bệnh)"
        >
          Ẩn hướng dẫn ×
        </button>
      </div>
      <div className="onboarding-tip-line">
        <strong>Bước {currentStep}/4:</strong> {activeTip.hint}
      </div>
    </div>
  );
};
