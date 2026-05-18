"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { KpiMini } from "@/components/analytics/KpiMini";
import { ChartCard } from "@/components/analytics/ChartCard";
import { WeeklyAttendanceBars } from "@/components/analytics/WeeklyAttendanceBars";
import { MeetingTypeDonut } from "@/components/analytics/MeetingTypeDonut";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { listCellsForLeader, listCells } from "@/lib/mock/cells";
import { listCellReports } from "@/lib/mock/cellReports";

export default function LeaderAnalyticsPage() {
  const user = useAppSelector((s) => s.session.user);
  const isG12 = user?.roles?.includes("g12") ?? false;
  const isAdmin = (user?.roles?.includes("admin") || user?.roles?.includes("super_admin")) ?? false;

  const myCells = useMemo(() => {
    if (!user) return [];
    return isG12 || isAdmin ? listCells() : listCellsForLeader(user.uid);
  }, [user, isG12, isAdmin]);

  const reports = useMemo(() => myCells.flatMap((c) => listCellReports({ cellId: c.id, voided: false })), [myCells]);

  const monthlyBars = [
    { label: "Jan", value: 134 },
    { label: "Feb", value: 142 },
    { label: "Mar", value: 156 },
    { label: "Apr", value: 148 },
    { label: "May", value: 168 },
  ];

  const typeSlices = useMemo(() => {
    const colors: Record<string, string> = {
      care: "#1D4ED8",
      outreach: "#15803D",
      children: "#D97706",
      g12: "#7C3AED",
    };
    const counts: Record<string, number> = {};
    for (const c of myCells) counts[c.type] = (counts[c.type] || 0) + 1;
    return Object.entries(counts).map(([k, v]) => ({ label: k, value: v, color: colors[k] || "#999" }));
  }, [myCells]);

  const totalAtt = reports.reduce((sum, r) => sum + r.attendance.filter((a) => a.status === "present").length, 0);

  return (
    <div className="page">
      <header
        className="page-header"
        style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}
      >
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
            Analytics
          </h1>
          <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
            How your cells are trending. Export a CSV for offline review.
          </p>
        </div>
        <Button variant="secondary-light" icon="download">Export CSV</Button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <KpiMini label="Active cells" value={myCells.length} sub="In scope" />
        <KpiMini label="Reports YTD" value={reports.length} delta={{ direction: "up", value: "+6" }} sub="vs. prior period" />
        <KpiMini label="Attendees total" value={totalAtt} sub="Across all reports" />
        <KpiMini label="Avg satisfaction" value={(reports.reduce((s, r) => s + r.satisfaction, 0) / Math.max(1, reports.length)).toFixed(1)} sub="Out of 5" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 20 }}>
        <ChartCard title="Monthly attendance" sub="Total attendees per month, current year">
          <WeeklyAttendanceBars bars={monthlyBars} highlightIndex={monthlyBars.length - 1} />
        </ChartCard>
        <ChartCard title="By cell type" sub="Where activity is concentrated" legend={typeSlices.map((s) => ({ label: s.label, color: s.color }))}>
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <MeetingTypeDonut slices={typeSlices} size={180} />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
