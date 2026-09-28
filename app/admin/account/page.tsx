import { requireRole } from "@/lib/guard";
import { AccountPageBody } from "@/components/AccountPageBody";

export default async function AdminAccountPage() {
  await requireRole("ADMIN");
  return <AccountPageBody />;
}
