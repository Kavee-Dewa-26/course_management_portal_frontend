"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiRequest } from "@/infrastructure/api/request";

interface Props {
  open: boolean;
  initialEmail?: string;
  onClose: () => void;
}

export function ForgotPasswordModal({ open, initialEmail = "", onClose }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleClose = () => {
    setEmail(initialEmail);
    setEmailError("");
    setLoading(false);
    setSent(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      // Endpoint always returns 200 to prevent email enumeration.
      await apiRequest("/auth/password-reset", {
        method: "POST",
        auth: false,
        body: { email: email.trim() },
      });
      setSent(true);
    } catch {
      // Even on error we show success — same UX as backend to prevent enumeration.
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      {sent ? (
        <>
          <div className="modal-ico" style={{ background: "rgba(188,233,85,0.15)", color: "#152A24" }}>
            <Icon name="mail-check" size={22} />
          </div>
          <h2>Check your inbox</h2>
          <p>
            If an account exists for <b>{email}</b>, we&apos;ve sent a password reset link.
            The link expires in 1 hour.
          </p>
          <div className="form-actions" style={{ justifyContent: "center", borderTop: "none" }}>
            <Button onClick={handleClose}>Got it</Button>
          </div>
        </>
      ) : (
        <>
          <div className="modal-ico">
            <Icon name="key" size={22} />
          </div>
          <h2>Reset your password</h2>
          <p>Enter the email associated with your account and we&apos;ll send you a reset link.</p>
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: "left", marginTop: 8 }}>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                error={emailError}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                autoFocus
              />
            </div>
            <div className="form-actions" style={{ justifyContent: "center", borderTop: "none" }}>
              <Button variant="ghost" onClick={handleClose} type="button" disabled={loading}>
                Cancel
              </Button>
              <Button icon="send" type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
