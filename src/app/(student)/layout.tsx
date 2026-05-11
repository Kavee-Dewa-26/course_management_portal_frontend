"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { STUDENT_NAV } from "@/components/layout/RoleNav";
import { STUDENT_NOTIFS } from "@/lib/mock/notifications";
import { STUDENT } from "@/lib/mock/users";

const TITLE_MAP: Array<{ test: RegExp; title: string }> = [
  { test: /^\/dashboard/, title: "Dashboard" },
  { test: /^\/my-courses\/[^/]+\/[^/]+/, title: "Lesson" },
  { test: /^\/my-courses\/[^/]+/, title: "Course" },
  { test: /^\/my-courses/, title: "My Courses" },
  { test: /^\/browse-courses\/[^/]+/, title: "Course Details" },
  { test: /^\/browse-courses/, title: "Browse Courses" },
  { test: /^\/profile/, title: "Profile" },
  { test: /^\/notifications/, title: "Notifications" },
  { test: /^\/help/, title: "Help & Support" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const title = TITLE_MAP.find((m) => m.test.test(pathname))?.title ?? "Student";
  return (
    <AppShell
      navItems={STUDENT_NAV}
      user={STUDENT}
      roleLabel="Student"
      title={title}
      notifications={STUDENT_NOTIFS}
      dashboardHref="/dashboard"
    >
      {children}
    </AppShell>
  );
}
