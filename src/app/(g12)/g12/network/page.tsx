"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { listCells } from "@/lib/mock/cells";
import { listCellReports } from "@/lib/mock/cellReports";
import { TCCR_DIRECTORY } from "@/lib/mock/tccrDirectory";

interface LeaderRow {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  cells: number;
  members: number;
  lastReportDate: string;
  attendancePct: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function G12NetworkPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");

  const rows: LeaderRow[] = useMemo(() => {
    const cells = listCells();
    const byLeader = new Map<string, { name: string; avatar: string; cells: number; members: number }>();

    for (const c of cells) {
      const cur = byLeader.get(c.leaderId) ?? { name: c.leaderName, avatar: c.leaderAvatar, cells: 0, members: 0 };
      cur.cells += 1;
      cur.members += c.members.length;
      byLeader.set(c.leaderId, cur);
    }

    return Array.from(byLeader.entries()).map(([id, info]) => {
      const leaderCells = cells.filter((c) => c.leaderId === id);
      const reports = leaderCells.flatMap((c) => listCellReports({ cellId: c.id, voided: false }));
      const lastReport = reports.sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime())[0];
      const att = reports
        .filter((r) => r.didMeet && r.attendance.length > 0)
        .map((r) => r.attendance.filter((a) => a.status === "present").length / r.attendance.length);
      const attendancePct = att.length > 0 ? Math.round((att.reduce((s, v) => s + v, 0) / att.length) * 100) : 0;
      const dirEntry = TCCR_DIRECTORY.find((d) => d.id === id);
      return {
        id,
        name: info.name,
        avatar: info.avatar,
        phone: dirEntry?.phone ?? "+94 77 000 0000",
        cells: info.cells,
        members: info.members,
        lastReportDate: lastReport?.meetingDate ?? "—",
        attendancePct,
      };
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, search]);

  const promote = (row: LeaderRow) => {
    dispatch(pushToast({ tone: "success", title: "Promotion proposed", message: `${row.name} suggested for G12. Admin must confirm.` }));
  };

  return (
    <div className="page">
      <header
        className="page-header"
        style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}
      >
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
            Network
          </h1>
          <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
            Leaders in your network — {rows.length} total.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ minWidth: 240 }}>
            <Input placeholder="Search leaders…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button icon="user-plus" onClick={() => router.push("/g12/promote")}>
            Promote member
          </Button>
        </div>
      </header>

      <div className="tbl-card" style={{ background: "#fff", border: "1px solid var(--color-stroke)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 14 }}>
            <thead style={{ background: "var(--color-stroke-2)" }}>
              <tr>
                <Th>Leader</Th>
                <Th>Phone</Th>
                <Th>Cells</Th>
                <Th>Members</Th>
                <Th>Last report</Th>
                <Th>Attendance</Th>
                <Th right>Action</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--color-stroke-2)" }}>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar src={r.avatar} name={r.name} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: "var(--color-muted)" }}>Reports to: you</div>
                      </div>
                    </div>
                  </Td>
                  <Td muted>
                    <Icon name="smartphone" size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    {r.phone}
                  </Td>
                  <Td>{r.cells}</Td>
                  <Td>{r.members}</Td>
                  <Td muted>{r.lastReportDate === "—" ? "—" : formatDate(r.lastReportDate)}</Td>
                  <Td>
                    <span style={{ color: r.attendancePct >= 70 ? "var(--color-success-deep)" : "var(--color-warning)", fontWeight: 600 }}>
                      {r.attendancePct}%
                    </span>
                  </Td>
                  <Td right>
                    <Button size="sm" variant="secondary-light" onClick={() => promote(r)}>
                      Promote to G12
                    </Button>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: "center", fontFamily: "var(--font-body)", color: "var(--color-muted)" }}>
                    No leaders match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      style={{
        textAlign: right ? "right" : "left",
        padding: "12px 16px",
        fontWeight: 600,
        fontSize: 12,
        color: "var(--color-body-green)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, right, muted }: { children: React.ReactNode; right?: boolean; muted?: boolean }) {
  return (
    <td
      style={{
        textAlign: right ? "right" : "left",
        padding: "14px 16px",
        color: muted ? "var(--color-body-green)" : "var(--color-primary)",
      }}
    >
      {children}
    </td>
  );
}
