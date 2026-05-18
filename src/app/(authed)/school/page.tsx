"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Tiny router page hit by the "Bible School" link in every role's sidebar.
 *
 * - User has `student` → /browse-courses (the catalogue — what "Bible School"
 *   means conceptually, matching tccr-screens-member.jsx and the prototype's
 *   STUDENT_NAV_V2 "school" → Browse Courses mapping)
 * - Otherwise → /apply/student (request Student access first)
 */
export default function SchoolRouterPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.session.user);

  useEffect(() => {
    if (!user) return;
    const hasStudent = user.roles?.includes("student");
    if (hasStudent) {
      router.replace("/browse-courses");
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
