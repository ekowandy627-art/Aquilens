"use client";

import { useAutosaveIndicator } from "@/lib/use-autosave-indicator";

type AutosaveIndicatorProps = {
  lastSavedAt: Date | null;
  className?: string;
};

export function AutosaveIndicator({
  lastSavedAt,
  className = "text-xs text-text-muted",
}: AutosaveIndicatorProps) {
  const resetKey = lastSavedAt ? String(lastSavedAt.getTime()) : "none";
  return (
    <AutosaveLabel
      key={resetKey}
      lastSavedAt={lastSavedAt}
      className={className}
    />
  );
}

function AutosaveLabel({
  lastSavedAt,
  className,
}: AutosaveIndicatorProps) {
  const label = useAutosaveIndicator(lastSavedAt);
  return <span className={className}>{label}</span>;
}
