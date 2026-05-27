"use client";

export type GapItem = {
  field: string;
  severity: "required" | "recommended";
  message: string;
};

type GapPanelProps = {
  gaps: GapItem[];
};

export function GapPanel({ gaps }: GapPanelProps) {
  const required = gaps.filter((gap) => gap.severity === "required");
  const recommended = gaps.filter((gap) => gap.severity === "recommended");

  return (
    <aside className="rounded-lg border border-border bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-950">Gap review</h2>
      <p className="mt-1 text-xs text-text-muted">
        Required gaps must be resolved before saving as draft.
      </p>

      <div className="mt-4 space-y-3">
        {required.length === 0 && recommended.length === 0 ? (
          <div className="text-sm text-text-muted">No gaps flagged.</div>
        ) : null}

        {required.map((gap) => (
          <GapCard key={`${gap.field}-${gap.message}`} gap={gap} />
        ))}
        {recommended.map((gap) => (
          <GapCard key={`${gap.field}-${gap.message}`} gap={gap} />
        ))}
      </div>
    </aside>
  );
}

function GapCard({ gap }: { gap: GapItem }) {
  const isRequired = gap.severity === "required";

  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${
        isRequired
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-yellow-200 bg-yellow-50 text-yellow-900"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide">
        {isRequired ? "Required" : "Recommended"}
      </div>
      <div className="mt-1">{gap.message}</div>
    </div>
  );
}

export function hasBlockingGaps(gaps: GapItem[], resolvedFields: Set<string>) {
  return gaps.some(
    (gap) => gap.severity === "required" && !resolvedFields.has(gap.field),
  );
}

export function defaultResolvedFields() {
  return new Set<string>();
}

export function resolveGapField(field: string, resolvedFields: Set<string>) {
  const next = new Set(resolvedFields);
  next.add(field);
  if (field === "owner") {
    next.add("people.owner");
  }
  if (field.startsWith("risk")) {
    next.add("risk_rating");
  }
  return next;
}
