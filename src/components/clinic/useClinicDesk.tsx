import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STORY_CASES, generateProceduralCase, getSeasonalSolarTerm } from '../../data/cases';
import { TY_NGO_WATCHES } from '../../data/acupoints';
import { detectActiveFormulas } from '../../data/formulas';
import { HERB_MAP, HERBS } from '../../data/herbs';
import { apothecaryAudio, VoiceArchetype } from '../../engine/audio';
import { FloatingCallout } from '../FloatingJuiceLayer';
import { assignHerbToSlot, BIEN_CHUNG_MAX_ATTEMPTS, BIEN_CHUNG_MIN_CLUES, BienChungRecord, checkBienChung, computeTreatmentPreview, describeDecoctionTaste, emptySlots, evaluateCaseSubmission, getTyNgoWatch } from '../../engine/tcmEngine';
import { planFollowUp } from '../../engine/followUp';
import { CaseLedgerEntry, ClassicalFormula, DecoctionChoice, DiagnosisChoice, DosingAdvice, EvaluationResult, FireType, Herb, PaoZhiMethod, PatientCase, PendingFollowUp, PrescriptionSlots, RoleSlot, SlotPaoZhi } from '../../types/tcm';
import { ScoopAnimationState } from '../svg/HealerHandOverlay';
import { FIRE_TARGET_RANGES, SOLAR_WEATHER, TabletopTool, WATCH_LIGHT } from '../clinic/clinicConstants';

export interface ClinicDeskProps {
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

/** All ClinicDesk state and handlers; the rooms read them through `ctx`. */
export function useClinicDesk(props: ClinicDeskProps) {
  const {
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
  } = props;
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
  // camera pan direction while the room track slides: 1 = towards the next room, -1 = back
  const [roomPan, setRoomPan] = useState<0 | 1 | -1>(0);
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
          setRoomPan(nextRoom > cur ? 1 : -1);
          window.setTimeout(() => setRoomPan(0), 560);
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
    '--health': health.toFixed(2),
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

  return {
    _unlockedChapter,
    completedCases,
    caseLedger,
    yDucPoints,
    dayCount,
    pendingFollowUps,
    _currentStreak,
    songAnClearedIds,
    discoveredFormulas,
    freshHerbIds,
    gardenGrowth,
    mentorDismissed,
    onDismissMentor,
    onWaterGardenPlot,
    onHarvestGardenPlot,
    onCaseEvaluated,
    onOpenCodexHerb,
    activeChapter,
    setActiveChapter,
    selectedCase,
    setSelectedCase,
    procCounter,
    setProcCounter,
    activeRoom,
    setActiveRoom,
    curtainParting,
    setCurtainParting,
    activeToolDrawer,
    setActiveToolDrawer,
    askedIds,
    setAskedIds,
    incenseLitCaseId,
    setIncenseLitCaseId,
    clues,
    setClues,
    inspectedAudio,
    setInspectedAudio,
    auscultating,
    setAuscultating,
    diagnosis,
    setDiagnosis,
    bienChung,
    setBienChung,
    openLetter,
    setOpenLetter,
    ledgerFx,
    setLedgerFx,
    pickedAxes,
    setPickedAxes,
    slots,
    setSlots,
    slotPaoZhi,
    setSlotPaoZhi,
    animatingPanRole,
    setAnimatingPanRole,
    selectedSlot,
    setSelectedSlot,
    chestFilter,
    setChestFilter,
    roomPan,
    callouts,
    setCallouts,
    openDrawerId,
    setOpenDrawerId,
    draggingHerbId,
    setDraggingHerbId,
    hoveredHerb,
    setHoveredHerb,
    showFoldOverlay,
    setShowFoldOverlay,
    packetWrapped,
    setPacketWrapped,
    selectedAcupoints,
    setSelectedAcupoints,
    moxaEnabled,
    setMoxaEnabled,
    cuppingEnabled,
    setCuppingEnabled,
    fire,
    setFire,
    fanHeat,
    setFanHeat,
    fanBlowing,
    setFanBlowing,
    dosing,
    setDosing,
    stampingActive,
    setStampingActive,
    deskShake,
    setDeskShake,
    showDirectoryModal,
    setShowDirectoryModal,
    activeSongAnId,
    setActiveSongAnId,
    showCluesPopover,
    setShowCluesPopover,
    showLedgerModal,
    setShowLedgerModal,
    outcome,
    setOutcome,
    scoopAnim,
    setScoopAnim,
    justScoopedRole,
    setJustScoopedRole,
    changeDiagnosis,
    calloutIdRef,
    pushCallout,
    viewportRef,
    deskRoom2Ref,
    chestWrapRef,
    inspectorRef,
    panRefs,
    herbRefs,
    scoopCounterRef,
    nowHour,
    activeWatch,
    watchLight,
    solarTerm,
    tasteReading,
    watchLightingClass,
    hasDragonScale,
    hasBatTrangPot,
    hasJadeSeal,
    lockViewportScrollZero,
    switchRoom,
    chapterCases,
    availableHerbs,
    patientVoice,
    weatherMoodClass,
    preview,
    activeFormulas,
    hasAssignedHerbs,
    hasAssignedTreatment,
    health,
    healthColorVars,
    solarWeather,
    activeFireRange,
    isFanMatched,
    loadPatient,
    handleSelectChapter,
    handleSpawnProcedural,
    addClue,
    handlePlayAuscultation,
    effectiveMaxInquiries,
    handleAskQuestion,
    handleLightDeskIncense,
    triggerScoopAnimation,
    handleAssignHerb,
    handleApplyFormula,
    handleSelectPaoZhi,
    handleToggleDrawer,
    handleScoopFromDrawer,
    handleDrawerHover,
    assignedHerbObjects,
    handleWrapHerbPacketAndGoRoom3,
    handleToggleAcupoint,
    handleFanStroke,
    bienChungInkLeft,
    bienChungReady,
    handleSealBienChung,
    handleShowRelics,
    handleFinalStampSubmit,
    handleNextCase,
    natureClass,
    assignedHerbsSummary
  };
}

export type ClinicCtx = ReturnType<typeof useClinicDesk>;
