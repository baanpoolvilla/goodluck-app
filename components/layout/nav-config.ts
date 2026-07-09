import type { UserRole } from "@/lib/db/database.types";
import {
  LayoutDashboard,
  ListTodo,
  NotebookPen,
  GraduationCap,
  LayoutGrid,
  CalendarDays,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
  children?: { href: string; label: string }[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/reports", label: "Reports", icon: NotebookPen },
  { href: "/grades", label: "Grades", icon: GraduationCap },
  { href: "/calendar", label: "ปฏิทินวันลา", icon: CalendarDays },
  { href: "/hub", label: "App Hub", icon: LayoutGrid },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function visibleNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
