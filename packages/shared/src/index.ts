export type AppRoute =
  | "/dashboard"
  | "/processes"
  | "/workflows"
  | "/agents"
  | "/audit"
  | "/audit-packs"
  | "/settings";

export type EmptyStateConfig = {
  title: string;
  description: string;
  actionLabel?: string;
};
