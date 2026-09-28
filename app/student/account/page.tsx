import { requireRole } from "@/lib/guard";
import { AccountPageBody } from "@/components/AccountPageBody";

export default async function StudentAccountPage() {
  await requireRole("STUDENT");
  return <AccountPageBody />;
}
