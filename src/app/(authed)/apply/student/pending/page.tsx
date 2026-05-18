"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { Button } from "@/components/ui/Button";
import { WaitingForApproval } from "@/components/member/WaitingForApproval";

export default function ApplyStudentPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppSelector((s) => s.session.user);
  const requestId = searchParams?.get("req") ?? null;

  const firstName = user?.firstName ?? "there";
  const email = user?.email ?? "";

  return (
    <div className="page">
      <WaitingForApproval
        title="Waiting for approval"
        blurb={
          <>
            Thanks, {firstName}. An administrator is reviewing your request to become a{" "}
            <b>Student</b>. We&apos;ll email <b>{email}</b> as soon as you&apos;re approved —
            usually within <b>24 hours</b>.
          </>
        }
        steps={[
          { state: "done", name: "Application submitted", meta: "Just now" },
          { state: "active", name: "In review by admin", meta: "We're verifying your details" },
          { state: "pending", name: "Approved", meta: "You'll be able to apply to a course intake" },
        ]}
        actions={
          <>
            <Button variant="secondary-light" icon="arrow-left" onClick={() => router.push("/home")}>
              Back to home
            </Button>
            <Link href="/my-cells" className="btn btn--ghost">
              View cell groups
            </Link>
            {requestId && (
              <Link href={`/my-requests#${requestId}`} className="btn btn--ghost">
                See request status
              </Link>
            )}
          </>
        }
      />
    </div>
  );
}
