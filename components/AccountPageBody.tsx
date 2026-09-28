import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings, canEditAlias, canEditName } from "@/lib/settings";
import { AccountView } from "@/components/account/AccountView";

export async function AccountPageBody() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [settings, avatar] = await Promise.all([
    getSettings(),
    prisma.avatar.findUnique({ where: { userId: user.id }, select: { userId: true } }),
  ]);

  return (
    <AccountView
      user={{
        id: user.id,
        name: user.name,
        alias: user.alias,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
      }}
      canEditName={canEditName(settings, user)}
      canEditAlias={canEditAlias(settings, user)}
      hasAvatar={avatar !== null}
    />
  );
}
