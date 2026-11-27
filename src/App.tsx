import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { CURES_PER_CRISIS } from './engine/crisis';
import { AchievementCabinetModal } from './components/AchievementCabinetModal';
import { AchievementToast } from './components/AchievementToast';
import { ClinicDesk } from './components/ClinicDesk';
import { HeaderPlaque, MainTab } from './components/HeaderPlaque';
import { TitleGateScreen } from './components/TitleGateScreen';
import { InkBrushDefs } from './components/svg/InkBrushDefs';
import {
  ACHIEVEMENTS,
  computeUnlockedAchievements,
  HonorSealAchievement
} from './data/achievements';
import { SONG_AN_PAIRS } from './data/cases';
import { apothecaryAudio } from './engine/audio';
import { computeRank, recordMistakes } from './engine/examEngine';
import { planFollowUp } from './engine/followUp';
import { createDefaultProgress, loadProgress, saveProgress } from './engine/storage';
import { CaseLedgerEntry, DecoctionChoice, EvaluationResult, PatientCase, PrescriptionSlots, UserProgress } from './types/tcm';

// overlay modes load on first open to keep the first paint light
const TangThuCac = lazy(() => import('./components/TangThuCac').then((m) => ({ default: m.TangThuCac })));
const KhaoThiYMieu = lazy(() => import('./components/KhaoThiYMieu').then((m) => ({ default: m.KhaoThiYMieu })));
const TuDoanTheChat = lazy(() => import('./components/TuDoanTheChat').then((m) => ({ default: m.TuDoanTheChat })));

