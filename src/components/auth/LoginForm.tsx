"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
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
      <div className="auth-divider">or</div>

      <form onSubmit={onSubmit}>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
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
