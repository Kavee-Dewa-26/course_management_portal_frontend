"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useCourse } from "@/application/hooks/useCourses";
import { useCourseProgress } from "@/application/hooks/useProgress";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { pushToast } from "@/application/slices/uiSlice";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";
import { cn } from "@/lib/cn";
import { YouTubePlayer } from "@/components/course/YouTubePlayer";

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

/** A lesson augmented with the semester/subject context (for sidebar + nav). */
interface FlatLesson {
  lesson: Lesson;
  subjectId: string;
  subjectTitle: string;
  semesterId: string;
  semesterTitle: string;
  semesterIndex: number;
  subjectIndex: number;
  lessonIndex: number;
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

function extractYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const watch = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watch) return watch[1];
  const short = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const embed = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embed) return embed[1];
  return null;
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function StudentCourseViewerPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const sessionUser = useAppSelector((s) => s.session.user);

  const { course, loading } = useCourse(sessionUser ? params.courseId : undefined);

  // Real subject-level progress from the API.
  const {
    progress,
    completedSet: completedSubjectsApi,
    markComplete: markSubjectCompleteApi,
    trackAccess,
  } = useCourseProgress(sessionUser ? params.courseId : undefined);

  // Lesson-level state (UI tracks per-lesson; backend only tracks per-subject).
  const [lessonsBySubject, setLessonsBySubject] = useState<Record<string, Lesson[]>>({});
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Track which subjects we've already fired the backend "complete" call for
  // in this session (idempotent on backend but avoids duplicate toasts).
  const autoCompletedSubjects = useRef<Set<string>>(new Set());

  // localStorage key for per-course / per-user lesson completion.
  const progressKey = sessionUser && params.courseId
    ? `edupath.lessons.${sessionUser.uid}.${params.courseId}`
    : null;

  /* ── Restore + persist lesson-level completion in localStorage ───── */

  useEffect(() => {
    if (!progressKey) return;
    try {
      const raw = localStorage.getItem(progressKey);
      if (raw) setCompletedLessons(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }
  }, [progressKey]);

  useEffect(() => {
    if (!progressKey) return;
    try {
      localStorage.setItem(progressKey, JSON.stringify([...completedLessons]));
    } catch { /* ignore */ }
  }, [progressKey, completedLessons]);

  /* ── Fetch lessons for every subject in parallel (one call per subject) ── */

  useEffect(() => {
    const subjects = course?.semesters?.flatMap((s) => s.subjects ?? []) ?? [];
    if (subjects.length === 0) { setLessonsBySubject({}); return; }
    let cancelled = false;
    setLessonsLoading(true);
    Promise.allSettled(
      subjects.map(async (sub) => {
        const list = await apiRequest<Lesson[]>(`/subjects/${sub.id}/lessons`);
        return { subjectId: sub.id, lessons: list ?? [] };
      }),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, Lesson[]> = {};
      for (const r of results) {
        if (r.status === "fulfilled") {
          map[r.value.subjectId] = [...r.value.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
      }
      setLessonsBySubject(map);
    }).finally(() => { if (!cancelled) setLessonsLoading(false); });
    return () => { cancelled = true; };
  }, [course?.semesters]);

  /* ── Build a FLAT ordered list of every lesson (for prev/next nav) ── */

  const flatLessons: FlatLesson[] = useMemo(() => {
    if (!course?.semesters) return [];
    const out: FlatLesson[] = [];
    course.semesters
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((sem, semIndex) => {
        (sem.subjects ?? [])
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .forEach((sub, subIndex) => {
            (lessonsBySubject[sub.id] ?? []).forEach((lesson, lessonIndex) => {
              out.push({
                lesson,
                subjectId: sub.id,
                subjectTitle: sub.title,
                semesterId: sem.id,
                semesterTitle: sem.title,
                semesterIndex: semIndex,
                subjectIndex: subIndex,
                lessonIndex,
              });
            });
          });
      });
    return out;
  }, [course?.semesters, lessonsBySubject]);

  /* ── Active lesson + derived context ─────────────────────────────── */

  const activeIndex = activeLessonId
    ? flatLessons.findIndex((f) => f.lesson.id === activeLessonId)
    : -1;
  const active = activeIndex >= 0 ? flatLessons[activeIndex] : null;
  const prevLesson = activeIndex > 0 ? flatLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < flatLessons.length - 1 ? flatLessons[activeIndex + 1] : null;

  // Auto-select first lesson (or last accessed subject's first lesson) on load.
  useEffect(() => {
    if (activeLessonId || flatLessons.length === 0) return;
    const lastSubjectId = progress?.lastAccessedSubjectId;
    const candidate = lastSubjectId
      ? flatLessons.find((f) => f.subjectId === lastSubjectId)
      : flatLessons[0];
    setActiveLessonId((candidate ?? flatLessons[0]).lesson.id);
  }, [flatLessons, activeLessonId, progress?.lastAccessedSubjectId]);

  // Track access whenever active subject changes (background, fire & forget).
  useEffect(() => {
    if (!active) return;
    trackAccess(active.subjectId, active.semesterId);
  }, [active?.subjectId, active?.semesterId, trackAccess, active]);

  /* ── Subject completion derivation (lesson-based, backend-synced) ── */

  /**
   * When every lesson in a subject is locally complete, mark the subject
   * complete on the backend. Idempotent — auto-completedSubjects guards against
   * duplicate API hits per session.
   */
  const syncSubjectIfAllLessonsDone = useCallback(
    (subjectId: string, semesterId: string) => {
      const subjectLessons = lessonsBySubject[subjectId] ?? [];
      if (subjectLessons.length === 0) return;
      const allDone = subjectLessons.every((l) => completedLessons.has(l.id));
      if (!allDone) return;
      if (completedSubjectsApi.has(subjectId)) return;
      if (autoCompletedSubjects.current.has(subjectId)) return;
      autoCompletedSubjects.current.add(subjectId);
      markSubjectCompleteApi(subjectId, semesterId);
    },
    [lessonsBySubject, completedLessons, completedSubjectsApi, markSubjectCompleteApi],
  );

  // Mark current lesson complete (used by both manual click and "Next").
  const markCurrentLessonComplete = useCallback(() => {
    if (!active) return false;
    if (completedLessons.has(active.lesson.id)) return false;
    setCompletedLessons((prev) => new Set(prev).add(active.lesson.id));
    return true;
  }, [active, completedLessons]);

  // Watch completedLessons + active subject — sync to backend if last lesson finished.
  useEffect(() => {
    if (!active) return;
    syncSubjectIfAllLessonsDone(active.subjectId, active.semesterId);
  }, [completedLessons, active, syncSubjectIfAllLessonsDone]);

  // Manual Mark Complete button.
  const handleMarkComplete = () => {
    if (markCurrentLessonComplete()) {
      dispatch(pushToast({ tone: "success", title: "Lesson marked complete" }));
    }
  };

  // YouTube 90% → auto-mark current lesson complete.
  const handleVideoTime = (currentTime: number, duration: number) => {
    if (!active || !duration) return;
    if (completedLessons.has(active.lesson.id)) return;
    if (currentTime / duration < 0.9) return;
    if (markCurrentLessonComplete()) {
      dispatch(pushToast({ tone: "success", title: "Lesson marked complete automatically" }));
    }
  };

  // Next button: auto-mark current as complete, then advance.
  const handleNext = () => {
    if (!nextLesson) return;
    markCurrentLessonComplete();
    setActiveLessonId(nextLesson.lesson.id);
  };

  /* ── Progress percentage (lesson-based) ──────────────────────────── */

  const totalLessons = flatLessons.length;
  const completedLessonsCount = flatLessons.filter((f) => completedLessons.has(f.lesson.id)).length;
  const pct = totalLessons === 0 ? 0 : Math.round((completedLessonsCount / totalLessons) * 100);

  /* ── Attachment download ─────────────────────────────────────────── */

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

  /* ── Render ──────────────────────────────────────────────────────── */

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

  const activeLesson = active?.lesson ?? null;
  const activeTitle = activeLesson?.title || active?.subjectTitle || "";
  const youtubeId = extractYouTubeId(activeLesson?.youtubeVideoId);
  const embedUrl = youtubeId ? null : getYouTubeEmbedUrl(activeLesson?.youtubeVideoId);
  const activeLessonDone = activeLesson ? completedLessons.has(activeLesson.id) : false;

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
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
            {completedLessonsCount} of {totalLessons} lessons completed
          </div>
        </div>

        {/* Semester → Subject → Lesson tree */}
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
                const subjectLessons = lessonsBySubject[sub.id] ?? [];
                const allDone = subjectLessons.length > 0 && subjectLessons.every((l) => completedLessons.has(l.id));
                const hasActive = active?.subjectId === sub.id;
                return (
                  <div key={sub.id}>
                    <div
                      className={cn(
                        "subject",
                        hasActive && "active",
                        allDone && "completed",
                        !allDone && !hasActive && "notstarted",
                      )}
                      style={{ cursor: subjectLessons[0] ? "pointer" : "default" }}
                      onClick={() => subjectLessons[0] && setActiveLessonId(subjectLessons[0].id)}
                    >
                      <span className="dot">
                        <Icon name={allDone ? "check-circle" : hasActive ? "play-circle" : "circle"} size={14} />
                      </span>
                      {sub.title}
                    </div>
                    {/* Lessons nested under their subject */}
                    {subjectLessons.length > 0 && (
                      <div>
                        {subjectLessons.map((l) => {
                          const lessonDone = completedLessons.has(l.id);
                          const lessonActive = activeLessonId === l.id;
                          return (
                            <div
                              key={l.id}
                              onClick={() => setActiveLessonId(l.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 18px 6px 52px",
                                cursor: "pointer",
                                fontFamily: "var(--font-body)",
                                fontSize: 13,
                                color: lessonActive ? "var(--color-primary)" : "var(--color-body-green)",
                                background: lessonActive ? "rgba(188,233,85,0.12)" : "transparent",
                                fontWeight: lessonActive ? 600 : 400,
                              }}
                            >
                              <Icon
                                name={lessonDone ? "check-circle" : lessonActive ? "play-circle" : "circle"}
                                size={12}
                                style={{
                                  color: lessonDone ? "#4ade80" : lessonActive ? "#BCE955" : "var(--color-muted)",
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {l.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
          My Courses · {course.title}
          {active && <> · {active.semesterTitle} · {active.subjectTitle}</>}
        </div>
        <h1>{activeTitle || "Select a lesson"}</h1>

        {/* Player */}
        {youtubeId ? (
          <YouTubePlayer
            key={youtubeId}
            videoId={youtubeId}
            title={activeTitle}
            onProgress={handleVideoTime}
          />
        ) : embedUrl ? (
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
              <Icon name={lessonsLoading ? "loader" : "play-circle"} size={32} style={{ opacity: 0.4, marginBottom: 10 }} />
              <p style={{ margin: 0 }}>
                {lessonsLoading
                  ? "Loading lesson…"
                  : activeLesson
                    ? "No video for this lesson."
                    : "No lessons in this course yet."}
              </p>
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
            disabled={!prevLesson}
            onClick={() => prevLesson && setActiveLessonId(prevLesson.lesson.id)}
          >
            Previous lesson
          </Button>
          <Button
            icon={activeLessonDone ? "check-circle" : "check"}
            disabled={!activeLesson || activeLessonDone}
            onClick={handleMarkComplete}
          >
            {activeLessonDone ? "Completed" : "Mark Complete"}
          </Button>
          <Button
            variant="secondary"
            iconAfter="arrow-right"
            disabled={!nextLesson}
            onClick={handleNext}
          >
            Next lesson
          </Button>
        </div>

        {/* Back to dashboard */}
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
