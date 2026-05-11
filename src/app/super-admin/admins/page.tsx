"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { InviteAdminForm } from "@/components/admin/InviteAdminForm";
import { ADMINS_SEED, type AdminRow } from "@/lib/mock/admins";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { avatarUrl } from "@/lib/kit";

export default function SuperAdminAdminsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [admins, setAdmins] = useState<AdminRow[]>(ADMINS_SEED);
  const [showForm, setShowForm] = useState(false);
  const [toRemove, setToRemove] = useState<AdminRow | null>(null);

  const flash = (tone: "success" | "warning", title: string, message?: string) =>
    dispatch(pushToast({ tone, title, message }));

  const submit = ({ name, email, perms }: { name: string; email: string; perms: string[] }) => {
    if (!name.trim() || !email.trim()) {
      flash("warning", "Missing details", "Name and email are required.");
      return;
    }
    const id = Math.max(...admins.map((a) => a.id)) + 1;
    setAdmins([
      { id, name, email, status: "invited", avatar: 30 + (id % 30), perms },
      ...admins,
    ]);
    flash(
      "success",
      "Invite emailed",
      `A sign-in link has been sent to ${email}. ${name} can sign in once they accept.`,
    );
    setShowForm(false);
  };

  const confirmRemove = () => {
    if (!toRemove) return;
    setAdmins(admins.filter((a) => a.id !== toRemove.id));
    flash("success", "Administrator removed", `${toRemove.name} no longer has access.`);
    setToRemove(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Administrators</h1>
          <div className="greeting">
            <b style={{ color: "#152A24" }}>{admins.length}</b> total ·{" "}
            {admins.filter((a) => a.status === "invited").length} pending invites
          </div>
        </div>
        <Button icon="user-plus" onClick={() => setShowForm(true)}>
          Add admin
        </Button>
      </div>

      {showForm && <InviteAdminForm onCancel={() => setShowForm(false)} onSubmit={submit} />}

      <div className="tbl-card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Person</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar src={avatarUrl(a.avatar)} size="sm" name={a.name} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{a.name}</div>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          color: "#41574A",
                        }}
                      >
                        {a.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  {a.status === "active" && <Badge tone="success">Active</Badge>}
                  {a.status === "invited" && <Badge tone="warning">Invited</Badge>}
                  {a.status === "suspended" && <Badge tone="error">Suspended</Badge>}
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 6 }}>
                    <Button
                      size="sm"
                      variant="destructive"
                      icon="trash-2"
                      onClick={() => setToRemove(a)}
                    >
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!toRemove}
        title={toRemove ? `Remove ${toRemove.name}?` : ""}
        message="They will lose access immediately. You can re-invite them later if needed."
        confirmLabel="Remove administrator"
        destructive
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </div>
  );
}
