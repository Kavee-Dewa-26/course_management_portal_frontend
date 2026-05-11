"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RowMenu } from "@/components/ui/RowMenu";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { STUDENTS_SEED } from "@/lib/mock/students";
import { avatarUrl } from "@/lib/kit";
import { downloadCsv } from "@/lib/csv";

export default function SuperAdminStudentsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");

  const students = useMemo(
    () =>
      STUDENTS_SEED.filter(
        (s) =>
          s.status === "active" &&
          (query.trim() === "" ||
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.email.toLowerCase().includes(query.toLowerCase())),
      ),
    [query],
  );

  const handleExport = () => {
    const headers = ["Name", "Email", "Country", "Courses", "Avg Progress (%)", "Joined"];
    const rows = students.map((s) => [s.name, s.email, s.country, s.courses, s.progress, s.joined]);
    downloadCsv("students.csv", headers, rows);
    dispatch(pushToast({ tone: "success", title: "CSV downloaded" }));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <div className="greeting">
            <b style={{ color: "#152A24" }}>{students.length}</b> active students
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" icon="download" onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="audit-toolbar">
        <div className="audit-search">
          <Icon name="search" size={16} />
          <input
            placeholder="Search students…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="tbl-card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Student</th>
              <th>Country</th>
              <th>Courses</th>
              <th>Avg progress</th>
              <th>Joined</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar src={avatarUrl(s.avatar)} size="sm" name={s.name} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          color: "#41574A",
                        }}
                      >
                        {s.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{s.country}</td>
                <td>{s.courses}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 160 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 9999,
                        background: "#EEF1EF",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{ height: "100%", width: `${s.progress}%`, background: "#BCE955" }}
                      />
                    </div>
                    <span
                      style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#41574A" }}
                    >
                      {s.progress}%
                    </span>
                  </div>
                </td>
                <td className="muted">{s.joined}</td>
                <td style={{ textAlign: "right" }}>
                  <RowMenu
                    ariaLabel={`Actions for ${s.name}`}
                    items={[
                      {
                        label: "Upgrade role",
                        ico: "arrow-up-circle",
                        onClick: () => router.push(`/super-admin/students/${s.id}/upgrade`),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty">
                    <h3>No students match</h3>
                    <p>Try adjusting your search.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
