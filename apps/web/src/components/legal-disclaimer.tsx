import { LEGAL_DISCLAIMER } from "@aquilens/shared";

type LegalDisclaimerProps = {
  className?: string;
  compact?: boolean;
};

export function LegalDisclaimer({ className = "", compact = false }: LegalDisclaimerProps) {
  return (
    <aside
      className={`rounded-md border border-border bg-surface-bg p-4 text-sm leading-6 text-text-muted ${className}`}
      data-testid="legal-disclaimer"
      role="note"
      aria-label="Legal disclaimer"
    >
      {compact ? (
        <p>{LEGAL_DISCLAIMER}</p>
      ) : (
        <>
          <p className="font-medium text-slate-800">Important</p>
          <p className="mt-2">{LEGAL_DISCLAIMER}</p>
        </>
      )}
    </aside>
  );
}
