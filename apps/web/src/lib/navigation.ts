import {
  Bot,
  ClipboardList,
  FileText,
  Gauge,
  ListChecks,
  ScrollText,
  Settings,
  Stamp,
} from "lucide-react";

export const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Gauge,
  },
  {
    label: "Processes",
    href: "/processes",
    icon: ClipboardList,
  },
  {
    label: "Approvals",
    href: "/approvals",
    icon: Stamp,
  },
  {
    label: "My Tasks",
    href: "/my-tasks",
    icon: ListChecks,
  },
  {
    label: "Workflows",
    href: "/workflows",
    icon: ListChecks,
  },
  {
    label: "Agents",
    href: "/agents",
    icon: Bot,
  },
  {
    label: "Audit",
    href: "/audit",
    icon: ScrollText,
  },
  {
    label: "Audit Packs",
    href: "/audit-packs",
    icon: FileText,
  },
] as const;

export const settingsNavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
} as const;

export const navLabelBySegment = new Map(
  [...navItems, settingsNavItem].map((item) => [
    item.href.replace(/^\//, ""),
    item.label,
  ]),
);

export function visibleNavItems(roleNames: string[]) {
  const isStaffOnly =
    roleNames.includes("Staff") &&
    !roleNames.some((role) =>
      ["Super Admin", "Department Head", "Process Owner", "Compliance Officer"].includes(
        role,
      ),
    );

  if (isStaffOnly) {
    return navItems.filter((item) => item.href === "/dashboard");
  }

  return [...navItems];
}

export function titleFromPathname(pathname: string) {
  if (pathname === "/onboarding") {
    return "Onboarding";
  }

  if (pathname === "/403") {
    return "Access denied";
  }

  if (pathname.startsWith("/notifications")) {
    return "Notifications";
  }

  const active = [...navItems, settingsNavItem].find((item) =>
    pathname.startsWith(item.href),
  );

  return active?.label ?? "Not found";
}
