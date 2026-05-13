"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useProfile } from "@/application/hooks/useProfile";

interface Props {
  roleLabel?: string;
  scope: "instructors" | "learners";
}

function formatJoined(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function AdminProfileForm({ roleLabel = "Administrator", scope }: Props) {
  const P = useProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [dirty, setDirty] = useState(false);

  // Password fields
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  // Sync form state from Redux user on mount and when user changes
  useEffect(() => {
    if (P.user) {
      setFirstName(P.user.firstName ?? "");
      setLastName(P.user.lastName ?? "");
      setProfilePhotoUrl(P.user.profilePhotoUrl ?? "");
      setDirty(false);
    }
  }, [P.user]);

  if (!P.user) {
    return (
      <div className="page">
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-muted)" }}>
          <Icon name="loader" size={20} />
          <div style={{ marginTop: 10 }}>Loading profile…</div>
        </div>
      </div>
    );
  }

  const fullName = `${P.user.firstName} ${P.user.lastName}`.trim();
  const joinedAt = P.user.createdAt ? formatJoined(P.user.createdAt) : "";

  const onFieldChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setDirty(true);
  };

  const onCancel = () => {
    if (!P.user) return;
    setFirstName(P.user.firstName ?? "");
    setLastName(P.user.lastName ?? "");
    setProfilePhotoUrl(P.user.profilePhotoUrl ?? "");
    setDirty(false);
  };

  const onSave = async () => {
    if (!P.user) return;
    const changes: { firstName?: string; lastName?: string; profilePhotoUrl?: string | null } = {};
    if (firstName.trim() !== (P.user.firstName ?? "")) changes.firstName = firstName.trim();
    if (lastName.trim() !== (P.user.lastName ?? "")) changes.lastName = lastName.trim();
    if (profilePhotoUrl.trim() !== (P.user.profilePhotoUrl ?? "")) {
      changes.profilePhotoUrl = profilePhotoUrl.trim() || null;
    }
    const ok = await P.updateProfile(changes);
    if (ok) setDirty(false);
  };

  const onSubmitPassword = async () => {
    setConfirmError("");
    P.setPasswordError("");
    if (!currentPw) {
      P.setPasswordError("Enter your current password.");
      return;
    }
    if (newPw !== confirmPw) {
      setConfirmError("Passwords do not match.");
      return;
    }
    if (newPw.length < 10) {
      P.setPasswordError("New password must be at least 10 characters.");
      return;
    }
    const ok = await P.changePassword(currentPw, newPw);
    if (ok) {
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Your profile</h1>
          <div className="greeting">Update your account details.</div>
        </div>
      </div>

      {/* Profile card */}
      <div className="settings-card">
        <h2>Profile</h2>
        <p className="settings-sub">
          Visible to other {scope === "instructors" ? "administrators" : "learners"} on the platform.
        </p>

        <div className="avatar-row">
          <Avatar src={profilePhotoUrl || undefined} size="xl" name={fullName || P.user.email} />
          <div style={{ flex: 1 }}>
            <Input
              label="Profile photo URL"
              type="url"
              placeholder="https://..."
              value={profilePhotoUrl}
              onChange={(e) => onFieldChange(setProfilePhotoUrl)(e.target.value)}
              hint="Public HTTPS URL. Leave blank to remove."
            />
          </div>
        </div>

        <div className="form-grid two">
          <Input
            label="First name"
            value={firstName}
            error={P.fieldErrors.firstName}
            onChange={(e) => {
              onFieldChange(setFirstName)(e.target.value);
              if (P.fieldErrors.firstName) P.clearFieldError("firstName");
            }}
          />
          <Input
            label="Last name"
            value={lastName}
            error={P.fieldErrors.lastName}
            onChange={(e) => {
              onFieldChange(setLastName)(e.target.value);
              if (P.fieldErrors.lastName) P.clearFieldError("lastName");
            }}
          />
          <Input
            label="Email"
            type="email"
            value={P.user.email}
            disabled
            hint="Email cannot be changed."
          />
          <Input
            label="Role"
            value={roleLabel}
            disabled
          />
        </div>

        {joinedAt && (
          <div style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--color-body-green)",
            marginTop: 12,
          }}>
            Member since {joinedAt}
          </div>
        )}

        <div className="form-actions">
          <Button variant="ghost" onClick={onCancel} disabled={!dirty || P.saving}>
            Cancel
          </Button>
          <Button icon="check" onClick={onSave} disabled={!dirty || P.saving}>
            {P.saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Password card */}
      <div className="settings-card">
        <h2>Password</h2>
        <p className="settings-sub">Use a strong password you don&apos;t reuse elsewhere.</p>

        {P.passwordError && (
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: "var(--color-error-bg)",
            border: "1px solid rgba(220,38,38,0.25)",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 12,
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "#DC2626",
          }}>
            <Icon name="alert-circle" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {P.passwordError}
          </div>
        )}

        <div className="form-grid one" style={{ marginBottom: 12 }}>
          <Input
            label="Current password"
            type={showCurrent ? "text" : "password"}
            placeholder="Enter your current password"
            value={currentPw}
            onChange={(e) => { setCurrentPw(e.target.value); P.setPasswordError(""); }}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-body-green)", display: "flex" }}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                <Icon name={showCurrent ? "eye-off" : "eye"} size={16} />
              </button>
            }
          />
        </div>

        <div className="form-grid two">
          <Input
            label="New password"
            type={showNew ? "text" : "password"}
            placeholder="At least 10 characters"
            value={newPw}
            onChange={(e) => { setNewPw(e.target.value); P.setPasswordError(""); }}
            hint={!P.passwordError ? "Mix uppercase, lowercase, numbers and symbols." : undefined}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-body-green)", display: "flex" }}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                <Icon name={showNew ? "eye-off" : "eye"} size={16} />
              </button>
            }
          />
          <Input
            label="Confirm new password"
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter new password"
            value={confirmPw}
            error={confirmError}
            onChange={(e) => { setConfirmPw(e.target.value); if (confirmError) setConfirmError(""); }}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-body-green)", display: "flex" }}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                <Icon name={showConfirm ? "eye-off" : "eye"} size={16} />
              </button>
            }
          />
        </div>

        <div className="form-actions">
          <Button
            variant="ghost"
            onClick={() => { setCurrentPw(""); setNewPw(""); setConfirmPw(""); setConfirmError(""); P.setPasswordError(""); }}
            disabled={P.savingPassword}
          >
            Cancel
          </Button>
          <Button
            icon="check"
            onClick={onSubmitPassword}
            disabled={P.savingPassword || !currentPw || !newPw || !confirmPw}
          >
            {P.savingPassword ? "Updating…" : "Update password"}
          </Button>
        </div>
      </div>
    </div>
  );
}
