"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCell, useCellMembers } from "@/application/hooks/useCell";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { apiRequest } from "@/infrastructure/api/request";

/**
 * Cell Members page — Leader / G12 / Admin only.
 *
 * Add members: search existing TCCR users by name → select → POST /cells/:id/members.
 * The user search (GET /users?search=) is used when available; backend is still
 * implementing the full directory search — for now shows the search input.
 *
 * Remove: DELETE /cells/:id/members/:uid with confirmation.
 */

interface UserResult { uid: string; firstName: string; lastName: string; email: string; profilePhotoUrl?: string | null; }

export default function CellMembersPage() {
  const router = useRouter();
  const params = useParams();
  const cellId = (params?.cellId as string) ?? "";
  const user = useAppSelector((s) => s.session.user);
  const canEdit = (user?.roles?.includes("leader") || user?.roles?.includes("g12") || user?.roles?.includes("super_admin") || user?.roles?.includes("admin")) ?? false;

  const { cell, loading, refetch } = useCell(cellId || undefined);
  const { busy, addMembers, removeMember } = useCellMembers(cellId || undefined);

  const [search, setSearch]           = useState("");
  const [results, setResults]         = useState<UserResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const [selected, setSelected]       = useState<UserResult[]>([]);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const members = (cell?.members ?? []).map((m) => ({
    uid: m.uid ?? String(m),
    displayName: m.displayName ?? String(m),
  }));

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await apiRequest<{ items?: UserResult[] } | UserResult[]>(
        `/users?search=${encodeURIComponent(search.trim())}&limit=10`,
      );
      const list = Array.isArray(res) ? res : ((res as { items?: UserResult[] }).items ?? []);
      // Filter out users already in the cell
      const memberUids = new Set(members.map((m) => m.uid));
      setResults(list.filter((u) => !memberUids.has(u.uid)));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (u: UserResult) => {
    setSelected((prev) =>
      prev.some((s) => s.uid === u.uid)
        ? prev.filter((s) => s.uid !== u.uid)
        : [...prev, u],
    );
  };

  const handleAdd = async () => {
    if (!selected.length) return;
    const res = await addMembers(selected.map((u) => u.uid));
    if (res) {
      setSelected([]);
      setResults([]);
      setSearch("");
      refetch();
    }
  };

  const handleRemove = async (uid: string) => {
    const ok = await removeMember(uid);
    if (ok) { setConfirmRemove(null); refetch(); }
  };

  if (loading) return <div className="page" style={{ textAlign: "center", padding: 48 }}><Icon name="loader" size={24} style={{ color: "var(--color-muted)" }} /></div>;
  if (!cell) return <EmptyState icon="alert-circle" title="Cell not found" />;

  return (
    <div className="page">
      <Button variant="ghost" size="sm" icon="arrow-left" onClick={() => router.push(`/cells/${cell.id}`)}>
        Back to {cell.name}
      </Button>

      <header className="page-header" style={{ marginTop: 12, marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-primary)" }}>
          Members of {cell.name}
        </h1>
        <p style={{ margin: "6px 0 0", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body-green)" }}>
          {cell.memberCount} member{cell.memberCount === 1 ? "" : "s"}
        </p>
      </header>

      {/* ── Add members section (Leader / G12 / Admin only) ─── */}
      {canEdit && (
        <div className="settings-card" style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 8 }}>Add members</h2>
          <p style={{ margin: "0 0 14px", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)" }}>
            Search for existing TCCR members by name or email and add them to this cell.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <Input placeholder="Search by name or email…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
            </div>
            <Button variant="secondary" icon="search" disabled={searching || !search.trim()} onClick={handleSearch}>
              {searching ? "Searching…" : "Search"}
            </Button>
          </div>

          {/* Search results */}
          {results.length > 0 && (
            <div style={{ marginTop: 12, border: "1px solid var(--color-stroke)", borderRadius: 10, overflow: "hidden" }}>
              {results.map((u) => {
                const isSelected = selected.some((s) => s.uid === u.uid);
                return (
                  <div key={u.uid} onClick={() => toggleSelect(u)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: isSelected ? "rgba(188,233,85,0.12)" : "#fff", cursor: "pointer", borderBottom: "1px solid var(--color-stroke-2)" }}>
                    <Avatar src={u.profilePhotoUrl ?? undefined} name={`${u.firstName} ${u.lastName}`} size="sm" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "var(--color-primary)" }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-muted)" }}>{u.email}</div>
                    </div>
                    {isSelected && <Icon name="check-circle" size={18} style={{ color: "var(--color-accent)" }} />}
                  </div>
                );
              })}
            </div>
          )}

          {selected.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <Button icon="user-plus" disabled={busy} onClick={handleAdd}>
                Add {selected.length} member{selected.length === 1 ? "" : "s"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Current members list ──────────────────────────── */}
      <div className="settings-card">
        <h2 style={{ marginBottom: 14 }}>Current members</h2>
        {members.length === 0 ? (
          <EmptyState icon="users" title="No members yet" message="Use the search above to add members to this cell." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {members.map((m) => {
              const isLeader = m.uid === cell.leaderUid;
              return (
                <div key={m.uid} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "10px 14px", background: "#FAFAFA", borderRadius: 10 }}>
                  <Avatar name={m.displayName} size="sm" />
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--color-primary)" }}>
                    {m.displayName}
                    {isLeader && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--color-body-green)", fontWeight: 400 }}>· Leader</span>}
                  </div>
                  {canEdit && !isLeader && (
                    confirmRemove === m.uid ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(null)}>Cancel</Button>
                        <Button size="sm" disabled={busy} onClick={() => handleRemove(m.uid)}
                          style={{ background: "var(--color-error)", color: "#fff" }}>Remove</Button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmRemove(m.uid)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: 4, display: "flex" }}>
                        <Icon name="x" size={14} />
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
