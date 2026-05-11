"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SUPER_PERMISSIONS } from "@/lib/mock/admins";

export interface InvitePayload {
  name: string;
  email: string;
  perms: string[];
}

interface Props {
  onCancel: () => void;
  onSubmit: (p: InvitePayload) => void;
}

export function InviteAdminForm({ onCancel, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    onSubmit({ name, email, perms: SUPER_PERMISSIONS.map((p) => p.id) });
  };

  return (
    <div className="settings-card">
      <h2>Invite a new administrator</h2>
      <p className="settings-sub">
        We&apos;ll email a one-time sign-in link to the address below. The invite expires in 7 days
        — you can resend or revoke it from this page.
      </p>
      <div className="form-grid two">
        <Input
          label="Full name"
          placeholder="e.g. Sahan Wijeratne"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          placeholder="name@edupath.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button icon="send" onClick={handleSubmit}>
          Send invite
        </Button>
      </div>
    </div>
  );
}
