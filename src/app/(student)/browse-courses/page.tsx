"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { CourseCover } from "@/components/ui/CourseCover";
import { Icon } from "@/components/ui/Icon";
import { FEATURED_COURSES } from "@/lib/mock/courses";
import { useEnrollmentRequests, type EnrollmentStatus } from "@/application/hooks/useEnrollmentRequests";
import { cn } from "@/lib/cn";

const ALL_TAGS = ["All", ...Array.from(new Set(FEATURED_COURSES.map((c) => c.tag)))];

const STATUS_FILTERS: { id: EnrollmentStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "pending", label: "Pending" },
  { id: "enrolled", label: "Enrolled" },
];

export default function BrowseCoursesPage() {
  const router = useRouter();
  const { getStatus } = useEnrollmentRequests();

  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [activeStatus, setActiveStatus] = useState<EnrollmentStatus | "all">("all");

  const filtered = useMemo(() => {
    return FEATURED_COURSES.filter((c) => {
      const matchesTag = activeTag === "All" || c.tag === activeTag;
      const matchesStatus = activeStatus === "all" || getStatus(c.id) === activeStatus;
      const q = query.toLowerCase();
      const matchesQuery =
        q === "" ||
        c.title.toLowerCase().includes(q) ||
        (c.desc ?? "").toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q);
      return matchesTag && matchesStatus && matchesQuery;
    });
  }, [query, activeTag, activeStatus, getStatus]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Browse Courses</h1>
          <div className="greeting">
            <b style={{ color: "var(--color-primary)" }}>{FEATURED_COURSES.length}</b> courses
            available on the platform.
          </div>
        </div>
      </div>

      {/* Search + filters toolbar */}
      <div className="audit-toolbar" style={{ marginBottom: 20 }}>
        <div className="audit-search">
          <Icon name="search" size={16} />
          <input
            placeholder="Search courses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: 0, lineHeight: 1 }}
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={cn("chip", activeTag === tag && "active")}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Enrollment status chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveStatus(s.id)}
            className={cn("chip", activeStatus === s.id && "active")}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ marginBottom: 16, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)" }}>
        {filtered.length === 0 ? "No courses match." : `${filtered.length} course${filtered.length !== 1 ? "s" : ""}`}
      </div>

      {filtered.length > 0 ? (
        <div className="my-grid">
          {filtered.map((c) => {
            const status = getStatus(c.id);
            return (
              <article
                key={c.id}
                className="course-card my-card"
                style={{ cursor: "pointer" }}
                onClick={() => router.push(`/browse-courses/${c.id}`)}
              >
                <CourseCover kind={c.kind} emblem={c.emblem} tag={c.tag} />
                <div className="body">
                  <div className="meta">
                    <span><Icon name="clock" size={12} />{c.time}</span>
                    <span><Icon name="layers" size={12} />{c.lessons}</span>
                  </div>
                  <h3>{c.title}</h3>
                  {c.desc && (
                    <p style={{ fontSize: 12, color: "var(--color-body-green)", margin: "4px 0 8px", lineHeight: 1.5 }}>
                      {c.desc}
                    </p>
                  )}
                  <div style={{ marginTop: "auto" }}>
                    {status === "enrolled" && <Badge tone="success">Enrolled</Badge>}
                    {status === "pending" && <Badge tone="warning">Pending Approval</Badge>}
                    {status === "available" && <Badge tone="info">Available</Badge>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-body-green)", fontFamily: "var(--font-body)" }}>
          <Icon name="search" size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>No courses found</p>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>Try a different search or clear the filters.</p>
          <button
            onClick={() => { setQuery(""); setActiveTag("All"); setActiveStatus("all"); }}
            style={{ marginTop: 16, background: "none", border: "1px solid var(--color-stroke)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13 }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
