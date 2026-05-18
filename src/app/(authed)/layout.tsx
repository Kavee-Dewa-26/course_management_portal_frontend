"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  MEMBER_NAV,
  LEADER_NAV,
  G12_NAV,
  STUDENT_NAV,
  ADMIN_NAV,
  SUPERADMIN_NAV,
  type NavItem,
} from "@/components/layout/RoleNav";
import { useSessionUser } from "@/application/hooks/useSessionUser";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { DASHBOARD_BY_ROLE, type Role } from "@/application/slices/sessionSlice";

const TITLE_MAP: Array<{ test: RegExp; title: string }> = [
  { test: /^\/home/, title: "Home" },
  { test: /^\/school/, title: "Bible School" },
  { test: /^\/apply\/student\/pending/, title: "Application Submitted" },
  { test: /^\/apply\/student/, title: "Apply to Become a Student" },
  { test: /^\/my-requests/, title: "My Requests" },
  { test: /^\/my-cells\/[^/]+/, title: "Cell" },
  { test: /^\/my-cells/, title: "My Cells" },
];

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  member: MEMBER_NAV,
  student: STUDENT_NAV,
  leader: LEADER_NAV,
  g12: G12_NAV,
  admin: ADMIN_NAV,
  super_admin: SUPERADMIN_NAV,
};

const ROLE_LABEL: Record<Role, string> = {
  member: "Member",
  student: "Student",
  leader: "Leader",
  g12: "G12 Leader",
  admin: "Administrator",
  super_admin: "Super Admin",
};

/**
 * Universal shell for the V2 member-context surfaces (/home, /apply/student,
 * /my-requests, /my-cells, /school, etc.).
 *
 * The sidebar adapts to the user's `activeRole` — a G12 user clicking "Home"
 * keeps their G12 sidebar, a leader keeps theirs, a pure member sees
 * MEMBER_NAV. This stops the nav from flipping between layouts as users
 * move between role surfaces.
 */
export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const title = TITLE_MAP.find((m) => m.test.test(pathname))?.title ?? "TCCR";
  const user = useSessionUser();
  const activeRole = useAppSelector((s) => s.session.activeRole) ?? "member";

  const navItems = NAV_BY_ROLE[activeRole] ?? MEMBER_NAV;
  const roleLabel = ROLE_LABEL[activeRole] ?? "Member";
  const dashboardHref = DASHBOARD_BY_ROLE[activeRole] ?? "/home";

  return (
    <AuthGuard allowedRoles={["member", "student", "leader", "g12", "admin", "super_admin"]}>
      <AppShell
        navItems={navItems}
        user={user}
        roleLabel={roleLabel}
        title={title}
        dashboardHref={dashboardHref}
      >
        {children}
      </AppShell>
    </AuthGuard>
  );
}
