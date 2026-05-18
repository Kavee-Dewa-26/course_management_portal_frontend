"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import type { Role } from "@/application/slices/sessionSlice";

interface Props {
  /** One or more roles permitted to view this layout. */
  allowedRoles: Role[];
  children: React.ReactNode;
}

/**
 * Role-based route guard.
 *
 * Three states:
 *  1. Firebase auth state is resolving → show fullscreen loading
 *  2. Not signed in → redirect to /login
 *  3. Wrong ACTIVE role → redirect to their active role's home
 *  4. Signed in with correct active role → render children
 *
 * Dual-role users (e.g. promoted students with roles ['student','admin']) are
 * gated by their currently-selected `activeRole`, not all assigned roles, so
 * the UI stays scoped to one role at a time. They can swap via the user menu.
 */
export function AuthGuard({ allowedRoles, children }: Props) {
  const router = useRouter();
  const { user, activeRole, authResolving } = useAppSelector((s) => s.session);

  const hasAccess = useMemo(() => {
    if (!user) return false;
    if (user.status !== "approved") return false;
    // Dev/demo bypass — users signed in via DevLoginPanel (uid prefix `dev-`)
    // can navigate every guarded route regardless of their mock roles, so the
    // demo can showcase Member → Leader → G12 → Admin surfaces without
    // resigning. Real users (Firebase uids never start with `dev-`) are
    // unaffected.
    if (user.uid?.startsWith("dev-")) return true;
    const effective = (activeRole ?? user.role) as Role;
    return allowedRoles.includes(effective);
  }, [user, activeRole, allowedRoles]);

  useEffect(() => {
    if (authResolving) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!hasAccess) {
      // User is authenticated but is currently in a different role view.
      // Send them to their active role's home (instead of a confusing /login).
      const effective = (activeRole ?? user.role) as Role;
      const home =
        effective === "super_admin" ? "/super-admin/dashboard"
        : effective === "admin"     ? "/admin/dashboard"
        :                              "/dashboard";
      router.replace(home);
    }
  }, [authResolving, user, activeRole, hasAccess, router]);

  if (authResolving || !user || !hasAccess) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--color-page-bg)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid rgba(188,233,85,0.25)",
            borderTopColor: "#BCE955",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
          aria-label="Loading"
        />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
