"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterPopover } from "@/components/ui/FilterPopover";
import { RowMenu } from "@/components/ui/RowMenu";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { ADMIN_COURSES_SEED } from "@/lib/mock/courses";

type StatusKey = "published" | "draft";

const STATUS_OPTIONS = [
  { value: "published" as const, label: "Published" },
  { value: "draft" as const, label: "Draft" },
];

export default function AdminCoursesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [statuses, setStatuses] = useState<StatusKey[]>(["published", "draft"]);

  const courses = useMemo(
    () => ADMIN_COURSES_SEED.filter((c) => statuses.includes(c.status)),
    [statuses],
  );
  const drafts = courses.filter((c) => c.status === "draft").length;

  const flash = (title: string, message?: string) =>
    dispatch(pushToast({ tone: "success", title, message }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Courses</h1>
          <div className="greeting">
            <b style={{ color: "var(--color-primary)" }}>{courses.length}</b> in catalog · {drafts} draft
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <FilterPopover
            options={STATUS_OPTIONS}
            selected={statuses}
            onChange={(next) => setStatuses(next)}
          />
          <Button icon="plus" onClick={() => router.push("/admin/courses/new")}>
            Add course
          </Button>
        </div>
      </div>

      <div className="tbl-card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Course</th>
              <th>Subject</th>
              <th>Structure</th>
              <th>Students</th>
              <th>Updated</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td style={{ verticalAlign: "middle" }}>
                  <span style={{ fontWeight: 600 }}>{c.title}</span>
                </td>
                <td style={{ verticalAlign: "middle" }}>{c.subject}</td>
                <td className="muted">
                  {c.semesters} sem · {c.lessons} lessons
                </td>
                <td>{c.students}</td>
                <td className="muted">{c.updated}</td>
                <td>
                  {c.status === "published" ? (
                    <Badge tone="success">Published</Badge>
                  ) : (
                    <Badge tone="warning">Draft</Badge>
                  )}
                </td>
                <td style={{ textAlign: "right" }}>
                  <RowMenu
                    ariaLabel={`Actions for ${c.title}`}
                    items={[
                      {
                        label: "Edit",
                        ico: "edit-3",
                        onClick: () => router.push(`/admin/courses/${c.id}`),
                      },
                      {
                        label: c.status === "published" ? "Unpublish" : "Publish",
                        ico: "upload-cloud",
                        onClick: () =>
                          flash(
                            c.status === "published" ? "Course unpublished" : "Course published",
                            c.title,
                          ),
                      },
                      {
                        label: "Archive",
                        ico: "trash-2",
                        onClick: () => flash("Course archived", c.title),
                        danger: true,
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty">
                    <h3>No courses match this filter</h3>
                    <p>Adjust the status filter to see more.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
