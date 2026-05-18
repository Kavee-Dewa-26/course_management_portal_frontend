"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { FederatedSignInButtons } from "./FederatedSignInButtons";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

/**
 * Phase 2: registration no longer goes through admin approval. Every user who
 * signs up is a Member from the moment the account is created. On success the
 * form pushes a toast and routes the user to /login so they can sign in and
 * land on the Member dashboard.
 */
export function RegisterForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
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

      dispatch(
        pushToast({
          tone: "success",
          title: "Welcome to TCCR",
          message: "Account created. Sign in to continue to your Member dashboard.",
        }),
      );
      router.push(`/login?email=${encodeURIComponent(email.trim())}`);
    } catch {
      dispatch(pushToast({ tone: "warning", title: "Network error", message: "Could not reach the server. Check your connection and try again." }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div>
          <h3 style={{ margin: 0 }}>Create your account</h3>
          <p className="sub" style={{ margin: "4px 0 0" }}>Sign up as a Member — apply to become a Student later.</p>
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
