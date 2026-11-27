import React from 'react';
import { SONG_AN_PAIRS, STORY_CASES } from '../../data/cases';
import { apothecaryAudio } from '../../engine/audio';
import { TypewriterText } from '../TypewriterText';
import { AmbientParticlesCanvas } from '../AmbientParticlesCanvas';
import { EightPrinciplesCompass } from '../EightPrinciplesCompass';
import { GlossaryText } from '../GlossaryText';
import { PulseCanvas } from '../PulseCanvas';
import { AntiqueIcon } from '../svg/AntiqueIcons';
import { TongueMirror } from '../svg/TongueMirror';
import { VillagerPortrait } from '../svg/VillagerPortrait';
import { BienChungLedger } from '../clinic/BienChungLedger';
import type { ClinicCtx } from './useClinicDesk';
import { RoomBackdrop } from './RoomBackdrop';

export const TienDuongRoom: React.FC<{ ctx: ClinicCtx }> = ({ ctx }) => {
  const {
    completedCases,
    selectedCase,
    activeRoom,
    curtainParting,
    activeToolDrawer,
    outcome,
    setActiveToolDrawer,
    askedIds,
    clues,
    auscultating,
    diagnosis,
    bienChung,
    ledgerFx,
    pickedAxes,
    activeSongAnId,
    changeDiagnosis,
    inspectorRef,
    activeWatch,
    watchLight,
    roomWeather,
    solarTerm,
    switchRoom,
    patientVoice,
    preview,
    hasAssignedTreatment,
    solarWeather,
    loadPatient,
    addClue,
    handlePlayAuscultation,
    effectiveMaxInquiries,
    handleAskQuestion,
    handleSealBienChung,
    hoanhPhi,
    handleReferral,
    stampingActive
  } = ctx;
  return (
    <>
    {/* ================= ROOM 1: TIỀN ĐƯỜNG 2.0 — FULL-BLEED SPATIAL DIORAMA ================= */}
    <section
      className={`apothecary-room spatial-room ${activeRoom === 0 ? 'is-active-room' : ''}`}
      aria-label="Buồng 1: Tiền Đường Tiếp Bệnh"
    >
      <div className={`spatial-room-bg-layer ${curtainParting ? 'curtain-parting' : ''}`} aria-hidden="true">
        <RoomBackdrop room="tien-duong" night={watchLight.lamp} healthTinted weather={roomWeather} />
        <div className={`watch-light ${watchLight.lamp ? "is-lamplit" : ""}`} aria-hidden="true" />
        <div className="spatial-bg-vignette" />
        {solarWeather !== 'rain' && <AmbientParticlesCanvas key={solarWeather} mode={solarWeather} />}
        {hoanhPhi.length > 0 && (
          <div className="hoanh-phi-plaque" title={`Hoành phi tạ ơn: ${hoanhPhi.join(' · ')}`}>
            {hoanhPhi[hoanhPhi.length - 1]}
          </div>
        )}
        <div className="curtain-veil left" />
        <div className="curtain-veil right" />
      </div>

      <div className={`spatial-room-body tien-duong-spatial ${activeToolDrawer ? 'has-open-drawer' : ''}`}>
        {/* Left / Center Cinematic Patient & Speech Stage */}
        <div className="spatial-patient-stage">
          <div className="stage-patient-centerpiece">
            {/* the patient sits across the desk from you, lit by the oil lamp on the left; the lower body dissolves into shadow like an ink-wash figure */}
            <div className="patient-at-desk" aria-hidden="true">
              <VillagerPortrait
                patientCase={selectedCase}
                size="stage"
                cutout
                mood={outcome?.passed ? 'recovered' : 'sick'}
                activeExamTool={activeToolDrawer && activeToolDrawer !== 'bat-cuong' ? activeToolDrawer : null}
                coughing={auscultating}
              />
            </div>
          </div>

          <div className="spatial-dialogue-card">
            <div className="stage-case-meta">
              <h2 className="room-stage-title">{selectedCase.title}</h2>
              {selectedCase.crisis && !outcome && (
                <div className="crisis-referral-bar">
                  <span>Đêm mưa gõ cửa: tự chữa tại quán, hay có dấu hiệu phải chuyển viện?</span>
                  <button type="button" className="btn-cinnabar crisis-referral-btn" disabled={stampingActive} onClick={handleReferral}>
                    Chuyển y viện ngay
                  </button>
                </div>
              )}
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
    </>
  );
};
