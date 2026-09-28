import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground/70 hover:bg-background"
      >
        تسجيل الخروج
      </button>
    </form>
  );
}
