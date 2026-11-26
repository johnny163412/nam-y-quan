import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STORY_CASES, generateProceduralCase } from '../data/cases';
import { detectActiveFormulas } from '../data/formulas';
import { HERB_MAP, HERBS } from '../data/herbs';
import { apothecaryAudio } from '../engine/audio';
import {
  assignHerbToSlot,
  computeTreatmentPreview,
  emptySlots,
  evaluateCaseSubmission,
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
import { BrassScaleRig } from './BrassScaleRig';
import { CaseLedgerModal } from './CaseLedgerModal';
import { EightPrinciplesCompass } from './EightPrinciplesCompass';
import { GlossaryText } from './GlossaryText';
import { HerbGardenRoom } from './HerbGardenRoom';
import { MeridianBodyMap } from './MeridianBodyMap';
import { OutcomeScrollModal } from './OutcomeScrollModal';
import { PaoZhiRig } from './PaoZhiRig';
import { PaperFoldOverlay } from './PaperFoldOverlay';
import { PulseCanvas } from './PulseCanvas';
import { StoveAndSealRig } from './StoveAndSealRig';
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

const ROLE_TITLES: Record<RoleSlot, string> = {
  quan: 'Quân dược',
  than: 'Thần dược',
  ta: 'Tá dược',
  su: 'Sứ dược'
};

const ROOM_NODES: { idx: 0 | 1 | 2 | 3; roman: string; label: string }[] = [
  { idx: 0, roman: 'I', label: 'Tiền Đường' },
  { idx: 1, roman: 'II', label: 'Dược Các' },
  { idx: 2, roman: 'III', label: 'Nội Các & Lò' },
  { idx: 3, roman: 'IV', label: 'Hậu Viên' }
];

const EXAM_INSTRUMENTS: { id: ExamTab; label: string; glyph: string }[] = [
  { id: 'vong', label: 'Soi Gương', glyph: '🪞' },
  { id: 'van', label: 'Nghe Thở', glyph: '👂' },
  { id: 'van-hoi', label: 'Thẻ Vấn', glyph: '🎋' },
  { id: 'thiet', label: 'Gối Mạch', glyph: '✋' }
];

const FIRE_TARGET_RANGES: Record<FireType, [number, number]> = {
  'vu-hoa': [75, 100],
  'van-vu': [42, 74],
  'van-hoa': [15, 41]
};

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
  const [clues, setClues] = useState<string[]>([`Chủ chứng: ${STORY_CASES[0].seasonTag}`]);
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

  // Minimal HUD Overlays & Modals
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [showCluesPopover, setShowCluesPopover] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [outcome, setOutcome] = useState<EvaluationResult | null>(null);
  const [scoopAnim, setScoopAnim] = useState<ScoopAnimationState | null>(null);
  const [justScoopedRole, setJustScoopedRole] = useState<RoleSlot | null>(null);

  const viewportRef = useRef<HTMLDivElement | null>(null);
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

  const hasDragonScale = yDucPoints >= 25;
  const hasBatTrangPot = yDucPoints >= 60;
  const hasJadeSeal = yDucPoints >= 100;

  const lockViewportScrollZero = useCallback(() => {
    if (viewportRef.current && viewportRef.current.scrollLeft !== 0) {
      viewportRef.current.scrollLeft = 0;
    }
  }, []);

  const switchRoom = useCallback(
    (nextRoom: 0 | 1 | 2 | 3) => {
      setShowCluesPopover(false);
      lockViewportScrollZero();
      setActiveRoom((cur) => {
        if (cur !== nextRoom) {
          apothecaryAudio.playRoomSlide();
          apothecaryAudio.setActiveRoom(nextRoom);
        }
        return nextRoom;
      });
    },
    [lockViewportScrollZero]
  );

  useEffect(() => {
    lockViewportScrollZero();
    apothecaryAudio.setActiveRoom(activeRoom);
    apothecaryAudio.setElementMood(selectedCase.targetDiagnosis.primaryElement);
  }, [activeRoom, selectedCase.targetDiagnosis.primaryElement, lockViewportScrollZero]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || outcome || showLedgerModal || showDirectoryModal) {
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
  }, [activeRoom, outcome, showLedgerModal, showDirectoryModal, switchRoom]);

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

  const activeFireRange = FIRE_TARGET_RANGES[fire];
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
    setShowDirectoryModal(false);
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
      }, 480);
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
    }, 640);

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
    window.setTimeout(() => setFanBlowing(false), 360);
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
    }, 520);
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

  const mentorHint =
    activeRoom === 0
      ? 'Mẹo Sư Phụ: Chạm 4 pháp khí tròn trên bàn (Gương · Tai · Tre · Mạch) để thu chứng trạng rồi xoay Đĩa Đồng Bát Quái.'
      : activeRoom === 1
      ? 'Mẹo Sư Phụ: Kéo hộc tủ Bách Tử bỏ vào 4 đĩa đồng treo, chạm Cối hoặc Chảo trên bàn để Bào chế rồi Gói Giấy Hồng Điều.'
      : activeRoom === 2
      ? 'Mẹo Sư Phụ: Quạt nan chỉnh nhiệt vào vùng sáng, bật Ngải cứu (Chương 3) rồi Dập Ấn Triện giao thuốc.'
      : 'Mẹo Sư Phụ: Tưới sương sớm & hái lá tươi quanh vườn mang vào Dược Các tăng tinh khiết.';

  return (
    <div className={`clinic-stage ${watchLightingClass} ${stampingActive ? 'stamp-shake' : ''}`}>
      {/* Minimal Diegetic Floating HUD (Zero Stacked Box Toolbars) */}
      <div className="stage-floating-hud">
        <div className="hud-cluster">
          <button
            type="button"
            className="hud-scroll-btn"
            onClick={() => {
              apothecaryAudio.playPageTurn();
              setShowDirectoryModal(true);
            }}
          >
            📜 Ca &amp; Sổ Y Án
          </button>
          <button
            type="button"
            className="hud-scroll-btn"
            onClick={handleSpawnProcedural}
            title="Gõ mõ vén rèm đón người bệnh mới"
          >
            🔔 Đón Khách
          </button>
        </div>

        {/* 4 Round Octagonal Room Medallions Connected by Gold Thread */}
        <nav className="room-medallions-rail" role="tablist" aria-label="4 khu vực y quán">
          {ROOM_NODES.map((node) => {
            const isCurrent = activeRoom === node.idx;
            return (
              <button
                key={node.idx}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                className={`room-medallion-btn ${isCurrent ? 'active' : ''}`}
                onClick={() => switchRoom(node.idx)}
              >
                <span className="medallion-roman">{node.roman}</span>
                <span className="medallion-label">{node.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hud-cluster" style={{ position: 'relative' }}>
          <span className="yduc-badge-mini" title="Điểm Y Đức mở khóa Bảo vật Trấn Quán">
            Y Đức {yDucPoints}
          </span>
          <button
            type="button"
            className="hud-scroll-btn"
            onClick={() => {
              apothecaryAudio.playPageTurn();
              setShowCluesPopover((v) => !v);
            }}
            aria-expanded={showCluesPopover}
          >
            📋 Chứng trạng ({clues.length})
          </button>

          {showCluesPopover && (
            <div className="floating-clues-popover" role="dialog" aria-label="Sổ tay chứng trạng nhanh">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontFamily: 'var(--font-serif)' }}>{selectedCase.patientName}</strong>
                <span className="muted-note" style={{ fontSize: '0.75rem' }}>
                  {diagnosis.location === 'bieu' ? 'Biểu' : 'Lý'} / {diagnosis.nature === 'han' ? 'Hàn' : 'Nhiệt'} /{' '}
                  {diagnosis.state === 'hu' ? 'Hư' : 'Thực'}
                </span>
              </div>
              <div className="clue-list">
                {clues.map((c, i) => (
                  <span key={i} className="clue-chip">
                    <GlossaryText text={c} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Viewport + Potion-Craft Edge Slide Arrows */}
      <div className="stage-shell-relative">
        {activeRoom > 0 && (
          <button
            type="button"
            className="room-edge-arrow left"
            onClick={() => switchRoom((activeRoom - 1) as 0 | 1 | 2 | 3)}
            aria-label="Trượt sang buồng bên trái"
            title="Sang buồng trước (Phím ← hoặc A)"
          >
            ‹
          </button>
        )}
        {activeRoom < 3 && (
          <button
            type="button"
            className="room-edge-arrow right"
            onClick={() => switchRoom((activeRoom + 1) as 0 | 1 | 2 | 3)}
            aria-label="Trượt sang buồng bên phải"
            title="Sang buồng tiếp theo (Phím → hoặc D)"
          >
            ›
          </button>
        )}

        <div
          ref={viewportRef}
          className="apothecary-room-viewport"
          onScroll={lockViewportScrollZero}
        >
          <div
            className="apothecary-room-track four-rooms-track"
            style={{ transform: `translate3d(-${activeRoom * 25}%, 0, 0)` }}
          >
            {/* ================= ROOM 1: TIỀN ĐƯỜNG TIẾP BỆNH ================= */}
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
                        {activeWatch.branch} ({activeWatch.organ} vượng) · Chuyển buồng bằng mũi tên hai bên hoặc phím <kbd>1</kbd>–<kbd>4</kbd>
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
                    </div>
                  </div>
                </div>
              </div>

              <div className="desk-grid room-inner-grid">
                {/* 4 Round Instrument Medallions on Desk */}
                <div className="woodblock-sheet stitched-binding">
                  <div className="instrument-tray" role="tablist" aria-label="Pháp khí Tứ Chẩn">
                    {EXAM_INSTRUMENTS.map((inst) => (
                      <button
                        key={inst.id}
                        type="button"
                        role="tab"
                        aria-selected={examTab === inst.id}
                        className={`instrument-coin-btn ${examTab === inst.id ? 'active' : ''}`}
                        onClick={() => {
                          setExamTab(inst.id);
                          apothecaryAudio.playPageTurn();
                        }}
                      >
                        <span className="instrument-glyph" aria-hidden="true">{inst.glyph}</span>
                        <span className="instrument-name">
                          {inst.id === 'van-hoi'
                            ? `${inst.label} (${askedIds.length}/${selectedCase.maxInquiries})`
                            : inst.label}
                        </span>
                      </button>
                    ))}
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
                          Rút thẻ tre hỏi bệnh (còn <strong>{selectedCase.maxInquiries - askedIds.length}</strong> lượt):
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
                </div>

                {/* Right of Room 1: Rotating Brass Dial Bát Quái */}
                <div className="woodblock-sheet">
                  <EightPrinciplesCompass
                    initialVector={selectedCase.initialVector}
                    previewVector={preview.resultingVector}
                    balanceScore={preview.balanceScore}
                    diagnosis={diagnosis}
                    onChangeDiagnosis={setDiagnosis}
                    showTreatmentProjection={hasAssignedTreatment}
                  />

                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      className="btn-cinnabar"
                      style={{ width: '100%' }}
                      onClick={() => switchRoom(1)}
                    >
                      Sang II. Dược Các &amp; Cân Tiểu Ly →
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= ROOM 2: DƯỢC CÁC — CÂN ĐĨA TREO & ĐẠO CỤ BÀO CHẾ ================= */}
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
                      Chạm 4 đĩa đồng treo · Kéo hộc tủ bốc thuốc · Dùng Cối Giã / Chảo Sao ngay trên bàn
                    </p>
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

                <BrassScaleRig
                  slots={slots}
                  slotPaoZhi={slotPaoZhi}
                  selectedSlot={selectedSlot}
                  justScoopedRole={justScoopedRole}
                  animatingPanRole={animatingPanRole}
                  freshHerbIds={freshHerbIds}
                  coldHeatBalance={preview.resultingVector.coldHeat}
                  hasTreatment={hasAssignedTreatment}
                  hasDragonScale={hasDragonScale}
                  panRefs={panRefs}
                  onSelectSlot={setSelectedSlot}
                  onAssignHerb={handleAssignHerb}
                />

                <PaoZhiRig
                  selectedSlot={selectedSlot}
                  slots={slots}
                  slotPaoZhi={slotPaoZhi}
                  animatingPanRole={animatingPanRole}
                  packetWrapped={packetWrapped}
                  onSelectPaoZhi={handleSelectPaoZhi}
                  onWrapAndGo={handleWrapHerbPacketAndGoRoom3}
                />

                {activeFormulas.length > 0 && (
                  <div className="synergy-banner">
                    <strong style={{ color: '#E7B96A', fontFamily: 'var(--font-serif)' }}>
                      Cộng hưởng Cổ phương ({activeFormulas.map((f) => f.name).join(' + ')}):
                    </strong>{' '}
                    <span>{activeFormulas[0].principle}</span>
                  </div>
                )}

                {preview.alerts.map((al, i) => (
                  <div
                    key={`${al.sourceId}-${i}`}
                    className={`alert-banner ${al.severity === 'caution' ? 'caution' : ''}`}
                  >
                    {al.message}
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.82rem', color: 'var(--ink-muted)', margin: '6px 0' }}>
                  <span>
                    Tủ Thuốc Bách Tử (Bốc vào <strong>{ROLE_TITLES[selectedSlot]}</strong>)
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.74rem' }}
                    onClick={() => switchRoom(3)}
                  >
                    Giỏ lá tươi ({freshHerbIds.length}) · Ra Hậu Viên →
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
                              <strong>Quy kinh:</strong> {hoveredHerb.herb.meridians.join(', ')}
                            </div>
                          </div>
                        </div>
                        <p style={{ margin: '0 0 5px', fontSize: '0.78rem', lineHeight: 1.4 }}>
                          {hoveredHerb.herb.summary}
                        </p>
                        {hoveredHerb.herb.contraindications.warningText && (
                          <div className="tooltip-warn">
                            <strong>Kiêng kỵ:</strong> {hoveredHerb.herb.contraindications.warningText}
                          </div>
                        )}
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
                                  {ROLE_TITLES[assignedRole].replace(' dược', '')}
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
                                    Bốc vào {ROLE_TITLES[selectedSlot]}
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
                  </div>
                </div>
              </div>
            </section>

            {/* ================= ROOM 3: NỘI CÁC, LÒ SẮC SỐNG ĐỘNG & ẤN TRIỆN ================= */}
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
                      Nội Các — Kinh Lạc Đắc Khí &amp; Hỏa Lò {hasBatTrangPot ? '· Siêu Bát Tràng' : ''}
                    </h2>
                    <p className="room-stage-sub">
                      Chạm trực tiếp huyệt đạo trên lụa · Quạt nan bùng lửa &amp; Dập ấn triện Chu Sa
                    </p>
                  </div>
                </div>
              </div>

              <div className="desk-grid room-inner-grid">
                <div className="woodblock-sheet">
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

                <div className="woodblock-sheet">
                  <StoveAndSealRig
                    fire={fire}
                    dosing={dosing}
                    fanHeat={fanHeat}
                    fanBlowing={fanBlowing}
                    hasBatTrangPot={hasBatTrangPot}
                    hasJadeSeal={hasJadeSeal}
                    stampingActive={stampingActive}
                    assignedHerbsText={assignedHerbsSummary.join(', ')}
                    patientName={selectedCase.patientName}
                    onSelectFire={(nextFire) => {
                      setFire(nextFire);
                      const [lo, hi] = FIRE_TARGET_RANGES[nextFire];
                      setFanHeat(Math.round((lo + hi) / 2));
                      apothecaryAudio.playStoveSimmer(nextFire === 'vu-hoa');
                    }}
                    onSelectDosing={(nextDos) => {
                      setDosing(nextDos);
                      apothecaryAudio.playPageTurn();
                    }}
                    onFanStroke={handleFanStroke}
                    onStampSubmit={handleFinalStampSubmit}
                  />

                  {preview.alerts.map((al, i) => (
                    <div
                      key={`r3-${al.sourceId}-${i}`}
                      className={`alert-banner ${al.severity === 'caution' ? 'caution' : ''}`}
                    >
                      {al.message}
                    </div>
                  ))}
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
                      Tưới sương sớm &amp; hái lá tươi mang vào Dược Các tăng tinh khiết cho thang thuốc
                    </p>
                  </div>
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
      </div>

      {/* Directory Drawer Modal (📜 Mục Lục Ca, Y Đức & Sổ Y Án) */}
      {showDirectoryModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Mục lục ca bệnh và Sổ Y Án">
          <div className="woodblock-sheet modal-scroll sac-phong-frame">
            <div className="section-heading">
              <span>Mục Lục Bệnh Án &amp; Công Đức Tuệ Tâm Đường</span>
              <button type="button" className="btn-secondary" onClick={() => setShowDirectoryModal(false)}>
                Đóng lại
              </button>
            </div>

            <div className="yduc-relics-pill" style={{ marginBottom: '12px' }}>
              <strong>Điểm Y Đức: {yDucPoints}</strong>
              <span className={`relic-dot ${hasDragonScale ? 'unlocked' : ''}`}>
                {hasDragonScale ? '✓ Cân Giao Long' : '25đ: Cân Long'}
              </span>
              <span className={`relic-dot ${hasBatTrangPot ? 'unlocked' : ''}`}>
                {hasBatTrangPot ? '✓ Siêu Bát Tràng (+1đ)' : '60đ: Siêu Bát Tràng'}
              </span>
              <span className={`relic-dot ${hasJadeSeal ? 'unlocked' : ''}`}>
                {hasJadeSeal ? '✓ Ấn Bạch Ngọc' : '100đ: Ấn Bạch Ngọc'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {([1, 2, 3] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={`chapter-btn ${activeChapter === ch ? 'active' : ''}`}
                  disabled={ch > unlockedChapter}
                  onClick={() => handleSelectChapter(ch)}
                >
                  Chương {ch}: {ch === 1 ? 'Biểu Lý Hàn Nhiệt' : ch === 2 ? 'Tạng Phủ Ngũ Hành' : 'Kinh Lạc'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
              {chapterCases.map((c) => {
                const done = completedCases[c.id];
                const isCur = c.id === selectedCase.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`exam-option-plaque ${isCur ? 'picked' : ''}`}
                    onClick={() => loadPatient(c, true)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <strong>{c.title}</strong>
                      <span style={{ color: '#E7B96A', fontSize: '0.8rem' }}>
                        {done ? `Đã đạt ${done.bestScore}đ` : 'Chưa trị'}
                      </span>
                    </div>
                    <div className="opt-detail">{c.patientName} · {c.seasonTag}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowDirectoryModal(false);
                  setShowLedgerModal(true);
                }}
              >
                Mở Sổ Lưu Y Án ({caseLedger.length})
              </button>
              <button type="button" className="btn-cinnabar" onClick={handleSpawnProcedural}>
                Gõ Mõ Đón Khách Vãng Lai mới
              </button>
            </div>
          </div>
        </div>
      )}

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
