"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { STUDENT } from "@/lib/mock/users";

export default function StudentProfilePage() {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(STUDENT.avatar);

  const flash = (title: string, message?: string) =>
    dispatch(pushToast({ tone: "success", title, message }));

  const onPickPhoto = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      dispatch(
        pushToast({
          tone: "warning",
          title: "Image too large",
          message: "Please choose a JPG or PNG under 2 MB.",
        }),
      );
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarSrc(reader.result);
      flash("Photo updated", file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <div className="greeting">Manage your profile and password.</div>
        </div>
      </div>

      {/* Profile card */}
      <div className="settings-card">
        <h2>Profile</h2>
        <p className="settings-sub">
          This is how you appear to instructors and other learners.
        </p>
        <div className="avatar-row">
          <Avatar src={avatarSrc} size="xl" name={STUDENT.name} />
          <div>
            <Button variant="secondary" icon="upload" size="sm" onClick={onPickPhoto}>
              Upload new photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              style={{ display: "none" }}
              onChange={onFileChange}
            />
            <div className="hint" style={{ marginTop: 6 }}>JPG or PNG · max 2 MB.</div>
          </div>
        </div>
        <div className="form-grid two">
          <Input label="First name" defaultValue="Priya" />
          <Input label="Last name" defaultValue="Mendis" />
          <Input
            label="Email"
            type="email"
            defaultValue="priya@example.com"
            hint="Used for sign-in and notifications."
          />
          <Input label="Phone" type="tel" defaultValue="+94 77 555 0142" />
        </div>
        <div className="form-actions">
          <Button variant="ghost">Cancel</Button>
          <Button icon="check" onClick={() => flash("Profile saved")}>
            Save changes
          </Button>
        </div>
      </div>

      {/* Password card */}
      <div className="settings-card">
        <h2>Password</h2>
        <p className="settings-sub">Use a strong password you don&apos;t reuse anywhere else.</p>
        <div className="form-grid one">
          <Input label="Current password" type="password" placeholder="••••••••" />
        </div>
        <div className="form-grid two">
          <Input
            label="New password"
            type="password"
            placeholder="At least 10 characters"
            hint="Mix uppercase, lowercase, numbers and symbols."
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="Re-enter new password"
            hint="Must match the new password above."
          />
        </div>
        <div className="form-actions">
          <Button variant="ghost">Cancel</Button>
          <Button
            icon="check"
            onClick={() => flash("Password updated", "You'll be signed out from other devices.")}
          >
            Update password
          </Button>
        </div>
      </div>
    </div>
  );
}
