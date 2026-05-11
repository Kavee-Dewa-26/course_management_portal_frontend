"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";

interface Props {
  user: { name: string; avatar?: string };
  role?: string;
}

export function AdminProfileForm({ user, role = "Administrator" }: Props) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(user.avatar);

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
          <h1>Your profile</h1>
          <div className="greeting">Update your account details and contact information.</div>
        </div>
      </div>

      <div className="settings-card">
        <h2>Profile</h2>
        <p className="settings-sub">Visible to other administrators on the platform.</p>
        <div className="avatar-row">
          <Avatar src={avatarSrc} size="xl" name={user.name} />
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
            <div className="hint" style={{ marginTop: 6 }}>
              JPG or PNG · max 2 MB.
            </div>
          </div>
        </div>
        <div className="form-grid two">
          <Input label="First name" defaultValue={user.name.split(" ")[0]} />
          <Input label="Last name" defaultValue={user.name.split(" ").slice(1).join(" ")} />
          <Input
            label="Email"
            type="email"
            defaultValue={`${user.name.toLowerCase().replace(/[^a-z]+/g, ".")}@edupath.org`}
          />
          <Input label="Phone" type="tel" defaultValue="+94 11 555 0102" />
          <Input label="Job title" defaultValue={role} />
          <Input label="Department" defaultValue="Academic Operations" />
        </div>
        <div className="form-actions">
          <Button variant="ghost">Cancel</Button>
          <Button icon="check" onClick={() => flash("Profile saved")}>
            Save changes
          </Button>
        </div>
      </div>

      <div className="settings-card">
        <h2>Password</h2>
        <p className="settings-sub">Use a strong password you don&apos;t reuse elsewhere.</p>
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
          <Button icon="check" onClick={() => flash("Password updated")}>
            Update password
          </Button>
        </div>
      </div>
    </div>
  );
}
