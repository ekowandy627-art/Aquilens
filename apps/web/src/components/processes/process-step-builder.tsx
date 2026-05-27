"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ProcessStep } from "@/lib/processes";

export type DraftStep = Omit<ProcessStep, "id" | "stepNumber"> & {
  id?: string;
  stepNumber: number;
};

type ProcessStepBuilderProps = {
  steps: DraftStep[];
  readOnly?: boolean;
  onChange: (steps: DraftStep[]) => void;
};

export function ProcessStepBuilder({
  steps,
  readOnly = false,
  onChange,
}: ProcessStepBuilderProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function updateStep(index: number, patch: Partial<DraftStep>) {
    onChange(
      steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch } : step,
      ),
    );
  }

  function addStep() {
    onChange([
      ...steps,
      {
        stepNumber: steps.length + 1,
        title: `Step ${steps.length + 1}`,
        stepType: "manual",
        evidenceRequired: false,
      },
    ]);
  }

  function removeStep(index: number) {
    onChange(
      steps
        .filter((_, stepIndex) => stepIndex !== index)
        .map((step, stepIndex) => ({ ...step, stepNumber: stepIndex + 1 })),
    );
  }

  function reorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }

    const next = [...steps];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next.map((step, index) => ({ ...step, stepNumber: index + 1 })));
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div
          key={step.id ?? `draft-${index}`}
          className="rounded-lg border border-border bg-white"
          draggable={!readOnly}
          onDragStart={() => setDragIndex(index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null) {
              reorder(dragIndex, index);
            }
            setDragIndex(null);
          }}
          onDragEnd={() => setDragIndex(null)}
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            {!readOnly ? (
              <GripVertical className="size-4 text-text-muted" aria-hidden="true" />
            ) : null}
            <div className="text-xs font-medium text-text-muted">
              Step {step.stepNumber}
            </div>
            <div className="flex-1">
              {readOnly ? (
                <div className="font-medium text-slate-950">{step.title}</div>
              ) : (
                <input
                  value={step.title}
                  onChange={(event) =>
                    updateStep(index, { title: event.target.value })
                  }
                  className="h-9 w-full rounded-md border border-border px-3 text-sm"
                  placeholder="Step title"
                />
              )}
            </div>
            {!readOnly ? (
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="rounded-md p-2 text-text-muted hover:bg-red-50 hover:text-red-600"
                aria-label="Remove step"
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 px-4 py-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <label className="text-xs font-medium text-text-muted">
                Description
              </label>
              {readOnly ? (
                <div className="text-sm text-slate-800">
                  {step.description || "—"}
                </div>
              ) : (
                <textarea
                  value={step.description ?? ""}
                  onChange={(event) =>
                    updateStep(index, { description: event.target.value })
                  }
                  className="min-h-[72px] rounded-md border border-border px-3 py-2 text-sm"
                />
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-text-muted">
                Step type
              </label>
              {readOnly ? (
                <div className="text-sm capitalize">{step.stepType}</div>
              ) : (
                <select
                  value={step.stepType}
                  onChange={(event) =>
                    updateStep(index, {
                      stepType: event.target.value as DraftStep["stepType"],
                    })
                  }
                  className="h-10 rounded-md border border-border bg-white px-3 text-sm"
                >
                  <option value="manual">Manual</option>
                  <option value="approval">Approval</option>
                  <option value="system" disabled>
                    System (Phase 8)
                  </option>
                </select>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-text-muted">
                Responsible role
              </label>
              {readOnly ? (
                <div className="text-sm">{step.responsibleRole || "—"}</div>
              ) : (
                <input
                  value={step.responsibleRole ?? ""}
                  onChange={(event) =>
                    updateStep(index, { responsibleRole: event.target.value })
                  }
                  className="h-10 rounded-md border border-border px-3 text-sm"
                  placeholder="e.g. Teacher"
                />
              )}
            </div>

            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={step.evidenceRequired}
                disabled={readOnly}
                onChange={(event) =>
                  updateStep(index, { evidenceRequired: event.target.checked })
                }
              />
              Evidence required
            </label>

            {!readOnly ? (
              <div className="md:col-span-2">
                <button
                  type="button"
                  className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-text-muted"
                  disabled
                >
                  Add AI Model (Phase 8)
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ))}

      {!readOnly ? (
        <button
          type="button"
          onClick={addStep}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-slate-950 hover:bg-surface-bg"
        >
          <Plus className="size-4" />
          Add step
        </button>
      ) : null}
    </div>
  );
}
