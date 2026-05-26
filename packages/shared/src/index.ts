export type AppRoute =
  | "/dashboard"
  | "/processes"
  | "/workflows"
  | "/agents"
  | "/audit"
  | "/settings";

export type EmptyStateConfig = {
  title: string;
  description: string;
  actionLabel?: string;
};
