import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SONG_AN_PAIRS, STORY_CASES, generateProceduralCase, getSeasonalSolarTerm } from '../data/cases';
import { TY_NGO_WATCHES } from '../data/acupoints';
import { detectActiveFormulas } from '../data/formulas';
import { HERB_MAP, HERBS } from '../data/herbs';
import { apothecaryAudio, VoiceArchetype } from '../engine/audio';
import { FloatingCallout, FloatingJuiceLayer } from './FloatingJuiceLayer';
import { TypewriterText } from './TypewriterText';
import {
  assignHerbToSlot,
  BIEN_CHUNG_MAX_ATTEMPTS,
  BIEN_CHUNG_MIN_CLUES,
  BienChungRecord,
  checkBienChung,
  computeTreatmentPreview,
  describeDecoctionTaste,
  emptySlots,
  evaluateCaseSubmission,
  getTyNgoWatch
} from '../engine/tcmEngine';
import { buildFollowUpCase, dueFollowUps, planFollowUp } from '../engine/followUp';
import {
  CaseLedgerEntry,
  ClassicalFormula,
  DecoctionChoice,
  DiagnosisChoice,
  DosingAdvice,
  EvaluationResult,
  FireType,
  Herb,
  PaoZhiMethod,
  PatientCase,
  PendingFollowUp,
  PrescriptionSlots,
  RoleSlot,
  SlotPaoZhi
} from '../types/tcm';
import { AmbientParticlesCanvas } from './AmbientParticlesCanvas';
import { BrassScaleRig } from './BrassScaleRig';
import { CaseLedgerModal } from './CaseLedgerModal';
import { EightPrinciplesCompass } from './EightPrinciplesCompass';
import { FirstCaseGuideBar } from './FirstCaseGuideBar';
import { FloatingAtmosphereCanvas } from './FloatingAtmosphereCanvas';
import { GlossaryText } from './GlossaryText';
import { HerbGardenRoom } from './HerbGardenRoom';
import { MeridianBodyMap } from './MeridianBodyMap';
import { OutcomeScrollModal } from './OutcomeScrollModal';
import { PaoZhiRig } from './PaoZhiRig';
import { PaperFoldOverlay } from './PaperFoldOverlay';
import { PulseCanvas } from './PulseCanvas';
import { StoveAndSealRig } from './StoveAndSealRig';
import { BotanicalSvg } from './svg/BotanicalSvg';
import { AntiqueIcon } from './svg/AntiqueIcons';
import { HealerHandOverlay, ScoopAnimationState } from './svg/HealerHandOverlay';
import { TongueMirror } from './svg/TongueMirror';
import { VillagerPortrait } from './svg/VillagerPortrait';
import { BienChungLedger } from './clinic/BienChungLedger';
import { CaseDirectoryModal } from './clinic/CaseDirectoryModal';
import { FollowUpLetterModal } from './clinic/FollowUpLetterModal';
import { TabletopDesk } from './clinic/TabletopDesk';
import {
  FIRE_TARGET_RANGES,
  ROLE_TITLES,
  ROOM_NODES,
  SOLAR_WEATHER,
  TabletopTool,
  WATCH_LIGHT
} from './clinic/clinicConstants';

