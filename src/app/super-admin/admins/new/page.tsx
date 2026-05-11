"use client";

import { useRouter } from "next/navigation";
import { InviteAdminForm } from "@/components/admin/InviteAdminForm";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";

export default function NewAdminPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Invite admin</h1>
          <div className="greeting">Send an invite with role-scoped permissions.</div>
        </div>
      </div>
      <InviteAdminForm
        onCancel={() => router.push("/super-admin/admins")}
        onSubmit={({ name, email }) => {
          dispatch(
            pushToast({
              tone: "success",
              title: "Invite emailed",
              message: `A sign-in link has been sent to ${email}. ${name} can sign in once they accept.`,
            }),
          );
          setTimeout(() => router.push("/super-admin/admins"), 600);
        }}
      />
    </div>
  );
}
