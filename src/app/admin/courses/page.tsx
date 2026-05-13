"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { RowMenu } from "@/components/ui/RowMenu";
import { useCourses, type CourseSummary } from "@/application/hooks/useCourses";

type StateFilter = "all" | "draft" | "published" | "archived";

const STATE_OPTIONS: { value: StateFilter; label: string }[] = [
  { value: "all",       label: "All courses" },
  { value: "published", label: "Published only" },
  { value: "draft",     label: "Drafts only" },
  { value: "archived",  label: "Archived only" },
];

function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function stateBadge(state: CourseSummary["state"]) {
  if (state === "published") return <Badge tone="success">Published</Badge>;
  if (state === "draft")     return <Badge tone="warning">Draft</Badge>;
  if (state === "archived")  return <Badge tone="archive">Archived</Badge>;
  return <Badge tone="info">{state}</Badge>;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [toDelete, setToDelete] = useState<CourseSummary | null>(null);

  const Q = useCourses({
    limit: 25,
    state: stateFilter === "all" ? undefined : stateFilter,
  });

  const draftsOnPage = Q.items.filter((c) => c.state === "draft").length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Courses</h1>
          <div className="greeting">
            <b style={{ color: "var(--color-primary)" }}>{Q.total}</b> in catalog · {draftsOnPage} draft on this page
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Icon name="filter" size={15} style={{ position: "absolute", left: 12, pointerEvents: "none", color: "var(--color-body-green)" }} />
            <select
              className="input"
              style={{ height: 38, paddingLeft: 34, paddingRight: 16, width: "auto", fontSize: 14 }}
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value as StateFilter)}
            >
              {STATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <Button icon="plus" onClick={() => router.push("/admin/courses/new")}>
            Add course
          </Button>
        </div>
      </div>

      <div className="audit-toolbar">
        <div className="audit-search">
          <Icon name="search" size={16} />
          <input
            placeholder="Search by title..."
            value={Q.search}
            onChange={(e) => Q.setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="tbl-card">
        <div style={{ overflowX: "auto" }}>
          <table className="tbl" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>Course</th>
                <th>Structure</th>
                <th>Updated</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {Q.loading && Q.items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--color-muted)" }}>
                      <Icon name="loader" size={18} />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 14 }}>Loading…</span>
                    </div>
                  </td>
                </tr>
              )}
              {!Q.loading && Q.items.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <h3>No courses found</h3>
                      <p>{Q.search ? "Try a different search term." : "Click \"Add course\" to create the first one."}</p>
                    </div>
                  </td>
                </tr>
              )}
              {!Q.loading && Q.items.map((c) => (
                <tr key={c.id}>
                  <td style={{ verticalAlign: "middle", maxWidth: 360 }}>
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.title}
                    </div>
                  </td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {c.semesterCount} {c.semesterCount === 1 ? "module" : "modules"}
                  </td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {formatDate(c.updatedAt ?? c.publishedAt ?? c.createdAt)}
                  </td>
                  <td>{stateBadge(c.state)}</td>
                  <td style={{ textAlign: "right" }}>
                    <RowMenu
                      ariaLabel={`Actions for ${c.title}`}
                      items={[
                        {
                          label: "Edit",
                          ico: "edit-3",
                          onClick: () => router.push(`/admin/courses/${c.id}`),
                        },
                        // Publish/Unpublish — conditional on state
                        ...(c.state === "draft"
                          ? [{
                              label: "Publish",
                              ico: "upload-cloud",
                              onClick: () => Q.publish(c.id),
                            }]
                          : c.state === "published"
                            ? [{
                                label: "Unpublish",
                                ico: "download-cloud",
                                onClick: () => Q.unpublish(c.id),
                              }]
                            : []),
                        // Archive (not on archived ones)
                        ...(c.state !== "archived"
                          ? [{
                              label: "Archive",
                              ico: "archive",
                              onClick: () => Q.archive(c.id),
                            }]
                          : []),
                        {
                          label: "Delete",
                          ico: "trash-2",
                          onClick: () => setToDelete(c),
                          danger: true,
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(Q.hasNext || Q.hasPrev) && (
          <div style={{
            display: "flex", justifyContent: "flex-end", gap: 8,
            padding: "12px 16px",
            borderTop: "1px solid var(--color-stroke)",
          }}>
            <Button size="sm" variant="secondary" icon="chevron-left" disabled={!Q.hasPrev} onClick={Q.prevPage}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" iconAfter="chevron-right" disabled={!Q.hasNext} onClick={Q.nextPage}>
              Next
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={toDelete ? `Delete "${toDelete.title}"?` : ""}
        message="This soft-deletes the course. Enrolled students keep read-only access for 30 days. After that the course is permanently removed."
        confirmLabel="Delete course"
        destructive
        onConfirm={() => {
          if (toDelete) Q.remove(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
