"use client";

import { useEffect, useState } from "react";
import { saveSubscription, removeSubscription } from "@/actions/push";
import { getUnreadCount } from "@/actions/notification";
import { Bell, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

// Helper to convert base64 VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const pathname = usePathname();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showPrompt, setShowPrompt] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Sync permissions and app badging count
  const syncBadgeCount = async () => {
    if (typeof navigator !== "undefined" && "setAppBadge" in navigator) {
      try {
        const count = await getUnreadCount();
        if (count > 0) {
          await navigator.setAppBadge(count);
        } else {
          await navigator.clearAppBadge();
        }
      } catch (err) {
        // Badging API not fully supported or fails gracefully
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Set permission state
    if ("Notification" in window) {
      setPermission(Notification.permission);
      // Show prompt if permission is default (not asked yet)
      if (Notification.permission === "default") {
        const hasDismissed = localStorage.getItem("push_prompt_dismissed");
        if (!hasDismissed) {
          setShowPrompt(true);
        }
      }
    }

    // Initial badge count sync
    syncBadgeCount();

    // Listen for PUSH_RECEIVED broadcasts from sw.js
    if ("serviceWorker" in navigator) {
      const handleServiceWorkerMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "PUSH_RECEIVED") {
          syncBadgeCount();
        }
      };
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      };
    }
  }, [pathname]);

  const handleSubscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications are not supported on this device/browser.");
      return;
    }

    setSubscribing(true);
    try {
      // 1. Request permission
      const userPermission = await Notification.requestPermission();
      setPermission(userPermission);

      if (userPermission !== "granted") {
        toast.error("Notification permission denied.");
        setShowPrompt(false);
        return;
      }

      // 2. Register push service
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        console.error("VAPID public key is missing.");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // 3. Save subscription to DB
      const result = await saveSubscription(JSON.parse(JSON.stringify(subscription)));
      if (result.error) {
        if (result.error !== "Not authenticated") {
          toast.error(result.error);
        }
      } else {
        toast.success("Real-time Push Notifications enabled!");
        setShowPrompt(false);
        syncBadgeCount();
      }
    } catch (err) {
      console.error("Subscription failed:", err);
      toast.error("Failed to enable push notifications.");
    } finally {
      setSubscribing(false);
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem("push_prompt_dismissed", "true");
    setShowPrompt(false);
  };

  // If user has not logged in or prompt is dismissed, render nothing
  if (!showPrompt || permission === "granted" || permission === "denied") {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-sm z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-border/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(18,140,126,0.12)] animate-in slide-in-from-bottom-6 fade-in duration-300">
      <div className="flex items-start gap-4">
        {/* Pulsating Bell Icon */}
        <div className="relative flex items-center justify-center p-3 rounded-2xl bg-brand-green/10 text-brand-green mt-0.5 shadow-inner">
          <Bell className="w-5 h-5 animate-pulse" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        {/* Content details */}
        <div className="flex-1 space-y-1.5 min-w-0">
          <h4 className="font-bold text-sm sm:text-base text-foreground tracking-tight">
            Enable Real-time Updates
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Get instant push notifications on your device when new tasks are assigned or updated.
          </p>
          <div className="flex items-center gap-2 pt-2.5">
            <Button
              size="sm"
              disabled={subscribing}
              onClick={handleSubscribe}
              className="h-9 text-xs bg-gradient-to-r from-brand-green to-emerald-600 hover:from-brand-green-light hover:to-emerald-500 text-white font-semibold rounded-xl px-4 shadow-sm shadow-brand-green/10 transition-all duration-200"
            >
              {subscribing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Enabling...
                </>
              ) : (
                "Enable"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={dismissPrompt}
              className="h-9 text-xs rounded-xl px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
            >
              Later
            </Button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={dismissPrompt}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted/40 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
