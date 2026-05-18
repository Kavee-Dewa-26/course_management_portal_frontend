"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Typeahead, type TypeaheadEntry } from "@/components/ui/Typeahead";
import { TCCR_DIRECTORY } from "@/lib/mock/tccrDirectory";
import type { AttendanceEntry } from "@/lib/mock/cellReports";

interface Props {
  attendance: AttendanceEntry[];
  onChange: (next: AttendanceEntry[]) => void;
}

export function AttendanceEditor({ attendance, onChange }: Props) {
  const [adding, setAdding] = useState(false);

  const directory: TypeaheadEntry[] = TCCR_DIRECTORY.filter(
    (d) => !attendance.some((a) => a.memberId === d.id),
  ).map((d) => ({ id: d.id, name: d.name, avatar: d.avatar, roles: d.roles }));

  const toggle = (id: string, status: "present" | "absent") => {
    onChange(attendance.map((a) => (a.memberId === id ? { ...a, status } : a)));
  };

  const remove = (id: string) => {
    onChange(attendance.filter((a) => a.memberId !== id));
  };

  const add = (entry: TypeaheadEntry) => {
    const id = entry.id ?? `tmp-${Date.now()}`;
    onChange([...attendance, { memberId: id, memberName: entry.name, status: "present" }]);
    setAdding(false);
  };

  const addGuest = (name: string) => {
    onChange([...attendance, { memberId: `guest-${Date.now()}`, memberName: name, status: "present" }]);
    setAdding(false);
  };

  return (
    <div>
      <div className="att-list">
        {attendance.map((a) => {
          // Attendees added via "add unregistered" path get a memberId like
          // "guest-<timestamp>" — show a yellow "(unregistered)" tag next to
          // their name so the leader can spot non-roster attendees at a glance.
          const isUnregistered = a.memberId.startsWith("guest-");
          return (
            <div key={a.memberId} className="att-row">
              <div className="name">
                <Avatar name={a.memberName} size="sm" />
                <span>{a.memberName}</span>
                {isUnregistered && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      background: "var(--color-warning-bg)",
                      color: "var(--color-warning)",
                      borderRadius: 9999,
                      fontFamily: "var(--font-body)",
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    unregistered
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="att-toggle">
                  <button
                    type="button"
                    className={`present${a.status === "present" ? " active" : ""}`}
                    onClick={() => toggle(a.memberId, "present")}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    className={`absent${a.status === "absent" ? " active" : ""}`}
                    onClick={() => toggle(a.memberId, "absent")}
                  >
                    Absent
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(a.memberId)}
                  aria-label={`Remove ${a.memberName}`}
                  style={{ background: "transparent", border: "none", color: "var(--color-muted)", cursor: "pointer", padding: 4 }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        {adding ? (
          <div>
            <Typeahead
              placeholder="Search to add an attendee…"
              directory={directory}
              onPick={add}
              onAddUnregistered={addGuest}
            />
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="ghost" icon="user-plus" onClick={() => setAdding(true)}>
            Add attendee
          </Button>
        )}
      </div>
    </div>
  );
}
