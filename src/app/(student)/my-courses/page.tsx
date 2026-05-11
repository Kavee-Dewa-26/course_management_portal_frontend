"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CourseCover } from "@/components/ui/CourseCover";
import { Icon } from "@/components/ui/Icon";
import {
  STUDENT_ENROLLED_NOT_STARTED,
  STUDENT_IN_PROGRESS,
  STUDENT_PENDING_COURSES,
  type CourseSummary,
} from "@/lib/mock/courses";

const ENROLLED: CourseSummary[] = [...STUDENT_IN_PROGRESS, ...STUDENT_ENROLLED_NOT_STARTED];

export default function MyCoursesPage() {
  const router = useRouter();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Courses</h1>
          <div className="greeting">
            <b style={{ color: "var(--color-primary)" }}>{ENROLLED.length}</b> enrolled,{" "}
            {STUDENT_IN_PROGRESS.length} in progress.
          </div>
        </div>
        <Button
          variant="secondary"
          icon="search"
          onClick={() => router.push("/browse-courses")}
        >
          Browse Courses
        </Button>
      </div>

      {/* Enrolled courses */}
      <div className="my-grid">
        {ENROLLED.map((c) => (
          <article
            key={c.id}
            className="course-card my-card"
            onClick={() => router.push(`/my-courses/${c.id}`)}
          >
            <CourseCover kind={c.kind} emblem={c.emblem} tag={c.tag} />
            <div className="body">
              <div className="meta">
                <span><Icon name="clock" size={12} />{c.time}</span>
                <span><Icon name="layers" size={12} />{c.lessons}</span>
              </div>
              <h3>{c.title}</h3>
            </div>
            <div className="progress-cap">
              <div className="bar">
                <i style={{ width: (c.progress ?? 0) + "%" }} />
              </div>
              <span className="pct">{c.progress ?? 0}%</span>
            </div>
          </article>
        ))}
      </div>

      {/* Pending approval */}
      {STUDENT_PENDING_COURSES.length > 0 && (
        <>
          <div className="section-h" style={{ marginTop: 32 }}>
            <h3>Pending Approval</h3>
            <Badge tone="warning">{STUDENT_PENDING_COURSES.length} awaiting</Badge>
          </div>
          <div className="my-grid">
            {STUDENT_PENDING_COURSES.map((c) => (
              <article
                key={c.id}
                className="course-card my-card"
                style={{ opacity: 0.75, cursor: "default" }}
              >
                <div style={{ position: "relative" }}>
                  <CourseCover kind={c.kind} emblem={c.emblem} tag={c.tag} />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(21,42,36,0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Badge tone="warning">Pending Approval</Badge>
                  </div>
                </div>
                <div className="body">
                  <div className="meta">
                    <span><Icon name="clock" size={12} />{c.time}</span>
                    <span><Icon name="layers" size={12} />{c.lessons}</span>
                  </div>
                  <h3>{c.title}</h3>
                  <p style={{ fontSize: 12, color: "var(--color-body-green)", fontFamily: "var(--font-body)", margin: "4px 0 0" }}>
                    Awaiting admin approval. You will be notified once approved.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
