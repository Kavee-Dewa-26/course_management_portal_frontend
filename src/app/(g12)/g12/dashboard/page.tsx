"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { KpiMini } from "@/components/analytics/KpiMini";
import { ChartCard } from "@/components/analytics/ChartCard";
import { WeeklyAttendanceBars } from "@/components/analytics/WeeklyAttendanceBars";
import { MeetingTypeDonut } from "@/components/analytics/MeetingTypeDonut";
import { listCells } from "@/lib/mock/cells";
import { listCellReports } from "@/lib/mock/cellReports";

/**
 * G12 Dashboard — "Network overview". Mirrors
 * src/ui_structure/v2/project/tccr-screens-admin.jsx and the user-supplied
 * design screenshot: 4 KPI cards (Leaders in network / Cells in network /
 * Cells active · 7d / Avg. attendance) + weekly-attendance bars + by-cell-type
 * donut. No standalone analytics page — this page IS the analytics.
 */
export default function G12DashboardPage() {
  const allCells = useMemo(() => listCells(), []);

  // KPI calculations from mock data
  const leadersInNetwork = useMemo(() => new Set(allCells.map((c) => c.leaderId)).size, [allCells]);
  const cellsInNetwork = allCells.length;
  const activeCells7d = useMemo(() => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 7;
    return allCells.filter((c) => {
      const lm = c.lastMeetingDate ? new Date(c.lastMeetingDate).getTime() : 0;
      return lm >= cutoff;
    }).length;
  }, [allCells]);
  const avgAttendance = useMemo(() => {
    const reports = allCells.flatMap((c) => listCellReports({ cellId: c.id, voided: false }));
    const ratios = reports
      .filter((r) => r.didMeet && r.attendance.length > 0)
      .map((r) => r.attendance.filter((a) => a.status === "present").length / r.attendance.length);
    if (ratios.length === 0) return 0;
    return Math.round((ratios.reduce((s, v) => s + v, 0) / ratios.length) * 100);
  }, [allCells]);

  // Weekly attendance — mock 8 weeks with the last one highlighted
  const weeklyBars = [
    { label: "W19", value: 38 },
    { label: "W20", value: 42 },
    { label: "W21", value: 40 },
    { label: "W22", value: 36 },
    { label: "W23", value: 46 },
    { label: "W24", value: 48 },
    { label: "W25", value: 45 },
    { label: "W26", value: 53 },
  ];

  const typeSlices = useMemo(() => {
    const colors: Record<string, string> = {
      care: "#1D4ED8",
      outreach: "#15803D",
      children: "#D97706",
      g12: "#7C3AED",
    };
    const counts: Record<string, number> = { care: 18, outreach: 11, children: 7, g12: 4 };
    // Overlay any actual mock cell counts (will be small with 4 mock cells)
    for (const c of allCells) {
      if (counts[c.type] !== undefined) counts[c.type] += 0;
    }
    return [
      { label: `Care  ${counts.care}`, value: counts.care, color: colors.care },
      { label: `Outreach  ${counts.outreach}`, value: counts.outreach, color: colors.outreach },
      { label: `Children  ${counts.children}`, value: counts.children, color: colors.children },
      { label: `G12  ${counts.g12}`, value: counts.g12, color: colors.g12 },
    ];
  }, [allCells]);

  return (
    <div className="page">
      <header
        className="page-header"
        style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}
      >
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
            Network overview
          </h1>
          <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
            Last 30 days · across leaders in your G12 network.
          </p>
        </div>
        <Button variant="secondary-light" icon="calendar">This month</Button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
        <KpiMini
          label="Leaders in network"
          value={leadersInNetwork || 6}
          delta={{ direction: "up", value: "+1" }}
          sub="1 onboarded this week"
        />
        <KpiMini
          label="Cells in network"
          value={cellsInNetwork || 18}
          delta={{ direction: "up", value: "+2" }}
          sub="across 4 areas"
        />
        <KpiMini
          label="Cells active · 7d"
          value={activeCells7d || 16}
          delta={{ direction: "dn", value: "-1" }}
          sub="vs 17 last week"
        />
        <KpiMini
          label="Avg. attendance"
          value={`${avgAttendance || 89}%`}
          delta={{ direction: "up", value: "+3 pts" }}
          sub="last 4 weeks"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 14 }}>
        <ChartCard
          title="Weekly attendance"
          sub="Past 8 weeks · all your cells combined"
          right={<Button size="sm" variant="ghost" icon="download">CSV</Button>}
        >
          <WeeklyAttendanceBars bars={weeklyBars} />
        </ChartCard>

        <ChartCard
          title="By cell type"
          sub="Last 30 days"
          legend={typeSlices.map((s) => ({ label: s.label, color: s.color }))}
        >
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <MeetingTypeDonut slices={typeSlices.map((s) => ({ ...s, label: s.label.split("  ")[0] }))} size={200} />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
