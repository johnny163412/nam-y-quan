import React, { useCallback, useMemo, useRef, useState } from 'react';
import { STORY_CASES, generateProceduralCase } from '../data/cases';
import { detectActiveFormulas } from '../data/formulas';
import { HERB_MAP, HERBS } from '../data/herbs';
import { apothecaryAudio } from '../engine/audio';
import {
  assignHerbToSlot,
  computeTreatmentPreview,
  emptySlots,
  evaluateCaseSubmission
} from '../engine/tcmEngine';
import {
  DecoctionChoice,
  DiagnosisChoice,
  EvaluationResult,
  Herb,
  PatientCase,
  PrescriptionSlots,
  RoleSlot
} from '../types/tcm';
import { DecoctionStoveModal } from './DecoctionStoveModal';
import { EightPrinciplesCompass } from './EightPrinciplesCompass';
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
  onCaseEvaluated: (patientCase: PatientCase, result: EvaluationResult) => void;
  onOpenCodexHerb: (herbId: string) => void;
}

const ROLE_META: { role: RoleSlot; title: string; weightLabel: string; hint: string }[] = [
  { role: 'quan', title: 'Quân dược', weightLabel: 'Chủ lực x1.25', hint: 'Đánh thẳng bệnh cơ chính' },
  { role: 'than', title: 'Thần dược', weightLabel: 'Trợ Quân x0.95', hint: 'Tăng cường tác dụng Quân' },
  { role: 'ta', title: 'Tá dược', weightLabel: 'Hỗ trợ x0.75', hint: 'Trị triệu chứng phụ / giảm độc' },
  { role: 'su', title: 'Sứ dược', weightLabel: 'Dẫn / Hòa x0.55', hint: 'Điều hòa thang thuốc (Cam thảo...)' }
];

type ExamTab = 'vong' | 'van' | 'van-hoi' | 'thiet';

