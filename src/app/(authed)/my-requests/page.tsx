"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRoleRequestsForApplicant, type RoleRequestStatus } from "@/lib/mock/roleRequests";

const STATUS_BADGE: Record<RoleRequestStatus, { tone: "warning" | "success" | "error"; label: string }> = {
  pending: { tone: "warning", label: "Pending" },
  approved: { tone: "success", label: "Approved" },
  rejected: { tone: "error", label: "Rejected" },
};

const ROLE_LABEL: Record<"student" | "leader" | "g12", string> = {
  student: "Student",
  leader: "Cell Leader",
  g12: "G12 Leader",
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export default function MyRequestsPage() {
  const user = useAppSelector((s) => s.session.user);

  const requests = useMemo(() => {
    if (!user) return [];
    return getRoleRequestsForApplicant(user.uid).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }, [user]);

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
          My Requests
        </h1>
        <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
          Track the status of every role request you&apos;ve submitted.
        </p>
      </header>

      {requests.length === 0 ? (
        <>
          <EmptyState
            icon="file-text"
            title="No requests yet"
            message="When you apply for a role like Student, your application will show up here so you can follow its review."
          />
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link href="/apply/student" className="btn btn--primary">
              <Icon name="arrow-right" size={16} /> Apply to become a Student
            </Link>
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {requests.map((r) => {
            const badge = STATUS_BADGE[r.status];
            return (
              <div
                key={r.id}
                id={r.id}
                style={{
                  background: "#fff",
                  border: "1px solid var(--color-stroke)",
                  borderRadius: 14,
                  padding: "18px 20px",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 600,
                        fontSize: 16,
                        color: "var(--color-primary)",
                      }}
                    >
                      {ROLE_LABEL[r.requestedRole]} role
                    </span>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </div>
                  {r.courseTitle && (
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)", marginBottom: 4 }}>
                      <Icon name="book-open" size={12} style={{ marginRight: 6, verticalAlign: "middle" }} />
                      {r.courseTitle}
                      {r.batchName && <span style={{ color: "var(--color-muted)" }}> · {r.batchName}</span>}
                    </div>
                  )}
                  {r.note && (
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-body-green)", marginTop: 6, fontStyle: "italic" }}>
                      &ldquo;{r.note}&rdquo;
                    </div>
                  )}
                  {r.status === "rejected" && r.decisionNote && (
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        color: "var(--color-error-deep)",
                        marginTop: 8,
                        padding: "8px 12px",
                        background: "var(--color-error-bg)",
                        borderRadius: 8,
                      }}
                    >
                      <Icon name="alert-circle" size={12} style={{ marginRight: 6, verticalAlign: "middle" }} />
                      {r.decisionNote}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-body-green)" }}>
                    Submitted {relativeTime(r.submittedAt)}
                  </span>
                  {r.decidedAt && (
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-muted)" }}>
                      Decided {relativeTime(r.decidedAt)}
                      {r.approverName && <> by {r.approverName}</>}
                    </span>
                  )}
                  {r.status === "pending" && (
                    <Link
                      href={`/apply/student/pending?req=${r.id}`}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        color: "var(--color-warning)",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      View status →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {requests.length > 0 && requests.every((r) => r.status !== "pending") && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Button variant="ghost" icon="arrow-right" onClick={() => (window.location.href = "/apply/student")}>
            Apply for another role
          </Button>
        </div>
      )}
    </div>
  );
}
