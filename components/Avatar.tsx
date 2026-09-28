"use client";

import { useState } from "react";

// Shows a user's profile picture, falling back to their first initial in a
// coloured circle when they have no avatar (or it fails to load).
export function Avatar({
  userId,
  name,
  size = 36,
  version,
}: {
  userId: string;
  name: string;
  size?: number;
  version?: string | number;
}) {
  const [failed, setFailed] = useState(false);
  const initial = name?.trim()?.[0] ?? "؟";
  const src = `/api/avatar/${userId}${version != null ? `?v=${version}` : ""}`;

  if (failed) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-brand/15 font-bold text-brand"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {initial}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
