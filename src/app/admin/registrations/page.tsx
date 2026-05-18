"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RowMenu } from "@/components/ui/RowMenu";
import { RejectModal } from "@/components/enrollment/RejectModal";
import {
  useRegistrationQueue,
  isApproved,
  isRejected,
  type DateRange,
  type RegistrationItem,
} from "@/application/hooks/useRegistrationQueue";

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "1h",  label: "Last hour" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d",  label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(r: RegistrationItem) {
  const s = r.state ?? r.status;
  if (isApproved(s)) return <Badge tone="success">Approved</Badge>;
  if (isRejected(s)) return <Badge tone="error">Rejected</Badge>;
  // Default — backend filter is state=pending so any non-resolved row is pending
  return <Badge tone="warning">Pending</Badge>;
}

export default function AdminRegistrationsPage() {
  const Q = useRegistrationQueue();
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);

  // Top counts from the currently visible page.
  const pendingCount  = Q.items.filter(Q.isRowPending).length;
  const approvedCount = Q.items.filter((r) => isApproved(r.state ?? r.status)).length;
  const rejectedCount = Q.items.filter((r) => isRejected(r.state ?? r.status)).length;

  const pendingSelectedCount = [...Q.selected].filter((id) => {
    const row = Q.items.find((r) => r.id === id);
    return row && Q.isRowPending(row);
  }).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            Role Requests <span className="page-sub">· Member → Student access</span>
          </h1>
          <div className="greeting">
            <b style={{ color: "#152A24" }}>{Q.total}</b> total ·{" "}
            <b style={{ color: "#152A24" }}>{pendingCount}</b> awaiting approval.
            Approving grants the Student role — the applicant chooses a course + batch from
            Browse Courses afterwards.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Date range filter */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Icon name="calendar" size={15} style={{ position: "absolute", left: 12, pointerEvents: "none", color: "var(--color-body-green)" }} />
            <select
              className="input"
              style={{ height: 38, paddingLeft: 34, paddingRight: 16, width: "auto", fontSize: 14 }}
              value={Q.dateRange}
              onChange={(e) => Q.setDateRange(e.target.value as DateRange)}
            >
              {DATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <Button variant="secondary" icon="refresh-cw" onClick={Q.refresh}>
            Refresh
          </Button>
        </div>
      </div>

      {/* V2 Flow strip — Role request workflow */}
      <div className="flow-strip">
        <div className="flow-step active">
          <i>1</i> Role request <small>Awaits admin</small>
        </div>
        <div className="flow-arrow"><Icon name="arrow-right" size={14} /></div>
        <div className="flow-step">
          <i>2</i> Grant Student role <small>Adds to roles[]</small>
        </div>
        <div className="flow-arrow"><Icon name="arrow-right" size={14} /></div>
        <div className="flow-step">
          <i>3</i> Student picks a course <small>Separate enrolment approval</small>
        </div>
      </div>

      {/* Search */}
      <div className="audit-toolbar">
        <div className="audit-search">
          <Icon name="search" size={16} />
          <input
            placeholder="Search by name or email..."
            value={Q.search}
            onChange={(e) => Q.setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="tbl-card">
        <div className="tbl-bar" style={{ flexWrap: "wrap" }}>
          <span className="live"><i />Live data</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="badge badge--warning">{pendingCount} Pending</span>
            <span className="badge badge--success">{approvedCount} Approved</span>
            <span className="badge badge--error">{rejectedCount} Rejected</span>
          </div>
        </div>

        {/* Bulk action bar */}
        {pendingSelectedCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 16px",
            background: "var(--color-light-gray)",
            borderBottom: "1px solid var(--color-stroke)",
          }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600 }}>
              {pendingSelectedCount} selected
            </span>
            <Button size="sm" icon="check" onClick={Q.bulkApprove}>
              Approve all selected
            </Button>
            <Button size="sm" variant="ghost" onClick={Q.toggleAll}>
              Clear
            </Button>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table className="tbl" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={Q.allChecked} onChange={Q.toggleAll} aria-label="Select all pending" />
                </th>
                <th>Person</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {Q.loading && (
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
                      <h3>No registrations found</h3>
                      <p>
                        {Q.search
                          ? "Try a different name or email."
                          : Q.dateRange !== "all"
                            ? "Try a wider date range."
                            : "All registrations have been processed."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!Q.loading && Q.items.map((r) => {
                const fullName = `${r.firstName} ${r.lastName}`.trim();
                const pending = Q.isRowPending(r);
                return (
                  <tr key={r.id}>
                    <td>
                      {pending && (
                        <input
                          type="checkbox"
                          checked={Q.selected.has(r.id)}
                          onChange={() => Q.toggle(r.id)}
                          aria-label={`Select ${fullName}`}
                        />
                      )}
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                        <Avatar size="sm" name={fullName} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            title={fullName}
                            style={{
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "100%",
                            }}
                          >
                            {fullName}
                          </div>
                          <div
                            title={r.email}
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: 12,
                              color: "#41574A",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "100%",
                            }}
                          >
                            {r.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{statusBadge(r)}</td>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>
                      {formatDate(r.createdAt ?? (r as unknown as { submittedAt?: string }).submittedAt)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {pending && (
                        <RowMenu
                          ariaLabel={`Actions for ${fullName}`}
                          items={[
                            { label: "Approve", ico: "check-circle", onClick: () => Q.approve(r.id) },
                            { label: "Reject",  ico: "x-circle",     onClick: () => setRejectTarget({ id: r.id, name: fullName }), danger: true },
                          ]}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(Q.hasNext || Q.hasPrev) && (
          <div style={{
            display: "flex", justifyContent: "flex-end", gap: 8,
            padding: "12px 16px",
            borderTop: "1px solid var(--color-stroke)",
          }}>
            <Button size="sm" variant="secondary" icon="chevron-left"
              disabled={!Q.hasPrev} onClick={Q.prevPage}>Previous</Button>
            <Button size="sm" variant="secondary" iconAfter="chevron-right"
              disabled={!Q.hasNext} onClick={Q.nextPage}>Next</Button>
          </div>
        )}
      </div>

      <RejectModal
        open={!!rejectTarget}
        name={rejectTarget?.name ?? ""}
        onConfirm={(reason) => {
          if (rejectTarget) Q.reject(rejectTarget.id, reason);
          setRejectTarget(null);
        }}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
