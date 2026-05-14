"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useCourse } from "@/application/hooks/useCourses";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { pushToast } from "@/application/slices/uiSlice";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";
import { cn } from "@/lib/cn";
import type { Subject } from "@/application/hooks/useCourses";

/* ── Types ───────────────────────────────────────────────────────────── */

interface Lesson {
  id: string;
  subjectId: string;
  title: string;
  description?: string | null;
  youtubeVideoId?: string | null;
  attachmentIds?: string[];
  order?: number;
}

interface Attachment {
  id: string;
  subjectId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function getYouTubeEmbedUrl(input: string | null | undefined): string | null {
  if (!input || !input.trim()) return null;
  if (input.includes("youtube.com/embed/")) return input.split("?")[0];
  const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0&modestbranding=1`;
  const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0&modestbranding=1`;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return `https://www.youtube.com/embed/${input.trim()}?rel=0&modestbranding=1`;
  if (input.startsWith("http")) return input;
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function StudentCourseViewerPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const sessionUser = useAppSelector((s) => s.session.user);

  const { course, loading } = useCourse(sessionUser ? params.courseId : undefined);

  // localStorage key for per-course / per-user progress until backend adds an API.
  const progressKey = sessionUser && params.courseId
    ? `edupath.progress.${sessionUser.uid}.${params.courseId}`
    : null;

  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Restore completed lessons from localStorage on mount.
  useEffect(() => {
    if (!progressKey) return;
    try {
      const raw = localStorage.getItem(progressKey);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        setCompleted(new Set(ids));
      }
    } catch { /* ignore corrupt data */ }
  }, [progressKey]);

  // Persist completed lessons to localStorage whenever they change.
  useEffect(() => {
    if (!progressKey) return;
    try {
      localStorage.setItem(progressKey, JSON.stringify([...completed]));
    } catch { /* ignore quota errors */ }
  }, [progressKey, completed]);

  // Flatten all subjects across semesters once (for prev/next nav).
  const allSubjects: Array<Subject & { semesterTitle: string }> = useMemo(() => {
    if (!course?.semesters) return [];
    return course.semesters.flatMap((sem) =>
      (sem.subjects ?? []).map((sub) => ({ ...sub, semesterTitle: sem.title })),
    );
  }, [course?.semesters]);

  // Auto-select first subject on course load.
  useEffect(() => {
    if (!activeSubjectId && allSubjects.length > 0) {
      setActiveSubjectId(allSubjects[0].id);
    }
  }, [allSubjects, activeSubjectId]);

