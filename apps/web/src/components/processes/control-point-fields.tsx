"use client";

import {
  EVIDENCE_MAP_MODES,
  EVIDENCE_MAP_MODE_LABELS,
  emptyEvidenceMap,
  type EvidenceMap,
  type EvidenceMapMode,
} from "@aquilens/shared";

type ControlPointFieldsProps = {
  isControlPoint: boolean;
  evidenceMap: EvidenceMap;
  readOnly?: boolean;
  onChange: (patch: {
    isControlPoint: boolean;
    evidenceMap: EvidenceMap;
    evidenceRequired: boolean;
  }) => void;
};

export function ControlPointFields({
  isControlPoint,
  evidenceMap,
  readOnly = false,
  onChange,
}: ControlPointFieldsProps) {
  function setControlPoint(enabled: boolean) {
    if (!enabled) {
      onChange({
        isControlPoint: false,
        evidenceRequired: false,
        evidenceMap: emptyEvidenceMap(),
      });
      return;
    }
    onChange({
      isControlPoint: true,
      evidenceRequired: true,
      evidenceMap: evidenceMap.mode
        ? { ...evidenceMap, needsCompletion: false }
        : { mode: "acknowledgement" },
    });
  }

  function setMode(mode: EvidenceMapMode) {
    onChange({
      isControlPoint: true,
      evidenceRequired: true,
      evidenceMap: {
        ...evidenceMap,
        mode,
        needsCompletion: false,
      },
    });
  }

  return (
    <div className="md:col-span-2 space-y-3 rounded-md border border-dashed border-border bg-surface-bg/40 p-3">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={isControlPoint}
          disabled={readOnly}
          onChange={(event) => setControlPoint(event.target.checked)}
          data-testid="control-point-toggle"
        />
        <span>
          <span className="font-medium text-slate-950">Control point</span>
          <span className="block text-xs text-text-muted">
            This step requires documented evidence before the process is audit-ready.
          </span>
        </span>
      </label>

      {isControlPoint ? (
        <div className="grid gap-3 pl-6 md:grid-cols-2">
          <div className="grid gap-1 md:col-span-2">
            <label className="text-xs font-medium text-text-muted">
              Evidence mode
            </label>
            {readOnly ? (
              <div className="text-sm">
                {evidenceMap.mode
                  ? EVIDENCE_MAP_MODE_LABELS[evidenceMap.mode]
                  : "—"}
              </div>
            ) : (
              <select
                value={evidenceMap.mode ?? ""}
                onChange={(event) =>
                  setMode(event.target.value as EvidenceMapMode)
                }
                className="h-10 rounded-md border border-border bg-white px-3 text-sm"
                data-testid="evidence-map-mode"
              >
                <option value="" disabled>
                  Select evidence type…
                </option>
                {EVIDENCE_MAP_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {EVIDENCE_MAP_MODE_LABELS[mode]}
                  </option>
                ))}
              </select>
            )}
          </div>

          {evidenceMap.mode === "external_system" ? (
            <div className="grid gap-1 md:col-span-2">
              <label className="text-xs font-medium text-text-muted">
                System name
              </label>
              {readOnly ? (
                <div className="text-sm">{evidenceMap.systemName || "—"}</div>
              ) : (
                <input
                  value={evidenceMap.systemName ?? ""}
                  onChange={(event) =>
                    onChange({
                      isControlPoint: true,
                      evidenceRequired: true,
                      evidenceMap: {
                        ...evidenceMap,
                        systemName: event.target.value,
                        needsCompletion: false,
                      },
                    })
                  }
                  className="h-10 rounded-md border border-border px-3 text-sm"
                  placeholder="e.g. SIMS, ERP"
                  data-testid="evidence-map-system"
                />
              )}
            </div>
          ) : null}

          {evidenceMap.mode === "physical" ? (
            <div className="grid gap-1 md:col-span-2">
              <label className="text-xs font-medium text-text-muted">
                Location description
              </label>
              {readOnly ? (
                <div className="text-sm">
                  {evidenceMap.locationDescription || "—"}
                </div>
              ) : (
                <input
                  value={evidenceMap.locationDescription ?? ""}
                  onChange={(event) =>
                    onChange({
                      isControlPoint: true,
                      evidenceRequired: true,
                      evidenceMap: {
                        ...evidenceMap,
                        locationDescription: event.target.value,
                        needsCompletion: false,
                      },
                    })
                  }
                  className="h-10 rounded-md border border-border px-3 text-sm"
                  placeholder="e.g. Main office filing cabinet"
                  data-testid="evidence-map-location"
                />
              )}
            </div>
          ) : null}

          <div className="grid gap-1 md:col-span-2">
            <label className="text-xs font-medium text-text-muted">Notes</label>
            {readOnly ? (
              <div className="text-sm">{evidenceMap.notes || "—"}</div>
            ) : (
              <textarea
                value={evidenceMap.notes ?? ""}
                onChange={(event) =>
                  onChange({
                    isControlPoint: true,
                    evidenceRequired: true,
                    evidenceMap: {
                      ...evidenceMap,
                      notes: event.target.value,
                    },
                  })
                }
                className="min-h-[56px] rounded-md border border-border px-3 py-2 text-sm"
                placeholder="Optional context for auditors"
              />
            )}
          </div>

          {evidenceMap.needsCompletion ? (
            <p className="text-xs text-amber-800 md:col-span-2">
              Migrated from legacy “evidence required” — complete the evidence map.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
