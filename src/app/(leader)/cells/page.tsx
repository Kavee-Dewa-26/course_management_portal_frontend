"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CellCard } from "@/components/cells/CellCard";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { listCells, listCellsForLeader, type CellType } from "@/lib/mock/cells";

const TYPE_FILTERS: { id: "all" | CellType; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "care", label: "Care" },
  { id: "outreach", label: "Outreach" },
  { id: "children", label: "Children" },
  { id: "g12", label: "G12" },
];

export default function LeaderCellsPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.session.user);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CellType>("all");

  const isG12 = user?.roles?.includes("g12") ?? false;
  const isAdmin = (user?.roles?.includes("admin") || user?.roles?.includes("super_admin")) ?? false;

  const cells = useMemo(() => {
    const base = isG12 || isAdmin ? listCells() : user ? listCellsForLeader(user.uid) : [];
    return base.filter((c) => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (search.trim() && !c.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [user, isG12, isAdmin, typeFilter, search]);

  const scopeNoun = isG12 || isAdmin ? "all" : "you lead";

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
            Cells
          </h1>
          <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
            <b style={{ color: "var(--color-primary)" }}>{cells.length}</b> cells {scopeNoun}.
          </p>
        </div>
        <Link href="/cells/new" className="btn btn--primary">
          <Icon name="plus" size={16} /> Create Cell
        </Link>
      </header>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Input placeholder="Search by cell name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "inline-flex", padding: 3, gap: 2, background: "var(--color-light-gray)", borderRadius: 9999 }}>
          {TYPE_FILTERS.map((f) => (
            <button
              type="button"
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              style={{
                border: 0,
                background: typeFilter === f.id ? "#fff" : "transparent",
                color: typeFilter === f.id ? "var(--color-primary)" : "var(--color-body-green)",
                padding: "6px 12px",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 12,
                borderRadius: 9999,
                cursor: "pointer",
                boxShadow: typeFilter === f.id ? "0 1px 2px 0 rgba(21,42,36,0.08)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <h2 style={{ margin: "8px 0 14px", fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 600, color: "var(--color-primary)" }}>
        My cells
      </h2>

      {cells.length === 0 ? (
        <EmptyState
          icon="users"
          title="No cells match"
          message={search || typeFilter !== "all" ? "Try clearing the filter or search." : "You don't lead any cells yet. Create one to get started."}
        />
      ) : (
        <div className="cell-grid">
          {cells.map((c) => (
            <CellCard key={c.id} cell={c} onClick={() => router.push(`/cells/${c.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
