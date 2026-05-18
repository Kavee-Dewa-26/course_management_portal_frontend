"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { KpiMini } from "@/components/analytics/KpiMini";
import { ChartCard } from "@/components/analytics/ChartCard";
import { WeeklyAttendanceBars } from "@/components/analytics/WeeklyAttendanceBars";
import { MeetingTypeDonut } from "@/components/analytics/MeetingTypeDonut";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { listCellsForLeader, listCells } from "@/lib/mock/cells";
import { listCellReports } from "@/lib/mock/cellReports";

export default function LeaderDashboardPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.session.user);
  const isG12 = user?.roles?.includes("g12") ?? false;
  const isAdmin = (user?.roles?.includes("admin") || user?.roles?.includes("super_admin")) ?? false;

  const myCells = useMemo(() => {
    if (!user) return [];
    return isG12 || isAdmin ? listCells() : listCellsForLeader(user.uid);
  }, [user, isG12, isAdmin]);

  const reports = useMemo(() => {
    return myCells.flatMap((c) => listCellReports({ cellId: c.id, voided: false }));
  }, [myCells]);

  const totalMembers = useMemo(() => myCells.reduce((sum, c) => sum + c.members.length, 0), [myCells]);
  const avgAttendance = useMemo(() => {
    const att = reports
      .filter((r) => r.didMeet && r.attendance.length > 0)
      .map((r) => r.attendance.filter((a) => a.status === "present").length / r.attendance.length);
    if (att.length === 0) return 0;
    return Math.round((att.reduce((s, v) => s + v, 0) / att.length) * 100);
  }, [reports]);

  const weeklyBars = useMemo(() => {
    // Build last 8 mock weeks of attendance counts
    const counts = [38, 42, 40, 46, 44, 51, 48, 53];
    return counts.map((v, i) => ({ label: `W${i + 1}`, value: v }));
  }, []);

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

  return (
    <div className="page">
      <header
        className="page-header"
        style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}
      >
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
            Leader Dashboard
          </h1>
          <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
            Cells you lead at a glance. Filed reports, attendance, and meeting types.
          </p>
        </div>
        <Button variant="secondary-light" icon="calendar">This month</Button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <KpiMini label="My cells" value={myCells.length} delta={{ direction: "up", value: "+1" }} sub="Active cells" />
        <KpiMini label="Total members" value={totalMembers} delta={{ direction: "up", value: "+4" }} sub="Across cells" />
        <KpiMini label="Reports filed" value={reports.length} delta={{ direction: "up", value: "+3" }} sub="Last 30 days" />
        <KpiMini label="Avg attendance" value={`${avgAttendance}%`} delta={{ direction: avgAttendance >= 70 ? "up" : "dn", value: avgAttendance >= 70 ? "+2%" : "-1%" }} sub="vs. last month" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 20 }}>
        <ChartCard
          title="Weekly attendance"
          sub="Members present across all cells over the last 8 weeks"
          right={<Button size="sm" variant="ghost" icon="download">CSV</Button>}
        >
          <WeeklyAttendanceBars bars={weeklyBars} />
        </ChartCard>

        <ChartCard
          title="By cell type"
          sub="Distribution of your cells"
          legend={typeSlices.map((s) => ({ label: s.label, color: s.color }))}
        >
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <MeetingTypeDonut slices={typeSlices} size={180} />
          </div>
        </ChartCard>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--color-stroke)", borderRadius: 18, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 16, color: "var(--color-primary)" }}>
            Quick actions
          </h3>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button icon="users" onClick={() => router.push("/cells")}>
            View all cells
          </Button>
          <Button variant="secondary-light" icon="bar-chart-3" onClick={() => router.push("/leader/analytics")}>
            Open analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
