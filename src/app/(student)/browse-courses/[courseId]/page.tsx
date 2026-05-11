"use client";

import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CourseCover } from "@/components/ui/CourseCover";
import { Icon } from "@/components/ui/Icon";
import { FEATURED_COURSES, COURSE_VIEWER_SEMESTERS } from "@/lib/mock/courses";
import { useEnrollmentRequests } from "@/application/hooks/useEnrollmentRequests";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";

export default function BrowseCourseDetailPage() {
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const dispatch = useAppDispatch();
  const { getStatus, requestEnrollment } = useEnrollmentRequests();

  const course = FEATURED_COURSES.find((c) => c.id === params.courseId) ?? FEATURED_COURSES[0];
  const status = getStatus(course.id);

  const handleRequest = () => {
    requestEnrollment(course.id);
    dispatch(
      pushToast({
        tone: "success",
        title: "Enrollment requested",
        message: `Your request for ${course.title} is awaiting admin approval.`,
      }),
    );
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
          <div style={{ marginBottom: 12 }}><Badge tone="info">{course.tag}</Badge></div>
          <h1 style={{ color: "#fff", margin: "8px 0 10px", fontSize: 28, fontFamily: "var(--font-heading)" }}>
            {course.title}
          </h1>
          {course.desc && (
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, margin: "0 0 20px", lineHeight: 1.5, maxWidth: 520 }}>
              {course.desc}
            </p>
          )}
          <div style={{ display: "flex", gap: 20, color: "rgba(255,255,255,0.65)", fontSize: 13, fontFamily: "var(--font-body)", marginBottom: 24 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="clock" size={14} /> {course.time}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="layers" size={14} /> {course.lessons}
            </span>
          </div>

          {/* CTA based on status */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {status === "available" && (
              <Button icon="clipboard-list" onClick={handleRequest}>
                Request Enrollment
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
            {status === "enrolled" && (
              <Button
                icon="play"
                onClick={() => router.push(`/my-courses/${course.id}`)}
              >
                Go to Course
              </Button>
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
          <CourseCover kind={course.kind} emblem={course.emblem} />
        </div>
      </div>

      {/* Syllabus */}
      <div className="settings-card">
        <h2>Syllabus</h2>
        <p className="settings-sub">Topics covered across all modules in this course.</p>
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {COURSE_VIEWER_SEMESTERS.map((sem) => (
            <div
              key={sem.id}
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-stroke)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-primary)", marginBottom: 10, fontFamily: "var(--font-heading)" }}>
                {sem.title}
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {sem.subjects.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "var(--color-body-green)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <Icon name="play-circle" size={13} />
                    {s.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
