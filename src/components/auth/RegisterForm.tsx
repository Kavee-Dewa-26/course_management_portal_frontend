"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { FederatedSignInButtons } from "./FederatedSignInButtons";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export function RegisterForm() {
  const dispatch = useAppDispatch();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pending, setPending] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, msg: string) =>
    setErrors((prev) => ({ ...prev, [field]: msg }));
  const clearField = (field: string) =>
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required.";
    if (!lastName.trim()) e.lastName = "Last name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Enter a valid email address.";
    if (!pw) e.pw = "Password is required.";
    else if (pw.length < 10) e.pw = "Password must be at least 10 characters.";
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(pw))
      e.pw = "Use uppercase, lowercase, numbers and at least one symbol.";
    if (!confirmPw) e.confirmPw = "Please confirm your password.";
    else if (pw !== confirmPw) e.confirmPw = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (provider: "password" | "google") => {
    const finalEmail = email.trim() || "you@example.com";
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || "there";
    setPending({ name: fullName, email: finalEmail });
    dispatch(
      pushToast({
        tone: "success",
        title: "Application received",
        message:
          provider === "google"
            ? "We'll match your Google email and review shortly."
            : "An admin will review your sign-up shortly.",
      }),
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_PREFIX}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password: pw,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setFieldError("email", "An account with this email already exists.");
        } else if (res.status === 400 && err?.field) {
          setFieldError(err.field, err.message);
        } else {
          dispatch(pushToast({ tone: "warning", title: "Sign-up failed", message: err?.message ?? "Something went wrong. Please try again." }));
        }
        return;
      }

      submit("password");
    } catch {
      dispatch(pushToast({ tone: "warning", title: "Network error", message: "Could not reach the server. Check your connection and try again." }));
    } finally {
      setLoading(false);
    }
  };

  if (pending) {
    return (
      <div className="auth-pending">
        <div className="pending-orbit" aria-hidden="true">
          <span className="ring" />
          <span className="ring r2" />
          <span className="ring r3" />
          <div className="orbit-center">
            <Icon name="clock" size={28} />
          </div>
        </div>

        <h3 style={{ textAlign: "center" }}>Waiting for approval</h3>
        <p className="sub" style={{ textAlign: "center" }}>
          Thanks{pending.name !== "there" ? `, ${pending.name.split(" ")[0]}` : ""}. An
          administrator is reviewing your sign-up. We&apos;ll email <b>{pending.email}</b> as soon
          as you&apos;re approved, usually within <b>24 hours</b>.
        </p>

        <ol className="pending-steps">
          <li className="done">
            <span className="step-ico">
              <Icon name="check" size={14} />
            </span>
            <div>
              <b>Application submitted</b>
              <span>Just now</span>
            </div>
          </li>
          <li className="active">
            <span className="step-ico spin">
              <Icon name="clock" size={14} />
            </span>
            <div>
              <b>In review by admin</b>
              <span>We&apos;re verifying your details</span>
            </div>
          </li>
          <li>
            <span className="step-ico">
              <Icon name="user-check" size={14} />
            </span>
            <div>
              <b>Approved</b>
              <span>Email sent with a one-time sign-in link</span>
            </div>
          </li>
        </ol>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
          <Link href="/login" className="btn btn--primary btn--full">
            <Icon name="log-in" size={16} /> I already have access · Sign in
          </Link>
          <button
            type="button"
            className="btn btn--ghost btn--full"
            onClick={() => setPending(null)}
          >
            <Icon name="arrow-left" size={16} /> Back to the form
          </button>
        </div>

      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div>
          <h3 style={{ margin: 0 }}>Create your account</h3>
          <p className="sub" style={{ margin: "4px 0 0" }}>It only takes a minute. No credit card required.</p>
        </div>
        <LanguageSwitcher />
      </div>

      <FederatedSignInButtons context="signup" disabled={loading} />

      <form onSubmit={onSubmit}>
        <div className="form-grid two" style={{ marginBottom: 0 }}>
          <Input
            label="First name"
            placeholder="Priya"
            value={firstName}
            error={errors.firstName}
            onChange={(e) => { setFirstName(e.target.value); clearField("firstName"); }}
          />
          <Input
            label="Last name"
            placeholder="Mendis"
            value={lastName}
            error={errors.lastName}
            onChange={(e) => { setLastName(e.target.value); clearField("lastName"); }}
          />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          error={errors.email}
          onChange={(e) => { setEmail(e.target.value); clearField("email"); }}
        />
        <Input
          label="Password"
          type={showPw ? "text" : "password"}
          placeholder="At least 10 characters"
          value={pw}
          error={errors.pw}
          onChange={(e) => { setPw(e.target.value); clearField("pw"); }}
          hint={errors.pw ? undefined : "Mix uppercase, lowercase, numbers and symbols."}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-body-green)", display: "flex" }}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              <Icon name={showPw ? "eye-off" : "eye"} size={16} />
            </button>
          }
        />
        <Input
          label="Confirm password"
          type={showConfirmPw ? "text" : "password"}
          placeholder="Re-enter your password"
          value={confirmPw}
          onChange={(e) => { setConfirmPw(e.target.value); clearField("confirmPw"); }}
          error={errors.confirmPw}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowConfirmPw((v) => !v)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-body-green)", display: "flex" }}
              aria-label={showConfirmPw ? "Hide password" : "Show password"}
            >
              <Icon name={showConfirmPw ? "eye-off" : "eye"} size={16} />
            </button>
          }
        />
        <div style={{ marginTop: 22 }}>
          <Button full size="lg" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </div>
      </form>
      <div className="alt">
        Already have an account? <Link href="/login">Sign in</Link>
        <div style={{ marginTop: 14 }}>
          <Link href="/" style={{ color: "inherit" }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </>
  );
}
