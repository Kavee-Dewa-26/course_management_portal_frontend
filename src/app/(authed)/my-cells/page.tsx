"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { CellCard } from "@/components/cells/CellCard";
import { SwitchBanner } from "@/components/member/SwitchBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { listCells, listCellsForLeader, type Cell } from "@/lib/mock/cells";

/**
 * Member-section Cell Groups view. Mirrors
 * src/ui_structure/v2/project/tccr-screens-cells.jsx (TCellsList, role="member").
 *
 * - For a pure Member: shows "My Cell" + the single cell they belong to as a
 *   member, plus an "Other available cells" view-only grid.
 * - For a user who *also* holds leader / g12: header switches to "Cells" +
 *   "{N} cells you lead." and the SwitchBanner appears, suggesting they jump
 *   to their dashboard for full editorial access.
 */
export default function MyCellsPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.session.user);

  const isG12 = user?.roles?.includes("g12") ?? false;
  const isLeader = user?.roles?.includes("leader") ?? false;
  const hasLeaderRole = isLeader || isG12;
  const leaderLabel = isG12 ? "G12 Leader" : "Leader";

  // Cells where the user is a *member* (not the leader). Members typically
  // attend exactly one cell; a leader may also be a member of a different
  // (e.g. G12) cell.
  const memberCells = useMemo<Cell[]>(() => {
    if (!user) return [];
    return listCells().filter(
      (c) => c.leaderId !== user.uid && c.members.some((m) => m.id === user.uid),
    );
  }, [user]);

  // For leaders/g12, count the cells they lead — used in the header copy.
  const ledCount = useMemo(() => {
    if (!user || !hasLeaderRole) return 0;
    return listCellsForLeader(user.uid).length;
  }, [user, hasLeaderRole]);

  const otherCells = useMemo<Cell[]>(() => {
    if (!user) return [];
    const mineSet = new Set([...memberCells.map((c) => c.id)]);
    return listCells().filter((c) => !mineSet.has(c.id) && c.leaderId !== user.uid).slice(0, 6);
  }, [user, memberCells]);

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
          {hasLeaderRole ? "Cells" : "My Cell"}
        </h1>
        <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
          {hasLeaderRole ? (
            <>
              <b style={{ color: "var(--color-primary)" }}>{ledCount}</b> cells you lead.
            </>
          ) : (
            <>
              You are a member of{" "}
              <b style={{ color: "var(--color-primary)" }}>
                {memberCells.length} cell{memberCells.length === 1 ? "" : "s"}
              </b>
              . You can view other cells in your area below but cannot join them.
            </>
          )}
        </p>
      </header>

      {hasLeaderRole && (
        <SwitchBanner
          title={`You're also a ${leaderLabel}.`}
          body={`Switch to your ${isG12 ? "G12" : "Leader"} dashboard for full access — add cells, edit members, file and review reports.`}
          ctaLabel={`Continue as  ${leaderLabel}`}
          onCta={() => router.push(isG12 ? "/g12/dashboard" : "/leader/dashboard")}
        />
      )}

      {memberCells.length === 0 ? (
        <EmptyState
          icon="users"
          title={hasLeaderRole ? "You're not currently in any cell as a member" : "You're not in any cell groups yet"}
          message={
            hasLeaderRole
              ? "Leaders sometimes belong to a G12 cell as a member. Ask your G12 leader to add you."
              : "Speak to a cell leader at TCCR to be added. Once you're added, the cell will appear here."
          }
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
            My cells
          </h2>
          <div className="cell-grid">
            {memberCells.map((c) => (
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
            Other available cells{" "}
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)", fontWeight: 500, marginLeft: 8 }}>
              · view-only
            </span>
          </h2>
          <p style={{ margin: "0 0 14px", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)" }}>
            Visible for context. To join one, ask the leader directly.
          </p>
          <div className="cell-grid" style={{ opacity: 0.85 }}>
            {otherCells.map((c) => (
              <CellCard key={c.id} cell={c} readonly />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
