"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { STUDENTS_SEED } from "@/lib/mock/students";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { avatarUrl } from "@/lib/kit";
import { cn } from "@/lib/cn";

type UpgradeMode = "add" | "replace";

const OPTIONS: { id: UpgradeMode; label: string; tag: string; description: string; ico: string }[] = [
  {
    id: "add",
    label: "Add as Administrator",
    tag: "Student + Admin",
    description: "Keeps their student access while also granting administrator privileges. They can learn courses and manage the platform.",
    ico: "user-plus",
  },
  {
    id: "replace",
    label: "Upgrade to Administrator",
    tag: "Admin only",
    description: "Replaces their student role with administrator. They will no longer have student access to course materials.",
    ico: "arrow-up-circle",
  },
];

export default function UpgradeStudentPage() {
  const router = useRouter();
  const params = useParams<{ studentId: string }>();
  const dispatch = useAppDispatch();

  const student = STUDENTS_SEED.find((s) => s.id === Number(params.studentId)) ?? STUDENTS_SEED[0];
  const [mode, setMode] = useState<UpgradeMode>("add");

  const handleConfirm = () => {
    const msg =
      mode === "add"
        ? `${student.name} now has both Student and Administrator roles.`
        : `${student.name} has been upgraded to Administrator.`;
    dispatch(pushToast({ tone: "success", title: "Role updated", message: msg }));
    router.push("/super-admin/students");
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Upgrade Role</h1>
          <div className="greeting">Choose how to assign the administrator role.</div>
        </div>
        <Button variant="secondary" icon="arrow-left" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {/* Student info */}
      <div className="settings-card">
        <div className="avatar-row">
          <Avatar src={avatarUrl(student.avatar)} size="xl" name={student.name} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{student.name}</h2>
            <p className="settings-sub" style={{ margin: "4px 0 0" }}>
              {student.email} · Current role: <b>Student</b>
            </p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="settings-card">
        <h2>Select upgrade type</h2>
        <p className="settings-sub">
          You can grant administrator access while keeping the student role, or replace it entirely.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          {OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className={cn("perm-card", mode === opt.id && "on")}
              style={{ cursor: "pointer", gap: 14 }}
            >
              <input
                type="radio"
                name="upgradeMode"
                value={opt.id}
                checked={mode === opt.id}
                onChange={() => setMode(opt.id)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <Icon name={opt.ico} size={15} />
                  <span className="perm-label">{opt.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      background: mode === opt.id ? "rgba(21,42,36,0.1)" : "#EEF1EF",
                      color: "#41574A",
                      padding: "2px 8px",
                      borderRadius: 9999,
                    }}
                  >
                    {opt.tag}
                  </span>
                </div>
                <div className="perm-hint">{opt.description}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="form-actions" style={{ marginTop: 24 }}>
          <Button variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button icon={mode === "add" ? "user-plus" : "arrow-up-circle"} onClick={handleConfirm}>
            {mode === "add" ? "Add as Administrator" : "Upgrade to Administrator"}
          </Button>
        </div>
      </div>
    </div>
  );
}