interface ClinicDeskProps {
  unlockedChapter: 1 | 2 | 3;
  completedCases: Record<string, { bestScore: number }>;
  caseLedger: CaseLedgerEntry[];
  yDucPoints: number;
  dayCount: number;
  pendingFollowUps: PendingFollowUp[];
  currentStreak: number;
  songAnClearedIds: string[];
  discoveredFormulas: string[];
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

export const ClinicDesk: React.FC<ClinicDeskProps> = ({
  unlockedChapter: _unlockedChapter,
  completedCases,
  caseLedger,
  yDucPoints,
  dayCount,
  pendingFollowUps,
  currentStreak: _currentStreak,
  songAnClearedIds,
  discoveredFormulas,
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

  // Examination state (Spatial 2.0: starts null for open cinematic Tiền Đường view)
  const [activeToolDrawer, setActiveToolDrawer] = useState<TabletopTool | null>(null);
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [incenseLitCaseId, setIncenseLitCaseId] = useState<string | null>(null);
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
  const [bienChung, setBienChung] = useState<BienChungRecord>({ sealed: false, failedAttempts: 0 });
  // Axes the player chose this case; the default diagnosis must never count as a deduction.
  const [openLetter, setOpenLetter] = useState<PendingFollowUp | null>(null);
  const [ledgerFx, setLedgerFx] = useState<'sealed' | 'rejected' | null>(null);
  const [pickedAxes, setPickedAxes] = useState<(keyof DiagnosisChoice)[]>([]);
  const changeDiagnosis = (next: DiagnosisChoice, axis?: keyof DiagnosisChoice) => {
    if (bienChung.sealed) return;
    const changed = axis ? [axis] : (Object.keys(next) as (keyof DiagnosisChoice)[]).filter((k) => next[k] !== diagnosis[k]);
    setPickedAxes((prev) => [...new Set([...prev, ...changed])]);
    setDiagnosis(next);
  };
  const [slots, setSlots] = useState<PrescriptionSlots>(emptySlots());
  const [slotPaoZhi, setSlotPaoZhi] = useState<SlotPaoZhi>({});
  const [animatingPanRole, setAnimatingPanRole] = useState<RoleSlot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<RoleSlot>('quan');
  const [chestFilter, setChestFilter] = useState<'all' | 'warm' | 'cool' | 'neutral' | 'fresh'>('all');
  const [roomTransitioning, setRoomTransitioning] = useState(false);
  const [callouts, setCallouts] = useState<FloatingCallout[]>([]);
  const calloutIdRef = useRef(0);

  const pushCallout = useCallback((text: string, tone: 'gold' | 'jade' | 'cinnabar' = 'gold') => {
    calloutIdRef.current += 1;
    const id = calloutIdRef.current;
    setCallouts((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => {
      setCallouts((prev) => prev.filter((c) => c.id !== id));
    }, 1700);
  }, []);
  const [openDrawerId, setOpenDrawerId] = useState<string | null>(null);
  const [draggingHerbId, setDraggingHerbId] = useState<string | null>(null);
  const [hoveredHerb, setHoveredHerb] = useState<{ herb: Herb; left: number; top: number } | null>(null);
  const [showFoldOverlay, setShowFoldOverlay] = useState(false);
  const [packetWrapped, setPacketWrapped] = useState(false);
  const [selectedAcupoints, setSelectedAcupoints] = useState<string[]>([]);
  const [moxaEnabled, setMoxaEnabled] = useState(false);
  const [cuppingEnabled, setCuppingEnabled] = useState(false);
  const [fire, setFire] = useState<FireType>('van-vu');
  const [fanHeat, setFanHeat] = useState<number>(56);
  const [fanBlowing, setFanBlowing] = useState(false);
  const [dosing, setDosing] = useState<DosingAdvice>('am-duong-tang');
  const [stampingActive, setStampingActive] = useState(false);
  const [deskShake, setDeskShake] = useState(false);

  // Minimal HUD Overlays & Modals
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [activeSongAnId, setActiveSongAnId] = useState<string | null>(null);
  const [showCluesPopover, setShowCluesPopover] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [outcome, setOutcome] = useState<EvaluationResult | null>(null);
  const [scoopAnim, setScoopAnim] = useState<ScoopAnimationState | null>(null);
  const [justScoopedRole, setJustScoopedRole] = useState<RoleSlot | null>(null);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const deskRoom2Ref = useRef<HTMLDivElement | null>(null);
  const chestWrapRef = useRef<HTMLDivElement | null>(null);
  const inspectorRef = useRef<HTMLElement | null>(null);

  // On phones the drawer stacks below the patient, under the fixed tray — bring it into view when a tool opens.
  useEffect(() => {
    if (!activeToolDrawer || !window.matchMedia('(max-width: 960px)').matches) return;
    inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeToolDrawer]);
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
  const watchLight = WATCH_LIGHT[Math.max(0, TY_NGO_WATCHES.indexOf(activeWatch))];
  const solarTerm = useMemo(() => getSeasonalSolarTerm(dayCount), [dayCount]);
  const tasteReading = useMemo(
    () => describeDecoctionTaste(selectedCase, slots, fire, selectedAcupoints, slotPaoZhi),
    [selectedCase, slots, fire, selectedAcupoints, slotPaoZhi]
  );
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
          setRoomTransitioning(true);
          window.setTimeout(() => setRoomTransitioning(false), 540);
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

  const availableHerbs = useMemo(() => {
    if (chestFilter === 'warm') return HERBS.filter((h) => h.nature === 'Ôn' || h.nature === 'Nhiệt');
    if (chestFilter === 'cool') return HERBS.filter((h) => h.nature === 'Hàn' || h.nature === 'Lương' || h.nature === 'Đại hàn');
    if (chestFilter === 'neutral') return HERBS.filter((h) => h.nature === 'Bình');
    if (chestFilter === 'fresh') return HERBS.filter((h) => freshHerbIds.includes(h.id));
    return HERBS;
  }, [chestFilter, freshHerbIds]);

  const patientVoice: VoiceArchetype = useMemo(() => {
    if (selectedCase.age >= 55) return 'elder';
    if (selectedCase.age <= 20) return 'youth';
    if (selectedCase.isPregnant || /(Bà|Cô|Chị|Nương|Phu nhân)/i.test(selectedCase.patientName)) return 'lady';
    return 'merchant';
  }, [selectedCase]);

  const weatherMoodClass = useMemo(() => {
    const tag = selectedCase.seasonTag.toLowerCase();
    if (/mưa|lạnh|đông|gió bấc|ẩm/.test(tag) || selectedCase.initialVector.coldHeat <= -45) return 'atmo-rain';
    if (/đêm|khuya|mất ngủ|tối/.test(tag)) return 'atmo-night';
    if (/nắng|hạ|nóng|khô/.test(tag) || selectedCase.initialVector.coldHeat >= 45) return 'atmo-warm';
    return 'atmo-spring';
  }, [selectedCase]);

  const preview = useMemo(
    () => computeTreatmentPreview(selectedCase, slots, selectedAcupoints, slotPaoZhi),
    [selectedCase, slots, selectedAcupoints, slotPaoZhi]
  );

  const activeFormulas = useMemo(() => detectActiveFormulas(slots), [slots]);
  const hasAssignedHerbs = Object.values(slots).some(Boolean);
  const hasAssignedTreatment = hasAssignedHerbs || selectedAcupoints.length > 0;

  // Colour = health: the patient's portrait (and, faintly, the room) regain colour as the prescription rebalances them.
  const health = outcome?.passed ? 1 : preview.balanceScore / 100;
  const healthColorVars = {
    '--health-sat': (outcome?.passed ? 1.15 : 0.3 + 0.75 * health).toFixed(2),
    '--room-sat': (0.7 + 0.3 * health).toFixed(2),
    '--watch-tint': watchLight.tint,
    '--watch-strength': watchLight.strength,
    '--sun-angle': watchLight.angle,
    // depth of field: the examination room blurs behind an open instrument drawer
    '--focus-blur': activeToolDrawer ? '3px' : '0px'
  } as React.CSSProperties;
  // Weather follows the solar term rather than the wall clock.
  const solarWeather = SOLAR_WEATHER[solarTerm.name] ?? 'sunbeams';

  const activeFireRange = FIRE_TARGET_RANGES[fire];
  const isFanMatched = fanHeat >= activeFireRange[0] && fanHeat <= activeFireRange[1];

  const loadPatient = (nextCase: PatientCase, withCurtain = true) => {
    setSelectedCase(nextCase);
    setActiveToolDrawer(null);
    setAskedIds([]);
    setClues([`Chủ chứng: ${nextCase.seasonTag}`]);
    setInspectedAudio(false);
    setBienChung({ sealed: false, failedAttempts: 0 });
    setPickedAxes([]);
    setLedgerFx(null);
    setSlots(emptySlots());
    setSlotPaoZhi({});
    setSelectedSlot('quan');
    setOpenDrawerId(null);
    setHoveredHerb(null);
    setPacketWrapped(false);
    setShowFoldOverlay(false);
    setSelectedAcupoints([]);
    setMoxaEnabled(false);
    setCuppingEnabled(false);
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

  const effectiveMaxInquiries =
    selectedCase.maxInquiries + (incenseLitCaseId === selectedCase.id ? 1 : 0);

  const handleAskQuestion = (qId: string, clueTag: string) => {
    if (askedIds.includes(qId)) return;
    if (askedIds.length >= effectiveMaxInquiries) return;
    setAskedIds((prev) => [...prev, qId]);
    addClue(clueTag);
    apothecaryAudio.playBambooTally();
  };

  const handleLightDeskIncense = () => {
    if (yDucPoints < 20) {
      pushCallout(`Cần 20 Y Đức để đặt Đỉnh Trầm Hương (hiện có ${yDucPoints})`, 'gold');
      return;
    }
    apothecaryAudio.playCurtainBell();
    if (incenseLitCaseId !== selectedCase.id) {
      setIncenseLitCaseId(selectedCase.id);
      pushCallout('Thắp Trầm Định Thần · +1 Lượt Hỏi Thẻ Vấn!', 'jade');
    } else {
      pushCallout('Hương trầm đang lan tỏa khắp Tiền Đường...', 'gold');
    }
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
      }, 560);
    }, 700);
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
      apothecaryAudio.playHerbDrop(HERB_MAP[herbId]?.motif);
      const herbObj = HERB_MAP[herbId];
      if (herbObj) triggerScoopAnimation(herbObj, role);
      const nextOrder: RoleSlot[] = ['quan', 'than', 'ta', 'su'];
      const nextEmpty = nextOrder.find((r) => r !== role && !after[r]);
      if (nextEmpty) setSelectedSlot(nextEmpty);
    }
  };

  const handleApplyFormula = (formula: ClassicalFormula) => {
    const picked = [
      ...formula.requiredHerbs,
      ...(formula.optionalAnyHerbs?.slice(0, Math.max(0, 3 - formula.requiredHerbs.length)) ?? [])
    ].slice(0, 3);
    const roles: RoleSlot[] = ['quan', 'than', 'ta'];
    const nextSlots: PrescriptionSlots = emptySlots();
    picked.forEach((herbId, idx) => {
      if (roles[idx] && HERB_MAP[herbId]) {
        nextSlots[roles[idx]] = herbId;
      }
    });
    if (!nextSlots.su) nextSlots.su = 'cam-thao';
    setSlots(nextSlots);
    setPacketWrapped(false);
    setSlotPaoZhi({});
    setSelectedSlot('ta');
    apothecaryAudio.playHerbDrop();
    pushCallout(`Cộng Hưởng Cổ Phương: ${formula.name}`, 'gold');
    if (nextSlots.quan && HERB_MAP[nextSlots.quan]) {
      triggerScoopAnimation(HERB_MAP[nextSlots.quan]!, 'quan');
    }
  };

  const handleSelectPaoZhi = (role: RoleSlot, method: PaoZhiMethod) => {
    setSlotPaoZhi((prev) => ({ ...prev, [role]: method }));
    setAnimatingPanRole(role);
    window.setTimeout(() => {
      setAnimatingPanRole((cur) => (cur === role ? null : cur));
    }, 640);

    if (method === 'gia-dap') {
      apothecaryAudio.playMortarGrind();
      pushCallout('Giã Dập Tinh Dầu · Tăng Dược Lực!', 'jade');
    } else if (method === 'sao-vang') {
      apothecaryAudio.playWokSizzle(false);
      pushCallout('Sao Vàng Hạ Thổ · Ôn Trung!', 'gold');
    } else if (method === 'chich-mat') {
      apothecaryAudio.playWokSizzle(true);
      pushCallout('Chích Mật Nhuận Phế · Hòa Vị!', 'gold');
    } else {
      apothecaryAudio.playPageTurn();
    }
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
    setSelectedAcupoints((prev) => {
      const removing = prev.includes(ptId);
      if (!removing) pushCallout('Kim Châm Đắc Khí!', 'cinnabar');
      return removing ? prev.filter((id) => id !== ptId) : [...prev, ptId];
    });
    apothecaryAudio.playNeedleInsert();
  };

  const handleFanStroke = (up: boolean) => {
    apothecaryAudio.playBambooFan();
    navigator.vibrate?.(8);
    setFanBlowing(true);
    setFanHeat((prev) => {
      const next = Math.max(10, Math.min(100, prev + (up ? 14 : -14)));
      const [lo, hi] = FIRE_TARGET_RANGES[fire];
      if (next >= lo && next <= hi && (prev < lo || prev > hi)) {
        pushCallout('Hỏa Hầu Chuẩn! (+2đ)', 'gold');
      }
      return next;
    });
    window.setTimeout(() => setFanBlowing(false), 360);
  };

  const bienChungInkLeft = BIEN_CHUNG_MAX_ATTEMPTS - bienChung.failedAttempts;
  const bienChungReady = clues.length >= BIEN_CHUNG_MIN_CLUES && pickedAxes.length === 4;
  const handleSealBienChung = () => {
    if (bienChung.sealed || bienChungInkLeft <= 0 || !bienChungReady) return;
    const ok = checkBienChung(selectedCase, diagnosis);
    apothecaryAudio.playSealStamp(ok);
    setLedgerFx(ok ? 'sealed' : 'rejected');
    window.setTimeout(() => setLedgerFx(null), 700);
    if (ok) {
      setBienChung({ ...bienChung, sealed: true });
      pushCallout('Sổ Biện Chứng đã ấn chứng!', 'jade');
      setDeskShake(true);
      window.setTimeout(() => setDeskShake(false), 300);
      navigator.vibrate?.(40);
    } else {
      setBienChung({ ...bienChung, failedAttempts: bienChung.failedAttempts + 1 });
      pushCallout(`Chưa ấn chứng — còn ${bienChungInkLeft - 1} nét mực`, 'cinnabar');
    }
  };

  const handleShowRelics = () => {
    apothecaryAudio.playPageTurn();
    const unlockedList = [
      yDucPoints >= 20 ? 'Đỉnh Trầm Hương' : null,
      hasDragonScale ? 'Cân Giao Long' : null,
      hasBatTrangPot ? 'Siêu Bát Tràng' : null,
      hasJadeSeal ? 'Ấn Ngọc Bích' : null
    ].filter(Boolean);
    pushCallout(
      unlockedList.length > 0
        ? `Bảo vật hiện hữu: ${unlockedList.join(' · ')}`
        : 'Tích 20 Y Đức để thỉnh Đỉnh Trầm Hương về bàn khám',
      hasJadeSeal ? 'jade' : 'gold'
    );
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
            cuppingEnabled,
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
      decoctionPayload,
      bienChung
    );

    const followUp = planFollowUp(selectedCase, res, dayCount);
    if (followUp) {
      window.setTimeout(
        () =>
          pushCallout(
            `${followUp.patientName} sẽ quay lại tái khám sau ${followUp.dueDay - dayCount - 1} ngày`,
            'cinnabar'
          ),
        900
      );
    }

    setStampingActive(true);
    apothecaryAudio.playSealStamp(res.passed);
    navigator.vibrate?.(res.passed ? 60 : [30, 40, 30]);
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
    const storyId = selectedCase.followUpOf ?? selectedCase.id;
    const idx = STORY_CASES.findIndex((c) => c.id === storyId);
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

  return (
    <div
      className={`clinic-stage spatial-clinic-stage ${watchLightingClass} ${weatherMoodClass} ${stampingActive || deskShake ? 'stamp-shake' : ''}`}
      style={healthColorVars}
    >
      <div className="ambient-lantern-aura" aria-hidden="true" />
      <FloatingAtmosphereCanvas activeRoom={activeRoom} hasIncenseBurner={yDucPoints >= 20} />
      <FloatingJuiceLayer callouts={callouts} />
      {roomTransitioning && (
        <div className="room-transition-veil brush-sweep" aria-hidden="true">
          <svg viewBox="0 0 400 100" preserveAspectRatio="none">
            <defs>
              <filter id="brushSweepEdge">
                <feTurbulence type="fractalNoise" baseFrequency="0.035 0.6" numOctaves="2" seed="7" />
                <feDisplacementMap in="SourceGraphic" scale="16" />
              </filter>
            </defs>
            <path
              d="M0,28 C70,16 150,40 230,24 S350,18 400,30 L400,74 C330,86 250,62 170,78 S60,88 0,72 Z"
              filter="url(#brushSweepEdge)"
            />
          </svg>
        </div>
      )}

      {/* Floating Case Action Strip + Compact Onboarding (Overlays top-left cleanly without pushing layout) */}
      <div className={`spatial-floating-subbar ${mentorDismissed ? '' : 'has-guide'}`}>
        <div className="hud-cluster">
          <button
            type="button"
            className="hud-scroll-btn"
            onClick={() => {
              apothecaryAudio.playPageTurn();
              setShowDirectoryModal(true);
            }}
          >
            <AntiqueIcon name="scroll" size={13} /> <span>Ca &amp; Sổ Y Án</span>
          </button>
          <button
            type="button"
            className="hud-scroll-btn"
            onClick={handleSpawnProcedural}
            title="Gõ mõ vén rèm đón người bệnh mới"
          >
            <AntiqueIcon name="bell" size={13} /> <span>Đón Khách</span>
          </button>
          {dueFollowUps(pendingFollowUps, dayCount).map((fu) => {
            const fuCase = buildFollowUpCase(fu);
            if (!fuCase || fuCase.id === selectedCase.id) return null;
            return (
              <button
                key={fu.caseId}
                type="button"
                className="hud-scroll-btn follow-up-btn"
                onClick={() => {
                  apothecaryAudio.playPaperFold();
                  setOpenLetter(fu);
                }}
                title={fu.kind === 'chuyen-the' ? 'Bệnh đã chuyển sang thể khác' : 'Bệnh chưa lui hẳn'}
              >
                <AntiqueIcon name="bell" size={13} /> <span>Tái khám: {fu.patientName}</span>
              </button>
            );
          })}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="hud-scroll-btn"
              onClick={() => {
                apothecaryAudio.playPageTurn();
                setShowCluesPopover((v) => !v);
              }}
              aria-expanded={showCluesPopover}
            >
              <AntiqueIcon name="tally-board" size={13} /> <span>Chứng trạng ({clues.length})</span>
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

        {!mentorDismissed && (
          <FirstCaseGuideBar
            activeRoom={activeRoom}
            clueCount={clues.length}
            assignedHerbCount={assignedHerbObjects.length}
            hasPaoZhi={Object.values(slotPaoZhi).some((m) => m && m !== 'sinh-dung')}
            selectedAcupointCount={selectedAcupoints.length}
            onGoRoom={switchRoom}
            onDismiss={onDismissMentor}
          />
        )}
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
          onMouseMove={(e) => {
            if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
            const el = e.currentTarget;
            const r = el.getBoundingClientRect();
            const px = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
            const py = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
            el.style.setProperty('--px', px.toFixed(3));
            el.style.setProperty('--py', py.toFixed(3));
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.setProperty('--px', '0');
            e.currentTarget.style.setProperty('--py', '0');
          }}
        >
          <div
            className="apothecary-room-track four-rooms-track"
            style={{ transform: `translate3d(-${activeRoom * 25}%, 0, 0)` }}
          >
            {/* ================= ROOM 1: TIỀN ĐƯỜNG 2.0 — FULL-BLEED SPATIAL DIORAMA ================= */}
            <section
              className={`apothecary-room spatial-room ${activeRoom === 0 ? 'is-active-room' : ''}`}
              aria-label="Buồng 1: Tiền Đường Tiếp Bệnh"
            >
              <div className={`spatial-room-bg-layer ${curtainParting ? 'curtain-parting' : ''}`} aria-hidden="true">
                <img
                  src="./art/scenes/room-tien-duong.webp"
                  alt=""
                  fetchPriority="high"
                  className="room-bg-img spatial-full-bg health-tinted"
                />
                <div className={`watch-light ${watchLight.lamp ? "is-lamplit" : ""}`} aria-hidden="true" />
                <div className="spatial-bg-vignette" />
                <AmbientParticlesCanvas key={solarWeather} mode={solarWeather} />
                <div className="curtain-veil left" />
                <div className="curtain-veil right" />
              </div>

              <div className={`spatial-room-body tien-duong-spatial ${activeToolDrawer ? 'has-open-drawer' : ''}`}>
                {/* Left / Center Cinematic Patient & Speech Stage */}
                <div className="spatial-patient-stage">
                  <div className="stage-patient-centerpiece">
                    <div className="silk-scroll-mount" aria-hidden="true">
                      <div className="scroll-rod-cap stage-cap" />
                      <VillagerPortrait
                        patientCase={selectedCase}
                        size="stage"
                        activeExamTool={activeToolDrawer && activeToolDrawer !== 'bat-cuong' ? activeToolDrawer : null}
                        coughing={auscultating}
                      />
                      <div className="scroll-rod-cap stage-cap" />
                    </div>
                  </div>

                  <div className="spatial-dialogue-card">
                    <div className="stage-case-meta">
                      <h2 className="room-stage-title">{selectedCase.title}</h2>
                      <p className="room-stage-sub">
                        {activeWatch.branch} ({activeWatch.organ} vượng) · Tiết {solarTerm.name} ({solarTerm.hint})
                      </p>
                      {activeSongAnId && (() => {
                        const pair = SONG_AN_PAIRS.find((s) => s.id === activeSongAnId);
                        if (!pair) return null;
                        const partnerId = selectedCase.id === pair.caseAId ? pair.caseBId : pair.caseAId;
                        const partnerCase = STORY_CASES.find((c) => c.id === partnerId);
                        const bothDone =
                          (completedCases[pair.caseAId]?.bestScore ?? 0) >= 70 &&
                          (completedCases[pair.caseBId]?.bestScore ?? 0) >= 70;
                        return (
                          <div className="songan-active-ribbon">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <AntiqueIcon name="yin-yang" size={14} />
                              <strong>{pair.title}</strong> — {bothDone ? 'Đã hoàn thành Song Án!' : 'Chữa đủ 2 ca đối chứng để nhận +40 Y Đức.'}
                            </span>
                            {partnerCase && (
                              <button
                                type="button"
                                className="mini-toggle-chip"
                                onClick={() => loadPatient(partnerCase, true)}
                              >
                                Sang ca đối: {partnerCase.patientName} →
                              </button>
                            )}
                          </div>
                        );
                      })()}
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
                      「 <TypewriterText key={`cc-${selectedCase.id}`} text={selectedCase.chiefComplaint} voice={patientVoice} /> 」
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => {
                          apothecaryAudio.playPageTurn();
                          setActiveToolDrawer((cur) => (cur === 'bat-cuong' ? null : 'bat-cuong'));
                        }}
                      >
                        Chốt Bát Cương ({diagnosis.location === 'bieu' ? 'Biểu' : 'Lý'} · {diagnosis.nature === 'han' ? 'Hàn' : 'Nhiệt'})
                      </button>
                      <button type="button" className="btn-cinnabar" onClick={() => switchRoom(1)}>
                        Sang Dược Các Bốc Thuốc →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Floating Parchment Inspector Sheet (Slides in when picking up any tabletop tool) */}
                {activeToolDrawer && (
                  <aside
                    ref={inspectorRef}
                    className="spatial-inspector-drawer woodblock-sheet stitched-binding"
                    aria-label="Bảng pháp khí đang nhấc"
                  >
                    <div className="spatial-inspector-head">
                      <strong>
                        {activeToolDrawer === 'vong'
                          ? 'Vọng Chẩn — Gương Đồng Soi Lưỡi'
                          : activeToolDrawer === 'van'
                          ? 'Văn Chẩn — Lắng Nghe Thanh Âm'
                          : activeToolDrawer === 'van-hoi'
                          ? `Vấn Chẩn — Ống Thẻ Tre (${askedIds.length}/${effectiveMaxInquiries})`
                          : activeToolDrawer === 'thiet'
                          ? 'Thiết Chẩn — Gối Bắt Mạch'
                          : 'Đĩa Đồng Bát Quái — Chốt Biện Chứng'}
                      </strong>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '3px 9px', fontSize: '0.76rem' }}
                        onClick={() => {
                          apothecaryAudio.playPageTurn();
                          setActiveToolDrawer(null);
                        }}
                      >
                        Hạ xuống ×
                      </button>
                    </div>

                    <div className="spatial-inspector-scroll">
                      {activeToolDrawer === 'vong' && (
                        <div>
                          <p style={{ margin: '0 0 10px', fontSize: '0.86rem' }}>
                            <strong>Thần sắc bên ngoài:</strong>{' '}
                            <GlossaryText text={selectedCase.visualAppearance} />
                          </p>
                          <TongueMirror
                            tongue={selectedCase.tongue}
                            onInspectZone={(z) => addClue(`${z.label}: ${z.clueTag}`)}
                          />
                        </div>
                      )}

                      {activeToolDrawer === 'van' && (
                        <div className="auscultation-box">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            <strong>Lắng nghe thanh âm &amp; hơi thở:</strong>
                            <button
                              type="button"
                              className="btn-cinnabar"
                              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                              onClick={handlePlayAuscultation}
                            >
                              {auscultating ? 'Đang lắng nghe...' : 'Nghe hơi thở & tiếng ho'}
                            </button>
                          </div>
                          <div className={`auscultation-wave ${auscultating ? 'is-playing' : ''}`} aria-hidden="true">
                            <span /><span /><span /><span /><span /><span /><span /><span />
                          </div>
                          <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-serif)', fontSize: '0.94rem' }}>
                            <GlossaryText text={selectedCase.audioObservation} />
                          </p>
                        </div>
                      )}

                      {activeToolDrawer === 'van-hoi' && (
                        <div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: '8px' }}>
                            Rút thẻ tre hỏi bệnh (còn <strong>{effectiveMaxInquiries - askedIds.length}</strong> lượt):
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
                              .map((q) => {
                                const isLatest = askedIds[askedIds.length - 1] === q.id;
                                return (
                                  <React.Fragment key={q.id}>
                                    <div className="chat-turn-doctor">
                                      <span className="speaker-seal doctor">Lương Y</span> {q.question}
                                    </div>
                                    <div className="chat-turn-patient">
                                      <span className="speaker-seal patient">{selectedCase.patientName}</span>“
                                      <TypewriterText
                                        text={q.answer}
                                        voice={patientVoice}
                                        instant={!isLatest}
                                      />
                                      ”
                                      <div style={{ fontSize: '0.78rem', color: 'var(--herbal-jade)', fontWeight: 700, marginTop: '3px' }}>
                                        Ghi nhận: <GlossaryText text={q.clueTag} />
                                      </div>
                                    </div>
                                  </React.Fragment>
                                );
                              })}
                          </div>

                          <div className="inquiry-grid">
                            {selectedCase.inquiries
                              .filter((q) => !askedIds.includes(q.id))
                              .map((q) => {
                                const limitReached = askedIds.length >= effectiveMaxInquiries;
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

                      {activeToolDrawer === 'thiet' && (
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

                      {activeToolDrawer === 'bat-cuong' && (
                        <div>
                          <EightPrinciplesCompass
                            initialVector={selectedCase.initialVector}
                            previewVector={preview.resultingVector}
                            balanceScore={preview.balanceScore}
                            diagnosis={diagnosis}
                            onChangeDiagnosis={changeDiagnosis}
                            showTreatmentProjection={hasAssignedTreatment}
                          />
                          <BienChungLedger
                            diagnosis={diagnosis}
                            pickedAxes={pickedAxes}
                            clues={clues}
                            bienChung={bienChung}
                            ledgerFx={ledgerFx}
                            onSeal={handleSealBienChung}
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
                      )}
                    </div>
                  </aside>
                )}
              </div>
            </section>

            {/* ================= ROOM 2: DƯỢC CÁC 2.0 — FULL-BLEED SPATIAL WORKBENCH ================= */}
            <section
              className={`apothecary-room spatial-room ${activeRoom === 1 ? 'is-active-room' : ''}`}
              aria-label="Buồng 2: Dược Các và Bào Chế"
            >
              <div className="spatial-room-bg-layer" aria-hidden="true">
                <img
                  src="./art/scenes/room-duoc-cac.webp"
                  alt=""
                  className="room-bg-img spatial-full-bg"
                />
                <div className={`watch-light ${watchLight.lamp ? "is-lamplit" : ""}`} aria-hidden="true" />
                <div className="spatial-bg-vignette" />
                <AmbientParticlesCanvas mode="sunbeams" />
              </div>

              <div className="spatial-room-body spatial-room-scrollable">
                <div
                  ref={deskRoom2Ref}
                  className={`woodblock-sheet desk-right-col spatial-translucent-sheet ${draggingHerbId ? 'is-dragging-herb' : ''}`}
                >
                {/* Sticky Mini Patient Silk Scroll Strip for Effortless Cross-Room Deduction */}
                <div className="mini-patient-scroll-strip" aria-label="Tóm tắt bệnh án đang khám">
                  <VillagerPortrait patientCase={selectedCase} size="compact" />
                  <div className="mini-patient-meta">
                    <div className="mini-patient-head">
                      <strong>{selectedCase.patientName}</strong> ({selectedCase.age}t) · {selectedCase.seasonTag}
                      {selectedCase.isPregnant && (
                        <span className="tag-badge pregnant" style={{ marginLeft: '6px', padding: '1px 6px', fontSize: '0.68rem' }}>Thai phụ</span>
                      )}
                    </div>
                    <div className="mini-patient-vitals">
                      <span><strong>Lưỡi:</strong> {selectedCase.tongue.summary.split('—')[0].trim()}</span>
                      <span> · <strong>Mạch:</strong> {selectedCase.pulse.name}</span>
                    </div>
                  </div>
                  <div className="mini-patient-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.73rem' }}
                      onClick={() => switchRoom(0)}
                    >
                      ← Tiền Đường
                    </button>
                  </div>
                </div>

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
                  diagnosis={diagnosis}
                  initialVector={selectedCase.initialVector}
                  previewVector={preview.resultingVector}
                  balanceScore={preview.balanceScore}
                  alerts={preview.alerts}
                  hasTreatment={hasAssignedTreatment}
                  hasDragonScale={hasDragonScale}
                  discoveredFormulas={discoveredFormulas}
                  panRefs={panRefs}
                  onChangeDiagnosis={changeDiagnosis}
                  onSelectSlot={setSelectedSlot}
                  onAssignHerb={handleAssignHerb}
                  onApplyFormula={handleApplyFormula}
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
                    Tủ Thuốc Bách Tử ({HERBS.length} vị · Bốc vào <strong>{ROLE_TITLES[selectedSlot]}</strong>)
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
                    {([
                      { id: 'all', label: `Tất cả (${HERBS.length})` },
                      { id: 'warm', label: 'Ôn Ấm' },
                      { id: 'cool', label: 'Hàn Lương' },
                      { id: 'neutral', label: 'Bình Hòa' },
                      { id: 'fresh', label: `Lá Tươi (${freshHerbIds.length})` }
                    ] as const).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={`acupoint-chip ${chestFilter === tab.id ? 'active' : ''}`}
                        onClick={() => setChestFilter(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.74rem' }}
                      onClick={() => switchRoom(3)}
                    >
                      Giỏ lá tươi ({freshHerbIds.length}) · Ra Hậu Viên →
                    </button>
                  </div>
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
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', herb.id);
                              setDraggingHerbId(herb.id);
                              setHoveredHerb(null);
                            }}
                            onDragEnd={() => setDraggingHerbId(null)}
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
                              <div className="drawer-3d-open-box">
                                <div
                                  role="button"
                                  tabIndex={0}
                                  className="drawer-cedar-well"
                                  aria-label={`Nhón ${herb.name} bỏ vào ${ROLE_TITLES[selectedSlot]}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleScoopFromDrawer(herb);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleScoopFromDrawer(herb);
                                    }
                                  }}
                                >
                                  <div className="cedar-herbs-pile">
                                    <BotanicalSvg herbId={herb.id} motif={herb.motif} size={52} bare />
                                  </div>
                                  <span className="cedar-pinch-cta">
                                    Nhón bỏ {ROLE_TITLES[selectedSlot]}
                                  </span>
                                </div>

                                <div className="drawer-front-ledge">
                                  <span className="drawer-ledge-name">{herb.name}</span>
                                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      style={{ padding: '1px 6px', fontSize: '0.68rem' }}
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
                                        style={{ padding: '1px 6px', fontSize: '0.68rem' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAssignHerb(assignedRole, null);
                                        }}
                                      >
                                        Trả
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="drawer-close-knob"
                                      aria-label="Đẩy đóng ngăn thuốc"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleDrawer(herb);
                                      }}
                                    >
                                      ▲
                                    </button>
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
              </div>
            </section>

            {/* ================= ROOM 3: NỘI CÁC 2.0 — FULL-BLEED KINH LẠC & HỎA LÒ ================= */}
            <section
              className={`apothecary-room spatial-room ${activeRoom === 2 ? 'is-active-room' : ''}`}
              aria-label="Buồng 3: Nội Các Châm Cứu và Bếp Sắc"
            >
              <div className="spatial-room-bg-layer" aria-hidden="true">
                <img
                  src="./art/scenes/room-noi-cac.webp"
                  alt=""
                  className="room-bg-img spatial-full-bg"
                />
                <div className={`watch-light ${watchLight.lamp ? "is-lamplit" : ""}`} aria-hidden="true" />
                <div className="spatial-bg-vignette" />
                <AmbientParticlesCanvas mode="embers" />
              </div>

              <div className="spatial-room-body spatial-room-scrollable">

              {/* Sticky Mini Patient Silk Scroll Strip in Room III */}
              <div className="mini-patient-scroll-strip in-room3" aria-label="Tóm tắt bệnh án đang khám">
                <VillagerPortrait patientCase={selectedCase} size="compact" />
                <div className="mini-patient-meta">
                  <div className="mini-patient-head">
                    <strong>{selectedCase.patientName}</strong> ({selectedCase.age}t) · {selectedCase.seasonTag}
                    {selectedCase.isPregnant && (
                      <span className="tag-badge pregnant" style={{ marginLeft: '6px', padding: '1px 6px', fontSize: '0.68rem' }}>Thai phụ</span>
                    )}
                  </div>
                  <div className="mini-patient-vitals">
                    <span><strong>Lưỡi:</strong> {selectedCase.tongue.summary.split('—')[0].trim()}</span>
                    <span> · <strong>Mạch:</strong> {selectedCase.pulse.name}</span>
                  </div>
                </div>
                <div className="mini-patient-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.73rem' }}
                    onClick={() => switchRoom(1)}
                  >
                    ← Dược Các
                  </button>
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
                        if (next) {
                          apothecaryAudio.playMoxaWarmth();
                          pushCallout('Hơ Ngải Cứu · Ôn Dương Đắc Khí! (+2đ)', 'gold');
                        }
                        return next;
                      });
                    }}
                    cuppingEnabled={cuppingEnabled}
                    onToggleCupping={() => {
                      setCuppingEnabled((prev) => {
                        const next = !prev;
                        if (next) {
                          apothecaryAudio.playCuppingSuction();
                          pushCallout('Giác Hơi Ống Tre · Thông Kinh Lạc!', 'jade');
                        }
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
                    tasteReading={tasteReading}
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
              </div>
            </section>

            {/* ================= ROOM 4: HẬU VIÊN 2.0 — FULL-BLEED VƯỜN THUỐC NAM ================= */}
            <section
              className={`apothecary-room spatial-room ${activeRoom === 3 ? 'is-active-room' : ''}`}
              aria-label="Buồng 4: Hậu Viên Vườn Thuốc Nam"
            >
              <div className="spatial-room-bg-layer" aria-hidden="true">
                <img
                  src="./art/scenes/room-hau-vien.webp"
                  alt=""
                  className="room-bg-img spatial-full-bg"
                />
                <div className={`watch-light ${watchLight.lamp ? "is-lamplit" : ""}`} aria-hidden="true" />
                <div className="spatial-bg-vignette" />
                <AmbientParticlesCanvas mode="garden" />
              </div>

              <div className="spatial-room-body spatial-room-scrollable">
                <HerbGardenRoom
                  gardenGrowth={gardenGrowth}
                  freshHerbIds={freshHerbIds}
                  onWaterPlot={onWaterGardenPlot}
                  onHarvestPlot={(herbId) => {
                    onHarvestGardenPlot(herbId);
                    const herbName = HERB_MAP[herbId]?.name ?? 'Thảo dược';
                    pushCallout(`+1 ${herbName} Tươi (+2đ Tinh Khiết)`, 'jade');
                  }}
                  onGoToDispensary={() => switchRoom(1)}
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Physical Tabletop Props & 5-Instrument Tray — rendered OUTSIDE transformed track so fixed centering is 100% exact */}
      {activeRoom === 0 && (
        <TabletopDesk
          yDucPoints={yDucPoints}
          incenseLit={incenseLitCaseId === selectedCase.id}
          onLightIncense={handleLightDeskIncense}
          activeToolDrawer={activeToolDrawer}
          onToggleTool={(tool) => {
            setActiveToolDrawer((cur) => (cur === tool ? null : tool));
            apothecaryAudio.playPageTurn();
          }}
          askedCount={askedIds.length}
          maxInquiries={effectiveMaxInquiries}
          hasJadeSeal={hasJadeSeal}
          onShowRelics={handleShowRelics}
        />
      )}

      {/* Unified Floating Bottom 4-Room Dock (Desktop & Mobile) */}
      <nav className="spatial-room-dock" aria-label="Chuyển giữa 4 gian phòng Y Quán">
        {ROOM_NODES.map((node) => {
          const isCurrent = activeRoom === node.idx;
          return (
            <button
              key={`dock-${node.idx}`}
              type="button"
              className={`spatial-dock-btn ${isCurrent ? 'active' : ''}`}
              onClick={() => switchRoom(node.idx)}
              aria-current={isCurrent ? 'page' : undefined}
            >
              <span className="spatial-dock-roman">{node.roman}</span>
              <span className="spatial-dock-label">{node.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Directory Drawer Modal (Mục Lục Ca, Y Đức & Sổ Y Án) */}
      {showDirectoryModal && (
        <CaseDirectoryModal
          yDucPoints={yDucPoints}
          hasDragonScale={hasDragonScale}
          hasBatTrangPot={hasBatTrangPot}
          hasJadeSeal={hasJadeSeal}
          activeChapter={activeChapter}
          onSelectChapter={handleSelectChapter}
          chapterCases={chapterCases}
          completedCases={completedCases}
          selectedCaseId={selectedCase.id}
          songAnClearedIds={songAnClearedIds}
          ledgerCount={caseLedger.length}
          onPickCase={(c) => {
            setActiveSongAnId(null);
            loadPatient(c, true);
          }}
          onPickSongAn={(caseA, pairId) => {
            setActiveChapter(caseA.chapter);
            setActiveSongAnId(pairId);
            loadPatient(caseA, true);
          }}
          onClose={() => setShowDirectoryModal(false)}
          onOpenLedger={() => {
            setShowDirectoryModal(false);
            setShowLedgerModal(true);
          }}
          onSpawnProcedural={handleSpawnProcedural}
        />
      )}

      {/* Physical Seal Stamp Slam Overlay */}
      {stampingActive && (
        <div className="seal-slam-overlay" aria-hidden="true">
          <div className={`seal-ink-bleed-ring ${hasJadeSeal ? 'is-jade-seal' : ''}`} />
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

      {openLetter && (
        <FollowUpLetterModal
          fu={openLetter}
          onClose={() => setOpenLetter(null)}
          onInvite={() => {
            const fuCase = buildFollowUpCase(openLetter);
            setOpenLetter(null);
            if (fuCase) loadPatient(fuCase, true);
          }}
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
