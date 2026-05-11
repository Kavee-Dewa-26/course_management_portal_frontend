import { AdminProfileForm } from "@/components/admin/AdminProfileForm";
import { ADMIN } from "@/lib/mock/users";

export default function AdminProfilePage() {
  return <AdminProfileForm user={ADMIN} role="Administrator" />;
}
