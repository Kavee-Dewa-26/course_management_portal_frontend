"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Typeahead } from "@/components/ui/Typeahead";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { TCCR_DIRECTORY } from "@/lib/mock/tccrDirectory";

interface PickedMember {
  name: string;
  unregistered: boolean;
}

/**
 * Cell creation form — mirrors src/ui_structure/v2/project/tccr-screens-cells.jsx
 * (TCreateCell, lines 775-840):
 *
 *   1. "Cell details" card  — name + auto-set created date (disabled).
 *   2. "Add members" card   — Typeahead from the TCCR directory; picks become
 *                              lime chips. Names not in the directory can be
 *                              added as yellow "(unregistered)" chips.
 *
 * No type selection — type is only set later from cell settings if needed.
 */
export default function NewCellPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [members, setMembers] = useState<PickedMember[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    [],
  );

  const directory = useMemo(
    () =>
      TCCR_DIRECTORY.filter((d) => !members.some((m) => m.name === d.name)).map((d) => ({
        id: d.id,
        name: d.name,
        avatar: d.avatar,
        roles: d.roles,
      })),
    [members],
  );

  const addRegistered = (entry: { name: string }) => {
    if (members.some((m) => m.name === entry.name)) return;
    setMembers((prev) => [...prev, { name: entry.name, unregistered: false }]);
  };

  const addUnregistered = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (members.some((m) => m.name === trimmed)) return;
    setMembers((prev) => [...prev, { name: trimmed, unregistered: true }]);
  };

  const removeMember = (idx: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const onCreate = () => {
    if (!name.trim()) return;
    setSubmitting(true);
    dispatch(
      pushToast({
        tone: "success",
        title: "Cell created",
        message: `${name.trim()} is ready. ${members.length ? `${members.length} member${members.length === 1 ? "" : "s"} added.` : "Add members any time."}`,
      }),
    );
    setTimeout(() => router.push("/cells"), 600);
  };

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
            Create a new cell
          </h1>
          <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
            You&apos;ll be set as the leader. Add an initial roster — you can edit it any time.
          </p>
        </div>
        <Button variant="secondary-light" icon="arrow-left" onClick={() => router.push("/cells")}>
          Back to cells
        </Button>
      </header>

      {/* ── Cell details ───────────────────────────────────────────── */}
      <section
        style={{
          background: "#fff",
          border: "1px solid var(--color-stroke)",
          borderRadius: 18,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-primary)" }}>
          Cell details
        </h2>
        <p style={{ margin: "0 0 16px", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)" }}>
          Pick a name. Created date is set automatically.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input
            label="Cell name"
            placeholder="e.g. Mt Lavinia · Wednesday Care"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input label="Created date" defaultValue={today} disabled />
        </div>
      </section>

      {/* ── Add members ───────────────────────────────────────────── */}
      <section
        style={{
          background: "#fff",
          border: "1px solid var(--color-stroke)",
          borderRadius: 18,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-primary)" }}>
          Add members
        </h2>
        <p style={{ margin: "0 0 16px", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)" }}>
          <b style={{ color: "var(--color-primary)" }}>{members.length} added</b> · type a name —
          suggestions appear from the TCCR directory. Anyone not registered can still be added as
          an unregistered member.
        </p>

        <Typeahead
          placeholder="Type a member's name…"
          directory={directory}
          onPick={addRegistered}
          onAddUnregistered={addUnregistered}
        />

        {members.length > 0 && (
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {members.map((m, i) => (
              <span
                key={`${m.name}-${i}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  background: m.unregistered ? "var(--color-warning-bg)" : "rgba(188,233,85,0.18)",
                  borderRadius: 9999,
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: 13,
                  color: m.unregistered ? "var(--color-warning)" : "var(--color-primary)",
                }}
              >
                {m.unregistered ? <Icon name="user-plus" size={12} /> : <Icon name="user" size={12} />}
                {m.name}
                {m.unregistered && <span style={{ fontWeight: 500, opacity: 0.85 }}>(unregistered)</span>}
                <button
                  type="button"
                  onClick={() => removeMember(i)}
                  aria-label={`Remove ${m.name}`}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: m.unregistered ? "var(--color-warning)" : "var(--color-body-green)",
                    padding: 0,
                    display: "inline-flex",
                  }}
                >
                  <Icon name="x" size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── Form actions ──────────────────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--color-stroke)",
          borderRadius: 14,
          padding: "16px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Button variant="ghost" onClick={() => router.push("/cells")}>
          Cancel
        </Button>
        <Button icon="check" size="lg" disabled={submitting || !name.trim()} onClick={onCreate}>
          {submitting ? "Creating…" : "Create cell"}
        </Button>
      </div>
    </div>
  );
}
