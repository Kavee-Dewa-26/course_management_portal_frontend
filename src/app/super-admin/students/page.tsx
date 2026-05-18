"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RowMenu } from "@/components/ui/RowMenu";
import { RoleBadgeStack } from "@/components/user/RoleBadgeStack";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { pushToast } from "@/application/slices/uiSlice";
import { downloadCsv } from "@/lib/csv";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";

interface StudentUser {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  status?: string;
  profilePhotoUrl?: string | null;
  createdAt?: string;
  enrollmentCount?: number;
  // V2: every user has a roles array. Backend may not yet send this; default
  // to ["member","student"] since the query filters by role=student.
  roles?: string[];
}

interface StudentListResponse {
  items: StudentUser[];
  nextCursor: string | null;
  total: number;
}

interface AdminEnrollment {
  id: string;
  studentUid: string;
  courseId: string;
  state: string;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function SuperAdminStudentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const base = pathname?.startsWith("/super-admin") ? "/super-admin" : "/admin";
  const dispatch = useAppDispatch();
  const sessionUser = useAppSelector((s) => s.session.user);
  const [query, setQuery] = useState("");

  const [allStudents, setAllStudents] = useState<StudentUser[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [courseCountByStudent, setCourseCountByStudent] = useState<Record<string, {
    courseCount: number;
    loading: boolean;
  }>>({});

  // 1. Fetch the full student list once auth is ready.
  useEffect(() => {
    if (!sessionUser) return;
    let cancelled = false;
    setStudentsLoading(true);
    (async () => {
      try {
        const collected: StudentUser[] = [];
        let cursor: string | undefined;
        const MAX_PAGES = 20;
        for (let i = 0; i < MAX_PAGES; i++) {
          const params = new URLSearchParams({ role: "student", limit: "100" });
          if (cursor) params.append("cursor", cursor);
          const data = await apiRequest<StudentListResponse>(`/users?${params}`);
          collected.push(...(data.items ?? []));
          cursor = data.nextCursor ?? undefined;
          if (!cursor) break;
        }
        if (!cancelled) setAllStudents(collected);
      } catch (err) {
        if (err instanceof ApiRequestError && err.status !== 401) {
          dispatch(pushToast({ tone: "warning", title: "Failed to load students" }));
        }
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionUser, dispatch]);

  // 2. Fetch ALL admin enrollments once, then count per student client-side.
  //    (Backend's studentUid filter is unreliable — returns the same count for
  //    every student. One bulk fetch + local count is faster and accurate.)
  useEffect(() => {
    if (allStudents.length === 0) return;
    let cancelled = false;

    // Initialise loading state.
    setCourseCountByStudent((prev) => {
      const next = { ...prev };
      for (const s of allStudents) {
        if (!next[s.uid]) next[s.uid] = { courseCount: 0, loading: true };
      }
      return next;
    });

    (async () => {
      try {
        // Pull every page (typically a small number of enrollments overall).
        const all: AdminEnrollment[] = [];
        let cursor: string | undefined;
        for (let i = 0; i < 20; i++) {
          const params = new URLSearchParams({ limit: "100" });
          if (cursor) params.append("cursor", cursor);
          const data = await apiRequest<{ items: AdminEnrollment[]; nextCursor: string | null }>(
            `/admin/enrollments?${params}`,
          );
          all.push(...(data.items ?? []));
          cursor = data.nextCursor ?? undefined;
          if (!cursor) break;
        }
        if (cancelled) return;

        // Count approved enrollments per studentUid.
        const countByUid = new Map<string, number>();
        for (const e of all) {
          if (e.state === "approved") {
            countByUid.set(e.studentUid, (countByUid.get(e.studentUid) ?? 0) + 1);
          }
        }

        const next: typeof courseCountByStudent = {};
        for (const s of allStudents) {
          next[s.uid] = { courseCount: countByUid.get(s.uid) ?? 0, loading: false };
        }
        if (!cancelled) setCourseCountByStudent(next);
      } catch {
        if (!cancelled) {
          // On failure, just mark all as 0/not-loading so the UI doesn't hang.
          const next: typeof courseCountByStudent = {};
          for (const s of allStudents) next[s.uid] = { courseCount: 0, loading: false };
          setCourseCountByStudent(next);
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStudents.length, allStudents.map((s) => s.uid).join(",")]);

  const students = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allStudents;
    return allStudents.filter((s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q),
    );
  }, [allStudents, query]);

  const handleExport = () => {
    const headers = ["Name", "Email", "Status", "Courses", "Joined"];
    const rows = students.map((s) => {
      const p = courseCountByStudent[s.uid];
      return [
        `${s.firstName} ${s.lastName}`,
        s.email,
        s.status ?? "approved",
        p?.courseCount ?? 0,
        s.createdAt ?? "",
      ];
    });
    downloadCsv("students.csv", headers, rows);
    dispatch(pushToast({ tone: "success", title: "CSV downloaded" }));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <div className="greeting">
            <b style={{ color: "#152A24" }}>{studentsLoading ? "…" : allStudents.length}</b> users registered.
            Promote a Member to Leader or G12 here — roles are additive, so members keep their existing access.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" icon="download" onClick={handleExport} disabled={students.length === 0}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* V2 promotions explainer banner */}
      <div className="role-banner">
        <div className="ico">
          <Icon name="info" size={20} />
        </div>
        <div className="b-body">
          <h3>How promotions work</h3>
          <p>
            Members ask a pastor or G12 leader in person to become a Leader or G12. The admin then
            adds the role here — roles are additive (the user keeps Member &amp; Student access).
          </p>
        </div>
      </div>

      <div className="audit-toolbar">
        <div className="audit-search">
          <Icon name="search" size={16} />
          <input
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="tbl-card">
        <table className="tbl" style={{ tableLayout: "fixed", width: "100%" }}>
          <colgroup>
            <col style={{ width: "30%" }} />  {/* User */}
            <col style={{ width: "22%" }} />  {/* Roles */}
            <col style={{ width: "12%" }} />  {/* Status */}
            <col style={{ width: "12%" }} />  {/* Joined */}
            <col style={{ width: "24%" }} />  {/* Action */}
          </colgroup>
          <thead>
            <tr>
              <th>User</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Joined</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {studentsLoading && students.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--color-muted)" }}>
                    <Icon name="loader" size={18} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14 }}>Loading…</span>
                  </div>
                </td>
              </tr>
            )}
            {!studentsLoading && students.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty">
                    <h3>No students found</h3>
                    <p>{query ? "Try a different search term." : "No students have registered yet."}</p>
                  </div>
                </td>
              </tr>
            )}
            {students.map((s) => {
              const fullName = `${s.firstName} ${s.lastName}`.trim();
              const roles = s.roles && s.roles.length > 0 ? s.roles : ["member", "student"];
              const hasLeader = roles.includes("leader");
              const hasG12 = roles.includes("g12");

              // V2 promote actions — UI-only (mock toast). When backend grows
              // a role-mutation endpoint, swap these in.
              const promoteToLeader = () => {
                dispatch(
                  pushToast({
                    tone: "success",
                    title: "Promoted to Leader",
                    message: `${fullName} now holds the Leader role (UI only — backend pending).`,
                  }),
                );
              };
              const promoteToG12 = () => {
                dispatch(
                  pushToast({
                    tone: "success",
                    title: "Promoted to G12 Leader",
                    message: `${fullName} now holds the G12 role (UI only — backend pending).`,
                  }),
                );
              };

              return (
                <tr key={s.uid}>
                  <td>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <Avatar src={s.profilePhotoUrl ?? undefined} size="sm" name={fullName || s.uid} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {fullName || s.uid.slice(0, 12) + "…"}
                        </div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#41574A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <RoleBadgeStack roles={roles} />
                  </td>
                  <td>
                    {s.status === "suspended" ? (
                      <Badge tone="error">Suspended</Badge>
                    ) : s.status === "pending_approval" ? (
                      <Badge tone="warning">Pending</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </td>
                  <td className="muted">{formatDate(s.createdAt)}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {!hasLeader && (
                        <Button size="sm" variant="ghost" icon="chevron-up" onClick={promoteToLeader}>
                          Make Leader
                        </Button>
                      )}
                      {hasLeader && !hasG12 && (
                        <Button size="sm" icon="chevron-up" onClick={promoteToG12}>
                          Make G12
                        </Button>
                      )}
                      <RowMenu
                        ariaLabel={`Actions for ${fullName}`}
                        items={[
                          {
                            label: "View profile",
                            ico: "user",
                            onClick: () => router.push(`${base}/students/${s.uid}`),
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
