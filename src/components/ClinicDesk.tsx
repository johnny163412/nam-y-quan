import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STORY_CASES, generateProceduralCase } from '../data/cases';
import { detectActiveFormulas } from '../data/formulas';
import { HERB_MAP, HERBS } from '../data/herbs';
import { ACUPOINT_MAP } from '../data/acupoints';
import { apothecaryAudio } from '../engine/audio';
import {
  assignHerbToSlot,
  computeTreatmentPreview,
  emptySlots,
  evaluateCaseSubmission,
  getIdealPaoZhi,
  getRecommendedDecoction,
  getTyNgoWatch
} from '../engine/tcmEngine';
import {
  CaseLedgerEntry,
  DecoctionChoice,
  DiagnosisChoice,
  DosingAdvice,
  EvaluationResult,
  FireType,
  Herb,
  PaoZhiMethod,
  PatientCase,
  PrescriptionSlots,
  RoleSlot,
  SlotPaoZhi
} from '../types/tcm';
import { CaseLedgerModal } from './CaseLedgerModal';
import { EightPrinciplesCompass } from './EightPrinciplesCompass';
import { GlossaryText } from './GlossaryText';
import { MeridianBodyMap } from './MeridianBodyMap';
import { OutcomeScrollModal } from './OutcomeScrollModal';
import { PulseCanvas } from './PulseCanvas';
import { BotanicalSvg } from './svg/BotanicalSvg';
import { HealerHandOverlay, ScoopAnimationState } from './svg/HealerHandOverlay';
import { TongueMirror } from './svg/TongueMirror';
import { VillagerPortrait } from './svg/VillagerPortrait';

interface ClinicDeskProps {
  unlockedChapter: 1 | 2 | 3;
  completedCases: Record<string, { bestScore: number }>;
  caseLedger: CaseLedgerEntry[];
  mentorDismissed: boolean;
  onDismissMentor: () => void;
  onCaseEvaluated: (
    patientCase: PatientCase,
    result: EvaluationResult,
    meta: { slots: PrescriptionSlots; acupoints: string[]; decoction?: DecoctionChoice }
  ) => void;
  onOpenCodexHerb: (herbId: string) => void;
}

const ROLE_META: { role: RoleSlot; title: string; weightLabel: string; hint: string }[] = [
  { role: 'quan', title: 'Quân dược', weightLabel: 'Chủ lực x1.25', hint: 'Đánh thẳng bệnh cơ chính' },
  { role: 'than', title: 'Thần dược', weightLabel: 'Trợ Quân x0.95', hint: 'Tăng cường tác dụng Quân' },
  { role: 'ta', title: 'Tá dược', weightLabel: 'Hỗ trợ x0.75', hint: 'Trị triệu chứng phụ / giảm độc' },
  { role: 'su', title: 'Sứ dược', weightLabel: 'Dẫn / Hòa x0.55', hint: 'Điều hòa thang thuốc (Cam thảo...)' }
];

const ROOM_META: { idx: 0 | 1 | 2; label: string; sub: string; bg: string }[] = [
  { idx: 0, label: 'I. Tiền Đường Tiếp Bệnh', sub: 'Tứ chẩn & La bàn Bát Cương', bg: '/art/scenes/room-tien-duong.jpg' },
  { idx: 1, label: 'II. Dược Các & Bào Chế', sub: 'Tủ Bách Tử, Sao giã & Cân Tiểu Ly', bg: '/art/scenes/room-duoc-cac.jpg' },
  { idx: 2, label: 'III. Nội Các & Hỏa Lò', sub: 'Kinh lạc Ngải cứu & Siêu đất nung', bg: '/art/scenes/room-noi-cac.jpg' }
];

const PAO_ZHI_OPTIONS: { id: PaoZhiMethod; label: string; badge: string }[] = [
  { id: 'sinh-dung', label: 'Để mộc', badge: 'Nguyên vị' },
  { id: 'gia-dap', label: 'Giã dập', badge: 'Cối đồng' },
  { id: 'sao-vang', label: 'Sao vàng', badge: 'Chảo ấm' },
  { id: 'chich-mat', label: 'Chích mật', badge: 'Nhuận bổ' }
];

const FIRE_OPTIONS: { id: FireType; title: string; subtitle: string }[] = [
  {
    id: 'vu-hoa',
    title: 'Vũ Hỏa (Lửa lớn 10–15p)',
    subtitle: 'Giữ hương tinh dầu giải biểu.'
  },
  {
    id: 'van-vu',
    title: 'Văn Vũ Hỏa (Sôi bùng rồi vừa)',
    subtitle: 'Quân bình thanh khí & chiết lực.'
  },
  {
    id: 'van-hoa',
    title: 'Văn Hỏa (Lửa riu riu 35–45p)',
    subtitle: 'Ninh kỹ tinh chất thuốc bổ rễ củ.'
  }
];

const DOSING_OPTIONS: { id: DosingAdvice; title: string }[] = [
  { id: 'nong-dap-chan', title: 'Uống nóng — đắp chăn mỏng' },
  { id: 'am-thoang-gio', title: 'Uống ấm vừa — nơi thoáng mát' },
  { id: 'am-duong-tang', title: 'Uống ấm chia 2 lần sau ăn' }
];

type ExamTab = 'vong' | 'van' | 'van-hoi' | 'thiet';

