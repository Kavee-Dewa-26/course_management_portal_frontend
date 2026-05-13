"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { auth } from "@/infrastructure/firebase/auth";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { setUser, type SessionUser, type Role } from "@/application/slices/sessionSlice";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

const DASHBOARD_BY_ROLE: Record<Role, string> = {
  student: "/dashboard",
  admin: "/admin/dashboard",
  super_admin: "/super-admin/dashboard",
};

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
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
    }
    if (!pw) {
      setPwError("Password is required.");
      valid = false;
    }
    return valid;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!validate()) return;

    setLoading(true);
    try {
      // Step 1: Firebase auth
      await signInWithEmailAndPassword(auth, email.trim(), pw);

      // Step 2: Get profile from backend
      const me = await apiRequest<SessionUser>("/me");

      // Step 3: Check account status before allowing access
      if (me.status === "pending_approval") {
        await auth.signOut();
        setFormError("Your account is pending admin approval. You will receive an email once approved.");
        return;
      }
      if (me.status === "suspended") {
        await auth.signOut();
        setFormError("Your account has been suspended. Please contact support.");
        return;
      }
      if (me.status === "rejected") {
        await auth.signOut();
        setFormError("Your registration was not approved. Please contact support.");
        return;
      }

      // Step 4: Store and redirect
      dispatch(setUser(me));
      dispatch(
        pushToast({
          tone: "success",
          title: `Welcome back, ${me.firstName}`,
          message: "Loading your dashboard…",
        }),
      );
      router.push(DASHBOARD_BY_ROLE[me.role]);
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
            setPwError("Incorrect password. Please try again.");
            break;
          case "auth/user-not-found":
          case "auth/invalid-email":
            setEmailError("No account found with this email.");
            break;
          case "auth/user-disabled":
            setFormError("Your account has been suspended. Please contact support.");
            break;
          case "auth/too-many-requests":
            setFormError("Too many failed attempts. Please wait a moment and try again.");
            break;
          case "auth/network-request-failed":
            setFormError("Could not reach Firebase. Check your connection and try again.");
            break;
          default:
            setFormError(err.message || "Sign in failed. Please try again.");
        }
      } else if (err instanceof ApiRequestError) {
        if (err.status === 403) {
          setFormError("Your account is not approved yet. Please wait for admin approval.");
        } else if (err.status === 401) {
          setFormError("Authentication failed. Please try again.");
        } else {
          setFormError(err.message || "Could not load your profile.");
        }
        await auth.signOut();
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3>Sign in to your account</h3>
      <p className="sub">Enter your credentials to continue.</p>

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
          type={showPw ? "text" : "password"}
          placeholder="••••••••"
          value={pw}
          error={pwError}
          onChange={(e) => { setPw(e.target.value); if (pwError) setPwError(""); }}
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
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "inherit",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              fontSize: 13,
            }}
          >
            Forgot password?
          </button>
        </div>
        <div style={{ marginTop: 22 }}>
          <Button full size="lg" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
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

      <ForgotPasswordModal
        open={forgotOpen}
        initialEmail={email}
        onClose={() => setForgotOpen(false)}
      />
    </>
  );
}
