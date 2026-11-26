import React, { useEffect, useState } from 'react';
import { ClinicDesk } from './components/ClinicDesk';
import { HeaderPlaque, MainTab } from './components/HeaderPlaque';
import { KhaoThiYMieu } from './components/KhaoThiYMieu';
import { TangThuCac } from './components/TangThuCac';
import { InkBrushDefs } from './components/svg/InkBrushDefs';
import { apothecaryAudio } from './engine/audio';
import { computeRank } from './engine/examEngine';
import { createDefaultProgress, loadProgress, saveProgress } from './engine/storage';
import { EvaluationResult, PatientCase, UserProgress } from './types/tcm';

export const App: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [activeTab, setActiveTab] = useState<MainTab>('clinic');
  const [codexHerbId, setCodexHerbId] = useState<string | null>(null);

  useEffect(() => {
    apothecaryAudio.setEnabled(progress.soundEnabled);
    saveProgress(progress);
  }, [progress]);

  const handleCaseEvaluated = (patientCase: PatientCase, result: EvaluationResult) => {
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
        }}
        progress={progress}
        onToggleSound={() =>
          setProgress((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        onImportProgress={(imported) => setProgress(imported)}
        onResetProgress={() => setProgress(createDefaultProgress())}
      />

      <main className="main-stage">
        {activeTab === 'clinic' && (
          <ClinicDesk
            unlockedChapter={progress.unlockedChapter}
            completedCases={progress.completedCases}
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
      </main>

      <footer className="disclaimer-footer">
        Nam Y Quán — Tuệ Tâm Đường là sản phẩm giáo dục mô phỏng Y học cổ truyền Việt Nam. Mọi thông tin chỉ phục vụ mục đích học tập, tra cứu văn hóa và không thay thế chẩn đoán hay điều trị của bác sĩ, lương y được cấp phép.
      </footer>
    </div>
  );
};

export default App;
