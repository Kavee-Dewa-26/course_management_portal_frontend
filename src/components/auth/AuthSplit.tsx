"use client";

import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

interface Props {
  children: React.ReactNode;
  variant?: "login" | "register";
}

const REGISTER_STEPS = [
  { ico: "edit-3",     title: "Fill in your details",         body: "Name, email and a secure password — takes under a minute." },
  { ico: "clock",      title: "Admin reviews your request",   body: "Your application is checked and approved within 24 hours." },
  { ico: "play-circle",title: "Start learning immediately",   body: "Access structured courses, labs and progress tracking." },
];

const REGISTER_FEATURES = [
  { ico: "layers",     label: "Structured course plans" },
  { ico: "trending-up",label: "Real-time progress tracking" },
  { ico: "terminal",   label: "Browser-based hands-on labs" },
];

export function AuthSplit({ children, variant = "login" }: Props) {
  return (
    <div className="auth auth--form-left">
      <div className="auth-right">
        <div className="auth-card">{children}</div>
      </div>

      <div className="auth-left">
        {/* Logo */}
        <div style={{ position: "relative" }}>
          <Link href="/">
            <Logo variant="reversed" height={32} />
          </Link>
        </div>

        {variant === "login" ? (
          <>
            <div style={{ position: "relative" }}>
              <Eyebrow dark>Welcome to EduPath</Eyebrow>
              <h2 style={{ marginTop: 18 }}>
                Pick up where you <span className="accent">left off</span>.
              </h2>
              <p>
                Sign in to continue your course plan, see your progress and pick the next subject.
              </p>
            </div>

            {/* Quick highlights for returning learners */}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { ico: "play-circle",  label: "Resume where you left off" },
                { ico: "trending-up",  label: "See your weekly progress at a glance" },
                { ico: "bell",         label: "Stay on top of approvals and updates" },
              ].map((f) => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "rgba(188,233,85,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#BCE955", flexShrink: 0,
                  }}>
                    <Icon name={f.ico} size={16} />
                  </span>
                  <span style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.85)",
                    fontWeight: 500,
                  }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ position: "relative" }}>
              <Eyebrow dark>Join EduPath</Eyebrow>
              <h2 style={{ marginTop: 18 }}>
                Your <span className="accent">learning journey</span> starts here.
              </h2>
              <p>
                Get access to structured programmes in software engineering, machine learning
                and data analytics — built for working professionals.
              </p>
            </div>

            {/* What you get */}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 12 }}>
              {REGISTER_FEATURES.map((f) => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "rgba(188,233,85,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#BCE955", flexShrink: 0,
                  }}>
                    <Icon name={f.ico} size={16} />
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div style={{ position: "relative" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                How it works
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {REGISTER_STEPS.map((s, i) => (
                  <div key={s.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "rgba(188,233,85,0.15)",
                      border: "1.5px solid rgba(188,233,85,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12,
                      color: "#BCE955", flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <div>
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "#fff" }}>
                        {s.title}
                      </div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                        {s.body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
