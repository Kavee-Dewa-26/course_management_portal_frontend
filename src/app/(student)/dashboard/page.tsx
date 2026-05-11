"use client";

import { useRouter } from "next/navigation";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Button } from "@/components/ui/Button";
import { CourseCover } from "@/components/ui/CourseCover";
import { Icon } from "@/components/ui/Icon";
import {
  STUDENT_ENROLLED_NOT_STARTED,
  STUDENT_IN_PROGRESS,
  type CourseSummary,
} from "@/lib/mock/courses";
import { coverGradient } from "@/lib/kit";
import { STUDENT } from "@/lib/mock/users";

export default function StudentDashboardPage() {
  const router = useRouter();
  const goCourse = (c: CourseSummary) => router.push(`/my-courses/${c.id}`);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Welcome back, {STUDENT.name.split(" ")[0]}.</h1>
          <div className="greeting">
            You&apos;ve completed <b style={{ color: "#152A24" }}>3 lessons</b> this week — keep
            it up.
          </div>
        </div>
      </div>

      {/* CONTINUE LEARNING */}
      <div className="continue">
        <div>
          <div className="label">Continue learning</div>
          <h2>Designing REST APIs</h2>
          <p className="sub">Lesson 10 of 16 · Modern Backend Engineering</p>
          <div className="progress-row">
            <div className="bar">
              <i style={{ width: "65%" }} />
            </div>
            <span className="pct">65%</span>
          </div>
          <Button
            icon="play"
            onClick={() => router.push("/my-courses/modern-backend-engineering")}
          >
            Resume Lesson
          </Button>
        </div>
        <div
          className="cover"
          style={{
            background: coverGradient("math"),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(188,233,85,0.4)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <Icon name="code-2" size={120} strokeWidth={1.25} />
        </div>
      </div>

      {/* IN PROGRESS */}
      <div className="section-h">
        <h3>In progress</h3>
        <ArrowLink href="/my-courses">View all</ArrowLink>
      </div>
      <div className="my-grid">
        {STUDENT_IN_PROGRESS.map((c) => (
          <article key={c.id} className="course-card my-card" onClick={() => goCourse(c)}>
            <CourseCover kind={c.kind} emblem={c.emblem} tag={c.tag} />
            <div className="body">
              <div className="meta">
                <span>
                  <Icon name="clock" size={12} />
                  {c.time}
                </span>
                <span>
                  <Icon name="layers" size={12} />
                  {c.lessons}
                </span>
              </div>
              <h3>{c.title}</h3>
            </div>
            <div className="progress-cap">
              <div className="bar">
                <i style={{ width: (c.progress ?? 0) + "%" }} />
              </div>
              <span className="pct">{c.progress}%</span>
            </div>
          </article>
        ))}
      </div>

      {/* ENROLLED · NOT STARTED */}
      <div className="section-h">
        <h3>Enrolled · not started</h3>
        <Button
          variant="ghost"
          size="sm"
          iconAfter="arrow-right"
          onClick={() => router.push("/my-courses")}
        >
          Browse catalog
        </Button>
      </div>
      <div className="my-grid">
        {STUDENT_ENROLLED_NOT_STARTED.map((c) => (
          <article key={c.id} className="course-card my-card" onClick={() => goCourse(c)}>
            <CourseCover kind={c.kind} emblem={c.emblem} tag={c.tag} />
            <div className="body">
              <div className="meta">
                <span>
                  <Icon name="clock" size={12} />
                  {c.time}
                </span>
                <span>
                  <Icon name="layers" size={12} />
                  {c.lessons}
                </span>
              </div>
              <h3>{c.title}</h3>
              <Button
                size="sm"
                variant="secondary"
                iconAfter="arrow-right"
                onClick={(e) => {
                  e.stopPropagation();
                  goCourse(c);
                }}
              >
                Start course
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
