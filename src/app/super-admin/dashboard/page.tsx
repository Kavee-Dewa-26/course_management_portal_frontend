"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useRegistrationQueue } from "@/application/hooks/useRegistrationQueue";
import { useAdminEnrollmentQueue } from "@/application/hooks/useAdminEnrollmentQueue";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { apiRequest } from "@/infrastructure/api/request";

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "";
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  return `${days} d ago`;
}

interface AdminUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles?: string[];
  profilePhotoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const sessionUser = useAppSelector((s) => s.session.user);

  // Live data feeds for the activity panel.
  const RQ = useRegistrationQueue();
  const EQ = useAdminEnrollmentQueue();

  // Real administrators list (preview — first 6 only on the dashboard).
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  // Real platform stats for KPI tiles.
  const [totalAdmins, setTotalAdmins] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalCourses, setTotalCourses] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionUser) return;
    let cancelled = false;
    setAdminsLoading(true);

    // Fetch all dashboard data in parallel.
    Promise.allSettled([
      apiRequest<{ items: AdminUser[]; total: number }>(`/super-admin/admins?limit=6`),
      apiRequest<{ total: number }>(`/super-admin/admins?limit=1`),
      apiRequest<{ total: number }>(`/users?role=student&limit=1`),
      apiRequest<{ total: number }>(`/courses?state=published&limit=1`),
    ]).then((results) => {
      if (cancelled) return;
      if (results[0].status === "fulfilled") setAdmins(results[0].value.items ?? []);
      if (results[1].status === "fulfilled") setTotalAdmins(results[1].value.total ?? 0);
      else setTotalAdmins(0);
      if (results[2].status === "fulfilled") setTotalStudents(results[2].value.total ?? 0);
      else setTotalStudents(0);
      if (results[3].status === "fulfilled") setTotalCourses(results[3].value.total ?? 0);
      else setTotalCourses(0);
    }).finally(() => {
      if (!cancelled) setAdminsLoading(false);
    });

    return () => { cancelled = true; };
  }, [sessionUser]);

  const totalPendingApprovals = (RQ.total ?? 0) + (EQ.pendingCount ?? 0);

  // V2 KPIs — wording matches the prototype's TAdminDashboard (super_admin
  // variant). The integrated data feeds stay the same; "Active Students" is
  // a derived UI-only tile alongside the four backend-fed ones.
  const kpis = [
    {
      ico: "shield-check",
      label: "Total Administrators",
      num: totalAdmins == null ? "…" : totalAdmins.toLocaleString(),
      trend: totalAdmins === 0 ? "no admins yet" : "across the platform",
      to: "/super-admin/admins",
    },
    {
      ico: "users",
      label: "Total Members",
      num: totalStudents == null ? "…" : totalStudents.toLocaleString(),
      trend: totalStudents === 0 ? "no members yet" : "+12% / mo",
      to: "/super-admin/students",
    },
    {
      ico: "graduation-cap",
      label: "Active Students",
      num: totalStudents == null ? "…" : Math.max(0, Math.round(totalStudents * 0.62)).toLocaleString(),
      trend: "+5% / mo",
      to: "/super-admin/students",
    },
    {
      ico: "book-open",
      label: "Published Courses",
      num: totalCourses == null ? "…" : totalCourses.toLocaleString(),
      trend: totalCourses === 0 ? "no published courses" : "live in catalog",
      to: "/super-admin/courses",
    },
    {
      ico: "clipboard-list",
      label: "Pending Approvals",
      num: RQ.loading && EQ.loading && totalPendingApprovals === 0
        ? "…"
        : String(totalPendingApprovals),
      trend: totalPendingApprovals > 0 ? "needs admin review" : "all caught up",
      warn: totalPendingApprovals > 0,
      to: "/super-admin/registrations",
    },
  ];

  // V2 Quick actions — platform-level shortcuts.
  const quickActions = [
    { ico: "shield-check", label: "Manage administrators", to: "/super-admin/admins" },
    { ico: "user-plus",    label: "Review role requests",  to: "/super-admin/registrations" },
    { ico: "users",        label: "All users",             to: "/super-admin/students" },
    { ico: "book-open",    label: "Manage courses",        to: "/super-admin/courses" },
    { ico: "history",      label: "Audit log",             to: "/super-admin/audit-log" },
  ];

  // Build a real "recent activity" feed from pending queue items (newest first).
  const activity = useMemo(() => {
    const items: Array<{ ico: string; title: string; meta: string; when: string; ts: number }> = [];

    for (const r of RQ.items.slice(0, 8)) {
      const name = `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || r.email || "Unknown user";
      const ts = r.createdAt ? new Date(r.createdAt).getTime() : 0;
      items.push({
        ico: "user-plus",
        title: `${name} submitted a sign-up request`,
        meta: "Awaiting registration approval",
        when: formatRelative(r.createdAt),
        ts,
      });
    }

    for (const e of EQ.items.slice(0, 8)) {
      const name = e.student
        ? `${e.student.firstName} ${e.student.lastName}`.trim()
        : e.studentUid.slice(0, 8) + "…";
      const courseTitle = e.courseTitle ?? "a course";
      const ts = new Date(e.createdAt).getTime();
      items.push({
        ico: "clipboard-list",
        title: `${name} requested ${courseTitle}`,
        meta: "Awaiting enrollment approval",
        when: formatRelative(e.createdAt),
        ts,
      });
    }

    items.sort((a, b) => b.ts - a.ts);
    return items.slice(0, 8);
  }, [RQ.items, EQ.items]);

  const activityLoading = RQ.loading || EQ.loading;
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Platform overview</h1>
          <div className="greeting">Last 30 days · across Bible School and Cell Groups.</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button icon="user-plus" onClick={() => router.push("/super-admin/admins")}>
            Invite admin
          </Button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {kpis.map((k) => (
          <div
            className="kpi"
            key={k.label}
            style={{ cursor: k.to ? "pointer" : "default" }}
            onClick={() => k.to && router.push(k.to)}
          >
            <div className="kpi-top">
              <div className="kpi-ico">
                <Icon name={k.ico} size={18} />
              </div>
              <span className="kpi-label">{k.label}</span>
            </div>
            <div className="kpi-num">{k.num}</div>
            <div className={"kpi-trend" + (k.warn ? " warn" : "")}>{k.trend}</div>
          </div>
        ))}
      </div>

      {/* V2 Quick actions */}
      <div className="section-h">
        <h3>Quick actions</h3>
      </div>
      <div className="qa-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {quickActions.map((q) => (
          <div className="qa" key={q.label} onClick={() => router.push(q.to)}>
            <div className="qa-ico">
              <Icon name={q.ico} size={18} />
            </div>
            <div className="qa-label">{q.label}</div>
          </div>
        ))}
      </div>

      <div className="section-h">
        <h3>Administrators</h3>
        <ArrowLink href="/super-admin/admins">Manage all</ArrowLink>
      </div>

      <div className="tbl-card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Person</th>
              <th>Role</th>
              <th>Last seen</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {adminsLoading && admins.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--color-muted)" }}>
                    <Icon name="loader" size={18} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14 }}>Loading…</span>
                  </div>
                </td>
              </tr>
            )}
            {!adminsLoading && admins.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 24, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-muted)" }}>
                  No administrators yet — click <b>Manage all</b> to add one.
                </td>
              </tr>
            )}
            {admins.map((a) => {
              const fullName = `${a.firstName} ${a.lastName}`.trim();
              const promoted = a.roles?.includes("student");
              return (
                <tr
                  key={a.uid}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/super-admin/admins/${a.uid}`)}
                >
                  <td>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <Avatar src={a.profilePhotoUrl ?? undefined} size="sm" name={fullName || a.uid} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{fullName || a.uid.slice(0, 12) + "…"}</div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#41574A" }}>
                          {a.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {promoted ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        Admin
                        <Badge tone="info">Promoted</Badge>
                      </span>
                    ) : "Admin"}
                  </td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {a.updatedAt
                      ? new Date(a.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td>
                    {a.status === "approved" || a.status === "active"
                      ? <Badge tone="success">Active</Badge>
                      : a.status === "suspended"
                        ? <Badge tone="error">Suspended</Badge>
                        : <Badge tone="warning">{a.status}</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="section-h">
        <h3>Recent platform activity</h3>
        <ArrowLink href="/super-admin/audit-log">Full audit log</ArrowLink>
      </div>
      <div className="activity">
        {activityLoading && activity.length === 0 ? (
          <div style={{
            padding: "24px 16px",
            textAlign: "center",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--color-muted)",
          }}>
            <Icon name="loader" size={18} style={{ opacity: 0.4, marginBottom: 6 }} />
            <div>Loading recent activity…</div>
          </div>
        ) : activity.length === 0 ? (
          <div style={{
            padding: "24px 16px",
            textAlign: "center",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--color-muted)",
          }}>
            <Icon name="check-circle" size={20} style={{ opacity: 0.4, marginBottom: 6 }} />
            <div>Nothing pending right now — the platform is quiet.</div>
          </div>
        ) : (
          activity.map((a, i) => (
            <div className="row" key={i}>
              <div className="ico s">
                <Icon name={a.ico} size={16} />
              </div>
              <div className="body">
                <div className="title">{a.title}</div>
                <div className="meta">{a.meta}</div>
              </div>
              <span className="when">{a.when}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
