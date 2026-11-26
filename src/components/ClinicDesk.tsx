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
import { AmbientParticlesCanvas } from './AmbientParticlesCanvas';
import { CaseLedgerModal } from './CaseLedgerModal';
import { EightPrinciplesCompass } from './EightPrinciplesCompass';
import { GlossaryText } from './GlossaryText';
import { HerbGardenRoom } from './HerbGardenRoom';
import { MeridianBodyMap } from './MeridianBodyMap';
import { OutcomeScrollModal } from './OutcomeScrollModal';
import { PaperFoldOverlay } from './PaperFoldOverlay';
import { PulseCanvas } from './PulseCanvas';
import { BotanicalSvg } from './svg/BotanicalSvg';
import { HealerHandOverlay, ScoopAnimationState } from './svg/HealerHandOverlay';
import { TongueMirror } from './svg/TongueMirror';
import { VillagerPortrait } from './svg/VillagerPortrait';

interface ClinicDeskProps {
  unlockedChapter: 1 | 2 | 3;
  completedCases: Record<string, { bestScore: number }>;
  caseLedger: CaseLedgerEntry[];
  yDucPoints: number;
  freshHerbIds: string[];
  gardenGrowth: Record<string, number>;
  mentorDismissed: boolean;
  onDismissMentor: () => void;
  onWaterGardenPlot: (herbId: string) => void;
  onHarvestGardenPlot: (herbId: string) => void;
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

const ROOM_META: { idx: 0 | 1 | 2 | 3; label: string; sub: string }[] = [
  { idx: 0, label: 'I. Tiền Đường', sub: 'Rèm trúc & Tứ chẩn' },
  { idx: 1, label: 'II. Dược Các', sub: 'Tủ Bách Tử & Bào chế' },
  { idx: 2, label: 'III. Nội Các & Lò', sub: 'Kinh lạc, Quạt lửa & Ấn' },
  { idx: 3, label: 'IV. Hậu Viên', sub: 'Trồng & Hái lá tươi' }
];

const PAO_ZHI_OPTIONS: { id: PaoZhiMethod; label: string; badge: string }[] = [
  { id: 'sinh-dung', label: 'Để mộc', badge: 'Nguyên vị' },
  { id: 'gia-dap', label: 'Giã dập', badge: 'Cối đồng' },
  { id: 'sao-vang', label: 'Sao vàng', badge: 'Chảo ấm' },
  { id: 'chich-mat', label: 'Chích mật', badge: 'Nhuận bổ' }
];

const FIRE_OPTIONS: { id: FireType; title: string; subtitle: string; range: [number, number] }[] = [
  {
    id: 'vu-hoa',
    title: 'Vũ Hỏa (Lửa lớn 10–15p)',
    subtitle: 'Mục tiêu quạt: 75% – 100%',
    range: [75, 100]
  },
  {
    id: 'van-vu',
    title: 'Văn Vũ Hỏa (Sôi bùng rồi vừa)',
    subtitle: 'Mục tiêu quạt: 42% – 74%',
    range: [42, 74]
  },
  {
    id: 'van-hoa',
    title: 'Văn Hỏa (Lửa riu riu 35–45p)',
    subtitle: 'Mục tiêu quạt: 15% – 41%',
    range: [15, 41]
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
  yDucPoints,
  freshHerbIds,
  gardenGrowth,
  mentorDismissed,
  onDismissMentor,
  onWaterGardenPlot,
  onHarvestGardenPlot,
  onCaseEvaluated,
  onOpenCodexHerb
}) => {
  const [activeChapter, setActiveChapter] = useState<1 | 2 | 3>(1);
  const [selectedCase, setSelectedCase] = useState<PatientCase>(STORY_CASES[0]);
  const [procCounter, setProcCounter] = useState(1);
  const [activeRoom, setActiveRoom] = useState<0 | 1 | 2 | 3>(0);
  const [curtainParting, setCurtainParting] = useState(false);

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
  const [animatingPanRole, setAnimatingPanRole] = useState<RoleSlot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<RoleSlot>('quan');
  const [openDrawerId, setOpenDrawerId] = useState<string | null>(null);
  const [hoveredHerb, setHoveredHerb] = useState<{ herb: Herb; left: number; top: number } | null>(null);
  const [showFoldOverlay, setShowFoldOverlay] = useState(false);
  const [packetWrapped, setPacketWrapped] = useState(false);
  const [selectedAcupoints, setSelectedAcupoints] = useState<string[]>([]);
  const [moxaEnabled, setMoxaEnabled] = useState(false);
  const [fire, setFire] = useState<FireType>('van-vu');
  const [fanHeat, setFanHeat] = useState<number>(56);
  const [fanBlowing, setFanBlowing] = useState(false);
  const [dosing, setDosing] = useState<DosingAdvice>('am-duong-tang');
  const [stampingActive, setStampingActive] = useState(false);

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

  // Relic tiers earned via Y Đức Points
  const hasDragonScale = yDucPoints >= 25;
  const hasBatTrangPot = yDucPoints >= 60;
  const hasJadeSeal = yDucPoints >= 100;

  const switchRoom = useCallback((nextRoom: 0 | 1 | 2 | 3) => {
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

  // Keyboard navigation between 4 rooms
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || outcome || showLedgerModal) {
        return;
      }
      if (e.key === '1') switchRoom(0);
      else if (e.key === '2') switchRoom(1);
      else if (e.key === '3') switchRoom(2);
      else if (e.key === '4') switchRoom(3);
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        switchRoom(Math.min(3, activeRoom + 1) as 0 | 1 | 2 | 3);
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        switchRoom(Math.max(0, activeRoom - 1) as 0 | 1 | 2 | 3);
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

  const activeFireRange = FIRE_OPTIONS.find((f) => f.id === fire)?.range ?? [42, 74];
  const isFanMatched = fanHeat >= activeFireRange[0] && fanHeat <= activeFireRange[1];

  const loadPatient = (nextCase: PatientCase, withCurtain = true) => {
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
    setShowFoldOverlay(false);
    setSelectedAcupoints([]);
    setMoxaEnabled(false);
    setFire('van-vu');
    setFanHeat(56);
    setDosing('am-duong-tang');
    setOutcome(null);
    switchRoom(0);

    if (withCurtain) {
      setCurtainParting(true);
      apothecaryAudio.playCurtainBell();
      window.setTimeout(() => setCurtainParting(false), 620);
    } else {
      apothecaryAudio.playPageTurn();
    }
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
    loadPatient(pCase, true);
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
    setAnimatingPanRole(role);
    window.setTimeout(() => {
      setAnimatingPanRole((cur) => (cur === role ? null : cur));
    }, 520);

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

  const assignedHerbObjects = useMemo(
    () =>
      (['quan', 'than', 'ta', 'su'] as RoleSlot[])
        .map((r) => (slots[r] ? HERB_MAP[slots[r]!] : null))
        .filter((h): h is Herb => Boolean(h)),
    [slots]
  );

  const handleWrapHerbPacketAndGoRoom3 = () => {
    apothecaryAudio.playPaperFold();
    setPacketWrapped(true);
    if (assignedHerbObjects.length > 0) {
      setShowFoldOverlay(true);
      window.setTimeout(() => {
        setShowFoldOverlay(false);
        switchRoom(2);
      }, 920);
    } else {
      switchRoom(2);
    }
  };

  const handleToggleAcupoint = (ptId: string) => {
    setSelectedAcupoints((prev) =>
      prev.includes(ptId) ? prev.filter((id) => id !== ptId) : [...prev, ptId]
    );
    apothecaryAudio.playHerbDrop();
  };

  const handleFanStroke = (up: boolean) => {
    apothecaryAudio.playBambooFan();
    setFanBlowing(true);
    setFanHeat((prev) => Math.max(10, Math.min(100, prev + (up ? 14 : -14))));
    window.setTimeout(() => setFanBlowing(false), 320);
  };

  const handleFinalStampSubmit = () => {
    const usedFresh = (Object.values(slots).filter(Boolean) as string[]).filter((id) =>
      freshHerbIds.includes(id)
    );
    const decoctionPayload: DecoctionChoice | undefined =
      hasAssignedHerbs || selectedAcupoints.length > 0
        ? {
            fire,
            dosing,
            paoZhi: slotPaoZhi,
            moxaEnabled,
            fanMatched: isFanMatched,
            usedFreshHerbs: usedFresh,
            hasBatTrangPot
          }
        : undefined;

    const res = evaluateCaseSubmission(
      selectedCase,
      diagnosis,
      slots,
      selectedAcupoints,
      decoctionPayload
    );

    setStampingActive(true);
    apothecaryAudio.playSealStamp(res.passed);
    window.setTimeout(() => {
      setStampingActive(false);
      setOutcome(res);
      onCaseEvaluated(selectedCase, res, {
        slots,
        acupoints: selectedAcupoints,
        decoction: decoctionPayload
      });
    }, 460);
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
      loadPatient(next, true);
    } else {
      handleSpawnProcedural();
    }
  };

  const natureClass = (nature: Herb['nature']) => {
    if (nature === 'Ôn' || nature === 'Nhiệt') return 'nature-hot';
    if (nature === 'Hàn' || nature === 'Đại hàn' || nature === 'Lương') return 'nature-cold';
    return 'nature-neutral';
  };

  const assignedHerbsSummary = assignedHerbObjects.map((h) => h.name);
  const chosenPointNames = selectedAcupoints.map((id) => ACUPOINT_MAP[id]?.name).filter(Boolean);

  const mentorHint =
    activeRoom === 0
      ? 'Sư phụ dặn (Bước 1/4): Soi Gương lưỡi, nghe Văn chẩn, hỏi thẻ tre, ấn 3 ngón Thốn–Quan–Xích rồi gạt Đĩa La Bàn Bát Cương.'
      : activeRoom === 1
      ? 'Sư phụ dặn (Bước 2/4): Trỏ vào hộc tủ Bách Tử đọc dược tính, kéo bốc lên 4 đĩa Quân–Thần–Tá–Sứ, có thể Sao vàng / Giã dập rồi Gói giấy hồng điều.'
      : activeRoom === 2
      ? 'Sư phụ dặn (Bước 3/4): Chọn lửa và nhấp Quạt Nan giữ nhiệt đúng vùng mục tiêu, bật Ngải cứu (Chương 3) rồi Dập Ấn Triện Chu Sa!'
      : 'Sư phụ dặn (Bước 4/4): Tưới nước chăm cây thuốc Nam tươi ở Hậu Viên và hái vào giỏ để tăng tinh khiết cho thang thuốc!';

  return (
    <div className={`clinic-stage ${watchLightingClass} ${stampingActive ? 'stamp-shake' : ''}`}>
      {/* Consolidated Compact Ironwood Control Bar */}
      <div className="case-toolbar unified-compact-bar">
        <div className="chapter-pills">
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
              Ch.{ch}:{' '}
              {ch === 1 ? 'Biểu Lý' : ch === 2 ? 'Tạng Phủ' : 'Kinh Lạc'}
            </button>
          ))}

