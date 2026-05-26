import {
  Bot,
  ClipboardList,
  Gauge,
  ListChecks,
  ScrollText,
  Settings,
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
] as const;

export const settingsNavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
} as const;

export function titleFromPathname(pathname: string) {
  if (pathname === "/onboarding") {
    return "Onboarding";
  }

  if (pathname === "/403") {
    return "Access denied";
  }

  const active = [...navItems, settingsNavItem].find((item) =>
    pathname.startsWith(item.href),
  );

  return active?.label ?? "Not found";
}
