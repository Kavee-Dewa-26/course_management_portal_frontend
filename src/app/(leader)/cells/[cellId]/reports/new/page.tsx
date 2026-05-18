"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CellReportForm, type CellReportPayload } from "@/components/cells/CellReportForm";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { pushToast } from "@/application/slices/uiSlice";
import { getCellById } from "@/lib/mock/cells";
import { createCellReport } from "@/lib/mock/cellReports";

export default function NewCellReportPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.session.user);
  const cellId = (params?.cellId as string) ?? "";
  const cell = useMemo(() => getCellById(cellId), [cellId]);

  if (!cell) {
    return (
      <div className="page">
        <EmptyState icon="alert-circle" title="Cell not found" message="The cell you tried to report on doesn't exist." />
      </div>
    );
  }

  const submit = (payload: CellReportPayload) => {
    const filer = user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown";
    const created = createCellReport({
      cellId: cell.id,
      cellName: cell.name,
      meetingDate: payload.meetingDate,
      language: payload.language,
      didMeet: payload.didMeet,
      notMetReason: payload.notMetReason,
      location: payload.location,
      startTime: payload.startTime,
      endTime: payload.endTime,
      leaderPresent: payload.leaderPresent,
      subjectKind: payload.subjectKind,
      subjectTopic: payload.subjectTopic,
      cellType: payload.cellType,
      attendance: payload.attendance,
      visitorCount: payload.visitorCount,
      followUpNotes: payload.followUpNotes,
      satisfaction: payload.satisfaction,
      filedBy: filer,
    });

    dispatch(pushToast({ tone: "success", title: "Report submitted", message: "Your G12 leader will see this." }));
    router.push(`/cells/${cell.id}/reports/${created.id}`);
  };

  return (
    <div className="page">
      <Button variant="ghost" size="sm" icon="arrow-left" onClick={() => router.push(`/cells/${cell.id}`)}>
        Back to {cell.name}
      </Button>

      <header className="page-header" style={{ marginTop: 12, marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-primary)" }}>
          File a cell report
        </h1>
        <p style={{ margin: "6px 0 0", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body-green)" }}>
          For <b>{cell.name}</b>. You can jump between steps using the sidebar.
        </p>
      </header>

      <CellReportForm cell={cell} onSubmit={submit} onCancel={() => router.push(`/cells/${cell.id}`)} />
    </div>
  );
}
