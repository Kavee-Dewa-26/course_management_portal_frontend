"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AUDIT_SEED } from "@/lib/mock/audit";
import { cn } from "@/lib/cn";

const CATS = ["All", "Approvals", "Admins", "Content", "Security", "Settings"] as const;
type Cat = (typeof CATS)[number];
type DateRange = "7" | "30" | "90" | "all";

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

function parseDaysAgo(when: string): number {
  const w = when.toLowerCase();
  if (w.startsWith("today")) return 0;
  if (w === "yesterday") return 1;
  const d = w.match(/(\d+)\s*d\s*ago/);
  if (d) return parseInt(d[1]);
  const wk = w.match(/(\d+)\s*w\s*ago/);
  if (wk) return parseInt(wk[1]) * 7;
  return 0;
}

export function AuditLogTable() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("All");
  const [dateRange, setDateRange] = useState<DateRange>("30");

  const filtered = AUDIT_SEED.filter(
    (r) =>
      (cat === "All" || r.category === cat) &&
      (dateRange === "all" || parseDaysAgo(r.when) <= parseInt(dateRange)) &&
      (q === "" || (r.actor + r.action).toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Audit Log</h1>
          <div className="greeting">
            Every administrative action: sign-ins, approvals, content edits, role changes.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Icon
              name="calendar"
              size={15}
              style={{ position: "absolute", left: 12, pointerEvents: "none", color: "var(--color-body-green)" }}
            />
            <select
              className="input"
              style={{ height: 38, paddingLeft: 34, paddingRight: 16, width: "auto", fontSize: 14 }}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
            >
              {DATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <Button variant="secondary" icon="download">
            Export CSV
          </Button>
        </div>
      </div>

      <div className="audit-toolbar">
        <div className="audit-search">
          <Icon name="search" size={16} />
          <input
            placeholder="Search actor, action or target…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="audit-cats">
          {CATS.map((c) => (
            <button
              key={c}
              className={cn("chip", cat === c && "active")}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="tbl-card">
        <table className="tbl">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Category</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td className="muted">{r.when}</td>
                <td style={{ fontWeight: 600 }}>{r.actor}</td>
                <td>{r.action}</td>
                <td>
                  <Badge
                    tone={
                      r.category === "Security"
                        ? "warning"
                        : r.category === "Approvals"
                          ? "success"
                          : "info"
                    }
                  >
                    {r.category}
                  </Badge>
                </td>
                <td
                  className="muted"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
                >
                  {r.ip}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", padding: 32, color: "#41574A" }}
                >
                  No log entries match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
