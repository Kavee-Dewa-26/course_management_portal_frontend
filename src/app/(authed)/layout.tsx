"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { MEMBER_NAV } from "@/components/layout/RoleNav";
import { useSessionUser } from "@/application/hooks/useSessionUser";

const TITLE_MAP: Array<{ test: RegExp; title: string }> = [
  { test: /^\/home/, title: "Home" },
  { test: /^\/school/, title: "Bible School" },
  { test: /^\/apply\/student\/pending/, title: "Application Submitted" },
  { test: /^\/apply\/student/, title: "Apply to Become a Student" },
  { test: /^\/my-requests/, title: "My Requests" },
  { test: /^\/my-cells\/[^/]+/, title: "Cell" },
  { test: /^\/my-cells/, title: "My Cells" },
];

/**
 * Member-section shell — the "home base" for every signed-in user, regardless
 * of which elevated roles they hold. When a G12 / Leader / Student / Admin
 * clicks "Home" from their own role's sidebar, they land here and see the
 * **Member sidebar** + module tiles for cross-module navigation. From here
 * they can dive into Bible School (→ /dashboard or /apply/student) or Cell
 * Groups (→ /cells if leader/g12, else /my-cells).
 *
 * Their role-scoped surfaces ((leader)/, (g12)/, admin/, super-admin/, etc.)
 * keep their own layouts and sidebars — this is purely the cross-module hub.
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
