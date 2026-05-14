"use client";

/**
 * Student Browse Course Detail page
 * ──────────────────────────────────
 * APIs used to render this page:
 *  • GET  /courses/:id                  → course title, state, publishedAt, semesterCount, semesters[]
 *  • GET  /courses/:id/semesters        → fallback if main response has empty semesters[]
 *  • GET  /semesters/:id/subjects       → fallback for each semester's subjects
 *  • POST /courses/:id/enroll           → student requests enrollment
 *  • GET  /me/enrollments               → check if student already has an enrollment for this course
 *
 * NOTE: lessons are intentionally NOT shown here — students must enroll first.
 * Once enrolled and approved, lessons appear in /my-courses/:id (uses
 * GET /subjects/:id/lessons + GET /attachments/:id/download-url).
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CourseCover } from "@/components/ui/CourseCover";
import { Icon } from "@/components/ui/Icon";
import { useCourse } from "@/application/hooks/useCourses";
import { useEnrollments } from "@/application/hooks/useEnrollments";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { apiRequest } from "@/infrastructure/api/request";

interface LessonTitle { id: string; title: string }

export default function BrowseCourseDetailPage() {
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const { getStatus, getEnrollmentForCourse, enroll } = useEnrollments();
  const [enrolling, setEnrolling] = useState(false);
  const sessionUser = useAppSelector((s) => s.session.user);

  const { course, loading, error } = useCourse(sessionUser ? params.courseId : undefined);
  const [lessonsBySubject, setLessonsBySubject] = useState<Record<string, LessonTitle[]>>({});

  useEffect(() => {
    if (error?.status === 404) {
      router.replace("/browse-courses");
    }
  }, [error, router]);

  // Fetch lesson titles for every subject (preview only — no video/content).
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
      <div className="page">
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-body-green)" }}>
          <Icon name="loader" size={24} style={{ opacity: 0.4 }} />
          <p style={{ marginTop: 12, fontFamily: "var(--font-body)", fontSize: 14 }}>Loading course…</p>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const status = getStatus(course.id);
  const existingEnrollment = getEnrollmentForCourse(course.id);
  const totalSubjects =
    course.semesters?.reduce((sum, s) => sum + (s.subjectCount ?? s.subjects?.length ?? 0), 0) ?? 0;

  const handleRequest = async () => {
    setEnrolling(true);
    await enroll(course.id);
    setEnrolling(false);
  };

  return (
    <div className="page">
      {/* Hero */}
      <div
        style={{
          background: "var(--color-primary)",
          borderRadius: 16,
          padding: "32px 36px",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 32,
          alignItems: "center",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ color: "#fff", margin: "8px 0 20px", fontSize: 28, fontFamily: "var(--font-heading)" }}>
            {course.title}
          </h1>
          <div style={{ display: "flex", gap: 20, color: "rgba(255,255,255,0.65)", fontSize: 13, fontFamily: "var(--font-body)", marginBottom: 24, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="layers" size={14} /> {course.semesterCount} {course.semesterCount === 1 ? "semester" : "semesters"}
            </span>
            {totalSubjects > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="play-circle" size={14} /> {totalSubjects} {totalSubjects === 1 ? "subject" : "subjects"}
              </span>
            )}
            {course.state === "published" && course.publishedAt && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="calendar" size={14} /> Published {new Date(course.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>

          {/* CTA based on status */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {status === "available" && (
              <Button icon="clipboard-list" onClick={handleRequest} disabled={enrolling}>
                {enrolling ? "Requesting…" : "Request Enrollment"}
              </Button>
            )}
            {status === "pending" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Badge tone="warning">Pending Admin Approval</Badge>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "var(--font-body)" }}>
                  You will be notified once approved.
                </span>
              </div>
            )}
            {status === "approved" && (
              <Button
                icon="play"
                onClick={() => router.push(`/my-courses/${course.id}`)}
              >
                Go to Course
              </Button>
            )}
            {existingEnrollment?.state === "rejected" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Badge tone="error">Previous request rejected</Badge>
                {existingEnrollment.reason && (
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "var(--font-body)" }}>
                    Reason: {existingEnrollment.reason}
                  </span>
                )}
                <div>
                  <Button icon="clipboard-list" onClick={handleRequest} disabled={enrolling}>
                    {enrolling ? "Requesting…" : "Request Again"}
                  </Button>
                </div>
              </div>
            )}
            <Button
              variant="secondary-light"
              onClick={() => router.push("/browse-courses")}
            >
              Back to catalog
            </Button>
          </div>
        </div>

        <div style={{ width: 140, borderRadius: 14, overflow: "hidden", flexShrink: 0, position: "relative" }}>
          <CourseCover title={course.title} alt={course.title} />
        </div>
      </div>

      {/* Syllabus — preview of semesters & subjects (lessons are gated behind enrollment) */}
      <div className="settings-card">
        <h2>Syllabus</h2>
        <p className="settings-sub">
          Course structure across all semesters. Enroll to unlock lessons, videos and materials.
        </p>
        {course.semesters && course.semesters.length > 0 ? (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {course.semesters.map((sem, si) => (
              <div
                key={sem.id}
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-stroke)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "rgba(188,233,85,0.15)",
                    border: "1px solid rgba(188,233,85,0.3)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 11,
                    color: "#BCE955", flexShrink: 0,
                  }}>{si + 1}</span>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
                    {sem.title}
                  </div>
                </div>
                <div style={{ display: "grid", gap: 10, paddingLeft: 34 }}>
                  {sem.subjects && sem.subjects.length > 0 ? (
                    sem.subjects.map((s) => {
                      const lessons = lessonsBySubject[s.id] ?? [];
                      return (
                        <div key={s.id}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--color-primary)",
                            fontFamily: "var(--font-body)",
                          }}>
                            <Icon name="bookmark" size={13} />
                            {s.title}
                          </div>
                          {lessons.length > 0 && (
                            <div style={{ display: "grid", gap: 4, paddingLeft: 21, marginTop: 4 }}>
                              {lessons.map((l) => (
                                <div
                                  key={l.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    fontSize: 12,
                                    color: "var(--color-body-green)",
                                    fontFamily: "var(--font-body)",
                                  }}
                                >
                                  <Icon name="play-circle" size={11} style={{ opacity: 0.65 }} />
                                  {l.title}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--color-muted)", fontStyle: "italic", fontFamily: "var(--font-body)" }}>
                      No subjects yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 16, padding: "24px 16px", textAlign: "center", color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
            <Icon name="layers" size={24} style={{ opacity: 0.35, marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13 }}>The course curriculum is being prepared.</p>
          </div>
        )}
      </div>
    </div>
  );
}
