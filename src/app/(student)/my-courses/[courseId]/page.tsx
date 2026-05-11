"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { COURSE_VIEWER_SEMESTERS, FEATURED_COURSES } from "@/lib/mock/courses";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { cn } from "@/lib/cn";

const ALL_SUBJECTS = COURSE_VIEWER_SEMESTERS.flatMap((s) => s.subjects);

function downloadBlob(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StudentCourseViewerPage() {
  const params = useParams<{ courseId: string }>();
  const dispatch = useAppDispatch();
  const course =
    FEATURED_COURSES.find((c) => c.id === params.courseId) ?? FEATURED_COURSES[0];

  // Seed 5 of 7 lessons completed (≈ 71 %) to reflect dashboard "65 %" state
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(["S1-1", "S1-2", "S1-3", "S1-4", "S2-1"]),
  );
  const [activeSubject, setActiveSubject] = useState("S2-2");

  const total = ALL_SUBJECTS.length;
  const pct = Math.round((completed.size / total) * 100);

  const markComplete = () => {
    if (completed.has(activeSubject)) return;
    setCompleted((prev) => new Set([...prev, activeSubject]));
    dispatch(
      pushToast({
        tone: "success",
        title: "Lesson marked complete",
        message: "Your progress was saved.",
      }),
    );
  };

  const activeIndex = ALL_SUBJECTS.findIndex((s) => s.id === activeSubject);
  const prevSubject = activeIndex > 0 ? ALL_SUBJECTS[activeIndex - 1] : null;
  const nextSubject = activeIndex < ALL_SUBJECTS.length - 1 ? ALL_SUBJECTS[activeIndex + 1] : null;

  const activeTitle = ALL_SUBJECTS.find((s) => s.id === activeSubject)?.title ?? "";

  const handleDownloadPdf = () => {
    const content = `${activeTitle}\nREST API Design Cheatsheet\n\n` +
      `• Use nouns for resource names: /users, /orders\n` +
      `• GET retrieves, POST creates, PUT/PATCH updates, DELETE removes\n` +
      `• Return appropriate HTTP status codes (200, 201, 400, 401, 404, 500)\n` +
      `• Use query params for filtering: GET /users?status=active\n` +
      `• Paginate large collections: GET /users?page=2&limit=20\n` +
      `• Version your API: /v1/users\n` +
      `• Always return JSON with consistent structure\n`;
    downloadBlob("REST-API-Design-Cheatsheet.txt", content);
    dispatch(pushToast({ tone: "success", title: "Download started", message: "REST API Design · Cheatsheet" }));
  };

  return (
    <div className="viewer">
      <aside className="viewer-side">
        <div className="head">
          <h2>{course.title}</h2>
          <div className="progress-row">
            <div className="bar">
              <i style={{ width: pct + "%", transition: "width 400ms ease" }} />
            </div>
            <span className="pct">{pct}%</span>
          </div>
        </div>
        {COURSE_VIEWER_SEMESTERS.map((sem) => (
          <div className="semester" key={sem.id}>
            <div className="semester-head">
              {sem.title} <Icon name="chevron-down" size={14} />
            </div>
            {sem.subjects.map((sub) => {
              const done = completed.has(sub.id);
              const active = activeSubject === sub.id;
              return (
                <div
                  key={sub.id}
                  className={cn(
                    "subject",
                    active && "active",
                    done && "completed",
                    !done && !active && "notstarted",
                  )}
                  onClick={() => setActiveSubject(sub.id)}
                >
                  <span className="dot">
                    <Icon
                      name={done ? "check-circle" : active ? "play-circle" : "circle"}
                      size={14}
                    />
                  </span>
                  {sub.title}
                </div>
              );
            })}
          </div>
        ))}
      </aside>
      <div className="viewer-main">
        <div className="crumbs">
          My Courses · {course.title} · <span>{activeTitle}</span>
        </div>
        <h1>{activeTitle}</h1>
        <div className="player" style={{ padding: 0, background: "#000", position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
          <iframe
            src="https://www.youtube.com/embed/rfscVS0vtbw?rel=0&modestbranding=1"
            title={activeTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
        <p className="desc">
          REST is still the default contract for most service-to-service traffic on the web. In
          this lesson we&apos;ll cover resource modelling, HTTP verb semantics, status codes you
          actually need, and idempotency, with worked examples from a real production codebase.
        </p>
        <div className="attachments">
          <h3>Lesson materials</h3>
          <div className="attach-item">
            <div className="ico">
              <Icon name="file-text" size={16} />
            </div>
            <div className="name">REST API Design · Cheatsheet</div>
            <div className="size">PDF · 312 KB</div>
            <button className="btn btn--ghost btn--sm" onClick={handleDownloadPdf} title="Download">
              <Icon name="download" size={14} />
            </button>
          </div>
          <div className="attach-item">
            <div className="ico">
              <Icon name="terminal" size={16} />
            </div>
            <div className="name">Lab · Build a paginated /users endpoint</div>
            <div className="size">Browser sandbox</div>
            <button
              className="btn btn--ghost btn--sm"
              title="Open lab"
              onClick={() => window.open("about:blank", "_blank")}
            >
              <Icon name="external-link" size={14} />
            </button>
          </div>
        </div>
        <div className="viewer-actions">
          <Button
            variant="secondary"
            icon="arrow-left"
            onClick={() => prevSubject && setActiveSubject(prevSubject.id)}
          >
            Previous lesson
          </Button>
          <Button
            icon={completed.has(activeSubject) ? "check-circle" : "check"}
            onClick={markComplete}
          >
            {completed.has(activeSubject) ? "Completed" : "Mark Complete"}
          </Button>
          <Button
            variant="secondary"
            iconAfter="arrow-right"
            onClick={() => nextSubject && setActiveSubject(nextSubject.id)}
          >
            Next lesson
          </Button>
        </div>
      </div>
    </div>
  );
}