          <select
            aria-label="Chọn bệnh nhân trong chương"
            className="case-select"
            value={selectedCase.isProcedural ? 'procedural' : selectedCase.id}
            onChange={(e) => {
              const found = STORY_CASES.find((c) => c.id === e.target.value);
              if (found) loadPatient(found, true);
            }}
          >
            {chapterCases.map((c) => {
              const done = completedCases[c.id];
              return (
                <option key={c.id} value={c.id}>
                  {c.title} {done ? `(${done.bestScore}đ)` : ''}
                </option>
              );
            })}
            {selectedCase.isProcedural && (
              <option value="procedural">{selectedCase.title}</option>
            )}
          </select>
        </div>

        <div className="toolbar-right-group">
          <div className="yduc-relics-pill" title="Điểm Y Đức mở khóa Bảo vật Trấn Quán">
            <strong>Y Đức: {yDucPoints}</strong>
            <span className={`relic-dot ${hasDragonScale ? 'unlocked' : ''}`}>
              {hasDragonScale ? 'Cân Giao Long' : '25đ: Cân Long'}
            </span>
            <span className={`relic-dot ${hasBatTrangPot ? 'unlocked' : ''}`}>
              {hasBatTrangPot ? 'Siêu Bát Tràng' : '60đ: Siêu Gốm'}
            </span>
            <span className={`relic-dot ${hasJadeSeal ? 'unlocked' : ''}`}>
              {hasJadeSeal ? 'Ấn Bạch Ngọc' : '100đ: Ấn Ngọc'}
            </span>
          </div>

