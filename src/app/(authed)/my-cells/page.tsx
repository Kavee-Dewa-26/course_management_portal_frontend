"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { CellCard } from "@/components/cells/CellCard";
import { SwitchBanner } from "@/components/member/SwitchBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { listCells, listCellsForMember, type Cell } from "@/lib/mock/cells";

export default function MyCellsPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.session.user);

  const myCells = useMemo<Cell[]>(() => {
    if (!user) return [];
    return listCellsForMember(user.uid);
  }, [user]);

  const otherCells = useMemo<Cell[]>(() => {
    if (!user) return [];
    const mySet = new Set(myCells.map((c) => c.id));
    return listCells().filter((c) => !mySet.has(c.id));
  }, [user, myCells]);

  const hasLeaderRole = (user?.roles?.includes("leader") || user?.roles?.includes("g12")) ?? false;

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
          My Cells
        </h1>
        <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
          The cell groups you&apos;re a member of. Reports are filed by your leader.
        </p>
      </header>

      {hasLeaderRole && (
        <SwitchBanner
          title="You also lead cells"
          body="Switch to the Leader view to manage members and file reports."
          ctaLabel="Continue as Leader"
          onCta={() => router.push("/cells")}
        />
      )}

      {myCells.length === 0 ? (
        <EmptyState
          icon="users"
          title="You're not in any cell groups yet"
          message="Speak to a cell leader at TCCR to be added. Once you're added, the cell will appear here."
        />
      ) : (
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              margin: "0 0 14px",
              fontFamily: "var(--font-heading)",
              fontSize: 17,
              fontWeight: 600,
              color: "var(--color-primary)",
            }}
          >
            Cells I belong to
          </h2>
          <div className="cell-grid">
            {myCells.map((c) => (
              <CellCard key={c.id} cell={c} onClick={() => router.push(`/my-cells/${c.id}`)} />
            ))}
          </div>
        </section>
      )}

      {otherCells.length > 0 && (
        <section>
          <h2
            style={{
              margin: "0 0 4px",
              fontFamily: "var(--font-heading)",
              fontSize: 17,
              fontWeight: 600,
              color: "var(--color-primary)",
            }}
          >
            Other cells at TCCR
          </h2>
          <p style={{ margin: "0 0 14px", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)" }}>
            Visible for context. To join one, ask the leader directly.
          </p>
          <div className="cell-grid" style={{ opacity: 0.7 }}>
            {otherCells.map((c) => (
              <CellCard key={c.id} cell={c} readonly />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
