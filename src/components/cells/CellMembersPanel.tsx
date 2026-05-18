"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Typeahead, type TypeaheadEntry } from "@/components/ui/Typeahead";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { TCCR_DIRECTORY } from "@/lib/mock/tccrDirectory";
import type { CellMember } from "@/lib/mock/cells";

interface Props {
  members: CellMember[];
  leaderId: string;
  /** Show the add-member typeahead (Leader / G12 only). */
  canEdit?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function CellMembersPanel({ members: initialMembers, leaderId, canEdit }: Props) {
  const dispatch = useAppDispatch();
  const [members, setMembers] = useState<CellMember[]>(initialMembers);
  const [adding, setAdding] = useState(false);

  const directory: TypeaheadEntry[] = TCCR_DIRECTORY.filter(
    (d) => !members.some((m) => m.id === d.id),
  ).map((d) => ({ id: d.id, name: d.name, avatar: d.avatar, roles: d.roles }));

  const addMember = (entry: TypeaheadEntry) => {
    const next: CellMember = {
      id: entry.id ?? `tmp-${Date.now()}`,
      name: entry.name,
      avatar: typeof entry.avatar === "string" ? entry.avatar : "",
      joinedAt: new Date().toISOString(),
      roleInCell: "member",
    };
    setMembers((prev) => [...prev, next]);
    setAdding(false);
    dispatch(pushToast({ tone: "success", title: "Member added", message: `${entry.name} joined the cell.` }));
  };

  const addUnregistered = (name: string) => {
    const next: CellMember = {
      id: `unreg-${Date.now()}`,
      name,
      avatar: "",
      joinedAt: new Date().toISOString(),
      roleInCell: "guest",
    };
    setMembers((prev) => [...prev, next]);
    setAdding(false);
    dispatch(pushToast({ tone: "success", title: "Guest added", message: `${name} added as an unregistered member.` }));
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--color-stroke)",
        borderRadius: 14,
        padding: 12,
      }}
    >
      {canEdit && (
        <div style={{ padding: "6px 8px 14px", borderBottom: adding ? "1px solid var(--color-stroke-2)" : "none", marginBottom: adding ? 12 : 0 }}>
          {adding ? (
            <Typeahead
              label="Add a member"
              placeholder="Search TCCR users…"
              directory={directory}
              onPick={addMember}
              onAddUnregistered={addUnregistered}
              hint="Pick a registered member, or add a guest by name."
            />
          ) : (
            <Button size="sm" icon="user-plus" onClick={() => setAdding(true)}>
              Add member
            </Button>
          )}
          {adding && (
            <div style={{ marginTop: 8, textAlign: "right" }}>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {members.map((m) => {
          const isLeader = m.id === leaderId;
          return (
            <div
              key={m.id}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 12,
                alignItems: "center",
                padding: "10px 14px",
                background: "#FAFAFA",
                borderRadius: 10,
              }}
            >
              <Avatar src={m.avatar || undefined} name={m.name} size="sm" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--color-primary)" }}>
                  {m.name}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-body-green)" }}>
                  Joined {formatDate(m.joinedAt)}
                </div>
              </div>
              {isLeader ? (
                <span className="cell-type g12">Leader</span>
              ) : m.roleInCell && m.roleInCell !== "member" ? (
                <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--color-muted)", textTransform: "capitalize" }}>
                  {m.roleInCell}
                </span>
              ) : (
                canEdit && (
                  <button
                    type="button"
                    aria-label={`Remove ${m.name}`}
                    onClick={() => {
                      setMembers((prev) => prev.filter((x) => x.id !== m.id));
                      dispatch(pushToast({ tone: "success", title: "Member removed", message: `${m.name} was removed.` }));
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-muted)",
                      padding: 4,
                      display: "flex",
                    }}
                  >
                    <Icon name="x" size={14} />
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
