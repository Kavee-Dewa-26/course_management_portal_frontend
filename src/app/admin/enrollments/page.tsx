"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FilterPopover } from "@/components/ui/FilterPopover";
import { Icon } from "@/components/ui/Icon";
import { QueueBulkbar } from "@/components/enrollment/QueueBulkbar";
import { RowActions } from "@/components/enrollment/RowActions";
import { StatusBadge } from "@/components/enrollment/StatusBadge";
import { useApprovalQueue, type ApprovalStatus } from "@/application/hooks/useApprovalQueue";
import { ENROLLMENTS_SEED } from "@/lib/mock/registrations";
import { avatarUrl } from "@/lib/kit";
import { downloadCsv } from "@/lib/csv";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";

const STATUS_OPTIONS = [
  { value: "pending" as const, label: "Pending" },
  { value: "approved" as const, label: "Approved" },
  { value: "rejected" as const, label: "Rejected" },
];

export default function AdminEnrollmentsPage() {
  const Q = useApprovalQueue(ENROLLMENTS_SEED, "Enrollment");
  const dispatch = useAppDispatch();
  const [statuses, setStatuses] = useState<ApprovalStatus[]>(["pending", "approved", "rejected"]);
  const pending = Q.rows.filter((r) => r.status === "pending").length;
  const visibleRows = useMemo(
    () => Q.rows.filter((r) => statuses.includes(r.status)),
    [Q.rows, statuses],
  );

  const handleExport = () => {
    const headers = ["Student", "Email", "Course", "Requested", "Status"];
    const rows = visibleRows.map((r) => [r.name, r.email, r.course, r.date, r.status]);
    downloadCsv("enrollments.csv", headers, rows);
    dispatch(pushToast({ tone: "success", title: "CSV downloaded" }));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            Enrollments <span className="page-sub">· course-access approvals</span>
          </h1>
          <div className="greeting">
            <b style={{ color: "#152A24" }}>{pending}</b> awaiting approval. The learner already
            has an account — approving unlocks course materials.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <FilterPopover
            options={STATUS_OPTIONS}
            selected={statuses}
            onChange={(next) => setStatuses(next)}
          />
          <Button variant="secondary" icon="download" onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flow-strip">
        <div className="flow-step done">
          <i>
            <Icon name="check" size={12} />
          </i>{" "}
          Sign-up <small>Approved</small>
        </div>
        <div className="flow-arrow">
          <Icon name="arrow-right" size={14} />
        </div>
        <div className="flow-step active">
          <i>2</i> Course request <small>Awaits admin approval</small>
        </div>
        <div className="flow-arrow">
          <Icon name="arrow-right" size={14} />
        </div>
        <div className="flow-step">
          <i>3</i> Studying <small>Course materials unlocked</small>
        </div>
      </div>

      <div className="tbl-card">
        <div className="tbl-bar">
          <span className="live">
            <i />
            Live · auto-refresh every 30s
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <span className="badge badge--warning">{pending} Pending</span>
            <span className="badge badge--success">
              {Q.rows.filter((r) => r.status === "approved").length} Approved
            </span>
            <span className="badge badge--error">
              {Q.rows.filter((r) => r.status === "rejected").length} Rejected
            </span>
          </div>
        </div>
        {Q.selected.size > 0 && (
          <QueueBulkbar
            selectedCount={Q.selected.size}
            onApprove={() => Q.approve([...Q.selected])}
            onReject={() => Q.reject([...Q.selected])}
            onCancel={() => Q.toggleAll()}
          />
        )}
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" checked={Q.allChecked} onChange={Q.toggleAll} />
              </th>
              <th>Student</th>
              <th>Course</th>
              <th>Requested</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={Q.selected.has(r.id)}
                    onChange={() => Q.toggle(r.id)}
                  />
                </td>
                <td>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar src={avatarUrl(r.avatar)} size="sm" name={r.name} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          color: "#41574A",
                        }}
                      >
                        {r.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{r.course}</td>
                <td className="muted">{r.date}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td style={{ textAlign: "right" }}>
                  <RowActions
                    status={r.status}
                    onApprove={() => Q.approve([r.id])}
                    onReject={() => Q.reject([r.id])}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
