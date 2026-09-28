import { requireRole } from "@/lib/guard";
import { AccountPageBody } from "@/components/AccountPageBody";

export default async function SupervisorAccountPage() {
  await requireRole("SUPERVISOR");
  return <AccountPageBody />;
}
