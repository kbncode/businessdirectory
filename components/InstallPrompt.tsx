"use client";

import { useEffect, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "kbn-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  // Default to hidden until client-side checks run, so there's no flash of
  // a banner the server can't know whether to show.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const standaloneDisplay = window.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standaloneDisplay || iosStandalone);

    const ua = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    try {
      setDismissed(window.localStorage.getItem(DISMISSED_KEY) === "1");
    } catch {
      setDismissed(false);
    }

    function handleBeforeInstallPrompt(event: Event) {
      // Chrome/Edge fire this automatically; we stop it from showing its own
      // mini-infobar and hold onto it until the user clicks our button.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // localStorage can throw in private-browsing modes — dismissal just
      // won't persist across visits, which is a harmless fallback.
    }
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    // prompt() must be called from a direct user-gesture handler (this
    // onClick) — browsers reject it otherwise, so we never call it eagerly.
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (isStandalone || dismissed) return null;

  if (isIOS) {
    return (
      <div className="flex items-center justify-center gap-3 border-b border-sand bg-sand/60 px-4 py-2 text-center text-sm text-ink">
        <span>
          To install: tap <strong>Share</strong>, then &quot;Add to Home Screen&quot;.
        </span>
        <button type="button" onClick={handleDismiss} className="shrink-0 text-xs underline">
          Dismiss
        </button>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 border-b border-sand bg-sand/60 px-4 py-2 text-sm text-ink">
      <span>Install KBN Business Directory for quick access, even offline.</span>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={handleInstall} className={buttonClasses("primary")}>
          Install app
        </button>
        <button type="button" onClick={handleDismiss} className="text-xs underline">
          Not now
        </button>
      </div>
    </div>
  );
}
