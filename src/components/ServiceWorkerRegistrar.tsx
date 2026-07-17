"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Register the SW
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Check for updates every time the page gets focus
        const checkUpdate = () => registration.update();
        window.addEventListener("focus", checkUpdate);

        // Listen for new SW waiting to activate
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version available — tell it to skip waiting and activate
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        // When SW controller changes (new SW took over), reload the page
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });

        return () => window.removeEventListener("focus", checkUpdate);
      })
      .catch(() => {
        // SW registration failed silently — app still works
      });
  }, []);

  return null;
}
