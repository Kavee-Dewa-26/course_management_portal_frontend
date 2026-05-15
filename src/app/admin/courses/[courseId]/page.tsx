"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { pushToast } from "@/application/slices/uiSlice";
import { useCourse } from "@/application/hooks/useCourses";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";
import type { CourseSummary } from "@/application/hooks/useCourses";
import { CourseStructureEditor } from "@/components/course/CourseStructureEditor";

function stateBadge(state: string) {
  if (state === "published") return <Badge tone="success">Published</Badge>;
  if (state === "archived") return <Badge tone="archive">Archived</Badge>;
  return <Badge tone="warning">Draft</Badge>;
}

export default function EditCoursePage() {
  const router = useRouter();
  const pathname = usePathname();
  const base = pathname?.startsWith("/super-admin") ? "/super-admin" : "/admin";
  const dispatch = useAppDispatch();
  const params = useParams<{ courseId: string }>();

  const sessionUser = useAppSelector((s) => s.session.user);
  const { course, loading: courseLoading } = useCourse(sessionUser ? params.courseId : undefined);

  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);

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

  // Lifecycle action handlers
  const handlePublish = async () => {
    setLifecycleBusy(true);
    try {
      await apiRequest(`/courses/${course.id}/publish`, { method: "POST" });
      dispatch(pushToast({
        tone: "success",
        title: course.state === "archived" ? "Course restored & published" : "Course published",
      }));
      router.replace(`${base}/courses/${course.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const msg = err.status === 409 ? "Course can't be published from its current state."
          : err.status === 422 ? "Add at least one semester with subjects before publishing."
          : err.message;
        dispatch(pushToast({ tone: "warning", title: "Cannot publish", message: msg }));
      }
    } finally {
      setLifecycleBusy(false);
    }
  };

  const handleUnpublish = async () => {
    setLifecycleBusy(true);
    try {
      await apiRequest(`/courses/${course.id}/unpublish`, { method: "POST" });
      dispatch(pushToast({ tone: "success", title: "Course unpublished" }));
      router.replace(`${base}/courses/${course.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const msg = err.status === 409 ? "Only a PUBLISHED course can be unpublished." : err.message;
        dispatch(pushToast({ tone: "warning", title: "Cannot unpublish", message: msg }));
      }
    } finally {
      setLifecycleBusy(false);
    }
  };

  const handleArchive = async () => {
    setLifecycleBusy(true);
    try {
      await apiRequest(`/courses/${course.id}/archive`, { method: "POST" });
      dispatch(pushToast({ tone: "success", title: "Course archived" }));
      router.replace(`${base}/courses/${course.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const msg = err.status === 409 ? "Only a PUBLISHED course can be archived." : err.message;
        dispatch(pushToast({ tone: "warning", title: "Cannot archive", message: msg }));
      }
    } finally {
      setLifecycleBusy(false);
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
          <Button variant="ghost" icon="arrow-left" onClick={() => router.push(`${base}/courses`)}>
            Back
          </Button>
          {course.state === "draft" && (
            <Button icon="upload-cloud" onClick={handlePublish} disabled={lifecycleBusy}>
              {lifecycleBusy ? "Publishing…" : "Publish"}
            </Button>
          )}
          {course.state === "published" && (
            <>
              <Button variant="secondary" icon="eye-off" onClick={handleUnpublish} disabled={lifecycleBusy}>
                {lifecycleBusy ? "Unpublishing…" : "Unpublish"}
              </Button>
              <Button variant="secondary" icon="archive" onClick={handleArchive} disabled={lifecycleBusy}>
                {lifecycleBusy ? "Archiving…" : "Archive"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info banner — only for archived courses */}
      {course.state === "archived" && (
        <div style={{
          padding: "12px 16px",
          background: "var(--color-light-gray)",
          borderRadius: 12,
          border: "1px solid var(--color-stroke)",
          display: "flex", gap: 10, alignItems: "flex-start",
          fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)",
        }}>
          <Icon name="archive" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            This course is <b>archived</b>. Archived courses can only be deleted —
            the API does not support unarchiving. Enrolled students retain
            read-only access to the content for 30 days.
          </span>
        </div>
      )}

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

      <CourseStructureEditor
        courseId={course.id}
        initialSemesters={course.semesters ?? []}
      />

    </div>
  );
}
