"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { KpiMini } from "@/components/analytics/KpiMini";
import { ChartCard } from "@/components/analytics/ChartCard";
import { WeeklyAttendanceBars } from "@/components/analytics/WeeklyAttendanceBars";
import { MeetingTypeDonut } from "@/components/analytics/MeetingTypeDonut";
import { MemberGrowthLine } from "@/components/analytics/MemberGrowthLine";
import { listCells } from "@/lib/mock/cells";
import { listCellReports } from "@/lib/mock/cellReports";

export default function G12DashboardPage() {
  const router = useRouter();
  const allCells = useMemo(() => listCells(), []);
  const reports = useMemo(() => allCells.flatMap((c) => listCellReports({ cellId: c.id, voided: false })), [allCells]);

  const leadersUnderMe = useMemo(() => new Set(allCells.map((c) => c.leaderId)).size, [allCells]);
  const totalMembers = useMemo(() => allCells.reduce((s, c) => s + c.members.length, 0), [allCells]);

  const weeklyBars = [
    { label: "W1", value: 42 },
    { label: "W2", value: 46 },
    { label: "W3", value: 44 },
    { label: "W4", value: 51 },
    { label: "W5", value: 48 },
    { label: "W6", value: 54 },
    { label: "W7", value: 52 },
    { label: "W8", value: 59 },
  ];

  const typeSlices = useMemo(() => {
    const colors: Record<string, string> = { care: "#1D4ED8", outreach: "#15803D", children: "#D97706", g12: "#7C3AED" };
    const counts: Record<string, number> = {};
    for (const c of allCells) counts[c.type] = (counts[c.type] || 0) + 1;
    return Object.entries(counts).map(([k, v]) => ({ label: k, value: v, color: colors[k] || "#999" }));
  }, [allCells]);

  const growthPoints = [
    { label: "Jan", value: 248 },
    { label: "Feb", value: 256 },
    { label: "Mar", value: 271 },
    { label: "Apr", value: 282 },
    { label: "May", value: 297 },
  ];

  return (
    <div className="page">
      <header
        className="page-header"
        style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}
      >
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
            G12 Dashboard
          </h1>
          <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
            Your network: leaders, cells, and how each is trending.
          </p>
        </div>
        <Button variant="secondary-light" icon="calendar">This month</Button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <KpiMini label="Leaders" value={leadersUnderMe} delta={{ direction: "up", value: "+1" }} sub="In your network" />
        <KpiMini label="Cells" value={allCells.length} delta={{ direction: "up", value: "+2" }} sub="Active across leaders" />
        <KpiMini label="Members" value={totalMembers} delta={{ direction: "up", value: "+8" }} sub="Growing" />
        <KpiMini label="Reports / wk" value={Math.round(reports.length / 4)} sub="Weekly avg" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 20 }}>
        <ChartCard title="Weekly attendance" sub="Across all network cells">
          <WeeklyAttendanceBars bars={weeklyBars} />
        </ChartCard>
        <ChartCard title="By cell type" sub="Composition of your network" legend={typeSlices.map((s) => ({ label: s.label, color: s.color }))}>
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <MeetingTypeDonut slices={typeSlices} size={180} />
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Member growth — year to date" sub="Total members across your network">
        <MemberGrowthLine points={growthPoints} height={200} />
      </ChartCard>

      <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button icon="share-2" onClick={() => router.push("/g12/network")}>
          View network
        </Button>
        <Button variant="secondary-light" icon="user-plus" onClick={() => router.push("/g12/promote")}>
          Promote a member
        </Button>
        <Button variant="secondary-light" icon="bar-chart-3" onClick={() => router.push("/g12/analytics")}>
          Full analytics
        </Button>
      </div>
    </div>
  );
}
