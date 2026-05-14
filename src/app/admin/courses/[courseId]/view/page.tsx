"use client";

/**
 * Admin / Super-admin Course View page
 * ─────────────────────────────────────
 * Shows the FULL course content for staff (semesters → subjects → lessons
 * with video, description, and attachments). Students only see semesters +
 * subjects in their browse view (lessons are gated behind enrollment).
 *
 * APIs used:
 *  • GET  /courses/:id                   → course + semesters + subjects
 *  • GET  /subjects/:id/lessons          → lessons per subject (one call per subject)
 *  • GET  /attachments/:id/download-url  → on attachment download click
 */

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useCourse } from "@/application/hooks/useCourses";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { pushToast } from "@/application/slices/uiSlice";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";

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

/* ── Helpers ─────────────────────────────────────────────────────────── */

function stateBadge(state: string) {
  if (state === "published") return <Badge tone="success">Published</Badge>;
  if (state === "archived")  return <Badge tone="archive">Archived</Badge>;
  return <Badge tone="warning">Draft</Badge>;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

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

/* ── Component ───────────────────────────────────────────────────────── */

export default function AdminCourseViewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const base = pathname?.startsWith("/super-admin") ? "/super-admin" : "/admin";
  const dispatch = useAppDispatch();
  const params = useParams<{ courseId: string }>();
  const sessionUser = useAppSelector((s) => s.session.user);
  const { course, loading, error } = useCourse(sessionUser ? params.courseId : undefined);

  // Lessons keyed by subjectId. Each list is fetched in parallel after course loads.
  const [lessonsBySubject, setLessonsBySubject] = useState<Record<string, Lesson[]>>({});
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (error?.status === 404) {
      dispatch(pushToast({ tone: "warning", title: "Course not found" }));
      router.replace(`${base}/courses`);
    }
  }, [error, router, dispatch, base]);

  // Fetch lessons for every subject in parallel once the course tree is loaded.
  useEffect(() => {
    const subjects = course?.semesters?.flatMap((s) => s.subjects ?? []) ?? [];
    if (subjects.length === 0) { setLessonsBySubject({}); return; }
    let cancelled = false;
    setLessonsLoading(true);
    Promise.allSettled(
      subjects.map(async (sub) => {
        const list = await apiRequest<Lesson[]>(`/subjects/${sub.id}/lessons`);
        return { subjectId: sub.id, list: list ?? [] };
      }),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, Lesson[]> = {};
      for (const r of results) {
        if (r.status === "fulfilled") map[r.value.subjectId] = r.value.list;
      }
      setLessonsBySubject(map);
    }).finally(() => { if (!cancelled) setLessonsLoading(false); });
    return () => { cancelled = true; };
  }, [course?.semesters]);

  const downloadAttachment = async (attachmentId: string) => {
    setDownloadingId(attachmentId);
    try {
      const { downloadUrl } = await apiRequest<{ downloadUrl: string; expiresAt: string }>(
        `/attachments/${attachmentId}/download-url`,
      );
      window.open(downloadUrl, "_blank");
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
      <div className="page">
        <div style={{ textAlign: "center", padding: 48, color: "var(--color-body-green)" }}>
          <Icon name="loader" size={22} style={{ opacity: 0.4 }} />
          <p style={{ marginTop: 12, fontFamily: "var(--font-body)" }}>Loading course…</p>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const totalSubjects = course.semesters?.reduce(
    (sum, s) => sum + (s.subjectCount ?? s.subjects?.length ?? 0), 0,
  ) ?? 0;
  const totalLessons = Object.values(lessonsBySubject).reduce((sum, ls) => sum + ls.length, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1>{course.title}</h1>
          {stateBadge(course.state)}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="ghost" icon="arrow-left" onClick={() => router.push(`${base}/courses`)}>
            Back
          </Button>
          <Button variant="secondary" icon="edit-3" onClick={() => router.push(`${base}/courses/${course.id}`)}>
            Edit
          </Button>
        </div>
      </div>

      {/* Meta card */}
      <div className="settings-card">
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", fontFamily: "var(--font-body)", fontSize: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted)", marginBottom: 4 }}>Semesters</div>
            <div style={{ fontWeight: 600 }}>{course.semesterCount}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted)", marginBottom: 4 }}>Subjects</div>
            <div style={{ fontWeight: 600 }}>{totalSubjects}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted)", marginBottom: 4 }}>Lessons</div>
            <div style={{ fontWeight: 600 }}>{lessonsLoading ? "…" : totalLessons}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted)", marginBottom: 4 }}>Published</div>
            <div style={{ fontWeight: 600 }}>{formatDate(course.publishedAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted)", marginBottom: 4 }}>Last updated</div>
            <div style={{ fontWeight: 600 }}>{formatDate(course.updatedAt)}</div>
          </div>
        </div>
      </div>

      {/* Full structure (semesters → subjects → lessons) */}
      <div className="settings-card">
        <h2>Course structure</h2>
        {!course.semesters || course.semesters.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: 14 }}>
            <Icon name="layers" size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0 }}>No semesters added yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {course.semesters.map((sem, si) => (
              <div key={sem.id} style={{ border: "1px solid var(--color-stroke)", borderRadius: 12, overflow: "hidden" }}>
                {/* Semester header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "var(--color-light-gray)" }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(188,233,85,0.15)", border: "1px solid rgba(188,233,85,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12, color: "#BCE955", flexShrink: 0 }}>{si + 1}</span>
                  <div style={{ fontWeight: 600, fontFamily: "var(--font-body)" }}>{sem.title}</div>
                  <div style={{ marginLeft: "auto" }}>
                    <Badge tone="info">
                      {sem.subjectCount ?? sem.subjects?.length ?? 0} {(sem.subjectCount ?? sem.subjects?.length ?? 0) === 1 ? "subject" : "subjects"}
                    </Badge>
                  </div>
                </div>

                {/* Subjects + lessons */}
                {sem.subjects?.map((sub, subi) => {
                  const lessons = lessonsBySubject[sub.id] ?? [];
                  return (
                    <div key={sub.id} style={{ borderTop: "1px solid var(--color-stroke)" }}>
                      {/* Subject row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 10px 28px", background: "var(--color-surface-2)" }}>
                        <Icon name="bookmark" size={13} style={{ color: "var(--color-muted)", flexShrink: 0 }} />
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600 }}>
                          <span style={{ color: "var(--color-muted)", marginRight: 6, fontWeight: 400 }}>{si + 1}.{subi + 1}</span>
                          {sub.title}
                        </div>
                        <div style={{ marginLeft: "auto", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-muted)" }}>
                          {lessonsLoading && !lessonsBySubject[sub.id]
                            ? <Icon name="loader" size={13} />
                            : `${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"}`}
                        </div>
                      </div>

                      {/* Lessons under the subject */}
                      {lessons.length === 0 && !lessonsLoading ? (
                        <div style={{ padding: "10px 16px 12px 56px", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-muted)", fontStyle: "italic" }}>
                          No lessons yet.
                        </div>
                      ) : (
                        lessons.map((l, li) => {
                          const embedUrl = getYouTubeEmbedUrl(l.youtubeVideoId);
                          return (
                            <div key={l.id} style={{ padding: "12px 16px 16px 56px", borderTop: "1px dashed var(--color-stroke)" }}>
                              {/* Lesson header */}
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--color-light-gray)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--color-body-green)", flexShrink: 0 }}>{li + 1}</span>
                                <div style={{ fontWeight: 600, fontFamily: "var(--font-body)", fontSize: 14 }}>{l.title}</div>
                              </div>

                              {/* Lesson video preview */}
                              {embedUrl && (
                                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 10, marginBottom: 10, maxWidth: 540 }}>
                                  <iframe
                                    src={embedUrl}
                                    title={l.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                                  />
                                </div>
                              )}

                              {/* Lesson description */}
                              {l.description && (
                                <p style={{ margin: "4px 0 10px", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)", lineHeight: 1.6 }}>
                                  {l.description}
                                </p>
                              )}

                              {/* Attachments */}
                              {(l.attachmentIds?.length ?? 0) > 0 && (
                                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    <Icon name="paperclip" size={11} /> {l.attachmentIds!.length} attachment{l.attachmentIds!.length > 1 ? "s" : ""}
                                  </div>
                                  {(l.attachmentIds ?? []).map((attId) => (
                                    <div key={attId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "1px solid var(--color-stroke)", borderRadius: 8, background: "var(--color-surface)" }}>
                                      <Icon name="file-text" size={14} style={{ color: "var(--color-body-green)", flexShrink: 0 }} />
                                      <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-body-green)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {attId.slice(0, 16)}…
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => downloadAttachment(attId)}
                                        disabled={downloadingId === attId}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-body-green)", padding: 4 }}
                                      >
                                        <Icon name={downloadingId === attId ? "loader" : "download"} size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* No video / description fallback */}
                              {!embedUrl && !l.description && (!l.attachmentIds || l.attachmentIds.length === 0) && (
                                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-muted)", fontStyle: "italic" }}>
                                  No content yet for this lesson.
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}

                {(!sem.subjects || sem.subjects.length === 0) && (
                  <div style={{ padding: "8px 16px 8px 28px", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-muted)", borderTop: "1px solid var(--color-stroke)" }}>
                    No subjects
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
