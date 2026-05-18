"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReportViewer } from "@/components/cells/ReportViewer";
import { VoidReportDialog } from "@/components/cells/VoidReportDialog";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { pushToast } from "@/application/slices/uiSlice";
import { getCellById } from "@/lib/mock/cells";
import { getCellReportById, voidCellReport, type CellReport } from "@/lib/mock/cellReports";

export default function CellReportViewPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.session.user);
  const cellId = (params?.cellId as string) ?? "";
  const reportId = (params?.reportId as string) ?? "";

  const cell = useMemo(() => getCellById(cellId), [cellId]);
  const [report, setReport] = useState<CellReport | undefined>(undefined);
  const [voidOpen, setVoidOpen] = useState(false);

  useEffect(() => {
    setReport(getCellReportById(reportId));
  }, [reportId]);

  const canVoid =
    !!report &&
    !report.voided &&
    ((user?.roles?.includes("leader") || user?.roles?.includes("g12") || user?.roles?.includes("super_admin")) ?? false);

  if (!cell || !report) {
    return (
      <div className="page">
        <EmptyState icon="alert-circle" title="Report not found" message="It may have been removed or you don't have access." />
      </div>
    );
  }

  const doVoid = (reason: string) => {
    const updated = voidCellReport(report.id, reason);
    if (updated) {
      setReport(updated);
      dispatch(pushToast({ tone: "warning", title: "Report voided", message: "It will be excluded from analytics." }));
    }
    setVoidOpen(false);
  };

  return (
    <div className="page">
      <Button variant="ghost" size="sm" icon="arrow-left" onClick={() => router.push(`/cells/${cell.id}`)}>
        Back to {cell.name}
      </Button>

      <header
        className="page-header"
        style={{ marginTop: 12, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}
      >
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-primary)" }}>
            Cell report
          </h1>
          <p style={{ margin: "6px 0 0", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body-green)" }}>
            For <b>{cell.name}</b>
          </p>
        </div>
        {canVoid && (
          <Button variant="destructive" icon="trash-2" onClick={() => setVoidOpen(true)}>
            Void report
          </Button>
        )}
      </header>

      <ReportViewer report={report} />

      <VoidReportDialog open={voidOpen} onClose={() => setVoidOpen(false)} onConfirm={doVoid} />
    </div>
  );
}