          <button type="button" className="btn-secondary" onClick={handleSpawnProcedural}>
            Gõ Mõ Đón Khách
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              apothecaryAudio.playPageTurn();
              setShowLedgerModal(true);
            }}
          >
            Sổ Y Án ({caseLedger.length})
          </button>
        </div>
      </div>

      {/* 4-Room Navigation Plaques */}
      <div className="room-nav-bar four-rooms" role="tablist" aria-label="Di chuyển giữa 4 khu vực y quán">
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

      {/* Horizontal Sliding Four-Room Workbench Viewport */}
      <div className="apothecary-room-viewport">
        <div
          className="apothecary-room-track four-rooms-track"
          style={{ transform: `translate3d(-${activeRoom * 25}%, 0, 0)` }}
        >
          {/* ================= ROOM 1: TIỀN ĐƯỜNG SÂN KHẤU LỚN ================= */}
          <section
            className={`apothecary-room ${activeRoom === 0 ? 'is-active-room' : ''}`}
            aria-label="Buồng 1: Tiền Đường Tiếp Bệnh"
          >
            <div className={`diorama-hero-stage ${curtainParting ? 'curtain-parting' : ''}`}>
              <img
                src="/art/scenes/room-tien-duong.jpg"
                alt="Tiền Đường tiệm thuốc Nam nhìn qua rèm trúc"
                className="room-bg-img"
              />
              <div className="room-ambient-wash" aria-hidden="true" />
              <AmbientParticlesCanvas mode={watchLightingClass === 'lighting-night' ? 'rain' : 'sunbeams'} />

              {/* Bamboo Curtain Left & Right Parting Veils */}
              <div className="curtain-veil left" aria-hidden="true" />
              <div className="curtain-veil right" aria-hidden="true" />

              {!mentorDismissed && (
                <div className="stage-mentor-ribbon" role="status">
                  <span>{mentorHint}</span>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '2px 7px', fontSize: '0.72rem' }}
                    onClick={onDismissMentor}
                  >
                    Ẩn
                  </button>
                </div>
              )}

              <div className="diorama-stage-content">
                <div className="stage-patient-centerpiece">
                  <div className="silk-scroll-mount" aria-hidden="true">
                    <div className="scroll-rod-cap stage-cap" />
                    <VillagerPortrait patientCase={selectedCase} size="stage" />
                    <div className="scroll-rod-cap stage-cap" />
                  </div>
                </div>

                <div className="stage-dialogue-column">
                  <div className="stage-case-meta">
                    <h2 className="room-stage-title">{selectedCase.title}</h2>
                    <p className="room-stage-sub">
                      {activeWatch.branch} ({activeWatch.organ} vượng) · Phím tắt <kbd>1</kbd>–<kbd>4</kbd> / <kbd>←</kbd><kbd>→</kbd>
                    </p>
                  </div>
                  <div className="wood-speech-bubble stage-speech">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                      <span className="speaker-seal patient">{selectedCase.patientName}</span>
                      <span style={{ fontSize: '0.78rem', color: '#5A402A', fontWeight: 600 }}>
                        {selectedCase.age} tuổi — {selectedCase.patientRole}
                      </span>
                      {selectedCase.isPregnant && (
                        <span className="tag-badge pregnant">Thai phụ</span>
                      )}
                    </div>
                    「 <GlossaryText text={selectedCase.chiefComplaint} /> 」
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <button type="button" className="btn-cinnabar" onClick={() => switchRoom(1)}>
                      Sang Dược Các Bốc Thuốc →
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => switchRoom(3)}>
                      Ra Hậu Viên hái lá tươi
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="desk-grid room-inner-grid">
              {/* Tứ Chẩn Instruments */}
              <div className="woodblock-sheet stitched-binding">
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

              {/* Right Side of Room 1: Rotating Brass Dial + Bát Cương */}
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
                    Đã xác định hướng bệnh trên đĩa đồng Bát Quái? Sang <strong>Dược Các</strong> để bốc thuốc!
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
              <AmbientParticlesCanvas mode="sunbeams" />
              <div className="room-stage-header">
                <div>
                  <h2 className="room-stage-title">
                    Dược Các — Cân Tiểu Ly &amp; Bào Chế {hasDragonScale ? '· Cân Giao Long' : ''}
                  </h2>
                  <p className="room-stage-sub">
                    Trỏ chuột xem dược tính · Nhấp hộc tủ gỗ bốc vào Quân / Thần / Tá / Sứ
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-secondary" onClick={() => switchRoom(0)}>
                    ← Về Tiền Đường
                  </button>
                  <button type="button" className="btn-cinnabar" onClick={handleWrapHerbPacketAndGoRoom3}>
                    Gấp Giấy Hồng Điều 3D &amp; Sang Bếp →
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

              {/* Giá Cân Tiểu Ly Đồng Cổ */}
              <div className={`balance-beam-bar ${hasDragonScale ? 'dragon-upgraded' : ''}`} aria-hidden="true">
                <svg width="100%" height="42" viewBox="0 0 440 42" fill="none">
                  <path d="M220 2 V16" stroke={hasDragonScale ? '#F0C76B' : '#CFA052'} strokeWidth="2.8" />
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
                    <path d="M46 16 Q133 9 220 15 Q307 9 394 16" stroke={hasDragonScale ? '#D59E49' : '#9C6B24'} strokeWidth="3.6" strokeLinecap="round" />
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

              {/* 4 Brass Scale Pans + Interactive PaoZhi Craft Strip + Fresh Garden Leaf Badge */}
              <div className="scale-pans-grid">
                {ROLE_META.map((meta) => {
                  const herbId = slots[meta.role];
                  const herb = herbId ? HERB_MAP[herbId] : null;
                  const isActiveSlot = selectedSlot === meta.role;
                  const activeMethod: PaoZhiMethod = slotPaoZhi[meta.role] ?? 'sinh-dung';
                  const idealMethod = herb ? getIdealPaoZhi(herb.id).method : null;
                  const isFreshGardenHerb = Boolean(herb && freshHerbIds.includes(herb.id));
                  const isCrafting = animatingPanRole === meta.role;

                  return (
                    <div
                      key={meta.role}
                      ref={(el) => {
                        panRefs.current[meta.role] = el;
                      }}
                      className={`scale-pan ${isActiveSlot ? 'selected-slot' : ''} ${
                        herb ? 'filled' : ''
                      } ${justScoopedRole === meta.role ? 'just-scooped' : ''} ${
                        isCrafting ? `paozhi-anim-${activeMethod}` : ''
                      } paozhi-tint-${activeMethod}`}
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
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <span className={`nature-tag ${natureClass(herb.nature)}`}>
                              {herb.nature} — {herb.flavors[0]}
                            </span>
                            {isFreshGardenHerb && (
                              <span className="fresh-leaf-badge">Lá tươi vườn nhà</span>
                            )}
                          </div>

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
                <div className={`craft-bench-item ${animatingPanRole ? 'is-crafting-glow' : ''}`}>
                  <img
                    src="/art/tools/paozhi-workbench.jpg"
                    alt="Cối giã đồng và chảo sao thuốc Bào chế"
                    className="craft-bench-thumb"
                  />
                  <div>
                    <strong style={{ fontSize: '0.84rem' }}>Cối Giã Đồng &amp; Chảo Sao Bào Chế</strong>
                    <div className="muted-note" style={{ fontSize: '0.76rem' }}>
                      Nhấp <em>Giã dập / Sao vàng / Chích mật</em> trên đĩa cân để chế biến thảo mộc (+1..+3đ tinh thông).
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
                      {packetWrapped ? 'Đã gấp Giấy Hồng Điều thắt dây gai!' : 'Giấy Hồng Điều Bọc Thang'}
                    </strong>
                    <div className="muted-note" style={{ fontSize: '0.76rem' }}>
                      {assignedHerbsSummary.length > 0
                        ? `Thang thuốc: ${assignedHerbsSummary.join(' · ')}`
                        : 'Cân xong các vị thuốc rồi gói giấy hồng điều chuyển sang Hỏa Lò.'}
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

              {/* Tủ Thuốc Bách Tử */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.82rem', color: 'var(--ink-muted)', margin: '8px 0 6px' }}>
                <span>
                  Tủ Thuốc Bách Tử (Trỏ xem dược tính • Nhấp kéo hộc vào{' '}
                  <strong>{ROLE_META.find((r) => r.role === selectedSlot)?.title}</strong>):
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '0.74rem' }}
                  onClick={() => switchRoom(3)}
                >
                  Giỏ lá tươi: {freshHerbIds.length} vị · Ra Hậu Viên →
                </button>
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
                        {freshHerbIds.includes(hoveredHerb.herb.id)
                          ? 'Có sẵn lá tươi từ Hậu Viên! Nhấp để bốc'
                          : openDrawerId === hoveredHerb.herb.id
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
                      const isFresh = freshHerbIds.includes(herb.id);
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
                            {!assignedRole && isFresh && (
                              <span className="drawer-fresh-ribbon">Tươi</span>
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
                  Gấp Gói Giấy Hồng Điều 3D &amp; Sang Buồng Sắc →
                </button>
              </div>
            </div>
          </section>

          {/* ================= ROOM 3: NỘI CÁC, QUẠT NAN & DẬP ẤN CHU SA ================= */}
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
              <AmbientParticlesCanvas mode="embers" />
              <div className="room-stage-header">
                <div>
                  <h2 className="room-stage-title">
                    Nội Các — Kinh Lạc Đắc Khí &amp; Lò Sắc Thuốc {hasBatTrangPot ? '· Siêu Gốm Bát Tràng' : ''}
                  </h2>
                  <p className="room-stage-sub">
                    Phối huyệt đạo tỏa luồng Đắc Khí · Phe phẩy Quạt Nan giữ lửa &amp; Dập ấn Chu Sa
                  </p>
                </div>
                <button type="button" className="btn-secondary" onClick={() => switchRoom(1)}>
                  ← Quay lại Dược Các
                </button>
              </div>
            </div>

            <div className="desk-grid room-inner-grid">
              {/* Left of Room 3: Meridian Scroll, Đắc Khí & Moxa */}
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
                    Ca hiện tại thuộc Chương {selectedCase.chapter} (chủ yếu dùng thang thuốc). Bạn vẫn có thể điểm huyệt ngắm luồng Đắc Khí hoặc sang Chương 3 để tính điểm phối huyệt.
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

              {/* Right of Room 3: Charcoal Stove + Bamboo Fan + Seal Stamp Ritual */}
              <div className="woodblock-sheet">
                <div className="section-heading">
                  <span>Canh Lửa Siêu Đất Nung &amp; Dập Ấn Triện</span>
                  <span className="tag-badge">Chứng: {selectedCase.seasonTag}</span>
                </div>

                <div className={`stove-scene-frame fire-${fire} ${fanBlowing ? 'fan-gust' : ''}`}>
                  <img
                    src="/art/tools/decoction-stove.jpg"
                    alt="Siêu đất nung sắc thuốc trên bếp than hồng"
                    className="stove-scene-img"
                  />
                  <div
                    className="stove-ember-glow"
                    style={{ opacity: Math.max(0.25, fanHeat / 100) }}
                    aria-hidden="true"
                  />
                  <div className="stove-steam-layer" aria-hidden="true">
                    <span className="steam-wisp w1" />
                    <span className="steam-wisp w2" />
                    <span className="steam-wisp w3" />
                  </div>
                  <div className="stove-pot-caption">
                    <strong>Trong siêu{hasBatTrangPot ? ' (Gốm Bát Tràng Cổ +1đ)' : ''}:</strong>{' '}
                    {assignedHerbsSummary.join(', ') || 'Chưa đặt vị thuốc nào lên cân'}
                    {chosenPointNames.length > 0 ? ` | Phối huyệt: ${chosenPointNames.join(', ')}` : ''}
                  </div>
                </div>

                {/* Interactive Bamboo Fan Heat Gauge */}
                <div className="fan-heat-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.86rem' }}>
                      Quạt Nan Canh Lửa: {fanHeat}%
                    </strong>
                    <span className={`tag-badge ${isFanMatched ? 'fan-ok' : ''}`} style={{ background: isFanMatched ? '#23574C' : '#5A3E28' }}>
                      {isFanMatched ? 'Chuẩn vùng hỏa hầu (+2đ)' : `Mục tiêu: ${activeFireRange[0]}–${activeFireRange[1]}%`}
                    </span>
                  </div>
                  <div className="fan-meter-track" aria-hidden="true">
                    <div
                      className="fan-meter-target"
                      style={{
                        left: `${activeFireRange[0]}%`,
                        width: `${activeFireRange[1] - activeFireRange[0]}%`
                      }}
                    />
                    <div className="fan-meter-needle" style={{ left: `${fanHeat}%` }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`btn-secondary fan-action-btn ${fanBlowing ? 'is-fanning' : ''}`}
                      onClick={() => handleFanStroke(true)}
                    >
                      Phe phẩy Quạt Nan (+Lửa)
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleFanStroke(false)}
                    >
                      Ủ tro dịu lửa (-Lửa)
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
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
                          setFanHeat(Math.round((opt.range[0] + opt.range[1]) / 2));
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

                <div style={{ marginBottom: '10px' }}>
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

                <div className="muted-note" style={{ marginBottom: '10px', fontSize: '0.82rem' }}>
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
                    className={`btn-cinnabar seal-ritual-btn ${hasJadeSeal ? 'jade-seal-trim' : ''}`}
                    disabled={stampingActive}
                    onClick={handleFinalStampSubmit}
                  >
                    {stampingActive
                      ? 'Đang dập Ấn Triện...'
                      : 'Đóng Ấn Giao Thuốc & Luận Y Án'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ================= ROOM 4: HẬU VIÊN VƯỜN THUỐC NAM ================= */}
          <section
            className={`apothecary-room ${activeRoom === 3 ? 'is-active-room' : ''}`}
            aria-label="Buồng 4: Hậu Viên Vườn Thuốc Nam"
          >
            <div className="room-stage-backdrop">
              <img
                src="/art/scenes/room-hau-vien.jpg"
                alt="Hậu viên trồng cây thuốc Nam xanh tươi sau y quán"
                className="room-bg-img"
              />
              <div className="room-ambient-wash" aria-hidden="true" />
              <AmbientParticlesCanvas mode="garden" />
              <div className="room-stage-header">
                <div>
                  <h2 className="room-stage-title">Hậu Viên — Vườn Nam Dược Quanh Nhà</h2>
                  <p className="room-stage-sub">
                    Tưới sương sớm &amp; hái lá thuốc tươi mang vào Dược Các tăng tinh khiết cho thang thuốc
                  </p>
                </div>
                <button type="button" className="btn-secondary" onClick={() => switchRoom(1)}>
                  ← Mang lá vào Dược Các
                </button>
              </div>
            </div>

            <HerbGardenRoom
              gardenGrowth={gardenGrowth}
              freshHerbIds={freshHerbIds}
              onWaterPlot={onWaterGardenPlot}
              onHarvestPlot={onHarvestGardenPlot}
              onGoToDispensary={() => switchRoom(1)}
            />
          </section>
        </div>
      </div>

      {/* Physical Seal Stamp Slam Overlay */}
      {stampingActive && (
        <div className="seal-slam-overlay" aria-hidden="true">
          <div className={`seal-chop-stamp ${hasJadeSeal ? 'is-jade-seal' : ''}`}>
            惠心堂印
          </div>
        </div>
      )}

      {/* 3D Paper Fold Animation Overlay */}
      <PaperFoldOverlay visible={showFoldOverlay} herbs={assignedHerbObjects} />

      {/* Floating Case Summary Notebook Following Across All 4 Rooms */}
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
