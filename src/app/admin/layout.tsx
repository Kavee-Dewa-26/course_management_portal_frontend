"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ADMIN_NAV } from "@/components/layout/RoleNav";
import { ADMIN_NOTIFS } from "@/lib/mock/notifications";
import { ADMIN } from "@/lib/mock/users";

const TITLE_MAP: Array<{ test: RegExp; title: string }> = [
  { test: /^\/admin\/dashboard/, title: "Admin Dashboard" },
  { test: /^\/admin\/registrations/, title: "Registrations" },
  { test: /^\/admin\/enrollments/, title: "Enrollments" },
  { test: /^\/admin\/courses\/new/, title: "New course" },
  { test: /^\/admin\/courses\/[^/]+\/publish/, title: "Publish course" },
  { test: /^\/admin\/courses\/[^/]+/, title: "Edit course" },
  { test: /^\/admin\/courses/, title: "Courses" },
  { test: /^\/admin\/students\/[^/]+/, title: "Student" },
  { test: /^\/admin\/students/, title: "Students" },
  { test: /^\/admin\/profile/, title: "Profile" },
  { test: /^\/admin\/notifications/, title: "Notifications" },
  { test: /^\/admin\/audit-log/, title: "Audit Log" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const title = TITLE_MAP.find((m) => m.test.test(pathname))?.title ?? "Admin";
  return (
    <AppShell
      navItems={ADMIN_NAV}
      user={ADMIN}
      roleLabel="Administrator"
      title={title}
      notifications={ADMIN_NOTIFS}
      dashboardHref="/admin/dashboard"
    >
      {children}
    </AppShell>
  );
}
