import { requireRole } from "@/lib/guard";
import { AccountPageBody } from "@/components/AccountPageBody";

export default async function ParentAccountPage() {
  await requireRole("PARENT");
  return <AccountPageBody />;
}
