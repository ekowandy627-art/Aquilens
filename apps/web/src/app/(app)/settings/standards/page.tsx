"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { GuidanceSelectionPanel } from "@/components/guidance/guidance-selection-panel";
import {
  getGuidanceRecommendations,
  listGuidancePacks,
  listGuidanceSelections,
  saveGuidanceSelections,
  type GuidanceRecommendation,
  type TenantGuidanceSelection,
} from "@/lib/guidance";
import { loadTenantProfileFromApi } from "@/lib/tenant-storage";
import type { GuidanceSelectionStatus } from "@aquilens/shared";

export default function StandardsSettingsPage() {
  const [recommendations, setRecommendations] = useState<GuidanceRecommendation[]>(
    [],
  );
  const [packIdsBySlug, setPackIdsBySlug] = useState<Record<string, string>>({});
  const [initialSelections, setInitialSelections] = useState<
    Record<string, GuidanceSelectionStatus>
  >({});
  const [pendingSelections, setPendingSelections] = useState<
    Array<{ packId: string; selectionStatus: GuidanceSelectionStatus }>
  >([]);
  const [saved, setSaved] = useState<TenantGuidanceSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterSector, setFilterSector] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const profile = await loadTenantProfileFromApi();
        const [packs, recs, selections] = await Promise.all([
          listGuidancePacks(
            filterSector ? { sector: filterSector } : undefined,
          ),
          getGuidanceRecommendations({
            organisationType: profile.institutionType,
            country: profile.country,
          }),
          listGuidanceSelections(),
        ]);

        if (cancelled) {
          return;
        }

        const slugToId = Object.fromEntries(packs.map((pack) => [pack.slug, pack.id]));
        const bySlug: Record<string, GuidanceSelectionStatus> = {};
        for (const row of selections) {
          if (row.packSlug) {
            bySlug[row.packSlug] = row.selectionStatus;
          }
        }

        setPackIdsBySlug(slugToId);
        setRecommendations(recs);
        setInitialSelections(bySlug);
        setSaved(selections);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load standards settings",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [filterSector]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const rows = await saveGuidanceSelections(pendingSelections);
      setSaved(rows);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Standards & guidance"
        description="Manage which guidance packs your organisation aligns to. Selections inform recommendations and future alignment dashboards."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Filter by sector</span>
          <select
            data-testid="guidance-sector-filter"
            value={filterSector}
            onChange={(event) => {
              setLoading(true);
              setFilterSector(event.target.value);
            }}
            className="mt-1 h-10 rounded-md border border-border bg-white px-3"
          >
            <option value="">All sectors</option>
            <option value="education">Education</option>
            <option value="healthcare">Healthcare</option>
            <option value="UK">UK jurisdiction</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-text-muted">Loading guidance packs…</p>
      ) : (
        <div className="space-y-6">
          <GuidanceSelectionPanel
            recommendations={recommendations}
            packIdsBySlug={packIdsBySlug}
            initialSelections={initialSelections}
            requireDisclaimer={false}
            onChange={(rows) =>
              setPendingSelections(
                rows
                  .filter((row) => row.selectionStatus && row.packId)
                  .map((row) => ({
                    packId: row.packId,
                    selectionStatus: row.selectionStatus as GuidanceSelectionStatus,
                  })),
              )
            }
          />

          <div className="flex items-center gap-3">
            <PrimaryButton
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || pendingSelections.length === 0}
              data-testid="save-guidance-selections"
            >
              {saving ? "Saving…" : "Save selections"}
            </PrimaryButton>
            {saved.length > 0 ? (
              <span className="text-sm text-text-muted">
                {saved.length} selection(s) on file
              </span>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
