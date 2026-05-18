"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { LEADER_NAV } from "@/components/layout/RoleNav";
import { useSessionUser } from "@/application/hooks/useSessionUser";

const TITLE_MAP: Array<{ test: RegExp; title: string }> = [
  { test: /^\/leader\/dashboard/, title: "Leader Dashboard" },
  { test: /^\/leader\/analytics/, title: "Analytics" },
  { test: /^\/cells\/new/, title: "New Cell" },
  { test: /^\/cells\/[^/]+\/reports\/new/, title: "Cell Report" },
  { test: /^\/cells\/[^/]+\/reports\/[^/]+/, title: "Report" },
  { test: /^\/cells\/[^/]+\/edit/, title: "Edit Cell" },
  { test: /^\/cells\/[^/]+\/members/, title: "Cell Members" },
  { test: /^\/cells\/[^/]+/, title: "Cell" },
  { test: /^\/cells/, title: "My Cells" },
];

/**
 * Leader shell — also accessible to G12 (super-set), Admin, Super Admin so they
 * can review cell surfaces. Admin doesn't typically hold `leader` role in real
 * data, so this is rarely entered by them in practice.
 */
export default function LeaderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const title = TITLE_MAP.find((m) => m.test.test(pathname))?.title ?? "Cell Groups";
  const user = useSessionUser();

  return (
    <AuthGuard allowedRoles={["leader", "g12", "admin", "super_admin"]}>
      <AppShell
        navItems={LEADER_NAV}
        user={user}
        roleLabel="Leader"
        title={title}
        dashboardHref="/leader/dashboard"
      >
        {children}
      </AppShell>
    </AuthGuard>
  );
}
