"use client";

import { useEffect, useMemo, useState } from "react";
import { GUIDANCE_SELECTION_LABELS, type GuidanceSelectionStatus } from "@aquilens/shared";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import type { GuidanceRecommendation } from "@/lib/guidance";

type PackSelection = {
  packId: string;
  slug: string;
  name: string;
  summary: string;
  selectionStatus: GuidanceSelectionStatus | "";
};

type GuidanceSelectionPanelProps = {
  recommendations: GuidanceRecommendation[];
  packIdsBySlug: Record<string, string>;
  initialSelections?: Record<string, GuidanceSelectionStatus>;
  onChange?: (selections: PackSelection[]) => void;
  onReadyChange?: (ready: boolean) => void;
  requireDisclaimer?: boolean;
};

export function GuidanceSelectionPanel({
  recommendations,
  packIdsBySlug,
  initialSelections = {},
  onChange,
  onReadyChange,
  requireDisclaimer = true,
}: GuidanceSelectionPanelProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [selections, setSelections] = useState<PackSelection[]>(() =>
    recommendations.map((pack) => ({
      packId: packIdsBySlug[pack.slug] ?? "",
      slug: pack.slug,
      name: pack.name,
      summary: pack.summary,
      selectionStatus: initialSelections[pack.slug] ?? "",
    })),
  );

  const completeCount = useMemo(
    () => selections.filter((row) => row.selectionStatus).length,
    [selections],
  );

  const ready = useMemo(
    () =>
      selections.length >= 3 &&
      completeCount === selections.length &&
      (!requireDisclaimer || acknowledged),
    [selections.length, completeCount, requireDisclaimer, acknowledged],
  );

  function updateStatus(slug: string, status: GuidanceSelectionStatus) {
    setSelections((current) => {
      const next = current.map((row) =>
        row.slug === slug ? { ...row, selectionStatus: status } : row,
      );
      onChange?.(next);
      return next;
    });
  }

  useEffect(() => {
    onReadyChange?.(ready);
  }, [ready, onReadyChange]);

  return (
    <div className="space-y-6" data-testid="guidance-selection-panel">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Select guidance areas
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Choose how your organisation relates to each recommended pack. This
          records alignment posture — not certification.
        </p>
      </div>

      <div className="grid gap-4">
        {selections.map((pack) => (
          <article
            key={pack.slug}
            className="rounded-lg border border-border p-4"
            data-testid="guidance-pack-card"
          >
            <h3 className="font-medium text-slate-950">{pack.name}</h3>
            <p className="mt-1 text-sm text-text-muted">{pack.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(GUIDANCE_SELECTION_LABELS) as GuidanceSelectionStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    data-testid={`guidance-selection-${pack.slug}-${status}`}
                    onClick={() => updateStatus(pack.slug, status)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      pack.selectionStatus === status
                        ? "bg-brand-teal text-white"
                        : "border border-border bg-white text-slate-700 hover:border-brand-teal"
                    }`}
                  >
                    {GUIDANCE_SELECTION_LABELS[status]}
                  </button>
                ),
              )}
            </div>
          </article>
        ))}
      </div>

      {requireDisclaimer ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <LegalDisclaimer compact />
          <label className="mt-4 flex items-start gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              data-testid="guidance-disclaimer-ack"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-1"
            />
            <span>I understand Aquilens provides guidance and alignment support only.</span>
          </label>
        </div>
      ) : null}

      <p className="text-xs text-text-muted">
        {completeCount} of {selections.length} packs have a selection recorded.
        {requireDisclaimer && !acknowledged
          ? " Acknowledge the disclaimer to continue."
          : null}
      </p>

      <input
        type="hidden"
        data-testid="guidance-selection-ready"
        value={
          completeCount === selections.length &&
          selections.length > 0 &&
          (!requireDisclaimer || acknowledged)
            ? "ready"
            : ""
        }
        readOnly
      />
    </div>
  );
}

export type { PackSelection };
