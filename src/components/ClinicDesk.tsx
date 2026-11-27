import React from 'react';
import { apothecaryAudio } from '../engine/audio';
import { FloatingJuiceLayer } from './FloatingJuiceLayer';
import { buildFollowUpCase, dueFollowUps } from '../engine/followUp';
import { buildDailyCase, dailyKey } from '../engine/dailyCase';
import { CaseLedgerModal } from './CaseLedgerModal';
import { FirstCaseGuideBar } from './FirstCaseGuideBar';
import { FloatingAtmosphereCanvas } from './FloatingAtmosphereCanvas';
import { GlossaryText } from './GlossaryText';
import { OutcomeScrollModal } from './OutcomeScrollModal';
import { PaperFoldOverlay } from './PaperFoldOverlay';
import { AntiqueIcon } from './svg/AntiqueIcons';
import { CaseDirectoryModal } from './clinic/CaseDirectoryModal';
import { FollowUpLetterModal } from './clinic/FollowUpLetterModal';
import { TabletopDesk } from './clinic/TabletopDesk';
import { ROOM_NODES } from './clinic/clinicConstants';
import { ClinicDeskProps, useClinicDesk } from './clinic/useClinicDesk';
import { TienDuongRoom } from './clinic/TienDuongRoom';
import { DuocCacRoom } from './clinic/DuocCacRoom';
import { NoiCacRoom } from './clinic/NoiCacRoom';
import { HauVienRoom } from './clinic/HauVienRoom';

export const ClinicDesk: React.FC<ClinicDeskProps> = (props) => {
  const ctx = useClinicDesk(props);
  const {
    completedCases,
    caseLedger,
    yDucPoints,
    dayCount,
    pendingFollowUps,
    songAnClearedIds,
    mentorDismissed,
    onDismissMentor,
    activeChapter,
    setActiveChapter,
    selectedCase,
    activeRoom,
    activeToolDrawer,
    setActiveToolDrawer,
    askedIds,
    incenseLitCaseId,
    clues,
    diagnosis,
    openLetter,
    setOpenLetter,
    slotPaoZhi,
    roomPan,
    callouts,
    showFoldOverlay,
    selectedAcupoints,
    stampingActive,
    deskShake,
    showDirectoryModal,
    setShowDirectoryModal,
    setActiveSongAnId,
    showCluesPopover,
    setShowCluesPopover,
    showLedgerModal,
    setShowLedgerModal,
    outcome,
    setOutcome,
    viewportRef,
    watchLightingClass,
    hasDragonScale,
    hasBatTrangPot,
    hasJadeSeal,
    lockViewportScrollZero,
    switchRoom,
    chapterCases,
    weatherMoodClass,
    healthColorVars,
    loadPatient,
    handleSelectChapter,
    handleSpawnProcedural,
    effectiveMaxInquiries,
    handleLightDeskIncense,
    assignedHerbObjects,
    handleShowRelics,
    handleNextCase,
    dailyResults,
    signature
  } = ctx;
  const todayKey = dailyKey();
  const todayResult = dailyResults[todayKey];
  return (
    <div
      className={`clinic-stage spatial-clinic-stage ${watchLightingClass} ${weatherMoodClass} ${stampingActive || deskShake ? 'stamp-shake' : ''} ${roomPan ? 'room-panning' : ''}`}
      style={{ ...healthColorVars, '--pan': roomPan } as React.CSSProperties}
    >
      <div className="ambient-lantern-aura" aria-hidden="true" />
      <FloatingAtmosphereCanvas activeRoom={activeRoom} hasIncenseBurner={yDucPoints >= 20} />
      <FloatingJuiceLayer callouts={callouts} />

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
          <button
            type="button"
            className="hud-scroll-btn daily-case-btn"
            onClick={() => loadPatient(buildDailyCase(todayKey), true)}
            title="Mọi người cùng một ca mỗi ngày · cân Bát Cương bị che, chỉ dựa vào biện chứng"
          >
            <AntiqueIcon name="scroll" size={13} />{' '}
            <span>{todayResult ? `Danh Y Hằng Ngày · ${todayResult.score}đ` : 'Danh Y Hằng Ngày'}</span>
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
            <TienDuongRoom ctx={ctx} />
            <DuocCacRoom ctx={ctx} />
            <NoiCacRoom ctx={ctx} />
            <HauVienRoom ctx={ctx} />
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
          signature={signature}
          dailyKey={selectedCase.isDaily ? selectedCase.id.replace(/^daily-/, '') : undefined}
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

