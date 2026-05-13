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
 *  2. Not signed in / wrong role → redirect to /login
 *  3. Signed in with correct role → render children
 *
 * Dual-role users (e.g. promoted students with roles ['student','admin'])
 * pass if ANY of their roles overlap with allowedRoles.
 */
export function AuthGuard({ allowedRoles, children }: Props) {
  const router = useRouter();
  const { user, authResolving } = useAppSelector((s) => s.session);

  const hasAccess = useMemo(() => {
    if (!user) return false;
    if (user.status !== "approved") return false;
    const userRoles = user.roles?.length ? user.roles : [user.role];
    return userRoles.some((r) => allowedRoles.includes(r as Role));
  }, [user, allowedRoles]);

  useEffect(() => {
    if (authResolving) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!hasAccess) {
      // Wrong role — bounce them to login (a safer default than guessing their home).
      router.replace("/login");
    }
  }, [authResolving, user, hasAccess, router]);

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
