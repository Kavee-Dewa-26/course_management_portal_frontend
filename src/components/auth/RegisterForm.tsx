"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";

export function RegisterForm() {
  const dispatch = useAppDispatch();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pending, setPending] = useState<{ name: string; email: string } | null>(null);

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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit("password");
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
          as you&apos;re approved — usually within <b>24 hours</b>.
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
      <h3>Create your account</h3>
      <p className="sub">It only takes a minute. No credit card required.</p>
      <button type="button" className="btn--google" onClick={() => submit("google")}>
        <GoogleIcon /> Continue with Google
      </button>
      <div className="auth-divider">or</div>

      <form onSubmit={onSubmit}>
        <div className="form-grid two" style={{ marginBottom: 0 }}>
          <Input
            label="First name"
            placeholder="Priya"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            label="Last name"
            placeholder="Mendis"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
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
          placeholder="At least 10 characters"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          hint="Mix uppercase, lowercase, numbers and symbols."
        />
        <div style={{ marginTop: 22 }}>
          <Button full size="lg" type="submit">
            Create Account
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
