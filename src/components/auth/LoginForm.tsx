"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { auth } from "@/infrastructure/firebase/auth";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import {
  setUser,
  isRole,
  DASHBOARD_BY_ROLE,
  type SessionUser,
  type Role,
} from "@/application/slices/sessionSlice";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { FederatedSignInButtons } from "./FederatedSignInButtons";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { DevLoginPanel } from "./DevLoginPanel";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const t = useTranslations("auth.login");

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [pwError, setPwError] = useState("");
  const [formError, setFormError] = useState("");

  // Read ?reason=... set by FirebaseAuthListener when a session is forcibly ended.
  useEffect(() => {
    const reason = searchParams?.get("reason");
    if (!reason) return;
    if (reason === "suspended") setFormError(t("accountSuspended"));
    else if (reason === "pending") setFormError(t("pendingApproval"));
    else if (reason === "rejected") setFormError(t("notApproved"));
  }, [searchParams, t]);

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
      await signInWithEmailAndPassword(auth, email.trim(), pw);

      const me = await apiRequest<SessionUser>("/me");

      if (me.status === "pending_approval") {
        await auth.signOut();
        setFormError(t("pendingApproval"));
        return;
      }
      if (me.status === "suspended") {
        await auth.signOut();
        setFormError(t("accountSuspended"));
        return;
      }
      if (me.status === "rejected") {
        await auth.signOut();
        setFormError(t("notApproved"));
        return;
      }

      dispatch(setUser(me));
      dispatch(
        pushToast({
          tone: "success",
          title: `Welcome back, ${me.firstName}`,
          message: "Loading your dashboard…",
        }),
      );

      let savedRole: Role | null = null;
      try {
        const v = typeof window !== "undefined"
          ? localStorage.getItem(`edupath.activeRole.${me.uid}`)
          : null;
        if (isRole(v) && me.roles?.includes(v)) savedRole = v;
      } catch { /* ignore */ }
      const target: Role = savedRole
        ?? (me.roles?.includes("super_admin") ? "super_admin"
          : me.roles?.includes("admin")       ? "admin"
          : me.roles?.includes("g12")         ? "g12"
          : me.roles?.includes("leader")      ? "leader"
          : me.roles?.includes("student")     ? "student"
          :                                      "member");
      router.push(DASHBOARD_BY_ROLE[target]);
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
          case "auth/user-not-found":
          case "auth/invalid-email":
            setFormError(t("invalidCredentials"));
            break;
          case "auth/user-disabled":
            setFormError(t("accountSuspended"));
            break;
          case "auth/too-many-requests":
            setFormError(t("tooManyAttempts"));
            break;
          case "auth/network-request-failed":
            setFormError(t("networkError"));
            break;
          default:
            setFormError(t("signInFailed"));
        }
      } else if (err instanceof ApiRequestError) {
        if (err.status === 403) {
          setFormError(t("notApproved"));
        } else if (err.status === 401) {
          setFormError(t("authFailed"));
        } else {
          setFormError(err.message || t("signInFailed"));
        }
        await auth.signOut();
      } else {
        setFormError(t("signInFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div>
          <h3 style={{ margin: 0 }}>{t("title")}</h3>
          <p className="sub" style={{ margin: "4px 0 0" }}>{t("subtitle")}</p>
        </div>
        <LanguageSwitcher />
      </div>

      <FederatedSignInButtons context="signin" disabled={loading} />

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
          label={t("email")}
          type="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          error={emailError}
          onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
        />
        <Input
          label={t("password")}
          type={showPw ? "text" : "password"}
          placeholder={t("passwordPlaceholder")}
          value={pw}
          error={pwError}
          onChange={(e) => { setPw(e.target.value); if (pwError) setPwError(""); }}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-body-green)", display: "flex" }}
              aria-label={showPw ? t("hidePassword") : t("showPassword")}
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
            <input type="checkbox" defaultChecked /> {t("rememberMe")}
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
            {t("forgotPassword")}
          </button>
        </div>
        <div style={{ marginTop: 22 }}>
          <Button full size="lg" type="submit" disabled={loading}>
            {loading ? t("signingIn") : t("signIn")}
          </Button>
        </div>
      </form>
      <div className="alt">
        {t("noAccount")} <Link href="/register">{t("register")}</Link>
        <div style={{ marginTop: 14 }}>
          <Link href="/" style={{ color: "inherit" }}>
            {t("backHome")}
          </Link>
        </div>
      </div>

      <DevLoginPanel />

      <ForgotPasswordModal
        open={forgotOpen}
        initialEmail={email}
        onClose={() => setForgotOpen(false)}
      />
    </>
  );
}