export const App: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [activeTab, setActiveTab] = useState<MainTab>('clinic');
  const [codexHerbId, setCodexHerbId] = useState<string | null>(null);
  const [enteredClinic, setEnteredClinic] = useState<boolean>(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);
  const [toastAchievement, setToastAchievement] = useState<HonorSealAchievement | null>(null);
  const unlockedIds = computeUnlockedAchievements(progress);
  const prevUnlockedRef = useRef<Set<string>>(new Set(unlockedIds));
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    apothecaryAudio.setEnabled(progress.soundEnabled);
    apothecaryAudio.setVolumes(progress.sfxVolume ?? 0.8, progress.musicVolume ?? 0.65);
    if (enteredClinic) {
      apothecaryAudio.setAmbientEnabled(Boolean(progress.ambientEnabled));
    }
    saveProgress(progress);
  }, [progress, enteredClinic]);

  useEffect(() => {
    const newlyUnlocked = unlockedIds.filter((id) => !prevUnlockedRef.current.has(id));
    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach((id) => prevUnlockedRef.current.add(id));
      const found = ACHIEVEMENTS.find((a) => a.id === newlyUnlocked[0]) ?? null;
      if (found) {
        setToastAchievement(found);
        apothecaryAudio.playAchievementSeal();
        if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setToastAchievement(null), 5000);
      }
      setProgress((prev) => ({
        ...prev,
        unlockedAchievements: unlockedIds
      }));
    }
  }, [unlockedIds.join(',')]);

  const handleCaseEvaluated = (
    patientCase: PatientCase,
    result: EvaluationResult,
    meta?: { slots: PrescriptionSlots; acupoints: string[]; decoction?: DecoctionChoice }
  ) => {
    setProgress((prev) => {
      const next: UserProgress = {
        ...prev,
        completedCases: { ...prev.completedCases },
        proceduralCleared: prev.proceduralCleared
      };

      if (meta?.slots) {
        next.mistakes = recordMistakes(prev.mistakes ?? [], patientCase, result, meta.slots);
      }

      if (patientCase.crisis) {
        next.crisesAttended = (prev.crisesAttended ?? 0) + 1;
        next.curesSinceCrisis = 0;
        const plaque = patientCase.crisis.plaque;
        if (result.passed && !(prev.hoanhPhi ?? []).includes(plaque)) {
          next.hoanhPhi = [...(prev.hoanhPhi ?? []), plaque];
        }
      } else if (result.passed) {
        next.curesSinceCrisis = (prev.curesSinceCrisis ?? 0) + 1;
      }

      if (patientCase.isDaily) {
        const key = patientCase.id.replace(/^daily-/, '');
        if (!prev.dailyResults?.[key]) {
          next.dailyResults = {
            ...prev.dailyResults,
            [key]: { score: result.totalScore, grade: result.grade, passed: result.passed }
          };
        }
      }

      if (patientCase.isProcedural) {
        if (result.passed) next.proceduralCleared += 1;
      } else if (!patientCase.followUpOf) {
        const existing = next.completedCases[patientCase.id];
        if (!existing || result.totalScore > existing.bestScore) {
          next.completedCases[patientCase.id] = {
            bestScore: result.totalScore,
            grade: result.grade
          };
        }
      }

      // Unlock next chapter when at least 2 cases in current unlocked chapter pass
      const currentChapterPassed = Object.keys(next.completedCases).filter((id) => {
        const isCh1 = id.startsWith('c1-');
        const isCh2 = id.startsWith('c2-');
        return (
          next.completedCases[id].bestScore >= 70 &&
          ((next.unlockedChapter === 1 && isCh1) || (next.unlockedChapter === 2 && isCh2))
        );
      }).length;

      if (next.unlockedChapter === 1 && currentChapterPassed >= 2) {
        next.unlockedChapter = 2;
      } else if (next.unlockedChapter === 2 && currentChapterPassed >= 2) {
        next.unlockedChapter = 3;
      }

      if (result.matchedFormulas.length > 0) {
        const formulaSet = new Set(next.discoveredFormulas ?? []);
        result.matchedFormulas.forEach((f) => formulaSet.add(f.id));
        next.discoveredFormulas = Array.from(formulaSet);
      }

      if (meta) {
        const usedFresh = (meta.decoction?.usedFreshHerbs ?? []).filter((id) =>
          Object.values(meta.slots).includes(id)
        );
        if (usedFresh.length > 0 && prev.freshHerbIds) {
          next.freshHerbIds = prev.freshHerbIds.filter((id) => !usedFresh.includes(id));
        }

        if (result.passed) {
          const nextStreak = (prev.currentStreak ?? 0) + 1;
          next.currentStreak = nextStreak;
          const streakBonus = nextStreak >= 2 ? Math.min(15, nextStreak * 5) : 0;
          let earned = (result.totalScore >= 88 ? 25 : 15) + streakBonus;

          const existingSongAn = new Set(prev.songAnClearedIds ?? []);
          for (const pair of SONG_AN_PAIRS) {
            if (existingSongAn.has(pair.id)) continue;
            const aOk = (next.completedCases[pair.caseAId]?.bestScore ?? 0) >= 70;
            const bOk = (next.completedCases[pair.caseBId]?.bestScore ?? 0) >= 70;
            if (aOk && bOk) {
              existingSongAn.add(pair.id);
              earned += pair.rewardYDuc;
            }
          }
          next.songAnClearedIds = Array.from(existingSongAn);
          next.yDucPoints = (prev.yDucPoints ?? 0) + earned;
        } else {
          next.currentStreak = 0;
        }
        next.dayCount = (prev.dayCount ?? 1) + 1;

        const ledgerEntry: CaseLedgerEntry = {
          id: `${patientCase.id}-${Date.now()}`,
          caseId: patientCase.id,
          patientName: patientCase.patientName,
          caseTitle: patientCase.title,
          totalScore: result.totalScore,
          grade: result.grade,
          passed: result.passed,
          slots: { ...meta.slots },
          paoZhi: meta.decoction?.paoZhi ? { ...meta.decoction.paoZhi } : undefined,
          acupoints: [...meta.acupoints],
          moxaEnabled: Boolean(meta.decoction?.moxaEnabled),
          followUpLetter: result.followUpLetter ?? result.summaryFeedback,
          timestamp: Date.now()
        };
        next.caseLedger = [ledgerEntry, ...(next.caseLedger ?? [])].slice(0, 50);
      }

      if (!patientCase.isProcedural) {
        const storyId = patientCase.followUpOf ?? patientCase.id;
        const followUp = planFollowUp(patientCase, result, prev.dayCount ?? 1);
        next.pendingFollowUps = [
          ...(prev.pendingFollowUps ?? []).filter((f) => f.caseId !== storyId),
          ...(followUp ? [followUp] : [])
        ];
      }

      next.rank = computeRank(next);
      return next;
    });
  };

  const handleRecordExamAnswer = (targetKey: string, isCorrect: boolean) => {
    setProgress((prev) => {
      const current = prev.mastery[targetKey] ?? { seen: 0, correct: 0 };
      const next: UserProgress = {
        ...prev,
        mastery: {
          ...prev.mastery,
          [targetKey]: {
            seen: current.seen + 1,
            correct: current.correct + (isCorrect ? 1 : 0),
            lastMissedAt: isCorrect ? undefined : Date.now()
          }
        }
      };

      next.rank = computeRank(next);
      return next;
    });
  };

  const handlePassExamChapter = (chapter: 1 | 2 | 3) => {
    setProgress((prev) => {
      const passedSet = new Set(prev.examPassedChapters);
      passedSet.add(chapter);
      const nextChapter =
        chapter === 1 && prev.unlockedChapter < 2
          ? 2
          : chapter === 2 && prev.unlockedChapter < 3
          ? 3
          : prev.unlockedChapter;

      const next: UserProgress = {
        ...prev,
        examPassedChapters: Array.from(passedSet),
        unlockedChapter: nextChapter as 1 | 2 | 3
      };

      next.rank = computeRank(next);
      return next;
    });
  };

  return (
    <div className="app-shell spatial-shell">
      <InkBrushDefs />
      {!enteredClinic && (
        <TitleGateScreen
          progress={progress}
          unlockedAchievementCount={unlockedIds.length}
          onEnterClinic={(withMusic) => {
            setEnteredClinic(true);
            setProgress((prev) => ({ ...prev, ambientEnabled: withMusic }));
            apothecaryAudio.setAmbientEnabled(withMusic);
            apothecaryAudio.playCurtainBell();
          }}
        />
      )}
      <AchievementToast
        achievement={toastAchievement}
        onDismiss={() => setToastAchievement(null)}
      />
      <HeaderPlaque
        activeTab={activeTab}
        onSelectTab={(tab) => {
          apothecaryAudio.playPageTurn();
          setActiveTab(tab);
        }}
        progress={progress}
        unlockedAchievementCount={unlockedIds.length}
        totalAchievementCount={ACHIEVEMENTS.length}
        onOpenAchievements={() => {
          apothecaryAudio.playPageTurn();
          setShowAchievementsModal(true);
        }}
        onToggleSound={() =>
          setProgress((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        onToggleAmbient={() =>
          setProgress((prev) => ({ ...prev, ambientEnabled: !prev.ambientEnabled }))
        }
        onChangeVolumes={(sfxVolume, musicVolume) =>
          setProgress((prev) => ({ ...prev, sfxVolume, musicVolume }))
        }
        onImportProgress={(imported) => setProgress(imported)}
        onResetProgress={() => setProgress(createDefaultProgress())}
      />
      {showAchievementsModal && (
        <AchievementCabinetModal
          progress={progress}
          unlockedIds={unlockedIds}
          onClose={() => setShowAchievementsModal(false)}
        />
      )}

      <main className="main-stage spatial-main-stage">
        <ClinicDesk
          unlockedChapter={progress.unlockedChapter}
          completedCases={progress.completedCases}
          caseLedger={progress.caseLedger ?? []}
          yDucPoints={progress.yDucPoints ?? 0}
          dayCount={progress.dayCount ?? 1}
          pendingFollowUps={progress.pendingFollowUps ?? []}
          currentStreak={progress.currentStreak ?? 0}
          songAnClearedIds={progress.songAnClearedIds ?? []}
          discoveredFormulas={progress.discoveredFormulas ?? []}
          freshHerbIds={progress.freshHerbIds ?? []}
          gardenGrowth={progress.gardenGrowth ?? {}}
          mentorDismissed={Boolean(progress.mentorDismissed)}
          dailyResults={progress.dailyResults ?? {}}
          signature={progress.signature}
          crisisDue={(progress.curesSinceCrisis ?? 0) >= CURES_PER_CRISIS}
          crisesAttended={progress.crisesAttended ?? 0}
          hoanhPhi={progress.hoanhPhi ?? []}
          onSaveSignature={(dataUrl) =>
            setProgress((prev) => ({ ...prev, signature: dataUrl ?? undefined }))
          }
          onDismissMentor={() =>
            setProgress((prev) => ({ ...prev, mentorDismissed: true }))
          }
          onWaterGardenPlot={(herbId) => {
            apothecaryAudio.playWaterPour();
            setProgress((prev) => {
              const cur = prev.gardenGrowth?.[herbId] ?? 1;
              return {
                ...prev,
                gardenGrowth: {
                  ...(prev.gardenGrowth ?? {}),
                  [herbId]: Math.min(3, cur + 1)
                }
              };
            });
          }}
          onHarvestGardenPlot={(herbId) => {
            apothecaryAudio.playHerbDrop();
            setProgress((prev) => {
              const existing = prev.freshHerbIds ?? [];
              return {
                ...prev,
                freshHerbIds: existing.includes(herbId) ? existing : [...existing, herbId],
                gardenGrowth: {
                  ...(prev.gardenGrowth ?? {}),
                  [herbId]: 0
                }
              };
            });
          }}
          onCaseEvaluated={handleCaseEvaluated}
          onOpenCodexHerb={(herbId) => {
            setCodexHerbId(herbId);
            setActiveTab('codex');
          }}
        />

        {/* Ancient Scroll Overlays for Tàng Thư Các / Khảo Thí Y Miếu / Đoán Thể Chất */}
        {activeTab !== 'clinic' && (
          <div
            className="spatial-scroll-overlay-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Cuộn giấy phụ Y Quán"
            onClick={() => setActiveTab('clinic')}
          >
            <div
              className="spatial-scroll-overlay-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="spatial-overlay-bar">
                <strong>
                  {activeTab === 'codex'
                    ? 'Tàng Thư Các — Bản Thảo & Cổ Phương'
                    : activeTab === 'exam'
                    ? 'Khảo Thí Y Miếu'
                    : 'Đoán Thể Chất Dưỡng Sinh'}
                </strong>
                <button
                  type="button"
                  className="btn-cinnabar"
                  style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                  onClick={() => {
                    apothecaryAudio.playPageTurn();
                    setActiveTab('clinic');
                  }}
                >
                  ← Quay lại Bàn Khám
                </button>
              </div>

              <div className="spatial-overlay-body">
                <Suspense fallback={<p className="spatial-overlay-loading">Đang mở quyển…</p>}>
                {activeTab === 'codex' && (
                  <TangThuCac
                    herbNotes={progress.herbNotes}
                    initialHerbId={codexHerbId}
                    discoveredFormulas={progress.discoveredFormulas ?? []}
                    onSaveHerbNote={(herbId, note) =>
                      setProgress((prev) => ({
                        ...prev,
                        herbNotes: { ...prev.herbNotes, [herbId]: note }
                      }))
                    }
                  />
                )}

                {activeTab === 'exam' && (
                  <KhaoThiYMieu
                    progress={progress}
                    onRecordAnswer={handleRecordExamAnswer}
                    onPassExamChapter={handlePassExamChapter}
                  />
                )}

                {activeTab === 'constitution' && (
                  <TuDoanTheChat
                    savedConstitution={progress.savedConstitution}
                    onSaveConstitution={(id) =>
                      setProgress((prev) => ({ ...prev, savedConstitution: id }))
                    }
                    onOpenCodexHerb={(herbId) => {
                      setCodexHerbId(herbId);
                      setActiveTab('codex');
                    }}
                  />
                )}
                </Suspense>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
