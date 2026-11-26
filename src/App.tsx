import React, { useEffect, useState } from 'react';
import { ClinicDesk } from './components/ClinicDesk';
import { HeaderPlaque, MainTab } from './components/HeaderPlaque';
import { KhaoThiYMieu } from './components/KhaoThiYMieu';
import { TangThuCac } from './components/TangThuCac';
import { TuDoanTheChat } from './components/TuDoanTheChat';
import { InkBrushDefs } from './components/svg/InkBrushDefs';
import { apothecaryAudio } from './engine/audio';
import { computeRank } from './engine/examEngine';
import { createDefaultProgress, loadProgress, saveProgress } from './engine/storage';
import { CaseLedgerEntry, DecoctionChoice, EvaluationResult, PatientCase, PrescriptionSlots, UserProgress } from './types/tcm';

export const App: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [activeTab, setActiveTab] = useState<MainTab>('clinic');
  const [codexHerbId, setCodexHerbId] = useState<string | null>(null);

  useEffect(() => {
    apothecaryAudio.setEnabled(progress.soundEnabled);
    apothecaryAudio.setVolumes(progress.sfxVolume ?? 0.8, progress.musicVolume ?? 0.65);
    apothecaryAudio.setAmbientEnabled(Boolean(progress.ambientEnabled));
    saveProgress(progress);
  }, [progress]);

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

      if (patientCase.isProcedural) {
        if (result.passed) next.proceduralCleared += 1;
      } else {
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
          const earned = result.totalScore >= 88 ? 25 : 15;
          next.yDucPoints = (prev.yDucPoints ?? 0) + earned;
        }

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
    <div className="app-shell">
      <InkBrushDefs />
      <HeaderPlaque
        activeTab={activeTab}
        onSelectTab={(tab) => {
          apothecaryAudio.playPageTurn();
          setActiveTab(tab);
          window.scrollTo({ top: 0 });
        }}
        progress={progress}
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

      <main className="main-stage">
        {activeTab === 'clinic' && (
          <ClinicDesk
            unlockedChapter={progress.unlockedChapter}
            completedCases={progress.completedCases}
            caseLedger={progress.caseLedger ?? []}
            yDucPoints={progress.yDucPoints ?? 0}
            freshHerbIds={progress.freshHerbIds ?? []}
            gardenGrowth={progress.gardenGrowth ?? {}}
            mentorDismissed={Boolean(progress.mentorDismissed)}
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
        )}

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
              window.scrollTo({ top: 0 });
            }}
          />
        )}
      </main>

      <footer className="disclaimer-footer">
        Nam Y Quán — Tuệ Tâm Đường là sản phẩm giáo dục mô phỏng Y học cổ truyền Việt Nam. Mọi thông tin chỉ phục vụ mục đích học tập, tra cứu văn hóa và không thay thế chẩn đoán hay điều trị của bác sĩ, lương y được cấp phép.
      </footer>
    </div>
  );
};

export default App;
