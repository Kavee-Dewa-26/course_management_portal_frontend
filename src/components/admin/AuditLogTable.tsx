"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AUDIT_SEED } from "@/lib/mock/audit";
import { cn } from "@/lib/cn";

const CATS = ["All", "Approvals", "Admins", "Content", "Security", "Settings"] as const;
type Cat = (typeof CATS)[number];

export function AuditLogTable() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("All");

  const filtered = AUDIT_SEED.filter(
    (r) =>
      (cat === "All" || r.category === cat) &&
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
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" icon="calendar">
            Last 30 days
          </Button>
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
