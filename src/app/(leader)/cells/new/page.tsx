"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import type { CellType } from "@/lib/mock/cells";

const TYPES: { id: CellType; label: string; hint: string }[] = [
  { id: "care", label: "Care", hint: "Pastoral support & community" },
  { id: "outreach", label: "Outreach", hint: "Evangelism, visitor focus" },
  { id: "children", label: "Children", hint: "Sunday school groups" },
  { id: "g12", label: "G12", hint: "Leaders cell — by invite only" },
];

export default function NewCellPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [type, setType] = useState<CellType>("care");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !area.trim()) return;
    setSubmitting(true);
    // UI-only: surface the toast and bounce back to the list.
    dispatch(pushToast({
      tone: "success",
      title: "Cell created",
      message: `${name.trim()} is ready. Add members and file your first report.`,
    }));
    setTimeout(() => router.push("/cells"), 600);
  };

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 24 }}>
        <Button variant="ghost" size="sm" icon="arrow-left" onClick={() => router.push("/cells")}>
          Back to cells
        </Button>
        <h1 style={{ margin: "8px 0 0", fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
          Create a new cell
        </h1>
        <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
          You&apos;ll be added as the leader. Add members after creating.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        style={{ background: "#fff", border: "1px solid var(--color-stroke)", borderRadius: 18, padding: 24, maxWidth: 720 }}
      >
        <Input label="Cell name" placeholder="e.g. Rathmalana Care Cell · East" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Area / location" placeholder="e.g. Rathmalana East" value={area} onChange={(e) => setArea(e.target.value)} />

        <div style={{ marginTop: 14 }}>
          <label className="label" style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--color-body-green)", marginBottom: 8 }}>
            Cell type
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {TYPES.map((t) => (
              <label
                key={t.id}
                style={{
                  background: "#fff",
                  border: `1.5px solid ${type === t.id ? "var(--color-primary)" : "var(--color-stroke)"}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  fontFamily: "var(--font-body)",
                }}
              >
                <input type="radio" checked={type === t.id} onChange={() => setType(t.id)} style={{ accentColor: "var(--color-primary)", marginTop: 3 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-primary)" }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: "var(--color-body-green)", marginTop: 2 }}>{t.hint}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <Button type="button" variant="ghost" onClick={() => router.push("/cells")}>
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={submitting || !name.trim() || !area.trim()} iconAfter="arrow-right">
            {submitting ? "Creating…" : "Create cell"}
          </Button>
        </div>
      </form>
    </div>
  );
}
