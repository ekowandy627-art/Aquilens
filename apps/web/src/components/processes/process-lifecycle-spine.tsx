"use client";

import type { LifecycleSpineStage } from "@/lib/processes";

type ProcessLifecycleSpineProps = {
  stages: LifecycleSpineStage[];
};

export function ProcessLifecycleSpine({ stages }: ProcessLifecycleSpineProps) {
  if (!stages.length) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-border bg-white p-4"
      data-testid="process-lifecycle-spine"
    >
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
        Lifecycle
      </div>
      <ol className="flex flex-wrap items-center gap-2">
        {stages.map((stage, index) => (
          <li key={stage.id} className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                stage.status === "complete"
                  ? "bg-emerald-50 text-emerald-800"
                  : stage.status === "current"
                    ? "bg-brand-teal text-white"
                    : "bg-surface-bg text-text-muted"
              }`}
              data-testid={`lifecycle-stage-${stage.id}`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  stage.status === "complete"
                    ? "bg-emerald-600"
                    : stage.status === "current"
                      ? "bg-white"
                      : "bg-slate-300"
                }`}
                aria-hidden="true"
              />
              {stage.label}
            </span>
            {index < stages.length - 1 ? (
              <span className="text-text-muted" aria-hidden="true">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
