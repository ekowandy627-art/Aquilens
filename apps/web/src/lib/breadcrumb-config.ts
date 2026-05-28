import { navLabelBySegment } from "@/lib/navigation";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  ...Object.fromEntries(navLabelBySegment.entries()),
  profile: "Profile",
  new: "New",
  edit: "Edit",
  generate: "Generate",
  review: "Review",
  manual: "Manual",
  organisation: "Organisation",
  structure: "Structure",
  users: "Users",
  invite: "Invite",
  roles: "Roles",
  "access-reviews": "Access reviews",
  data: "Data",
  escalation: "Escalation",
  "guest-access": "Guest access",
  onboarding: "Onboarding",
};

const RESOURCE_PARENT_SEGMENTS = new Set([
  "processes",
  "workflows",
  "approvals",
  "agents",
  "audit-packs",
  "notifications",
]);

function looksLikeOpaqueId(segment: string) {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      segment,
    ) || /^[0-9a-z]{16,}$/i.test(segment)
  );
}

function titleCaseSegment(segment: string, previousSegment?: string) {
  if (previousSegment && RESOURCE_PARENT_SEGMENTS.has(previousSegment)) {
    return "Detail";
  }
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }
  if (/^AI-\d+$/i.test(segment)) {
    return segment.toUpperCase();
  }
  if (/^proc-|^workflow-|^approval-/.test(segment)) {
    return "Detail";
  }
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function resolveBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/dashboard" }];
  }

  const crumbs: BreadcrumbItem[] = [];
  let path = "";

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!;
    path += `/${segment}`;
    const isLast = index === segments.length - 1;
    const previousSegment = index > 0 ? segments[index - 1] : undefined;
    const label =
      isLast && looksLikeOpaqueId(segment)
        ? "Detail"
        : titleCaseSegment(segment, previousSegment);

    crumbs.push({
      label,
      href: isLast ? undefined : path,
    });
  }

  return crumbs;
}

export function shouldShowBreadcrumbs(pathname: string) {
  const depth = pathname.split("/").filter(Boolean).length;
  return depth >= 2;
}
