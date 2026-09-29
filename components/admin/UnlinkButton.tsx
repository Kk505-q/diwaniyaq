"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlinkParentChildAction } from "@/lib/actions/admin";

export function UnlinkButton({ linkId }: { linkId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function unlink() {
    startTransition(async () => {
      await unlinkParentChildAction(linkId);
      router.refresh();
    });
  }

  return (
    <button onClick={unlink} disabled={pending} className="text-xs text-danger hover:underline disabled:opacity-50">
      إلغاء الربط
    </button>
  );
}