export const ClinicDesk: React.FC<ClinicDeskProps> = ({
  unlockedChapter,
  completedCases,
  onCaseEvaluated,
  onOpenCodexHerb
}) => {
  const [activeChapter, setActiveChapter] = useState<1 | 2 | 3>(1);
  const [selectedCase, setSelectedCase] = useState<PatientCase>(STORY_CASES[0]);
  const [procCounter, setProcCounter] = useState(1);

  // Examination state
  const [examTab, setExamTab] = useState<ExamTab>('vong');
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [clues, setClues] = useState<string[]>([]);
  const [inspectedAudio, setInspectedAudio] = useState(false);

  // Diagnosis & Treatment state
  const [diagnosis, setDiagnosis] = useState<DiagnosisChoice>({
    location: 'bieu',
    nature: 'han',
    state: 'thuc',
    primaryElement: 'kim'
  });
  const [slots, setSlots] = useState<PrescriptionSlots>(emptySlots());
  const [selectedSlot, setSelectedSlot] = useState<RoleSlot>('quan');
  const [openDrawerId, setOpenDrawerId] = useState<string | null>(null);
  const [hoveredHerb, setHoveredHerb] = useState<{
    herb: Herb;
    left: number;
    top: number;
  } | null>(null);
  const [selectedAcupoints, setSelectedAcupoints] = useState<string[]>([]);
  const [treatTab, setTreatTab] = useState<'herbs' | 'acupoints'>('herbs');
  const [showDecoctionModal, setShowDecoctionModal] = useState(false);
  const [outcome, setOutcome] = useState<EvaluationResult | null>(null);
  const [scoopAnim, setScoopAnim] = useState<ScoopAnimationState | null>(null);
  const [justScoopedRole, setJustScoopedRole] = useState<RoleSlot | null>(null);

  const deskRightRef = useRef<HTMLElement | null>(null);
  const chestWrapRef = useRef<HTMLDivElement | null>(null);
  const panRefs = useRef<Record<RoleSlot, HTMLDivElement | null>>({
    quan: null,
    than: null,
    ta: null,
    su: null
  });
  const herbRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scoopCounterRef = useRef(0);

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

  const loadPatient = (nextCase: PatientCase) => {
    setSelectedCase(nextCase);
    setExamTab('vong');
    setAskedIds([]);
    setClues([`Chủ chứng: ${nextCase.seasonTag}`]);
    setInspectedAudio(false);
    setSlots(emptySlots());
    setSelectedSlot('quan');
    setOpenDrawerId(null);
    setHoveredHerb(null);
    setSelectedAcupoints([]);
    setTreatTab('herbs');
    setOutcome(null);
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

  const handleAskQuestion = (qId: string, clueTag: string) => {
    if (askedIds.includes(qId)) return;
    if (askedIds.length >= selectedCase.maxInquiries) return;
    setAskedIds((prev) => [...prev, qId]);
    addClue(clueTag);
    apothecaryAudio.playPageTurn();
  };

  const triggerScoopAnimation = useCallback((herb: Herb, role: RoleSlot) => {
    const container = deskRightRef.current;
    const panEl = panRefs.current[role];
    const herbEl = herbRefs.current[herb.id];
    if (!container || !panEl) return;

    const cRect = container.getBoundingClientRect();
    const pRect = panEl.getBoundingClientRect();
    const hRect = herbEl?.getBoundingClientRect();

    const fromX = hRect
      ? hRect.left - cRect.left + hRect.width * 0.42
      : cRect.width * 0.5;
    const fromY = hRect
      ? hRect.top - cRect.top + hRect.height * 0.35
      : cRect.height * 0.72;
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
    if (herbId) {
      apothecaryAudio.playHerbDrop();
      const herbObj = HERB_MAP[herbId];
      if (herbObj) triggerScoopAnimation(herbObj, role);
      // Auto-advance selected empty slot for fast tap-to-assign ergonomics
      const nextOrder: RoleSlot[] = ['quan', 'than', 'ta', 'su'];
      const nextEmpty = nextOrder.find((r) => r !== role && !after[r]);
      if (nextEmpty) setSelectedSlot(nextEmpty);
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

  const handleToggleAcupoint = (ptId: string) => {
    setSelectedAcupoints((prev) =>
      prev.includes(ptId) ? prev.filter((id) => id !== ptId) : [...prev, ptId]
    );
    apothecaryAudio.playHerbDrop();
  };

  const handleStampSubmit = () => {
    if (hasAssignedHerbs) {
      setShowDecoctionModal(true);
      apothecaryAudio.playPageTurn();
      return;
    }
    const res = evaluateCaseSubmission(selectedCase, diagnosis, slots, selectedAcupoints);
    apothecaryAudio.playSealStamp(res.passed);
    setOutcome(res);
    onCaseEvaluated(selectedCase, res);
  };

  const handleConfirmDecoction = (choice: DecoctionChoice) => {
    setShowDecoctionModal(false);
    const res = evaluateCaseSubmission(selectedCase, diagnosis, slots, selectedAcupoints, choice);
    apothecaryAudio.playSealStamp(res.passed);
    setOutcome(res);
    onCaseEvaluated(selectedCase, res);
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

  return (
    <div>
      {/* Atmospheric Đông Y Apothecary Diorama Banner */}
      <div className="scene-diorama-banner">
        <img
          src="/art/scenes/clinic-hall.jpg"
          alt="Nội đường tiệm thuốc Nam cổ Tuệ Tâm Đường"
          className="scene-diorama-img"
        />
        <div className="scene-diorama-scrim" aria-hidden="true" />
        <div className="scene-diorama-content">
          <h2 className="scene-diorama-title">Nội Đường Biện Chứng Luận Trị</h2>
          <p className="scene-diorama-sub">
            Tứ chẩn Vọng · Văn · Vấn · Thiết kết hợp Cân Tiểu Ly Quân — Thần — Tá — Sứ
          </p>
        </div>
        <div className="scene-couplet-group" aria-hidden="true">
          <span className="couplet-plaque">「 Nam dược trị Nam nhân 」</span>
          <span className="couplet-plaque">「 Y lý hợp Âm Dương 」</span>
        </div>
      </div>

      {/* Case & Chapter Toolbar */}
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
            Đón Khách Vãng Lai mới
          </button>
        </div>
      </div>

      {/* Main Two-Column Apothecary Desk */}
      <div className="desk-grid">
        {/* LEFT COLUMN: PATIENT & TỨ CHẨN */}
        <section className="woodblock-sheet stitched-binding" aria-label="Khám bệnh Tứ Chẩn">
          <div className="section-heading">
            <span>{selectedCase.title}</span>
            <span className="tag-badge">Chương {selectedCase.chapter}</span>
          </div>

          <div className="patient-banner">
            <div className="silk-scroll-mount" aria-hidden="true">
              <div className="scroll-rod-cap" />
              <VillagerPortrait patientCase={selectedCase} />
              <div className="scroll-rod-cap" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.04rem', color: 'var(--ivory-text)' }}>
                  {selectedCase.patientName}
                </strong>
                <span className="muted-note">({selectedCase.age} tuổi — {selectedCase.patientRole})</span>
                {selectedCase.isPregnant && (
                  <span className="tag-badge pregnant">Thai phụ (Thận trọng Cấm kỵ)</span>
                )}
              </div>
              <div className="wood-speech-bubble">
                「 {selectedCase.chiefComplaint} 」
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
              onClick={() => {
                setExamTab('van');
                if (!inspectedAudio) {
                  setInspectedAudio(true);
                  addClue(`Văn chẩn: ${selectedCase.audioObservation}`);
                }
              }}
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
              4. Thiết (Bắt mạch)
            </button>
          </div>

          <div className="exam-panel">
            {examTab === 'vong' && (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '0.88rem' }}>
                  <strong>Thần sắc bên ngoài:</strong> {selectedCase.visualAppearance}
                </p>
                <TongueMirror
                  tongue={selectedCase.tongue}
                  onInspectZone={(z) => addClue(`${z.label}: ${z.clueTag}`)}
                />
              </div>
            )}

            {examTab === 'van' && (
              <div>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Lắng nghe thanh âm &amp; hơi thở (Văn chẩn):</strong>
                </p>
                <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '0.96rem' }}>
                  {selectedCase.audioObservation}
                </p>
              </div>
            )}

            {examTab === 'van-hoi' && (
              <div>
                <div style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', marginBottom: '8px' }}>
                  Đối thoại Vấn chẩn (chọn tối đa {selectedCase.maxInquiries} thẻ tre câu hỏi, còn{' '}
                  <strong>{selectedCase.maxInquiries - askedIds.length}</strong> lượt):
                </div>

                {/* Khung đối thoại gỗ cổ */}
                <div className="wooden-chat-log" aria-live="polite">
                  <div className="chat-turn-patient">
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C1A14', marginBottom: '2px' }}>
                      {selectedCase.patientName} thưa:
                    </div>
                    “{selectedCase.chiefComplaint}”
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
                            Ghi nhận: {q.clueTag}
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                </div>

                {/* Thẻ tre câu hỏi */}
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
              />
            )}
          </div>

          <div className="clue-drawer">
            <strong style={{ fontSize: '0.86rem' }}>Phiếu Chứng Trạng Đã Thu Thập:</strong>
            <div className="clue-list">
              {clues.length === 0 ? (
                <span className="muted-note">Hãy soi lưỡi, hỏi bệnh hoặc bắt mạch để ghi nhận triệu chứng.</span>
              ) : (
                clues.map((c, idx) => (
                  <span key={idx} className="clue-chip">
                    {c}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: BÁT CƯƠNG COMPASS + SCALE PANS + HERB DRAWER / ACUPOINTS */}
        <section
          ref={deskRightRef}
          className="woodblock-sheet desk-right-col"
          aria-label="Biện chứng và Phối phương"
        >
          <HealerHandOverlay
            scoop={scoopAnim}
            onComplete={(doneId) =>
              setScoopAnim((cur) => (cur && cur.id === doneId ? null : cur))
            }
          />
          <EightPrinciplesCompass
            initialVector={selectedCase.initialVector}
            previewVector={preview.resultingVector}
            balanceScore={preview.balanceScore}
            diagnosis={diagnosis}
            onChangeDiagnosis={setDiagnosis}
            showTreatmentProjection={hasAssignedTreatment}
          />

          {/* Treatment Mode Switch (Herbs vs Acupoints for Ch.3) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div className="toggle-pair" style={{ maxWidth: '420px' }}>
              <button
                type="button"
                className={`toggle-pill ${treatTab === 'herbs' ? 'active' : ''}`}
                onClick={() => setTreatTab('herbs')}
              >
                Cân Tiểu Ly Nam Dược ({Object.values(slots).filter(Boolean).length}/4)
              </button>
              <button
                type="button"
                className={`toggle-pill ${treatTab === 'acupoints' ? 'active' : ''}`}
                disabled={!selectedCase.allowAcupuncture}
                onClick={() => setTreatTab('acupoints')}
                title={
                  selectedCase.allowAcupuncture
                    ? 'Phối hợp Trong uống Ngoài châm'
                    : 'Bấm huyệt mở khóa từ các ca Chương 3'
                }
              >
                Điểm Huyệt ({selectedAcupoints.length})
              </button>
            </div>
            {preview.activeHarmonizer && (
              <span className="clue-chip">Cam thảo đang điều hòa thang thuốc</span>
            )}
          </div>

          {treatTab === 'herbs' ? (
            <>
              {/* Giá Cân Tiểu Ly Đồng Cổ — engraved dragon-cloud beam tilting dynamically */}
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

              {/* 4 Brass Scale Pans: Quân - Thần - Tá - Sứ */}
              <div className="scale-pans-grid">
                {ROLE_META.map((meta) => {
                  const herbId = slots[meta.role];
                  const herb = herbId ? HERB_MAP[herbId] : null;
                  const isActiveSlot = selectedSlot === meta.role;
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
                            <BotanicalSvg herbId={herb.id} motif={herb.motif} size={48} />
                            <svg width="92" height="10" viewBox="0 0 92 10" fill="none" aria-hidden="true" style={{ marginTop: '-2px' }}>
                              <path d="M6 2 Q46 11 86 2" stroke="#9C6B24" strokeWidth="2.1" strokeLinecap="round" fill="rgba(156,107,36,0.14)" />
                            </svg>
                          </div>
                          <div className="pan-herb-name" style={{ textAlign: 'center', margin: '1px 0' }}>{herb.name}</div>
                          <span className={`nature-tag ${natureClass(herb.nature)}`} style={{ alignSelf: 'center' }}>
                            {herb.nature} — {herb.flavors[0]}
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--sand-muted)', margin: '6px 0' }}>
                          {meta.hint}
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

              {/* Tủ Thuốc Bách Tử — Wooden Đông Y Pull-Out Drawers & Hover Inspection */}
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: '6px' }}>
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
            </>
          ) : (
            <MeridianBodyMap
              selectedIds={selectedAcupoints}
              onToggleAcupoint={handleToggleAcupoint}
              isPregnant={selectedCase.isPregnant}
            />
          )}

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

          <div className="stamp-action-bar">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSlots(emptySlots());
                setSelectedAcupoints([]);
              }}
            >
              Rửa cân làm lại đơn
            </button>

            <button
              type="button"
              className="btn-cinnabar"
              onClick={handleStampSubmit}
            >
              {hasAssignedHerbs ? 'Đưa Lên Bếp Sắc & Đóng Ấn' : 'Đóng Ấn Kê Đơn & Xem Kết Quả'}
            </button>
          </div>
        </section>
      </div>

      {showDecoctionModal && (
        <DecoctionStoveModal
          patientCase={selectedCase}
          slots={slots}
          selectedAcupoints={selectedAcupoints}
          onCancel={() => setShowDecoctionModal(false)}
          onConfirmDecoction={handleConfirmDecoction}
        />
      )}

      {outcome && (
        <OutcomeScrollModal
          patientCase={selectedCase}
          result={outcome}
          onClose={() => setOutcome(null)}
          onNextCase={handleNextCase}
        />
      )}
    </div>
  );
};
