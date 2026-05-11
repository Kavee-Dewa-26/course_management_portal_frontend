"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Logo } from "@/components/ui/Logo";
import { avatarUrl } from "@/lib/kit";

interface Props {
  children: React.ReactNode;
}

export function AuthSplit({ children }: Props) {
  return (
    <div className="auth auth--form-left">
      <div className="auth-right">
        <div className="auth-card">{children}</div>
      </div>
      <div className="auth-left">
        <div style={{ position: "relative" }}>
          <Link href="/">
            <Logo variant="reversed" height={32} />
          </Link>
        </div>
        <div style={{ position: "relative" }}>
          <Eyebrow dark>Welcome to EduPath</Eyebrow>
          <h2 style={{ marginTop: 18 }}>
            Pick up where you <span className="accent">left off</span>.
          </h2>
          <p>
            Sign in to continue your course plan, see your progress and pick the next subject.
          </p>
        </div>
        <div className="quote" style={{ position: "relative" }}>
          <p className="text">
            &ldquo;Coming back to studying after years felt impossible, until EduPath structured
            it for me.&rdquo;
          </p>
          <div className="who">
            <Avatar src={avatarUrl(32)} size="sm" name="Priya M." /> Priya M., learner
          </div>
        </div>
      </div>
    </div>
  );
}
