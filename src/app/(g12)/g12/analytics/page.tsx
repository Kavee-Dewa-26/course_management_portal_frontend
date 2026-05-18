"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { KpiMini } from "@/components/analytics/KpiMini";
import { ChartCard } from "@/components/analytics/ChartCard";
import { WeeklyAttendanceBars } from "@/components/analytics/WeeklyAttendanceBars";
import { MeetingTypeDonut } from "@/components/analytics/MeetingTypeDonut";
import { MemberGrowthLine } from "@/components/analytics/MemberGrowthLine";
import { listCells } from "@/lib/mock/cells";
import { listCellReports } from "@/lib/mock/cellReports";

export default function G12AnalyticsPage() {
  const allCells = useMemo(() => listCells(), []);
  const reports = useMemo(() => allCells.flatMap((c) => listCellReports({ cellId: c.id, voided: false })), [allCells]);

  // Participation table: reports per leader
  const participation = useMemo(() => {
    const byLeader = new Map<string, { name: string; cells: number; reports: number; satisfaction: number }>();
    for (const c of allCells) {
      const reps = listCellReports({ cellId: c.id, voided: false });
      const cur = byLeader.get(c.leaderId) ?? { name: c.leaderName, cells: 0, reports: 0, satisfaction: 0 };
      cur.cells += 1;
      cur.reports += reps.length;
      cur.satisfaction = reps.length > 0 ? reps.reduce((s, r) => s + r.satisfaction, 0) / reps.length : 0;
      byLeader.set(c.leaderId, cur);
    }
    return Array.from(byLeader.values());
  }, [allCells]);

  const monthlyBars = [
    { label: "Jan", value: 248 },
    { label: "Feb", value: 256 },
    { label: "Mar", value: 271 },
    { label: "Apr", value: 282 },
    { label: "May", value: 297 },
  ];

  const typeSlices = useMemo(() => {
    const colors: Record<string, string> = { care: "#1D4ED8", outreach: "#15803D", children: "#D97706", g12: "#7C3AED" };
    const counts: Record<string, number> = {};
    for (const c of allCells) counts[c.type] = (counts[c.type] || 0) + 1;
    return Object.entries(counts).map(([k, v]) => ({ label: k, value: v, color: colors[k] || "#999" }));
  }, [allCells]);

  const totalMembers = allCells.reduce((s, c) => s + c.members.length, 0);

  return (
    <div className="page">
      <header
        className="page-header"
        style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}
      >
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
            G12 Analytics
          </h1>
          <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
            Network-wide trends across all leaders in your span.
          </p>
        </div>
        <Button variant="secondary-light" icon="download">Export CSV</Button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <KpiMini label="Leaders" value={participation.length} sub="In network" />
        <KpiMini label="Cells" value={allCells.length} sub="Active" />
        <KpiMini label="Members" value={totalMembers} delta={{ direction: "up", value: "+8%" }} sub="YoY" />
        <KpiMini label="Total reports" value={reports.length} delta={{ direction: "up", value: "+12" }} sub="Year to date" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 20 }}>
        <ChartCard title="Member growth (YTD)" sub="Total members per month">
          <MemberGrowthLine points={monthlyBars} height={200} />
        </ChartCard>
        <ChartCard title="By cell type" sub="Composition across the network" legend={typeSlices.map((s) => ({ label: s.label, color: s.color }))}>
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <MeetingTypeDonut slices={typeSlices} size={180} />
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Weekly attendance" sub="All cells combined">
        <WeeklyAttendanceBars
          bars={[
            { label: "W1", value: 142 },
            { label: "W2", value: 156 },
            { label: "W3", value: 148 },
            { label: "W4", value: 168 },
            { label: "W5", value: 162 },
            { label: "W6", value: 174 },
            { label: "W7", value: 169 },
            { label: "W8", value: 184 },
          ]}
        />
      </ChartCard>

      <h3 style={{ margin: "24px 0 12px", fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 600, color: "var(--color-primary)" }}>
        Participation per leader
      </h3>
      <div className="tbl-card" style={{ background: "#fff", border: "1px solid var(--color-stroke)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 14 }}>
          <thead style={{ background: "var(--color-stroke-2)" }}>
            <tr>
              <th style={thStyle()}>Leader</th>
              <th style={thStyle()}>Cells</th>
              <th style={thStyle()}>Reports</th>
              <th style={thStyle()}>Avg satisfaction</th>
            </tr>
          </thead>
          <tbody>
            {participation.map((p) => (
              <tr key={p.name} style={{ borderTop: "1px solid var(--color-stroke-2)" }}>
                <td style={tdStyle()}>{p.name}</td>
                <td style={tdStyle()}>{p.cells}</td>
                <td style={tdStyle()}>{p.reports}</td>
                <td style={tdStyle()}>{p.satisfaction.toFixed(1)} / 5</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function thStyle(): React.CSSProperties {
  return { textAlign: "left", padding: "12px 16px", fontWeight: 600, fontSize: 12, color: "var(--color-body-green)", textTransform: "uppercase", letterSpacing: "0.04em" };
}
function tdStyle(): React.CSSProperties {
  return { padding: "14px 16px", color: "var(--color-primary)" };
}
