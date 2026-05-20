"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useCellMutations, type CellType } from "@/application/hooks/useCells";
import { useAppSelector } from "@/application/hooks/useAppSelector";

const TYPES: { id: CellType; label: string }[] = [
  { id: "care",     label: "Care" },
  { id: "outreach", label: "Outreach" },
  { id: "children", label: "Children" },
  { id: "g12",      label: "G12" },
];

export default function NewCellPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.session.user);
  const { createCell } = useCellMutations();

  const [name,       setName]       = useState("");
  const [type,       setType]       = useState<CellType>("care");
  const [area,       setArea]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nameError,  setNameError]  = useState("");

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setNameError("Cell name is required."); return; }
    setSubmitting(true);
    // API requires g12LeaderUid — send the creating user's UID.
    const cell = await createCell({
      name: name.trim(),
      type,
      area: area.trim(),
      g12LeaderUid: user?.uid ?? "",
    });
    if (cell) {
      // Navigate to add members right after creation.
      router.push(`/cells/${cell.id}/members`);
    } else {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>Create a new cell</h1>
          <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
            Fill in the details — you can add members in the next step.
          </p>
        </div>
        <Button variant="ghost" icon="arrow-left" onClick={() => router.push("/cells")}>Back</Button>
      </header>

      <form onSubmit={onCreate}>
        <div className="settings-card">
          <h2>Cell details</h2>

          <Input label="Cell name" placeholder="e.g. Rathmalana Care Cell · West"
            value={name} error={nameError} autoFocus
            onChange={(e) => { setName(e.target.value); if (nameError) setNameError(""); }} />

          <div className="field" style={{ marginTop: 12 }}>
            <label className="label">Cell type</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {TYPES.map((t) => (
                <button key={t.id} type="button" onClick={() => setType(t.id)}
                  style={{ padding: "8px 18px", borderRadius: 9999, border: `2px solid ${type === t.id ? "var(--color-accent)" : "var(--color-stroke)"}`, background: type === t.id ? "rgba(188,233,85,0.15)" : "#fff", color: "var(--color-primary)", fontFamily: "var(--font-body)", fontWeight: type === t.id ? 700 : 500, fontSize: 14, cursor: "pointer" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Input label="Location / area" placeholder="e.g. Rathmalana East"
            value={area} onChange={(e) => setArea(e.target.value)} style={{ marginTop: 4 }} />

          <div className="field" style={{ marginTop: 4 }}>
            <label className="label">Created date</label>
            <input type="text" value={today} disabled className="input"
              style={{ background: "var(--color-stroke-2)", color: "var(--color-muted)", cursor: "not-allowed" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)" }}>
            <Icon name="info" size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
            After creating, you'll be taken to add members.
          </span>
          <Button type="submit" size="lg" iconAfter="arrow-right" disabled={submitting || !name.trim()}>
            {submitting ? "Creating…" : "Create cell"}
          </Button>
        </div>
      </form>
    </div>
  );
}
