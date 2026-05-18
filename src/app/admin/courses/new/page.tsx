"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";
import type { CourseSummary } from "@/application/hooks/useCourses";
import { createBatch, type BatchState } from "@/lib/mock/batches";

/**
 * V2 course builder — single-page flow that mirrors
 * src/ui_structure/v2/project/tccr-screens-admin.jsx (TNewCourse, lines 829-1036).
 *
 *   Course title + description  →  Batches (intake windows)
 *                              →  Semesters (start/end inside the batch window)
 *                              →  Subjects + Lessons (with YouTube + attachments)
 *
 * Backend integration: only the POST /courses (title + description) is real.
 * Everything else lives in component-local state and (for batches) the mock
 * store at src/lib/mock/batches.ts. The "Create course" button at the top
 * fires the API call and lets the admin continue building below; the bottom
 * action bar's "Save draft" / "Publish" are UI-only for now.
 */

interface Lesson {
  id: string;
  title: string;
  description: string;
  youtube: string;
  attachments: Array<{ name: string; size: string }>;
}

interface Subject {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Semester {
  id: string;
  title: string;
  start: string;
  end: string;
  subjects: Subject[];
}

interface Batch {
  id: string;
  name: string;
  start: string;
  end: string;
  cap: number | "";
}

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export default function NewCoursePage() {
  const router = useRouter();
  const pathname = usePathname();
  const base = pathname?.startsWith("/super-admin") ? "/super-admin" : "/admin";
  const dispatch = useAppDispatch();

  // Course (backend-integrated)
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [titleError, setTitleError] = useState("");
  const [descError, setDescError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  // Batches (local + mock store)
  const [batches, setBatches] = useState<Batch[]>([
    { id: uid("b"), name: "Intake A · Q2 2026", start: "", end: "", cap: 60 },
  ]);

  // Semesters → Subjects → Lessons (all local for now)
  const [semesters, setSemesters] = useState<Semester[]>([
    {
      id: uid("S"),
      title: "Semester 1",
      start: "",
      end: "",
      subjects: [
        {
          id: uid("su"),
          title: "Fundamentals",
          lessons: [{ id: uid("l"), title: "", description: "", youtube: "", attachments: [] }],
        },
      ],
    },
  ]);

  // ── Batch helpers ─────────────────────────────────────────────────
  const addBatch = () =>
    setBatches([
      ...batches,
      {
        id: uid("b"),
        name: `Intake ${String.fromCharCode(65 + batches.length)} · 2026`,
        start: "",
        end: "",
        cap: 60,
      },
    ]);
  const updBatch = (i: number, patch: Partial<Batch>) =>
    setBatches(batches.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const rmBatch = (i: number) => setBatches(batches.filter((_, j) => j !== i));

  // Earliest open and latest close across all batches — defines the legal
  // semester-date window.
  const minStart = batches.reduce<string>((m, b) => (!m || (b.start && b.start < m) ? b.start : m), "");
  const maxEnd = batches.reduce<string>((m, b) => (!m || (b.end && b.end > m) ? b.end : m), "");

  // ── Semester helpers ──────────────────────────────────────────────
  const addSem = () =>
    setSemesters([
      ...semesters,
      { id: uid("S"), title: `Semester ${semesters.length + 1}`, start: "", end: "", subjects: [] },
    ]);
  const updSem = (i: number, patch: Partial<Semester>) =>
    setSemesters(semesters.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const rmSem = (i: number) => setSemesters(semesters.filter((_, j) => j !== i));

  // ── Subject helpers ───────────────────────────────────────────────
  const addSubject = (i: number) =>
    updSem(i, {
      subjects: [...semesters[i].subjects, { id: uid("su"), title: "New subject", lessons: [] }],
    });
  const updSubject = (i: number, j: number, patch: Partial<Subject>) =>
    updSem(i, {
      subjects: semesters[i].subjects.map((s, k) => (k === j ? { ...s, ...patch } : s)),
    });
  const rmSubject = (i: number, j: number) =>
    updSem(i, { subjects: semesters[i].subjects.filter((_, k) => k !== j) });

  // ── Lesson helpers ────────────────────────────────────────────────
  const addLesson = (i: number, j: number) =>
    updSubject(i, j, {
      lessons: [
        ...semesters[i].subjects[j].lessons,
        { id: uid("l"), title: "", description: "", youtube: "", attachments: [] },
      ],
    });
  const updLesson = (i: number, j: number, k: number, patch: Partial<Lesson>) =>
    updSubject(i, j, {
      lessons: semesters[i].subjects[j].lessons.map((l, m) => (m === k ? { ...l, ...patch } : l)),
    });
  const rmLesson = (i: number, j: number, k: number) =>
    updSubject(i, j, { lessons: semesters[i].subjects[j].lessons.filter((_, m) => m !== k) });

  const addAttachment = (i: number, j: number, k: number, files: FileList | null) => {
    if (!files || !files.length) return;
    const current = semesters[i].subjects[j].lessons[k];
    const next = Array.from(files).map((f) => ({
      name: f.name,
      size: Math.round(f.size / 1024) + " KB",
    }));
    updLesson(i, j, k, { attachments: [...current.attachments, ...next] });
  };
  const rmAttachment = (i: number, j: number, k: number, m: number) =>
    updLesson(i, j, k, {
      attachments: semesters[i].subjects[j].lessons[k].attachments.filter((_, n) => n !== m),
    });

  // ── Course creation (backend) ─────────────────────────────────────
  const handleCreate = async () => {
    setTitleError("");
    setDescError("");
    let valid = true;
    if (!title.trim()) {
      setTitleError("Course title is required.");
      valid = false;
    }
    if (!desc.trim()) {
      setDescError("Description is required.");
      valid = false;
    }
    if (!valid) return;
    setCreating(true);
    try {
      const course = await apiRequest<CourseSummary>("/courses", {
        method: "POST",
        body: { title: title.trim(), description: desc.trim() },
      });
      setCreatedCourseId(course.id);
      dispatch(
        pushToast({
          tone: "success",
          title: "Course created as draft",
          message: "Now configure batches, semesters, and lessons below.",
        }),
      );
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === "COURSE_TITLE_EXISTS" || err.status === 409) {
          setTitleError("A course with this title already exists.");
        } else if (err.status === 400 && err.details) {
          if (err.details.title) setTitleError(Array.isArray(err.details.title) ? err.details.title[0] : String(err.details.title));
          if (err.details.description) setDescError(Array.isArray(err.details.description) ? err.details.description[0] : String(err.details.description));
        } else {
          dispatch(pushToast({ tone: "warning", title: "Failed to create course", message: err.message }));
        }
      }
    } finally {
      setCreating(false);
    }
  };

  // ── Save draft / Publish (UI only — pushes batches into mock store) ──
  const persistBatchesToMock = () => {
    if (!createdCourseId) return;
    for (const b of batches) {
      if (b.name.trim() && b.start && b.end) {
        createBatch({
          courseId: createdCourseId,
          name: b.name.trim(),
          intakeStart: b.start,
          intakeEnd: b.end,
          state: "draft",
          capacity: typeof b.cap === "number" ? b.cap : 0,
        });
      }
    }
  };

  const handleSaveDraft = () => {
    if (createdCourseId) persistBatchesToMock();
    dispatch(
      pushToast({
        tone: "success",
        title: "Draft saved",
        message: createdCourseId
          ? "Course + batches captured. Semesters and lessons are local until the API supports them."
          : "Create the course first (top card) before saving the full draft.",
      }),
    );
    if (createdCourseId) setTimeout(() => router.push(`${base}/courses/${createdCourseId}`), 700);
  };

  const handlePublish = () => {
    if (createdCourseId) persistBatchesToMock();
    dispatch(
      pushToast({
        tone: "success",
        title: createdCourseId ? "Course published" : "Create course first",
        message: createdCourseId
          ? "Visible in the public catalogue."
          : "Use the 'Create course' button at the top before publishing.",
      }),
    );
    if (createdCourseId) setTimeout(() => router.push(`${base}/courses/${createdCourseId}`), 700);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Create a course</h1>
          <div className="greeting">
            Title → batches → semesters → subjects. Semester dates auto-clamp to the batch window so
            students never see content outside an intake.
          </div>
        </div>
        <Button variant="secondary" icon="arrow-left" onClick={() => router.push(`${base}/courses`)}>
          Back to courses
        </Button>
      </div>

      {/* ── Course title + description (backend integration) ─────────── */}
      <section className="settings-card">
        <h2>Course title</h2>
        <p className="settings-sub">Must be unique. Changes take effect immediately.</p>
        <Input
          label="Title"
          placeholder="e.g. Foundations of Faith"
          value={title}
          error={titleError}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError("");
          }}
          autoFocus
        />
        <div className="field" style={{ marginTop: 8 }}>
          <label className="label" htmlFor="course-desc">
            Description
          </label>
          <textarea
            id="course-desc"
            className={`input${descError ? " input--error" : ""}`}
            style={{ height: 100, paddingTop: 10, resize: "vertical" }}
            placeholder="One paragraph that appears in the catalog."
            value={desc}
            onChange={(e) => {
              setDesc(e.target.value);
              if (descError) setDescError("");
            }}
          />
          {descError && <span className="hint" style={{ color: "#DC2626" }}>{descError}</span>}
        </div>
        <div className="form-actions" style={{ borderTop: "none" }}>
          <Button
            icon="save"
            disabled={!title.trim() || !desc.trim() || creating || !!createdCourseId}
            onClick={handleCreate}
          >
            {creating ? "Creating…" : createdCourseId ? "Course created" : "Create course"}
          </Button>
        </div>
        <p className="hint" style={{ marginTop: 8, color: "var(--color-body-green)" }}>
          Saves as a draft. Add batches, semesters and lessons below — or come back later from
          Courses → Edit.
        </p>
      </section>

      {/* ── Batches & intakes ────────────────────────────────────────── */}
      <section className="settings-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Batches &amp; intakes</h2>
            <p className="settings-sub" style={{ margin: "4px 0 0" }}>
              Each batch is a cohort with its own intake window. Past intakes auto-close.
            </p>
          </div>
          <Button size="sm" icon="plus" onClick={addBatch}>
            Add batch
          </Button>
        </div>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {batches.map((b, i) => (
            <div
              key={b.id}
              style={{ border: "1px solid var(--color-stroke)", borderRadius: 14, padding: 16 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input
                  label="Batch name"
                  value={b.name}
                  onChange={(e) => updBatch(i, { name: e.target.value })}
                />
                <Input
                  label="Capacity"
                  type="number"
                  value={b.cap}
                  onChange={(e) => updBatch(i, { cap: e.target.value === "" ? "" : Number(e.target.value) })}
                />
                <Input
                  label="Intake opens"
                  type="date"
                  value={b.start}
                  onChange={(e) => updBatch(i, { start: e.target.value })}
                />
                <Input
                  label="Intake closes"
                  type="date"
                  value={b.end}
                  onChange={(e) => updBatch(i, { end: e.target.value })}
                />
              </div>
              {batches.length > 1 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <Button size="sm" variant="ghost" icon="trash-2" onClick={() => rmBatch(i)}>
                    Remove batch
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Semesters → Subjects → Lessons ───────────────────────────── */}
      <section className="settings-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Semesters</h2>
            <p className="settings-sub" style={{ margin: "4px 0 0" }}>
              Start/end dates must fall inside the batch window{" "}
              {minStart && maxEnd && (
                <>
                  (<b>{minStart}</b> → <b>{maxEnd}</b>)
                </>
              )}
              . Closed semesters lock content automatically.
            </p>
          </div>
          <Button size="sm" icon="plus" onClick={addSem}>
            Add semester
          </Button>
        </div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {semesters.map((s, i) => {
            const outOfWindow =
              !!s.start &&
              !!s.end &&
              !!minStart &&
              !!maxEnd &&
              (s.start < minStart || s.end > maxEnd);

            return (
              <div
                key={s.id}
                style={{
                  border: `1px solid ${outOfWindow ? "var(--color-error)" : "var(--color-stroke)"}`,
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input
                    label="Semester title"
                    value={s.title}
                    onChange={(e) => updSem(i, { title: e.target.value })}
                  />
                  <div />
                  <Input
                    label="Start date"
                    type="date"
                    value={s.start}
                    min={minStart || undefined}
                    max={maxEnd || undefined}
                    onChange={(e) => updSem(i, { start: e.target.value })}
                  />
                  <Input
                    label="End date"
                    type="date"
                    value={s.end}
                    min={minStart || undefined}
                    max={maxEnd || undefined}
                    onChange={(e) => updSem(i, { end: e.target.value })}
                  />
                </div>
                {outOfWindow && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "var(--color-error-deep)",
                    }}
                  >
                    <Icon name="alert-triangle" size={12} /> Semester dates must be inside the batch
                    intake window.
                  </div>
                )}
                {semesters.length > 1 && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <Button size="sm" variant="ghost" icon="trash-2" onClick={() => rmSem(i)}>
                      Remove semester
                    </Button>
                  </div>
                )}

                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-stroke-2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, color: "var(--color-primary)" }}>
                      Subjects &amp; lessons
                    </span>
                    <Button size="sm" variant="secondary" icon="plus" onClick={() => addSubject(i)}>
                      Add subject
                    </Button>
                  </div>

                  {s.subjects.length === 0 && (
                    <div
                      style={{
                        padding: 14,
                        background: "var(--color-stroke-2)",
                        borderRadius: 10,
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        color: "var(--color-body-green)",
                      }}
                    >
                      No subjects yet. Add one to start building lessons.
                    </div>
                  )}

                  {s.subjects.map((sub, j) => (
                    <div
                      key={sub.id}
                      style={{
                        border: "1px solid var(--color-stroke)",
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 10,
                        background: "var(--color-page-bg, #FAFAFA)",
                      }}
                    >
                      <Input
                        label="Subject name"
                        value={sub.title}
                        onChange={(e) => updSubject(i, j, { title: e.target.value })}
                      />

                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-stroke)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--color-primary)" }}>
                            Lessons
                          </span>
                          <Button size="sm" variant="ghost" icon="plus" onClick={() => addLesson(i, j)}>
                            Add lesson
                          </Button>
                        </div>

                        {sub.lessons.length === 0 && (
                          <div
                            style={{
                              padding: 10,
                              fontFamily: "var(--font-body)",
                              fontSize: 12,
                              color: "var(--color-muted)",
                            }}
                          >
                            No lessons yet — add one above.
                          </div>
                        )}

                        {sub.lessons.map((l, k) => (
                          <div
                            key={l.id}
                            style={{
                              background: "#fff",
                              border: "1px solid var(--color-stroke)",
                              borderRadius: 10,
                              padding: 14,
                              marginBottom: 10,
                            }}
                          >
                            <div
                              style={{
                                fontFamily: "var(--font-body)",
                                fontWeight: 600,
                                fontSize: 12,
                                color: "var(--color-body-green)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: 10,
                              }}
                            >
                              Lesson {k + 1}
                            </div>
                            <Input
                              label="Lesson title"
                              placeholder="e.g. Growth"
                              value={l.title}
                              onChange={(e) => updLesson(i, j, k, { title: e.target.value })}
                            />
                            <div className="field" style={{ marginTop: 8 }}>
                              <label className="label">Description</label>
                              <textarea
                                className="input"
                                rows={2}
                                value={l.description}
                                onChange={(e) => updLesson(i, j, k, { description: e.target.value })}
                                placeholder="What this lesson covers."
                              />
                            </div>
                            <Input
                              label="YouTube URL"
                              placeholder="https://youtube.com/watch?v=…"
                              value={l.youtube}
                              onChange={(e) => updLesson(i, j, k, { youtube: e.target.value })}
                              hint="Lesson videos are embedded from YouTube only."
                            />
                            <div className="field" style={{ marginTop: 8 }}>
                              <label className="label">Attachments</label>
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: 16,
                                  border: "1.5px dashed var(--color-stroke)",
                                  borderRadius: 10,
                                  cursor: "pointer",
                                  background: "#fff",
                                  color: "var(--color-body-green)",
                                  fontFamily: "var(--font-body)",
                                  fontSize: 13,
                                  justifyContent: "center",
                                }}
                              >
                                <Icon name="upload-cloud" size={20} />
                                <div>
                                  <b style={{ color: "var(--color-primary)" }}>Upload from device</b>{" "}
                                  <span style={{ color: "var(--color-muted)" }}>PDF, DOC, slides, images</span>
                                </div>
                                <input
                                  type="file"
                                  multiple
                                  style={{ display: "none" }}
                                  onChange={(e) => {
                                    addAttachment(i, j, k, e.target.files);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                              {l.attachments.length > 0 && (
                                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                                  {l.attachments.map((a, m) => (
                                    <div
                                      key={m}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "8px 12px",
                                        background: "var(--color-stroke-2)",
                                        borderRadius: 8,
                                        fontFamily: "var(--font-body)",
                                        fontSize: 13,
                                      }}
                                    >
                                      <Icon name="file-text" size={14} />
                                      <span style={{ flex: 1, minWidth: 0, color: "var(--color-primary)" }}>{a.name}</span>
                                      <span style={{ color: "var(--color-muted)", fontSize: 12 }}>{a.size}</span>
                                      <button
                                        type="button"
                                        onClick={() => rmAttachment(i, j, k, m)}
                                        aria-label="Remove attachment"
                                        style={{
                                          background: "transparent",
                                          border: "none",
                                          cursor: "pointer",
                                          color: "var(--color-muted)",
                                          padding: 4,
                                        }}
                                      >
                                        <Icon name="x" size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                              <Button size="sm" variant="ghost" icon="trash-2" onClick={() => rmLesson(i, j, k)}>
                                Remove lesson
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <Button size="sm" variant="ghost" icon="trash-2" onClick={() => rmSubject(i, j)}>
                          Remove subject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer action bar ───────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 22px",
          background: "#fff",
          border: "1px solid var(--color-stroke)",
          borderRadius: 14,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <Button variant="ghost" onClick={() => router.push(`${base}/courses`)}>
          Cancel
        </Button>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" icon="save" onClick={handleSaveDraft}>
            Save draft
          </Button>
          <Button icon="upload-cloud" onClick={handlePublish}>
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
