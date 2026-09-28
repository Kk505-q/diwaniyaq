import { Logo } from "@/components/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-navy to-brand px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={64} showName={false} />
          <div>
            <h1 className="text-xl font-bold text-brand-navy">{title}</h1>
            <p className="mt-1 text-sm text-foreground/60">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
