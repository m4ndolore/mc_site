import React, { useState, useEffect } from "react";
import { useCurriculum } from "../hooks/useCurriculum";
import { useProgress } from "../hooks/useProgress";
import { logEvent } from "../lib/events";
import StageView from "./StageView";
import AdvanceDialog from "./AdvanceDialog";

interface CurriculumPageProps {
  funderId?: string;
}

function CurriculumPage({ funderId }: CurriculumPageProps): React.JSX.Element {
  const { curriculum, loading: curriculumLoading, error: curriculumError } = useCurriculum();
  const { progress, loading: progressLoading, updateProgress } = useProgress(funderId);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);

  useEffect(() => {
    // Track curriculum_view event on mount
    const trackEvent = async () => {
      await logEvent({
        eventType: "curriculum_view",
        funderId,
        metadata: { startStage: progress?.currentStage },
      });
    };
    trackEvent();
  }, [funderId, progress?.currentStage]);

  if (curriculumLoading || progressLoading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "var(--gray-light)" }}>Loading curriculum...</p>
      </div>
    );
  }

  if (curriculumError || !curriculum) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "#ef4444" }}>
          Failed to load curriculum. Please try again.
        </p>
      </div>
    );
  }

  if (!progress) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "#ef4444" }}>
          Failed to load progress. Please try again.
        </p>
      </div>
    );
  }

  const currentStageIndex = progress.currentStage - 1;
  const currentStage = curriculum.stages[currentStageIndex];

  if (!currentStage) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h2 style={{ color: "var(--offwhite)", marginBottom: "1rem" }}>
          Curriculum Complete!
        </h2>
        <p style={{ color: "var(--gray-light)" }}>
          You've successfully completed all {curriculum.totalStages} stages.
        </p>
      </div>
    );
  }

  const handleResourceClick = async (resourceId: string) => {
    // Track resource engagement
    const updatedResources = {
      ...progress.completedResources,
      [resourceId]: true,
    };
    await updateProgress({
      completedResources: updatedResources,
    });
  };

  const handleAdvanceClick = () => {
    setShowAdvanceDialog(true);
  };

  const handleAdvanceSubmit = async (reason: string) => {
    // Log advance_request event
    await logEvent({
      eventType: "advance_request",
      stageId: currentStage.id,
      funderId: funderId,
      metadata: { reason },
    });

    // Advance to next stage
    const nextStage = progress.currentStage + 1;
    await updateProgress({
      currentStage: nextStage,
    });

    setShowAdvanceDialog(false);
  };

  return (
    <>
      <style>{`
        .curriculum-page {
          padding: 2rem 1rem;
          background: var(--black);
          min-height: 100vh;
        }
        .curriculum-header {
          max-width: 800px;
          margin: 0 auto 2rem;
          text-align: center;
        }
        .curriculum-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--offwhite);
          margin-bottom: 0.5rem;
        }
        .curriculum-subtitle {
          font-size: 14px;
          color: var(--gray-light);
          margin-bottom: 1.5rem;
        }
        .curriculum-progress-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid var(--ghost-gray);
          border-radius: 4px;
          font-size: 12px;
          color: var(--blue);
          font-weight: 500;
        }
      `}</style>

      <div className="curriculum-page">
        <div className="curriculum-header">
          <h1 className="curriculum-title">{curriculum.title}</h1>
          <p className="curriculum-subtitle">{curriculum.description}</p>
          <div className="curriculum-progress-indicator">
            Stage {currentStage.number} of {curriculum.totalStages}
          </div>
        </div>

        <StageView
          stage={currentStage}
          currentProgress={progress}
          canAdvance={true}
          onAdvance={handleAdvanceClick}
          onResourceClick={handleResourceClick}
        />

        {showAdvanceDialog && (
          <AdvanceDialog
            stageId={currentStage.id}
            onSubmit={handleAdvanceSubmit}
            onCancel={() => setShowAdvanceDialog(false)}
          />
        )}
      </div>
    </>
  );
}

export default CurriculumPage;
