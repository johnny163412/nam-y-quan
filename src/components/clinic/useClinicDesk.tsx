import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STORY_CASES, generateProceduralCase, getSeasonalSolarTerm } from '../../data/cases';
import { TY_NGO_WATCHES } from '../../data/acupoints';
import { apothecaryAudio, VoiceArchetype } from '../../engine/audio';
import { FloatingCallout } from '../FloatingJuiceLayer';
import { computeTreatmentPreview, evaluateCaseSubmission, getTyNgoWatch } from '../../engine/tcmEngine';
import { planFollowUp } from '../../engine/followUp';
import { CaseLedgerEntry, DecoctionChoice, EvaluationResult, PatientCase, PendingFollowUp, PrescriptionSlots } from '../../types/tcm';
import { SOLAR_WEATHER, WATCH_LIGHT } from './clinicConstants';
import { useDecoction } from './useDecoction';
import { useExamination } from './useExamination';
import { usePrescription } from './usePrescription';
import { SOLAR_TERM_WEATHER, WeatherKind } from './WeatherCanvas';
import { applyCrisisRules, evaluateReferral } from '../../engine/crisis';

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
  dailyResults: Record<string, { score: number; passed: boolean }>;
  signature?: string;
  onSaveSignature: (dataUrl: string | null) => void;
  crisisDue: boolean;
  crisesAttended: number;
  hoanhPhi: string[];
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
  onOpenCodexHerb,
  dailyResults,
  signature,
  onSaveSignature,
  crisisDue,
  crisesAttended,
  hoanhPhi
  } = props;
  const [activeChapter, setActiveChapter] = useState<1 | 2 | 3>(1);
  const [selectedCase, setSelectedCase] = useState<PatientCase>(STORY_CASES[0]);
  const [procCounter, setProcCounter] = useState(1);
  const [activeRoom, setActiveRoom] = useState<0 | 1 | 2 | 3>(0);
  const [curtainParting, setCurtainParting] = useState(false);
  const [openLetter, setOpenLetter] = useState<PendingFollowUp | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

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
  const [stampingActive, setStampingActive] = useState(false);
  const [deskShake, setDeskShake] = useState(false);

  // Minimal HUD Overlays & Modals
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [activeSongAnId, setActiveSongAnId] = useState<string | null>(null);
  const [showCluesPopover, setShowCluesPopover] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [outcome, setOutcome] = useState<EvaluationResult | null>(null);

  const nowHour = new Date().getHours();
  const activeWatch = useMemo(() => getTyNgoWatch(nowHour), [nowHour]);
  // Đêm Mưa Gõ Cửa always happens at night in the rain, whatever the wall clock says.
  const crisisNight = Boolean(selectedCase.crisis);
  const watchLight = crisisNight ? WATCH_LIGHT[0] : WATCH_LIGHT[Math.max(0, TY_NGO_WATCHES.indexOf(activeWatch))];
  const solarTerm = useMemo(() => getSeasonalSolarTerm(dayCount), [dayCount]);
  const watchLightingClass = crisisNight
    ? 'lighting-night'
    : nowHour >= 5 && nowHour < 11
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

  const shakeDesk = useCallback(() => {
    setDeskShake(true);
    window.setTimeout(() => setDeskShake(false), 300);
  }, []);
  const exam = useExamination(selectedCase, yDucPoints, pushCallout, shakeDesk);
  const rx = usePrescription(freshHerbIds, pushCallout, () => switchRoom(2));
  const brew = useDecoction(selectedCase, rx.slots, rx.slotPaoZhi, pushCallout);
  const { activeToolDrawer, diagnosis, bienChung } = exam;
  const { slots, slotPaoZhi, hasAssignedHerbs } = rx;
  const { selectedAcupoints, moxaEnabled, cuppingEnabled, fire, dosing, isFanMatched } = brew;

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

  const preview = useMemo(() => {
    const real = computeTreatmentPreview(selectedCase, slots, selectedAcupoints, slotPaoZhi);
    if (!selectedCase.isDaily) return real;
    // Danh Y Hằng Ngày is played blind: the scale and compass stay at the untreated state, but safety alerts still show.
    const blind = computeTreatmentPreview(selectedCase, { quan: null, than: null, ta: null, su: null }, [], {});
    return { ...real, resultingVector: blind.resultingVector, balanceScore: blind.balanceScore };
  }, [selectedCase, slots, selectedAcupoints, slotPaoZhi]);

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
  const solarWeather = crisisNight ? 'rain' : SOLAR_WEATHER[solarTerm.name] ?? 'sunbeams';
  const roomWeather: WeatherKind | undefined = crisisNight ? 'cold-rain' : SOLAR_TERM_WEATHER[solarTerm.name];

  const loadPatient = (nextCase: PatientCase, withCurtain = true) => {
    setSelectedCase(nextCase);
    exam.resetExamination(nextCase);
    rx.resetPrescription();
    brew.resetDecoction();
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

    const res = applyCrisisRules(selectedCase, evaluateCaseSubmission(
      selectedCase,
      diagnosis,
      slots,
      selectedAcupoints,
      decoctionPayload,
      bienChung
    ));

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

  const handleReferral = () => {
    const res = evaluateReferral(selectedCase, exam.clues);
    setStampingActive(true);
    apothecaryAudio.playSealStamp(res.passed);
    navigator.vibrate?.(res.passed ? 60 : [30, 40, 30]);
    window.setTimeout(() => {
      setStampingActive(false);
      setOutcome(res);
      onCaseEvaluated(selectedCase, res, { slots, acupoints: selectedAcupoints });
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

  return {
    ...exam,
    ...rx,
    ...brew,
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
    openLetter,
    setOpenLetter,
    roomPan,
    callouts,
    setCallouts,
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
    calloutIdRef,
    pushCallout,
    viewportRef,
    nowHour,
    activeWatch,
    watchLight,
    solarTerm,
    watchLightingClass,
    hasDragonScale,
    hasBatTrangPot,
    hasJadeSeal,
    lockViewportScrollZero,
    switchRoom,
    chapterCases,
    patientVoice,
    weatherMoodClass,
    preview,
    hasAssignedTreatment,
    health,
    healthColorVars,
    solarWeather,
    loadPatient,
    handleSelectChapter,
    handleSpawnProcedural,
    handleShowRelics,
    handleFinalStampSubmit,
    handleNextCase,
    dailyResults,
    signature,
    onSaveSignature,
    crisisDue,
    crisesAttended,
    hoanhPhi,
    roomWeather,
    handleReferral
  };
}

export type ClinicCtx = ReturnType<typeof useClinicDesk>;
