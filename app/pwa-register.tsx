"use client";

import { useEffect } from "react";

const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "";

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    const basePath = assetPrefix || "";
    const serviceWorkerUrl = `${basePath}/sw.js`;
    const scope = `${basePath}/`;

    navigator.serviceWorker.register(serviceWorkerUrl, { scope }).catch((error: unknown) => {
      console.warn("Không thể đăng ký chế độ PWA:", error);
    });
  }, []);

  return null;
}