  // Fetch lessons whenever active subject changes.
  useEffect(() => {
    if (!activeSubjectId) { setLessons([]); setActiveLessonId(null); return; }
    let cancelled = false;
    apiRequest<Lesson[]>(`/subjects/${activeSubjectId}/lessons`)
      .then((data) => {
        if (cancelled) return;
        const list = data ?? [];
        setLessons(list);
        setActiveLessonId(list[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) { setLessons([]); setActiveLessonId(null); }
      });
    return () => { cancelled = true; };
  }, [activeSubjectId]);

  const activeSubject = allSubjects.find((s) => s.id === activeSubjectId) ?? null;
  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? lessons[0] ?? null;

  // Progress tracking — local only (no API yet).
  const total = allSubjects.length;
  const pct = total === 0 ? 0 : Math.round((completed.size / total) * 100);

  const markComplete = () => {
    if (!activeSubjectId || completed.has(activeSubjectId)) return;
    setCompleted((prev) => new Set([...prev, activeSubjectId]));
    dispatch(pushToast({
      tone: "success",
      title: "Lesson marked complete",
      message: "Your progress was saved.",
    }));
  };

  // Prev/next subject nav
  const activeIndex = activeSubjectId ? allSubjects.findIndex((s) => s.id === activeSubjectId) : -1;
  const prevSubject = activeIndex > 0 ? allSubjects[activeIndex - 1] : null;
  const nextSubject = activeIndex >= 0 && activeIndex < allSubjects.length - 1 ? allSubjects[activeIndex + 1] : null;

  // Download an attachment by ID.
  const downloadAttachment = async (attachmentId: string, filename?: string) => {
    setDownloadingId(attachmentId);
    try {
      const { downloadUrl } = await apiRequest<{ downloadUrl: string; expiresAt: string }>(
        `/attachments/${attachmentId}/download-url`,
      );
      window.open(downloadUrl, "_blank");
      dispatch(pushToast({ tone: "success", title: "Download started", message: filename }));
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 403) {
        dispatch(pushToast({ tone: "warning", title: "Enrollment required" }));
      } else {
        dispatch(pushToast({ tone: "warning", title: "Download failed" }));
      }
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: "var(--color-body-green)" }}>
        <Icon name="loader" size={22} style={{ opacity: 0.4 }} />
        <p style={{ marginTop: 12, fontFamily: "var(--font-body)" }}>Loading course…</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Icon name="alert-circle" size={28} style={{ opacity: 0.4, marginBottom: 12 }} />
        <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)" }}>Course not found.</p>
      </div>
    );
  }

  const activeTitle = activeLesson?.title || activeSubject?.title || "";
  const embedUrl = getYouTubeEmbedUrl(activeLesson?.youtubeVideoId);

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
        {!course.semesters || course.semesters.length === 0 ? (
          <div style={{ padding: "20px 16px", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "center" }}>
            <Icon name="layers" size={22} style={{ opacity: 0.35, marginBottom: 8 }} />
            <p style={{ margin: 0 }}>No content yet.</p>
          </div>
        ) : (
          course.semesters.map((sem) => (
            <div className="semester" key={sem.id}>
              <div className="semester-head">
                {sem.title} <Icon name="chevron-down" size={14} />
              </div>
              {(sem.subjects ?? []).map((sub) => {
                const done = completed.has(sub.id);
                const active = activeSubjectId === sub.id;
                return (
                  <div
                    key={sub.id}
                    className={cn(
                      "subject",
                      active && "active",
                      done && "completed",
                      !done && !active && "notstarted",
                    )}
                    onClick={() => setActiveSubjectId(sub.id)}
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
              {(!sem.subjects || sem.subjects.length === 0) && (
                <div style={{ padding: "6px 18px 8px 36px", fontSize: 12, color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
                  No subjects
                </div>
              )}
            </div>
          ))
        )}
      </aside>

      <div className="viewer-main">
        <div className="crumbs">
          My Courses · {course.title} · <span>{activeTitle}</span>
        </div>
        <h1>{activeTitle || "Select a lesson"}</h1>

        {/* Lesson selector — only show if multiple lessons in subject */}
        {lessons.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {lessons.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setActiveLessonId(l.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--color-stroke)",
                  background: activeLessonId === l.id ? "var(--color-accent)" : "var(--color-surface)",
                  color: activeLessonId === l.id ? "var(--color-primary)" : "var(--color-body-green)",
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Lesson {i + 1}: {l.title}
              </button>
            ))}
          </div>
        )}

        {embedUrl ? (
          <div className="player" style={{ padding: 0, background: "#000", position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
            <iframe
              src={embedUrl}
              title={activeTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        ) : (
          <div className="player" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: 280, background: "#152A24", color: "rgba(255,255,255,0.6)",
            fontFamily: "var(--font-body)", fontSize: 14, borderRadius: 14,
          }}>
            <div style={{ textAlign: "center" }}>
              <Icon name="play-circle" size={32} style={{ opacity: 0.4, marginBottom: 10 }} />
              <p style={{ margin: 0 }}>{activeLesson ? "No video for this lesson." : "Select a subject to view its lesson."}</p>
            </div>
          </div>
        )}

        {activeLesson?.description && (
          <p className="desc">{activeLesson.description}</p>
        )}

        {/* Attachments */}
        {activeLesson && (activeLesson.attachmentIds?.length ?? 0) > 0 && (
          <div className="attachments">
            <h3>Lesson materials</h3>
            {(activeLesson.attachmentIds ?? []).map((attId) => (
              <div className="attach-item" key={attId}>
                <div className="ico">
                  <Icon name="file-text" size={16} />
                </div>
                <div className="name" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  Attachment ({attId.slice(0, 8)}…)
                </div>
                <div className="size">PDF / DOC</div>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => downloadAttachment(attId)}
                  disabled={downloadingId === attId}
                  title="Download"
                >
                  <Icon name={downloadingId === attId ? "loader" : "download"} size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="viewer-actions">
          <Button
            variant="secondary"
            icon="arrow-left"
            disabled={!prevSubject}
            onClick={() => prevSubject && setActiveSubjectId(prevSubject.id)}
          >
            Previous lesson
          </Button>
          <Button
            icon={activeSubjectId && completed.has(activeSubjectId) ? "check-circle" : "check"}
            disabled={!activeSubjectId}
            onClick={markComplete}
          >
            {activeSubjectId && completed.has(activeSubjectId) ? "Completed" : "Mark Complete"}
          </Button>
          <Button
            variant="secondary"
            iconAfter="arrow-right"
            disabled={!nextSubject}
            onClick={() => nextSubject && setActiveSubjectId(nextSubject.id)}
          >
            Next lesson
          </Button>
        </div>

        {/* Back to dashboard — appears at the bottom of every lesson */}
        <div style={{
          marginTop: 24, paddingTop: 20,
          borderTop: "1px solid var(--color-stroke)",
          display: "flex", justifyContent: "center",
        }}>
          <Button
            variant="ghost"
            icon="layout-dashboard"
            onClick={() => router.push("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
