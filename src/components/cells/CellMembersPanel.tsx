"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** V2 cell member shape returned by GET /cells/:id */
export interface CellMemberV2 {
  uid: string;
  displayName: string;
}

interface Props {
  members: CellMemberV2[];
  leaderUid?: string;
  /** Show add/remove controls (Leader / G12 only). */
  canEdit?: boolean;
  /** Called with uid when user removes a member — parent handles API call. */
  onRemove?: (uid: string) => void;
  /** Called when user clicks "Add member" — parent handles dialog/API. */
  onAddClick?: () => void;
  busy?: boolean;
}

export function CellMembersPanel({ members, leaderUid, canEdit, onRemove, onAddClick, busy }: Props) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--color-stroke)", borderRadius: 14, padding: 12 }}>
      {canEdit && (
        <div style={{ padding: "6px 8px 14px" }}>
          <Button size="sm" icon="user-plus" disabled={busy} onClick={onAddClick}>
            Add member
          </Button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {members.length === 0 && (
          <div style={{ textAlign: "center", padding: "16px 0", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-muted)" }}>
            No members yet.
          </div>
        )}
        {members.map((m) => {
          const isLeader = m.uid === leaderUid;
          return (
            <div key={m.uid} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "10px 14px", background: "#FAFAFA", borderRadius: 10 }}>
              <Avatar name={m.displayName} size="sm" />
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--color-primary)" }}>
                {m.displayName}
              </div>
              {isLeader ? (
                <span className="cell-type g12">Leader</span>
              ) : (
                canEdit && onRemove && (
                  <button type="button" aria-label={`Remove ${m.displayName}`} disabled={busy}
                    onClick={() => onRemove(m.uid)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: 4, display: "flex" }}>
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
