"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { getCellById, type CellType } from "@/lib/mock/cells";

const TYPES: CellType[] = ["care", "outreach", "children", "g12"];

export default function EditCellPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const cellId = (params?.cellId as string) ?? "";
  const cell = useMemo(() => getCellById(cellId), [cellId]);

  const [name, setName] = useState(cell?.name ?? "");
  const [area, setArea] = useState(cell?.area ?? "");
  const [type, setType] = useState<CellType>(cell?.type ?? "care");

  if (!cell) {
    return (
      <div className="page">
        <EmptyState icon="alert-circle" title="Cell not found" />
      </div>
    );
  }

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(pushToast({ tone: "success", title: "Cell updated", message: `${name} saved.` }));
    setTimeout(() => router.push(`/cells/${cell.id}`), 500);
  };

  return (
    <div className="page">
      <Button variant="ghost" size="sm" icon="arrow-left" onClick={() => router.push(`/cells/${cell.id}`)}>
        Back to {cell.name}
      </Button>

      <header className="page-header" style={{ marginTop: 12, marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-primary)" }}>
          Edit cell
        </h1>
      </header>

      <form
        onSubmit={onSave}
        style={{ background: "#fff", border: "1px solid var(--color-stroke)", borderRadius: 18, padding: 24, maxWidth: 720 }}
      >
        <Input label="Cell name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Area / location" value={area} onChange={(e) => setArea(e.target.value)} />

        <div style={{ marginTop: 14 }}>
          <label className="label" style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--color-body-green)", marginBottom: 8 }}>
            Cell type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CellType)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--color-stroke)",
              borderRadius: 10,
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--color-primary)",
              background: "#fff",
            }}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <Button type="button" variant="ghost" onClick={() => router.push(`/cells/${cell.id}`)}>
            Cancel
          </Button>
          <Button type="submit" size="lg" icon="save">Save changes</Button>
        </div>
      </form>

      <div style={{ marginTop: 18 }}>
        <Button variant="ghost" icon="users" onClick={() => router.push(`/cells/${cell.id}/members`)}>
          Manage members
        </Button>
      </div>
    </div>
  );
}
