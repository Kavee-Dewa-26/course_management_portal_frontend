import { AdminProfileForm } from "@/components/admin/AdminProfileForm";
import { SUPERADMIN } from "@/lib/mock/users";

export default function SuperAdminProfilePage() {
  return <AdminProfileForm user={SUPERADMIN} role="Super Admin" />;
}
