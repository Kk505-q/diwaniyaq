import Image from "next/image";

export function LogoBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 h-[min(80vw,620px)] w-[min(80vw,620px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]">
        <Image src="/logo-mark.jpg" alt="" fill sizes="80vw" className="object-contain" />
      </div>
    </div>
  );
}
