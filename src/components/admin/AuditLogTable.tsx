"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";
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

interface AuditEntry {
  id: string;
  actorUid: string;
  actorEmail?: string;
  category: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  createdAt: string;
  [key: string]: unknown;
}

interface PagedResponse {
  items: AuditEntry[];
  nextCursor: string | null;
  total: number;
}

function isoFromDateRange(range: DateRange): string | null {
  if (range === "all") return null;
  const days = parseInt(range);
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return iso;
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function AuditLogTable() {
  const sessionUser = useAppSelector((s) => s.session.user);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("All");
  const [dateRange, setDateRange] = useState<DateRange>("30");

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (reset: boolean) => {
    if (!sessionUser) return;
    setLoading(true);
    if (reset) setError(null);
    try {
      const params = new URLSearchParams({ limit: "25" });
      const from = isoFromDateRange(dateRange);
      if (from) params.append("from", from);
      if (cat !== "All") params.append("category", cat.toLowerCase());
      if (!reset && nextCursor) params.append("cursor", nextCursor);
      const url = `/audit-log?${params}`;
      // eslint-disable-next-line no-console
      console.log("[audit-log] requesting:", url);
      const data = await apiRequest<PagedResponse>(url);
      // eslint-disable-next-line no-console
      console.log("[audit-log] response:", data);
      const items = data.items ?? [];
      setEntries((prev) => reset ? items : [...prev, ...items]);
      setTotal(data.total ?? 0);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        // eslint-disable-next-line no-console
        console.warn("[audit-log] error:", err.status, err.code, err.message);
        if (err.status === 403) {
          setError("Insufficient permissions to view the audit log.");
        } else if (err.status === 404) {
          setError("Audit log endpoint not found. The backend may not have this feature enabled yet.");
        } else if (err.status === 500) {
          setError("Server error loading the audit log. Please try again.");
        } else if (err.status !== 401) {
          setError(err.message || "Failed to load audit log.");
        }
      } else {
        setError("Unexpected error loading audit log.");
      }
    } finally {
      setLoading(false);
    }
  }, [sessionUser, dateRange, cat, nextCursor]);

  // Refetch from page 1 whenever filters change.
  useEffect(() => {
    setEntries([]);
    setNextCursor(null);
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser, dateRange, cat]);

  // Client-side text search (filters already-loaded entries).
  const filtered = useMemo(() => {
    if (!q.trim()) return entries;
    const needle = q.trim().toLowerCase();
    return entries.filter((r) =>
      (r.actorEmail ?? "").toLowerCase().includes(needle) ||
      r.action.toLowerCase().includes(needle) ||
      (r.targetId ?? "").toLowerCase().includes(needle),
    );
  }, [entries, q]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Audit Log</h1>
          <div className="greeting">
            <b style={{ color: "var(--color-primary)" }}>
              {loading && entries.length === 0 ? "…" : total}
            </b>{" "}
            total entries · {entries.length} loaded
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
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="audit-toolbar">
        <div className="audit-search">
          <Icon name="search" size={16} />
          <input
            placeholder="Search actor email, action or target…"
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

      {error && (
        <div style={{
          padding: "12px 16px",
          marginBottom: 16,
          background: "rgba(220, 38, 38, 0.08)",
          border: "1px solid rgba(220, 38, 38, 0.3)",
          borderRadius: 12,
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--color-error, #DC2626)",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}>
          <Icon name="alert-triangle" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

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
            {loading && entries.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--color-muted)" }}>
                    <Icon name="loader" size={18} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14 }}>Loading…</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--color-muted)" }}>
                  No log entries match.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="muted" style={{ whiteSpace: "nowrap" }}>{formatRelative(r.createdAt)}</td>
                <td style={{ fontWeight: 600 }}>{r.actorEmail || r.actorUid.slice(0, 12) + "…"}</td>
                <td>{r.action}</td>
                <td>
                  <Badge
                    tone={
                      r.category === "security" || r.category === "Security"
                        ? "warning"
                        : r.category === "approvals" || r.category === "Approvals"
                          ? "success"
                          : "info"
                    }
                  >
                    {r.category}
                  </Badge>
                </td>
                <td className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {r.ip ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {nextCursor && !loading && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <Button variant="secondary" icon="chevron-down" onClick={() => fetchPage(false)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
