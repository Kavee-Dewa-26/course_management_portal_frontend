"use client";

/**
 * Student course-detail / enrolment page.
 *
 * APIs used (preserved from V1):
 *  • GET  /courses/:id                  → course title, state, semesters[]
 *  • GET  /subjects/:id/lessons         → lesson titles (preview, no content)
 *  • POST /courses/:id/enroll           → student requests enrolment
 *  • GET  /me/enrollments               → check existing enrolment status
 *
 * Layout: same .viewer two-column shell as the enrolled-course viewer so
 * the student can preview the full course structure before committing.
 *   Left  → sidebar: intake badge + 0% progress bar + semester tree
 *   Right → main: course hero + enrolment CTA + description
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useCourse } from "@/application/hooks/useCourses";
import { useEnrollments } from "@/application/hooks/useEnrollments";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { apiRequest } from "@/infrastructure/api/request";
import { listBatchesForCourse } from "@/lib/mock/batches";

interface LessonTitle { id: string; title: string }

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Generates dummy semester date windows based on position.
 *   idx 0 → past   (3–5 months ago)
 *   idx 1 → current (started last month, ends next month)
 *   idx 2 → future  (3–5 months from now)
 * Returns { start, end, state }.
 */
function getDummySemesterDates(idx: number) {
  const now = new Date();
  const offset = (months: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  };
  if (idx === 0) return { start: offset(-5), end: offset(-3), state: "past" as const };
  if (idx === 1) return { start: offset(-1), end: offset(2), state: "current" as const };
  return { start: offset(3 + (idx - 2) * 2), end: offset(5 + (idx - 2) * 2), state: "future" as const };
}

/** Dummy lesson names shown when the API returns no lessons yet. */
function getDummyLessons(subjectTitle: string, count = 3): LessonTitle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `dummy-${subjectTitle}-${i}`,
    title: i === 0 ? subjectTitle.split(" ")[0] + " Basics" : `${subjectTitle} · Part ${i + 1}`,
  }));
}

