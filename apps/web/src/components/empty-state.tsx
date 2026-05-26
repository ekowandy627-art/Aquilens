import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-white px-6 text-center">
      <div className="grid size-12 place-items-center rounded-md bg-teal-50 text-brand-teal">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
        {description}
      </p>
      {actionLabel && (
        <button
          type="button"
          className="mt-5 h-9 rounded-md bg-brand-teal px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0b6665]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
