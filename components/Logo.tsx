import Image from "next/image";

export function Logo({ size = 44, showName = true }: { size?: number; showName?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo-mark.jpg"
          alt="شعار ديوانية ق"
          fill
          sizes={`${size}px`}
          className="scale-110 object-cover"
          priority
        />
      </div>
      {showName && (
        <div className="leading-tight">
          <div className="text-lg font-bold text-brand-navy">ديوانية ق</div>
          <div className="text-xs text-foreground/50">قيادة & قدوة</div>
        </div>
      )}
    </div>
  );
}
