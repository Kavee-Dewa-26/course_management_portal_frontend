"use client";

import { useMemo, useState } from "react";
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
import { Icon } from "@/components/ui/Icon";

export default function SuperAdminAdminsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [admins, setAdmins] = useState<AdminRow[]>(ADMINS_SEED);
  const [showForm, setShowForm] = useState(false);
  const [toRemove, setToRemove] = useState<AdminRow | null>(null);
  const [toSuspend, setToSuspend] = useState<AdminRow | null>(null);
  const [toReactivate, setToReactivate] = useState<AdminRow | null>(null);
  const [query, setQuery] = useState("");

  const filteredAdmins = useMemo(() => {
    const q = query.toLowerCase();
    return q === ""
      ? admins
      : admins.filter(
          (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
        );
  }, [admins, query]);

  const flash = (tone: "success" | "warning", title: string, message?: string) =>
    dispatch(pushToast({ tone, title, message }));

  const submit = ({ firstName, lastName, email, perms }: { firstName: string; lastName: string; email: string; password: string; perms: string[] }) => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      flash("warning", "Missing details", "First name, last name and email are required.");
      return;
    }
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const id = Math.max(...admins.map((a) => a.id)) + 1;
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    setAdmins([
      { id, name: fullName, email, status: "active", avatar: 30 + (id % 30), perms, createdAt: today },
      ...admins,
    ]);
    flash("success", "Admin account created", `${fullName} can sign in immediately.`);
    setShowForm(false);
  };

  const confirmRemove = () => {
    if (!toRemove) return;
    setAdmins(admins.filter((a) => a.id !== toRemove.id));
    flash("success", "Account deleted", `${toRemove.name}'s account has been permanently removed.`);
    setToRemove(null);
  };

  const confirmSuspend = () => {
    if (!toSuspend) return;
    setAdmins(admins.map((a) => a.id === toSuspend.id ? { ...a, status: "suspended" as const } : a));
    flash("warning", "Admin suspended", `${toSuspend.name}'s access has been revoked immediately.`);
    setToSuspend(null);
  };

  const confirmReactivate = () => {
    if (!toReactivate) return;
    setAdmins(admins.map((a) => a.id === toReactivate.id ? { ...a, status: "active" as const } : a));
    flash("success", "Admin reactivated", `${toReactivate.name} can now sign in again.`);
    setToReactivate(null);
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

      <div className="audit-toolbar">
        <div className="audit-search">
          <Icon name="search" size={16} />
          <input
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="tbl-card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Person</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="empty">
                    <h3>No administrators found</h3>
                    <p>Try a different name or email.</p>
                  </div>
                </td>
              </tr>
            )}
            {filteredAdmins.map((a) => (
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
                <td className="muted">{a.createdAt}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 6 }}>
                    {a.status === "suspended" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon="play-circle"
                        onClick={() => setToReactivate(a)}
                      >
                        Reactivate
                      </Button>
                    ) : a.status === "active" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="pause-circle"
                        style={{ border: "1.5px solid color-mix(in srgb, currentColor 50%, transparent)" }}
                        onClick={() => setToSuspend(a)}
                      >
                        Suspend
                      </Button>
                    ) : null}
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
        title={toRemove ? `Permanently delete ${toRemove.name}?` : ""}
        message="This cannot be undone. Their account is deleted and any content they authored will be anonymised per the data retention policy."
        confirmLabel="Delete account"
        destructive
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />

      <ConfirmDialog
        open={!!toSuspend}
        title={toSuspend ? `Suspend ${toSuspend.name}?` : ""}
        message="Their active sessions will be terminated immediately and they will be unable to sign in until reactivated."
        confirmLabel="Suspend admin"
        destructive
        onConfirm={confirmSuspend}
        onCancel={() => setToSuspend(null)}
      />

      <ConfirmDialog
        open={!!toReactivate}
        title={toReactivate ? `Reactivate ${toReactivate.name}?` : ""}
        message="They will be able to sign in again immediately with their previous permissions restored."
        confirmLabel="Reactivate admin"
        onConfirm={confirmReactivate}
        onCancel={() => setToReactivate(null)}
      />
    </div>
  );
}
