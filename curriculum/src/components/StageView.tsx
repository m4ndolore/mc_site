import React, { useMemo } from "react";
import type { Stage } from "../hooks/useCurriculum";
import { logEvent } from "../lib/events";
import ProgressBar from "./ProgressBar";

interface StageViewProps {
  stage: Stage;
  currentProgress?: {
    completedResources: Record<string, boolean>;
    timeSpentByStage: Record<string, number>;
  };
  canAdvance?: boolean;
  onAdvance?: () => void;
  onResourceClick?: (resourceId: string) => void;
}

interface ResourceCategory {
  title: string;
  key: keyof Stage["resources"];
  resources: any[];
}

function StageView({
  stage,
  currentProgress,
  canAdvance,
  onAdvance,
  onResourceClick,
}: StageViewProps): React.JSX.Element {
  const categories: ResourceCategory[] = useMemo(
    () => [
      { title: "Read", key: "read", resources: stage.resources.read || [] },
      { title: "Watch", key: "watch", resources: stage.resources.watch || [] },
      {
        title: "Deep Dive",
        key: "deepDive",
        resources: stage.resources.deepDive || [],
      },
      {
        title: "Explore",
        key: "explore",
        resources: stage.resources.explore || [],
      },
    ],
    [stage.resources]
  );

  const completedCount = useMemo(() => {
    if (!currentProgress) return 0;
    return Object.values(currentProgress.completedResources).filter(Boolean).length;
  }, [currentProgress]);

  const totalResources = useMemo(
    () =>
      categories.reduce((sum, category) => sum + category.resources.length, 0),
    [categories]
  );

  const timeSpent = useMemo(
    () => currentProgress?.timeSpentByStage[stage.id] || 0,
    [currentProgress, stage.id]
  );

  const handleResourceClick = async (resourceId: string) => {
    await logEvent({
      eventType: "content_click",
      stageId: stage.id,
      resourceId,
    });

    onResourceClick?.(resourceId);
  };

  const handleAdvanceClick = () => {
    onAdvance?.();
  };

  return (
    <>
      <style>{`
        .stage-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        .stage-header {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .stage-title {
          font-family: var(--font-primary);
          font-size: 24px;
          font-weight: 600;
          color: var(--offwhite);
        }
        .stage-number {
          font-family: var(--font-primary);
          font-size: 13px;
          color: var(--blue);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stage-description {
          font-family: var(--font-primary);
          font-size: 14px;
          color: var(--gray-light);
          line-height: 1.6;
        }
        .stage-progress {
          padding: 16px;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid var(--ghost-gray);
          border-radius: 4px;
        }
        .stage-categories {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .stage-category {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .stage-category-title {
          font-family: var(--font-primary);
          font-size: 14px;
          font-weight: 600;
          color: var(--offwhite);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          border-bottom: 1px solid var(--ghost-gray);
          padding-bottom: 8px;
        }
        .stage-resource-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .stage-resource-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: rgba(59, 130, 246, 0.02);
          border: 1px solid var(--ghost-gray);
          border-radius: 2px;
          cursor: pointer;
          transition: all 150ms ease;
          text-align: left;
        }
        .stage-resource-item:hover {
          background: rgba(59, 130, 246, 0.05);
          border-color: var(--blue);
        }
        .stage-resource-thumbnail {
          width: 48px;
          height: 48px;
          background: var(--ghost-gray);
          border-radius: 2px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .stage-resource-content {
          flex: 1;
          min-width: 0;
        }
        .stage-resource-title {
          font-family: var(--font-primary);
          font-size: 14px;
          font-weight: 500;
          color: var(--offwhite);
          margin-bottom: 4px;
          word-break: break-word;
        }
        .stage-resource-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--gray-medium);
        }
        .stage-resource-duration {
          white-space: nowrap;
        }
        .stage-actions {
          display: flex;
          justify-content: center;
          padding-top: 12px;
        }
        .stage-advance-button {
          font-family: var(--font-primary);
          font-size: 14px;
          font-weight: 600;
          padding: 12px 24px;
          background: var(--blue);
          color: #ffffff;
          border: 1px solid var(--blue);
          border-radius: 2px;
          cursor: pointer;
          transition: all 150ms ease;
        }
        .stage-advance-button:hover:not(:disabled) {
          background: #2563eb;
          border-color: #2563eb;
        }
        .stage-advance-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 640px) {
          .stage-view {
            padding: 16px;
          }
          .stage-title {
            font-size: 20px;
          }
        }
      `}</style>

      <div className="stage-view">
        <div className="stage-header">
          <div className="stage-number">
            Stage {stage.number} of 5
          </div>
          <h1 className="stage-title">{stage.title}</h1>
          {stage.description && (
            <p className="stage-description">{stage.description}</p>
          )}
        </div>

        <div className="stage-progress">
          <ProgressBar
            engaged={completedCount}
            total={totalResources}
            timeSpent={timeSpent}
          />
        </div>

        <div className="stage-categories">
          {categories.map((category) => (
            category.resources.length > 0 && (
              <div key={category.key} className="stage-category">
                <h2 className="stage-category-title">{category.title}</h2>
                <div className="stage-resource-list">
                  {category.resources.map((resource) => (
                    <button
                      key={resource.id}
                      className="stage-resource-item"
                      onClick={() => handleResourceClick(resource.id)}
                      type="button"
                    >
                      <div className="stage-resource-thumbnail">
                        {category.key === "read"
                          ? "📄"
                          : category.key === "watch"
                            ? "🎥"
                            : category.key === "deepDive"
                              ? "🔬"
                              : "🔍"}
                      </div>
                      <div className="stage-resource-content">
                        <div className="stage-resource-title">
                          {resource.title}
                        </div>
                        {resource.duration && (
                          <div className="stage-resource-meta">
                            <span className="stage-resource-duration">
                              {resource.duration}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        {canAdvance && (
          <div className="stage-actions">
            <button
              type="button"
              className="stage-advance-button"
              onClick={handleAdvanceClick}
            >
              I'm Ready for the Next Stage
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default StageView;
