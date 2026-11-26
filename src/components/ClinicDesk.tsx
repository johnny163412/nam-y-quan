import React, { useMemo, useState } from 'react';
import { STORY_CASES, generateProceduralCase } from '../data/cases';
import { HERB_MAP, HERBS } from '../data/herbs';
import { apothecaryAudio } from '../engine/audio';
import {
  assignHerbToSlot,
  computeTreatmentPreview,
  emptySlots,
  evaluateCaseSubmission
} from '../engine/tcmEngine';
import {
  DiagnosisChoice,
  EvaluationResult,
  Herb,
  PatientCase,
  PrescriptionSlots,
  RoleSlot
} from '../types/tcm';
import { EightPrinciplesCompass } from './EightPrinciplesCompass';
import { MeridianBodyMap } from './MeridianBodyMap';
import { OutcomeScrollModal } from './OutcomeScrollModal';
import { PulseCanvas } from './PulseCanvas';
import { BotanicalSvg } from './svg/BotanicalSvg';
import { TongueMirror } from './svg/TongueMirror';

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
  const [selectedHerbId, setSelectedHerbId] = useState<string | null>(null);
  const [selectedAcupoints, setSelectedAcupoints] = useState<string[]>([]);
  const [treatTab, setTreatTab] = useState<'herbs' | 'acupoints'>('herbs');
  const [outcome, setOutcome] = useState<EvaluationResult | null>(null);

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

  const hasAssignedTreatment =
    Object.values(slots).some(Boolean) || selectedAcupoints.length > 0;

  const loadPatient = (nextCase: PatientCase) => {
    setSelectedCase(nextCase);
    setExamTab('vong');
    setAskedIds([]);
    setClues([`Chủ chứng: ${nextCase.seasonTag}`]);
    setInspectedAudio(false);
    setSlots(emptySlots());
    setSelectedSlot('quan');
    setSelectedHerbId(null);
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

  const handleAssignHerb = (role: RoleSlot, herbId: string | null) => {
    setSlots((prev) => assignHerbToSlot(prev, role, herbId));
    if (herbId) {
      apothecaryAudio.playHerbDrop();
      // Auto-advance selected empty slot for fast tap-to-assign ergonomics
      const nextOrder: RoleSlot[] = ['quan', 'than', 'ta', 'su'];
      const after = assignHerbToSlot(slots, role, herbId);
      const nextEmpty = nextOrder.find((r) => r !== role && !after[r]);
      if (nextEmpty) setSelectedSlot(nextEmpty);
    }
    setSelectedHerbId(null);
  };

  const handleHerbCardClick = (herb: Herb) => {
    const currentlyInRole = (Object.keys(slots) as RoleSlot[]).find(
      (r) => slots[r] === herb.id
    );
    if (currentlyInRole && selectedSlot === currentlyInRole) {
      handleAssignHerb(currentlyInRole, null);
      return;
    }
    if (selectedHerbId === herb.id) {
      handleAssignHerb(selectedSlot, herb.id);
      return;
    }
    // Direct tap assigns into active selected pan immediately for effortless UX
    handleAssignHerb(selectedSlot, herb.id);
  };

  const handleToggleAcupoint = (ptId: string) => {
    setSelectedAcupoints((prev) =>
      prev.includes(ptId) ? prev.filter((id) => id !== ptId) : [...prev, ptId]
    );
    apothecaryAudio.playHerbDrop();
  };

  const handleStampSubmit = () => {
    const res = evaluateCaseSubmission(selectedCase, diagnosis, slots, selectedAcupoints);
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
        <section className="woodblock-sheet" aria-label="Khám bệnh Tứ Chẩn">
          <div className="section-heading">
            <span>{selectedCase.title}</span>
            <span className="tag-badge">Chương {selectedCase.chapter}</span>
          </div>

          <div className="patient-banner">
            <div className="patient-avatar" aria-hidden="true">
              <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="18" r="9" fill="#E2D4B7" stroke="#221B15" strokeWidth="1.6" />
                <path d="M10 42C10 33 16 29 24 29C32 29 38 33 38 42" fill="#23574C" fillOpacity="0.25" stroke="#221B15" strokeWidth="1.6" />
                <circle cx="21" cy="17" r="1.3" fill="#221B15" />
                <circle cx="27" cy="17" r="1.3" fill="#221B15" />
                <path d="M21 22Q24 23 27 22" stroke="#221B15" strokeWidth="1.3" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                <strong>{selectedCase.patientName}</strong>
                <span className="muted-note">({selectedCase.age} tuổi — {selectedCase.patientRole})</span>
                {selectedCase.isPregnant && (
                  <span className="tag-badge pregnant">Thai phụ (Thận trọng Cấm kỵ)</span>
                )}
              </div>
              <p className="patient-speech">“{selectedCase.chiefComplaint}”</p>
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
                  Chọn tối đa {selectedCase.maxInquiries} câu hỏi trọng tâm theo phép Thập Vấn (còn{' '}
                  <strong>{selectedCase.maxInquiries - askedIds.length}</strong> lượt):
                </div>
                <div className="inquiry-grid">
                  {selectedCase.inquiries.map((q) => {
                    const isAsked = askedIds.includes(q.id);
                    const limitReached = askedIds.length >= selectedCase.maxInquiries && !isAsked;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        className={`inquiry-btn ${isAsked ? 'asked' : ''}`}
                        disabled={limitReached}
                        onClick={() => handleAskQuestion(q.id, q.clueTag)}
                      >
                        <div style={{ fontWeight: 600 }}>
                          [{q.topic}] {q.question}
                        </div>
                        {isAsked && (
                          <div className="inquiry-answer">
                            <div>“{q.answer}”</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--herbal-jade)', fontWeight: 600, marginTop: '3px' }}>
                              Ghi nhận: {q.clueTag}
                            </div>
                          </div>
                        )}
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
        <section className="woodblock-sheet" aria-label="Biện chứng và Phối phương">
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
              {/* 4 Brass Scale Pans: Quân - Thần - Tá - Sứ */}
              <div className="scale-pans-grid">
                {ROLE_META.map((meta) => {
                  const herbId = slots[meta.role];
                  const herb = herbId ? HERB_MAP[herbId] : null;
                  const isActiveSlot = selectedSlot === meta.role;
                  return (
                    <div
                      key={meta.role}
                      className={`scale-pan ${isActiveSlot ? 'selected-slot' : ''} ${
                        herb ? 'filled' : ''
                      }`}
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
                        <div>
                          <div className="pan-herb-name">{herb.name}</div>
                          <span className={`nature-tag ${natureClass(herb.nature)}`}>
                            {herb.nature} — {herb.flavors[0]}
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', margin: '6px 0' }}>
                          {meta.hint}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: isActiveSlot ? 'var(--cinnabar)' : 'var(--ink-muted)', fontWeight: isActiveSlot ? 700 : 400 }}>
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

              {/* Herb Drawer */}
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: '6px' }}>
                Ngăn kéo Nam dược (Kéo thả hoặc chạm vào vị thuốc để đặt vào ngăn <strong>{ROLE_META.find((r) => r.role === selectedSlot)?.title}</strong>):
              </div>
              <div className="herb-drawer">
                {availableHerbs.map((herb) => {
                  const assignedRole = (Object.keys(slots) as RoleSlot[]).find(
                    (r) => slots[r] === herb.id
                  );
                  return (
                    <div
                      key={herb.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', herb.id)}
                      onClick={() => handleHerbCardClick(herb)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleHerbCardClick(herb);
                        }
                      }}
                      className={`herb-card ${assignedRole ? 'assigned' : ''} ${
                        selectedHerbId === herb.id ? 'selected' : ''
                      }`}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <BotanicalSvg motif={herb.motif} size={30} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', lineHeight: 1.2 }}>
                            {herb.name}
                          </div>
                          <span className={`nature-tag ${natureClass(herb.nature)}`}>
                            {herb.nature} ({herb.flavors.join(', ')})
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', lineHeight: 1.35 }}>
                        {herb.summary}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--herbal-jade)' }}>
                          {assignedRole
                            ? `Đang ở: ${ROLE_META.find((r) => r.role === assignedRole)?.title}`
                            : `Quy: ${herb.meridians.slice(0, 2).join(', ')}`}
                        </span>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '1px 6px', fontSize: '0.72rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCodexHerb(herb.id);
                          }}
                        >
                          Y thư
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <MeridianBodyMap
              selectedIds={selectedAcupoints}
              onToggleAcupoint={handleToggleAcupoint}
              isPregnant={selectedCase.isPregnant}
            />
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
              Đóng Ấn Kê Đơn &amp; Xem Kết Quả
            </button>
          </div>
        </section>
      </div>

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
