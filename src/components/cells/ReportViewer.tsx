"use client";

import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { SatisfactionStars } from "./SatisfactionStars";
import type { CellReport } from "@/lib/mock/cellReports";

interface Props {
  report: CellReport;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function ReportViewer({ report }: Props) {
  const present = report.attendance.filter((a) => a.status === "present");
  const absent = report.attendance.filter((a) => a.status === "absent");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {report.voided && (
        <div
          style={{
            background: "var(--color-error-bg)",
            border: "1px solid rgba(220,38,38,0.25)",
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--color-error-deep)",
          }}
        >
          <Icon name="alert-circle" size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <b>This report has been voided.</b>
            {report.voidReason && <div style={{ marginTop: 4 }}>Reason: {report.voidReason}</div>}
          </div>
        </div>
      )}

      <Section title="Overview">
        <Row k="Meeting date" v={formatDate(report.meetingDate)} />
        <Row k="Cell" v={report.cellName} />
        <Row k="Did meet?" v={report.didMeet ? "Yes" : `No — ${report.notMetReason ?? "no reason given"}`} />
        <Row k="Language" v={report.language.toUpperCase()} />
        <Row k="Filed by" v={`${report.filedBy} · ${formatDate(report.filedAt)}`} />
      </Section>

      {report.didMeet && (
        <Section title="Meeting basics">
          {report.location && <Row k="Location" v={report.location} />}
          {(report.startTime || report.endTime) && (
            <Row k="Time" v={`${report.startTime ?? "?"} – ${report.endTime ?? "?"}`} />
          )}
          <Row k="Leader present" v={report.leaderPresent ? "Yes" : "No (co-leader filled in)"} />
        </Section>
      )}

      <Section title="Subject">
        <Row k="Type" v={report.subjectKind === "sunday_sermon" ? "Sunday sermon" : "Other"} />
        {report.subjectTopic && <Row k="Topic" v={report.subjectTopic} />}
        <Row k="Cell type" v={<Badge tone="info">{report.cellType.toUpperCase()}</Badge>} />
      </Section>

      {report.didMeet && report.attendance.length > 0 && (
        <Section title={`Attendance — ${present.length} / ${report.attendance.length} present`}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <AttList title="Present" people={present.map((a) => a.memberName)} tone="success" />
            <AttList title="Absent" people={absent.map((a) => a.memberName)} tone="error" />
          </div>
        </Section>
      )}

      {(report.visitorCount || report.followUpNotes) && (
        <Section title="Visitors & follow-up">
          {typeof report.visitorCount === "number" && <Row k="Visitors" v={String(report.visitorCount)} />}
          {report.followUpNotes && (
            <div style={{ marginTop: 6, padding: "10px 14px", background: "#FAFAFA", borderRadius: 10, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body-green)" }}>
              {report.followUpNotes}
            </div>
          )}
        </Section>
      )}

      <Section title="Satisfaction">
        <SatisfactionStars value={report.satisfaction} readonly />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--color-stroke)", borderRadius: 14, padding: 20 }}>
      <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-muted)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid var(--color-stroke-2)", fontFamily: "var(--font-body)", fontSize: 14 }}>
      <span style={{ minWidth: 140, color: "var(--color-muted)", fontSize: 12 }}>{k}</span>
      <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>{v}</span>
    </div>
  );
}

function AttList({ title, people, tone }: { title: string; people: string[]; tone: "success" | "error" }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: tone === "success" ? "var(--color-success-deep)" : "var(--color-error-deep)", marginBottom: 6 }}>
        {title} ({people.length})
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-primary)" }}>
        {people.length === 0 ? (
          <li style={{ color: "var(--color-muted)" }}>—</li>
        ) : (
          people.map((p) => <li key={p} style={{ padding: "3px 0" }}>{p}</li>)
        )}
      </ul>
    </div>
  );
}
