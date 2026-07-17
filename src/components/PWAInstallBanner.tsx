"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

type Platform = "android" | "ios" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Already installed as standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    // Already dismissed in this session
    if (sessionStorage.getItem("pwa_banner_dismissed")) return;

    const plt = detectPlatform();
    setPlatform(plt);

    if (plt === "android") {
      // Android — listen for browser's install prompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowBanner(true);
      };
      window.addEventListener("beforeinstallprompt", handler as EventListener);
      return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
    } else if (plt === "ios") {
      // iOS Safari — show manual instructions
      setShowBanner(true);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("pwa_banner_dismissed", "1");
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div
      className="fixed bottom-[65px] left-3 right-3 z-40 animate-in slide-in-from-bottom duration-300 lg:hidden"
      style={{ animation: "slideUp 0.3s ease-out" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#128C7E] to-[#25D366] px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Sachann Manager App</p>
            <p className="text-white/80 text-xs">Add to your home screen for faster access!</p>
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="px-4 py-3">
          {platform === "android" ? (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-700 leading-snug">
                  Install this app to your <strong>Home Screen</strong> — just like any other app!
                </p>
              </div>
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 bg-[#128C7E] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0f7167] transition-colors flex-shrink-0 active:scale-95"
              >
                <Download className="w-4 h-4" />
                Install
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>To add on iOS:</strong>
              </p>
              <ol className="mt-2 space-y-1 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#128C7E]/10 text-[#128C7E] flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  Tap the <strong>Share</strong> button (□↑) at the bottom of Safari
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#128C7E]/10 text-[#128C7E] flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  Tap <strong>"Add to Home Screen"</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#128C7E]/10 text-[#128C7E] flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  Tap <strong>"Add"</strong> — done! ✅
                </li>
              </ol>
              <button
                onClick={handleDismiss}
                className="mt-3 w-full py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Got it, thanks
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