export const ClinicDesk: React.FC<ClinicDeskProps> = ({
  unlockedChapter,
  completedCases,
  caseLedger,
  mentorDismissed,
  onDismissMentor,
  onCaseEvaluated,
  onOpenCodexHerb
}) => {
  const [activeChapter, setActiveChapter] = useState<1 | 2 | 3>(1);
  const [selectedCase, setSelectedCase] = useState<PatientCase>(STORY_CASES[0]);
  const [procCounter, setProcCounter] = useState(1);
  const [activeRoom, setActiveRoom] = useState<0 | 1 | 2>(0);

  // Examination state
  const [examTab, setExamTab] = useState<ExamTab>('vong');
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [clues, setClues] = useState<string[]>([]);
  const [inspectedAudio, setInspectedAudio] = useState(false);
  const [auscultating, setAuscultating] = useState(false);

  // Diagnosis, Prescription, PaoZhi & Room 3 state
  const [diagnosis, setDiagnosis] = useState<DiagnosisChoice>({
    location: 'bieu',
    nature: 'han',
    state: 'thuc',
    primaryElement: 'kim'
  });
  const [slots, setSlots] = useState<PrescriptionSlots>(emptySlots());
  const [slotPaoZhi, setSlotPaoZhi] = useState<SlotPaoZhi>({});
  const [selectedSlot, setSelectedSlot] = useState<RoleSlot>('quan');
  const [openDrawerId, setOpenDrawerId] = useState<string | null>(null);
  const [hoveredHerb, setHoveredHerb] = useState<{ herb: Herb; left: number; top: number } | null>(null);
  const [packetWrapped, setPacketWrapped] = useState(false);
  const [selectedAcupoints, setSelectedAcupoints] = useState<string[]>([]);
  const [moxaEnabled, setMoxaEnabled] = useState(false);
  const [fire, setFire] = useState<FireType>('van-vu');
  const [dosing, setDosing] = useState<DosingAdvice>('am-duong-tang');

  // Floating Notebook, Ledger & Outcome Modals
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [outcome, setOutcome] = useState<EvaluationResult | null>(null);
  const [scoopAnim, setScoopAnim] = useState<ScoopAnimationState | null>(null);
  const [justScoopedRole, setJustScoopedRole] = useState<RoleSlot | null>(null);

  const deskRoom2Ref = useRef<HTMLDivElement | null>(null);
  const chestWrapRef = useRef<HTMLDivElement | null>(null);
  const panRefs = useRef<Record<RoleSlot, HTMLDivElement | null>>({
    quan: null,
    than: null,
    ta: null,
    su: null
  });
  const herbRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scoopCounterRef = useRef(0);

  const nowHour = new Date().getHours();
  const activeWatch = useMemo(() => getTyNgoWatch(nowHour), [nowHour]);
  const watchLightingClass =
    nowHour >= 5 && nowHour < 11
      ? 'lighting-morning'
      : nowHour >= 11 && nowHour < 18
      ? 'lighting-afternoon'
      : 'lighting-night';

  const switchRoom = useCallback((nextRoom: 0 | 1 | 2) => {
    setActiveRoom((cur) => {
      if (cur !== nextRoom) {
        apothecaryAudio.playRoomSlide();
        apothecaryAudio.setActiveRoom(nextRoom);
      }
      return nextRoom;
    });
  }, []);

  useEffect(() => {
    apothecaryAudio.setActiveRoom(activeRoom);
    apothecaryAudio.setElementMood(selectedCase.targetDiagnosis.primaryElement);
  }, [activeRoom, selectedCase.targetDiagnosis.primaryElement]);

  // Keyboard navigation between 3 rooms (1/2/3 or ArrowLeft/ArrowRight or A/D when not typing)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || outcome || showLedgerModal) {
        return;
      }
      if (e.key === '1') switchRoom(0);
      else if (e.key === '2') switchRoom(1);
      else if (e.key === '3') switchRoom(2);
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        switchRoom(Math.min(2, activeRoom + 1) as 0 | 1 | 2);
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        switchRoom(Math.max(0, activeRoom - 1) as 0 | 1 | 2);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeRoom, outcome, showLedgerModal, switchRoom]);

  const chapterCases = useMemo(
    () => STORY_CASES.filter((c) => c.chapter === activeChapter),
    [activeChapter]
  );

  const availableHerbs = useMemo(
    () => HERBS.filter((h) => h.chapter <= Math.max(unlockedChapter, selectedCase.chapter)),
    [unlockedChapter, selectedCase.chapter]
  );

  const preview = useMemo(
    () => computeTreatmentPreview(selectedCase, slots, selectedAcupoints),
    [selectedCase, slots, selectedAcupoints]
  );

  const activeFormulas = useMemo(() => detectActiveFormulas(slots), [slots]);
  const hasAssignedHerbs = Object.values(slots).some(Boolean);
  const hasAssignedTreatment = hasAssignedHerbs || selectedAcupoints.length > 0;
  const recommendedDecoction = useMemo(() => getRecommendedDecoction(selectedCase), [selectedCase]);

  const loadPatient = (nextCase: PatientCase) => {
    setSelectedCase(nextCase);
    setExamTab('vong');
    setAskedIds([]);
    setClues([`Chủ chứng: ${nextCase.seasonTag}`]);
    setInspectedAudio(false);
    setSlots(emptySlots());
    setSlotPaoZhi({});
    setSelectedSlot('quan');
    setOpenDrawerId(null);
    setHoveredHerb(null);
    setPacketWrapped(false);
    setSelectedAcupoints([]);
    setMoxaEnabled(false);
    setFire('van-vu');
    setDosing('am-duong-tang');
    setOutcome(null);
    switchRoom(0);
    apothecaryAudio.playPageTurn();
  };

  const handleSelectChapter = (ch: 1 | 2 | 3) => {
    setActiveChapter(ch);
    const first = STORY_CASES.find((c) => c.chapter === ch);
    if (first) loadPatient(first);
  };

  const handleSpawnProcedural = () => {
    const nextSeed = procCounter;
    setProcCounter((c) => c + 1);
    const pCase = generateProceduralCase(activeChapter, nextSeed);
    loadPatient(pCase);
  };

  const addClue = (tag: string) => {
    setClues((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  };

  const handlePlayAuscultation = () => {
    setAuscultating(true);
    apothecaryAudio.playAuscultation(selectedCase.auscultationType ?? 'cold-sniffle');
    if (!inspectedAudio) {
      setInspectedAudio(true);
      addClue(`Văn chẩn: ${selectedCase.audioObservation}`);
    }
    window.setTimeout(() => setAuscultating(false), 900);
  };

  const handleAskQuestion = (qId: string, clueTag: string) => {
    if (askedIds.includes(qId)) return;
    if (askedIds.length >= selectedCase.maxInquiries) return;
    setAskedIds((prev) => [...prev, qId]);
    addClue(clueTag);
    apothecaryAudio.playBambooTally();
  };

  const triggerScoopAnimation = useCallback((herb: Herb, role: RoleSlot) => {
    const container = deskRoom2Ref.current;
    const panEl = panRefs.current[role];
    const herbEl = herbRefs.current[herb.id];
    if (!container || !panEl) return;

    const cRect = container.getBoundingClientRect();
    const pRect = panEl.getBoundingClientRect();
    const hRect = herbEl?.getBoundingClientRect();

    const fromX = hRect ? hRect.left - cRect.left + hRect.width * 0.42 : cRect.width * 0.5;
    const fromY = hRect ? hRect.top - cRect.top + hRect.height * 0.35 : cRect.height * 0.72;
    const toX = pRect.left - cRect.left + pRect.width * 0.45;
    const toY = pRect.top - cRect.top + pRect.height * 0.42;

    scoopCounterRef.current += 1;
    const animId = scoopCounterRef.current;
    setScoopAnim({ id: animId, herb, fromX, fromY, toX, toY });

    window.setTimeout(() => {
      setJustScoopedRole(role);
      window.setTimeout(() => {
        setJustScoopedRole((cur) => (cur === role ? null : cur));
      }, 360);
    }, 420);
  }, []);

  const handleAssignHerb = (role: RoleSlot, herbId: string | null) => {
    const after = assignHerbToSlot(slots, role, herbId);
    setSlots(after);
    setPacketWrapped(false);
    setSlotPaoZhi((prev) => ({
      ...prev,
      [role]: herbId ? prev[role] ?? 'sinh-dung' : undefined
    }));
    if (herbId) {
      apothecaryAudio.playHerbDrop();
      const herbObj = HERB_MAP[herbId];
      if (herbObj) triggerScoopAnimation(herbObj, role);
      const nextOrder: RoleSlot[] = ['quan', 'than', 'ta', 'su'];
      const nextEmpty = nextOrder.find((r) => r !== role && !after[r]);
      if (nextEmpty) setSelectedSlot(nextEmpty);
    }
  };

  const handleSelectPaoZhi = (role: RoleSlot, method: PaoZhiMethod) => {
    setSlotPaoZhi((prev) => ({ ...prev, [role]: method }));
    if (method === 'gia-dap') apothecaryAudio.playMortarGrind();
    else if (method === 'sao-vang') apothecaryAudio.playWokSizzle(false);
    else if (method === 'chich-mat') apothecaryAudio.playWokSizzle(true);
    else apothecaryAudio.playPageTurn();
  };

  const handleToggleDrawer = (herb: Herb) => {
    setOpenDrawerId((cur) => {
      const opening = cur !== herb.id;
      apothecaryAudio.playDrawerSlide(opening);
      return opening ? herb.id : null;
    });
  };

  const handleScoopFromDrawer = (herb: Herb) => {
    handleAssignHerb(selectedSlot, herb.id);
    window.setTimeout(() => {
      setOpenDrawerId((cur) => {
        if (cur === herb.id) {
          apothecaryAudio.playDrawerSlide(false);
          return null;
        }
        return cur;
      });
    }, 460);
  };

  const handleDrawerHover = (herb: Herb, el: HTMLElement | null) => {
    const wrap = chestWrapRef.current;
    if (!wrap || !el) return;
    const tooltipW = 288;
    const wrapW = wrap.clientWidth || 520;
    const rawLeft = el.offsetLeft + el.offsetWidth / 2 - tooltipW / 2;
    const clampedLeft = Math.max(6, Math.min(Math.max(6, wrapW - tooltipW - 6), rawLeft));
    setHoveredHerb({
      herb,
      left: clampedLeft,
      top: el.offsetTop - 8
    });
  };

  const handleWrapHerbPacketAndGoRoom3 = () => {
    apothecaryAudio.playPaperFold();
    setPacketWrapped(true);
    window.setTimeout(() => {
      switchRoom(2);
    }, 460);
  };

  const handleToggleAcupoint = (ptId: string) => {
    setSelectedAcupoints((prev) =>
      prev.includes(ptId) ? prev.filter((id) => id !== ptId) : [...prev, ptId]
    );
    apothecaryAudio.playHerbDrop();
  };

  const handleFinalStampSubmit = () => {
    const decoctionPayload: DecoctionChoice | undefined =
      hasAssignedHerbs || selectedAcupoints.length > 0
        ? {
            fire,
            dosing,
            paoZhi: slotPaoZhi,
            moxaEnabled
          }
        : undefined;

    const res = evaluateCaseSubmission(
      selectedCase,
      diagnosis,
      slots,
      selectedAcupoints,
      decoctionPayload
    );
    apothecaryAudio.playSealStamp(res.passed);
    setOutcome(res);
    onCaseEvaluated(selectedCase, res, {
      slots,
      acupoints: selectedAcupoints,
      decoction: decoctionPayload
    });
  };

  const handleNextCase = () => {
    if (selectedCase.isProcedural) {
      handleSpawnProcedural();
      return;
    }
    const idx = STORY_CASES.findIndex((c) => c.id === selectedCase.id);
    if (idx >= 0 && idx + 1 < STORY_CASES.length) {
      const next = STORY_CASES[idx + 1];
      setActiveChapter(next.chapter);
      loadPatient(next);
    } else {
      handleSpawnProcedural();
    }
  };

  const natureClass = (nature: Herb['nature']) => {
    if (nature === 'Ôn' || nature === 'Nhiệt') return 'nature-hot';
    if (nature === 'Hàn' || nature === 'Đại hàn' || nature === 'Lương') return 'nature-cold';
    return 'nature-neutral';
  };

  const assignedHerbsSummary = (['quan', 'than', 'ta', 'su'] as RoleSlot[])
    .filter((r) => Boolean(slots[r]))
    .map((r) => HERB_MAP[slots[r]!]?.name)
    .filter(Boolean);

  const chosenPointNames = selectedAcupoints.map((id) => ACUPOINT_MAP[id]?.name).filter(Boolean);

  const mentorHint =
    activeRoom === 0
      ? 'Sư phụ dặn (Bước 1/3): Hãy soi Gương lưỡi, nghe Văn chẩn, hỏi thẻ tre và ấn 3 ngón Thốn–Quan–Xích rồi gạt La bàn Bát Cương sang hướng bệnh.'
      : activeRoom === 1
      ? 'Sư phụ dặn (Bước 2/3): Trỏ chuột vào hộc tủ Bách Tử để đọc dược tính, kéo hộc bốc vị thuốc lên 4 đĩa Quân–Thần–Tá–Sứ (có thể Sao vàng / Giã dập tăng công hiệu) rồi Gói giấy hồng điều.'
      : 'Sư phụ dặn (Bước 3/3): Chọn độ lửa Vũ/Văn hỏa phù hợp với thang thuốc (và hơ Ngải cứu nếu mở kinh lạc ở Chương 3), rồi Đóng Ấn giao thuốc!';

  return (
    <div className={`clinic-stage ${watchLightingClass}`}>
      {/* Case & Chapter Toolbar + Ledger Button */}
      <div className="case-toolbar">
        <div className="chapter-pills">
          <span style={{ fontWeight: 700, fontSize: '0.88rem', marginRight: '4px' }}>Lộ trình:</span>
          {([1, 2, 3] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              className={`chapter-btn ${activeChapter === ch ? 'active' : ''}`}
              disabled={ch > unlockedChapter}
              onClick={() => handleSelectChapter(ch)}
              title={
                ch > unlockedChapter
                  ? `Cần vượt qua Khảo Thí Y Miếu Chương ${ch - 1} hoặc hoàn thành các ca trước để mở khóa`
                  : undefined
              }
            >
              Chương {ch}
              {ch === 1
                ? ': Biểu Lý Hàn Nhiệt'
                : ch === 2
                ? ': Tạng Phủ Ngũ Hành'
                : ': Kinh Lạc Bấm Huyệt'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <select
            aria-label="Chọn bệnh nhân trong chương"
            className="case-select"
            value={selectedCase.isProcedural ? 'procedural' : selectedCase.id}
            onChange={(e) => {
              const found = STORY_CASES.find((c) => c.id === e.target.value);
              if (found) loadPatient(found);
            }}
          >
            {chapterCases.map((c) => {
              const done = completedCases[c.id];
              return (
                <option key={c.id} value={c.id}>
                  {c.title} {done ? `(Đã đạt ${done.bestScore}đ)` : ''}
                </option>
              );
            })}
            {selectedCase.isProcedural && (
              <option value="procedural">{selectedCase.title}</option>
            )}
          </select>

          <button type="button" className="btn-secondary" onClick={handleSpawnProcedural}>
            Đón Khách Vãng Lai
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              apothecaryAudio.playPageTurn();
              setShowLedgerModal(true);
            }}
          >
            Sổ Lưu Y Án ({caseLedger.length})
          </button>
        </div>
      </div>

      {/* Mentor Scroll Bar for First-Time Guidance (1-click dismissable) */}
      {!mentorDismissed && (
        <div className="mentor-bamboo-bar" role="status">
          <div className="mentor-text">
            <span className="speaker-seal doctor">Tổ Sư Nhắn Nhủ</span>
            {mentorHint}
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '3px 9px', fontSize: '0.76rem', flexShrink: 0 }}
            onClick={onDismissMentor}
          >
            Ẩn hướng dẫn
          </button>
        </div>
      )}

      {/* Three-Room Potion-Craft Navigation Bar */}
      <div className="room-nav-bar" role="tablist" aria-label="Di chuyển giữa 3 buồng y quán">
        {ROOM_META.map((room) => {
          const isCurrent = activeRoom === room.idx;
          return (
            <button
              key={room.idx}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              className={`room-plaque-tab ${isCurrent ? 'active' : ''}`}
              onClick={() => switchRoom(room.idx)}
            >
              <span className="room-plaque-title">{room.label}</span>
              <span className="room-plaque-sub">{room.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Horizontal Sliding Three-Room Workbench Viewport */}
      <div className="apothecary-room-viewport">
        <div
          className="apothecary-room-track"
          style={{ transform: `translate3d(-${activeRoom * 33.333333}%, 0, 0)` }}
        >
          {/* ================= ROOM 1: TIỀN ĐƯỜNG TIẾP BỆNH ================= */}
          <section
            className={`apothecary-room ${activeRoom === 0 ? 'is-active-room' : ''}`}
            aria-label="Buồng 1: Tiền Đường Tiếp Bệnh"
          >
            <div className="room-stage-backdrop">
              <img
                src="/art/scenes/room-tien-duong.jpg"
                alt="Tiền Đường tiệm thuốc Nam nhìn qua rèm trúc"
                className="room-bg-img"
              />
              <div className="room-ambient-wash" aria-hidden="true" />
              <div className="room-stage-header">
                <div>
                  <h2 className="room-stage-title">{selectedCase.title}</h2>
                  <p className="room-stage-sub">
                    Canh giờ {activeWatch.branch} ({activeWatch.organ} vượng) · Phím tắt <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> hoặc <kbd>←</kbd>/<kbd>→</kbd> để trượt buồng
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-cinnabar"
                  onClick={() => switchRoom(1)}
                >
                  Sang Dược Các Bốc Thuốc →
                </button>
              </div>
            </div>

            <div className="desk-grid room-inner-grid">
              {/* Patient Consultation & Tứ Chẩn */}
              <div className="woodblock-sheet stitched-binding">
                <div className="patient-banner">
                  <div className="silk-scroll-mount" aria-hidden="true">
                    <div className="scroll-rod-cap" />
                    <VillagerPortrait patientCase={selectedCase} />
                    <div className="scroll-rod-cap" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'var(--ivory-text)' }}>
                        {selectedCase.patientName}
                      </strong>
                      <span className="muted-note">({selectedCase.age} tuổi — {selectedCase.patientRole})</span>
                      {selectedCase.isPregnant && (
                        <span className="tag-badge pregnant">Thai phụ (Thận trọng Cấm kỵ)</span>
                      )}
                    </div>
                    <div className="wood-speech-bubble">
                      「 <GlossaryText text={selectedCase.chiefComplaint} /> 」
                    </div>
                  </div>
                </div>

                <div className="exam-tabs" role="tablist" aria-label="Công cụ Tứ Chẩn">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={examTab === 'vong'}
                    className={`exam-tab-btn ${examTab === 'vong' ? 'active' : ''}`}
                    onClick={() => setExamTab('vong')}
                  >
                    1. Vọng (Soi lưỡi)
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={examTab === 'van'}
                    className={`exam-tab-btn ${examTab === 'van' ? 'active' : ''}`}
                    onClick={() => setExamTab('van')}
                  >
                    2. Văn (Nghe thở)
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={examTab === 'van-hoi'}
                    className={`exam-tab-btn ${examTab === 'van-hoi' ? 'active' : ''}`}
                    onClick={() => setExamTab('van-hoi')}
                  >
                    3. Vấn ({askedIds.length}/{selectedCase.maxInquiries})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={examTab === 'thiet'}
                    className={`exam-tab-btn ${examTab === 'thiet' ? 'active' : ''}`}
                    onClick={() => setExamTab('thiet')}
                  >
                    4. Thiết (3 ngón mạch)
                  </button>
                </div>

                <div className="exam-panel">
                  {examTab === 'vong' && (
                    <div>
                      <p style={{ margin: '0 0 10px', fontSize: '0.88rem' }}>
                        <strong>Thần sắc bên ngoài:</strong>{' '}
                        <GlossaryText text={selectedCase.visualAppearance} />
                      </p>
                      <TongueMirror
                        tongue={selectedCase.tongue}
                        onInspectZone={(z) => addClue(`${z.label}: ${z.clueTag}`)}
                      />
                    </div>
                  )}

                  {examTab === 'van' && (
                    <div className="auscultation-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <strong>Lắng nghe thanh âm &amp; hơi thở (Văn chẩn):</strong>
                        <button
                          type="button"
                          className="btn-cinnabar"
                          style={{ padding: '6px 12px', fontSize: '0.84rem' }}
                          onClick={handlePlayAuscultation}
                        >
                          {auscultating ? 'Đang lắng nghe...' : 'Nghe hơi thở & tiếng ho'}
                        </button>
                      </div>
                      <div className={`auscultation-wave ${auscultating ? 'is-playing' : ''}`} aria-hidden="true">
                        <span /><span /><span /><span /><span /><span /><span /><span />
                      </div>
                      <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-serif)', fontSize: '0.96rem' }}>
                        <GlossaryText text={selectedCase.audioObservation} />
                      </p>
                    </div>
                  )}

                  {examTab === 'van-hoi' && (
                    <div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', marginBottom: '8px' }}>
                        Đối thoại Vấn chẩn (chọn tối đa {selectedCase.maxInquiries} thẻ tre câu hỏi, còn{' '}
                        <strong>{selectedCase.maxInquiries - askedIds.length}</strong> lượt):
                      </div>

                      <div className="wooden-chat-log" aria-live="polite">
                        <div className="chat-turn-patient">
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C1A14', marginBottom: '2px' }}>
                            {selectedCase.patientName} thưa:
                          </div>
                          “<GlossaryText text={selectedCase.chiefComplaint} />”
                        </div>
                        {selectedCase.inquiries
                          .filter((q) => askedIds.includes(q.id))
                          .map((q) => (
                            <React.Fragment key={q.id}>
                              <div className="chat-turn-doctor">
                                <span className="speaker-seal doctor">Lương Y</span> {q.question}
                              </div>
                              <div className="chat-turn-patient">
                                <span className="speaker-seal patient">{selectedCase.patientName}</span>“{q.answer}”
                                <div style={{ fontSize: '0.78rem', color: 'var(--herbal-jade)', fontWeight: 700, marginTop: '3px' }}>
                                  Ghi nhận: <GlossaryText text={q.clueTag} />
                                </div>
                              </div>
                            </React.Fragment>
                          ))}
                      </div>

                      <div className="inquiry-grid">
                        {selectedCase.inquiries
                          .filter((q) => !askedIds.includes(q.id))
                          .map((q) => {
                            const limitReached = askedIds.length >= selectedCase.maxInquiries;
                            return (
                              <button
                                key={q.id}
                                type="button"
                                className="bamboo-tally-btn"
                                disabled={limitReached}
                                onClick={() => handleAskQuestion(q.id, q.clueTag)}
                              >
                                <span style={{ color: '#E7B96A', fontWeight: 700 }}>[{q.topic}]</span> {q.question}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {examTab === 'thiet' && (
                    <PulseCanvas
                      pulse={selectedCase.pulse}
                      onDepthInspected={(d) =>
                        addClue(
                          d === 'phu'
                            ? `Phù thủ: ${selectedCase.pulse.phuFinding}`
                            : `Trầm thủ: ${selectedCase.pulse.tramFinding}`
                        )
                      }
                      onFingerInspected={(_, finding) => addClue(finding)}
                    />
                  )}
                </div>

                <div className="clue-drawer">
                  <strong style={{ fontSize: '0.86rem' }}>Phiếu Chứng Trạng Đã Thu Thập:</strong>
                  <div className="clue-list">
                    {clues.length === 0 ? (
                      <span className="muted-note">Hãy soi lưỡi, nghe thở, hỏi bệnh hoặc bắt mạch để ghi nhận triệu chứng.</span>
                    ) : (
                      clues.map((c, idx) => (
                        <span key={idx} className="clue-chip">
                          <GlossaryText text={c} />
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side of Room 1: La bàn Bát Cương */}
              <div className="woodblock-sheet">
                <EightPrinciplesCompass
                  initialVector={selectedCase.initialVector}
                  previewVector={preview.resultingVector}
                  balanceScore={preview.balanceScore}
                  diagnosis={diagnosis}
                  onChangeDiagnosis={setDiagnosis}
                  showTreatmentProjection={hasAssignedTreatment}
                />

                <div className="room-cta-box">
                  <p className="muted-note" style={{ margin: '0 0 8px' }}>
                    Đã xác định được <strong>Biểu/Lý — Hàn/Nhiệt — Hư/Thực</strong> và Tạng Phủ chính? Hãy bước sang <strong>Dược Các</strong> để kéo hộc tủ bốc thuốc lên Cân Tiểu Ly!
                  </p>
                  <button
                    type="button"
                    className="btn-cinnabar"
                    style={{ width: '100%' }}
                    onClick={() => switchRoom(1)}
                  >
                    Bước sang II. Dược Các &amp; Cân Tiểu Ly →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ================= ROOM 2: DƯỢC CÁC, BÀO CHẾ & CÂN TIỂU LY ================= */}
          <section
            className={`apothecary-room ${activeRoom === 1 ? 'is-active-room' : ''}`}
            aria-label="Buồng 2: Dược Các và Bào Chế"
          >
            <div className="room-stage-backdrop">
              <img
                src="/art/scenes/room-duoc-cac.jpg"
                alt="Tường Tủ Bách Tử và bàn cân thuốc Nam"
                className="room-bg-img"
              />
              <div className="room-ambient-wash" aria-hidden="true" />
              <div className="room-stage-header">
                <div>
                  <h2 className="room-stage-title">Dược Các — Cân Tiểu Ly &amp; Bào Chế</h2>
                  <p className="room-stage-sub">
                    Trỏ chuột xem dược tính · Nhấp hộc tủ gỗ để kéo ngăn bốc vào Quân / Thần / Tá / Sứ
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-secondary" onClick={() => switchRoom(0)}>
                    ← Về Tiền Đường
                  </button>
                  <button type="button" className="btn-cinnabar" onClick={handleWrapHerbPacketAndGoRoom3}>
                    Gấp Gói Hồng Điều &amp; Sang Bếp Sắc →
                  </button>
                </div>
              </div>
            </div>

            <div ref={deskRoom2Ref} className="woodblock-sheet desk-right-col">
              <HealerHandOverlay
                scoop={scoopAnim}
                onComplete={(doneId) =>
                  setScoopAnim((cur) => (cur && cur.id === doneId ? null : cur))
                }
              />

              {/* Giá Cân Tiểu Ly Đồng Cổ tilting dynamically */}
              <div className="balance-beam-bar" aria-hidden="true">
                <svg width="100%" height="42" viewBox="0 0 440 42" fill="none">
                  <path d="M220 2 V16" stroke="#CFA052" strokeWidth="2.8" />
                  <circle cx="220" cy="16" r="5.5" fill="#D59E49" stroke="#2F231A" strokeWidth="1.4" />
                  <path d="M217 16 A3 3 0 0 1 223 16" fill="#2F231A" />
                  <g
                    style={{
                      transformOrigin: '220px 16px',
                      transform: `rotate(${
                        hasAssignedTreatment
                          ? Math.max(-6, Math.min(6, preview.resultingVector.coldHeat / 14))
                          : 0
                      }deg)`,
                      transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)'
                    }}
                  >
                    <path d="M46 16 Q133 9 220 15 Q307 9 394 16" stroke="#9C6B24" strokeWidth="3.6" strokeLinecap="round" />
                    <path d="M46 16 Q133 11 220 15 Q307 11 394 16" stroke="#E8BF6E" strokeWidth="1.1" opacity="0.7" fill="none" />
                    <circle cx="46" cy="16" r="3.2" fill="#2F231A" stroke="#D59E49" strokeWidth="1" />
                    <circle cx="162" cy="14" r="2.8" fill="#2F231A" stroke="#D59E49" strokeWidth="1" />
                    <circle cx="278" cy="14" r="2.8" fill="#2F231A" stroke="#D59E49" strokeWidth="1" />
                    <circle cx="394" cy="16" r="3.2" fill="#2F231A" stroke="#D59E49" strokeWidth="1" />
                    <path d="M46 18 L34 40 M46 18 L58 40" stroke="#A97B3B" strokeWidth="1.1" opacity="0.75" />
                    <path d="M162 16 L150 40 M162 16 L174 40" stroke="#A97B3B" strokeWidth="1.1" opacity="0.75" />
                    <path d="M278 16 L266 40 M278 16 L290 40" stroke="#A97B3B" strokeWidth="1.1" opacity="0.75" />
                    <path d="M394 18 L382 40 M394 18 L406 40" stroke="#A97B3B" strokeWidth="1.1" opacity="0.75" />
                  </g>
                </svg>
              </div>

              {/* 4 Brass Scale Pans + Optional PaoZhi Craft Strip */}
              <div className="scale-pans-grid">
                {ROLE_META.map((meta) => {
                  const herbId = slots[meta.role];
                  const herb = herbId ? HERB_MAP[herbId] : null;
                  const isActiveSlot = selectedSlot === meta.role;
                  const activeMethod: PaoZhiMethod = slotPaoZhi[meta.role] ?? 'sinh-dung';
                  const idealMethod = herb ? getIdealPaoZhi(herb.id).method : null;

                  return (
                    <div
                      key={meta.role}
                      ref={(el) => {
                        panRefs.current[meta.role] = el;
                      }}
                      className={`scale-pan ${isActiveSlot ? 'selected-slot' : ''} ${
                        herb ? 'filled' : ''
                      } ${justScoopedRole === meta.role ? 'just-scooped' : ''}`}
                      onClick={() => setSelectedSlot(meta.role)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedId = e.dataTransfer.getData('text/plain');
                        if (droppedId && HERB_MAP[droppedId]) {
                          handleAssignHerb(meta.role, droppedId);
                        }
                      }}
                    >
                      <div className="pan-header">
                        <span>{meta.title}</span>
                        <span>{meta.weightLabel}</span>
                      </div>
                      {herb ? (
                        <div className="pan-dish-wrap">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                            <BotanicalSvg herbId={herb.id} motif={herb.motif} size={46} />
                            <svg width="92" height="10" viewBox="0 0 92 10" fill="none" aria-hidden="true" style={{ marginTop: '-2px' }}>
                              <path d="M6 2 Q46 11 86 2" stroke="#9C6B24" strokeWidth="2.1" strokeLinecap="round" fill="rgba(156,107,36,0.14)" />
                            </svg>
                          </div>
                          <div className="pan-herb-name" style={{ textAlign: 'center', margin: '1px 0' }}>{herb.name}</div>
                          <span className={`nature-tag ${natureClass(herb.nature)}`} style={{ alignSelf: 'center' }}>
                            {herb.nature} — {herb.flavors[0]}
                          </span>

                          {/* Optional Bào Chế selector per herb */}
                          <div className="paozhi-mini-bar" onClick={(e) => e.stopPropagation()}>
                            {PAO_ZHI_OPTIONS.map((pz) => (
                              <button
                                key={pz.id}
                                type="button"
                                className={`paozhi-chip ${activeMethod === pz.id ? 'active' : ''}`}
                                onClick={() => handleSelectPaoZhi(meta.role, pz.id)}
                                title={
                                  pz.id === idealMethod && pz.id !== 'sinh-dung'
                                    ? `Khớp phép Bào chế cổ truyền (${pz.label})`
                                    : pz.badge
                                }
                              >
                                {pz.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--sand-muted)', margin: '6px 0' }}>
                          <GlossaryText text={meta.hint} />
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: herb
                              ? isActiveSlot
                                ? 'var(--cinnabar)'
                                : 'var(--ink-muted)'
                              : isActiveSlot
                              ? '#E7B96A'
                              : 'var(--sand-muted)',
                            fontWeight: isActiveSlot ? 700 : 400
                          }}
                        >
                          {isActiveSlot ? 'Đang chọn ngăn này' : 'Chạm để chọn'}
                        </span>
                        {herb && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '1px 6px', fontSize: '0.72rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignHerb(meta.role, null);
                            }}
                          >
                            Bỏ
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PaoZhi & Red Herb Packet Craft Bench Strip */}
              <div className="craft-bench-strip">
                <div className="craft-bench-item">
                  <img
                    src="/art/tools/paozhi-workbench.jpg"
                    alt="Cối giã đồng và chảo sao thuốc Bào chế"
                    className="craft-bench-thumb"
                  />
                  <div>
                    <strong style={{ fontSize: '0.84rem' }}>Khay Bào Chế Thủ Công</strong>
                    <div className="muted-note" style={{ fontSize: '0.76rem' }}>
                      Chọn <em>Sao vàng</em> cho rễ củ, <em>Giã dập</em> cho gừng/quế hoặc <em>Chích mật</em> cho cam thảo để cộng thêm điểm tinh thông (+1..+3đ).
                    </div>
                  </div>
                </div>

                <div className={`craft-bench-item packet-item ${packetWrapped ? 'is-wrapped' : ''}`}>
                  <img
                    src="/art/tools/red-herb-packet.jpg"
                    alt="Gói thuốc giấy hồng điều buộc dây gai"
                    className="craft-bench-thumb"
                  />
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.84rem' }}>
                      {packetWrapped ? 'Đã gấp gọn trong Giấy Hồng Điều!' : 'Nghi thức Gói Giấy Hồng Điều'}
                    </strong>
                    <div className="muted-note" style={{ fontSize: '0.76rem' }}>
                      {assignedHerbsSummary.length > 0
                        ? `Thang thuốc: ${assignedHerbsSummary.join(' · ')}`
                        : 'Cân xong các vị thuốc rồi gói giấy hồng điều mang sang bếp sắc.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Cổ Phương Synergy Banner */}
              {activeFormulas.length > 0 && (
                <div className="synergy-banner">
                  <strong style={{ color: '#E7B96A', fontFamily: 'var(--font-serif)' }}>
                    Cộng hưởng Cổ phương ({activeFormulas.map((f) => f.name).join(' + ')}):
                  </strong>{' '}
                  <span>{activeFormulas[0].principle}</span>
                </div>
              )}

              {/* Live Contraindication Alerts */}
              {preview.alerts.map((al, i) => (
                <div
                  key={`${al.sourceId}-${i}`}
                  className={`alert-banner ${al.severity === 'caution' ? 'caution' : ''}`}
                >
                  {al.message}
                </div>
              ))}

              {/* Tủ Thuốc Bách Tử — Wooden Đông Y Pull-Out Drawers & Hover Inspection */}
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', margin: '8px 0 6px' }}>
                Tủ Thuốc Bách Tử (Trỏ chuột xem dược tính • Nhấp hộc gỗ để kéo ngăn bốc vào{' '}
                <strong>{ROLE_META.find((r) => r.role === selectedSlot)?.title}</strong>):
              </div>

              <div
                ref={chestWrapRef}
                className="apothecary-chest-wrap"
                onMouseLeave={() => setHoveredHerb(null)}
              >
                {hoveredHerb && (
                  <div
                    className="herb-hover-tooltip"
                    role="tooltip"
                    style={{ left: `${hoveredHerb.left}px`, top: `${hoveredHerb.top}px` }}
                  >
                    <div className="tooltip-head">
                      <span className="tooltip-head-name">{hoveredHerb.herb.name}</span>
                      <span className="tooltip-head-sub">{hoveredHerb.herb.traditionalName}</span>
                    </div>
                    <div className="tooltip-body">
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                        <BotanicalSvg herbId={hoveredHerb.herb.id} motif={hoveredHerb.herb.motif} size={58} />
                        <div style={{ minWidth: 0 }}>
                          <span className={`nature-tag ${natureClass(hoveredHerb.herb.nature)}`}>
                            {hoveredHerb.herb.nature} ({hoveredHerb.herb.flavors.join(', ')})
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '3px' }}>
                            <strong>Bộ phận:</strong> {hoveredHerb.herb.partUsed}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--herbal-jade)', fontWeight: 700 }}>
                            <strong>Quy kinh:</strong> {hoveredHerb.herb.meridians.join(', ')}
                          </div>
                        </div>
                      </div>
                      <p style={{ margin: '0 0 5px', fontSize: '0.78rem', lineHeight: 1.4 }}>
                        <strong>Công năng:</strong> {hoveredHerb.herb.summary}
                      </p>
                      {(hoveredHerb.herb.contraindications.pregnancyLock ||
                        hoveredHerb.herb.contraindications.pregnancyCautionAsQuan ||
                        hoveredHerb.herb.contraindications.warningText) && (
                        <div className="tooltip-warn">
                          <strong>Kiêng kỵ:</strong> {hoveredHerb.herb.contraindications.warningText}
                        </div>
                      )}
                      <div className="tooltip-foot">
                        {openDrawerId === hoveredHerb.herb.id
                          ? 'Ngăn đang kéo mở — nhấp Bốc thuốc để đặt lên cân'
                          : 'Nhấp để kéo ngăn thuốc ra'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="apothecary-chest">
                  <div className="chest-drawers-grid">
                    {availableHerbs.map((herb) => {
                      const assignedRole = (Object.keys(slots) as RoleSlot[]).find(
                        (r) => slots[r] === herb.id
                      );
                      const isOpen = openDrawerId === herb.id;
                      const natureShort =
                        herb.nature === 'Ôn' || herb.nature === 'Nhiệt'
                          ? 'hot'
                          : herb.nature === 'Bình'
                          ? 'neutral'
                          : 'cold';
                      const activeRoleTitle =
                        ROLE_META.find((r) => r.role === selectedSlot)?.title ?? 'Cân';

                      return (
                        <div
                          key={herb.id}
                          ref={(el) => {
                            herbRefs.current[herb.id] = el;
                          }}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', herb.id)}
                          onMouseEnter={(e) => handleDrawerHover(herb, e.currentTarget)}
                          onFocus={(e) => handleDrawerHover(herb, e.currentTarget)}
                          className={`wood-drawer ${isOpen ? 'is-open' : ''} ${
                            assignedRole ? 'is-assigned' : ''
                          }`}
                        >
                          <button
                            type="button"
                            className="drawer-face-btn"
                            aria-expanded={isOpen}
                            onClick={() => handleToggleDrawer(herb)}
                          >
                            {assignedRole && (
                              <span className="drawer-role-ribbon">
                                {ROLE_META.find((r) => r.role === assignedRole)?.title.replace(' dược', '')}
                              </span>
                            )}
                            <span className="drawer-name-slip">
                              <span className={`qi-dot qi-${natureShort}`} aria-hidden="true" />
                              <span className="drawer-herb-title">{herb.name}</span>
                            </span>
                            <span className="brass-pull-plate" aria-hidden="true">
                              <span className="brass-pull-ring" />
                            </span>
                          </button>

                          {isOpen && (
                            <div className="drawer-open-tray">
                              <div className="drawer-herb-nest">
                                <BotanicalSvg herbId={herb.id} motif={herb.motif} size={50} />
                              </div>
                              <div className="drawer-tray-actions">
                                <button
                                  type="button"
                                  className="btn-cinnabar drawer-scoop-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleScoopFromDrawer(herb);
                                  }}
                                >
                                  Bốc vào {activeRoleTitle}
                                </button>
                                <div className="drawer-sub-actions">
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ padding: '2px 7px', fontSize: '0.72rem' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenCodexHerb(herb.id);
                                    }}
                                  >
                                    Y thư
                                  </button>
                                  {assignedRole && (
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      style={{ padding: '2px 7px', fontSize: '0.72rem' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAssignHerb(assignedRole, null);
                                      }}
                                    >
                                      Trả hộc
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {openDrawerId && HERB_MAP[openDrawerId] && (
                    <div className="drawer-mobile-readout">
                      <strong>Đang mở hộc {HERB_MAP[openDrawerId].name}:</strong>{' '}
                      {HERB_MAP[openDrawerId].nature} ({HERB_MAP[openDrawerId].flavors.join(', ')}) —{' '}
                      {HERB_MAP[openDrawerId].summary}
                    </div>
                  )}
                </div>
              </div>

              <div className="stamp-action-bar">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSlots(emptySlots());
                    setSlotPaoZhi({});
                    setPacketWrapped(false);
                  }}
                >
                  Rửa cân làm lại đơn
                </button>
                <button
                  type="button"
                  className="btn-cinnabar"
                  onClick={handleWrapHerbPacketAndGoRoom3}
                >
                  Gấp Gói Giấy Hồng Điều &amp; Sang Buồng Sắc →
                </button>
              </div>
            </div>
          </section>

          {/* ================= ROOM 3: NỘI CÁC CHÂM CỨU & HỎA LÒ SẮC THUỐC ================= */}
          <section
            className={`apothecary-room ${activeRoom === 2 ? 'is-active-room' : ''}`}
            aria-label="Buồng 3: Nội Các Châm Cứu và Bếp Sắc"
          >
            <div className="room-stage-backdrop">
              <img
                src="/art/scenes/room-noi-cac.jpg"
                alt="Nội các châm cứu và bếp than hồng sắc siêu đất nung"
                className="room-bg-img"
              />
              <div className="room-ambient-wash" aria-hidden="true" />
              <div className="room-stage-header">
                <div>
                  <h2 className="room-stage-title">Nội Các — Kinh Lạc Ngải Cứu &amp; Lò Sắc Thuốc</h2>
                  <p className="room-stage-sub">
                    Phối huyệt đạo (Chương 3) · Canh lửa siêu đất nung trực tiếp &amp; Đóng ấn giao thuốc
                  </p>
                </div>
                <button type="button" className="btn-secondary" onClick={() => switchRoom(1)}>
                  ← Quay lại Dược Các
                </button>
              </div>
            </div>

            <div className="desk-grid room-inner-grid">
              {/* Left of Room 3: Meridian Scroll & Moxa */}
              <div className="woodblock-sheet">
                <div className="section-heading">
                  <span>Đồ Hình Kinh Lạc &amp; Cứu Ngải</span>
                  <span className="tag-badge">
                    {selectedCase.allowAcupuncture
                      ? `Đã chọn ${selectedAcupoints.length} huyệt`
                      : 'Tự chọn mở rộng (Chương 3 chấm điểm)'}
                  </span>
                </div>

                {!selectedCase.allowAcupuncture && (
                  <p className="muted-note" style={{ marginTop: 0 }}>
                    Ca hiện tại thuộc Chương {selectedCase.chapter} (chủ yếu dùng thang thuốc). Bạn vẫn có thể ngắm đồ hình huyệt đạo hoặc bước sang Chương 3 để phối hợp Trong uống Ngoài châm.
                  </p>
                )}

                <MeridianBodyMap
                  selectedIds={selectedAcupoints}
                  onToggleAcupoint={handleToggleAcupoint}
                  isPregnant={selectedCase.isPregnant}
                  moxaEnabled={moxaEnabled}
                  onToggleMoxa={() => {
                    setMoxaEnabled((prev) => {
                      const next = !prev;
                      if (next) apothecaryAudio.playMoxaWarmth();
                      return next;
                    });
                  }}
                />
              </div>

              {/* Right of Room 3: Inline Charcoal Stove Decoction + Seal Stamp */}
              <div className="woodblock-sheet">
                <div className="section-heading">
                  <span>Canh Lửa Siêu Đất Nung &amp; Đóng Ấn</span>
                  <span className="tag-badge">Chứng: {selectedCase.seasonTag}</span>
                </div>

                <div className={`stove-scene-frame fire-${fire}`}>
                  <img
                    src="/art/tools/decoction-stove.jpg"
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
                    <strong>Trong siêu:</strong> {assignedHerbsSummary.join(', ') || 'Chưa đặt vị thuốc nào lên cân'}
                    {chosenPointNames.length > 0 ? ` | Phối huyệt: ${chosenPointNames.join(', ')}` : ''}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ display: 'block', fontFamily: 'var(--font-serif)', marginBottom: '6px' }}>
                    1. Chọn Độ Lửa Sắc Thuốc (<GlossaryText text="Vũ Hỏa" /> / <GlossaryText text="Văn Hỏa" />):
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

                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ display: 'block', fontFamily: 'var(--font-serif)', marginBottom: '6px' }}>
                    2. Dặn Dò Cách Uống Trao {selectedCase.patientName}:
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {DOSING_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`toggle-pill ${dosing === opt.id ? 'active' : ''}`}
                        style={{ flex: '1 1 160px' }}
                        onClick={() => {
                          setDosing(opt.id);
                          apothecaryAudio.playPageTurn();
                        }}
                      >
                        {opt.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="muted-note" style={{ marginBottom: '12px', fontSize: '0.82rem' }}>
                  Mẹo Y gia: <GlossaryText text={recommendedDecoction.rationale.split('.')[0]} />.
                </div>

                {preview.alerts.map((al, i) => (
                  <div
                    key={`r3-${al.sourceId}-${i}`}
                    className={`alert-banner ${al.severity === 'caution' ? 'caution' : ''}`}
                  >
                    {al.message}
                  </div>
                ))}

                <div className="stamp-action-bar">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => switchRoom(1)}
                  >
                    Chỉnh lại đơn thuốc
                  </button>
                  <button
                    type="button"
                    className="btn-cinnabar"
                    onClick={handleFinalStampSubmit}
                  >
                    Đóng Ấn Giao Thuốc &amp; Luận Y Án
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Floating Case Summary Notebook Following Across All 3 Rooms */}
      <div className={`floating-notebook-dock ${notebookOpen ? 'is-open' : ''}`}>
        <div className="notebook-bar">
          <div className="notebook-summary-pills">
            <strong>Sổ Tay Y Án:</strong>
            <span>{selectedCase.patientName}</span>
            <span>· {clues.length} chứng trạng</span>
            <span>
              · Bát Cương: {diagnosis.location === 'bieu' ? 'Biểu' : 'Lý'} /{' '}
              {diagnosis.nature === 'han' ? 'Hàn' : 'Nhiệt'} /{' '}
              {diagnosis.state === 'hu' ? 'Hư' : 'Thực'}
            </span>
            <span>· Thuốc trên cân: {assignedHerbsSummary.length}/4</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            onClick={() => {
              apothecaryAudio.playPageTurn();
              setNotebookOpen((v) => !v);
            }}
          >
            {notebookOpen ? 'Gấp Sổ Tay' : 'Mở nhanh Chứng trạng'}
          </button>
        </div>

        {notebookOpen && (
          <div className="notebook-body">
            <div style={{ fontSize: '0.82rem', marginBottom: '6px' }}>
              <strong>Chủ chứng:</strong> {selectedCase.chiefComplaint}
            </div>
            <div className="clue-list">
              {clues.map((c, idx) => (
                <span key={`nb-${idx}`} className="clue-chip">
                  <GlossaryText text={c} />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {showLedgerModal && (
        <CaseLedgerModal
          entries={caseLedger}
          onClose={() => setShowLedgerModal(false)}
        />
      )}

      {outcome && (
        <OutcomeScrollModal
          patientCase={selectedCase}
          result={outcome}
          onClose={() => setOutcome(null)}
          onNextCase={handleNextCase}
          onOpenLedger={() => {
            setOutcome(null);
            setShowLedgerModal(true);
          }}
        />
      )}
    </div>
  );
};