export default function BrowseCourseDetailPage() {
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const { getStatus, getEnrollmentForCourse, enroll } = useEnrollments();
  const [enrolling, setEnrolling] = useState(false);
  const sessionUser = useAppSelector((s) => s.session.user);

  const { course, loading, error } = useCourse(sessionUser ? params.courseId : undefined);
  const [lessonsBySubject, setLessonsBySubject] = useState<Record<string, LessonTitle[]>>({});

  useEffect(() => {
    if (error?.status === 404) router.replace("/browse-courses");
  }, [error, router]);

  // Fetch lesson titles for every subject (preview — no video/content).
  useEffect(() => {
    const subjects = course?.semesters?.flatMap((s) => s.subjects ?? []) ?? [];
    if (subjects.length === 0) { setLessonsBySubject({}); return; }
    let cancelled = false;
    Promise.allSettled(
      subjects.map(async (sub) => {
        const list = await apiRequest<LessonTitle[]>(`/subjects/${sub.id}/lessons`);
        return { subjectId: sub.id, list: (list ?? []).map((l) => ({ id: l.id, title: l.title })) };
      }),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, LessonTitle[]> = {};
      for (const r of results) {
        if (r.status === "fulfilled") map[r.value.subjectId] = r.value.list;
      }
      setLessonsBySubject(map);
    });
    return () => { cancelled = true; };
  }, [course?.semesters]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-body-green)" }}>
        <Icon name="loader" size={24} style={{ opacity: 0.4 }} />
        <p style={{ marginTop: 12, fontFamily: "var(--font-body)" }}>Loading course…</p>
      </div>
    );
  }

  if (!course) return null;

  const status = getStatus(course.id);
  const existingEnrollment = getEnrollmentForCourse(course.id);

  // Sort semesters by order for the sidebar tree.
  const sortedSemesters = (course.semesters ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Each semester gets dummy dates so we can show Past / Current / Future.
  const semesterMeta = sortedSemesters.map((_, idx) => getDummySemesterDates(idx));

  // Intake batch — use real mock data or fall back to a sensible dummy.
  const batches = listBatchesForCourse(course.id);
  const openBatch = batches.find((b) => b.state === "open") ??
    batches[0] ?? {
      id: "fallback",
      courseId: course.id,
      name: "Intake A · Q2 2026",
      intakeStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString().slice(0, 10),
      intakeEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 50).toISOString().slice(0, 10),
      state: "open" as const,
      capacity: 60,
      enrolled: 12,
    };

  // Count lessons — fall back to 3 per subject when API hasn't loaded yet.
  const totalLessons = sortedSemesters.reduce((sum, sem) => {
    return sum + (sem.subjects ?? []).reduce((s2, sub) => {
      const apiCount = lessonsBySubject[sub.id]?.length ?? 0;
      return s2 + (apiCount > 0 ? apiCount : 3);
    }, 0);
  }, 0);

  const handleRequest = async () => {
    setEnrolling(true);
    await enroll(course.id);
    setEnrolling(false);
  };

  return (
    <div className="viewer">
      {/* ── Sidebar — course structure preview ────────────────────── */}
      <aside className="viewer-side">
        <div className="head">
          <h2>{course.title}</h2>

          {/* Intake badge */}
          {openBatch && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: "rgba(188,233,85,0.18)",
                borderRadius: 9999,
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 12,
                color: "var(--color-primary)",
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <Icon name="calendar-clock" size={13} />
              {openBatch.name} · {fmtDate(openBatch.intakeStart)} → {fmtDate(openBatch.intakeEnd)}
            </div>
          )}

          {/* 0% progress bar */}
          <div className="progress-row">
            <div className="bar"><i style={{ width: "0%" }} /></div>
            <span className="pct">0%</span>
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
            0 of {totalLessons} lessons completed
          </div>
        </div>

        {/* Semester tree */}
        {sortedSemesters.length === 0 ? (
          <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: 13 }}>
            <Icon name="layers" size={22} style={{ opacity: 0.35, marginBottom: 8 }} />
            <p style={{ margin: 0 }}>No content yet.</p>
          </div>
        ) : (
          sortedSemesters.map((sem, semIdx) => {
            const { start, end, state } = semesterMeta[semIdx];
            const isPast = state === "past";
            const isFuture = state === "future";
            const isCurrent = state === "current";
            const isLocked = isPast || isFuture;

            const stateLabel = isPast ? "Past" : isFuture ? "Future" : "Current";
            const dateColor = isPast ? "var(--color-error-deep)" : isFuture ? "var(--color-muted)" : "var(--color-success-deep)";
            const closedSuffix = isPast ? " · closed" : isFuture ? " · closed" : "";

            return (
              <div className="semester" key={sem.id} style={{ opacity: isLocked ? 0.7 : 1 }}>
                {/* Semester header */}
                <div
                  className="semester-head"
                  style={{ fontWeight: isCurrent ? 700 : 600, color: isLocked ? "var(--color-muted)" : "var(--color-primary)" }}
                >
                  <span>
                    {sem.title}
                    <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 6, color: "var(--color-muted)" }}>
                      · {stateLabel}
                    </span>
                  </span>
                  {isLocked
                    ? <Icon name="lock" size={13} style={{ color: "var(--color-muted)" }} />
                    : <Icon name="chevron-down" size={14} />}
                </div>

                {/* Date range row */}
                <div style={{ padding: "0 24px 8px", fontFamily: "var(--font-mono)", fontSize: 11, color: dateColor }}>
                  {fmtDate(start)} → {fmtDate(end)}{closedSuffix}
                </div>

                {/* Locked semesters: hint + one placeholder lesson */}
                {isLocked && (
                  <div style={{ padding: "4px 24px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-muted)", marginBottom: 6 }}>
                      <Icon name="lock" size={13} />
                      {isPast ? "Closed: past content" : "Locked: future content"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-muted)", paddingLeft: 8 }}>
                      <Icon name="lock" size={11} />
                      {isPast ? "Past lesson" : "Locked lesson"}
                    </div>
                  </div>
                )}

                {/* Current semester: show all subjects + lessons */}
                {isCurrent && (
                  <>
                    {(sem.subjects ?? []).map((sub) => {
                      // Use real lessons from API; fall back to dummy names if none yet.
                      const apiLessons = lessonsBySubject[sub.id] ?? [];
                      const lessons = apiLessons.length > 0 ? apiLessons : getDummyLessons(sub.title);
                      return (
                        <div key={sub.id}>
                          <div className="subject notstarted" style={{ cursor: "default" }}>
                            <span className="dot">
                              <Icon name="play-circle" size={14} style={{ color: "var(--color-accent)" }} />
                            </span>
                            {sub.title}
                          </div>
                          <div>
                            {lessons.map((l, li) => (
                              <div
                                key={l.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "7px 18px 7px 52px",
                                  fontFamily: "var(--font-body)",
                                  fontSize: 13,
                                  color: li === 0 ? "var(--color-primary)" : "var(--color-body-green)",
                                  background: li === 0 ? "rgba(188,233,85,0.15)" : "transparent",
                                  fontWeight: li === 0 ? 700 : 400,
                                  borderRadius: li === 0 ? 6 : 0,
                                  margin: li === 0 ? "0 8px" : 0,
                                  width: li === 0 ? "calc(100% - 16px)" : "100%",
                                }}
                              >
                                <Icon
                                  name={li === 0 ? "play-circle" : "circle"}
                                  size={12}
                                  style={{ color: li === 0 ? "var(--color-accent)" : "var(--color-muted)", flexShrink: 0 }}
                                />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {l.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {(!sem.subjects || sem.subjects.length === 0) && (
                      <div style={{ padding: "6px 18px 8px 36px", fontSize: 12, color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
                        No subjects yet
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}

        {/* Sidebar footer note */}
        <div style={{ padding: "20px 24px 12px", borderTop: "1px solid var(--color-stroke-2)", marginTop: 8 }}>
          <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 11, color: "var(--color-muted)", lineHeight: 1.5 }}>
            Lessons unlock after your enrolment is approved. Future semesters unlock as the schedule opens.
          </p>
        </div>
      </aside>

      {/* ── Main panel — enrolment CTA ────────────────────────────── */}
      <div className="viewer-main">
        <div className="crumbs">
          <button
            type="button"
            onClick={() => router.push("/browse-courses")}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)", padding: 0, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Icon name="arrow-left" size={14} /> Browse Courses
          </button>
        </div>

        <h1 style={{ marginBottom: 8 }}>{course.title}</h1>

        {/* Enrolment status + action card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--color-stroke)",
            borderRadius: 18,
            padding: 28,
            marginBottom: 24,
          }}
        >
          {status === "available" && (
            <>
              <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-heading)", fontSize: 20, color: "var(--color-primary)" }}>
                Ready to enrol?
              </h2>
              <p style={{ margin: "0 0 20px", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body-green)", lineHeight: 1.6 }}>
                Submit a request — an admin will approve it within 24 hours. Once approved you&apos;ll get
                instant access to the first semester&apos;s content.
              </p>
              {openBatch && (
                <div className="batch-row" style={{ marginBottom: 20 }}>
                  <div className="ico"><Icon name="calendar-clock" size={18} /></div>
                  <div className="b-body">
                    <div className="name">{openBatch.name}</div>
                    <div className="window">
                      <span><Icon name="calendar" size={12} /> {fmtDate(openBatch.intakeStart)} → {fmtDate(openBatch.intakeEnd)}</span>
                      <span className="sep">·</span>
                      <span><Icon name="users" size={12} /> {openBatch.enrolled} / {openBatch.capacity} enrolled</span>
                    </div>
                  </div>
                  <Badge tone="success">Open</Badge>
                </div>
              )}
              <Button size="lg" icon="clipboard-list" onClick={handleRequest} disabled={enrolling}>
                {enrolling ? "Requesting…" : "Request Enrolment"}
              </Button>
            </>
          )}

          {status === "pending" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--color-warning-bg)", color: "var(--color-warning)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="clock" size={22} />
                </div>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-primary)" }}>
                    Application in review
                  </h2>
                  <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)" }}>
                    Your enrolment request is awaiting admin approval. Usually within 24 hours.
                  </p>
                </div>
              </div>
              <Badge tone="warning">Pending Admin Approval</Badge>
            </>
          )}

          {status === "approved" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--color-success-bg)", color: "var(--color-success-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="check-circle" size={22} />
                </div>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-primary)" }}>
                    You&apos;re enrolled!
                  </h2>
                  <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)" }}>
                    Access your lessons, track progress, and download materials.
                  </p>
                </div>
              </div>
              <Button size="lg" icon="play" onClick={() => router.push(`/my-courses/${course.id}`)}>
                Continue learning
              </Button>
            </>
          )}

          {existingEnrollment?.state === "rejected" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--color-error-bg)", color: "var(--color-error)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="x-circle" size={22} />
                </div>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-primary)" }}>
                    Request rejected
                  </h2>
                  {existingEnrollment.reason && (
                    <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)" }}>
                      {existingEnrollment.reason}
                    </p>
                  )}
                </div>
              </div>
              <Button size="lg" icon="clipboard-list" onClick={handleRequest} disabled={enrolling}>
                {enrolling ? "Requesting…" : "Request Again"}
              </Button>
            </>
          )}
        </div>

        {/* Course meta */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body-green)", marginBottom: 24 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="layers" size={14} /> {course.semesterCount} {course.semesterCount === 1 ? "semester" : "semesters"}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="play-circle" size={14} /> {totalLessons} lessons
          </span>
          {course.state === "published" && course.publishedAt && (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="calendar" size={14} />
              Published {new Date(course.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <Button variant="ghost" icon="arrow-left" onClick={() => router.push("/browse-courses")}>
            Back to catalog
          </Button>
        </div>
      </div>
    </div>
  );
}
