"use client";

import { useEffect } from "react";

// Previously this registered a caching service worker, which caused redirect
// loops on some devices. We now unregister any existing service worker and
// clear its caches on every page load, so the site always runs straight from
// the network.
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => keys.forEach((k) => caches.delete(k)))
        .catch(() => {});
    }
  }, []);
  return null;
}
