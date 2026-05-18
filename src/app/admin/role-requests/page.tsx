"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import {
  listRoleRequests,
  decideRoleRequest,
  type RoleRequest,
  type RoleRequestStatus,
} from "@/lib/mock/roleRequests";

/**
 * V2 Role Requests queue — unified approval surface for member-→-student
 * applications. UI only, mock-driven (src/lib/mock/roleRequests.ts).
 *
 * The existing /admin/registrations and /admin/enrollments queues stay
 * untouched; this is an additional surface introduced by the V2 baseline.
 */

const FILTER_OPTIONS: { id: RoleRequestStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const ROLE_LABEL: Record<RoleRequest["requestedRole"], string> = {
  student: "Student",
  leader: "Cell Leader",
  g12: "G12 Leader",
};

function relativeTime(iso: string): string {
  const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

function statusBadge(s: RoleRequestStatus) {
  if (s === "approved") return <Badge tone="success">Approved</Badge>;
  if (s === "rejected") return <Badge tone="error">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
}

export default function AdminRoleRequestsPage() {
  const dispatch = useAppDispatch();
  const [tick, setTick] = useState(0); // bump to re-pull from mock store
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RoleRequestStatus | "all">("pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Re-read mock store after each mutation. The mock store mutates a
  // module-local array so re-rendering with a fresh listRoleRequests() call
  // gives back the updated state.
  const allRequests = useMemo(() => {
    void tick; // dependency
    return listRoleRequests();
  }, [tick]);

  const filtered = useMemo(() => {
    return allRequests
      .filter((r) => (filter === "all" ? true : r.status === filter))
      .filter((r) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
          r.applicantName.toLowerCase().includes(q) ||
          r.applicantEmail.toLowerCase().includes(q) ||
          (r.courseTitle?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [allRequests, filter, search]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    for (const r of allRequests) c[r.status] += 1;
    return c;
  }, [allRequests]);

  const pendingSelected = useMemo(() => {
    let n = 0;
    for (const id of selected) {
      const r = allRequests.find((x) => x.id === id);
      if (r?.status === "pending") n += 1;
    }
    return n;
  }, [selected, allRequests]);

  const allPendingChecked =
    filtered.length > 0 &&
    filtered.filter((r) => r.status === "pending").every((r) => selected.has(r.id));

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAllPending = () => {
    if (allPendingChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.filter((r) => r.status === "pending").map((r) => r.id)));
    }
  };

  const approve = (ids: string[]) => {
    for (const id of ids) decideRoleRequest(id, "approved");
    setTick((t) => t + 1);
    setSelected(new Set());
    dispatch(
      pushToast({
        tone: "success",
        title: ids.length === 1 ? "Request approved" : `${ids.length} requests approved`,
        message: "The applicant has been notified by email.",
      }),
    );
  };

  const reject = (ids: string[]) => {
    for (const id of ids) decideRoleRequest(id, "rejected", "Reviewed by admin.");
    setTick((t) => t + 1);
    setSelected(new Set());
    dispatch(
      pushToast({
        tone: "warning",
        title: ids.length === 1 ? "Request rejected" : `${ids.length} requests rejected`,
        message: "The applicant has been notified by email.",
      }),
    );
  };

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 20 }}>
        <h1>Role Requests</h1>
        <div className="greeting">
          Approve member-to-student role transitions. Applicants are emailed once decided.
        </div>
      </header>

      {/* Flow strip */}
      <div className="flow-strip">
        <div className="flow-step">
          <i>1</i> Member registers
        </div>
        <div className="flow-arrow">
          <Icon name="arrow-right" size={14} />
        </div>
        <div className="flow-step active">
          <i>2</i> Request student role <small>You&apos;re here</small>
        </div>
        <div className="flow-arrow">
          <Icon name="arrow-right" size={14} />
        </div>
        <div className="flow-step">
          <i>3</i> Student workspace
        </div>
      </div>

      {/* Counts strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <CountChip tone="warning" icon="clock" label={`${counts.pending} pending`} active={filter === "pending"} onClick={() => setFilter("pending")} />
        <CountChip tone="success" icon="check-circle" label={`${counts.approved} approved`} active={filter === "approved"} onClick={() => setFilter("approved")} />
        <CountChip tone="error" icon="x-circle" label={`${counts.rejected} rejected`} active={filter === "rejected"} onClick={() => setFilter("rejected")} />
        <CountChip tone="archive" icon="filter" label={`${allRequests.length} all`} active={filter === "all"} onClick={() => setFilter("all")} />
      </div>

      {/* Search + actions */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <Input placeholder="Search by applicant, email, or course…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "inline-flex", padding: 3, gap: 2, background: "var(--color-light-gray)", borderRadius: 9999 }}>
          {FILTER_OPTIONS.map((f) => (
            <button
              type="button"
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                border: 0,
                background: filter === f.id ? "#fff" : "transparent",
                color: filter === f.id ? "var(--color-primary)" : "var(--color-body-green)",
                padding: "6px 12px",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 12,
                borderRadius: 9999,
                cursor: "pointer",
                boxShadow: filter === f.id ? "0 1px 2px 0 rgba(21,42,36,0.08)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button variant="secondary-light" icon="download">
          Export CSV
        </Button>
      </div>

      {/* Bulk action bar */}
      {pendingSelected > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 18px",
            background: "rgba(188,233,85,0.18)",
            border: "1px solid rgba(188,233,85,0.5)",
            borderRadius: 12,
            marginBottom: 14,
          }}
        >
          <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-primary)" }}>
            <b>{pendingSelected}</b> pending request{pendingSelected === 1 ? "" : "s"} selected
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="ghost" onClick={() => setSelected(new Set())}>
              Cancel
            </Button>
            <Button variant="destructive" icon="x" onClick={() => reject(Array.from(selected).filter((id) => allRequests.find((r) => r.id === id)?.status === "pending"))}>
              Reject selected
            </Button>
            <Button icon="check" onClick={() => approve(Array.from(selected).filter((id) => allRequests.find((r) => r.id === id)?.status === "pending"))}>
              Approve selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="tbl-card" style={{ background: "#fff", border: "1px solid var(--color-stroke)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 14 }}>
            <thead style={{ background: "var(--color-stroke-2)" }}>
              <tr>
                <Th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={allPendingChecked}
                    onChange={toggleAllPending}
                    aria-label="Select all pending"
                    style={{ cursor: "pointer" }}
                  />
                </Th>
                <Th>Applicant</Th>
                <Th>Requested role</Th>
                <Th>Course / context</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
                <Th right>Action</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isPending = r.status === "pending";
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--color-stroke-2)" }}>
                    <Td>
                      {isPending ? (
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                          aria-label={`Select ${r.applicantName}`}
                          style={{ cursor: "pointer" }}
                        />
                      ) : (
                        <span style={{ color: "var(--color-muted)" }}>—</span>
                      )}
                    </Td>
                    <Td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar src={r.applicantAvatar} name={r.applicantName} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>{r.applicantName}</div>
                          <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{r.applicantEmail}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>{ROLE_LABEL[r.requestedRole]}</Td>
                    <Td muted>
                      {r.courseTitle ? (
                        <div>
                          <div>{r.courseTitle}</div>
                          {r.batchName && <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{r.batchName}</div>}
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-muted)" }}>—</span>
                      )}
                    </Td>
                    <Td muted>{relativeTime(r.submittedAt)}</Td>
                    <Td>{statusBadge(r.status)}</Td>
                    <Td right>
                      {isPending ? (
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <Button size="sm" variant="ghost" icon="x" onClick={() => reject([r.id])}>
                            Reject
                          </Button>
                          <Button size="sm" icon="check" onClick={() => approve([r.id])}>
                            Approve
                          </Button>
                        </div>
                      ) : r.decidedAt ? (
                        <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
                          Decided {relativeTime(r.decidedAt)}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-muted)" }}>—</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
                    {search.trim() ? "No requests match your search." : "No requests in this view."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function Th({ children, right, style }: { children: React.ReactNode; right?: boolean; style?: React.CSSProperties }) {
  return (
    <th
      style={{
        textAlign: right ? "right" : "left",
        padding: "12px 16px",
        fontWeight: 600,
        fontSize: 12,
        color: "var(--color-body-green)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, right, muted }: { children: React.ReactNode; right?: boolean; muted?: boolean }) {
  return (
    <td
      style={{
        textAlign: right ? "right" : "left",
        padding: "14px 16px",
        color: muted ? "var(--color-body-green)" : "var(--color-primary)",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

function CountChip({
  tone,
  icon,
  label,
  active,
  onClick,
}: {
  tone: "warning" | "success" | "error" | "archive";
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const bg = active
    ? tone === "warning"
      ? "var(--color-warning-bg)"
      : tone === "success"
      ? "var(--color-success-bg)"
      : tone === "error"
      ? "var(--color-error-bg)"
      : "var(--color-archive-bg)"
    : "#fff";
  const color = active
    ? tone === "warning"
      ? "var(--color-warning)"
      : tone === "success"
      ? "var(--color-success-deep)"
      : tone === "error"
      ? "var(--color-error-deep)"
      : "var(--color-archive)"
    : "var(--color-body-green)";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        background: bg,
        border: `1px solid ${active ? color : "var(--color-stroke)"}`,
        color,
        borderRadius: 9999,
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      <Icon name={icon} size={14} />
      {label}
    </button>
  );
}
