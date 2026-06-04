"use client";

import { ShieldCheck } from "lucide-react";
import {
  EVIDENCE_MAP_MODE_LABELS,
  type EvidenceMapMode,
} from "@aquilens/shared";
import type { ProcessStep } from "@/lib/processes";

type ProcessFlowViewProps = {
  steps: ProcessStep[];
};

function evidenceModeLabel(mode?: EvidenceMapMode) {
  if (!mode) {
    return "Evidence map incomplete";
  }
  return EVIDENCE_MAP_MODE_LABELS[mode];
}

export function ProcessFlowView({ steps }: ProcessFlowViewProps) {
  if (!steps.length) {
    return (
      <p className="text-sm text-text-muted" data-testid="process-flow-empty">
        No steps defined yet. Add steps in the Steps tab or editor.
      </p>
    );
  }

  const ordered = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  return (
    <div className="space-y-0" data-testid="process-flow-view">
      {ordered.map((step, index) => (
        <div key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
          {index < ordered.length - 1 ? (
            <span
              className="absolute left-[15px] top-8 bottom-0 w-px bg-border"
              aria-hidden="true"
            />
          ) : null}
          <div
            className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
              step.isControlPoint
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-border bg-surface-bg text-slate-700"
            }`}
          >
            {step.stepNumber}
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-border bg-surface-bg/50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-slate-950">{step.title}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs capitalize text-text-muted">
                {step.stepType}
              </span>
              {step.isControlPoint ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
                  data-testid={`flow-control-point-${step.id}`}
                >
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  Control point
                </span>
              ) : null}
            </div>
            {step.description ? (
              <p className="mt-1 text-sm text-slate-700">{step.description}</p>
            ) : null}
            {step.responsibleRole ? (
              <p className="mt-2 text-xs text-text-muted">
                Responsible: {step.responsibleRole}
              </p>
            ) : null}
            {step.isControlPoint ? (
              <p
                className={`mt-2 text-xs ${
                  step.evidenceMapComplete === false
                    ? "text-amber-800"
                    : "text-emerald-800"
                }`}
              >
                Evidence: {evidenceModeLabel(step.evidenceMap.mode)}
                {step.evidenceMapComplete === false ? " (needs completion)" : ""}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
