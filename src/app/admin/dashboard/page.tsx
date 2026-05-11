"use client";

import { useRouter } from "next/navigation";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface KPI {
  ico: string;
  label: string;
  num: string;
  trend: string;
  warn?: boolean;
  to?: string;
}

const KPIS: KPI[] = [
  { ico: "user-plus", label: "Pending Registrations", num: "8", trend: "3 new today", warn: true, to: "/admin/registrations" },
  { ico: "clipboard-list", label: "Pending Enrollments", num: "6", trend: "2 new today", warn: true, to: "/admin/enrollments" },
  { ico: "users", label: "Total Students", num: "3,248", trend: "+12% this month" },
  { ico: "trending-up", label: "Course Completion", num: "68%", trend: "+4 pts vs last month" },
];

const QUEUES = [
  { ico: "user-plus", title: "Registrations queue", body: "Approve sign-ups before students gain access to the platform.", count: 8, to: "/admin/registrations" },
  { ico: "clipboard-list", title: "Enrollments queue", body: "Approve course-access requests from existing students.", count: 6, to: "/admin/enrollments" },
];

const ACTIVITY: Array<{ ico: string; tone?: "s" | "w"; title: string; meta: string; when: string }> = [
  { ico: "user-plus", tone: "s", title: "Anjali Silva submitted a sign-up request", meta: "Awaiting registration approval", when: "2 min ago" },
  { ico: "clipboard-list", tone: "s", title: "Ravi Tilakaratne requested Modern Backend Engineering", meta: "Awaiting enrollment approval", when: "8 min ago" },
  { ico: "check-circle", tone: "s", title: "Course \"SQL for Analytics\" published", meta: "by Tania F. (instructor)", when: "1 h ago" },
  { ico: "alert-triangle", tone: "w", title: "3 lessons in \"Applied Machine Learning\" missing labs", meta: "Tania F. flagged for review", when: "3 h ago" },
  { ico: "edit-3", title: "Modern Backend Engineering · Module 2 reordered", meta: "by Admin", when: "2 d ago" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Operations overview</h1>
          <div className="greeting">Last 30 days · across all published courses.</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" icon="calendar">
            This month
          </Button>
          <Button icon="plus" onClick={() => router.push("/admin/courses/new")}>
            New course
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
        <h3>Approval queues</h3>
      </div>
      <div className="queue-grid">
        {QUEUES.map((q) => (
          <div className="queue-card" key={q.title} onClick={() => router.push(q.to)}>
            <div className="queue-ico">
              <Icon name={q.ico} size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <h3>{q.title}</h3>
              <p>{q.body}</p>
            </div>
            <div className="queue-count">
              <b>{q.count}</b>
              <span>pending</span>
            </div>
            <Icon name="arrow-right" size={18} style={{ color: "#41574A" }} />
          </div>
        ))}
      </div>

      <div className="section-h">
        <h3>Recent activity</h3>
        <ArrowLink href="/admin/audit-log">View audit log</ArrowLink>
      </div>
      <div className="activity">
        {ACTIVITY.map((a, i) => (
          <div className="row" key={i}>
            <div className={"ico" + (a.tone ? " " + a.tone : "")}>
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
