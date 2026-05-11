"use client";

import { useRouter } from "next/navigation";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ADMINS_SEED } from "@/lib/mock/admins";
import { avatarUrl } from "@/lib/kit";

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

const AUDIT = [
  { ico: "user-check", title: "Tania Fernando approved 4 registrations", meta: "Bulk action · queue cleared", when: "1 h ago" },
  { ico: "user-plus", title: "Sahan Wijeratne invited as Content Admin", meta: "by Tania F. · awaiting acceptance", when: "3 h ago" },
  { ico: "settings", title: "Brand colors updated", meta: "by Janaka L.", when: "Yesterday" },
  { ico: "lock", title: "MFA required policy enabled", meta: "by Super Admin", when: "2 d ago" },
];

export default function SuperAdminDashboardPage() {
  const router = useRouter();
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
        {AUDIT.map((a, i) => (
          <div className="row" key={i}>
            <div className="ico">
              <Icon name={a.ico} size={16} />
            </div>
            <div className="body">
              <div className="title">{a.title}</div>
              <div className="meta">{a.meta}</div>
            </div>
            <span className="when">{a.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
