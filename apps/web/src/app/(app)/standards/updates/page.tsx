"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { WallNotice } from "@/components/wall-notice";
import { apiFetch } from "@/lib/api-client";
import type { PlatformWallError } from "@/lib/platform-wall";
import { PlatformWallErrorException } from "@/lib/sop-compose";

type StandardsUpdate = {
  familyId: string;
  packName: string;
  pinnedVersion: number;
  latestVersion: number;
  changelog: string | null;
};

type GapAnalysis = {
  id: string;
  status: string;
  results: {
    diff?: { added: unknown[]; removed: unknown[]; changed: unknown[] };
    aiNarrative?: { summary?: string };
  };
};

export default function StandardsUpdatesPage() {
  const [updates, setUpdates] = useState<StandardsUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [wall, setWall] = useState<PlatformWallError | null>(null);
  const [analysisByFamily, setAnalysisByFamily] = useState<
    Record<string, GapAnalysis>
  >({});
  const [runningFamily, setRunningFamily] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<StandardsUpdate[]>("/standards/updates");
      setUpdates(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAnalysis(familyId: string) {
    setRunningFamily(familyId);
    setWall(null);
    try {
      const data = await apiFetch<GapAnalysis>(
        `/standards/updates/${familyId}/gap-analysis`,
        { method: "POST" },
      );
      setAnalysisByFamily((current) => ({ ...current, [familyId]: data }));
    } catch (error) {
      if (error instanceof PlatformWallErrorException) {
        setWall(error.wall);
      } else {
        throw error;
      }
    } finally {
      setRunningFamily(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Standards updates"
        description="Review newly published guidance versions and run gap analysis before adopting changes."
      />

      {wall ? <WallNotice error={wall} onDismiss={() => setWall(null)} /> : null}

      {loading ? (
        <p className="text-sm text-text-muted">Loading updates…</p>
      ) : updates.length === 0 ? (
        <p className="text-sm text-text-muted">
          All selected standards packs are on the latest published version.
        </p>
      ) : (
        <ul className="space-y-4">
          {updates.map((update) => {
            const analysis = analysisByFamily[update.familyId];
            return (
              <li
                key={update.familyId}
                className="rounded-md border border-border bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-medium text-brand-navy">{update.packName}</h2>
                    <p className="mt-1 text-sm text-text-muted">
                      Pinned v{update.pinnedVersion} · Latest v{update.latestVersion}
                    </p>
                    {update.changelog ? (
                      <p className="mt-2 text-sm">{update.changelog}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={runningFamily === update.familyId}
                    onClick={() => void runAnalysis(update.familyId)}
                    className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {runningFamily === update.familyId
                      ? "Running…"
                      : "Run gap analysis"}
                  </button>
                </div>
                {analysis?.results?.aiNarrative?.summary ? (
                  <p className="mt-3 text-sm text-slate-700">
                    {analysis.results.aiNarrative.summary}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
