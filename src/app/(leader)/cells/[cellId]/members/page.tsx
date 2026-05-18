"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CellMembersPanel } from "@/components/cells/CellMembersPanel";
import { getCellById } from "@/lib/mock/cells";
import { useAppSelector } from "@/application/hooks/useAppSelector";

export default function CellMembersPage() {
  const router = useRouter();
  const params = useParams();
  const cellId = (params?.cellId as string) ?? "";
  const cell = useMemo(() => getCellById(cellId), [cellId]);
  const user = useAppSelector((s) => s.session.user);
  const canEdit = (user?.roles?.includes("leader") || user?.roles?.includes("g12") || user?.roles?.includes("super_admin")) ?? false;

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
          {cell.members.length} member{cell.members.length === 1 ? "" : "s"}
        </p>
      </header>

      <CellMembersPanel members={cell.members} leaderId={cell.leaderId} canEdit={canEdit} />
    </div>
  );
}
