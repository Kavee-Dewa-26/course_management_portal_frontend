"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Tiny router page hit by the "Bible School" link in every role's sidebar.
 *
 * - User has `student` → /dashboard (existing integrated student section)
 * - User has a pending student-role request → /apply/student/pending
 * - Otherwise → /apply/student
 *
 * The Member home (/home) shows the same routing logic on the Bible School
 * tile; this page just makes the sidebar link work in one click instead of two.
 */
export default function SchoolRouterPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.session.user);

  useEffect(() => {
    if (!user) return;
    const hasStudent = user.roles?.includes("student");
    if (hasStudent) {
      router.replace("/dashboard");
    } else {
      router.replace("/apply/student");
    }
  }, [user, router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
      <Spinner size={40} />
    </div>
  );
}
