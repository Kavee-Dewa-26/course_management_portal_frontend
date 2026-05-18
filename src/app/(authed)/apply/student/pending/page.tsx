"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/**
 * Pending-application screen for the "Apply to become a Student" flow.
 *
 * Uses the V1 .pending-orbit + .pending-steps treatment (defined in
 * globals.css), so the spinner style matches the rest of the auth flow
 * the user is already familiar with.
 */
export default function ApplyStudentPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppSelector((s) => s.session.user);
  const requestId = searchParams?.get("req") ?? null;

  const firstName = user?.firstName ?? "there";
  const email = user?.email ?? "";

  return (
    <div className="page" style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          background: "#fff",
          border: "1px solid var(--color-stroke)",
          borderRadius: 18,
          padding: "40px 32px 32px",
          textAlign: "center",
        }}
      >
        <div className="pending-orbit" aria-hidden="true">
          <span className="ring" />
          <span className="ring r2" />
          <span className="ring r3" />
          <div className="orbit-center">
            <Icon name="clock" size={28} />
          </div>
        </div>

        <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-heading)", fontSize: 24, color: "var(--color-primary)" }}>
          Waiting for approval
        </h3>
        <p
          className="sub"
          style={{ margin: "0 auto", maxWidth: 440, fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.55, color: "var(--color-body-green)" }}
        >
          Thanks{firstName !== "there" ? `, ${firstName}` : ""}. An administrator is reviewing your
          Student application. We&apos;ll email <b>{email}</b> the moment it&apos;s approved —
          usually within <b>24 hours</b>.
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
              <span>We&apos;re checking your details</span>
            </div>
          </li>
          <li>
            <span className="step-ico">
              <Icon name="user-check" size={14} />
            </span>
            <div>
              <b>Approved</b>
              <span>You&apos;ll be able to apply to a course intake</span>
            </div>
          </li>
        </ol>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          <Button full size="lg" icon="home" onClick={() => router.push("/home")}>
            Back to Member dashboard
          </Button>
          <Link href="/my-requests" className="btn btn--secondary btn--full">
            <Icon name="file-text" size={16} /> Track this request
          </Link>
          <Link href="/my-cells" className="btn btn--ghost btn--full">
            <Icon name="users" size={16} /> Browse my cell groups
          </Link>
          {requestId && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-muted)", marginTop: 6 }}>
              Request ID: <code>{requestId}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
