"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { MEMBER_NAV } from "@/components/layout/RoleNav";
import { useSessionUser } from "@/application/hooks/useSessionUser";

const TITLE_MAP: Array<{ test: RegExp; title: string }> = [
  { test: /^\/home/, title: "Home" },
  { test: /^\/apply\/student\/pending/, title: "Application Submitted" },
  { test: /^\/apply\/student/, title: "Apply to Become a Student" },
  { test: /^\/my-requests/, title: "My Requests" },
  { test: /^\/my-cells\/[^/]+/, title: "Cell" },
  { test: /^\/my-cells/, title: "My Cells" },
];

/**
 * Universal authenticated shell for V2 member-context surfaces.
 *
 * Hosts pages every signed-in user can hit regardless of whether they hold
 * `student`, `leader`, etc. — the Member home, role-request flow, my-cells
 * read-only view, and so on. Renders MEMBER_NAV so users without elevated
 * roles get a coherent navigation. Users who hold elevated roles can still
 * cross into the (student)/(admin)/(super-admin) layouts via the role-switcher
 * dropdown in the user menu.
 */
export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const title = TITLE_MAP.find((m) => m.test.test(pathname))?.title ?? "TCCR";
  const user = useSessionUser();

  return (
    <AuthGuard allowedRoles={["member", "student", "leader", "g12", "admin", "super_admin"]}>
      <AppShell
        navItems={MEMBER_NAV}
        user={user}
        roleLabel="Member"
        title={title}
        dashboardHref="/home"
      >
        {children}
      </AppShell>
    </AuthGuard>
  );
}
