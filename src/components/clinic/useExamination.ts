import { useEffect, useRef, useState } from 'react';
import { apothecaryAudio } from '../../engine/audio';
import { BIEN_CHUNG_MAX_ATTEMPTS, BIEN_CHUNG_MIN_CLUES, BienChungRecord, checkBienChung } from '../../engine/tcmEngine';
import { DiagnosisChoice, PatientCase } from '../../types/tcm';
import { TabletopTool } from './clinicConstants';

type PushCallout = (text: string, tone?: 'gold' | 'jade' | 'cinnabar') => void;

/** Tứ Chẩn at the Tiền Đường desk: instruments, inquiries, gathered clues and the Sổ Biện Chứng seal. */
export function useExamination(selectedCase: PatientCase, yDucPoints: number, pushCallout: PushCallout, shakeDesk: () => void) {
  const [activeToolDrawer, setActiveToolDrawer] = useState<TabletopTool | null>(null);
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [incenseLitCaseId, setIncenseLitCaseId] = useState<string | null>(null);
  const [clues, setClues] = useState<string[]>([`Chủ chứng: ${selectedCase.seasonTag}`]);
  const [inspectedAudio, setInspectedAudio] = useState(false);
  const [auscultating, setAuscultating] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisChoice>({
    location: 'bieu',
    nature: 'han',
    state: 'thuc',
    primaryElement: 'kim'
  });
  const [bienChung, setBienChung] = useState<BienChungRecord>({ sealed: false, failedAttempts: 0 });
  const [ledgerFx, setLedgerFx] = useState<'sealed' | 'rejected' | null>(null);
  // Axes the player chose this case; the default diagnosis must never count as a deduction.
  const [pickedAxes, setPickedAxes] = useState<(keyof DiagnosisChoice)[]>([]);
  const inspectorRef = useRef<HTMLElement | null>(null);

  // On phones the drawer stacks below the patient, under the fixed tray — bring it into view when a tool opens.
  useEffect(() => {
    if (!activeToolDrawer || !window.matchMedia('(max-width: 960px)').matches) return;
    inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeToolDrawer]);

  const resetExamination = (nextCase: PatientCase) => {
    setActiveToolDrawer(null);
    setAskedIds([]);
    setClues([`Chủ chứng: ${nextCase.seasonTag}`]);
    setInspectedAudio(false);
    setBienChung({ sealed: false, failedAttempts: 0 });
    setPickedAxes([]);
    setLedgerFx(null);
  };

  const changeDiagnosis = (next: DiagnosisChoice, axis?: keyof DiagnosisChoice) => {
    if (bienChung.sealed) return;
    const changed = axis ? [axis] : (Object.keys(next) as (keyof DiagnosisChoice)[]).filter((k) => next[k] !== diagnosis[k]);
    setPickedAxes((prev) => [...new Set([...prev, ...changed])]);
    setDiagnosis(next);
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

  const effectiveMaxInquiries = selectedCase.maxInquiries + (incenseLitCaseId === selectedCase.id ? 1 : 0);

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
      shakeDesk();
      navigator.vibrate?.(40);
    } else {
      setBienChung({ ...bienChung, failedAttempts: bienChung.failedAttempts + 1 });
      pushCallout(`Chưa ấn chứng — còn ${bienChungInkLeft - 1} nét mực`, 'cinnabar');
    }
  };

  return {
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
    ledgerFx,
    setLedgerFx,
    pickedAxes,
    setPickedAxes,
    inspectorRef,
    resetExamination,
    changeDiagnosis,
    addClue,
    handlePlayAuscultation,
    effectiveMaxInquiries,
    handleAskQuestion,
    handleLightDeskIncense,
    bienChungInkLeft,
    bienChungReady,
    handleSealBienChung
  };
}
