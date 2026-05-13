"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Toaster } from "@/components/ui/Toaster";
import type { NavItem } from "./RoleNav";
import type { NotificationItem } from "@/lib/mock/notifications";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { clearSession } from "@/application/slices/sessionSlice";
import { auth } from "@/infrastructure/firebase/auth";
import { apiRequest } from "@/infrastructure/api/request";

interface Props {
  navItems: NavItem[];
  user: { name: string; avatar?: string };
  roleLabel: string;
  title: string;
  notifications: NotificationItem[];
  dashboardHref: string;
  rightExtras?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  navItems,
  user,
  roleLabel,
  title,
  notifications,
  dashboardHref,
  rightExtras,
  children,
}: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const onLogout = async () => {
    try {
      // Best-effort revoke refresh tokens server-side; ignore failure.
      await apiRequest("/auth/logout", { method: "POST" }).catch(() => null);
    } finally {
      await signOut(auth).catch(() => null);
      dispatch(clearSession());
      dispatch(pushToast({ tone: "success", title: "Signed out" }));
      router.push("/login");
    }
  };

  const onNotificationClick = (n: NotificationItem) => {
    if (n.link) router.push(n.link);
  };

  return (
    <div className="shell">
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar
        navItems={navItems}
        user={user}
        roleLabel={roleLabel}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="shell-main">
        <TopNav
          title={title}
          user={user}
          roleLabel={roleLabel}
          notifications={notifications}
          dashboardHref={dashboardHref}
          onLogout={onLogout}
          onNotificationClick={onNotificationClick}
          rightExtras={rightExtras}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />
        <div className="shell-scroll">{children}</div>
        <footer className="shell-footer">
          <div className="shell-footer-inner">
            <span className="shell-footer-brand">
              <span className="dot" />© 2026 EduPath
            </span>
            <span className="shell-footer-version">v0.1.0</span>
          </div>
        </footer>
      </main>
      <Toaster />
    </div>
  );
}
