"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";
import type { CourseSummary } from "@/application/hooks/useCourses";

export default function NewCoursePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState("");
  const [descError, setDescError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError("");
    setDescError("");
    let valid = true;
    if (!title.trim()) { setTitleError("Course title is required."); valid = false; }
    if (!description.trim()) { setDescError("Description is required."); valid = false; }
    if (!valid) return;
    setLoading(true);
    try {
      const course = await apiRequest<CourseSummary>("/courses", {
        method: "POST",
        body: { title: title.trim(), description: description.trim() },
      });
      dispatch(pushToast({ tone: "success", title: "Course created", message: "Starts as a draft — add semesters and subjects before publishing." }));
      router.push(`/admin/courses/${course.id}`);
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
          <div className="greeting">Give your course a unique title to get started.</div>
        </div>
        <Button variant="ghost" icon="arrow-left" onClick={() => router.push("/admin/courses")}>
          Back
        </Button>
      </div>

      <div className="settings-card" style={{ maxWidth: 560 }}>
        <h2>Course title</h2>
        <p className="settings-sub">
          You can add semesters, subjects and lessons after creating the course.
          The title must be unique across all courses.
        </p>
        <form onSubmit={handleCreate}>
          <Input
            label="Title"
            placeholder="e.g. Modern Backend Engineering"
            value={title}
            error={titleError}
            onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(""); }}
            autoFocus
          />
          <div className="field" style={{ marginTop: 8 }}>
            <label className="label" htmlFor="course-desc">Description</label>
            <textarea
              id="course-desc"
              className={`input${descError ? " input--error" : ""}`}
              style={{ height: 100, paddingTop: 10, resize: "vertical" }}
              placeholder="What this course covers and who it is for."
              value={description}
              onChange={(e) => { setDescription(e.target.value); if (descError) setDescError(""); }}
            />
            {descError && (
              <span className="hint" style={{ color: "#DC2626" }}>{descError}</span>
            )}
          </div>
          <div className="form-actions" style={{ borderTop: "none", marginTop: 8 }}>
            <Button variant="ghost" type="button" onClick={() => router.push("/admin/courses")} disabled={loading}>
              Cancel
            </Button>
            <Button icon="plus" type="submit" disabled={loading || !title.trim() || !description.trim()}>
              {loading ? "Creating…" : "Create course"}
            </Button>
          </div>
        </form>
      </div>

      {/* Hint */}
      <div style={{
        maxWidth: 560,
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
      }}>
        <Icon name="info" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Course starts as a <b>draft</b>. Add at least one semester with subjects before you can publish it.
        </span>
      </div>
    </div>
  );
}
