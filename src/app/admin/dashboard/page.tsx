"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useRegistrationQueue } from "@/application/hooks/useRegistrationQueue";
import { useAdminEnrollmentQueue } from "@/application/hooks/useAdminEnrollmentQueue";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";

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

interface ListTotal { total: number }

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const base = pathname?.startsWith("/super-admin") ? "/super-admin" : "/admin";
  const sessionUser = useAppSelector((s) => s.session.user);

  const RQ = useRegistrationQueue();
  const EQ = useAdminEnrollmentQueue();

  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalCourses, setTotalCourses] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionUser) return;
    let cancelled = false;
    (async () => {
      // Fetch totals in parallel (limit=1 is enough — we only read `total`).
      const [studentsRes, coursesRes] = await Promise.allSettled([
        apiRequest<ListTotal>(`/users?role=student&limit=1`),
        apiRequest<ListTotal>(`/courses?state=published&limit=1`),
      ]);
      if (cancelled) return;
      if (studentsRes.status === "fulfilled") setTotalStudents(studentsRes.value.total ?? 0);
      else if (!(studentsRes.reason instanceof ApiRequestError && studentsRes.reason.status === 401)) {
        setTotalStudents(0);
      }
      if (coursesRes.status === "fulfilled") setTotalCourses(coursesRes.value.total ?? 0);
      else setTotalCourses(0);
    })();
    return () => { cancelled = true; };
  }, [sessionUser]);

  const kpis = useMemo(() => [
    {
      ico: "user-plus",
      label: "Pending Registrations",
      num: RQ.loading && RQ.total === 0 ? "…" : String(RQ.total),
      trend: RQ.total > 0 ? "needs review" : "all caught up",
      warn: RQ.total > 0,
      to: `${base}/registrations`,
    },
    {
      ico: "clipboard-list",
      label: "Pending Enrollments",
      num: EQ.loading && EQ.pendingCount === 0 ? "…" : String(EQ.pendingCount),
      trend: EQ.pendingCount > 0 ? "needs review" : "all caught up",
      warn: EQ.pendingCount > 0,
      to: `${base}/enrollments`,
    },
    {
      ico: "users",
      label: "Total Students",
      num: totalStudents == null ? "…" : totalStudents.toLocaleString(),
      trend: totalStudents === 0 ? "no students yet" : "across the platform",
      to: `${base}/students`,
    },
    {
      ico: "book-open",
      label: "Published Courses",
      num: totalCourses == null ? "…" : totalCourses.toLocaleString(),
      trend: totalCourses === 0 ? "no published courses" : "live in catalog",
      to: `${base}/courses`,
    },
  ], [RQ.loading, RQ.total, EQ.loading, EQ.pendingCount, totalStudents, totalCourses, base]);

  const queues = useMemo(() => [
    {
      ico: "user-plus",
      title: "Registrations queue",
      body: "Approve sign-ups before students gain access to the platform.",
      count: RQ.total,
      to: `${base}/registrations`,
    },
    {
      ico: "clipboard-list",
      title: "Enrollments queue",
      body: "Approve course-access requests from existing students.",
      count: EQ.pendingCount,
      to: `${base}/enrollments`,
    },
  ], [RQ.total, EQ.pendingCount, base]);

  // Build a real "recent activity" feed from pending queue items (newest first).
  const activity = useMemo(() => {
    const items: Array<{ ico: string; tone?: "s" | "w"; title: string; meta: string; when: string; ts: number }> = [];

    // Recent pending registrations.
    for (const r of RQ.items.slice(0, 5)) {
      const name = `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || r.email || "Unknown user";
      const ts = r.createdAt ? new Date(r.createdAt).getTime() : 0;
      items.push({
        ico: "user-plus",
        tone: "s",
        title: `${name} submitted a sign-up request`,
        meta: "Awaiting registration approval",
        when: formatRelative(r.createdAt),
        ts,
      });
    }

    // Recent pending enrollments.
    for (const e of EQ.items.slice(0, 5)) {
      const name = e.student
        ? `${e.student.firstName} ${e.student.lastName}`.trim()
        : e.studentUid.slice(0, 8) + "…";
      const courseTitle = e.courseTitle ?? "a course";
      const ts = new Date(e.createdAt).getTime();
      items.push({
        ico: "clipboard-list",
        tone: "s",
        title: `${name} requested ${courseTitle}`,
        meta: "Awaiting enrollment approval",
        when: formatRelative(e.createdAt),
        ts,
      });
    }

    items.sort((a, b) => b.ts - a.ts);
    return items.slice(0, 5);
  }, [RQ.items, EQ.items]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Operations overview</h1>
          <div className="greeting">Live data across the platform.</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button icon="plus" onClick={() => router.push(`${base}/courses/new`)}>
            New course
          </Button>
        </div>
      </div>

      <div className="kpi-grid">
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

      <div className="section-h">
        <h3>Approval queues</h3>
      </div>
      <div className="queue-grid">
        {queues.map((q) => (
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
        {base === "/super-admin" && <ArrowLink href={`${base}/audit-log`}>View audit log</ArrowLink>}
      </div>
      <div className="activity">
        {activity.length === 0 ? (
          <div style={{
            padding: "24px 16px",
            textAlign: "center",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--color-muted)",
          }}>
            <Icon name="check-circle" size={20} style={{ opacity: 0.4, marginBottom: 6 }} />
            <div>No pending items right now — you&apos;re all caught up.</div>
          </div>
        ) : (
          activity.map((a, i) => (
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
          ))
        )}
      </div>
    </div>
  );
}
