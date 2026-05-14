"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ADMINS_SEED } from "@/lib/mock/admins";
import { avatarUrl } from "@/lib/kit";
import { useRegistrationQueue } from "@/application/hooks/useRegistrationQueue";
import { useAdminEnrollmentQueue } from "@/application/hooks/useAdminEnrollmentQueue";

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

interface KPI {
  ico: string;
  label: string;
  num: string;
  trend: string;
  warn?: boolean;
  to?: string;
}

const KPIS: KPI[] = [
  { ico: "shield-check", label: "Active Administrators", num: "7", trend: "1 new this week" },
  { ico: "user-plus", label: "Pending Admin Invites", num: "2", trend: "Awaiting acceptance", warn: true, to: "/super-admin/admins" },
  { ico: "alert-octagon", label: "Failed Sign-ins (24h)", num: "12", trend: "2 from same IP", warn: true },
  { ico: "activity", label: "API Requests (24h)", num: "1.2M", trend: "Within plan limits" },
];

export default function SuperAdminDashboardPage() {
  const router = useRouter();

  // Live data feeds for the activity panel.
  const RQ = useRegistrationQueue();
  const EQ = useAdminEnrollmentQueue();

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
          <div className="greeting">
            You manage administrators, roles and global policy. Day-to-day approvals live with
            admins.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button icon="user-plus" onClick={() => router.push("/super-admin/admins")}>
            Invite admin
          </Button>
        </div>
      </div>

      <div className="kpi-grid">
        {KPIS.map((k) => (
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
            {ADMINS_SEED.map((a) => (
              <tr
                key={a.email}
                style={{ cursor: "pointer" }}
                onClick={() => router.push(`/super-admin/admins/${a.id}`)}
              >
                <td>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar src={avatarUrl(a.avatar)} size="sm" name={a.name} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{a.name}</div>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          color: "#41574A",
                        }}
                      >
                        {a.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{a.role}</td>
                <td className="muted">{a.last}</td>
                <td>
                  {a.status === "active" && <Badge tone="success">Active</Badge>}
                  {a.status === "invited" && <Badge tone="warning">Invited</Badge>}
                  {a.status === "suspended" && <Badge tone="error">Suspended</Badge>}
                </td>
              </tr>
            ))}
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
