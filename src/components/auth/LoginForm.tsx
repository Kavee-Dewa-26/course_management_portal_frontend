"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { setRole, setUser } from "@/application/slices/sessionSlice";
import { ADMIN, STUDENT, SUPERADMIN } from "@/lib/mock/users";
import { cn } from "@/lib/cn";

type RoleKey = "student" | "admin" | "super_admin";

const ROLE_CONFIG: Record<
  RoleKey,
  { label: string; ico: string; user: typeof STUDENT; dashboard: string; greeting: string }
> = {
  student: {
    label: "Student",
    ico: "user",
    user: STUDENT,
    dashboard: "/dashboard",
    greeting: "Welcome back",
  },
  admin: {
    label: "Admin",
    ico: "shield",
    user: ADMIN,
    dashboard: "/admin/dashboard",
    greeting: "Signed in as admin",
  },
  super_admin: {
    label: "Super Admin",
    ico: "shield-check",
    user: SUPERADMIN,
    dashboard: "/super-admin/dashboard",
    greeting: "Signed in as super admin",
  },
};

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [role, setRoleKey] = useState<RoleKey>("student");
  const [email, setEmail] = useState("priya@example.com");
  const [pw, setPw] = useState("••••••••");
  const [emailError, setEmailError] = useState("");
  const [pwError, setPwError] = useState("");
  const [formError, setFormError] = useState("");

  const clearErrors = () => {
    setEmailError("");
    setPwError("");
    setFormError("");
  };

  const validate = () => {
    let valid = true;
    if (!email.trim()) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      valid = false;
    } else {
      setEmailError("");
    }
    if (!pw.trim()) {
      setPwError("Password is required.");
      valid = false;
    } else {
      setPwError("");
    }
    return valid;
  };

  const completeSignIn = (provider: "password" | "google") => {
    const cfg = ROLE_CONFIG[role];
    dispatch(setUser(cfg.user));
    dispatch(setRole(role));
    dispatch(
      pushToast({
        tone: "success",
        title: `${cfg.greeting}, ${cfg.user.name.split(" ")[0]}`,
        message: provider === "google" ? "Signed in with Google." : "Loading your dashboard…",
      }),
    );
    setTimeout(() => router.push(cfg.dashboard), 500);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!validate()) return;
    completeSignIn("password");
  };

  return (
    <>
      <h3>Sign in to your account</h3>
      <p className="sub">Pick the role you&apos;re signing in as, then continue.</p>

      <div className="role-segment" role="radiogroup" aria-label="Sign in as">
        {(Object.keys(ROLE_CONFIG) as RoleKey[]).map((k) => (
          <label key={k} className={cn(role === k && "active")}>
            <input
              type="radio"
              name="role"
              value={k}
              checked={role === k}
              onChange={() => setRoleKey(k)}
            />
            {ROLE_CONFIG[k].label}
          </label>
        ))}
      </div>

      <button type="button" className="btn--google" onClick={() => completeSignIn("google")}>
        <GoogleIcon /> Continue with Google
      </button>

      {/* DEV ONLY — remove before production */}
      <button
        type="button"
        onClick={() => completeSignIn("password")}
        style={{
          width: "100%",
          marginTop: 10,
          padding: "10px 0",
          borderRadius: 10,
          border: "1.5px dashed rgba(188,233,85,0.6)",
          background: "rgba(188,233,85,0.06)",
          color: "var(--color-body-green)",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Icon name="zap" size={14} />
        Dev: Sign in as {ROLE_CONFIG[role].label}
      </button>

      <div className="auth-divider">or</div>

      {formError && (
        <div
          style={{
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
          }}
        >
          <Icon name="alert-circle" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {formError}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          error={emailError}
          onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={pw}
          error={pwError}
          onChange={(e) => { setPw(e.target.value); if (pwError) setPwError(""); }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 14,
            fontSize: 13,
            fontFamily: "var(--font-body)",
          }}
        >
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" defaultChecked /> Remember me
          </label>
          <a href="#" style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>
            Forgot password?
          </a>
        </div>
        <div style={{ marginTop: 22 }}>
          <Button full size="lg" type="submit">
            Sign In as {ROLE_CONFIG[role].label}
          </Button>
        </div>
      </form>
      <div className="alt">
        Don&apos;t have an account? <Link href="/register">Register</Link>
        <div style={{ marginTop: 14 }}>
          <Link href="/" style={{ color: "inherit" }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </>
  );
}
