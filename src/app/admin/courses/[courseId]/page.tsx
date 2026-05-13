"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { useCourse } from "@/application/hooks/useCourses";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";
import type { CourseSummary } from "@/application/hooks/useCourses";

function stateBadge(state: string) {
  if (state === "published") return <Badge tone="success">Published</Badge>;
  if (state === "archived") return <Badge tone="archive">Archived</Badge>;
  return <Badge tone="warning">Draft</Badge>;
}

export default function EditCoursePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useParams<{ courseId: string }>();

  const { course, loading: courseLoading } = useCourse(params.courseId);

  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Pre-fill form when course loads.
  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDirty(false);
    }
  }, [course]);

  if (courseLoading) {
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

  const handleSaveTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || !title.trim()) return;
    setTitleError("");
    setSaving(true);
    try {
      const updated = await apiRequest<CourseSummary>(`/courses/${course.id}`, {
        method: "PATCH",
        body: { title: title.trim() },
      });
      setTitle(updated.title);
      setDirty(false);
      dispatch(pushToast({ tone: "success", title: "Title saved" }));
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 409) {
          setTitleError("A course with this title already exists.");
        } else if (err.status === 400 && err.details?.title) {
          setTitleError(Array.isArray(err.details.title) ? err.details.title[0] : String(err.details.title));
        } else {
          dispatch(pushToast({ tone: "warning", title: "Failed to save", message: err.message }));
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1>{course.title}</h1>
          {stateBadge(course.state)}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="ghost" icon="arrow-left" onClick={() => router.push("/admin/courses")}>
            Back
          </Button>
        </div>
      </div>

      {/* Title edit card */}
      <div className="settings-card">
        <h2>Course title</h2>
        <p className="settings-sub">The title must be unique. Changes take effect immediately.</p>
        <form onSubmit={handleSaveTitle}>
          <Input
            label="Title"
            value={title}
            error={titleError}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(e.target.value.trim() !== course.title);
              if (titleError) setTitleError("");
            }}
          />
          <div className="form-actions" style={{ borderTop: "none", marginTop: 8 }}>
            <Button
              variant="ghost"
              type="button"
              disabled={!dirty || saving}
              onClick={() => { setTitle(course.title); setDirty(false); setTitleError(""); }}
            >
              Cancel
            </Button>
            <Button
              icon="check"
              type="submit"
              disabled={!dirty || saving || !title.trim()}
            >
              {saving ? "Saving…" : "Save title"}
            </Button>
          </div>
        </form>
      </div>

      {/* Structure placeholder */}
      <div className="settings-card">
        <h2>Course structure</h2>
        <p className="settings-sub">
          Semesters, subjects and lessons are managed here.
          Full structure editing is coming in Sprint 6.
        </p>
        <div style={{ marginTop: 16 }}>
          {course.semesters && course.semesters.length > 0 ? (
            <div style={{ display: "grid", gap: 10 }}>
              {course.semesters.map((sem, i) => (
                <div
                  key={sem.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: "var(--color-light-gray)",
                    borderRadius: 10,
                    border: "1px solid var(--color-stroke)",
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(188,233,85,0.15)",
                    border: "1.5px solid rgba(188,233,85,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12,
                    color: "#BCE955", flexShrink: 0,
                  }}>{i + 1}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontFamily: "var(--font-body)" }}>{sem.title}</div>
                    <div style={{ fontSize: 12, color: "var(--color-body-green)", fontFamily: "var(--font-body)" }}>
                      {sem.subjectCount ?? sem.subjects?.length ?? 0} {(sem.subjectCount ?? sem.subjects?.length ?? 0) === 1 ? "subject" : "subjects"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: "32px 16px",
              color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: 14,
            }}>
              <Icon name="layers" size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
              <p style={{ margin: 0 }}>No semesters yet.</p>
              <p style={{ margin: "4px 0 0", fontSize: 12 }}>Semester management is coming in Sprint 6.</p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{
        marginTop: 8, padding: "12px 16px",
        background: "var(--color-light-gray)",
        borderRadius: 12,
        display: "flex", gap: 10, alignItems: "flex-start",
        fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)",
      }}>
        <Icon name="info" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Use the <b>Courses</b> list to Publish, Unpublish, Archive or Delete this course.
          Structure editing (semesters / subjects / lessons) lands in Sprint 6.
        </span>
      </div>
    </div>
  );
}
