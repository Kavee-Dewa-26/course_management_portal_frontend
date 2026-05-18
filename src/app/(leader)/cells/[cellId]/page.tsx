"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { CellDetailHeader } from "@/components/cells/CellDetailHeader";
import { CellTabs } from "@/components/cells/CellTabs";
import { CellMembersPanel } from "@/components/cells/CellMembersPanel";
import { CellReportCard } from "@/components/cells/CellReportCard";
import { getCellById } from "@/lib/mock/cells";
import { listCellReports } from "@/lib/mock/cellReports";
import { useAppSelector } from "@/application/hooks/useAppSelector";

export default function LeaderCellDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cellId = (params?.cellId as string) ?? "";
  const cell = useMemo(() => getCellById(cellId), [cellId]);
  const reports = useMemo(
    () =>
      listCellReports({ cellId })
        .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()),
    [cellId],
  );

  const user = useAppSelector((s) => s.session.user);
  const canFile = (user?.roles?.includes("leader") || user?.roles?.includes("g12") || user?.roles?.includes("super_admin")) ?? false;

  const [tab, setTab] = useState<"members" | "reports">("members");

  if (!cell) {
    return (
      <div className="page">
        <EmptyState icon="alert-circle" title="Cell not found" message="This cell may have been archived." />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/cells" className="btn btn--secondary-light">
            <Icon name="arrow-left" size={14} /> Back to cells
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Button variant="ghost" size="sm" icon="arrow-left" onClick={() => router.push("/cells")}>
        Back to cells
      </Button>

      <CellDetailHeader
        cell={cell}
        actions={
          <>
            {canFile && (
              <Button size="lg" icon="plus" onClick={() => router.push(`/cells/${cell.id}/reports/new`)}>
                Cell report
              </Button>
            )}
            <Button size="lg" variant="secondary-light" icon="edit-3" onClick={() => router.push(`/cells/${cell.id}/edit`)}>
              Edit cell
            </Button>
          </>
        }
      />

      <CellTabs
        tabs={[
          { id: "members", label: "Members", icon: "users", count: cell.members.length },
          { id: "reports", label: "Reports", icon: "file-text", count: reports.length },
        ]}
        active={tab}
        onChange={(id) => setTab(id as "members" | "reports")}
      />

      {tab === "members" && (
        <CellMembersPanel members={cell.members} leaderId={cell.leaderId} canEdit={canFile} />
      )}

      {tab === "reports" && (
        <div>
          {reports.length === 0 ? (
            <EmptyState
              icon="file-text"
              title="No reports yet"
              message="File your first cell report to start tracking attendance, satisfaction, and meeting notes."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {reports.map((r) => (
                <CellReportCard
                  key={r.id}
                  report={r}
                  onClick={() => router.push(`/cells/${cell.id}/reports/${r.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
