"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CourseCover } from "@/components/ui/CourseCover";
import { Icon } from "@/components/ui/Icon";
import { useCourse } from "@/application/hooks/useCourses";
import { useEnrollmentRequests } from "@/application/hooks/useEnrollmentRequests";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";

export default function BrowseCourseDetailPage() {
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const dispatch = useAppDispatch();
  const { getStatus, requestEnrollment } = useEnrollmentRequests();

  const { course, loading, error } = useCourse(params.courseId);

  useEffect(() => {
    if (error?.status === 404) {
      router.replace("/browse-courses");
    }
  }, [error, router]);

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
  const totalSubjects =
    course.semesters?.reduce((sum, s) => sum + (s.subjectCount ?? s.subjects?.length ?? 0), 0) ?? 0;

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
          <h1 style={{ color: "#fff", margin: "8px 0 20px", fontSize: 28, fontFamily: "var(--font-heading)" }}>
            {course.title}
          </h1>
          <div style={{ display: "flex", gap: 20, color: "rgba(255,255,255,0.65)", fontSize: 13, fontFamily: "var(--font-body)", marginBottom: 24, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="layers" size={14} /> {course.semesterCount} {course.semesterCount === 1 ? "module" : "modules"}
            </span>
            {totalSubjects > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="play-circle" size={14} /> {totalSubjects} {totalSubjects === 1 ? "subject" : "subjects"}
              </span>
            )}
            {course.publishedAt && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="calendar" size={14} /> Published {new Date(course.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
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
          <CourseCover alt={course.title} />
        </div>
      </div>

      {/* Syllabus */}
      <div className="settings-card">
        <h2>Syllabus</h2>
        <p className="settings-sub">Topics covered across all modules in this course.</p>
        {course.semesters && course.semesters.length > 0 ? (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {course.semesters.map((sem) => (
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
                  {sem.subjects?.map((s) => (
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
        ) : (
          <p style={{ marginTop: 12, color: "var(--color-body-green)", fontFamily: "var(--font-body)", fontSize: 13 }}>
            The course curriculum is being prepared.
          </p>
        )}
      </div>
    </div>
  );
}
