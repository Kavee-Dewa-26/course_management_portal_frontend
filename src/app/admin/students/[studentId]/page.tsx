"use client";

import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { STUDENTS_SEED } from "@/lib/mock/students";
import { STUDENT_IN_PROGRESS } from "@/lib/mock/courses";
import { avatarUrl } from "@/lib/kit";

export default function AdminStudentDetailPage() {
  const router = useRouter();
  const params = useParams<{ studentId: string }>();
  const student =
    STUDENTS_SEED.find((s) => s.id === Number(params.studentId)) ?? STUDENTS_SEED[0];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{student.name}</h1>
          <div className="greeting">
            {student.email} · {student.country}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" icon="arrow-left" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      <div className="settings-card">
        <div className="avatar-row">
          <Avatar src={avatarUrl(student.avatar)} size="xl" name={student.name} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{student.name}</h2>
            <p className="settings-sub" style={{ margin: "4px 0 0" }}>
              Joined {student.joined}
            </p>
          </div>
          <div>
            {student.status === "active" && <Badge tone="success">Active</Badge>}
            {student.status === "pending" && <Badge tone="warning">Pending</Badge>}
            {student.status === "suspended" && <Badge tone="error">Suspended</Badge>}
          </div>
        </div>

        <div className="form-grid two">
          <div>
            <div className="kpi-label" style={{ marginBottom: 4 }}>
              Enrolled courses
            </div>
            <div className="kpi-num" style={{ marginTop: 0 }}>
              {student.courses}
            </div>
          </div>
          <div>
            <div className="kpi-label" style={{ marginBottom: 4 }}>
              Average progress
            </div>
            <div className="kpi-num" style={{ marginTop: 0 }}>
              {student.progress}%
            </div>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h2>Enrolled courses</h2>
        <p className="settings-sub">Per-course progress for this student.</p>
        <div className="activity">
          {STUDENT_IN_PROGRESS.map((c) => (
            <div className="row" key={c.id}>
              <div className="ico">
                <Icon name={c.emblem} size={16} />
              </div>
              <div className="body">
                <div className="title">{c.title}</div>
                <div className="meta">
                  {c.lessons} · {c.tag}
                </div>
              </div>
              <span className="when">{c.progress}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
