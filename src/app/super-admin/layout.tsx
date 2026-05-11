"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SUPERADMIN_NAV } from "@/components/layout/RoleNav";
import { SUPER_NOTIFS } from "@/lib/mock/notifications";
import { SUPERADMIN } from "@/lib/mock/users";

const TITLE_MAP: Array<{ test: RegExp; title: string }> = [
  { test: /^\/super-admin\/dashboard/, title: "Super Admin" },
  { test: /^\/super-admin\/admins\/new/, title: "Invite admin" },
  { test: /^\/super-admin\/admins\/[^/]+\/upgrade/, title: "Upgrade Admin" },
  { test: /^\/super-admin\/admins\/[^/]+/, title: "Administrator" },
  { test: /^\/super-admin\/admins/, title: "Administrators" },
  { test: /^\/super-admin\/students\/[^/]+\/upgrade/, title: "Upgrade Role" },
  { test: /^\/super-admin\/students\/[^/]+/, title: "Student" },
  { test: /^\/super-admin\/students/, title: "Students" },
  { test: /^\/super-admin\/registrations/, title: "Registrations" },
  { test: /^\/super-admin\/enrollments/, title: "Enrollments" },
  { test: /^\/super-admin\/courses/, title: "Courses" },
  { test: /^\/super-admin\/profile/, title: "Profile" },
  { test: /^\/super-admin\/audit-log/, title: "Audit Log" },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const title = TITLE_MAP.find((m) => m.test.test(pathname))?.title ?? "Super Admin";
  return (
    <AppShell
      navItems={SUPERADMIN_NAV}
      user={SUPERADMIN}
      roleLabel="Super Admin"
      title={title}
      notifications={SUPER_NOTIFS}
      dashboardHref="/super-admin/dashboard"
    >
      {children}
    </AppShell>
  );
}
