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
 * V2 course creation. The backend integration for **title + description** is
 * preserved (same POST /courses call). V2 adds an optional **initial Batch**
 * section so admins can spin up the first intake window in the same form —
 * Batches live in src/lib/mock/batches.ts as UI-only mock data until the
 * backend grows a /batches endpoint.
 *
 * Semester dates (open/close) and the rest of the course structure are
 * configured from the course-editor page after creation, via the
 * <SemesterScheduleSection /> and <CourseStructureEditor /> overlays.
 */
export default function NewCoursePage() {
  const router = useRouter();
  const pathname = usePathname();
  const base = pathname?.startsWith("/super-admin") ? "/super-admin" : "/admin";
  const dispatch = useAppDispatch();

  // Course core fields — these still go to the backend.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState("");
  const [descError, setDescError] = useState("");
  const [loading, setLoading] = useState(false);

  // V2 Batch fields — optional. UI only / mock-driven.
  const [addBatch, setAddBatch] = useState(true);
  const [batchName, setBatchName] = useState("");
  const [intakeStart, setIntakeStart] = useState("");
  const [intakeEnd, setIntakeEnd] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [batchState, setBatchState] = useState<BatchState>("draft");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError("");
    setDescError("");
    let valid = true;
    if (!title.trim()) {
      setTitleError("Course title is required.");
      valid = false;
    }
    if (!description.trim()) {
      setDescError("Description is required.");
      valid = false;
    }
    if (!valid) return;
    setLoading(true);
    try {
      // Step 1 — create the course via the existing integrated endpoint.
      const course = await apiRequest<CourseSummary>("/courses", {
        method: "POST",
        body: { title: title.trim(), description: description.trim() },
      });

      // Step 2 — if the admin filled in batch fields, seed the first batch
      // into the mock store. (Backend endpoint pending.)
      if (addBatch && batchName.trim() && intakeStart && intakeEnd) {
        createBatch({
          courseId: course.id,
          name: batchName.trim(),
          intakeStart,
          intakeEnd,
          state: batchState,
          capacity: typeof capacity === "number" ? capacity : 0,
        });
      }

      dispatch(
        pushToast({
          tone: "success",
          title: "Course created",
          message:
            addBatch && batchName.trim()
              ? "Course + first Batch ready. Add semesters before publishing."
              : "Starts as a draft — add Batches, semesters, and subjects before publishing.",
        }),
      );
      router.push(`${base}/courses/${course.id}`);
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
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>New course</h1>
          <div className="greeting">
            Set the course title, description, and optionally the first intake batch. Semesters,
            subjects, and lessons are added next from the course editor.
          </div>
        </div>
        <Button variant="ghost" icon="arrow-left" onClick={() => router.push(`${base}/courses`)}>
          Back
        </Button>
      </div>

      <form onSubmit={handleCreate}>
        {/* ── Step 1 — Course basics ───────────────────────────────── */}
        <div className="settings-card" style={{ maxWidth: 760 }}>
          <h2>Course basics</h2>
          <p className="settings-sub">
            The title must be unique across all courses. The description is shown to members and
            students browsing the Bible School catalogue.
          </p>
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
              placeholder="What this course covers and who it is for."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (descError) setDescError("");
              }}
            />
            {descError && <span className="hint" style={{ color: "#DC2626" }}>{descError}</span>}
          </div>
        </div>

        {/* ── Step 2 — First Batch / Intake (optional, V2) ─────────── */}
        <div className="settings-card" style={{ maxWidth: 760 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2>First Batch <span style={{ fontSize: 13, color: "var(--color-muted)", fontWeight: 500 }}>· optional</span></h2>
              <p className="settings-sub">
                Each Bible School course runs as one or more Batches — a fixed intake window with
                a capacity cap. Add the first Batch now, or skip and create one from the course
                editor later.
              </p>
            </div>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--color-body-green)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={addBatch}
                onChange={(e) => setAddBatch(e.target.checked)}
                style={{ accentColor: "var(--color-primary)" }}
              />
              Add first batch
            </label>
          </div>

          {addBatch && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <Input
                label="Batch name"
                placeholder="e.g. Intake 12 · Q2 2026"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
              />
              <Input
                label="Intake opens"
                type="date"
                value={intakeStart}
                onChange={(e) => setIntakeStart(e.target.value)}
              />
              <Input
                label="Intake closes"
                type="date"
                value={intakeEnd}
                onChange={(e) => setIntakeEnd(e.target.value)}
              />
              <Input
                label="Capacity"
                type="number"
                placeholder="60"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value === "" ? "" : Number(e.target.value))}
              />
              <div className="field">
                <label className="label">Initial state</label>
                <select
                  value={batchState}
                  onChange={(e) => setBatchState(e.target.value as BatchState)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--color-stroke)",
                    borderRadius: 10,
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "var(--color-primary)",
                    background: "#fff",
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer actions ───────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            maxWidth: 760,
            padding: "16px 22px",
            background: "#fff",
            border: "1px solid var(--color-stroke)",
            borderRadius: 14,
          }}
        >
          <Button variant="ghost" type="button" onClick={() => router.push(`${base}/courses`)} disabled={loading}>
            Cancel
          </Button>
          <Button icon="plus" type="submit" disabled={loading || !title.trim() || !description.trim()}>
            {loading ? "Creating…" : "Create course"}
          </Button>
        </div>
      </form>

      <div
        style={{
          maxWidth: 760,
          marginTop: 16,
          padding: "14px 18px",
          background: "var(--color-light-gray)",
          borderRadius: 12,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--color-body-green)",
        }}
      >
        <Icon name="info" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Course starts as a <b>draft</b>. Add at least one semester (with open / close dates) and
          one subject before you can publish.
        </span>
      </div>
    </div>
  );
}
